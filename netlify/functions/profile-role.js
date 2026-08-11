import { usersStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { toPublicUser } from '../lib/user.js';
import { isValidRole } from '../lib/roles.js';

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

  if (!isValidRole(body.role)) return errorResponse('Rôle invalide.');

  const user = session.user;
  user.role = body.role;
  await usersStore().set(user.id, JSON.stringify(user));

  return jsonResponse({ user: await toPublicUser(user) });
};
