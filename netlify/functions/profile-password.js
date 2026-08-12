import { usersStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { rateLimit } from '../lib/rateLimit.js';

export default async (req) => {
  if (req.method !== 'POST') return errorResponse('Méthode non autorisée.', 405);

  const session = await getSessionUser(req);
  if (!session) return errorResponse('Non connecté.', 401);

  const allowed = await rateLimit(`profile-password:${session.user.id}`, { limit: 10, windowSeconds: 900 });
  if (!allowed) return errorResponse('Trop de tentatives. Réessaie dans 15 minutes.', 429);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Requête invalide.');
  }

  const newPassword = body.newPassword || '';
  if (newPassword.length < 6) return errorResponse('Le mot de passe doit contenir au moins 6 caractères.');

  const user = session.user;
  // Un compte créé via Discord (ou dont le mdp vient d'être réinitialisé par
  // le staff) peut ne pas avoir de mot de passe courant à vérifier.
  if (user.passwordHash) {
    if (!verifyPassword(body.currentPassword || '', user.passwordHash)) {
      return errorResponse('Mot de passe actuel incorrect.', 401);
    }
  }

  user.passwordHash = hashPassword(newPassword);
  await usersStore().set(user.id, JSON.stringify(user));

  return jsonResponse({ ok: true });
};
