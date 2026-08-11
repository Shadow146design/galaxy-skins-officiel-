import { randomBytes } from 'node:crypto';

export default async (req) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return new Response('Discord OAuth non configuré (DISCORD_CLIENT_ID manquant).', { status: 500 });
  }

  const origin = new URL(req.url).origin;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${origin}/api/auth/discord/callback`;

  const state = randomBytes(16).toString('hex');
  const authorizeUrl = new URL('https://discord.com/api/oauth2/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'identify');
  authorizeUrl.searchParams.set('state', state);

  const headers = new Headers({ Location: authorizeUrl.toString() });
  headers.append(
    'Set-Cookie',
    `gs_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  return new Response(null, { status: 302, headers });
};
