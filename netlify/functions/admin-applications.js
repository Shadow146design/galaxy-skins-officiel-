import { randomUUID } from 'node:crypto';
import { applicationsStore, usersStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { isAdminUser } from '../lib/admin.js';
import { jsonResponse, errorResponse } from '../lib/response.js';

const DISCORD_INVITE_URL = 'https://discord.gg/qdvY4hEHqT';

// Notifie le candidat sur son profil uniquement en cas d'acceptation — un
// refus ne génère aucune notification (comportement voulu par le staff).
async function notifyAccepted(userId) {
  if (!userId) return;
  const raw = await usersStore().get(userId);
  if (!raw) return;
  const user = JSON.parse(raw);
  const notifications = user.notifications || [];
  notifications.push({
    id: randomUUID(),
    message: 'Ta candidature pour rejoindre Galaxy Sinks™ a été acceptée ! Rejoins le serveur Discord pour la suite :',
    url: DISCORD_INVITE_URL,
    createdAt: Date.now(),
    read: false,
  });
  user.notifications = notifications;
  await usersStore().set(user.id, JSON.stringify(user));
}

async function requireAdmin(req) {
  const session = await getSessionUser(req);
  if (!session || !isAdminUser(session.user)) return null;
  return session;
}

export default async (req) => {
  const session = await requireAdmin(req);
  if (!session) return errorResponse('Accès réservé au staff.', 403);

  const store = applicationsStore();

  if (req.method === 'GET') {
    const { blobs } = await store.list();
    const applications = [];
    for (const b of blobs) {
      const raw = await store.get(b.key);
      if (!raw) continue;
      const app = JSON.parse(raw);
      applications.push({ status: 'pending', ...app });
    }
    applications.sort((a, b) => b.createdAt - a.createdAt);
    return jsonResponse({ applications });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Requête invalide.');
    }
    if (!body.id) return errorResponse('id requis.');

    if (body.action === 'delete') {
      await store.delete(body.id);
      return jsonResponse({ ok: true, deleted: body.id });
    }

    if (!['accept', 'reject'].includes(body.action)) return errorResponse('Action invalide.');

    const raw = await store.get(body.id);
    if (!raw) return errorResponse('Candidature introuvable.', 404);
    const application = JSON.parse(raw);
    application.status = body.action === 'accept' ? 'accepted' : 'rejected';
    application.moderatedBy = session.user.username;
    application.moderatedAt = Date.now();
    await store.set(application.id, JSON.stringify(application));

    if (body.action === 'accept') await notifyAccepted(application.userId);

    return jsonResponse({ ok: true, application });
  }

  return errorResponse('Méthode non autorisée.', 405);
};
