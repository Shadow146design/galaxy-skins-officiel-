import { destroySessionFromRequest, clearedSessionCookie } from '../lib/session.js';
import { jsonResponse, errorResponse } from '../lib/response.js';

export default async (req) => {
  if (req.method !== 'POST') return errorResponse('Méthode non autorisée.', 405);
  await destroySessionFromRequest(req);
  return jsonResponse({ ok: true }, { cookies: [clearedSessionCookie()] });
};
