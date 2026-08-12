'use strict';

/* =========================================================
   Galaxy Sinks™ — clips.js
   Nécessite common.js. Lecteur principal + pellicule de miniatures,
   alimentés par /api/clips (clips validés par le staff). Formulaire
   de soumission pour les membres connectés (/api/clips/submit).
   ========================================================= */

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

let CLIPS = [];
let visibleClips = [];
let clipsQuery = '';

const featuredVideo = $('#featuredVideo');
const featuredTitle = $('#featuredTitle');
const featuredDesc = $('#featuredDesc');
const replayCounter = $('#replayCounter');
const filmstripTrack = $('#filmstripTrack');
const replayStage = document.querySelector('.replay-stage');
const filmstripWrap = document.querySelector('.filmstrip-wrap');
const replayEmpty = $('#replayEmpty');

let activeIndex = 0;

function computeVisibleClips() {
  if (!clipsQuery) { visibleClips = CLIPS; return; }
  const q = clipsQuery.toLowerCase();
  visibleClips = CLIPS.filter((c) =>
    c.title.toLowerCase().includes(q) || (c.submitterUsername || '').toLowerCase().includes(q)
  );
}

function playClip(index, autoplay) {
  const clip = visibleClips[index];
  if (!clip) return;
  activeIndex = index;

  featuredVideo.pause();
  featuredVideo.src = clip.videoUrl;
  featuredTitle.textContent = clip.title;
  featuredDesc.textContent = clip.desc || `Envoyé par ${clip.submitterUsername}`;
  replayCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(visibleClips.length).padStart(2, '0')}`;

  filmstripTrack.querySelectorAll('.film-card').forEach((card, i) => {
    card.classList.toggle('active', i === index);
  });

  if (autoplay) featuredVideo.play().catch(() => { /* lecture bloquée sans interaction, ce n'est pas grave */ });
}

function renderFilmstrip() {
  computeVisibleClips();

  if (CLIPS.length === 0) {
    replayStage.style.display = 'none';
    filmstripWrap.style.display = 'none';
    replayEmpty.style.display = 'block';
    replayEmpty.textContent = 'Aucun clip pour le moment — les reprises vidéo de chaque but arriveront ici au fil des matchs.';
    return;
  }
  if (visibleClips.length === 0) {
    replayStage.style.display = 'none';
    filmstripWrap.style.display = 'none';
    replayEmpty.style.display = 'block';
    replayEmpty.textContent = 'Aucun clip ne correspond à ta recherche.';
    return;
  }
  replayStage.style.display = '';
  filmstripWrap.style.display = '';
  replayEmpty.style.display = 'none';

  filmstripTrack.innerHTML = visibleClips.map((c, i) => `
    <article class="film-card${i === 0 ? ' active' : ''}" data-index="${i}">
      <div class="film-sprockets">${'<span></span>'.repeat(8)}</div>
      <div class="film-thumb">
        <video src="${c.videoUrl}#t=0.1" preload="metadata" muted></video>
        <div class="film-play">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <div class="film-title">${escapeHtml(c.title)}</div>
      <div class="film-duration">Par ${escapeHtml(c.submitterUsername)}</div>
    </article>
  `).join('');

  filmstripTrack.querySelectorAll('.film-card').forEach((card) => {
    card.addEventListener('click', () => playClip(Number(card.dataset.index), true));
  });

  playClip(0, false);
}

async function loadClips() {
  try {
    const res = await fetch('/api/clips');
    const data = await res.json();
    CLIPS = data.clips || [];
  } catch {
    CLIPS = [];
  }
  renderFilmstrip();
}
loadClips();

const clipsSearchInput = $('#clipsSearchInput');
if (clipsSearchInput) {
  clipsSearchInput.addEventListener('input', () => {
    clipsQuery = clipsSearchInput.value.trim();
    renderFilmstrip();
  });
}

/* ---------------------------------------------------------
   Formulaire de soumission — visible seulement connecté.
   Le fichier vidéo est encodé en base64 côté client (aucune
   compression : la limite de 4 Mo vient du corps de requête
   des fonctions serverless, voir clips-submit.js).
   --------------------------------------------------------- */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(file);
  });
}

async function initSubmitForm() {
  const loggedOutEl = $('#submitClipLoggedOut');
  const form = $('#submitClipForm');
  let currentUser = null;
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    currentUser = data.user;
  } catch { /* pas connecté */ }

  if (!currentUser) {
    loggedOutEl.style.display = '';
    form.classList.add('hidden');
    return;
  }
  loggedOutEl.style.display = 'none';
  form.classList.remove('hidden');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#submitClipError');
    const statusEl = $('#submitClipStatus');
    const btn = $('#submitClipBtn');
    errEl.textContent = '';
    statusEl.textContent = '';

    const fd = new FormData(form);
    const file = fd.get('video');
    if (!file || !file.size) { errEl.textContent = 'Choisis un fichier vidéo.'; return; }
    if (file.size > 4 * 1024 * 1024) {
      errEl.textContent = 'Vidéo trop lourde — 4 Mo maximum. Raccourcis ou compresse le clip.';
      return;
    }

    btn.disabled = true;
    statusEl.textContent = 'Envoi en cours…';
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch('/api/clips/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: fd.get('title'), desc: fd.get('desc'), dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) { errEl.textContent = data.error || 'Envoi impossible.'; statusEl.textContent = ''; return; }
      statusEl.textContent = '';
      form.reset();
      if (window.showToast) window.showToast('Clip envoyé — en attente de validation par le staff.', 'success');
      else alert('Clip envoyé, en attente de validation par le staff.');
    } catch {
      errEl.textContent = 'Erreur réseau. Réessaie.';
    } finally {
      btn.disabled = false;
    }
  });
}
initSubmitForm();
