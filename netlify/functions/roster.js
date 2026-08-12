import { configStore } from '../lib/blobs.js';
import { jsonResponse } from '../lib/response.js';
import { defaultDivisions } from '../lib/roster.js';

const KEY = 'divisions';

export default async () => {
  const raw = await configStore().get(KEY);
  const divisions = raw ? JSON.parse(raw) : defaultDivisions();
  return jsonResponse({ divisions });
};
