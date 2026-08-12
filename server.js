import express from 'express';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Adapte les fonctions Netlify existantes (netlify/functions/*.js, qui
// exportent `default async (req: Request) => Response`) à un serveur Node
// classique servable sur Render. Aucune fonction métier n'est modifiée :
// on convertit juste req Express <-> Request/Response (API Fetch standard,
// disponible nativement depuis Node 18).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_BODY_BYTES = 8 * 1024 * 1024; // marge au-dessus des limites internes (clips 4 Mo, avatars 2 Mo)

const ROUTE_TABLE = [
  ['/api/live-match', 'live-match.js'],
  ['/api/roster', 'roster.js'],
  ['/api/admin/roster', 'admin-roster.js'],
  ['/api/competition', 'competition.js'],
  ['/api/admin/competition', 'admin-competition.js'],
  ['/api/leaderboard', 'leaderboard.js'],
  ['/api/applications', 'applications.js'],
  ['/api/auth/discord/callback', 'auth-discord-callback.js'],
  ['/api/auth/discord', 'auth-discord.js'],
  ['/api/auth/login', 'auth-login.js'],
  ['/api/auth/register', 'auth-register.js'],
  ['/api/auth/logout', 'auth-logout.js'],
  ['/api/auth/me', 'auth-me.js'],
  ['/api/auth/epic', 'auth-epic.js'],
  ['/api/profile/role', 'profile-role.js'],
  ['/api/profile/staff-role', 'profile-staff-role.js'],
  ['/api/notifications/read', 'notifications-read.js'],
  ['/api/profile/password', 'profile-password.js'],
  ['/api/profile/delete', 'profile-delete.js'],
  ['/api/profile/avatar', 'profile-avatar.js'],
  ['/api/avatar', 'avatar.js'],
  ['/api/rank/refresh', 'rank-refresh.js'],
  ['/api/rank/manual', 'rank-manual.js'],
  ['/api/clips/submit', 'clips-submit.js'],
  ['/api/clips/video', 'clips-video.js'],
  ['/api/clips', 'clips-list.js'],
  ['/api/admin/clips', 'admin-clips.js'],
  ['/api/admin/verify-role', 'admin-verify-role.js'],
  ['/api/admin/set-role', 'admin-set-role.js'],
  ['/api/admin/set-staff-role', 'admin-set-staff-role.js'],
  ['/api/admin/applications', 'admin-applications.js'],
  ['/api/admin/reset-password', 'admin-reset-password.js'],
  ['/api/admin/set-admin', 'admin-set-admin.js'],
];

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('payload_too_large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function buildRequestUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}${req.originalUrl}`;
}

function buildFetchHeaders(req) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.set(key, String(value));
    }
  }
  return headers;
}

function loadHandler(file) {
  const moduleUrl = pathToFileURL(path.join(__dirname, 'netlify', 'functions', file)).href;
  let modPromise;
  return async () => {
    if (!modPromise) modPromise = import(moduleUrl);
    return (await modPromise).default;
  };
}

function netlifyAdapter(file) {
  const getHandler = loadHandler(file);
  return async (req, res) => {
    let rawBody;
    try {
      rawBody = ['GET', 'HEAD'].includes(req.method) ? undefined : await readRawBody(req);
    } catch (err) {
      res.status(err.status || 400).json({ error: 'Requête invalide.' });
      return;
    }

    const request = new Request(buildRequestUrl(req), {
      method: req.method,
      headers: buildFetchHeaders(req),
      body: rawBody && rawBody.length ? rawBody : undefined,
    });

    let response;
    try {
      const handler = await getHandler();
      response = await handler(request);
    } catch (err) {
      console.error(`[api] erreur dans ${file}:`, err);
      res.status(500).json({ error: 'Erreur serveur.' });
      return;
    }

    res.status(response.status);
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === 'set-cookie') continue;
      res.setHeader(key, value);
    }
    const setCookies =
      typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    if (setCookies.length) res.setHeader('Set-Cookie', setCookies);

    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  };
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

for (const [routePath, file] of ROUTE_TABLE) {
  app.all(routePath, netlifyAdapter(file));
}

app.use(express.static(__dirname, { extensions: ['html'] }));

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Galaxy Sinks — serveur démarré sur le port ${PORT}`);
});
