import { usersStore, avatarsStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { toPublicUser } from '../lib/user.js';
import { decodeDataUrl } from '../lib/dataUrl.js';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024; // 2 Mo — l'image est redimensionnée côté client avant envoi

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

  let buffer, mimeType;
  try {
    ({ buffer, mimeType } = decodeDataUrl(body.dataUrl));
  } catch {
    return errorResponse('Image invalide.');
  }

  if (!ALLOWED_TYPES.has(mimeType)) {
    return errorResponse('Format d\'image non supporté (PNG, JPEG ou WebP uniquement).');
  }
  if (buffer.length > MAX_BYTES) {
    return errorResponse('Image trop lourde (2 Mo maximum).');
  }

  const user = session.user;
  await avatarsStore().set(user.id, buffer, { metadata: { mimeType } });

  user.avatarUpdatedAt = Date.now();
  user.avatarMimeType = mimeType;
  await usersStore().set(user.id, JSON.stringify(user));

  return jsonResponse({ user: await toPublicUser(user) });
};
