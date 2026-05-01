import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { db } from '../db';
import { getUserId } from '../utils/auth';
import { ok, noContent, badRequest, serverError } from '../utils/response';

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = 'AM' | 'PM';

interface LogDoc {
  // id is computed: `${date}_${routineItemId}_${period}` — stable and idempotent
  id: string;
  userId: string;
  date: string;
  routineItemId: string;
  period: Period;
  completed: boolean;
  skipped: boolean;
}

type LogBody = Omit<LogDoc, 'id' | 'userId'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const container = db.container('logs');

function logId(date: string, routineItemId: string, period: string): string {
  return `${date}_${routineItemId}_${period}`;
}

function strip(doc: LogDoc): Omit<LogDoc, 'userId'> {
  const { userId: _u, ...rest } = doc;
  return rest;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

// GET /api/logs
// Optional query params: ?date=YYYY-MM-DD  |  ?from=YYYY-MM-DD&to=YYYY-MM-DD
app.http('listLogs', {
  methods: ['GET'],
  route: 'logs',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const date = req.query.get('date');
      const from = req.query.get('from');
      const to = req.query.get('to');

      let query: string;
      const parameters: { name: string; value: string }[] = [];

      if (date) {
        query = 'SELECT * FROM c WHERE c.date = @date';
        parameters.push({ name: '@date', value: date });
      } else if (from && to) {
        query = 'SELECT * FROM c WHERE c.date >= @from AND c.date <= @to';
        parameters.push({ name: '@from', value: from }, { name: '@to', value: to });
      } else {
        query = 'SELECT * FROM c ORDER BY c.date DESC';
      }

      const { resources } = await container.items
        .query({ query, parameters }, { partitionKey: userId })
        .fetchAll();

      return ok(resources.map(strip));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// POST /api/logs
// Upserts a log entry — covers both ADD_LOG and SKIP_TODAY actions.
app.http('upsertLog', {
  methods: ['POST'],
  route: 'logs',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const body = await req.json() as Partial<LogBody>;

      if (!body.date) return badRequest('date is required');
      if (!body.routineItemId) return badRequest('routineItemId is required');
      if (!body.period || !['AM', 'PM'].includes(body.period)) return badRequest('period must be AM or PM');
      if (body.completed === undefined && body.skipped === undefined) {
        return badRequest('completed or skipped is required');
      }

      const doc: LogDoc = {
        id: logId(body.date, body.routineItemId, body.period),
        userId,
        date: body.date,
        routineItemId: body.routineItemId,
        period: body.period,
        completed: body.completed ?? false,
        skipped: body.skipped ?? false,
      };

      // Upsert so ADD_LOG and SKIP_TODAY are both idempotent
      const { resource } = await container.items.upsert<LogDoc>(doc);
      return ok(strip(resource!));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// DELETE /api/logs/{date}/{routineItemId}/{period}
// Covers both REMOVE_LOG and UNSKIP_TODAY actions.
app.http('deleteLog', {
  methods: ['DELETE'],
  route: 'logs/{date}/{routineItemId}/{period}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const { date, routineItemId, period } = req.params;
      const id = logId(date, routineItemId, period);

      // Silently succeed if already gone (idempotent delete)
      try {
        await container.item(id, userId).delete();
      } catch (inner: unknown) {
        const err = inner as { code?: number };
        if (err.code !== 404) throw inner;
      }

      return noContent();
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// DELETE /api/logs
// Clears all logs for the user — maps to CLEAR_LOGS.
app.http('clearLogs', {
  methods: ['DELETE'],
  route: 'logs',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const { resources } = await container.items
        .query({ query: 'SELECT c.id FROM c' }, { partitionKey: userId })
        .fetchAll();

      // Cosmos has no bulk delete; batch individual deletes
      await Promise.all(
        resources.map((r: { id: string }) => container.item(r.id, userId).delete())
      );

      return noContent();
    } catch (e) {
      return serverError(String(e));
    }
  },
});
