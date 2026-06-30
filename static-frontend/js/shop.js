import { API } from './config.js';
import { loadCart, addToCart } from './cart.js';
import { loadSettings } from './settings.js';
import { initNav } from './nav.js';
import { initFooter } from './footer.js';
import { renderProductCard } from './components.js';
import { showToast, formatPrice, debounce } from './utils.js';

// ── Module-level state ───────────────────────────────────
let _page = 1;
let _totalCount = 0;
let _allProducts = [];
let _priceMax = 50000;
let _sortOption = 'featured';
let _textFilter = '';
let _viewMode = 'grid';
let _isFetching = false;

const PAGE_SIZE = 24;

// ── Normalize raw API product → renderProductCard shape ──
function _norm(p) {
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
    isNew:       !!p.is_new,
    isFeatured:  !!p.is_featured,
  };
}

// ── Fetch products from API ──────────────────────────────
async function _fetchProducts(p = 1) {
  if (_isFetching) return;
  _isFetching = true;

  const grid = document.getElementById('product-grid');
  const countEl = document.getElementById('result-count');
  if (grid) grid.innerHTML = '<div class="spinner"></div>';
  if (countEl) countEl.textContent = 'جاري التحميل…';

  try {
    const params = new URLSearchParams({ page: p, page_size: PAGE_SIZE });

    const res = await fetch(`${API}/shop/products/?${params}`);
    const data = res.ok ? await res.json() : null;

    const raw = Array.isArray(data?.results) ? data.results
              : Array.isArray(data)           ? data
              : [];

    _allProducts = raw.map(_norm);
    _totalCount  = data?.count ?? _allProducts.length;
    _page = p;

    _renderProducts();
    _renderPagination();
  } catch {
    const grid = document.getElementById('product-grid');
    if (grid) grid.innerHTML = '<p class="section-empty-msg">تعذّر تحميل المنتجات، يرجى المحاولة مجدداً.</p>';
  } finally {
    _isFetching = false;
  }
}

// ── Filter + Sort + Render ───────────────────────────────
function _renderProducts() {
  const grid    = document.getElementById('product-grid');
  const countEl = document.getElementById('result-count');
  if (!grid) return;

  // Client-side filter
  let items = _allProducts.filter((p) => p.price <= _priceMax);
  if (_textFilter) {
    const q = _textFilter.toLowerCase();
    items = items.filter(
      (p) => p.name.toLowerCase().includes(q) || p.origin.toLowerCase().includes(q),
    );
  }

  // Client-side sort
  switch (_sortOption) {
    case 'price_asc':   items = [...items].sort((a, b) => a.price - b.price); break;
    case 'price_desc':  items = [...items].sort((a, b) => b.price - a.price); break;
    case 'rating':      items = [...items].sort((a, b) => b.rating - a.rating); break;
    case 'new':         items = [...items].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    case 'featured':    items = [...items].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)); break;
    case 'bestseller':  items = [...items].sort((a, b) => (b.badgeType === 'bestseller' ? 1 : 0) - (a.badgeType === 'bestseller' ? 1 : 0)); break;
  }

  if (countEl) countEl.textContent = items.length ? `${items.length} منتج` : 'لا توجد منتجات';

  if (!items.length) {
    grid.className = 'product-grid';
    grid.innerHTML = '<p class="section-empty-msg">لا توجد منتجات تطابق بحثك.</p>';
    return;
  }

  grid.className = _viewMode === 'list' ? 'product-list' : 'product-grid';
  grid.innerHTML = items.map((p) => renderProductCard(p)).join('');
}

// ── Pagination ───────────────────────────────────────────
function _renderPagination() {
  const el = document.getElementById('pagination');
  if (!el) return;

  const totalPages = Math.ceil(_totalCount / PAGE_SIZE);
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  const pages = _pageWindow(_page, totalPages);

  el.innerHTML = `
    <button class="page-btn" data-page="${_page - 1}" ${_page <= 1 ? 'disabled' : ''}>‹ السابق</button>
    ${pages.map((p) => p === '…'
      ? `<span class="page-ellipsis">…</span>`
      : `<button class="page-btn${p === _page ? ' active' : ''}" data-page="${p}">${p}</button>`
    ).join('')}
    <button class="page-btn" data-page="${_page + 1}" ${_page >= totalPages ? 'disabled' : ''}>التالي ›</button>
  `;

  el.querySelectorAll('.page-btn[data-page]').forEach((btn) => {
    if (btn.disabled || btn.classList.contains('active')) return;
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      if (p >= 1 && p <= totalPages) {
        _fetchProducts(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function _pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const w = [1];
  if (current > 3) w.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) w.push(p);
  if (current < total - 2) w.push('…');
  w.push(total);
  return w;
}

// ── Filter event wiring ──────────────────────────────────
function _wireFilters() {
  // Sort select
  const sortSel = document.getElementById('sort-select');
  sortSel?.addEventListener('change', () => {
    _sortOption = sortSel.value;
    _renderProducts();
  });

  // Text filter (debounced 300ms)
  const textInput = document.getElementById('text-filter');
  textInput?.addEventListener('input', debounce(() => {
    _textFilter = textInput.value.trim();
    _renderProducts();
  }, 300));

  // Price range
  const priceRange = document.getElementById('price-range');
  const priceLabel = document.getElementById('price-max-label');
  priceRange?.addEventListener('input', () => {
    _priceMax = parseInt(priceRange.value, 10);
    if (priceLabel) priceLabel.textContent = formatPrice(_priceMax);
    _renderProducts();
  });

  // Reset all filters
  document.getElementById('filter-reset')?.addEventListener('click', () => {
    _priceMax = 50000;
    _sortOption = 'featured';
    _textFilter = '';
    if (priceRange) priceRange.value = 50000;
    if (priceLabel) priceLabel.textContent = '50,000 DA';
    if (sortSel) sortSel.value = 'featured';
    if (textInput) textInput.value = '';
    _fetchProducts(1);
  });

  // View toggle
  const gridBtn = document.getElementById('view-grid');
  const listBtn = document.getElementById('view-list');
  gridBtn?.addEventListener('click', () => {
    _viewMode = 'grid';
    gridBtn.classList.add('active');
    listBtn?.classList.remove('active');
    _renderProducts();
  });
  listBtn?.addEventListener('click', () => {
    _viewMode = 'list';
    listBtn.classList.add('active');
    gridBtn?.classList.remove('active');
    _renderProducts();
  });

  // Mobile sidebar toggle
  const toggleBtn  = document.getElementById('mobile-filter-toggle');
  const sidebar    = document.getElementById('shop-sidebar');
  const closeBtn   = document.getElementById('sidebar-close');
  const backdrop   = document.getElementById('sidebar-backdrop');

  const _openSidebar  = () => { sidebar?.classList.add('open');  backdrop?.classList.add('visible'); };
  const _closeSidebar = () => { sidebar?.classList.remove('open'); backdrop?.classList.remove('visible'); };

  toggleBtn?.addEventListener('click', _openSidebar);
  closeBtn?.addEventListener('click', _closeSidebar);
  backdrop?.addEventListener('click', _closeSidebar);
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

  // Respect ?sort=<option> from links like the footer's "Best Seller" / "Special" categories
  const urlSort = new URLSearchParams(window.location.search).get('sort');
  if (urlSort) {
    _sortOption = urlSort;
    const sortSel = document.getElementById('sort-select');
    if (sortSel) sortSel.value = urlSort;
  }

  await Promise.all([
    initNav('/shop.html'),
    initFooter(),
  ]);

  _wireFilters();
  _wireQuickAdd();
  await _fetchProducts(1);
});
