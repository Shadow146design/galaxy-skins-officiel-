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
   Divisions du crew — chargées depuis /api/roster (gérées par le
   staff via le panel admin, voir admin.js). accentKey/iconKey sont
   résolus en couleur CSS / SVG via roster-presets.js.
   --------------------------------------------------------- */
let DIVISIONS = [];

const divisionNav = $('#divisionNav');
const showcaseContent = $('#showcaseContent');
const showcaseGlow = $('#showcaseGlow');
const showcase = $('#divisionShowcase');

function renderNav() {
  divisionNav.innerHTML = DIVISIONS.map((d, i) => `
    <button class="division-tab${i === 0 ? ' active' : ''}" data-key="${d.key}" style="--tab-accent:${rosterAccentCss(d.accentKey)}">
      <span class="division-tab-icon"><svg viewBox="0 0 24 24">${rosterIconSvg(d.iconKey)}</svg></span>
      <span>${escapeHtml(d.name)}</span>
    </button>
  `).join('');

  divisionNav.querySelectorAll('.division-tab').forEach((tab) => {
    tab.addEventListener('click', () => selectDivision(tab.dataset.key));
  });
}

function selectDivision(key) {
  const index = DIVISIONS.findIndex((d) => d.key === key);
  const division = DIVISIONS[index];
  if (!division) return;

  divisionNav.querySelectorAll('.division-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.key === key);
  });

  showcase.style.setProperty('--tab-accent', rosterAccentCss(division.accentKey));
  showcaseGlow.className = 'showcase-glow visible ' + rosterGlowClass(index);

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

async function loadDivisions() {
  try {
    const res = await fetch('/api/roster');
    const data = await res.json();
    DIVISIONS = data.divisions || [];
  } catch {
    DIVISIONS = [];
  }
  if (DIVISIONS.length === 0) {
    divisionNav.innerHTML = '';
    showcaseContent.innerHTML = '<p class="showcase-eyebrow">Aucune division pour le moment.</p>';
    return;
  }
  renderNav();
  selectDivision(DIVISIONS[0].key);
}
loadDivisions();

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