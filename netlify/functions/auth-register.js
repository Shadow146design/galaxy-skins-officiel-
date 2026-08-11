import { randomUUID } from 'node:crypto';
import { usersStore, usernameIndexStore } from '../lib/blobs.js';
import { hashPassword } from '../lib/password.js';
import { createSession, sessionCookie } from '../lib/session.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { toPublicUser } from '../lib/user.js';
import { fetchTrackerRank } from '../lib/tracker.js';
import { isValidRankKey } from '../lib/ranks.js';

export default async (req) => {
  if (req.method !== 'POST') return errorResponse('Méthode non autorisée.', 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Requête invalide.');
  }

  const username = (body.username || '').trim();
  const epicUsername = (body.epicUsername || '').trim();
  const password = body.password || '';

  if (username.length < 3 || username.length > 24) {
    return errorResponse('Le pseudo doit contenir entre 3 et 24 caractères.');
  }
  if (!epicUsername) {
    return errorResponse('Le pseudo Epic Games est requis.');
  }
  if (password.length < 6) {
    return errorResponse('Le mot de passe doit contenir au moins 6 caractères.');
  }

  const usernameLower = username.toLowerCase();
  const usernameIndex = usernameIndexStore();
  const existing = await usernameIndex.get(usernameLower);
  if (existing) return errorResponse('Ce pseudo est déjà pris.');

  const id = randomUUID();
  const user = {
    id,
    username,
    epicUsername,
    passwordHash: hashPassword(password),
    discordId: null,
    rankKey: 'unranked',
    rankSource: 'none',
    role: 'Non défini',
    badges: [],
    createdAt: Date.now(),
  };

  // Si le joueur a précisé son rang lui-même à l'inscription, on respecte
  // son choix explicite et on ne tente pas de le remplacer automatiquement.
  // Sinon, tentative de récupération automatique depuis Tracker Network —
  // best effort, ne bloque jamais l'inscription en cas d'échec.
  if (isValidRankKey(body.rankKey) && body.rankKey !== 'unranked') {
    user.rankKey = body.rankKey;
    user.rankSource = 'manuel';
  } else {
    try {
      const rankKey = await fetchTrackerRank(epicUsername);
      user.rankKey = rankKey;
      user.rankSource = 'tracker';
    } catch {
      // silencieux — l'utilisateur pourra définir son rang manuellement
    }
  }

  await usersStore().set(id, JSON.stringify(user));
  await usernameIndex.set(usernameLower, id);

  const token = await createSession(id);
  return jsonResponse({ user: await toPublicUser(user) }, { cookies: [sessionCookie(token)] });
};
