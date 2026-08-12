import { usersStore } from './blobs.js';
import { rankMeta, rankIndex } from './ranks.js';
import { isAdminUser, isHardcodedAdmin } from './admin.js';

export async function allUsers() {
  const store = usersStore();
  const { blobs } = await store.list();
  const users = [];
  for (const b of blobs) {
    const raw = await store.get(b.key);
    if (!raw) continue;
    users.push(JSON.parse(raw));
  }
  return users;
}

export async function computeLeaderboard() {
  const users = await allUsers();
  users.sort(
    (a, b) => rankIndex(b.rankKey) - rankIndex(a.rankKey) || a.username.localeCompare(b.username)
  );
  return users.map((u, i) => {
    const meta = rankMeta(u.rankKey);
    return {
      id: u.id,
      username: u.username,
      epicUsername: u.epicUsername || '',
      rankKey: u.rankKey || 'unranked',
      rankColor: meta.color,
      rankLabel: meta.label,
      role: u.role || 'Non défini',
      roleVerified: Boolean(u.roleVerified),
      staffRole: u.staffRole || 'Membre',
      position: i + 1,
      avatarUrl: u.avatarUpdatedAt ? `/api/avatar?id=${u.id}&v=${u.avatarUpdatedAt}` : null,
      isAdmin: isAdminUser(u),
      isAdminHardcoded: isHardcodedAdmin(u),
    };
  });
}

export async function positionOf(userId) {
  const board = await computeLeaderboard();
  const entry = board.find((u) => u.id === userId);
  return entry ? entry.position : null;
}
