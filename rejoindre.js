'use strict';

/* =========================================================
   Galaxy Sinks™ — rejoindre.js
   Formulaire de candidature réel (POST /api/applications),
   visible seulement connecté — nécessaire pour pouvoir notifier le
   candidat sur son profil en cas d'acceptation. Nécessite common.js.
   ========================================================= */

async function populateRankSelect() {
  const select = $('#applyRankSelect');
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    select.innerHTML = (data.ranks || []).map((r) => `<option value="${r.key}">${r.label}</option>`).join('');
  } catch {
    select.innerHTML = '<option value="unranked">Non classé</option>';
  }
}

async function initApplyForm() {
  const loggedOutEl = $('#applyLoggedOut');
  const form = $('#applyForm');
  let currentUser = null;
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    currentUser = data.user;
  } catch { /* pas connecté */ }

  if (!currentUser) {
    loggedOutEl.classList.remove('hidden');
    form.classList.add('hidden');
    return;
  }
  loggedOutEl.classList.add('hidden');
  form.classList.remove('hidden');

  populateRankSelect();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#applyError');
    errEl.textContent = '';
    const fd = new FormData(e.target);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pseudo: fd.get('pseudo'),
          epicUsername: fd.get('epicUsername'),
          rankKey: fd.get('rankKey'),
          availability: fd.get('availability'),
          message: fd.get('message'),
        }),
      });
      const data = await res.json();
      if (!res.ok) { errEl.textContent = data.error || 'Envoi impossible.'; return; }

      e.target.querySelectorAll('label, button[type="submit"]').forEach((el) => el.style.display = 'none');
      $('#applySuccess').classList.add('show');
    } catch {
      errEl.textContent = 'Erreur réseau. Réessaie.';
    }
  });
}
initApplyForm();
