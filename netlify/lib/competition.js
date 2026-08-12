// Calendrier d'événements + historique des matchs — modifiables depuis le
// panel admin (voir admin-competition.js) sans toucher au code. Les listes
// ci-dessous ne servent que de valeur par défaut tant qu'aucun admin n'a
// encore enregistré de données personnalisées.

const DEFAULT_EVENTS = [
  { id: 'evt-1', name: 'Tournoi Grand Champion (1v1)', date: '2026-09-02T18:00', note: 'Bracket simple élimination' },
  { id: 'evt-2', name: 'Scrim amical vs RZN ESPORT', date: '2026-08-20T20:00', note: 'Best of 5, en interne Discord' },
];

const DEFAULT_MATCHES = [
  { id: 'm-1', date: '2026-08-04', opponent: 'RZN ESPORT', scoreFor: 3, scoreAgainst: 1 },
  { id: 'm-2', date: '2026-07-28', opponent: 'Nova Wolves', scoreFor: 2, scoreAgainst: 3 },
  { id: 'm-3', date: '2026-07-21', opponent: 'Static Order', scoreFor: 4, scoreAgainst: 0 },
  { id: 'm-4', date: '2026-07-14', opponent: 'Echo Circuit', scoreFor: 1, scoreAgainst: 3 },
  { id: 'm-5', date: '2026-07-07', opponent: 'Halo Union', scoreFor: 3, scoreAgainst: 2 },
];

export function defaultEvents() {
  return DEFAULT_EVENTS;
}

export function defaultMatches() {
  return DEFAULT_MATCHES;
}

// Résultat toujours déduit du score plutôt que stocké séparément, pour
// éviter qu'un admin modifie le score sans mettre à jour un champ
// "victoire/défaite" séparé et désynchronise les deux.
export function withResult(match) {
  return { ...match, result: match.scoreFor > match.scoreAgainst ? 'win' : 'loss' };
}

function randomId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeEvents(input) {
  if (!Array.isArray(input)) throw new Error('invalid_events');
  if (input.length > 50) throw new Error('too_many_events');

  return input.map((e) => {
    const name = String(e?.name || '').trim().slice(0, 80);
    if (!name) throw new Error('invalid_event_name');
    const date = String(e?.date || '').trim();
    if (!date || Number.isNaN(new Date(date).getTime())) throw new Error('invalid_event_date');
    const note = String(e?.note || '').trim().slice(0, 140);
    const id = e?.id ? String(e.id).slice(0, 60) : randomId('evt');
    return { id, name, date, note };
  });
}

export function normalizeMatches(input) {
  if (!Array.isArray(input)) throw new Error('invalid_matches');
  if (input.length > 200) throw new Error('too_many_matches');

  return input.map((m) => {
    const opponent = String(m?.opponent || '').trim().slice(0, 60);
    if (!opponent) throw new Error('invalid_match_opponent');
    const date = String(m?.date || '').trim();
    if (!date || Number.isNaN(new Date(date).getTime())) throw new Error('invalid_match_date');
    const scoreFor = Math.max(0, Math.min(99, Math.round(Number(m?.scoreFor)) || 0));
    const scoreAgainst = Math.max(0, Math.min(99, Math.round(Number(m?.scoreAgainst)) || 0));
    const id = m?.id ? String(m.id).slice(0, 60) : randomId('match');
    return { id, date, opponent, scoreFor, scoreAgainst };
  });
}
