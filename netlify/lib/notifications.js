import { randomUUID } from 'node:crypto';
import { usersStore } from './blobs.js';

// Petit système de notifications "sur le profil" — pas de mail, pas de push,
// juste un tableau sur l'utilisateur affiché dans la modale profil (voir
// script.js) et consulté via toPublicUser().
export async function pushNotification(userId, { message, url = '' }) {
  if (!userId) return;
  const store = usersStore();
  const raw = await store.get(userId);
  if (!raw) return;
  const user = JSON.parse(raw);
  const notifications = user.notifications || [];
  notifications.push({ id: randomUUID(), message, url, createdAt: Date.now(), read: false });
  user.notifications = notifications;
  await store.set(user.id, JSON.stringify(user));
}
