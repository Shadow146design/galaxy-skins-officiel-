import { configStore } from '../lib/blobs.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { defaultEvents, findLiveEvent } from '../lib/competition.js';

// Bandeau "match en cours" entièrement dérivé du calendrier de la
// Compétition (voir netlify/lib/competition.js) — plus de bascule manuelle
// séparée : un admin ajoute/édite un événement depuis /admin et le bandeau
// s'active tout seul autour de l'heure du match.
export default async (req) => {
  if (req.method !== 'GET') return errorResponse('Méthode non autorisée.', 405);

  const raw = await configStore().get('competitionEvents');
  const events = raw ? JSON.parse(raw) : defaultEvents();
  const live = findLiveEvent(events);

  if (!live) return jsonResponse({ isLive: false });
  return jsonResponse({
    isLive: true,
    opponent: live.name,
    streamUrl: live.streamUrl || '',
    note: live.note || '',
  });
};
