import type { Product, RoutineItem, Log, Reaction, PatchTest, UserProfile } from '../types';

const BASE = import.meta.env.VITE_API_BASE ?? '/api';

// Holds the active userId after login; sent as x-user-id on every request.
// NOTE: x-user-id is not authenticated — this is intentional for the pre-SWA-auth phase.
// TODO: remove setUserId entirely when SWA auth is wired up (userId will come from the token).
let _userId: string | null = null;

export function setUserId(id: string | null): void {
  _userId = id;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (_userId) headers['x-user-id'] = _userId;

  const res = await fetch(`${BASE}${path}`, { headers, ...init });
  if (res.status === 204) return undefined as T;
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

function body(data: unknown): RequestInit {
  return { body: JSON.stringify(data) };
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; skinType: string; timezone: string }) =>
      request<UserProfile>('/auth/register', { method: 'POST', ...body(data) }),
    login: (data: { email: string; password: string }) =>
      request<UserProfile>('/auth/login', { method: 'POST', ...body(data) }),
    forgotPassword: (email: string) =>
      request<{ resetUrl: string | null }>('/auth/forgot-password', { method: 'POST', ...body({ email }) }),
    resetPassword: (token: string, password: string) =>
      request<{ message: string }>('/auth/reset-password', { method: 'POST', ...body({ token, password }) }),
  },

  products: {
    list: () =>
      request<Product[]>('/products'),
    create: (p: Product) =>
      request<Product>('/products', { method: 'POST', ...body(p) }),
    update: (p: Product) =>
      request<Product>(`/products/${p.id}`, { method: 'PUT', ...body(p) }),
    remove: (id: string) =>
      request<void>(`/products/${id}`, { method: 'DELETE' }),
  },

  routineItems: {
    list: () =>
      request<RoutineItem[]>('/routine-items'),
    create: (item: RoutineItem) =>
      request<RoutineItem>('/routine-items', { method: 'POST', ...body(item) }),
    update: (id: string, changes: Partial<Omit<RoutineItem, 'id'>>) =>
      request<RoutineItem>(`/routine-items/${id}`, { method: 'PUT', ...body(changes) }),
    remove: (id: string) =>
      request<void>(`/routine-items/${id}`, { method: 'DELETE' }),
  },

  logs: {
    list: (params?: { date?: string; from?: string; to?: string }) => {
      const entries = Object.entries(params ?? {}).filter(([, v]) => v != null) as [string, string][];
      const qs = entries.length ? '?' + new URLSearchParams(entries).toString() : '';
      return request<Log[]>(`/logs${qs}`);
    },
    upsert: (log: Log) =>
      request<Log>('/logs', { method: 'POST', ...body(log) }),
    remove: (date: string, routineItemId: string, period: string) =>
      request<void>(`/logs/${date}/${routineItemId}/${period}`, { method: 'DELETE' }),
    clear: () =>
      request<void>('/logs', { method: 'DELETE' }),
  },

  reactions: {
    list: () =>
      request<Reaction[]>('/reactions'),
    create: (r: Reaction) =>
      request<Reaction>('/reactions', { method: 'POST', ...body(r) }),
    update: (r: Reaction) =>
      request<Reaction>(`/reactions/${r.id}`, { method: 'PUT', ...body(r) }),
    remove: (id: string) =>
      request<void>(`/reactions/${id}`, { method: 'DELETE' }),
  },

  patchTests: {
    list: () =>
      request<PatchTest[]>('/patch-tests'),
    create: (t: PatchTest) =>
      request<PatchTest>('/patch-tests', { method: 'POST', ...body(t) }),
    update: (t: PatchTest) =>
      request<PatchTest>(`/patch-tests/${t.id}`, { method: 'PUT', ...body(t) }),
    remove: (id: string) =>
      request<void>(`/patch-tests/${id}`, { method: 'DELETE' }),
  },

  profile: {
    get: () =>
      request<UserProfile>('/profile'),
    upsert: (p: UserProfile) =>
      request<UserProfile>('/profile', { method: 'PUT', ...body(p) }),
  },
};
