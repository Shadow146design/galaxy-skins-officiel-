'use strict';

/* =========================================================
   Galaxy Sinks™ — roster-presets.js
   Palette de couleurs et set d'icônes fixes utilisés pour les divisions
   du roster, partagés entre roster.js (affichage public) et admin.js
   (édition dans le panel admin). Doit rester synchronisé avec les clés
   valides côté serveur (netlify/lib/roster.js : ROSTER_ACCENTS/ROSTER_ICONS).
   ========================================================= */

const ROSTER_ACCENTS = [
  { key: 'gold', label: 'Or', css: 'var(--gold)' },
  { key: 'cyan', label: 'Cyan', css: 'var(--cyan)' },
  { key: 'nebula', label: 'Nébula', css: 'var(--nebula)' },
  { key: 'live', label: 'Rouge', css: 'var(--live)' },
  { key: 'green', label: 'Vert', css: '#4ade80' },
  { key: 'orange', label: 'Orange', css: '#ff9f43' },
  { key: 'pink', label: 'Rose', css: '#ff6bcb' },
  { key: 'blue', label: 'Bleu', css: '#4fa3ff' },
  { key: 'teal', label: 'Turquoise', css: '#2dd4bf' },
];

const ROSTER_ICON_SVGS = {
  star: '<path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z" fill="currentColor"/>',
  orbit: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  spiral: '<path d="M12 3a9 9 0 106.4 2.6" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="M12 7a5 5 0 103.5 1.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  hexagon: '<polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  triangle: '<polygon points="12,3 21,20 3,20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
};

const ROSTER_ICON_OPTIONS = [
  { key: 'star', label: 'Étoile' },
  { key: 'orbit', label: 'Orbite' },
  { key: 'spiral', label: 'Spirale' },
  { key: 'hexagon', label: 'Hexagone' },
  { key: 'triangle', label: 'Triangle' },
];

const ROSTER_GLOW_CLASSES = ['roster-glow-1', 'roster-glow-2', 'roster-glow-3', 'roster-glow-4', 'roster-glow-5'];

function rosterAccentCss(key) {
  const found = ROSTER_ACCENTS.find((a) => a.key === key);
  return found ? found.css : 'var(--cyan)';
}

function rosterIconSvg(key) {
  return ROSTER_ICON_SVGS[key] || ROSTER_ICON_SVGS.star;
}

function rosterGlowClass(index) {
  return ROSTER_GLOW_CLASSES[index % ROSTER_GLOW_CLASSES.length];
}
