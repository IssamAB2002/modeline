import { API } from './config.js';
import { loadCart, addToCart } from './cart.js';
import { loadSettings } from './settings.js';
import { initNav } from './nav.js';
import { initFooter } from './footer.js';
import { renderProductCard } from './components.js';
import { showToast, renderStars } from './utils.js';

// ── Trust strip fallback (mirrors home.json) ─────────────
const TRUST_FALLBACK = [
  { icon: '✦', label: 'شحن يومي',          desc: 'الطلبات المؤكدة قبل الساعة 14:00 تُشحن بعد الظهر' },
  { icon: '◈', label: 'أصيل مضمون',        desc: 'كل قطعة موثّقة ومعتمدة للأصالة قبل وصولها إليك' },
  { icon: '⬡', label: 'إرجاع سهل',         desc: 'إرجاع خلال 30 يوماً بدون تعقيدات على جميع المنتجات' },
  { icon: '◇', label: 'الدفع عند الاستلام', desc: 'الدفع عند الاستلام فقط — لا حاجة لبطاقة' },
];

// ── Normalize raw API product to renderProductCard shape ─
function _normalizeProduct(p) {
  const badgeRaw = p.badge && p.badge !== 'none' && p.badge !== '' ? p.badge : null;
  return {
    id:          p.id,
    name:        p.name_ar || p.name,
    origin:      p.origin || '',
    price:       parseFloat(p.price),
    oldPrice:    p.old_price ? parseFloat(p.old_price) : null,
    badge:       badgeRaw,
    badgeType:   badgeRaw ? badgeRaw.toLowerCase() : null,
    image:       p.image_url || '',
    rating:      parseFloat(p.rating) || 0,
    reviewCount: p.review_count || 0,
  };
}

// ── Section loaders ──────────────────────────────────────

async function _loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  try {
    const res  = await fetch(`${API}/shop/products/?featured=true`);
    const data = res.ok ? await res.json() : null;
    const raw  = Array.isArray(data?.results) ? data.results
               : Array.isArray(data)           ? data
               : [];
    const products = raw.slice(0, 8);

    if (!products.length) {
      grid.innerHTML = '<p class="section-empty-msg">لا توجد قطع مميزة متاحة بعد.</p>';
      return;
    }
    grid.innerHTML = products.map((p) => renderProductCard(_normalizeProduct(p))).join('');
  } catch {
    grid.innerHTML = '<p class="section-empty-msg">لا توجد قطع مميزة متاحة بعد.</p>';
  }
}

async function _loadTrust() {
  const strip = document.getElementById('trust-strip');
  if (!strip) return;

  const _render = (items) =>
    items.map((item) => `
      <div class="trust-item">
        <span class="trust-icon">${item.icon}</span>
        <span class="trust-label">${item.label_ar || item.label || ''}</span>
        <p class="trust-desc">${item.description_ar || item.desc || ''}</p>
      </div>`).join('');

  try {
    const res  = await fetch(`${API}/home/trust-strips/`);
    const data = res.ok ? await res.json() : [];
    strip.innerHTML = _render(Array.isArray(data) && data.length ? data : TRUST_FALLBACK);
  } catch {
    strip.innerHTML = _render(TRUST_FALLBACK);
  }
}

async function _loadTestimonials() {
  const container = document.getElementById('testimonials-grid');
  if (!container) return;

  try {
    const res     = await fetch(`${API}/about/reviews/?limit=3`);
    const data    = res.ok ? await res.json() : [];
    const reviews = Array.isArray(data) ? data : [];

    if (!reviews.length) {
      container.innerHTML = '<p class="section-empty-msg">لا توجد شهادات بعد.</p>';
      return;
    }

    container.innerHTML = reviews.map((r) => `
      <div class="test-card">
        <div class="test-stars">${renderStars(r.rating ?? r.stars ?? 0)}</div>
        <p class="test-text">"${r.body_ar || r.body || ''}"</p>
        <div class="test-author">${r.client_name_ar || r.reviewer_name || r.name || ''}</div>
        <div class="test-place">${r.location_ar || r.reviewer_location || ''}</div>
      </div>`).join('');
  } catch {
    container.innerHTML = '<p class="section-empty-msg">لا توجد شهادات بعد.</p>';
  }
}

// ── Apply dynamic settings text to hero ──────────────────

function _applySettings(settings) {
  const _set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val) el.textContent = val;
  };
  _set('hero-eyebrow',      settings.home_hero_eyebrow);
  _set('hero-title-line1',  settings.home_hero_title_line1);
  _set('hero-title-em',     settings.home_hero_title_emphasis);
  _set('hero-title-line3',  settings.home_hero_title_line3);
  _set('hero-subtitle',     settings.home_hero_subtitle);
}

// ── Quick-add via event delegation ───────────────────────

function _wireQuickAdd() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.product-quick');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const productId = parseInt(btn.dataset.id, 10);
    if (!productId) return;

    const original = btn.textContent;
    btn.textContent = '...';
    btn.disabled = true;

    try {
      await addToCart(productId, 1);
      showToast('تمت الإضافة إلى السلة — جاري التوجيه…');
      setTimeout(() => { window.location.href = '/cart.html'; }, 1800);
    } catch {
      showToast('تعذّرت الإضافة، يُرجى المحاولة مجدداً.');
      btn.textContent = original;
      btn.disabled = false;
    }
  });
}

// ── Boot ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  loadCart();

  const [settings] = await Promise.all([
    loadSettings(),
    initNav('/'),
    initFooter(),
    _loadProducts(),
    _loadTrust(),
    _loadTestimonials(),
  ]);

  _applySettings(settings);
  _wireQuickAdd();
});
