// Gestion des divisions/rosters du crew — modifiable depuis le panel admin
// (voir admin-roster.js) sans avoir besoin de toucher au code. La liste
// ci-dessous ne sert que de valeur par défaut tant qu'aucun admin n'a encore
// enregistré de roster personnalisé.

export const ROSTER_ACCENTS = ['gold', 'cyan', 'nebula', 'live', 'green', 'orange', 'pink', 'blue', 'teal'];
export const ROSTER_ICONS = ['star', 'orbit', 'spiral', 'hexagon', 'triangle'];

const DEFAULT_DIVISIONS = [
  {
    key: 'solar', name: 'SOLAR DIVISION', accentKey: 'gold', iconKey: 'orbit',
    players: ['Frizann', 'Itchy'],
    managerLabel: 'Manageur', managerName: 'M8 Nours',
  },
  {
    key: 'nova', name: 'NOVA DIVISION', accentKey: 'cyan', iconKey: 'star',
    players: ['Mr Ninii', 'Filou', 'Karnage'],
    managerLabel: 'Manageuse', managerName: 'Chelii coco',
  },
  {
    key: 'vortex', name: 'VORTEX DIVISION', accentKey: 'nebula', iconKey: 'spiral',
    players: ['Tagz_jojode', 'Tazg_Kaiser', 'Panda_off', 'Nayrox'],
    managerLabel: 'Manageuse', managerName: 'Chelii coco',
  },
  {
    key: 'nixys', name: 'NIXYS DIVISION', accentKey: 'nebula', iconKey: 'hexagon',
    players: ['Fries', 'Pistache', 'Maek'],
    managerLabel: 'Manageuse', managerName: 'Chelii coco',
  },
  {
    key: 'alpha', name: 'ALPHA DIVISION', accentKey: 'gold', iconKey: 'triangle',
    players: ['Mimi', 'Dark_angel', 'crystal'],
    managerLabel: '', managerName: '',
  },
];

export function defaultDivisions() {
  return DEFAULT_DIVISIONS;
}

function slugify(name) {
  return (
    (name || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30) || 'division'
  );
}

export function normalizeDivisions(input) {
  if (!Array.isArray(input)) throw new Error('invalid_divisions');
  if (input.length > 20) throw new Error('too_many_divisions');

  const usedKeys = new Set();
  return input.map((d) => {
    const name = String(d?.name || '').trim().slice(0, 40);
    if (!name) throw new Error('invalid_division_name');

    const base = slugify(d?.key || name);
    let key = base;
    let suffix = 1;
    while (usedKeys.has(key)) key = `${base}-${suffix++}`;
    usedKeys.add(key);

    const accentKey = ROSTER_ACCENTS.includes(d?.accentKey) ? d.accentKey : 'cyan';
    const iconKey = ROSTER_ICONS.includes(d?.iconKey) ? d.iconKey : 'star';
    const players = Array.isArray(d?.players)
      ? d.players.map((p) => String(p).trim().slice(0, 30)).filter(Boolean).slice(0, 20)
      : [];
    const managerName = d?.managerName ? String(d.managerName).trim().slice(0, 30) : '';
    const managerLabel = managerName
      ? String(d?.managerLabel || 'Manageur').trim().slice(0, 20)
      : '';

    return { key, name, accentKey, iconKey, players, managerLabel, managerName };
  });
}
