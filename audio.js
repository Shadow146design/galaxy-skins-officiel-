'use strict';

/* =========================================================
   Galaxy Sinks™ — audio.js
   Nappe spatiale ambiante synthétisée en Web Audio (aucun fichier
   audio nécessaire) + bouton toggle, inspirée du prototype 3D du
   crew. Coupée par défaut : l'utilisateur doit cliquer pour
   l'activer, à la fois par respect (pas de son surprise à
   l'arrivée sur le site) et parce que les navigateurs bloquent de
   toute façon l'audio sans geste utilisateur préalable.
   ========================================================= */

function createAmbientPad() {
  let ctx = null;
  let masterGain = null;
  let filter = null;
  let started = false;

  // Accord quinte-octave (racine, quinte, octave) en ondes sinus pures —
  // aucune harmonique agressive (contrairement à une dent de scie, qui
  // "grince" par nature). Registre choisi pour rester audible sur de
  // petits haut-parleurs sans pour autant être criard.
  const VOICES = [130.81, 196.0, 261.63];

  function build() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    ctx = new AudioContextClass();

    masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // Filtre très doux — de simples sinus n'ont pas d'harmoniques agressives
    // à couper, ce lowpass sert surtout à arrondir le très léger duvet
    // ajouté par le delay ci-dessous.
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    filter.Q.value = 0.3;

    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.55;
    const feedbackGain = ctx.createGain();
    feedbackGain.gain.value = 0.12;
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.12;

    filter.connect(masterGain);
    filter.connect(delay);
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(masterGain);

    VOICES.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 0.8 / VOICES.length;
      osc.connect(voiceGain).connect(filter);
      osc.start();
    });

    // LFO très lent et discret qui fait à peine "respirer" le filtre —
    // juste assez pour que la texture ne soit pas parfaitement statique,
    // sans jamais devenir perceptible comme un vibrato.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.035;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    return true;
  }

  function start() {
    if (!ctx && !build()) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch((err) => console.warn('[GalaxySinksAudio] resume() a échoué :', err));
    }
    if (started) return;
    started = true;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2.2);
  }

  function stop() {
    if (!ctx || !started) return;
    const now = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(0, now + 0.6);
    started = false;
  }

  /* Petit carillon triomphal à trois notes — utilisé pour le podium du
     classement quand il apparaît (voir script.js). Silencieux si la nappe
     n'a pas été activée par l'utilisateur. */
  function playChime() {
    if (!ctx || !started) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      osc.connect(gain).connect(masterGain);
      osc.start(t);
      osc.stop(t + 1.15);
    });
  }

  return { start, stop, playChime, isRunning: () => started };
}

window.GalaxySinksAudio = createAmbientPad();

(function audioToggle() {
  const STORAGE_KEY = 'gs_audio_enabled';
  // Activée par défaut (comme le prototype 3D) — seule une coupure
  // explicite via le bouton la désactive pour de bon.
  let enabled = localStorage.getItem(STORAGE_KEY) !== '0';

  document.body.insertAdjacentHTML('beforeend', `
    <button class="audio-toggle" id="audioToggleBtn" type="button" aria-label="Activer/couper l'ambiance sonore" title="Ambiance sonore">
      <svg viewBox="0 0 24 24" class="audio-icon audio-icon-on"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 010 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
      <svg viewBox="0 0 24 24" class="audio-icon audio-icon-off"><path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
    </button>
  `);

  const btn = document.getElementById('audioToggleBtn');

  function render() {
    btn.classList.toggle('is-muted', !enabled);
    btn.setAttribute('aria-pressed', String(enabled));
  }
  render();

  // Test direct et garanti : un clic sur ce bouton est toujours un geste
  // utilisateur valide, donc le son DOIT s'entendre ici si le moteur audio
  // fonctionne — utile pour isoler "le son ne se déclenche pas tout seul"
  // (détection du geste) de "le son ne marche pas du tout" (moteur audio).
  btn.addEventListener('click', () => {
    // Se base sur l'état RÉEL du moteur audio (isRunning), pas sur la seule
    // préférence "enabled" — sinon un premier clic avant tout scroll (donc
    // avant que le son ait jamais démarré) se lit à tort comme "déjà en
    // train de jouer, donc on coupe" puisque enabled vaut true par défaut.
    const isCurrentlyRunning = window.GalaxySinksAudio.isRunning();
    enabled = !isCurrentlyRunning;
    localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
    render();
    if (enabled) window.GalaxySinksAudio.start();
    else window.GalaxySinksAudio.stop();
    console.info('[GalaxySinksAudio] toggle bouton →', enabled ? 'ON' : 'OFF');
  });

  // Démarre à la première interaction. Note technique : l'événement "wheel"
  // seul NE compte PAS comme un geste utilisateur valide pour débloquer
  // l'audio dans Chrome/Firefox (liste des événements qui donnent
  // l'"activation utilisateur" côté spec HTML : clic, pointerdown, touch,
  // touche clavier — pas la molette). On écoute donc large : wheel/touch/
  // clavier restent en place (utiles sur tactile et clavier, où ça marche
  // vraiment), et on ajoute pointerdown/mousedown qui, eux, débloquent
  // fiablement l'audio dès le premier geste — souvent simultané ou juste
  // avant le premier scroll à la souris.
  const unlockEvents = ['wheel', 'scroll', 'touchstart', 'keydown', 'pointerdown', 'mousedown'];
  function unlockOnFirstInteraction(e) {
    // Le bouton gère lui-même son propre démarrage/arrêt via son handler
    // "click" ci-dessus — si on le laissait aussi déclencher ce handler
    // générique, "pointerdown" démarrerait le son puis "click" (juste
    // après, sur le même clic) le couperait aussitôt en le prenant pour
    // une bascule OFF. On l'ignore donc ici et on continue d'écouter.
    if (e.target && e.target.closest && e.target.closest('#audioToggleBtn')) return;
    unlockEvents.forEach((type) => window.removeEventListener(type, unlockOnFirstInteraction));
    console.info('[GalaxySinksAudio] déblocage auto sur événement :', e.type);
    if (enabled) window.GalaxySinksAudio.start();
  }
  if (enabled) {
    unlockEvents.forEach((type) => window.addEventListener(type, unlockOnFirstInteraction, { passive: true }));
  }
})();
