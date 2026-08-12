'use strict';

/* =========================================================
   Galaxy Sinks™ — script.js
   Logique spécifique à la page d'accueil : compteurs, classement,
   authentification. Nécessite common.js (chargé avant ce fichier).
   ========================================================= */

/* ---------------------------------------------------------
   Reveal du podium au scroll (et non dès que les données arrivent —
   le podium se charge quasi instantanément au chargement de la page,
   bien avant que le visiteur n'ait scrollé jusqu'à la section).
   Observer unique et persistant : #podium reste le même élément DOM
   même quand son contenu est régénéré par loadLeaderboard().
   ("reduceMotion" est déjà déclaré globalement par interactions.js,
   chargé avant ce script.)
   --------------------------------------------------------- */
const podiumRevealObserver = (!reduceMotion && 'IntersectionObserver' in window)
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        podiumRevealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2 })
  : null;

/* ---------------------------------------------------------
   Carte galaxie du staff — chaque membre est un point cliquable
   qui ouvre sa page de profil (membre.html?id=...). Nécessite
   staff-data.js (objet STAFF), chargé avant ce fichier.
   --------------------------------------------------------- */
function renderStaffGalaxy() {
  const galaxy = $('#staffGalaxy');
  const linesSvg = $('#staffGalaxyLines');
  if (!galaxy || typeof STAFF === 'undefined') return;

  const entries = Object.entries(STAFF);
  const hubId = 'insane'; // point central, relié à tous les autres
  const hub = STAFF[hubId];

  // Lignes de constellation reliant le hub aux autres membres
  linesSvg.innerHTML = entries
    .filter(([id]) => id !== hubId)
    .map(([, m]) => `<line x1="${hub.x}" y1="${hub.y}" x2="${m.x}" y2="${m.y}" />`)
    .join('');

  // Points cliquables
  const nodesHtml = entries.map(([id, m]) => `
    <a class="galaxy-node size-${m.size}" href="membre.html?id=${id}" style="left:${m.x}%; top:${m.y}%; --n-color:${m.color}">
      <span class="galaxy-node-ring"></span>
      <span class="galaxy-node-dot"></span>
      <span class="galaxy-node-label">${m.name}<small>${m.role}</small></span>
    </a>
  `).join('');
  galaxy.insertAdjacentHTML('beforeend', nodesHtml);
}
renderStaffGalaxy();

/* ---------------------------------------------------------
   Carte "Actualités" — statut du match en cours + prochain événement
   --------------------------------------------------------- */
async function loadActuCard() {
  const grid = $('#actuNewsGrid');
  let cards = '';
  try {
    const res = await fetch('/api/live-match');
    const live = await res.json();
    if (live.isLive) {
      cards += `
        <article class="glass-card glass-card-live">
          <span class="badge badge-live">● Match en cours</span>
          <h3>Galaxy Sinks™ vs ${escapeHtml(live.opponent || 'adversaire à confirmer')}</h3>
          ${live.streamUrl ? `<p class="news-date"><a href="${live.streamUrl}" target="_blank" rel="noopener" style="color:var(--cyan)">Regarder le stream →</a></p>` : ''}
        </article>
      `;
    }
  } catch { /* silencieux */ }

  cards += `
    <article class="glass-card">
      <span class="badge">Événement</span>
      <h3>Tournoi Grand Champion (1v1)</h3>
      <p class="news-date">Voir le calendrier complet pour la date exacte</p>
    </article>
  `;
  grid.innerHTML = cards;
}
loadActuCard();

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10);
    let current = 0;
    const step = Math.max(1, Math.round(target / 40));
    const tick = () => {
      current = Math.min(target, current + step);
      el.textContent = current;
      if (current < target) requestAnimationFrame(tick);
    };
    tick();
    statObserver.unobserve(el);
  });
}, { threshold: 0.5 });
$$('.stat-number').forEach((el) => statObserver.observe(el));

/* ---------------------------------------------------------
   4. Rangs — table de couleurs partagée avec le serveur
   --------------------------------------------------------- */
let RANKS = []; // rempli par /api/leaderboard
let podiumCelebrated = false; // confetti/carillon une seule fois par visite

function rankColor(key) {
  const r = RANKS.find((x) => x.key === key);
  return r ? r.color : '#6c7086';
}
function rankLabel(key) {
  const r = RANKS.find((x) => x.key === key);
  return r ? r.label : 'Non classé';
}

/* ---------------------------------------------------------
   5. Classement — chargement + rendu
   --------------------------------------------------------- */
async function loadLeaderboard() {
  const podiumEl = $('#podium');
  const listEl = $('#leaderboardList');
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    RANKS = data.ranks || [];
    const board = data.leaderboard || [];

    if (board.length === 0) {
      podiumEl.innerHTML = '';
      listEl.innerHTML = '<div class="leaderboard-empty">Aucun membre inscrit pour le moment. Sois le premier à rejoindre le classement !</div>';
      return;
    }

    const top3 = board.slice(0, 3);
    const rest = board.slice(3);
    const meId = currentUser ? currentUser.id : null;

    const crowns = ['👑', '', ''];
    podiumEl.innerHTML = top3.map((u, i) => {
      const place = i + 1;
      const isSelf = u.id === meId;
      return `
        <div class="podium-slot rank-${place}${isSelf ? ' podium-self' : ''}">
          ${place === 1 ? '<span class="podium-crown">👑</span>' : ''}
          <div class="podium-avatar">
            ${avatarInner(u)}
            <span class="podium-rank-badge" style="color:${place === 1 ? 'var(--gold)' : place === 2 ? '#c7cbd8' : '#c9835f'}">${place}</span>
          </div>
          <div class="podium-name">${escapeHtml(u.username)}${isSelf ? ' (toi)' : ''}</div>
          <span class="rank-chip" style="color:${u.rankColor}">${escapeHtml(u.rankLabel)}</span>
        </div>
      `;
    }).join('');
    // Révèle le podium quand il entre dans le viewport plutôt que dès que
    // les données arrivent (voir l'observer déclaré en haut du fichier).
    // Si le podium est déjà révélé (rechargement du classement après
    // connexion par ex.), les nouveaux podium-slot réapparaissent tout
    // seuls via la règle CSS scopée ".podium.in-view .podium-slot".
    if (!podiumEl.classList.contains('in-view')) {
      if (podiumRevealObserver) podiumRevealObserver.observe(podiumEl);
      else podiumEl.classList.add('in-view');
    }

    // Petite célébration à la première apparition du podium sur cette visite.
    if (!podiumCelebrated) {
      podiumCelebrated = true;
      const firstSlot = podiumEl.querySelector('.rank-1');
      setTimeout(() => {
        if (window.fireConfetti) window.fireConfetti(firstSlot);
      }, 350);
    }

    if (rest.length === 0) {
      listEl.innerHTML = '';
    } else {
      listEl.innerHTML = rest.map((u, i) => {
        const place = i + 4;
        const isSelf = u.id === meId;
        return `
          <div class="leaderboard-list-row${isSelf ? ' self-row' : ''}">
            <span class="llr-rank">#${place}</span>
            <span class="llr-avatar">${avatarInner(u)}</span>
            <span class="llr-name">${escapeHtml(u.username)}${isSelf ? ' (toi)' : ''}<span class="llr-epic">${escapeHtml(u.epicUsername)}</span></span>
            <span class="rank-chip" style="color:${u.rankColor}">${escapeHtml(u.rankLabel)}</span>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    podiumEl.innerHTML = '';
    listEl.innerHTML = '<div class="leaderboard-empty">Classement indisponible pour le moment. Réessaie dans un instant.</div>';
  }
}
function avatarInner(u) {
  return u.avatarUrl
    ? `<img src="${u.avatarUrl}" alt="">`
    : escapeHtml(u.username[0].toUpperCase());
}
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
loadLeaderboard();

/* ---------------------------------------------------------
   6. Authentification — modal connexion / inscription
   --------------------------------------------------------- */
const authOverlay = $('#authModalOverlay');
const profileOverlay = $('#profileModalOverlay');
let currentUser = null;

function openAuthModal(tab) {
  authOverlay.classList.add('open');
  switchTab(tab || 'login');
}
function closeAuthModal() { authOverlay.classList.remove('open'); }
function switchTab(tab) {
  $$('.modal-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  $('#loginForm').classList.toggle('hidden', tab !== 'login');
  $('#registerForm').classList.toggle('hidden', tab !== 'register');
}
$$('.modal-tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
$('#authModalClose').addEventListener('click', closeAuthModal);
authOverlay.addEventListener('click', (e) => { if (e.target === authOverlay) closeAuthModal(); });

$('#openLoginBtn').addEventListener('click', () => openAuthModal('login'));
$('#openRegisterBtn').addEventListener('click', () => openAuthModal('register'));

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#loginError');
  errEl.textContent = '';
  const fd = new FormData(e.target);
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Connexion impossible.'; return; }
    currentUser = data.user;
    closeAuthModal();
    renderAuthState();
    loadLeaderboard();
    showToast(`Content de te revoir, ${currentUser.username} !`, 'success');
  } catch {
    errEl.textContent = 'Erreur réseau. Réessaie.';
  }
});

$('#registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#registerError');
  errEl.textContent = '';
  const fd = new FormData(e.target);
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: fd.get('username'),
        epicUsername: fd.get('epicUsername'),
        password: fd.get('password'),
        rankKey: fd.get('rankKey') || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Inscription impossible.'; return; }
    currentUser = data.user;
    closeAuthModal();
    renderAuthState();
    showToast(`Bienvenue dans Galaxy Sinks™, ${currentUser.username} !`, 'success');
    // Laisse un court instant pour la tentative de récupération auto du rang côté serveur.
    setTimeout(loadLeaderboard, 1500);
  } catch {
    errEl.textContent = 'Erreur réseau. Réessaie.';
  }
});

/* ---------------------------------------------------------
   7. État connecté — widget + profil
   --------------------------------------------------------- */
function renderAuthState() {
  const navAuth = $('#navAuth');
  if (!currentUser) {
    navAuth.innerHTML = `
      <button class="btn btn-ghost" id="openLoginBtn">Connexion</button>
      <button class="btn btn-solid" id="openRegisterBtn">Créer un compte</button>
    `;
    $('#openLoginBtn').addEventListener('click', () => openAuthModal('login'));
    $('#openRegisterBtn').addEventListener('click', () => openAuthModal('register'));
    return;
  }
  const hasUnread = (currentUser.notifications || []).some((n) => !n.read);
  navAuth.innerHTML = `
    ${currentUser.isAdmin ? `<a class="btn btn-ghost" href="/admin">Admin</a>` : ''}
    <div class="member-pill" id="memberPill">
      <span class="member-avatar-wrap">
        <span class="member-avatar">${avatarInner(currentUser)}</span>
        ${hasUnread ? '<span class="member-notif-dot"></span>' : ''}
      </span>
      <span>${escapeHtml(currentUser.username)}</span>
      <span class="rank-dot" style="background:${currentUser.rankColor}"></span>
    </div>
  `;
  $('#memberPill').addEventListener('click', openProfileModal);
}

async function markNotificationRead(id) {
  try {
    const res = await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) return;
    currentUser = data.user;
    renderAuthState();
    renderProfileNotifications();
  } catch { /* silencieux */ }
}

function renderProfileNotifications() {
  const el = $('#profileNotifications');
  const notifications = (currentUser.notifications || []).filter((n) => !n.read);
  if (notifications.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = notifications.map((n) => `
    <div class="profile-notif" data-id="${n.id}">
      <p>${escapeHtml(n.message)}</p>
      <div class="profile-notif-actions">
        ${n.url ? `<a class="btn btn-solid" href="${n.url}" target="_blank" rel="noopener">Rejoindre le Discord</a>` : ''}
        <button class="btn btn-ghost profile-notif-dismiss" type="button">Marquer comme lu</button>
      </div>
    </div>
  `).join('');
  el.querySelectorAll('.profile-notif').forEach((card) => {
    const dismiss = () => markNotificationRead(card.dataset.id);
    card.querySelector('.profile-notif-dismiss').addEventListener('click', dismiss);
    const link = card.querySelector('a');
    if (link) link.addEventListener('click', dismiss);
  });
}

function openProfileModal() {
  if (!currentUser) return;
  renderProfileNotifications();
  $('#profileAvatarPreview').innerHTML = avatarInner(currentUser);
  $('#profileUsername').textContent = currentUser.username;
  $('#profileEpic').textContent = currentUser.epicUsername || '—';
  const rankChip = $('#profileRank');
  rankChip.textContent = currentUser.rankLabel;
  rankChip.style.color = currentUser.rankColor;
  $('#profileSource').textContent = currentUser.rankSource === 'tracker'
    ? 'Tracker Network (auto)'
    : currentUser.rankSource === 'manuel' ? 'Défini manuellement' : 'Non défini';
  $('#profilePosition').textContent = currentUser.position ? `#${currentUser.position}` : '—';
  $('#refreshError').textContent = '';

  const badgesEl = $('#profileBadges');
  badgesEl.innerHTML = (currentUser.badges || []).map((b) =>
    `<span class="badge-chip" style="color:${b.color}">${escapeHtml(b.label)}</span>`
  ).join('');

  $('#epicMissing').classList.toggle('show', !currentUser.epicUsername);
  $('#discordLinkMissing').classList.toggle('show', !currentUser.hasDiscordLinked);
  $('#currentPasswordInput').classList.toggle('hidden', !currentUser.hasPassword);
  $('#passwordError').textContent = '';
  $('#passwordForm').reset();
  $('#roleSelect').value = currentUser.role || 'Non défini';

  // Modérateur/Admin/Créateur ne sont attribuables que par le staff : si le
  // membre a déjà l'un de ces postes, on l'affiche en lecture seule plutôt
  // que de le laisser cliquer "Valider" et se rétrograder par erreur.
  const staffRoleSelect = $('#staffRoleSelect');
  const restrictedStaffRole = ['Modérateur', 'Admin', 'Créateur'].includes(currentUser.staffRole);
  staffRoleSelect.querySelectorAll('option[data-restricted]').forEach((o) => o.remove());
  if (restrictedStaffRole) {
    const opt = document.createElement('option');
    opt.textContent = currentUser.staffRole;
    opt.dataset.restricted = 'true';
    staffRoleSelect.prepend(opt);
  }
  staffRoleSelect.value = currentUser.staffRole || 'Membre';
  staffRoleSelect.disabled = restrictedStaffRole;
  $('#saveStaffRoleBtn').disabled = restrictedStaffRole;

  profileOverlay.classList.add('open');
}
$('#profileModalClose').addEventListener('click', () => profileOverlay.classList.remove('open'));
profileOverlay.addEventListener('click', (e) => { if (e.target === profileOverlay) profileOverlay.classList.remove('open'); });

/* ---------------------------------------------------------
   Photo de profil — redimensionnée côté client (canvas, 256×256,
   recadrage carré centré) avant envoi, pour rester légère et éviter
   les limites de taille des fonctions serverless.
   --------------------------------------------------------- */
function resizeImageToDataUrl(file, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('image_load_failed'));
    img.src = URL.createObjectURL(file);
  });
}

$('#changeAvatarBtn').addEventListener('click', () => $('#avatarFileInput').click());

$('#avatarFileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const errEl = $('#avatarError');
  errEl.textContent = '';

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    errEl.textContent = 'Formats acceptés : PNG, JPEG, WebP.';
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    errEl.textContent = 'Image trop lourde (8 Mo maximum avant redimensionnement).';
    return;
  }

  try {
    const dataUrl = await resizeImageToDataUrl(file, 256);
    const res = await fetch('/api/profile/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Envoi impossible.'; return; }
    currentUser = data.user;
    $('#profileAvatarPreview').innerHTML = avatarInner(currentUser);
    renderAuthState();
    loadLeaderboard();
    showToast('Photo de profil mise à jour.', 'success');
  } catch {
    errEl.textContent = 'Erreur lors du traitement de l\'image.';
  }
});

$('#saveRoleBtn').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/profile/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: $('#roleSelect').value }),
    });
    const data = await res.json();
    if (!res.ok) return;
    currentUser = data.user;
    renderAuthState();
    showToast('Rôle mis à jour.', 'success');
  } catch { /* silencieux */ }
});

$('#saveStaffRoleBtn').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/profile/staff-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffRole: $('#staffRoleSelect').value }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Erreur.', 'error'); return; }
    currentUser = data.user;
    renderAuthState();
    loadLeaderboard();
    showToast('Poste mis à jour.', 'success');
  } catch { /* silencieux */ }
});

$('#passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#passwordError');
  errEl.textContent = '';
  const newPassword = $('#newPasswordInput').value;
  const currentPassword = $('#currentPasswordInput').value;
  try {
    const res = await fetch('/api/profile/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Erreur.'; return; }
    $('#passwordForm').reset();
    showToast('Mot de passe mis à jour.', 'success');
  } catch {
    errEl.textContent = 'Erreur réseau. Réessaie.';
  }
});

$('#saveEpicBtn').addEventListener('click', async () => {
  const input = $('#epicUsernameInput');
  const errEl = $('#epicError');
  errEl.textContent = '';
  if (!input.value.trim()) { errEl.textContent = 'Entre un pseudo Epic Games.'; return; }
  try {
    const res = await fetch('/api/auth/epic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ epicUsername: input.value.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Erreur.'; return; }
    currentUser = data.user;
    input.value = '';
    renderAuthState();
    openProfileModal();
    loadLeaderboard();
  } catch {
    errEl.textContent = 'Erreur réseau. Réessaie.';
  }
});

$('#refreshRankBtn').addEventListener('click', async () => {
  const errEl = $('#refreshError');
  errEl.textContent = 'Recherche du profil sur Tracker Network…';
  errEl.style.color = 'var(--text-muted)';
  try {
    const res = await fetch('/api/rank/refresh', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      errEl.textContent = data.error || 'Échec de la récupération automatique.';
      errEl.style.color = 'var(--live)';
      return;
    }
    currentUser = data.user;
    errEl.textContent = 'Rang mis à jour automatiquement ✓';
    errEl.style.color = 'var(--cyan)';
    renderAuthState();
    openProfileModal();
    loadLeaderboard();
  } catch {
    errEl.textContent = 'Erreur réseau. Réessaie.';
    errEl.style.color = 'var(--live)';
  }
});

$('#manualRankBtn').addEventListener('click', async () => {
  const select = $('#manualRankSelect');
  try {
    const res = await fetch('/api/rank/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rankKey: select.value }),
    });
    const data = await res.json();
    if (!res.ok) return;
    currentUser = data.user;
    renderAuthState();
    openProfileModal();
    loadLeaderboard();
  } catch { /* silencieux */ }
});

$('#logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  profileOverlay.classList.remove('open');
  renderAuthState();
  loadLeaderboard();
});

$('#deleteAccountBtn').addEventListener('click', async () => {
  if (!confirm(`Supprimer définitivement ton compte ${currentUser.username} ? Cette action est irréversible.`)) return;
  try {
    const res = await fetch('/api/profile/delete', { method: 'POST' });
    if (!res.ok) { showToast('Erreur lors de la suppression. Réessaie.', 'error'); return; }
    currentUser = null;
    profileOverlay.classList.remove('open');
    renderAuthState();
    loadLeaderboard();
    showToast('Compte supprimé.', 'success');
  } catch {
    showToast('Erreur réseau. Réessaie.', 'error');
  }
});

/* ---------------------------------------------------------
   8. Restauration de session au chargement
   --------------------------------------------------------- */
async function bootstrapAuth() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    currentUser = data.user;
  } catch { currentUser = null; }
  renderAuthState();
  if (currentUser) loadLeaderboard(); // remet en avant la ligne du membre connecté

  // Ouvre automatiquement le profil si le membre vient de se connecter via
  // Discord et n'a pas encore renseigné son pseudo Epic Games.
  if (currentUser && !currentUser.epicUsername) {
    setTimeout(openProfileModal, 400);
  }
}

const discordErrorReason = new URLSearchParams(window.location.search).get('discord_error');
if (discordErrorReason) {
  window.addEventListener('load', () => {
    const message = discordErrorReason === 'already_linked'
      ? 'Ce compte Discord est déjà lié à un autre compte du site.'
      : 'La connexion via Discord a échoué. Réessaie, ou connecte-toi avec pseudo / mot de passe.';
    showToast(message, 'error');
  });
}

async function populateManualRankSelect() {
  // Attend que /api/leaderboard ait rempli RANKS
  const select = $('#manualRankSelect');
  if (RANKS.length === 0) await loadLeaderboard();
  select.innerHTML = RANKS.map((r) => `<option value="${r.key}">${r.label}</option>`).join('');

  const registerSelect = $('#registerRankSelect');
  if (registerSelect) {
    registerSelect.innerHTML =
      '<option value="">Laisser Tracker Network le détecter automatiquement</option>' +
      RANKS.filter((r) => r.key !== 'unranked').map((r) => `<option value="${r.key}">${r.label}</option>`).join('');
  }
}

bootstrapAuth().then(populateManualRankSelect);