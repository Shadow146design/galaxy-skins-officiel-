import { configStore } from '../lib/blobs.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { getSessionUser } from '../lib/session.js';
import { isAdminUser } from '../lib/admin.js';

const KEY = 'liveMatch';
const DEFAULT_STATE = { isLive: false };

export default async (req) => {
  const store = configStore();

  if (req.method === 'GET') {
    const raw = await store.get(KEY);
    return jsonResponse(raw ? JSON.parse(raw) : DEFAULT_STATE);
  }

  if (req.method === 'POST') {
    // Autorisé soit via une session admin (panel admin du site), soit via
    // un jeton défini côté serveur (ADMIN_TOKEN, pour un usage en script).
    const adminToken = process.env.ADMIN_TOKEN;
    const hasValidToken = adminToken && req.headers.get('x-admin-token') === adminToken;
    const session = hasValidToken ? null : await getSessionUser(req);
    const hasAdminSession = session && isAdminUser(session.user);
    if (!hasValidToken && !hasAdminSession) {
      return errorResponse('Non autorisé.', 401);
    }
    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Requête invalide.');
    }
    const state = {
      isLive: Boolean(body.isLive),
      opponent: body.opponent || '',
      streamUrl: body.streamUrl || '',
      note: body.note || '',
    };
    await store.set(KEY, JSON.stringify(state));
    return jsonResponse(state);
  }

  return errorResponse('Méthode non autorisée.', 405);
};
