// Pure render functions — each returns an HTML string.
// Used by 2+ page modules to avoid duplicating markup.
import { formatPrice, renderStars } from './utils.js';
import { SITE_ORIGIN } from './config.js';

const BADGE_AR = {
  sale: 'تخفيض',
  new: 'جديد',
  limited: 'كمية محدودة',
  bestseller: 'الأكثر مبيعاً',
};

const BADGE_CLASS = {
  sale: 'sale',
  new: 'new-badge',
  limited: 'limited',
  bestseller: 'bestseller',
};

// ── Product Card ────────────────────────────────────────────
// Used by: home.js (featured grid), shop.js (shop grid), product.js (related)
//
// product shape:
//   { id, name, origin, price, oldPrice?, badge?, badgeType?,
//     image, rating?, reviewCount?, desc? }
export function renderProductCard(product) {
  const badgeLabel = product.badgeType
    ? (BADGE_AR[product.badgeType] ?? product.badge ?? '')
    : (product.badge ?? '');
  const badgeCls = product.badgeType ? (BADGE_CLASS[product.badgeType] ?? '') : '';
  const badgeHtml = badgeLabel
    ? `<span class="product-badge${badgeCls ? ' ' + badgeCls : ''}">${badgeLabel}</span>`
    : '';

  const rating = parseFloat(product.rating) || 0;
  const reviewCount = product.reviewCount || 0;
  const ratingHtml = `
    <div class="product-rating">
      <span class="stars">${renderStars(rating)}</span>
      <span class="review-count">${rating.toFixed(1)} · ${reviewCount} تقييم</span>
    </div>`;

  const oldPriceHtml = product.oldPrice
    ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>`
    : '';
  const priceClass = product.oldPrice ? ' price-sale' : '';

  const imgHtml = product.image
    ? `<img src="${product.image}" alt="${_esc(product.name)}" loading="lazy">`
    : `<div style="width:100%;height:100%;background:#e8dfc8"></div>`;

  return `
    <a href="${SITE_ORIGIN}/product/${product.id}/" class="product-card">
      <div class="product-img-wrap">
        ${imgHtml}
        ${badgeHtml}
        <button class="product-quick" data-id="${product.id}">أضف للسلة</button>
      </div>
      <div class="product-content">
        <div class="product-info">
          ${ratingHtml}
          <div class="product-name">${_esc(product.name)}</div>
          <div class="product-origin">${_esc(product.origin || '')}</div>
          <div class="product-price">
            ${oldPriceHtml}
            <span class="${priceClass}">${formatPrice(product.price)}</span>
          </div>
        </div>
      </div>
    </a>`;
}

// ── Review Card ─────────────────────────────────────────────
// Used by: home.js (testimonials), about.js (reviews grid), product.js (reviews tab)
//
// review shape:
//   { rating, body, reviewer_name, reviewer_location?, created_at? }
export function renderReviewCard(review) {
  const stars = renderStars(review.rating ?? review.stars ?? 0);
  const location = review.reviewer_location
    ? `<span class="reviewer-location">${_esc(review.reviewer_location)}</span>`
    : '';
  const date = review.created_at
    ? `<span class="review-date">${_formatDate(review.created_at)}</span>`
    : '';

  return `
    <div class="review-card">
      <div class="review-stars">${stars}</div>
      <div class="review-body">${_esc(review.body ?? review.text ?? '')}</div>
      <div class="review-footer">
        <div>
          <div class="reviewer-name">${_esc(review.reviewer_name ?? review.name ?? '')}</div>
          ${location}
        </div>
        ${date}
      </div>
    </div>`;
}

// ── Star Picker ──────────────────────────────────────────────
// Used by: about.js (review form), product.js (review tab form)
// Returns HTML string. Wire up interactivity with initStarPicker(containerId).
export function renderStarPickerHtml() {
  return `
    <div class="star-picker" id="star-picker">
      <span data-val="1">★</span>
      <span data-val="2">★</span>
      <span data-val="3">★</span>
      <span data-val="4">★</span>
      <span data-val="5">★</span>
    </div>`;
}

// Wires hover + click on a rendered star picker. Returns a getter fn for
// the selected rating value (0 if none selected).
export function initStarPicker(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return () => 0;

  const spans = [...container.querySelectorAll('.star-picker span')];
  let selected = 0;

  function highlight(upTo) {
    spans.forEach((s, i) => s.classList.toggle('lit', i < upTo));
  }

  spans.forEach((s, i) => {
    s.addEventListener('mouseenter', () => highlight(i + 1));
    s.addEventListener('mouseleave', () => highlight(selected));
    s.addEventListener('click', () => {
      selected = i + 1;
      highlight(selected);
    });
  });

  return () => selected;
}

// ── Helpers ─────────────────────────────────────────────────
function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}
