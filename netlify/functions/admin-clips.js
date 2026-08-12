import { clipsMetaStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { isAdminUser } from '../lib/admin.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { pushNotification } from '../lib/notifications.js';

async function requireAdmin(req) {
  const session = await getSessionUser(req);
  if (!session || !isAdminUser(session.user)) return null;
  return session;
}

export default async (req) => {
  const session = await requireAdmin(req);
  if (!session) return errorResponse('Accès réservé au staff.', 403);

  const store = clipsMetaStore();

  if (req.method === 'GET') {
    const { blobs } = await store.list();
    const clips = [];
    for (const b of blobs) {
      const raw = await store.get(b.key);
      if (!raw) continue;
      const clip = JSON.parse(raw);
      clips.push({ ...clip, videoUrl: `/api/clips/video?id=${clip.id}` });
    }
    clips.sort((a, b) => b.createdAt - a.createdAt);
    return jsonResponse({ clips });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Requête invalide.');
    }
    if (!['approve', 'reject'].includes(body.action)) return errorResponse('Action invalide.');

    const raw = await store.get(body.id);
    if (!raw) return errorResponse('Clip introuvable.', 404);
    const clip = JSON.parse(raw);
    clip.status = body.action === 'approve' ? 'approved' : 'rejected';
    clip.moderatedBy = session.user.username;
    clip.moderatedAt = Date.now();
    await store.set(clip.id, JSON.stringify(clip));

    await pushNotification(clip.submitterUserId, {
      message: body.action === 'approve'
        ? `Ton clip « ${clip.title} » a été validé et est maintenant visible sur la page Clips !`
        : `Ton clip « ${clip.title} » n'a pas été retenu par le staff.`,
      url: body.action === 'approve' ? '/clips' : '',
    });

    return jsonResponse({ ok: true, clip });
  }

  return errorResponse('Méthode non autorisée.', 405);
};
