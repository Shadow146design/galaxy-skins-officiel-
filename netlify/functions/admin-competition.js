import { configStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { isAdminUser } from '../lib/admin.js';
import { jsonResponse, errorResponse } from '../lib/response.js';
import { normalizeEvents, normalizeMatches, withResult } from '../lib/competition.js';

const EVENTS_KEY = 'competitionEvents';
const MATCHES_KEY = 'competitionMatches';

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

  let events, matches;
  try {
    events = normalizeEvents(body.events);
    matches = normalizeMatches(body.matches);
  } catch {
    return errorResponse('Données de compétition invalides (vérifie les noms, dates et scores).');
  }

  await Promise.all([
    configStore().set(EVENTS_KEY, JSON.stringify(events)),
    configStore().set(MATCHES_KEY, JSON.stringify(matches)),
  ]);

  return jsonResponse({ ok: true, events, matches: matches.map(withResult) });
};
