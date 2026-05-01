import type { HttpRequest } from '@azure/functions';

// Reads the caller's userId from the x-user-id request header.
// TODO: when SWA auth is added, replace this body with:
//   const principal = req.headers.get('x-ms-client-principal');
//   const decoded = JSON.parse(Buffer.from(principal!, 'base64').toString('utf8'));
//   return decoded.userId as string;
// NOTE: x-user-id is not authenticated — any caller can claim any userId.
//       This is intentional for the pre-auth development phase.
export function getUserId(req: HttpRequest): string {
  return req.headers.get('x-user-id') ?? process.env.DEFAULT_USER_ID ?? 'dev-user';
}
