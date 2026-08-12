import { randomUUID } from 'node:crypto';
import { clipsMetaStore, clipsVideoStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { decodeDataUrl } from '../lib/dataUrl.js';

const ALLOWED_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
// Les fonctions serverless Netlify plafonnent le corps de requête à 6 Mo —
// en tenant compte du surcoût d'environ 33 % du base64 et du JSON autour,
// on limite la vidéo décodée à 4 Mo. Ça correspond à un clip très court
// (quelques secondes, typiquement une reprise de but) plutôt qu'une vidéo
// complète — limite de la plateforme, pas un choix arbitraire.
const MAX_BYTES = 4 * 1024 * 1024;

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

  const title = (body.title || '').trim().slice(0, 80);
  const desc = (body.desc || '').trim().slice(0, 300);
  if (!title) return errorResponse('Un titre est requis.');

  let buffer, mimeType;
  try {
    ({ buffer, mimeType } = decodeDataUrl(body.dataUrl));
  } catch {
    return errorResponse('Fichier vidéo invalide.');
  }

  if (!ALLOWED_TYPES.has(mimeType)) {
    return errorResponse('Format vidéo non supporté (MP4, WebM ou MOV uniquement).');
  }
  if (buffer.length > MAX_BYTES) {
    return errorResponse('Vidéo trop lourde — 4 Mo maximum (garde un clip très court, quelques secondes).');
  }

  const id = randomUUID();
  const user = session.user;
  const clip = {
    id,
    title,
    desc,
    submitterUserId: user.id,
    submitterUsername: user.username,
    status: 'pending',
    createdAt: Date.now(),
    mimeType,
    sizeBytes: buffer.length,
  };

  await clipsVideoStore().set(id, buffer, { metadata: { mimeType } });
  await clipsMetaStore().set(id, JSON.stringify(clip));

  // Notification optionnelle au staff via un webhook Discord.
  const webhookUrl = process.env.DISCORD_CLIPS_WEBHOOK;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🎬 Nouveau clip à modérer — **${title}** par ${user.username}`,
        }),
      });
    } catch {
      // le clip reste enregistré même si la notification échoue
    }
  }

  return jsonResponse({ ok: true, clip });
};
