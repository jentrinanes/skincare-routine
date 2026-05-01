import type { HttpResponseInit } from '@azure/functions';

export const ok = (body: unknown): HttpResponseInit =>
  ({ status: 200, jsonBody: body });

export const created = (body: unknown): HttpResponseInit =>
  ({ status: 201, jsonBody: body });

export const noContent = (): HttpResponseInit =>
  ({ status: 204 });

export const badRequest = (message: string): HttpResponseInit =>
  ({ status: 400, jsonBody: { error: message } });

export const notFound = (message = 'Not found'): HttpResponseInit =>
  ({ status: 404, jsonBody: { error: message } });

export const conflict = (message: string): HttpResponseInit =>
  ({ status: 409, jsonBody: { error: message } });

export const serverError = (message = 'Internal server error'): HttpResponseInit =>
  ({ status: 500, jsonBody: { error: message } });
