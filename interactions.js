'use strict';

/* =========================================================
   Galaxy Sinks™ — interactions.js
   Mécaniques partagées, chargées sur toutes les pages après
   common.js : ripple sur les boutons, reveal au scroll, onglets,
   accordéon, carrousel horizontal (drag + molette).
   ========================================================= */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------
   Ripple au clic sur les boutons
   --------------------------------------------------------- */
if (!reduceMotion) {
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

/* ---------------------------------------------------------
   Lueur qui suit le curseur sur les cartes interactives
   (déplacement throttlé à une frame via requestAnimationFrame).
   --------------------------------------------------------- */
if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  const glowSelector = '.glass-card, .stat-card, .podium-slot, .contact-card, ' +
    '.staff-card, .product-card, .roster-card, .division-card, ' +
    '.news-card, .fti-card, .clip-card';
  let glowRaf = null;
  let lastGlowEvent = null;
  document.addEventListener('pointermove', (e) => {
    lastGlowEvent = e;
    if (glowRaf) return;
    glowRaf = requestAnimationFrame(() => {
      glowRaf = null;
      const card = lastGlowEvent.target.closest(glowSelector);
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${lastGlowEvent.clientX - rect.left}px`);
      card.style.setProperty('--my', `${lastGlowEvent.clientY - rect.top}px`);
    });
  });
}

/* ---------------------------------------------------------
   Barre de progression de scroll + bouton retour en haut
   (injectés en JS : chrome partagé sur toutes les pages,
   pas besoin de dupliquer le markup dans chaque HTML).
   --------------------------------------------------------- */
(function scrollChrome() {
  document.body.insertAdjacentHTML('beforeend', `
    <div class="scroll-progress"><span class="scroll-progress-fill" id="scrollProgressFill"></span></div>
    <button class="to-top" id="toTopBtn" type="button" aria-label="Retour en haut">
      <svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    </button>
  `);

  const fill = document.getElementById('scrollProgressFill');
  const toTop = document.getElementById('toTopBtn');

  function onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    fill.style.height = pct + '%';
    toTop.classList.toggle('is-visible', doc.scrollTop > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();

/* ---------------------------------------------------------
   Notifications toast — window.showToast(message, type, duration)
   type : 'info' (défaut) | 'success' | 'error'
   --------------------------------------------------------- */
(function toastSystem() {
  let stack = null;
  function ensureStack() {
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    return stack;
  }
  const ICONS = {
    success: '<svg viewBox="0 0 24 24" class="toast-icon" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" class="toast-icon" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>',
    info: '<svg viewBox="0 0 24 24" class="toast-icon" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16v-4M12 8h.01"/><circle cx="12" cy="12" r="9"/></svg>',
  };
  window.showToast = function showToast(message, type, duration) {
    const kind = ICONS[type] ? type : 'info';
    const el = ensureStack();
    const toast = document.createElement('div');
    toast.className = `toast toast-${kind}`;
    toast.innerHTML = ICONS[kind];
    const span = document.createElement('span');
    span.textContent = message;
    toast.appendChild(span);
    el.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, duration || 4200);
  };
})();

/* ---------------------------------------------------------
   Confetti — window.fireConfetti(originEl?, count?)
   Petite salve de particules DOM (pas de canvas), centrée sur un
   élément donné ou sur le centre de l'écran par défaut.
   --------------------------------------------------------- */
window.fireConfetti = function fireConfetti(originEl, count) {
  if (reduceMotion) return;
  const rect = originEl ? originEl.getBoundingClientRect() : null;
  const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
  const colors = ['#ffcf5c', '#3fe0ff', '#8c6bff', '#ff5c7a'];
  const container = document.createElement('div');
  container.className = 'confetti-burst';
  document.body.appendChild(container);

  for (let i = 0; i < (count || 26); i++) {
    const piece = document.createElement('span');
    const angle = Math.random() * Math.PI * 2;
    const distance = 60 + Math.random() * 140;
    piece.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    piece.style.setProperty('--dy', `${Math.sin(angle) * distance - 40}px`);
    piece.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.15}s`;
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 1700);
};

/* ---------------------------------------------------------
   Reveal au scroll — s'applique automatiquement aux cartes,
   y compris celles ajoutées dynamiquement après coup (classement,
   boutique, roster...), via un MutationObserver.
   --------------------------------------------------------- */
const REVEAL_SELECTOR = '.staff-card, .product-card, .roster-card, .division-card, ' +
  '.news-card, .stat-card, .fti-card, .clip-card, .match-row, ' +
  '.story-teaser, .countdown-panel, .apply-form, .accordion-item, .event-card, ' +
  '.contact-card, .leaderboard-list-row, .member-table-row, .film-card, ' +
  '.schedule-row, .result-row, .rl-info-card, .staff-galaxy, .glass-card';

(function scrollReveal() {
  const selector = REVEAL_SELECTOR;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll(selector).forEach((el) => el.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => entry.target.classList.add('in-view'), (i % 6) * 110);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  function bindNew(root) {
    root.querySelectorAll(selector).forEach((el) => {
      if (el.dataset.revealBound) return;
      el.dataset.revealBound = '1';
      io.observe(el);
    });
  }
  bindNew(document);

  // Les pages chargent leurs cartes (classement, boutique, roster...) de
  // façon asynchrone après ce script : on capte les ajouts au fil de l'eau.
  const mo = new MutationObserver(() => bindNew(document));
  mo.observe(document.body, { childList: true, subtree: true });
})();

/* ---------------------------------------------------------
   Onglets — <div class="tabs"><div class="tabs-nav">
     <button class="tab-btn" data-tab="x">...</button>
   </div><div class="tab-panel" data-tab-panel="x">...</div></div>
   --------------------------------------------------------- */
(function initTabs() {
  const revealSelector = REVEAL_SELECTOR;

  document.querySelectorAll('.tabs').forEach((tabs) => {
    const buttons = tabs.querySelectorAll('.tab-btn');
    const panels = tabs.querySelectorAll('.tab-panel');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.toggle('active', b === btn));
        panels.forEach((p) => p.classList.toggle('active', p.dataset.tabPanel === btn.dataset.tab));
        // Un onglet caché (display:none) ne peut pas déclencher l'observer
        // de scroll : on force l'apparition de son contenu à l'ouverture.
        const activePanel = tabs.querySelector('.tab-panel.active');
        if (activePanel) {
          activePanel.querySelectorAll(revealSelector).forEach((el) => el.classList.add('in-view'));
        }
      });
    });
  });
})();

/* ---------------------------------------------------------
   Accordéon — <div class="accordion-item"><button class=
   "accordion-trigger">...</button><div class="accordion-body">
   <div class="accordion-body-inner">...</div></div></div>
   --------------------------------------------------------- */
(function initAccordion() {
  document.querySelectorAll('.accordion-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('open');

      // Ferme les autres items du même accordéon (comportement classique).
      const parent = item.parentElement;
      parent.querySelectorAll('.accordion-item.open').forEach((other) => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.accordion-body').style.maxHeight = '';
        }
      });

      item.classList.toggle('open', !isOpen);
      body.style.maxHeight = !isOpen ? body.scrollHeight + 'px' : '';
    });
  });
})();

/* ---------------------------------------------------------
   Carrousel horizontal — drag à la souris + molette + flèches
   --------------------------------------------------------- */
(function initCarousels() {
  document.querySelectorAll('.carousel-track').forEach((track) => {
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;

    track.addEventListener('pointerdown', (e) => {
      isDown = true;
      startX = e.clientX;
      scrollStart = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      track.scrollLeft = scrollStart - (e.clientX - startX);
    });
    track.addEventListener('pointerup', () => { isDown = false; });
    track.addEventListener('pointercancel', () => { isDown = false; });

    track.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }, { passive: false });

    const carousel = track.closest('.carousel');
    if (!carousel) return;
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    const step = () => Math.min(320, track.clientWidth * 0.7);
    if (prevBtn) prevBtn.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    if (nextBtn) nextBtn.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
  });
})();