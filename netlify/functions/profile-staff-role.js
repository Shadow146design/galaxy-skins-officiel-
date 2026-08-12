import { usersStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { toPublicUser } from '../lib/user.js';
import { isValidSelfStaffRole } from '../lib/roles.js';

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

  // Les postes sensibles (Modérateur, Admin, Créateur) ne peuvent être
  // attribués que par le staff via le panel admin.
  if (!isValidSelfStaffRole(body.staffRole)) return errorResponse('Poste invalide.');

  const user = session.user;
  user.staffRole = body.staffRole;
  await usersStore().set(user.id, JSON.stringify(user));

  return jsonResponse({ user: await toPublicUser(user) });
};
