/*
 * Récupération best-effort du rang Rocket League depuis Tracker Network
 * (tracker.gg). Ce site protège son API officielle derrière une clé et du
 * rate-limiting agressif (Cloudflare) — sans clé, cet appel échoue souvent.
 * En cas d'échec, l'appelant doit permettre à l'utilisateur de définir son
 * rang manuellement (comportement identique à l'intention du site d'origine).
 */

const PLAYLIST_NAME_PATTERN = /ranked.*(3v3|standard)/i;

export async function fetchTrackerRank(epicUsername) {
  if (!epicUsername) throw new Error('epic_username_required');

  const url = `https://api.tracker.gg/api/v2/rocket-league/standard/profile/epic/${encodeURIComponent(
    epicUsername
  )}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; GalaxySinksBot/1.0)',
    Accept: 'application/json',
  };
  if (process.env.TRACKER_GG_API_KEY) {
    headers['TRN-Api-Key'] = process.env.TRACKER_GG_API_KEY;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(res.status === 404 ? 'profile_not_found' : 'tracker_unavailable');
  }

  const data = await res.json();
  const segments = data?.data?.segments || [];
  const ranked =
    segments.find((s) => s.type === 'playlist' && PLAYLIST_NAME_PATTERN.test(s.metadata?.name || '')) ||
    segments.find((s) => s.type === 'playlist' && /ranked/i.test(s.metadata?.name || ''));

  const tierName = ranked?.stats?.tier?.metadata?.name;
  const divisionNum = ranked?.stats?.division?.metadata?.name;
  if (!tierName) throw new Error('rank_not_found');

  return trackerTierToRankKey(tierName, divisionNum);
}

const TIER_SLUG = {
  bronze: 'bronze',
  silver: 'argent',
  gold: 'or',
  platinum: 'platine',
  diamond: 'diamant',
  champion: 'champion',
  'grand champion': 'championelite',
  'supersonic legend': 'ssl',
};

function trackerTierToRankKey(tierName, divisionLabel) {
  const key = tierName.toLowerCase().trim();
  if (key === 'unranked' || key === 'not ranked') return 'unranked';
  if (key === 'supersonic legend') return 'ssl';

  const slug = TIER_SLUG[key];
  if (!slug) return 'unranked';

  let division = 1;
  const match = /(I{1,3}|IV|1|2|3)/.exec(divisionLabel || '');
  if (match) {
    const map = { I: 1, II: 2, III: 3, IV: 3, '1': 1, '2': 2, '3': 3 };
    division = map[match[1]] || 1;
  }
  return `${slug}-${division}`;
}
