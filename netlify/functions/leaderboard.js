import { jsonResponse } from '../lib/response.js';
import { publicRanks } from '../lib/ranks.js';
import { computeLeaderboard } from '../lib/leaderboard.js';

export default async () => {
  const leaderboard = await computeLeaderboard();
  return jsonResponse({ ranks: publicRanks(), leaderboard });
};
