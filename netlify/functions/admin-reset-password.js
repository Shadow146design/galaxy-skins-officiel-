import { randomBytes } from 'node:crypto';
import { usersStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { isAdminUser } from '../lib/admin.js';
import { hashPassword } from '../lib/password.js';
import { jsonResponse, errorResponse } from '../lib/response.js';

// Pas de système d'email : le staff génère un mot de passe temporaire ici
// et le communique lui-même au membre (Discord, en personne...).
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

  const store = usersStore();
  const raw = await store.get(body.userId);
  if (!raw) return errorResponse('Membre introuvable.', 404);
  const user = JSON.parse(raw);

  const tempPassword = randomBytes(6).toString('base64url');
  user.passwordHash = hashPassword(tempPassword);
  await store.set(user.id, JSON.stringify(user));

  return jsonResponse({ ok: true, username: user.username, tempPassword });
};
