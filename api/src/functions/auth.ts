import { app } from '@azure/functions';
import type { HttpRequest, HttpResponseInit } from '@azure/functions';
import { randomUUID, pbkdf2Sync, randomBytes } from 'crypto';
import { db } from '../db';
import { ok, created, badRequest, conflict, serverError } from '../utils/response';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserProfileDoc {
  id: string;           // = userId; also the Cosmos partition key (/id)
  name: string;
  email: string;
  skinType: string;
  timezone: string;
  concerns?: string;
  notifications?: { enabled: boolean; amTime?: string; pmTime?: string };
  passwordHash: string;
  passwordSalt: string;
  [key: string]: unknown;
}

type PublicProfile = Omit<UserProfileDoc, 'passwordHash' | 'passwordSalt'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const container = db.container('userProfiles');

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 100_000, 64, 'sha256').toString('hex');
}

function stripPassword(doc: UserProfileDoc): PublicProfile {
  const { passwordHash: _h, passwordSalt: _s, ...rest } = doc;
  return rest;
}

// ── POST /api/auth/register ───────────────────────────────────────────────────

app.http('authRegister', {
  methods: ['POST'],
  route: 'auth/register',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const body = await req.json() as Record<string, string | undefined>;
      const { name, email, password, skinType, timezone } = body;

      if (!name?.trim())            return badRequest('name is required');
      if (!email?.trim())           return badRequest('email is required');
      if (!password)                return badRequest('password is required');
      if (password.length < 8)      return badRequest('password must be at least 8 characters');

      const normalEmail = email.toLowerCase().trim();

      // Check uniqueness — cross-partition scan is acceptable at this scale
      const { resources } = await container.items
        .query({
          query: 'SELECT c.id FROM c WHERE c.email = @email',
          parameters: [{ name: '@email', value: normalEmail }],
        })
        .fetchAll();

      if (resources.length > 0) return conflict('An account with that email already exists');

      const salt   = randomBytes(32).toString('hex');
      const userId = randomUUID();

      const doc: UserProfileDoc = {
        id:           userId,
        name:         name.trim(),
        email:        normalEmail,
        skinType:     skinType   ?? 'Normal',
        timezone:     timezone   ?? 'UTC',
        passwordHash: hashPassword(password, salt),
        passwordSalt: salt,
      };

      await container.items.create(doc);
      return created(stripPassword(doc));
    } catch (e) {
      return serverError(String(e));
    }
  },
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

app.http('authLogin', {
  methods: ['POST'],
  route: 'auth/login',
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    try {
      const body = await req.json() as Record<string, string | undefined>;
      const { email, password } = body;

      if (!email?.trim() || !password) return badRequest('email and password are required');

      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.email = @email',
          parameters: [{ name: '@email', value: email.toLowerCase().trim() }],
        })
        .fetchAll();

      const doc = resources[0] as UserProfileDoc | undefined;

      // Always hash to prevent timing-based enumeration of registered emails
      const dummySalt = 'dummy-salt-for-timing-resistance';
      const hash = doc
        ? hashPassword(password, doc.passwordSalt)
        : hashPassword(password, dummySalt);

      if (!doc || hash !== doc.passwordHash) {
        return { status: 401, jsonBody: { error: 'Invalid email or password' } };
      }

      return ok(stripPassword(doc));
    } catch (e) {
      return serverError(String(e));
    }
  },
});
