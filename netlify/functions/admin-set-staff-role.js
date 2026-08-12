import { usersStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { isAdminUser } from '../lib/admin.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { isValidStaffRole } from '../lib/roles.js';

export default async (req) => {
  if (req.method !== 'POST') return errorResponse('Méthode non autorisée.', 405);

  const session = await getSessionUser(req);
  if (!session || !isAdminUser(session.user)) return errorResponse('Accès réservé au staff.', 403);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Requête invalide.');
  }

  if (!body.userId) return errorResponse('userId requis.');
  if (!isValidStaffRole(body.staffRole)) return errorResponse('Poste invalide.');

  const store = usersStore();
  const raw = await store.get(body.userId);
  if (!raw) return errorResponse('Membre introuvable.', 404);

  const user = JSON.parse(raw);
  user.staffRole = body.staffRole;
  await store.set(user.id, JSON.stringify(user));

  return jsonResponse({ ok: true, userId: user.id, staffRole: user.staffRole });
};
