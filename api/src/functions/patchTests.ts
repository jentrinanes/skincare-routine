import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { getUserId } from '../utils/auth';
import { ok, created, noContent, badRequest, notFound, serverError } from '../utils/response';

// ── Types ─────────────────────────────────────────────────────────────────────

type PatchTestStatus = 'active' | 'passed' | 'failed' | 'abandoned';

interface PatchTestDoc {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  brand: string;
  startDate: string;
  location: string;
  durationDays: number;
  status: PatchTestStatus;
  reactionNotes: string;
  notes: string;
}

type PatchTestBody = Omit<PatchTestDoc, 'userId'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const container = db.container('patchTests');

function strip(doc: PatchTestDoc): PatchTestBody {
  const { userId: _u, ...rest } = doc;
  return rest;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

// GET /api/patch-tests
app.http('listPatchTests', {
  methods: ['GET'],
  route: 'patch-tests',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const { resources } = await container.items
        .query({ query: 'SELECT * FROM c ORDER BY c.startDate DESC' }, { partitionKey: userId })
        .fetchAll();
      return ok(resources.map(strip));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// GET /api/patch-tests/{id}
app.http('getPatchTest', {
  methods: ['GET'],
  route: 'patch-tests/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const { resource } = await container.item(req.params.id, userId).read<PatchTestDoc>();
      if (!resource) return notFound();
      return ok(strip(resource));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// POST /api/patch-tests
app.http('createPatchTest', {
  methods: ['POST'],
  route: 'patch-tests',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const body = await req.json() as Partial<PatchTestBody>;

      if (!body.productId) return badRequest('productId is required');
      if (!body.productName?.trim()) return badRequest('productName is required');
      if (!body.startDate) return badRequest('startDate is required');

      const doc: PatchTestDoc = {
        id: body.id ?? randomUUID(),
        userId,
        productId: body.productId,
        productName: body.productName.trim(),
        brand: body.brand ?? '',
        startDate: body.startDate,
        location: body.location ?? '',
        durationDays: body.durationDays ?? 7,
        status: body.status ?? 'active',
        reactionNotes: body.reactionNotes ?? '',
        notes: body.notes ?? '',
      };

      const { resource } = await container.items.create<PatchTestDoc>(doc);
      return created(strip(resource!));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// PUT /api/patch-tests/{id}
app.http('updatePatchTest', {
  methods: ['PUT'],
  route: 'patch-tests/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;
      const body = await req.json() as Partial<PatchTestBody>;

      const { resource: existing } = await container.item(id, userId).read<PatchTestDoc>();
      if (!existing) return notFound();

      const updated: PatchTestDoc = { ...existing, ...body, id, userId };
      const { resource } = await container.items.upsert<PatchTestDoc>(updated);
      return ok(strip(resource!));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// DELETE /api/patch-tests/{id}
app.http('deletePatchTest', {
  methods: ['DELETE'],
  route: 'patch-tests/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;

      const { resource } = await container.item(id, userId).read<PatchTestDoc>();
      if (!resource) return notFound();

      await container.item(id, userId).delete();
      return noContent();
    } catch (e) {
      return serverError(String(e));
    }
  },
});
