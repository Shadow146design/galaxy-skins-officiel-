'use strict';

/* =========================================================
   Galaxy Sinks™ — roster.js
   Nécessite common.js. Nav latérale par division + tableau des
   membres inscrits (basé sur le classement réel).
   ========================================================= */

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ---------------------------------------------------------
   Divisions du crew — à éditer directement par le staff.
   accent : couleur CSS utilisée pour la nav + le panneau.
   glowClass : motif de fond associé (voir roster.css).
   icon : petit glyphe SVG représentant la division.
   --------------------------------------------------------- */
const DIVISIONS = [
  {
    key: 'solar', name: 'SOLAR DIVISION', accent: 'var(--gold)', glowClass: 'glow-solar',
    players: ['Frizann', 'Itchy'],
    managerLabel: 'Manageur', managerName: 'M8 Nours',
    icon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  },
  {
    key: 'nova', name: 'NOVA DIVISION', accent: 'var(--cyan)', glowClass: 'glow-nova',
    players: ['Mr Ninii', 'Filou', 'Karnage'],
    managerLabel: 'Manageuse', managerName: 'Chelii coco',
    icon: '<path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" fill="currentColor"/>',
  },
  {
    key: 'vortex', name: 'VORTEX DIVISION', accent: 'var(--nebula)', glowClass: 'glow-vortex',
    players: ['Tagz_jojode', 'Tazg_Kaiser', 'Panda_off', 'Nayrox'],
    managerLabel: 'Manageuse', managerName: 'Chelii coco',
    icon: '<path d="M12 3a9 9 0 106.4 2.6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="M12 7a5 5 0 103.5 1.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  },
  {
    key: 'nixys', name: 'NIXYS DIVISION', accent: 'var(--nebula)', glowClass: 'glow-nixys',
    players: ['Fries', 'Pistache', 'Maek'],
    managerLabel: 'Manageuse', managerName: 'Chelii coco',
    icon: '<polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  },
  {
    key: 'alpha', name: 'ALPHA DIVISION', accent: 'var(--gold)', glowClass: 'glow-alpha',
    players: ['Mimi', 'Dark_angel', 'crystal'],
    managerLabel: null, managerName: null,
    icon: '<polygon points="12,3 21,20 3,20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  },
];

const divisionNav = $('#divisionNav');
const showcaseContent = $('#showcaseContent');
const showcaseGlow = $('#showcaseGlow');
const showcase = $('#divisionShowcase');

function renderNav() {
  divisionNav.innerHTML = DIVISIONS.map((d, i) => `
    <button class="division-tab${i === 0 ? ' active' : ''}" data-key="${d.key}" style="--tab-accent:${d.accent}">
      <span class="division-tab-icon"><svg viewBox="0 0 24 24">${d.icon}</svg></span>
      <span>${escapeHtml(d.name)}</span>
    </button>
  `).join('');

  divisionNav.querySelectorAll('.division-tab').forEach((tab) => {
    tab.addEventListener('click', () => selectDivision(tab.dataset.key));
  });
}

function selectDivision(key) {
  const division = DIVISIONS.find((d) => d.key === key);
  if (!division) return;

  divisionNav.querySelectorAll('.division-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.key === key);
  });

  showcase.style.setProperty('--tab-accent', division.accent);
  showcaseGlow.className = 'showcase-glow visible ' + division.glowClass;

  showcaseContent.innerHTML = `
    <p class="showcase-eyebrow">Division</p>
    <h2 class="showcase-name">${escapeHtml(division.name)}</h2>
    <div class="showcase-lineup">
      ${division.players.map((p, i) => `
        <span class="lineup-tag"><span class="lineup-tag-num">${String(i + 1).padStart(2, '0')}</span>${escapeHtml(p)}</span>
      `).join('')}
    </div>
    ${division.managerName ? `
      <div class="showcase-manager">
        <span class="showcase-manager-label">${escapeHtml(division.managerLabel)}</span>
        <span class="showcase-manager-name">${escapeHtml(division.managerName)}</span>
      </div>
    ` : ''}
  `;
}

renderNav();
selectDivision(DIVISIONS[0].key);

/* ---------------------------------------------------------
   Membres inscrits — tableau basé sur le classement réel,
   avec recherche par pseudo côté client.
   --------------------------------------------------------- */
let allMembers = [];

function renderMemberTable(list) {
  const body = $('#memberTableBody');
  if (list.length === 0) {
    body.innerHTML = allMembers.length === 0
      ? '<div class="roster-empty">Aucun membre inscrit pour le moment.</div>'
      : '<div class="roster-empty">Aucun membre ne correspond à ta recherche.</div>';
    return;
  }
  body.innerHTML = list.map((u) => `
    <div class="member-table-row">
      <span class="member-rank-num">#${u.position}</span>
      <span class="member-name-cell">
        <span class="member-mini-avatar">${
          u.avatarUrl ? `<img src="${u.avatarUrl}" alt="">` : escapeHtml(u.username[0].toUpperCase())
        }</span>
        ${escapeHtml(u.username)}
      </span>
      <span class="member-role-cell">
        ${u.staffRole && u.staffRole !== 'Membre' ? `<span class="badge badge-staff-role">${escapeHtml(u.staffRole)}</span> ` : ''}
        ${escapeHtml(u.role || 'Non défini')}${u.roleVerified ? ' <span class="role-verified-badge" title="Rôle vérifié par le staff">✓</span>' : ''}
      </span>
      <span class="rank-chip" style="color:${u.rankColor}">${escapeHtml(u.rankLabel)}</span>
      <a class="member-tracker-link" href="https://rocketleague.tracker.network/rocket-league/profile/epic/${encodeURIComponent(u.epicUsername)}/overview" target="_blank" rel="noopener">Tracker →</a>
    </div>
  `).join('');
}

async function loadMemberTable() {
  const body = $('#memberTableBody');
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    allMembers = (data.leaderboard || []).map((u, i) => ({ ...u, position: i + 1 }));
    renderMemberTable(allMembers);
  } catch {
    body.innerHTML = '<div class="roster-empty">Classement indisponible pour le moment.</div>';
  }
}
loadMemberTable();

const memberSearchInput = $('#memberSearchInput');
if (memberSearchInput) {
  memberSearchInput.addEventListener('input', () => {
    const q = memberSearchInput.value.trim().toLowerCase();
    if (!q) { renderMemberTable(allMembers); return; }
    renderMemberTable(allMembers.filter((u) =>
      u.username.toLowerCase().includes(q) || (u.epicUsername || '').toLowerCase().includes(q)
    ));
  });
}