import { usersStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { toPublicUser } from '../lib/user.js';
import { fetchTrackerRank } from '../lib/tracker.js';

export default async (req) => {
  if (req.method !== 'POST') return errorResponse('Méthode non autorisée.', 405);

  const session = await getSessionUser(req);
  if (!session) return errorResponse('Non connecté.', 401);

  const user = session.user;
  if (!user.epicUsername) {
    return errorResponse('Ajoute d\'abord ton pseudo Epic Games à ton profil.');
  }

  try {
    user.rankKey = await fetchTrackerRank(user.epicUsername);
    user.rankSource = 'tracker';
  } catch {
    return errorResponse(
      'Échec de la récupération automatique depuis Tracker Network. Réessaie plus tard ou définis ton rang manuellement.',
      502
    );
  }

  await usersStore().set(user.id, JSON.stringify(user));
  return jsonResponse({ user: await toPublicUser(user) });
};
