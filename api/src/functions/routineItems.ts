import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { getUserId } from '../utils/auth';
import { ok, created, noContent, badRequest, notFound, serverError } from '../utils/response';

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = 'AM' | 'PM';
type Frequency = 'daily' | 'alternate' | '2x-week' | '1x-week';

interface RoutineItemDoc {
  id: string;
  userId: string;
  productId: string;
  period: Period;
  frequency: Frequency;
  startDate: string;
  order: number;
}

type RoutineItemBody = Omit<RoutineItemDoc, 'userId'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const container = db.container('routineItems');

function strip(doc: RoutineItemDoc): RoutineItemBody {
  const { userId: _u, ...rest } = doc;
  return rest;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

// GET /api/routine-items
app.http('listRoutineItems', {
  methods: ['GET'],
  route: 'routine-items',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const { resources } = await container.items
        .query({ query: 'SELECT * FROM c ORDER BY c["order"] ASC' }, { partitionKey: userId })
        .fetchAll();
      return ok(resources.map(strip));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// GET /api/routine-items/{id}
app.http('getRoutineItem', {
  methods: ['GET'],
  route: 'routine-items/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const { resource } = await container.item(req.params.id, userId).read<RoutineItemDoc>();
      if (!resource) return notFound();
      return ok(strip(resource));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// POST /api/routine-items
app.http('createRoutineItem', {
  methods: ['POST'],
  route: 'routine-items',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const body = await req.json() as Partial<RoutineItemBody>;

      if (!body.productId) return badRequest('productId is required');
      if (!body.period || !['AM', 'PM'].includes(body.period)) return badRequest('period must be AM or PM');
      if (!body.frequency) return badRequest('frequency is required');

      const doc: RoutineItemDoc = {
        id: body.id ?? randomUUID(),
        userId,
        productId: body.productId,
        period: body.period,
        frequency: body.frequency,
        startDate: body.startDate ?? new Date().toISOString().split('T')[0],
        order: body.order ?? 0,
      };

      const { resource } = await container.items.create<RoutineItemDoc>(doc);
      return created(strip(resource!));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// PUT /api/routine-items/{id}
app.http('updateRoutineItem', {
  methods: ['PUT'],
  route: 'routine-items/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;
      const body = await req.json() as Partial<RoutineItemBody>;

      const { resource: existing } = await container.item(id, userId).read<RoutineItemDoc>();
      if (!existing) return notFound();

      const updated: RoutineItemDoc = { ...existing, ...body, id, userId };
      const { resource } = await container.items.upsert<RoutineItemDoc>(updated);
      return ok(strip(resource!));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// DELETE /api/routine-items/{id}
app.http('deleteRoutineItem', {
  methods: ['DELETE'],
  route: 'routine-items/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;

      const { resource } = await container.item(id, userId).read<RoutineItemDoc>();
      if (!resource) return notFound();

      await container.item(id, userId).delete();
      return noContent();
    } catch (e) {
      return serverError(String(e));
    }
  },
});
