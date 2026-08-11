import { clipsMetaStore } from '../lib/blobs.js';
import { jsonResponse } from '../lib/response.js';

export default async () => {
  const store = clipsMetaStore();
  const { blobs } = await store.list();
  const clips = [];
  for (const b of blobs) {
    const raw = await store.get(b.key);
    if (!raw) continue;
    const clip = JSON.parse(raw);
    if (clip.status !== 'approved') continue;
    clips.push({
      id: clip.id,
      title: clip.title,
      desc: clip.desc || '',
      submitterUsername: clip.submitterUsername,
      createdAt: clip.createdAt,
      videoUrl: `/api/clips/video?id=${clip.id}`,
    });
  }
  clips.sort((a, b) => b.createdAt - a.createdAt);
  return jsonResponse({ clips });
};
