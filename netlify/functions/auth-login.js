import { usersStore, usernameIndexStore } from '../lib/blobs.js';
import { verifyPassword } from '../lib/password.js';
import { createSession, sessionCookie } from '../lib/session.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { toPublicUser } from '../lib/user.js';
import { rateLimit, clientIp } from '../lib/rateLimit.js';

export default async (req) => {
  if (req.method !== 'POST') return errorResponse('Méthode non autorisée.', 405);

  // Anti brute-force : limite large (les faux positifs sur IP partagée sont
  // pires qu'un peu de marge) mais suffisante pour dissuader un script.
  const allowed = await rateLimit(`login:${clientIp(req)}`, { limit: 20, windowSeconds: 900 });
  if (!allowed) return errorResponse('Trop de tentatives de connexion. Réessaie dans 15 minutes.', 429);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Requête invalide.');
  }

  const username = (body.username || '').trim().toLowerCase();
  const password = body.password || '';
  if (!username || !password) return errorResponse('Pseudo et mot de passe requis.');

  const userId = await usernameIndexStore().get(username);
  if (!userId) return errorResponse('Identifiants incorrects.', 401);

  const raw = await usersStore().get(userId);
  if (!raw) return errorResponse('Identifiants incorrects.', 401);
  const user = JSON.parse(raw);

  if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return errorResponse('Identifiants incorrects.', 401);
  }

  const token = await createSession(user.id);
  return jsonResponse({ user: await toPublicUser(user) }, { cookies: [sessionCookie(token)] });
};
