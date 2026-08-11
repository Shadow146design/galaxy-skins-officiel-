'use strict';

/* =========================================================
   Galaxy Sinks™ — membre.js
   Lit ?id=... dans l'URL et affiche la fiche correspondante
   depuis STAFF (staff-data.js). Nécessite common.js + interactions.js
   (pour les onglets et le carrousel).
   ========================================================= */

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

const id = new URLSearchParams(window.location.search).get('id');
const member = (typeof STAFF !== 'undefined' && id) ? STAFF[id] : null;

if (!member) {
  $('#memberNotFound').style.display = 'block';
} else {
  document.title = `${member.name} — Galaxy Sinks™`;
  $('#memberMain').style.display = 'block';

  const avatar = $('#memberAvatar');
  avatar.textContent = member.name[0];
  avatar.style.setProperty('--m-color', member.color);

  $('#memberTier').textContent = member.tier;
  $('#memberTier').style.setProperty('--m-color', member.color);
  $('#memberName').textContent = member.name;
  $('#memberRole').textContent = member.role;
  $('#memberTagline').textContent = member.tagline;

  if (member.links) {
    $('#memberLinks').innerHTML = Object.entries(member.links).map(([label, url]) => `
      <a href="${url}" target="_blank" rel="noopener">${label[0].toUpperCase()}${label.slice(1)}</a>
    `).join('');
  }

  $('#bioCarouselTrack').innerHTML = member.bioSlides.map((s) => `
    <article class="bio-slide">
      <div class="bio-slide-title">${escapeHtml(s.title)}</div>
      <p>${escapeHtml(s.text)}</p>
    </article>
  `).join('');

  const rl = member.rl || {};
  $('#rlInfoGrid').innerHTML = `
    <div class="rl-info-card"><span class="rl-info-label">Rôle en jeu</span><span class="rl-info-value">${escapeHtml(rl.role || 'Non communiqué')}</span></div>
    <div class="rl-info-card"><span class="rl-info-label">Voiture favorite</span><span class="rl-info-value">${escapeHtml(rl.voiture || 'Non communiqué')}</span></div>
    <div class="rl-info-card"><span class="rl-info-label">Statut Discord</span><span class="rl-info-value">${escapeHtml(rl.discord || 'Membre du staff')}</span></div>
  `;
}