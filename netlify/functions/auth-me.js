import { getSessionUser } from '../lib/session.js';
import { jsonResponse } from '../lib/response.js';
import { toPublicUser } from '../lib/user.js';

export default async (req) => {
  const session = await getSessionUser(req);
  if (!session) return jsonResponse({ user: null });
  return jsonResponse({ user: await toPublicUser(session.user) });
};
