import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { getUserId } from '../utils/auth';
import { ok, created, noContent, badRequest, notFound, serverError } from '../utils/response';

// ── Types ─────────────────────────────────────────────────────────────────────

type ProductStatus = 'active' | 'unopened' | 'finished';

interface ProductDoc {
  id: string;
  userId: string;  // Cosmos partition key — never sent to the client
  name: string;
  brand: string;
  type: string;
  status: ProductStatus;
  openedDate: string | null;
  pao: number;
  actives: string[];
  notes: string;
}

type ProductBody = Omit<ProductDoc, 'userId'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const container = db.container('products');

function strip(doc: ProductDoc): ProductBody {
  const { userId: _u, ...rest } = doc;
  return rest;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

// GET /api/products
app.http('listProducts', {
  methods: ['GET'],
  route: 'products',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const { resources } = await container.items
        .query({ query: 'SELECT * FROM c' }, { partitionKey: userId })
        .fetchAll();
      return ok(resources.map(strip));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// GET /api/products/{id}
app.http('getProduct', {
  methods: ['GET'],
  route: 'products/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;
      const { resource } = await container.item(id, userId).read<ProductDoc>();
      if (!resource) return notFound();
      return ok(strip(resource));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// POST /api/products
app.http('createProduct', {
  methods: ['POST'],
  route: 'products',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const body = await req.json() as Partial<ProductBody>;

      if (!body.name?.trim()) return badRequest('name is required');
      if (!body.brand?.trim()) return badRequest('brand is required');
      if (!body.type?.trim()) return badRequest('type is required');

      const doc: ProductDoc = {
        id: body.id ?? randomUUID(),
        userId,
        name: body.name.trim(),
        brand: body.brand.trim(),
        type: body.type.trim(),
        status: body.status ?? 'unopened',
        openedDate: body.openedDate ?? null,
        pao: body.pao ?? 12,
        actives: body.actives ?? [],
        notes: body.notes ?? '',
      };

      const { resource } = await container.items.create<ProductDoc>(doc);
      return created(strip(resource!));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// PUT /api/products/{id}
app.http('updateProduct', {
  methods: ['PUT'],
  route: 'products/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;
      const body = await req.json() as Partial<ProductBody>;

      const { resource: existing } = await container.item(id, userId).read<ProductDoc>();
      if (!existing) return notFound();

      const updated: ProductDoc = { ...existing, ...body, id, userId };
      const { resource } = await container.items.upsert<ProductDoc>(updated);
      return ok(strip(resource!));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// DELETE /api/products/{id}
app.http('deleteProduct', {
  methods: ['DELETE'],
  route: 'products/{id}',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const id = req.params.id;

      const { resource } = await container.item(id, userId).read<ProductDoc>();
      if (!resource) return notFound();

      await container.item(id, userId).delete();
      return noContent();
    } catch (e) {
      return serverError(String(e));
    }
  },
});
