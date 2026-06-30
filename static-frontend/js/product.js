import { API } from './config.js';
import { loadCart, addToCart, getCartId, getCartItems, clearCart } from './cart.js';
import { loadSettings } from './settings.js';
import { initNav } from './nav.js';
import { initFooter } from './footer.js';
import { renderProductCard, renderReviewCard, renderStarPickerHtml, initStarPicker } from './components.js';
import { showToast, formatPrice, renderStars } from './utils.js';
import { apiFetch } from './api.js';
import { trackViewContent, trackAddToCart, trackInitiateCheckout, trackPurchase } from './pixel.js';
import { initOrderForm, placeQuickOrder, calcShipping, loadThanksMsg, showThanksOverlay } from './order-form.js';

// ── Read embedded product data ────────────────────────────
const _pdpScript = document.getElementById('__pdp_data__');
const product = JSON.parse(_pdpScript?.textContent || '{}');
_pdpScript?.remove();

// ── Image slider state ────────────────────────────────────
let _images = [];
let _currentImg = 0;
let _zoomed = false;

// ── Selection state ───────────────────────────────────────
let _selectedSize  = null;
let _selectedColor = null;
let _qty = 1;

// ── Quick-order drawer state ──────────────────────────────
let _orderFormReady = false;

// ── Escape helper ─────────────────────────────────────────
function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Build images array ────────────────────────────────────
function _buildImages() {
  if (product.image_url) {
    _images.push({ url: product.image_url, alt: product.name_ar || '' });
  }
  (product.images || []).forEach((img) => {
    if (img.url && img.url !== product.image_url) {
      _images.push({ url: img.url, alt: img.alt_text || product.name_ar || '' });
    }
  });
}

// ── Image slider ──────────────────────────────────────────
function _initSlider() {
  const mainImg    = document.getElementById('main-img');
  const mainWrap   = document.getElementById('main-image-wrap');
  const thumbStrip = document.getElementById('thumb-strip');
  const counter    = document.getElementById('img-counter');
  const prevBtn    = document.getElementById('arrow-prev');
  const nextBtn    = document.getElementById('arrow-next');
  const dragHint   = document.getElementById('drag-hint');

  if (!mainImg || !_images.length) return;

  function _show(idx) {
    _currentImg = Math.max(0, Math.min(idx, _images.length - 1));
    mainImg.src = _images[_currentImg].url;
    mainImg.alt = _images[_currentImg].alt;
    if (counter) counter.textContent = _images.length > 1 ? `${_currentImg + 1} / ${_images.length}` : '';

    // Update thumbs
    thumbStrip?.querySelectorAll('.thumb').forEach((t, i) => {
      t.classList.toggle('active', i === _currentImg);
    });

    // Hide arrows if single image
    if (prevBtn) prevBtn.classList.toggle('hidden', _images.length <= 1);
    if (nextBtn) nextBtn.classList.toggle('hidden', _images.length <= 1);
    if (dragHint) dragHint.classList.toggle('hidden', _images.length <= 1);
  }

  // Thumbnails
  if (thumbStrip && _images.length > 1) {
    thumbStrip.innerHTML = _images.map((img, i) =>
      `<img class="thumb${i === 0 ? ' active' : ''}" src="${_esc(img.url)}" alt="${_esc(img.alt)}" loading="lazy" data-idx="${i}">`
    ).join('');

    thumbStrip.addEventListener('click', (e) => {
      const thumb = e.target.closest('.thumb');
      if (thumb) _show(parseInt(thumb.dataset.idx, 10));
    });
  }

  // Init counter
  if (counter) counter.textContent = _images.length > 1 ? `1 / ${_images.length}` : '';
  if (prevBtn) prevBtn.classList.toggle('hidden', _images.length <= 1);
  if (nextBtn) nextBtn.classList.toggle('hidden', _images.length <= 1);
  if (dragHint) dragHint.classList.toggle('hidden', _images.length <= 1);

  prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); _show(_currentImg - 1); });
  nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); _show(_currentImg + 1); });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') _show(_currentImg - 1);
    if (e.key === 'ArrowLeft')  _show(_currentImg + 1);
  });

  // Click-to-zoom
  if (mainWrap) {
    mainWrap.addEventListener('click', (e) => {
      _zoomed = !_zoomed;
      mainWrap.classList.toggle('zoomed', _zoomed);
    });

    mainWrap.addEventListener('mousemove', (e) => {
      if (!_zoomed) return;
      const rect = mainWrap.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      mainWrap.style.setProperty('--zoom-x', `${x}%`);
      mainWrap.style.setProperty('--zoom-y', `${y}%`);
    });

    mainWrap.addEventListener('mouseleave', () => {
      if (_zoomed) { _zoomed = false; mainWrap.classList.remove('zoomed'); }
    });

    // Touch swipe — drag between images on mobile
    let _touchStartX = 0;
    let _touchStartY = 0;

    mainWrap.addEventListener('touchstart', (e) => {
      _touchStartX = e.touches[0].clientX;
      _touchStartY = e.touches[0].clientY;
    }, { passive: true });

    mainWrap.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - _touchStartX;
      const dy = e.changedTouches[0].clientY - _touchStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
        if (dx < 0) _show(_currentImg + 1);
        else        _show(_currentImg - 1);
      }
    }, { passive: false });
  }
}

// ── Product info HTML ─────────────────────────────────────
function _renderProductInfo() {
  const infoEl = document.getElementById('product-info');
  if (!infoEl || !product.id) return;

  const price      = parseFloat(product.price) || 0;
  const oldPrice   = product.old_price ? parseFloat(product.old_price) : null;
  const isOnSale   = oldPrice && oldPrice > price;
  const discount   = product.discount_percent || 0;
  const rating     = parseFloat(product.rating) || 0;
  const reviewCount = product.review_count || 0;

  // Badge
  const BADGE_AR = { sale: 'تخفيض', new: 'جديد', limited: 'كمية محدودة', bestseller: 'الأكثر مبيعاً' };
  const badgeRaw = product.badge && product.badge !== '' ? product.badge : null;
  const badgeHtml = badgeRaw
    ? `<span class="pi-badge ${badgeRaw}">${BADGE_AR[badgeRaw] ?? badgeRaw}</span>`
    : '';

  // Rating
  const ratingHtml = `
    <div class="pi-rating">
      <span class="stars">${renderStars(rating)}</span>
      <span>${rating.toFixed(1)} · ${reviewCount} تقييم</span>
    </div>`;

  // Price
  const priceHtml = `
    <div class="pi-price">
      ${isOnSale ? `<span class="pi-price-old">${formatPrice(oldPrice)}</span>` : ''}
      <span class="pi-price-current${isOnSale ? ' on-sale' : ''}">${formatPrice(price)}</span>
      ${isOnSale && discount ? `<span class="pi-discount">-${discount}%</span>` : ''}
    </div>`;

  // Sizes
  const sizes = product.sizes || [];
  const sizesHtml = sizes.length ? `
    <div class="pi-option-section">
      <div class="pi-option-label">المقاس: <span id="selected-size-label">${_esc(_selectedSize || '—')}</span></div>
      <div class="pi-size-btns">
        ${sizes.map((s) => `<button class="size-btn" data-size="${_esc(s.name)}">${_esc(s.name)}</button>`).join('')}
      </div>
    </div>` : '';

  // Colors
  const colors = product.colors || [];
  const colorsHtml = colors.length ? `
    <div class="pi-option-section">
      <div class="pi-option-label">اللون: <span id="selected-color-label">${_esc(_selectedColor || '—')}</span></div>
      <div class="pi-color-swatches">
        ${colors.map((c) => `
          <button class="color-swatch" data-color="${_esc(c.name_ar)}" title="${_esc(c.name_ar)}"
            style="background:${_esc(c.hex || '#ccc')}"></button>`).join('')}
      </div>
    </div>` : '';

  // Availability
  const AVAIL = {
    in_stock:     { dot: '',      label: 'متوفر' },
    low_stock:    { dot: 'low',   label: 'كميات محدودة' },
    out_of_stock: { dot: 'out',   label: 'غير متوفر' },
    pre_order:    { dot: 'low',   label: 'طلب مسبق' },
    discontinued: { dot: 'out',   label: 'غير متوفر' },
  };
  const avail = AVAIL[product.availability] || { dot: '', label: '' };
  const availHtml = avail.label ? `
    <div class="pi-availability">
      <span class="avail-dot ${avail.dot}"></span>
      <span class="avail-label">${avail.label}</span>
    </div>` : '';

  // Meta rows (origin, material, SKU)
  const metaRows = [
    product.origin   ? { key: 'المنشأ',  val: product.origin }   : null,
    product.material ? { key: 'الخامة', val: product.material } : null,
    product.sku      ? { key: 'رمز',    val: product.sku }      : null,
  ].filter(Boolean);

  const metaHtml = metaRows.length ? `
    <div class="pi-meta">
      ${metaRows.map((r) => `
        <div class="pi-meta-row">
          <span class="pi-meta-key">${_esc(r.key)}</span>
          <span class="pi-meta-val">${_esc(r.val)}</span>
        </div>`).join('')}
    </div>` : '';

  // Tabs
  const tabsHtml = `
    <div class="pi-tabs">
      <div class="pi-tab-nav">
        <button class="tab-btn active" data-tab="description">الوصف</button>
        ${product.details ? `<button class="tab-btn" data-tab="details">التفاصيل</button>` : ''}
        <button class="tab-btn" data-tab="shipping">الشحن</button>
        <button class="tab-btn" data-tab="reviews">التقييمات <span id="review-tab-count"></span></button>
      </div>
      <div class="pi-tab-content">
        <div class="tab-panel active" id="tab-description">
          <div class="tab-description">${product.description_ar || product.short_description_ar || ''}</div>
        </div>
        ${product.details ? `
        <div class="tab-panel" id="tab-details">
          <ul class="tab-details-list">
            ${product.details.split('\n').filter((l) => l.trim()).map((l) => `<li>${_esc(l.trim())}</li>`).join('')}
          </ul>
        </div>` : ''}
        <div class="tab-panel" id="tab-shipping">
          <div id="shipping-tab-content"><div class="spinner"></div></div>
        </div>
        <div class="tab-panel" id="tab-reviews">
          <div id="reviews-tab-content"><div class="spinner"></div></div>
        </div>
      </div>
    </div>`;

  // Assemble
  infoEl.innerHTML = `
    ${badgeHtml}
    ${ratingHtml}
    <h1 class="pi-name">${_esc(product.name_ar || '')}</h1>
    ${product.origin ? `<div class="pi-origin">${_esc(product.origin)}</div>` : ''}
    ${product.short_description_ar ? `<p class="pi-short-desc">${_esc(product.short_description_ar)}</p>` : ''}
    ${priceHtml}
    ${sizesHtml}
    ${colorsHtml}
    <div class="pi-actions">
      <div class="pi-qty">
        <button class="qty-btn" id="qty-minus" aria-label="تقليل">−</button>
        <span class="qty-display" id="qty-display">1</span>
        <button class="qty-btn" id="qty-plus" aria-label="زيادة">+</button>
      </div>
      <button class="pi-atc-btn" id="atc-btn">
        أطلب الآن — ${formatPrice(price)}
      </button>
    </div>
    ${availHtml}
    ${metaHtml}
    ${tabsHtml}
  `;

  _wireSizeSelect();
  _wireColorSelect();
  _wireQtyControls();
  _wireAddToCart();
  _wireTabs();
  _wireStickyBar();
}

// ── Size selection ────────────────────────────────────────
function _wireSizeSelect() {
  const container = document.querySelector('.pi-size-btns');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.size-btn');
    if (!btn) return;
    container.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    _selectedSize = btn.dataset.size;
    const label = document.getElementById('selected-size-label');
    if (label) label.textContent = _selectedSize;
  });
}

// ── Color selection ───────────────────────────────────────
function _wireColorSelect() {
  const container = document.querySelector('.pi-color-swatches');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-swatch');
    if (!btn) return;
    container.querySelectorAll('.color-swatch').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    _selectedColor = btn.dataset.color;
    const label = document.getElementById('selected-color-label');
    if (label) label.textContent = _selectedColor;
  });
}

// ── Qty controls ──────────────────────────────────────────
function _wireQtyControls() {
  const display = document.getElementById('qty-display');

  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (_qty > 1) { _qty--; if (display) display.textContent = _qty; }
  });

  document.getElementById('qty-plus')?.addEventListener('click', () => {
    _qty++;
    if (display) display.textContent = _qty;
  });
}

// ── Add to cart ───────────────────────────────────────────
function _wireAddToCart() {
  const btn = document.getElementById('atc-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const price = parseFloat(product.price) || 0;

    if (!product.in_stock) {
      showToast('هذا المنتج غير متوفر حالياً.');
      return;
    }

    btn.disabled = true;
    btn.textContent = '...';

    try {
      await addToCart(product.id, _qty, _selectedSize, _selectedColor);
      trackAddToCart({ id: product.id, name: product.name_ar, price, qty: _qty });
      btn.disabled = false;
      btn.textContent = `أطلب الآن — ${formatPrice(price)}`;
      _openQuickOrder();
    } catch {
      showToast('تعذّرت الإضافة، يُرجى المحاولة مجدداً.');
      btn.disabled = false;
      btn.textContent = `أطلب الآن — ${formatPrice(price)}`;
    }
  });
}

// ── Quick-order drawer ────────────────────────────────────
function _updateQuickOrderTotal() {
  const items = getCartItems();
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const totalEl = document.getElementById('qo-total-val');
  if (totalEl) totalEl.textContent = formatPrice(subtotal + calcShipping());
}

function _openQuickOrder() {
  const drawer = document.getElementById('quick-order');
  if (!drawer) return;

  if (!_orderFormReady) {
    _orderFormReady = true;
    initOrderForm(_updateQuickOrderTotal);
  }

  _updateQuickOrderTotal();
  drawer.classList.add('open');
  document.getElementById('qo-backdrop')?.classList.add('open');
  document.body.classList.add('qo-locked');

  const items = getCartItems();
  trackInitiateCheckout({ items, total: items.reduce((s, i) => s + i.lineTotal, 0) });
}

function _closeQuickOrder() {
  document.getElementById('quick-order')?.classList.remove('open');
  document.getElementById('qo-backdrop')?.classList.remove('open');
  document.body.classList.remove('qo-locked');
}

function _wireQuickOrder() {
  document.getElementById('qo-close')?.addEventListener('click', _closeQuickOrder);
  document.getElementById('qo-backdrop')?.addEventListener('click', _closeQuickOrder);

  document.getElementById('qo-confirm-btn')?.addEventListener('click', () => {
    placeQuickOrder({
      cartId: getCartId(),
      onSuccess: (order) => {
        const items = getCartItems();
        const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
        trackPurchase({
          orderId: order.order_number,
          items,
          total: parseFloat(order.grand_total_da ?? subtotal + calcShipping()),
        });
        clearCart();
        _closeQuickOrder();
        showThanksOverlay(order);
      },
    });
  });
}

// ── Sticky mobile order bar ───────────────────────────────
function _wireStickyBar() {
  const bar     = document.getElementById('pi-sticky-bar');
  const actions = document.querySelector('.pi-actions');
  const priceEl = document.getElementById('pi-sticky-price');
  const stickyBtn = document.getElementById('pi-sticky-btn');
  if (!bar || !actions) return;

  if (priceEl) priceEl.textContent = formatPrice(parseFloat(product.price) || 0);

  stickyBtn?.addEventListener('click', () => {
    document.getElementById('atc-btn')?.click();
  });

  const observer = new IntersectionObserver(
    ([entry]) => bar.classList.toggle('visible', !entry.isIntersecting),
    { threshold: 0 }
  );
  observer.observe(actions);
}

// ── Tab switching ─────────────────────────────────────────
function _wireTabs() {
  const nav = document.querySelector('.pi-tab-nav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;

    nav.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');

    // Lazy-load content on first open
    if (tab === 'reviews') _loadReviews();
    if (tab === 'shipping') _loadShipping();
  });
}

// ── Reviews tab ───────────────────────────────────────────
let _reviewsLoaded = false;
let _getSelectedRating = () => 0;

async function _loadReviews() {
  if (_reviewsLoaded) return;
  _reviewsLoaded = true;

  const container = document.getElementById('reviews-tab-content');
  if (!container) return;

  let reviews = [];
  try {
    const res = await fetch(`${API}/shop/products/${product.id}/reviews/`);
    if (res.ok) reviews = await res.json();
    if (!Array.isArray(reviews)) reviews = [];
  } catch { reviews = []; }

  // Update review count badge in tab
  const badge = document.getElementById('review-tab-count');
  if (badge && reviews.length) badge.textContent = `(${reviews.length})`;

  // Update rating in header
  const avgEl = document.querySelector('.pi-rating');

  const headerHtml = reviews.length ? `
    <div class="reviews-tab-header">
      <span class="reviews-avg">${parseFloat(product.rating || 0).toFixed(1)}</span>
      <span class="reviews-avg-stars">${renderStars(product.rating || 0)}</span>
      <span class="reviews-avg-count">${reviews.length} تقييم</span>
    </div>` : '';

  const reviewsHtml = reviews.length
    ? `<div class="reviews-list">${reviews.map((r) => renderReviewCard(r)).join('')}</div>`
    : '<p style="color:var(--warm-gray);font-style:italic;margin-bottom:24px;">لا توجد تقييمات بعد — كن أول من يقيّم هذه القطعة.</p>';

  // Review submission form
  const formHtml = `
    <div class="review-form-title">أضف تقييمك</div>
    <div class="review-form" id="review-form">
      <div>${renderStarPickerHtml()}</div>
      <input type="text" id="reviewer-name" placeholder="اسمك" maxlength="120">
      <textarea id="reviewer-body" placeholder="شاركنا تجربتك مع هذه القطعة…" rows="4"></textarea>
      <button class="review-submit-btn" id="review-submit-btn">إرسال التقييم</button>
      <div id="review-form-msg" style="display:none"></div>
    </div>`;

  container.innerHTML = headerHtml + reviewsHtml + formHtml;

  // Init star picker
  _getSelectedRating = initStarPicker('star-picker');

  // Wire submit
  document.getElementById('review-submit-btn')?.addEventListener('click', async () => {
    const rating = _getSelectedRating();
    const name   = document.getElementById('reviewer-name')?.value.trim() || '';
    const body   = document.getElementById('reviewer-body')?.value.trim() || '';
    const msgEl  = document.getElementById('review-form-msg');

    if (!rating) { if (msgEl) { msgEl.textContent = 'يُرجى اختيار تقييم نجمي.'; msgEl.style.display = 'block'; } return; }
    if (!name)   { if (msgEl) { msgEl.textContent = 'يُرجى إدخال اسمك.'; msgEl.style.display = 'block'; } return; }
    if (!body)   { if (msgEl) { msgEl.textContent = 'يُرجى كتابة تعليقك.'; msgEl.style.display = 'block'; } return; }

    try {
      const res = await apiFetch(`/shop/products/${product.id}/reviews/`, {
        method: 'POST',
        body: { reviewer_name: name, rating, body },
      });
      if (res.ok) {
        document.getElementById('review-form').innerHTML = `
          <div class="review-success">
            <p>شكراً على تقييمك!</p>
            <span>سيظهر تقييمك بعد مراجعته من فريقنا.</span>
          </div>`;
      } else {
        if (msgEl) { msgEl.textContent = 'حدث خطأ، يُرجى المحاولة مجدداً.'; msgEl.style.display = 'block'; }
      }
    } catch {
      if (msgEl) { msgEl.textContent = 'حدث خطأ في الاتصال.'; msgEl.style.display = 'block'; }
    }
  });
}

// ── Shipping tab ──────────────────────────────────────────
let _shippingLoaded = false;
let _shippingWilayas = [];

async function _loadShipping() {
  if (_shippingLoaded) return;
  _shippingLoaded = true;

  const container = document.getElementById('shipping-tab-content');
  if (!container) return;

  try {
    const res = await fetch(`${API}/shop/wilayas/`);
    if (res.ok) _shippingWilayas = await res.json();
  } catch { _shippingWilayas = []; }

  const settings = await loadSettings();

  container.innerHTML = `
    <p class="tab-shipping-intro">${_esc(settings.product_shipping_intro || '')}</p>
    <div class="shipping-wilaya-wrap">
      <select class="shipping-wilaya-select" id="shipping-wilaya-select">
        <option value="">— اختر الولاية لعرض سعر الشحن —</option>
        ${_shippingWilayas.map((w) => `<option value="${w.id}">(${w.code}) ${_esc(w.name_ar)}</option>`).join('')}
      </select>
      <div class="shipping-price-display" id="shipping-price-display" style="display:none">
        <div class="shipping-price-row">
          <span class="shipping-price-label">🏠 توصيل للبيت</span>
          <span class="shipping-price-val" id="ship-home-price">—</span>
        </div>
        <div class="shipping-price-row">
          <span class="shipping-price-label">📦 مكتب التوصيل</span>
          <span class="shipping-price-val" id="ship-desk-price">—</span>
        </div>
      </div>
    </div>
    <div class="shipping-info-lines">
      ${settings.product_shipping_algeria ? `<div class="shipping-info-line">🇩🇿 ${_esc(settings.product_shipping_algeria)}</div>` : ''}
      ${settings.product_shipping_tracking ? `<div class="shipping-info-line">📍 ${_esc(settings.product_shipping_tracking)}</div>` : ''}
    </div>`;

  document.getElementById('shipping-wilaya-select')?.addEventListener('change', (e) => {
    const wilayaId = parseInt(e.target.value, 10);
    const wilaya = _shippingWilayas.find((w) => w.id === wilayaId);
    const priceDisplay = document.getElementById('shipping-price-display');
    if (!wilaya) { if (priceDisplay) priceDisplay.style.display = 'none'; return; }

    if (priceDisplay) priceDisplay.style.display = 'flex';
    const homeEl = document.getElementById('ship-home-price');
    const deskEl = document.getElementById('ship-desk-price');
    if (homeEl) homeEl.textContent = formatPrice(wilaya.shipping_price_home_da ?? wilaya.shipping_price_da ?? 700);
    if (deskEl) deskEl.textContent = formatPrice(wilaya.shipping_price_desk_da ?? 450);
  });
}

// ── Related products ──────────────────────────────────────
async function _loadRelated() {
  const section = document.getElementById('related-section');
  const grid    = document.getElementById('related-grid');
  if (!section || !grid) return;

  try {
    const catSlug = product.category?.slug;
    const urls = [];
    if (catSlug) urls.push(`${API}/shop/products/?category=${catSlug}&page_size=4`);
    urls.push(`${API}/shop/products/?is_new=true&page_size=4`);

    const results = await Promise.all(urls.map((u) => fetch(u).then((r) => r.ok ? r.json() : null).catch(() => null)));

    const seen = new Set([product.id]);
    const related = [];

    for (const data of results) {
      const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
      for (const p of items) {
        if (!seen.has(p.id) && related.length < 4) {
          seen.add(p.id);
          const badgeRaw = p.badge && p.badge !== 'none' && p.badge !== '' ? p.badge : null;
          related.push({
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
          });
        }
      }
      if (related.length >= 4) break;
    }

    if (!related.length) return;

    grid.innerHTML = related.map((p) => renderProductCard(p)).join('');
    section.style.display = '';

    // Quick-add in related grid
    grid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.product-quick');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const pid = parseInt(btn.dataset.id, 10);
      if (!pid) return;
      const orig = btn.textContent;
      btn.textContent = '...';
      btn.disabled = true;
      try {
        await addToCart(pid, 1);
        showToast('تمت الإضافة إلى السلة.');
      } catch {
        showToast('تعذّرت الإضافة.');
      } finally {
        btn.textContent = orig;
        btn.disabled = false;
      }
    });
  } catch { /* graceful */ }
}

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  _buildImages();

  await loadCart();

  await Promise.all([
    initNav('/product/'),
    initFooter(),
    loadThanksMsg(),
  ]);

  _initSlider();
  _renderProductInfo();
  _wireQuickOrder();

  // Non-blocking: related products
  _loadRelated();

  // Facebook Pixel — ViewContent
  trackViewContent({
    id:       product.id,
    name:     product.name_ar,
    category: product.category?.name_ar || '',
    price:    parseFloat(product.price) || 0,
  });
});
