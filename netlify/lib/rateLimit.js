import { redisClient } from './blobs.js';

// Limiteur de débit simple à fenêtre fixe (INCR + expiration posée une seule
// fois, au premier appel de la fenêtre). Suffisant pour dissuader le spam
// sur des formulaires publics — pas besoin d'un algorithme "sliding window".
export async function rateLimit(key, { limit, windowSeconds }) {
  const redis = redisClient();
  const rlKey = `ratelimit:${key}`;
  const count = await redis.incr(rlKey);
  if (count === 1) await redis.expire(rlKey, windowSeconds);
  return count <= limit;
}

export function clientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}
