'use strict';

/* =========================================================
   Galaxy Sinks™ — admin.js
   Nécessite common.js. Contrôle d'accès côté client (l'accès réel
   est appliqué par chaque fonction backend via la session) + les
   trois panneaux : bandeau match, modération clips, vérification
   des rôles.
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
   Bandeau "match en cours"
   --------------------------------------------------------- */
async function initLiveMatchPanel() {
  try {
    const res = await fetch('/api/live-match');
    const data = await res.json();
    $('#liveMatchIsLive').checked = Boolean(data.isLive);
    $('#liveMatchOpponent').value = data.opponent || '';
    $('#liveMatchStreamUrl').value = data.streamUrl || '';
    $('#liveMatchNote').value = data.note || '';
  } catch { /* ignore */ }

  $('#liveMatchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#liveMatchError');
    errEl.textContent = '';
    try {
      const res = await fetch('/api/live-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isLive: $('#liveMatchIsLive').checked,
          opponent: $('#liveMatchOpponent').value,
          streamUrl: $('#liveMatchStreamUrl').value,
          note: $('#liveMatchNote').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) { errEl.textContent = data.error || 'Erreur.'; return; }
      if (window.showToast) window.showToast('Bandeau mis à jour.', 'success');
    } catch {
      errEl.textContent = 'Erreur réseau. Réessaie.';
    }
  });
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

(async function init() {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) {
    $('#adminDenied').classList.remove('hidden');
    return;
  }
  $('#adminContent').classList.remove('hidden');
  initLiveMatchPanel();
  loadAdminClips();
  loadAdminRoles();
})();
