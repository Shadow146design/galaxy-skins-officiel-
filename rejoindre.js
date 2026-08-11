'use strict';

/* =========================================================
   Galaxy Sinks™ — rejoindre.js
   Formulaire de candidature réel (POST /api/applications).
   Nécessite common.js.
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
populateRankSelect();

$('#applyForm').addEventListener('submit', async (e) => {
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