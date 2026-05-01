import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { getUserId } from '../utils/auth';
import { ok, created, noContent, badRequest, notFound, serverError } from '../utils/response';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReactionDoc {
  id: string;
  userId: string;
  date: string;
  description: string;
  suspectedProducts: string[];
}

type ReactionBody = Omit<ReactionDoc, 'userId'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const container = db.container('reactions');

function strip(doc: ReactionDoc): ReactionBody {
  const { userId: _u, ...rest } = doc;
  return rest;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

// GET /api/reactions
app.http('listReactions', {
  methods: ['GET'],
  route: 'reactions',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const { resources } = await container.items
        .query({ query: 'SELECT * FROM c ORDER BY c.date DESC' }, { partitionKey: userId })
        .fetchAll();
      return ok(resources.map(strip));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// GET /api/reactions/{id}
app.http('getReaction', {
  methods: ['GET'],
  route: 'reactions/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const { resource } = await container.item(req.params.id, userId).read<ReactionDoc>();
      if (!resource) return notFound();
      return ok(strip(resource));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// POST /api/reactions
app.http('createReaction', {
  methods: ['POST'],
  route: 'reactions',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const body = await req.json() as Partial<ReactionBody>;

      if (!body.date) return badRequest('date is required');
      if (!body.description?.trim()) return badRequest('description is required');

      const doc: ReactionDoc = {
        id: body.id ?? randomUUID(),
        userId,
        date: body.date,
        description: body.description.trim(),
        suspectedProducts: body.suspectedProducts ?? [],
      };

      const { resource } = await container.items.create<ReactionDoc>(doc);
      return created(strip(resource!));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// PUT /api/reactions/{id}
app.http('updateReaction', {
  methods: ['PUT'],
  route: 'reactions/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;
      const body = await req.json() as Partial<ReactionBody>;

      const { resource: existing } = await container.item(id, userId).read<ReactionDoc>();
      if (!existing) return notFound();

      const updated: ReactionDoc = { ...existing, ...body, id, userId };
      const { resource } = await container.items.upsert<ReactionDoc>(updated);
      return ok(strip(resource!));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// DELETE /api/reactions/{id}
app.http('deleteReaction', {
  methods: ['DELETE'],
  route: 'reactions/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;

      const { resource } = await container.item(id, userId).read<ReactionDoc>();
      if (!resource) return notFound();

      await container.item(id, userId).delete();
      return noContent();
    } catch (e) {
      return serverError(String(e));
    }
  },
});
