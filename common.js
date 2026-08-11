'use strict';

/* =========================================================
   Galaxy Sinks™ — common.js
   Code partagé entre toutes les pages : fond étoilé, menu mobile,
   scrollspy de la navigation.
   ========================================================= */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ---------------------------------------------------------
   Nébuleuse ambiante — injectée avant le canvas étoilé pour
   rester dessous (ordre de peinture DOM).
   --------------------------------------------------------- */
document.body.insertAdjacentHTML('afterbegin',
  '<div class="ambient-nebula" aria-hidden="true"><span class="n1"></span><span class="n2"></span><span class="n3"></span></div>'
);

/* ---------------------------------------------------------
   Fond étoilé (canvas, ambiance discrète)
   --------------------------------------------------------- */
(function starfield() {
  const canvas = $('#starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  let shootingStars = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Les étoiles filantes ne traversent que le site principal, pas la boutique.
  const enableShootingStars = !document.body.classList.contains('shop-body') && !reduceMotion;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor((canvas.width * canvas.height) / 9000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.3 + 0.2,
      s: Math.random() * 0.25 + 0.03,
      tw: Math.random() * Math.PI * 2,
    }));
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---- Étoiles filantes : apparaissent de temps en temps ---- */
  function spawnShootingStar() {
    const goingRight = Math.random() < 0.5;
    const angle = (18 + Math.random() * 16) * (Math.PI / 180); // trajectoire diagonale douce
    const speed = 9 + Math.random() * 7;
    shootingStars.push({
      x: goingRight ? -40 : canvas.width + 40,
      y: Math.random() * canvas.height * 0.55,
      vx: (goingRight ? 1 : -1) * Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 90 + Math.random() * 70,
      life: 1,
    });
    scheduleNextShootingStar();
  }
  function scheduleNextShootingStar() {
    const delay = 6000 + Math.random() * 9000; // toutes les 6 à 15 secondes environ
    setTimeout(spawnShootingStar, delay);
  }
  if (enableShootingStars) scheduleNextShootingStar();

  function drawShootingStars() {
    shootingStars = shootingStars.filter((s) => s.life > 0 && s.x > -100 && s.x < canvas.width + 100);
    for (const s of shootingStars) {
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.012;

      const tailX = s.x - Math.cos(Math.atan2(s.vy, s.vx)) * s.len;
      const tailY = s.y - Math.sin(Math.atan2(s.vy, s.vx)) * s.len;
      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255,255,255,${s.life})`);
      grad.addColorStop(0.4, `rgba(180,200,255,${s.life * 0.5})`);
      grad.addColorStop(1, 'rgba(140,107,255,0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${s.life})`;
      ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const st of stars) {
      st.tw += 0.02;
      st.y += st.s;
      if (st.y > canvas.height) st.y = 0;
      const alpha = 0.4 + Math.sin(st.tw) * 0.35;
      ctx.beginPath();
      ctx.fillStyle = `rgba(230,235,255,${Math.max(0, alpha)})`;
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (enableShootingStars) drawShootingStars();
    if (!reduceMotion) requestAnimationFrame(draw);
  }
  draw();
})();

/* ---------------------------------------------------------
   Bandeau "match en cours" — visible sur toutes les pages
   --------------------------------------------------------- */
(async function liveMatchBanner() {
  const banner = $('#liveBanner');
  if (!banner) return;
  try {
    const res = await fetch('/api/live-match');
    const data = await res.json();
    if (!data.isLive) return;
    const textEl = $('#liveBannerText');
    const opponentText = data.opponent ? `Galaxy Sinks™ vs ${data.opponent}` : 'Match en cours';
    const noteText = data.note ? ` — ${data.note}` : '';
    textEl.innerHTML = `${opponentText}${noteText}`;
    if (data.streamUrl) {
      const link = document.createElement('a');
      link.href = data.streamUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Regarder le stream →';
      textEl.appendChild(document.createTextNode(' '));
      textEl.appendChild(link);
    }
    banner.classList.add('visible');
  } catch { /* pas de bandeau si l'API est indisponible */ }
})();

/* ---------------------------------------------------------
   Menu mobile
   --------------------------------------------------------- */
const navBurgerEl = $('#navBurger');
if (navBurgerEl) {
  navBurgerEl.addEventListener('click', () => {
    document.getElementById('mainNav').classList.toggle('open');
  });
}

/* ---------------------------------------------------------
   Scrollspy — actif uniquement pour les liens en # sur la page
   --------------------------------------------------------- */
(function scrollspy() {
  const navLinks = $$('.nav a');
  const sections = navLinks
    .filter((a) => a.getAttribute('href').startsWith('#'))
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (sections.length === 0) return;

  function onScrollSpy() {
    let current = sections[0];
    for (const sec of sections) {
      if (window.scrollY >= sec.offsetTop - 140) current = sec;
    }
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));
  }
  window.addEventListener('scroll', onScrollSpy);
  onScrollSpy();
})();