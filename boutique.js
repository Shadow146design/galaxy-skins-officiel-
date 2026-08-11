'use strict';

/* =========================================================
   Galaxy Sinks™ — boutique.js
   Produits, filtres, panier (localStorage), commande via Discord.
   Nécessite common.js (chargé avant ce fichier).
   ========================================================= */

const DISCORD_INVITE = 'https://discord.gg/qdvY4hEHqT';
const CONTACT_EMAIL = 'galaxy.sinks8@gmail.com';
const CART_KEY = 'galaxysinks_cart';

/* ---------------------------------------------------------
   1. Catalogue — visuels en SVG plat, pas d'images externes
   --------------------------------------------------------- */
const RARITY = {
  legendaire: { label: 'Légendaire', colors: ['#ffcf5c', '#ff9f4a', '#fff3c4'], glow: 'rgba(255,207,92,.55)' },
  epique:     { label: 'Épique',     colors: ['#c86bff', '#8c6bff', '#ffd6ff'], glow: 'rgba(140,107,255,.55)' },
  rare:       { label: 'Rare',       colors: ['#3fe0ff', '#5b8cff', '#d6f7ff'], glow: 'rgba(63,224,255,.5)' },
  commune:    { label: 'Commune',    colors: ['#c7cbd8', '#8b90ac', '#eef0fb'], glow: 'rgba(199,203,216,.35)' },
};

const ICONS = {
  jersey: `<svg viewBox="0 0 100 100"><path d="M30 12 L10 26 L20 40 L30 34 L30 88 L70 88 L70 34 L80 40 L90 26 L70 12 Q60 22 50 22 Q40 22 30 12Z" fill="#eef0fb"/><circle cx="50" cy="18" r="6" fill="#05060f"/></svg>`,
  hoodie: `<svg viewBox="0 0 100 100"><path d="M32 10 Q50 -2 68 10 L84 22 L76 36 L68 30 L68 90 L32 90 L32 30 L24 36 L16 22 Z" fill="#eef0fb"/><circle cx="50" cy="16" r="8" fill="none" stroke="#05060f" stroke-width="3"/></svg>`,
  cap: `<svg viewBox="0 0 100 100"><path d="M15 55 Q50 30 90 50 L90 58 Q50 40 15 62Z" fill="#eef0fb"/><path d="M20 58 Q50 36 85 55 Q85 78 50 82 Q20 80 20 58Z" fill="#eef0fb"/><circle cx="50" cy="52" r="4" fill="#05060f"/></svg>`,
  mug: `<svg viewBox="0 0 100 100"><rect x="25" y="25" width="42" height="55" rx="6" fill="#eef0fb"/><path d="M67 38 Q88 38 88 55 Q88 72 67 70" fill="none" stroke="#eef0fb" stroke-width="7"/></svg>`,
  stickers: `<svg viewBox="0 0 100 100"><circle cx="35" cy="35" r="20" fill="#eef0fb"/><rect x="52" y="52" width="34" height="34" rx="8" fill="#eef0fb" transform="rotate(12 69 69)"/><polygon points="20,70 40,70 30,88" fill="#eef0fb"/></svg>`,
  mousepad: `<svg viewBox="0 0 100 100"><rect x="10" y="30" width="80" height="40" rx="10" fill="#eef0fb"/><ellipse cx="30" cy="50" rx="8" ry="8" fill="#05060f" opacity=".5"/></svg>`,
};

const PRODUCTS = [
  {
    id: 'jersey-2026',
    name: 'Maillot Officiel 2026',
    category: 'vetements',
    categoryLabel: 'Vêtements',
    price: 54.9,
    tag: 'Édition Renaissance',
    stock: 'Stock limité',
    rarity: 'legendaire',
    desc: "Le maillot porté par le roster en scrim et en tournoi. Coupe esport, floqué Galaxy Sinks™, tissu respirant.",
    icon: 'jersey',
    bg: '#ffcf5c',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'hoodie-nebula',
    name: 'Hoodie Nebula',
    category: 'vetements',
    categoryLabel: 'Vêtements',
    price: 64.9,
    tag: 'Best-seller',
    stock: null,
    rarity: 'epique',
    desc: "Sweat à capuche épais, dégradé nébuleuse brodé au dos. Le vêtement le plus porté en Discord vocal.",
    icon: 'hoodie',
    bg: '#8c6bff',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'cap-ascension',
    name: 'Casquette Ascension',
    category: 'accessoires',
    categoryLabel: 'Accessoires',
    price: 24.9,
    tag: null,
    stock: null,
    rarity: 'rare',
    desc: "Casquette structurée, logo brodé, taille ajustable. Discrète, portable en dehors du gaming.",
    icon: 'cap',
    bg: '#3fe0ff',
    sizes: ['Taille unique'],
  },
  {
    id: 'mug-warpfield',
    name: 'Mug Warp Field',
    category: 'accessoires',
    categoryLabel: 'Accessoires',
    price: 14.9,
    tag: null,
    stock: null,
    rarity: 'commune',
    desc: "Céramique 350ml, motif nébuleuse imprimé, va au lave-vaisselle. Pour les sessions scrim qui durent.",
    icon: 'mug',
    bg: '#c7cbd8',
    sizes: null,
  },
  {
    id: 'stickers-constellation',
    name: 'Pack Stickers Constellation',
    category: 'accessoires',
    categoryLabel: 'Accessoires',
    price: 6.9,
    tag: 'Petit prix',
    stock: null,
    rarity: 'commune',
    desc: "8 autocollants vinyle résistants à l'eau — logo, wordmark et icônes du crew.",
    icon: 'stickers',
    bg: '#c7cbd8',
    sizes: null,
  },
  {
    id: 'mousepad-void',
    name: 'Tapis de souris XL Void',
    category: 'gaming',
    categoryLabel: 'Gaming',
    price: 29.9,
    tag: null,
    stock: 'Stock limité',
    rarity: 'rare',
    desc: "900×400mm, base antidérapante, surface cousue. Le setup complet du roster.",
    icon: 'mousepad',
    bg: '#3fe0ff',
    sizes: null,
  },
];

/* ---------------------------------------------------------
   2. Panier — état + persistance locale
   --------------------------------------------------------- */
function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
let cart = loadCart();

function addToCart(productId, size) {
  const existing = cart.find((i) => i.productId === productId && i.size === size);
  if (existing) existing.qty += 1;
  else cart.push({ productId, size: size || null, qty: 1 });
  saveCart(cart);
  renderCart();
  openCartDrawer();
}
function updateQty(productId, size, delta) {
  const item = cart.find((i) => i.productId === productId && i.size === size);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i !== item);
  saveCart(cart);
  renderCart();
}
function removeFromCart(productId, size) {
  cart = cart.filter((i) => !(i.productId === productId && i.size === size));
  saveCart(cart);
  renderCart();
}

function cartTotal() {
  return cart.reduce((sum, item) => {
    const p = PRODUCTS.find((x) => x.id === item.productId);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}
function cartCount() { return cart.reduce((n, i) => n + i.qty, 0); }

function fmtPrice(n) { return n.toFixed(2).replace('.', ',') + ' €'; }

/* ---------------------------------------------------------
   3. Vitrine produit vedette (grande carte holo en hero)
   --------------------------------------------------------- */
const FEATURED_ID = 'hoodie-nebula';

function renderFeatured() {
  const el = $('#featuredSpotlight');
  if (!el) return;
  const p = PRODUCTS.find((x) => x.id === FEATURED_ID);
  if (!p) return;
  const r = RARITY[p.rarity];

  el.innerHTML = `
    <div class="holo-card featured-card" data-id="${p.id}"
         style="--r1:${r.colors[0]};--r2:${r.colors[1]};--r3:${r.colors[2]};--r-glow:${r.glow}">
      <span class="rarity-ribbon" style="color:${r.colors[0]}">${r.label}</span>
      <div class="featured-visual" style="--pv-bg:${p.bg}">${ICONS[p.icon]}</div>
      <div class="featured-body">
        <span class="product-category">${p.categoryLabel} · ${p.tag || 'Pièce phare'}</span>
        <h2 class="featured-name">${p.name}</h2>
        <p class="featured-desc">${p.desc}</p>
        <div class="featured-price-row">
          <span class="product-price">${fmtPrice(p.price)}</span>
          <button class="btn btn-solid" data-quick-add="${p.id}">Ajouter au panier</button>
        </div>
      </div>
    </div>
  `;
}
renderFeatured();

/* ---------------------------------------------------------
   4. Rendu du catalogue
   --------------------------------------------------------- */
const shopGrid = $('#shopGrid');
const shopCount = $('#shopCount');
let activeFilter = 'all';

function renderGrid() {
  const list = activeFilter === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeFilter);
  shopCount.textContent = `${list.length} produit${list.length > 1 ? 's' : ''}`;
  shopGrid.innerHTML = list.map((p) => {
    const r = RARITY[p.rarity];
    return `
    <article class="holo-card product-card" data-id="${p.id}"
              style="--r1:${r.colors[0]};--r2:${r.colors[1]};--r3:${r.colors[2]};--r-glow:${r.glow}">
      <span class="rarity-ribbon" style="color:${r.colors[0]}">${r.label}</span>
      <div class="product-visual" style="--pv-bg:${p.bg}">
        ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
        ${p.stock ? `<span class="product-stock">${p.stock}</span>` : ''}
        ${ICONS[p.icon]}
      </div>
      <div class="product-body">
        <span class="product-category">${p.categoryLabel}</span>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-price-row">
          <span class="product-price">${fmtPrice(p.price)}</span>
          <button class="product-add" data-quick-add="${p.id}" aria-label="Ajouter au panier">+</button>
        </div>
      </div>
    </article>
  `;
  }).join('');
}

$('#shopFilters').addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  $$('.filter-chip').forEach((c) => c.classList.remove('active'));
  chip.classList.add('active');
  activeFilter = chip.dataset.filter;
  renderGrid();
});

document.addEventListener('click', (e) => {
  const quickAdd = e.target.closest('[data-quick-add]');
  if (quickAdd) {
    e.stopPropagation();
    const p = PRODUCTS.find((x) => x.id === quickAdd.dataset.quickAdd);
    addToCart(p.id, p.sizes ? p.sizes[0] : null);
    return;
  }
  const card = e.target.closest('.holo-card');
  if (card) openQuickView(card.dataset.id);
});

renderGrid();

/* ---------------------------------------------------------
   Effet holographique + tilt 3D au survol (cartes vedette + grille)
   --------------------------------------------------------- */
function bindHoloTilt(card) {
  const rect = () => card.getBoundingClientRect();
  function onMove(e) {
    const r = rect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    const rotY = ((x - 50) / 50) * 8;
    const rotX = ((50 - y) / 50) * 8;
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
    card.style.transform = `perspective(700px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
  }
  function onLeave() {
    card.style.transform = '';
    card.style.setProperty('--mx', '50%');
    card.style.setProperty('--my', '50%');
  }
  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerleave', onLeave);
}

function bindAllHoloCards() {
  document.querySelectorAll('.holo-card').forEach((card) => {
    if (card.dataset.holoBound) return;
    card.dataset.holoBound = '1';
    bindHoloTilt(card);
  });
}
bindAllHoloCards();
new MutationObserver(bindAllHoloCards).observe(document.body, { childList: true, subtree: true });

/* ---------------------------------------------------------
   4. Vue rapide produit
   --------------------------------------------------------- */
const qvOverlay = $('#quickViewOverlay');
let qvProduct = null;
let qvSelectedSize = null;

function openQuickView(id) {
  qvProduct = PRODUCTS.find((p) => p.id === id);
  if (!qvProduct) return;
  qvSelectedSize = qvProduct.sizes ? qvProduct.sizes[0] : null;

  $('#qvVisual').style.setProperty('--qv-bg', qvProduct.bg);
  $('#qvVisual').innerHTML = ICONS[qvProduct.icon];
  $('#qvCategory').textContent = qvProduct.categoryLabel;
  $('#qvName').textContent = qvProduct.name;
  $('#qvDesc').textContent = qvProduct.desc;
  $('#qvPrice').textContent = fmtPrice(qvProduct.price);

  const sizesEl = $('#qvSizes');
  if (qvProduct.sizes) {
    sizesEl.innerHTML = qvProduct.sizes.map((s) => `<button class="qv-size-btn${s === qvSelectedSize ? ' selected' : ''}" data-size="${s}">${s}</button>`).join('');
  } else {
    sizesEl.innerHTML = '';
  }
  qvOverlay.classList.add('open');
}
$('#qvSizes').addEventListener('click', (e) => {
  const btn = e.target.closest('.qv-size-btn');
  if (!btn) return;
  qvSelectedSize = btn.dataset.size;
  $$('.qv-size-btn').forEach((b) => b.classList.toggle('selected', b === btn));
});
$('#qvAddBtn').addEventListener('click', () => {
  if (!qvProduct) return;
  addToCart(qvProduct.id, qvSelectedSize);
  qvOverlay.classList.remove('open');
});
$('#quickViewClose').addEventListener('click', () => qvOverlay.classList.remove('open'));
qvOverlay.addEventListener('click', (e) => { if (e.target === qvOverlay) qvOverlay.classList.remove('open'); });

/* ---------------------------------------------------------
   5. Panier — tiroir latéral
   --------------------------------------------------------- */
const cartDrawer = $('#cartDrawer');
const cartOverlay = $('#cartOverlay');

function openCartDrawer() { cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); }
function closeCartDrawer() { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); }
$('#cartToggle').addEventListener('click', openCartDrawer);
$('#cartClose').addEventListener('click', closeCartDrawer);
cartOverlay.addEventListener('click', closeCartDrawer);

function renderCart() {
  $('#cartCount').textContent = cartCount();
  const itemsEl = $('#cartItems');

  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="cart-empty">Ton panier est vide pour le moment.</div>';
    $('#cartSubtotal').textContent = fmtPrice(0);
    return;
  }

  itemsEl.innerHTML = cart.map((item) => {
    const p = PRODUCTS.find((x) => x.id === item.productId);
    if (!p) return '';
    return `
      <div class="cart-item">
        <div class="cart-item-visual" style="--pv-bg:${p.bg}">${ICONS[p.icon]}</div>
        <div>
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-meta">${item.size ? item.size + ' · ' : ''}${fmtPrice(p.price)}</div>
          <div class="cart-item-qty">
            <button class="qty-btn" data-qty="-1" data-id="${p.id}" data-size="${item.size || ''}">−</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-qty="1" data-id="${p.id}" data-size="${item.size || ''}">+</button>
          </div>
        </div>
        <div>
          <div class="cart-item-price">${fmtPrice(p.price * item.qty)}</div>
          <button class="cart-item-remove" data-remove="${p.id}" data-size="${item.size || ''}">Retirer</button>
        </div>
      </div>
    `;
  }).join('');
  $('#cartSubtotal').textContent = fmtPrice(cartTotal());
}

$('#cartItems').addEventListener('click', (e) => {
  const qtyBtn = e.target.closest('[data-qty]');
  if (qtyBtn) {
    updateQty(qtyBtn.dataset.id, qtyBtn.dataset.size || null, parseInt(qtyBtn.dataset.qty, 10));
    return;
  }
  const removeBtn = e.target.closest('[data-remove]');
  if (removeBtn) removeFromCart(removeBtn.dataset.id, removeBtn.dataset.size || null);
});

renderCart();

/* ---------------------------------------------------------
   6. Commande — pas de paiement en ligne : récap envoyé au staff
   --------------------------------------------------------- */
function buildOrderSummary() {
  const lines = cart.map((item) => {
    const p = PRODUCTS.find((x) => x.id === item.productId);
    if (!p) return '';
    return `• ${p.name}${item.size ? ' (' + item.size + ')' : ''} × ${item.qty} — ${fmtPrice(p.price * item.qty)}`;
  });
  lines.push('', `Total : ${fmtPrice(cartTotal())}`);
  return lines.join('\n');
}

$('#checkoutBtn').addEventListener('click', async () => {
  if (cart.length === 0) return;
  const summary = buildOrderSummary();

  try {
    await navigator.clipboard.writeText(summary);
    showToast('Récapitulatif copié — colle-le dans un message au staff sur Discord.', 'success');
  } catch {
    alert('Voici ton récapitulatif de commande, à envoyer au staff sur Discord :\n\n' + summary);
  }
  window.open(DISCORD_INVITE, '_blank', 'noopener');
});