'use strict';

/* =========================================================
   Galaxy Sinks™ — admin.js
   Nécessite common.js. Contrôle d'accès côté client (l'accès réel
   est appliqué par chaque fonction backend via la session) + les
   panneaux : modération clips, vérification des rôles, gestion des
   rosters, gestion de la compétition.
   ========================================================= */

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

async function checkAdminAccess() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.user && data.user.isAdmin) return true;
  } catch { /* ignore */ }
  return false;
}

/* ---------------------------------------------------------
   Compteurs (badge à côté d'un titre de panneau + résumé en haut
   de page). counts = { applications: n, clips: n }
   --------------------------------------------------------- */
const pendingCounts = { applications: 0, clips: 0 };

function setPanelCount(elId, n) {
  const el = $(elId);
  if (!el) return;
  if (n > 0) {
    el.textContent = n;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

function renderQuickStats() {
  const items = [
    { n: pendingCounts.applications, label: pendingCounts.applications > 1 ? 'candidatures en attente' : 'candidature en attente' },
    { n: pendingCounts.clips, label: pendingCounts.clips > 1 ? 'clips à modérer' : 'clip à modérer' },
  ].filter((i) => i.n > 0);

  const el = $('#adminQuickStats');
  if (items.length === 0) {
    el.innerHTML = '<span class="admin-quick-stat admin-quick-stat-ok">Tout est à jour ✓</span>';
    return;
  }
  el.innerHTML = items.map((i) => `<span class="admin-quick-stat">${i.n} ${i.label}</span>`).join('');
}

/* ---------------------------------------------------------
   Candidatures
   --------------------------------------------------------- */
let ranksByKey = null;
async function getRanksByKey() {
  if (ranksByKey) return ranksByKey;
  ranksByKey = {};
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    (data.ranks || []).forEach((r) => { ranksByKey[r.key] = r; });
  } catch { /* ignore */ }
  return ranksByKey;
}

const APP_STATUS_LABELS = { pending: 'En attente', accepted: 'Acceptée', rejected: 'Rejetée' };

async function loadAdminApplications() {
  const list = $('#adminApplicationsList');
  try {
    const [res, ranks] = await Promise.all([fetch('/api/admin/applications'), getRanksByKey()]);
    const data = await res.json();
    const applications = data.applications || [];
    pendingCounts.applications = applications.filter((a) => (a.status || 'pending') === 'pending').length;
    setPanelCount('#adminAppsCount', pendingCounts.applications);
    renderQuickStats();

    if (applications.length === 0) {
      list.innerHTML = '<p class="admin-empty">Aucune candidature pour le moment.</p>';
      return;
    }

    list.innerHTML = applications.map((a) => {
      const status = a.status || 'pending';
      const rank = ranks[a.rankKey] || { label: 'Non classé', color: '#6c7086' };
      return `
        <div class="app-card" data-id="${a.id}">
          <div class="app-card-top">
            <div class="app-card-identity">
              <strong>${escapeHtml(a.pseudo)}</strong>
              <span class="rank-chip" style="color:${rank.color}">${escapeHtml(rank.label)}</span>
            </div>
            <span class="admin-status-badge ${status}">${APP_STATUS_LABELS[status] || status}</span>
          </div>
          <div class="app-card-meta">
            <span>Epic : ${escapeHtml(a.epicUsername)}</span>
            ${a.availability ? `<span>Dispo : ${escapeHtml(a.availability)}</span>` : ''}
            <span>${new Date(a.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          ${a.message ? `<p class="app-card-message">${escapeHtml(a.message)}</p>` : ''}
          <div class="app-card-actions">
            <button class="btn btn-ghost app-accept-btn" ${status === 'accepted' ? 'disabled' : ''}>Accepter</button>
            <button class="btn btn-ghost app-reject-btn" ${status === 'rejected' ? 'disabled' : ''}>Rejeter</button>
            <button class="btn btn-ghost app-delete-btn">Supprimer</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.app-accept-btn').forEach((btn) => {
      btn.addEventListener('click', () => moderateApplication(btn.closest('.app-card').dataset.id, 'accept'));
    });
    list.querySelectorAll('.app-reject-btn').forEach((btn) => {
      btn.addEventListener('click', () => moderateApplication(btn.closest('.app-card').dataset.id, 'reject'));
    });
    list.querySelectorAll('.app-delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Supprimer définitivement cette candidature ?')) return;
        moderateApplication(btn.closest('.app-card').dataset.id, 'delete');
      });
    });
  } catch {
    list.innerHTML = '<p class="admin-empty">Erreur de chargement.</p>';
  }
}

async function moderateApplication(id, action) {
  try {
    const res = await fetch('/api/admin/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) return;
    const labels = { accept: 'Candidature acceptée.', reject: 'Candidature rejetée.', delete: 'Candidature supprimée.' };
    if (window.showToast) window.showToast(labels[action] || 'Mis à jour.', 'success');
    loadAdminApplications();
  } catch { /* silencieux */ }
}

/* ---------------------------------------------------------
   Modération des clips
   --------------------------------------------------------- */
async function loadAdminClips() {
  const list = $('#adminClipsList');
  try {
    const res = await fetch('/api/admin/clips');
    const data = await res.json();
    const clips = data.clips || [];
    pendingCounts.clips = clips.filter((c) => c.status === 'pending').length;
    setPanelCount('#adminClipsCount', pendingCounts.clips);
    renderQuickStats();
    if (clips.length === 0) {
      list.innerHTML = '<p class="admin-empty">Aucun clip soumis pour le moment.</p>';
      return;
    }
    list.innerHTML = clips.map((c) => `
      <div class="admin-clip-row" data-id="${c.id}">
        <video src="${c.videoUrl}" controls preload="metadata"></video>
        <div class="admin-clip-info">
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.desc || '—')}</p>
          <p>Par ${escapeHtml(c.submitterUsername)} · ${new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
          <span class="admin-clip-status ${c.status}">${c.status}</span>
        </div>
        <div class="admin-clip-actions">
          <button class="btn btn-ghost admin-approve-btn" ${c.status === 'approved' ? 'disabled' : ''}>Valider</button>
          <button class="btn btn-ghost admin-reject-btn" ${c.status === 'rejected' ? 'disabled' : ''}>Rejeter</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.admin-approve-btn').forEach((btn) => {
      btn.addEventListener('click', () => moderateClip(btn.closest('.admin-clip-row').dataset.id, 'approve'));
    });
    list.querySelectorAll('.admin-reject-btn').forEach((btn) => {
      btn.addEventListener('click', () => moderateClip(btn.closest('.admin-clip-row').dataset.id, 'reject'));
    });
  } catch {
    list.innerHTML = '<p class="admin-empty">Erreur de chargement.</p>';
  }
}

async function moderateClip(id, action) {
  try {
    const res = await fetch('/api/admin/clips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) return;
    if (window.showToast) window.showToast(action === 'approve' ? 'Clip validé.' : 'Clip rejeté.', 'success');
    loadAdminClips();
  } catch { /* silencieux */ }
}

/* ---------------------------------------------------------
   Vérification des rôles des membres
   --------------------------------------------------------- */
async function loadAdminRoles() {
  const list = $('#adminRolesList');
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    const members = data.leaderboard || [];
    if (members.length === 0) {
      list.innerHTML = '<p class="admin-empty">Aucun membre inscrit.</p>';
      return;
    }
    const ROLE_OPTIONS = ['Non défini', 'Attaquant', 'Défenseur', 'Flex / Polyvalent'];
    const STAFF_ROLE_OPTIONS = ['Membre', 'Recruteur', 'Coach', 'Manageur', 'Modérateur', 'Cyber Sécurité', 'Staff', 'Admin', 'Créateur'];

    list.innerHTML = members.map((u) => `
      <div class="admin-role-row" data-id="${u.id}">
        <strong>${escapeHtml(u.username)}</strong>
        <select class="admin-role-select">
          ${ROLE_OPTIONS.map((r) => `<option ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        <label class="admin-row-checkbox">
          <input type="checkbox" class="admin-role-verified-checkbox" ${u.roleVerified ? 'checked' : ''}>
          Vérifié
        </label>
        <select class="admin-staff-role-select" title="Poste dans l'organisation">
          ${STAFF_ROLE_OPTIONS.map((r) => `<option ${(u.staffRole || 'Membre') === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        <label class="admin-row-checkbox" ${u.isAdminHardcoded ? 'title="Admin par défaut (compte fondateur), non modifiable ici"' : ''}>
          <input type="checkbox" class="admin-is-admin-checkbox" ${u.isAdmin ? 'checked' : ''} ${u.isAdminHardcoded ? 'disabled' : ''}>
          Admin
        </label>
      </div>
    `).join('');

    list.querySelectorAll('.admin-role-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const userId = select.closest('.admin-role-row').dataset.id;
        try {
          const res = await fetch('/api/admin/set-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, role: select.value }),
          });
          const data = await res.json();
          if (!res.ok) { if (window.showToast) window.showToast(data.error || 'Erreur.', 'error'); return; }
          if (window.showToast) window.showToast('Rôle mis à jour.', 'success');
          const verifiedCb = select.closest('.admin-role-row').querySelector('.admin-role-verified-checkbox');
          if (verifiedCb) verifiedCb.checked = true; // le backend marque aussi vérifié
        } catch {
          if (window.showToast) window.showToast('Erreur réseau.', 'error');
        }
      });
    });

    list.querySelectorAll('.admin-staff-role-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const userId = select.closest('.admin-role-row').dataset.id;
        try {
          const res = await fetch('/api/admin/set-staff-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, staffRole: select.value }),
          });
          const data = await res.json();
          if (!res.ok) { if (window.showToast) window.showToast(data.error || 'Erreur.', 'error'); return; }
          if (window.showToast) window.showToast('Poste mis à jour.', 'success');
        } catch {
          if (window.showToast) window.showToast('Erreur réseau.', 'error');
        }
      });
    });

    list.querySelectorAll('.admin-role-verified-checkbox').forEach((cb) => {
      cb.addEventListener('change', async () => {
        const userId = cb.closest('.admin-role-row').dataset.id;
        try {
          await fetch('/api/admin/verify-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, verified: cb.checked }),
          });
          if (window.showToast) window.showToast('Statut de vérification mis à jour.', 'success');
        } catch { /* silencieux */ }
      });
    });

    list.querySelectorAll('.admin-is-admin-checkbox').forEach((cb) => {
      cb.addEventListener('change', async () => {
        const userId = cb.closest('.admin-role-row').dataset.id;
        const desired = cb.checked;
        try {
          const res = await fetch('/api/admin/set-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, isAdmin: desired }),
          });
          const data = await res.json();
          if (!res.ok) {
            cb.checked = !desired; // annule visuellement si le serveur a refusé
            if (window.showToast) window.showToast(data.error || 'Erreur.', 'error');
            return;
          }
          if (window.showToast) window.showToast(desired ? 'Droits admin accordés.' : 'Droits admin retirés.', 'success');
        } catch {
          cb.checked = !desired;
          if (window.showToast) window.showToast('Erreur réseau.', 'error');
        }
      });
    });
  } catch {
    list.innerHTML = '<p class="admin-empty">Erreur de chargement.</p>';
  }
}

/* ---------------------------------------------------------
   Gestion des rosters (divisions du crew)
   --------------------------------------------------------- */
let rosterDraft = [];

function readRosterDraftFromDom() {
  const rows = $('#adminRosterList').querySelectorAll('.admin-roster-row');
  rosterDraft = Array.from(rows).map((row) => ({
    key: row.dataset.key || '',
    name: row.querySelector('.roster-name-input').value,
    accentKey: row.querySelector('.roster-accent-select').value,
    iconKey: row.querySelector('.roster-icon-select').value,
    managerName: row.querySelector('.roster-manager-input').value,
    players: row.querySelector('.roster-players-textarea').value
      .split('\n').map((p) => p.trim()).filter(Boolean),
  }));
}

function renderRosterEditor() {
  const list = $('#adminRosterList');
  if (rosterDraft.length === 0) {
    list.innerHTML = '<p class="admin-empty">Aucune division. Clique sur « + Ajouter une division ».</p>';
    return;
  }
  list.innerHTML = rosterDraft.map((d, i) => `
    <div class="admin-roster-row" data-key="${escapeHtml(d.key || '')}" data-index="${i}">
      <div class="admin-roster-row-top">
        <input type="text" class="roster-name-input" placeholder="Nom de la division" value="${escapeHtml(d.name || '')}">
        <select class="roster-accent-select">
          ${ROSTER_ACCENTS.map((a) => `<option value="${a.key}" ${d.accentKey === a.key ? 'selected' : ''}>${a.label}</option>`).join('')}
        </select>
        <select class="roster-icon-select">
          ${ROSTER_ICON_OPTIONS.map((o) => `<option value="${o.key}" ${d.iconKey === o.key ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>
        <button type="button" class="btn btn-ghost admin-roster-delete-btn" title="Supprimer cette division">✕</button>
      </div>
      <input type="text" class="roster-manager-input" placeholder="Manageur (optionnel)" value="${escapeHtml(d.managerName || '')}">
      <textarea class="roster-players-textarea" placeholder="Un joueur par ligne" rows="3">${escapeHtml((d.players || []).join('\n'))}</textarea>
    </div>
  `).join('');

  list.querySelectorAll('.admin-roster-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      readRosterDraftFromDom();
      const index = Number(btn.closest('.admin-roster-row').dataset.index);
      rosterDraft.splice(index, 1);
      renderRosterEditor();
    });
  });
}

async function loadAdminRoster() {
  const list = $('#adminRosterList');
  try {
    const res = await fetch('/api/roster');
    const data = await res.json();
    rosterDraft = data.divisions || [];
    renderRosterEditor();
  } catch {
    list.innerHTML = '<p class="admin-empty">Erreur de chargement.</p>';
  }
}

$('#addRosterDivisionBtn').addEventListener('click', () => {
  readRosterDraftFromDom();
  rosterDraft.push({ key: '', name: '', accentKey: 'cyan', iconKey: 'star', managerName: '', players: [] });
  renderRosterEditor();
});

$('#saveRosterBtn').addEventListener('click', async () => {
  readRosterDraftFromDom();
  const errEl = $('#rosterError');
  errEl.textContent = '';
  try {
    const res = await fetch('/api/admin/roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ divisions: rosterDraft }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Erreur.'; return; }
    rosterDraft = data.divisions;
    renderRosterEditor();
    if (window.showToast) window.showToast('Rosters enregistrés.', 'success');
  } catch {
    errEl.textContent = 'Erreur réseau. Réessaie.';
  }
});

/* ---------------------------------------------------------
   Gestion de la compétition (événements à venir + résultats)
   --------------------------------------------------------- */
let eventsDraft = [];
let matchesDraft = [];

function readEventsDraftFromDom() {
  const rows = $('#adminEventsList').querySelectorAll('.admin-event-row');
  eventsDraft = Array.from(rows).map((row) => ({
    id: row.dataset.id || undefined,
    name: row.querySelector('.event-name-input').value,
    date: `${row.querySelector('.event-date-input').value}T${row.querySelector('.event-time-input').value || '00:00'}`,
    note: row.querySelector('.event-note-input').value,
  }));
}

function renderEventsEditor() {
  const list = $('#adminEventsList');
  if (eventsDraft.length === 0) {
    list.innerHTML = '<p class="admin-empty">Aucun événement. Clique sur « + Ajouter un événement ».</p>';
    return;
  }
  list.innerHTML = eventsDraft.map((e, i) => {
    const [datePart, timePart] = String(e.date || '').split('T');
    return `
      <div class="admin-comp-row admin-event-row" data-id="${escapeHtml(e.id || '')}" data-index="${i}">
        <input type="text" class="event-name-input" placeholder="Nom de l'événement" value="${escapeHtml(e.name || '')}">
        <input type="date" class="event-date-input" value="${escapeHtml(datePart || '')}">
        <input type="time" class="event-time-input" value="${escapeHtml((timePart || '').slice(0, 5))}">
        <input type="text" class="event-note-input" placeholder="Note (optionnel)" value="${escapeHtml(e.note || '')}">
        <button type="button" class="btn btn-ghost admin-comp-delete-btn" title="Supprimer">✕</button>
      </div>
    `;
  }).join('');

  list.querySelectorAll('.admin-comp-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      readEventsDraftFromDom();
      const index = Number(btn.closest('.admin-event-row').dataset.index);
      eventsDraft.splice(index, 1);
      renderEventsEditor();
    });
  });
}

function readMatchesDraftFromDom() {
  const rows = $('#adminMatchesList').querySelectorAll('.admin-match-row');
  matchesDraft = Array.from(rows).map((row) => ({
    id: row.dataset.id || undefined,
    date: row.querySelector('.match-date-input').value,
    opponent: row.querySelector('.match-opponent-input').value,
    scoreFor: Number(row.querySelector('.match-score-for-input').value) || 0,
    scoreAgainst: Number(row.querySelector('.match-score-against-input').value) || 0,
  }));
}

function renderMatchesEditor() {
  const list = $('#adminMatchesList');
  if (matchesDraft.length === 0) {
    list.innerHTML = '<p class="admin-empty">Aucun résultat. Clique sur « + Ajouter un résultat ».</p>';
    return;
  }
  list.innerHTML = matchesDraft.map((m, i) => `
    <div class="admin-comp-row admin-match-row" data-id="${escapeHtml(m.id || '')}" data-index="${i}">
      <input type="date" class="match-date-input" value="${escapeHtml(m.date || '')}">
      <input type="text" class="match-opponent-input" placeholder="Adversaire" value="${escapeHtml(m.opponent || '')}">
      <input type="number" class="match-score-for-input" min="0" max="99" value="${Number(m.scoreFor) || 0}">
      <span class="admin-match-vs">–</span>
      <input type="number" class="match-score-against-input" min="0" max="99" value="${Number(m.scoreAgainst) || 0}">
      <span class="admin-match-result-badge ${Number(m.scoreFor) > Number(m.scoreAgainst) ? 'win' : 'loss'}">${Number(m.scoreFor) > Number(m.scoreAgainst) ? 'V' : 'D'}</span>
      <button type="button" class="btn btn-ghost admin-comp-delete-btn" title="Supprimer">✕</button>
    </div>
  `).join('');

  list.querySelectorAll('.match-score-for-input, .match-score-against-input').forEach((input) => {
    input.addEventListener('input', () => {
      const row = input.closest('.admin-match-row');
      const sf = Number(row.querySelector('.match-score-for-input').value) || 0;
      const sa = Number(row.querySelector('.match-score-against-input').value) || 0;
      const badge = row.querySelector('.admin-match-result-badge');
      badge.className = 'admin-match-result-badge ' + (sf > sa ? 'win' : 'loss');
      badge.textContent = sf > sa ? 'V' : 'D';
    });
  });

  list.querySelectorAll('.admin-comp-delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      readMatchesDraftFromDom();
      const index = Number(btn.closest('.admin-match-row').dataset.index);
      matchesDraft.splice(index, 1);
      renderMatchesEditor();
    });
  });
}

async function loadAdminCompetition() {
  try {
    const res = await fetch('/api/competition');
    const data = await res.json();
    eventsDraft = data.events || [];
    matchesDraft = (data.matches || []).map(({ id, date, opponent, scoreFor, scoreAgainst }) => (
      { id, date, opponent, scoreFor, scoreAgainst }
    ));
    renderEventsEditor();
    renderMatchesEditor();
  } catch {
    $('#adminEventsList').innerHTML = '<p class="admin-empty">Erreur de chargement.</p>';
    $('#adminMatchesList').innerHTML = '<p class="admin-empty">Erreur de chargement.</p>';
  }
}

$('#addEventBtn').addEventListener('click', () => {
  readEventsDraftFromDom();
  eventsDraft.push({ name: '', date: '', note: '' });
  renderEventsEditor();
});

$('#addMatchBtn').addEventListener('click', () => {
  readMatchesDraftFromDom();
  matchesDraft.push({ date: '', opponent: '', scoreFor: 0, scoreAgainst: 0 });
  renderMatchesEditor();
});

$('#saveCompetitionBtn').addEventListener('click', async () => {
  readEventsDraftFromDom();
  readMatchesDraftFromDom();
  const errEl = $('#competitionError');
  errEl.textContent = '';
  try {
    const res = await fetch('/api/admin/competition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsDraft, matches: matchesDraft }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Erreur.'; return; }
    eventsDraft = data.events;
    matchesDraft = data.matches;
    renderEventsEditor();
    renderMatchesEditor();
    if (window.showToast) window.showToast('Compétition mise à jour.', 'success');
  } catch {
    errEl.textContent = 'Erreur réseau. Réessaie.';
  }
});

(async function init() {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    $('#adminDenied').classList.remove('hidden');
    return;
  }
  $('#adminContent').classList.remove('hidden');
  loadAdminApplications();
  loadAdminClips();
  loadAdminRoles();
  loadAdminRoster();
  loadAdminCompetition();
})();
