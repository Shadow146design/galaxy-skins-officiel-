import { avatarsStore } from '../lib/blobs.js';

export default async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return new Response('Requête invalide.', { status: 400 });

  const result = await avatarsStore().getWithMetadata(id, { type: 'arrayBuffer' });
  if (!result || !result.data) return new Response('Introuvable.', { status: 404 });

  const mimeType = result.metadata?.mimeType || 'image/png';
  return new Response(result.data, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
