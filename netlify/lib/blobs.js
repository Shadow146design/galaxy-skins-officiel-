import { Redis } from '@upstash/redis';

// Remplace Netlify Blobs (indisponible hors Netlify) par un magasin clé-valeur
// Upstash Redis exposant la même interface (get/set/delete/list/getWithMetadata),
// afin qu'aucune fonction métier n'ait besoin d'être modifiée.

const BINARY_MARKER = '__gsBinary';

let client;
function redis() {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN manquants (variables d\'environnement Render).'
      );
    }
    client = new Redis({ url, token, automaticDeserialization: false });
  }
  return client;
}

function makeStore(name) {
  const dataKey = (key) => `gs:${name}:${key}`;
  const indexKey = `gs:${name}:__keys__`;

  return {
    async get(key) {
      const raw = await redis().get(dataKey(key));
      return raw == null ? null : raw;
    },

    async getWithMetadata(key) {
      const raw = await redis().get(dataKey(key));
      if (raw == null) return null;
      let envelope;
      try {
        envelope = JSON.parse(raw);
      } catch {
        return null;
      }
      if (!envelope || !envelope[BINARY_MARKER]) return null;
      return {
        data: Buffer.from(envelope.base64, 'base64'),
        metadata: envelope.metadata || {},
      };
    },

    async set(key, value, opts = {}) {
      const isBinary = Buffer.isBuffer(value) || value instanceof Uint8Array;
      const payload = isBinary
        ? JSON.stringify({
            [BINARY_MARKER]: true,
            base64: Buffer.from(value).toString('base64'),
            metadata: opts.metadata || {},
          })
        : String(value);
      await redis().set(dataKey(key), payload);
      await redis().sadd(indexKey, key);
    },

    async delete(key) {
      await redis().del(dataKey(key));
      await redis().srem(indexKey, key);
    },

    async list() {
      const keys = (await redis().smembers(indexKey)) || [];
      return { blobs: keys.map((key) => ({ key })) };
    },
  };
}

export const usersStore = () => makeStore('users');
export const usernameIndexStore = () => makeStore('usernames');
export const discordIndexStore = () => makeStore('discord-ids');
export const sessionsStore = () => makeStore('sessions');
export const applicationsStore = () => makeStore('applications');
export const configStore = () => makeStore('config');
export const avatarsStore = () => makeStore('avatars');
export const clipsMetaStore = () => makeStore('clips-meta');
export const clipsVideoStore = () => makeStore('clips-video');
