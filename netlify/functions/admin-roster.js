import { configStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { isAdminUser } from '../lib/admin.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { normalizeDivisions } from '../lib/roster.js';

const KEY = 'divisions';

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

  let divisions;
  try {
    divisions = normalizeDivisions(body.divisions);
  } catch {
    return errorResponse('Données de roster invalides (vérifie que chaque division a un nom).');
  }

  await configStore().set(KEY, JSON.stringify(divisions));
  return jsonResponse({ ok: true, divisions });
};
