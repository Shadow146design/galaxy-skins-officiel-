import { rankMeta } from './ranks.js';
import { positionOf } from './leaderboard.js';
import { isAdminUser } from './admin.js';

export async function toPublicUser(user) {
  const meta = rankMeta(user.rankKey);
  const position = await positionOf(user.id);
  return {
    id: user.id,
    username: user.username,
    epicUsername: user.epicUsername || '',
    rankKey: user.rankKey || 'unranked',
    rankColor: meta.color,
    rankLabel: meta.label,
    rankSource: user.rankSource || 'none',
    role: user.role || 'Non défini',
    roleVerified: Boolean(user.roleVerified),
    staffRole: user.staffRole || 'Membre',
    badges: user.badges || [],
    notifications: user.notifications || [],
    hasDiscordLinked: Boolean(user.discordId),
    hasPassword: Boolean(user.passwordHash),
    position,
    avatarUrl: user.avatarUpdatedAt ? `/api/avatar?id=${user.id}&v=${user.avatarUpdatedAt}` : null,
    isAdmin: isAdminUser(user),
  };
}
