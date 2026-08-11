import { randomUUID } from 'node:crypto';
import { applicationsStore } from '../lib/blobs.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { isValidRankKey } from '../lib/ranks.js';

export default async (req) => {
  if (req.method !== 'POST') return errorResponse('Méthode non autorisée.', 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse('Requête invalide.');
  }

  const pseudo = (body.pseudo || '').trim();
  const epicUsername = (body.epicUsername || '').trim();
  const rankKey = isValidRankKey(body.rankKey) ? body.rankKey : 'unranked';
  const availability = (body.availability || '').trim();
  const message = (body.message || '').trim();

  if (!pseudo || !epicUsername) {
    return errorResponse('Pseudo et pseudo Epic Games requis.');
  }

  const id = randomUUID();
  const application = {
    id,
    pseudo,
    epicUsername,
    rankKey,
    availability,
    message,
    createdAt: Date.now(),
  };
  await applicationsStore().set(id, JSON.stringify(application));

  // Notification optionnelle au staff via un webhook Discord.
  const webhookUrl = process.env.DISCORD_APPLICATIONS_WEBHOOK;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📋 Nouvelle candidature — **${pseudo}** (Epic: ${epicUsername}, rang: ${rankKey})\n${
            availability ? `Disponibilités : ${availability}\n` : ''
          }${message ? `Message : ${message}` : ''}`,
        }),
      });
    } catch {
      // la candidature reste enregistrée même si la notification échoue
    }
  }

  return jsonResponse({ ok: true });
};
