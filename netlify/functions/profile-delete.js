import { usersStore, usernameIndexStore, discordIndexStore, avatarsStore } from '../lib/blobs.js';
import { getSessionUser, destroySessionFromRequest, clearedSessionCookie } from '../lib/session.js';
import { jsonResponse, errorResponse } from '../lib/response.js';

// Supprime le compte : identifiants, avatar, index pseudo/Discord et session.
// Les candidatures/clips déjà soumis restent en base (historique du site,
// avec le pseudo utilisé à l'époque) mais ne sont plus rattachés à un compte
// vivant — comportement documenté sur /confidentialite.
export default async (req) => {
  if (req.method !== 'POST') return errorResponse('Méthode non autorisée.', 405);

  const session = await getSessionUser(req);
  if (!session) return errorResponse('Non connecté.', 401);

  const user = session.user;
  await usernameIndexStore().delete(user.username.toLowerCase());
  if (user.discordId) await discordIndexStore().delete(user.discordId);
  await avatarsStore().delete(user.id);
  await usersStore().delete(user.id);
  await destroySessionFromRequest(req);

  return jsonResponse({ ok: true }, { cookies: [clearedSessionCookie()] });
};
