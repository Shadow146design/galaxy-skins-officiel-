import { randomBytes } from 'node:crypto';
import { sessionsStore, usersStore } from './blobs.js';

export const COOKIE_NAME = 'gs_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

export function parseCookies(req) {
  const header = req.headers.get('cookie') || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

export async function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  await sessionsStore().set(token, JSON.stringify({ userId, createdAt: Date.now() }));
  return token;
}

export function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`;
}

export function clearedSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function getSessionUser(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const raw = await sessionsStore().get(token);
  if (!raw) return null;
  const { userId } = JSON.parse(raw);
  const userRaw = await usersStore().get(userId);
  if (!userRaw) return null;
  return { token, user: JSON.parse(userRaw) };
}

export async function destroySessionFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (token) await sessionsStore().delete(token);
}
