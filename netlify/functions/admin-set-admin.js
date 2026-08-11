import { usersStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { isAdminUser, isHardcodedAdmin } from '../lib/admin.js';
import { jsonResponse, errorResponse } from '../lib/response.js';

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

  // Empêche de se retirer ses propres droits par erreur — évite de se
  // retrouver bloqué hors du panel (sauf pour insane/shadow, de toute
  // façon toujours admin quoi qu'il arrive).
  if (body.userId === session.user.id && !body.isAdmin) {
    return errorResponse('Tu ne peux pas retirer tes propres droits admin.');
  }

  const store = usersStore();
  const raw = await store.get(body.userId);
  if (!raw) return errorResponse('Membre introuvable.', 404);

  const user = JSON.parse(raw);
  if (isHardcodedAdmin(user) && !body.isAdmin) {
    return errorResponse(`${user.username} est admin par défaut (compte fondateur) et ne peut pas être rétrogradé ici.`);
  }

  user.isAdminGranted = Boolean(body.isAdmin);
  await store.set(user.id, JSON.stringify(user));

  return jsonResponse({ ok: true, userId: user.id, isAdmin: isAdminUser(user) });
};
