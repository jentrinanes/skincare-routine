import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { db } from '../db';
import { getUserId } from '../utils/auth';
import { ok, badRequest, notFound, serverError } from '../utils/response';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserNotifications {
  enabled: boolean;
  amTime?: string;
  pmTime?: string;
}

interface UserProfileDoc {
  id: string;  // = userId; also the Cosmos partition key (/id)
  name: string;
  email: string;
  skinType: string;
  timezone: string;
  concerns?: string;
  notifications?: UserNotifications;
  // Extra fields (e.g. passwordHash/Salt from auth) are preserved via spread
  [key: string]: unknown;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const container = db.container('userProfiles');

// ── Endpoints ─────────────────────────────────────────────────────────────────

// GET /api/profile
app.http('getProfile', {
  methods: ['GET'],
  route: 'profile',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const { resource } = await container.item(userId, userId).read<UserProfileDoc>();
      if (!resource) return notFound('Profile not found');
      return ok(resource);
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// PUT /api/profile
// Reads the existing doc first so password fields are never clobbered.
app.http('upsertProfile', {
  methods: ['PUT'],
  route: 'profile',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const userId = getUserId(req);
      const body = await req.json() as Partial<UserProfileDoc>;

      if (!body.name?.trim()) return badRequest('name is required');
      if (!body.email?.trim()) return badRequest('email is required');

      const { resource: existing } = await container.item(userId, userId).read<UserProfileDoc>();

      const doc: UserProfileDoc = {
        ...(existing ?? {}),   // preserve any stored fields (e.g. passwordHash)
        id:            userId,
        name:          (body.name as string).trim(),
        email:         (body.email as string).trim(),
        skinType:      body.skinType    ?? existing?.skinType    ?? 'Normal',
        timezone:      body.timezone    ?? existing?.timezone    ?? 'UTC',
        concerns:      body.concerns,
        notifications: body.notifications,
      };

      const { resource } = await container.items.upsert<UserProfileDoc>(doc);
      return ok(resource!);
    } catch (e) {
      return serverError(String(e));
    }
  },
});
