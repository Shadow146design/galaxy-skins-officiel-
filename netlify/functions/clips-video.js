import { clipsMetaStore, clipsVideoStore } from '../lib/blobs.js';
import { getSessionUser } from '../lib/session.js';
import { isAdminUser } from '../lib/admin.js';

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response('Requête invalide.', { status: 400 });

  const metaRaw = await clipsMetaStore().get(id);
  if (!metaRaw) return new Response('Introuvable.', { status: 404 });
  const clip = JSON.parse(metaRaw);

  if (clip.status !== 'approved') {
    const session = await getSessionUser(req);
    const isOwner = session && session.user.id === clip.submitterUserId;
    const isAdmin = session && isAdminUser(session.user);
    if (!isOwner && !isAdmin) return new Response('Introuvable.', { status: 404 });
  }

  const result = await clipsVideoStore().getWithMetadata(id, { type: 'arrayBuffer' });
  if (!result || !result.data) return new Response('Introuvable.', { status: 404 });

  return new Response(result.data, {
    status: 200,
    headers: {
      'Content-Type': result.metadata?.mimeType || clip.mimeType || 'video/mp4',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Accept-Ranges': 'bytes',
    },
  });
};
