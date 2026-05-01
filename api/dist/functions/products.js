"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const crypto_1 = require("crypto");
const db_1 = require("../db");
const response_1 = require("../utils/response");
// ── Auth stub ─────────────────────────────────────────────────────────────────
// TODO: when SWA auth is added, replace this body with:
//   const principal = req.headers.get('x-ms-client-principal');
//   const decoded = JSON.parse(Buffer.from(principal!, 'base64').toString('utf8'));
//   return decoded.userId as string;
function getUserId() {
    return process.env.DEFAULT_USER_ID ?? 'dev-user';
}
// ── Helpers ───────────────────────────────────────────────────────────────────
const container = db_1.db.container('products');
function strip(doc) {
    const { userId: _u, ...rest } = doc;
    return rest;
}
// ── Endpoints ─────────────────────────────────────────────────────────────────
// GET /api/products
functions_1.app.http('listProducts', {
    methods: ['GET'],
    route: 'products',
    handler: async (_req) => {
        try {
            const userId = getUserId();
            const { resources } = await container.items
                .query({ query: 'SELECT * FROM c' }, { partitionKey: userId })
                .fetchAll();
            return (0, response_1.ok)(resources.map(strip));
        }
        catch (e) {
            return (0, response_1.serverError)(String(e));
        }
    },
});
// GET /api/products/{id}
functions_1.app.http('getProduct', {
    methods: ['GET'],
    route: 'products/{id}',
    handler: async (req) => {
        try {
            const userId = getUserId();
            const id = req.params.id;
            const { resource } = await container.item(id, userId).read();
            if (!resource)
                return (0, response_1.notFound)();
            return (0, response_1.ok)(strip(resource));
        }
        catch (e) {
            return (0, response_1.serverError)(String(e));
        }
    },
});
// POST /api/products
functions_1.app.http('createProduct', {
    methods: ['POST'],
    route: 'products',
    handler: async (req) => {
        try {
            const userId = getUserId();
            const body = await req.json();
            if (!body.name?.trim())
                return (0, response_1.badRequest)('name is required');
            if (!body.brand?.trim())
                return (0, response_1.badRequest)('brand is required');
            if (!body.type?.trim())
                return (0, response_1.badRequest)('type is required');
            const doc = {
                id: body.id ?? (0, crypto_1.randomUUID)(),
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
            const { resource } = await container.items.create(doc);
            return (0, response_1.created)(strip(resource));
        }
        catch (e) {
            return (0, response_1.serverError)(String(e));
        }
    },
});
// PUT /api/products/{id}
functions_1.app.http('updateProduct', {
    methods: ['PUT'],
    route: 'products/{id}',
    handler: async (req) => {
        try {
            const userId = getUserId();
            const id = req.params.id;
            const body = await req.json();
            const { resource: existing } = await container.item(id, userId).read();
            if (!existing)
                return (0, response_1.notFound)();
            const updated = { ...existing, ...body, id, userId };
            const { resource } = await container.items.upsert(updated);
            return (0, response_1.ok)(strip(resource));
        }
        catch (e) {
            return (0, response_1.serverError)(String(e));
        }
    },
});
// DELETE /api/products/{id}
functions_1.app.http('deleteProduct', {
    methods: ['DELETE'],
    route: 'products/{id}',
    handler: async (req) => {
        try {
            const userId = getUserId();
            const id = req.params.id;
            const { resource } = await container.item(id, userId).read();
            if (!resource)
                return (0, response_1.notFound)();
            await container.item(id, userId).delete();
            return (0, response_1.noContent)();
        }
        catch (e) {
            return (0, response_1.serverError)(String(e));
        }
    },
});
