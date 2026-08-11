import { usersStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { toPublicUser } from '../lib/user.js';
import { fetchTrackerRank } from '../lib/tracker.js';

export default async (req) => {
  if (req.method !== 'POST') return errorResponse('Méthode non autorisée.', 405);

  const session = await getSessionUser(req);
  if (!session) return errorResponse('Non connecté.', 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Requête invalide.');
  }

  const epicUsername = (body.epicUsername || '').trim();
  if (!epicUsername) return errorResponse('Entre un pseudo Epic Games.');

  const user = session.user;
  user.epicUsername = epicUsername;

  try {
    user.rankKey = await fetchTrackerRank(epicUsername);
    user.rankSource = 'tracker';
  } catch {
    // le pseudo est enregistré même si le rang n'a pas pu être récupéré automatiquement
  }

  await usersStore().set(user.id, JSON.stringify(user));
  return jsonResponse({ user: await toPublicUser(user) });
};
