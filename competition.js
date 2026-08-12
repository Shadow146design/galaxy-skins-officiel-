'use strict';

/* =========================================================
   Galaxy Sinks™ — competition.js
   Calendrier + historique des matchs chargés depuis /api/competition
   (gérés par le staff via /admin, voir admin.js) + dashboard (horloge
   LED, bandeau de stats, ticker de forme, calendrier / résultats).
   Nécessite common.js.
   ========================================================= */

let EVENTS = [];
let MATCHES = [];

/* ---------------------------------------------------------
   Horloge LED — compte à rebours vers le prochain événement
   --------------------------------------------------------- */
function renderCountdown() {
  const now = new Date();
  const upcoming = EVENTS
    .map((e) => ({ ...e, dateObj: new Date(e.date) }))
    .filter((e) => e.dateObj > now)
    .sort((a, b) => a.dateObj - b.dateObj)[0];

  if (!upcoming) {
    $('#countdownEvent').textContent = 'Aucun événement programmé';
    $('#countdownTimer').innerHTML = '';
    return;
  }

  $('#countdownEvent').textContent = upcoming.name;

  function tick() {
    const diff = Math.max(0, upcoming.dateObj - new Date());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    $('#countdownTimer').innerHTML = [
      [d, 'Jours'], [h, 'Heures'], [m, 'Min'], [s, 'Sec'],
    ].map(([val, label]) => `
      <div class="led-unit">
        <span class="led-digits">${String(val).padStart(2, '0')}</span>
        <span class="led-caption">${label}</span>
      </div>
    `).join('');
  }
  tick();
  setInterval(tick, 1000);
}

/* ---------------------------------------------------------
   Bandeau de stats — calculé à partir de MATCHES
   --------------------------------------------------------- */
function renderStats() {
  const wins = MATCHES.filter((m) => m.result === 'win').length;
  const losses = MATCHES.filter((m) => m.result === 'loss').length;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  let streak = 0;
  let streakType = MATCHES[0] ? MATCHES[0].result : null;
  for (const m of MATCHES) {
    if (m.result === streakType) streak++;
    else break;
  }

  $('#statsStrip').innerHTML = `
    <div class="stats-strip-item"><span class="stats-strip-num">${wins}</span><span class="stats-strip-label">Victoires</span></div>
    <div class="stats-strip-item"><span class="stats-strip-num">${losses}</span><span class="stats-strip-label">Défaites</span></div>
    <div class="stats-strip-item"><span class="stats-strip-num">${winRate}%</span><span class="stats-strip-label">Taux de victoire</span></div>
    <div class="stats-strip-item"><span class="stats-strip-num">${streak}</span><span class="stats-strip-label">${streakType === 'win' ? 'Victoires d’affilée' : 'Défaites d’affilée'}</span></div>
  `;
}

/* ---------------------------------------------------------
   Ticker de forme — 5 derniers matchs
   --------------------------------------------------------- */
function renderFormTicker() {
  const recent = MATCHES.slice(0, 5);
  $('#formTicker').innerHTML = recent.map((m) => `
    <span class="form-dot ${m.result}" title="vs ${m.opponent} — ${m.scoreFor}-${m.scoreAgainst}">${m.result === 'win' ? 'V' : 'D'}</span>
  `).join('');
}

/* ---------------------------------------------------------
   Calendrier — prochains matchs
   --------------------------------------------------------- */
function renderSchedule() {
  const now = new Date();
  const upcoming = EVENTS
    .map((e) => ({ ...e, dateObj: new Date(e.date) }))
    .filter((e) => e.dateObj > now)
    .sort((a, b) => a.dateObj - b.dateObj);

  const list = $('#scheduleList');
  if (upcoming.length === 0) {
    list.innerHTML = '<div class="roster-empty">Aucun événement à venir pour le moment.</div>';
    return;
  }
  list.innerHTML = upcoming.map((e) => `
    <div class="schedule-row">
      <span class="schedule-date">${e.dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
      <div class="schedule-info">
        <div class="schedule-name">${e.name}</div>
        <div class="schedule-time">${e.dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${e.note ? ' · ' + e.note : ''}</div>
      </div>
    </div>
  `).join('');
}

function renderResults() {
  const list = $('#resultsList');
  if (MATCHES.length === 0) {
    list.innerHTML = '<div class="roster-empty">Aucun match enregistré pour le moment.</div>';
    return;
  }
  const sorted = [...MATCHES].sort((a, b) => new Date(b.date) - new Date(a.date));
  list.innerHTML = sorted.map((m) => {
    const total = m.scoreFor + m.scoreAgainst || 1;
    const pct = Math.round((m.scoreFor / total) * 100);
    const d = new Date(m.date);
    return `
      <div class="result-row">
        <div class="result-top">
          <span class="result-opponent">Galaxy Sinks™ vs ${m.opponent}</span>
          <span class="result-tag ${m.result}">${m.result === 'win' ? 'Victoire' : 'Défaite'}</span>
        </div>
        <div class="result-bar">
          <div class="result-bar-fill" style="width:${pct}%; background:${m.result === 'win' ? 'var(--gold)' : 'var(--live)'}"></div>
        </div>
        <div class="result-score">${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} · ${m.scoreFor} – ${m.scoreAgainst}</div>
      </div>
    `;
  }).join('');
}

async function loadCompetition() {
  try {
    const res = await fetch('/api/competition');
    const data = await res.json();
    EVENTS = data.events || [];
    MATCHES = (data.matches || []).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch {
    EVENTS = [];
    MATCHES = [];
  }
  renderCountdown();
  renderStats();
  renderFormTicker();
  renderSchedule();
  renderResults();
}
loadCompetition();
