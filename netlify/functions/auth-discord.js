import { randomBytes } from 'node:crypto';
import { getSessionUser } from '../lib/session.js';

export default async (req) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return new Response('Discord OAuth non configuré (DISCORD_CLIENT_ID manquant).', { status: 500 });
  }

  const url = new URL(req.url);
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${url.origin}/api/auth/discord/callback`;

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

  // Mode "lier mon compte Discord" (?link=1), déclenché depuis le profil
  // d'un membre déjà connecté — permet ensuite de se reconnecter sans mot
  // de passe via Discord si celui-ci est oublié.
  if (url.searchParams.get('link') === '1') {
    const session = await getSessionUser(req);
    if (session) {
      headers.append(
        'Set-Cookie',
        `gs_oauth_link_user=${session.user.id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
      );
    }
  }

  return new Response(null, { status: 302, headers });
};
