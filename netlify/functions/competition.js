import { configStore } from '../lib/blobs.js';
import { jsonResponse } from '../lib/response.js';
import { defaultEvents, defaultMatches, withResult } from '../lib/competition.js';

const EVENTS_KEY = 'competitionEvents';
const MATCHES_KEY = 'competitionMatches';

export default async () => {
  const [rawEvents, rawMatches] = await Promise.all([
    configStore().get(EVENTS_KEY),
    configStore().get(MATCHES_KEY),
  ]);

  const events = rawEvents ? JSON.parse(rawEvents) : defaultEvents();
  const matches = (rawMatches ? JSON.parse(rawMatches) : defaultMatches()).map(withResult);

  return jsonResponse({ events, matches });
};
