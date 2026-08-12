const TIERS = [
  { name: 'Bronze', color: '#8a5a3c' },
  { name: 'Argent', color: '#adb1c4' },
  { name: 'Or', color: '#ffcf5c' },
  { name: 'Platine', color: '#4fd1c5' },
  { name: 'Diamant', color: '#5b8def' },
  { name: 'Champion', color: '#8c6bff' },
  { name: 'Grand Champion', color: '#ff8c5c' },
];
const DIVISIONS = ['I', 'II', 'III'];

function slug(name) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
}

export const RANKS = [
  { key: 'unranked', label: 'Non classé', color: '#6c7086', order: 0 },
  ...TIERS.flatMap((t, ti) =>
    DIVISIONS.map((d, di) => ({
      key: `${slug(t.name)}-${di + 1}`,
      label: `${t.name} ${d}`,
      color: t.color,
      order: ti * 3 + di + 1,
    }))
  ),
  { key: 'ssl', label: 'Légende Supersonique', color: '#ff4dd8', order: 999 },
];

const byKey = new Map(RANKS.map((r) => [r.key, r]));

export function rankMeta(key) {
  return byKey.get(key) || byKey.get('unranked');
}

export function rankIndex(key) {
  const r = byKey.get(key);
  return r ? r.order : 0;
}

export function isValidRankKey(key) {
  return byKey.has(key);
}

export function publicRanks() {
  return RANKS.map(({ key, label, color }) => ({ key, label, color }));
}
