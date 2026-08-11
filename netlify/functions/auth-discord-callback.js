import { randomUUID } from 'node:crypto';
import { usersStore, usernameIndexStore, discordIndexStore } from '../lib/blobs.js';
import { createSession, sessionCookie, parseCookies } from '../lib/session.js';

function redirectToHome(cookies = []) {
  const headers = new Headers({ Location: '/' });
  for (const c of cookies) headers.append('Set-Cookie', c);
  return new Response(null, { status: 302, headers });
}

function redirectToError() {
  return new Response(null, { status: 302, headers: new Headers({ Location: '/?discord_error=1' }) });
}

async function uniqueUsernameFrom(base) {
  const usernameIndex = usernameIndexStore();
  let candidate = base.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20) || 'membre';
  if (candidate.length < 3) candidate = candidate.padEnd(3, '0');
  let attempt = candidate;
  let suffix = 0;
  while (await usernameIndex.get(attempt.toLowerCase())) {
    suffix += 1;
    attempt = `${candidate.slice(0, 20)}${suffix}`;
  }
  return attempt;
}

export default async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(req);

  if (!code || !state || state !== cookies.gs_oauth_state) return redirectToError();

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return redirectToError();

  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${url.origin}/api/auth/discord/callback`;

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) return redirectToError();
    const tokenData = await tokenRes.json();

    const meRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!meRes.ok) return redirectToError();
    const discordUser = await meRes.json();

    const discordIndex = discordIndexStore();
    const usersStoreRef = usersStore();
    let userId = await discordIndex.get(discordUser.id);
    let user;

    if (userId) {
      const raw = await usersStoreRef.get(userId);
      user = raw ? JSON.parse(raw) : null;
    }

    if (!user) {
      const username = await uniqueUsernameFrom(discordUser.global_name || discordUser.username || 'membre');
      userId = randomUUID();
      user = {
        id: userId,
        username,
        epicUsername: '',
        passwordHash: null,
        discordId: discordUser.id,
        rankKey: 'unranked',
        rankSource: 'none',
        role: 'Non défini',
        badges: [],
        createdAt: Date.now(),
      };
      await usersStoreRef.set(userId, JSON.stringify(user));
      await usernameIndexStore().set(username.toLowerCase(), userId);
      await discordIndex.set(discordUser.id, userId);
    }

    const token = await createSession(user.id);
    const clearState = 'gs_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
    return redirectToHome([sessionCookie(token), clearState]);
  } catch {
    return redirectToError();
  }
};
