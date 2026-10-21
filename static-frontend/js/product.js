import { API } from './config.js';
import { loadCart, addToCart, getCartId, getCartItems, clearCart, removeItem, updateQty } from './cart.js';
import { loadSettings } from './settings.js';
import { initNav } from './nav.js';
import { initFooter } from './footer.js';
import { renderProductCard, renderReviewCard, renderStarPickerHtml, initStarPicker } from './components.js';
import { showToast, formatPrice, renderStars } from './utils.js';
import { apiFetch } from './api.js';
import { trackViewContent, trackAddToCart, trackInitiateCheckout, trackPurchase } from './pixel.js';
import { trackViewContent as ttViewContent, trackAddToCart as ttAddToCart, trackInitiateCheckout as ttInitiateCheckout, trackPurchase as ttPurchase } from './tiktok.js';
import { initOrderForm, placeQuickOrder, calcShipping, loadThanksMsg, showThanksOverlay } from './order-form.js';

// ── Read embedded product data ────────────────────────────
const _pdpScript = document.getElementById('__pdp_data__');
const product = JSON.parse(_pdpScript?.textContent || '{}');
_pdpScript?.remove();

// ── Image slider state ────────────────────────────────────
let _images = [];
let _currentImg = 0;
let _zoomed = false;
let _showImage = null;
let _videoMuted = true;

// ── Selection state ───────────────────────────────────────
let _selectedSize    = null;
let _selectedColor   = null;
let _selectedColorId = null;
let _qty = 1;

// ── Escape helper ─────────────────────────────────────────
function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── srcset helper: smallest-width URL, used for the ~133px thumb strip
// so it never downloads the full-resolution gallery image for a tiny icon.
function _smallestSrcsetUrl(srcset) {
  if (!srcset) return null;
  const first = srcset.split(',')[0]?.trim();
  return first ? first.split(' ')[0] : null;
}

// ── Build gallery slides array (video first, then images) ─
function _buildImages() {
  if (product.video_url) {
    _images.push({
      type: 'video',
      url: product.video_url,
      poster: product.video_thumbnail_url || '',
      alt: product.name_ar || '',
    });
  }
  if (product.image_url) {
    _images.push({
      type: 'image',
      url: product.image_webp_url || product.image_url,
      webpSrcset: product.image_webp_srcset || '',
      fallbackSrcset: product.image_fallback_srcset || '',
      alt: product.name_ar || '',
      colorId: null,
    });
  }
  (product.images || []).forEach((img) => {
    if (img.url && img.url !== product.image_url) {
      _images.push({
        type: 'image',
        url: img.webp_url || img.url,
        webpSrcset: img.webp_srcset || '',
        fallbackSrcset: img.fallback_srcset || '',
        alt: img.alt_text || product.name_ar || '',
        colorId: img.color ?? null,
      });
    }
  });
}

// ── Scroll gallery to the image linked to a selected color ─
function _scrollToColorImage(colorId) {
  if (colorId == null) return;
  const idx = _images.findIndex((img) => img.colorId === colorId);
  if (idx === -1) return;

  _showImage?.(idx);

  document.querySelector(`.thumb[data-idx="${idx}"]`)
    ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

  if (window.matchMedia('(max-width: 820px)').matches) {
    document.getElementById('main-image-wrap')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ── Image slider ──────────────────────────────────────────
function _initSlider() {
  const mainImg    = document.getElementById('main-img');
  const mainVideo  = document.getElementById('main-video');
  const muteToggle = document.getElementById('video-mute-toggle');
  const mainWrap   = document.getElementById('main-image-wrap');
  const thumbStrip = document.getElementById('thumb-strip');
  const counter    = document.getElementById('img-counter');
  const prevBtn    = document.getElementById('arrow-prev');
  const nextBtn    = document.getElementById('arrow-next');
  const dragHint   = document.getElementById('drag-hint');

  if (!mainImg || !_images.length) return;

  // The SSR'd <picture><source srcset=...> (webp + responsive width variants)
  // only matches the og/first image's URLs. A plain `mainImg.src = ...` swap
  // is a no-op while a matching <source> is present, so on every slide change
  // we also rewrite each <source>'s srcset to that slide's own responsive
  // variants (gallery images carry the same webp/fallback srcset from the
  // API) — keeping every slide on a width-matched image, not just the first.
  const picture = mainImg.closest('picture');
  const webpSource = picture?.querySelector('source[type="image/webp"]');
  const fallbackSource = picture?.querySelector('source:not([type])');

  function _show(idx) {
    _currentImg = Math.max(0, Math.min(idx, _images.length - 1));
    const slide = _images[_currentImg];

    if (mainVideo && !mainVideo.classList.contains('hidden') && slide.type !== 'video') {
      // Leaving the video slide — pause and rewind so it restarts cleanly next time.
      mainVideo.pause();
      mainVideo.currentTime = 0;
    }

    mainWrap?.classList.toggle('video-active', slide.type === 'video');

    if (slide.type === 'video') {
      mainImg.classList.add('hidden');
      mainVideo?.classList.remove('hidden');
      muteToggle?.classList.remove('hidden');
      if (mainVideo && !mainVideo.src) {
        mainVideo.src = slide.url; // lazy-load: only fetch once this slide becomes active
      }
      if (mainVideo) {
        mainVideo.muted = _videoMuted;
        mainVideo.play().catch(() => {});
      }
    } else {
      mainVideo?.classList.add('hidden');
      muteToggle?.classList.add('hidden');
      mainImg.classList.remove('hidden');
      // An empty/absent srcset removes a <source> from picture's candidate
      // list (per spec), so slides without generated variants fall through
      // to mainImg.src below.
      if (webpSource) {
        if (slide.webpSrcset) webpSource.setAttribute('srcset', slide.webpSrcset);
        else webpSource.removeAttribute('srcset');
      }
      if (fallbackSource) {
        if (slide.fallbackSrcset) fallbackSource.setAttribute('srcset', slide.fallbackSrcset);
        else fallbackSource.removeAttribute('srcset');
      }
      mainImg.src = slide.url;
      mainImg.alt = slide.alt;
    }

    if (counter) counter.textContent = _images.length > 1 ? `${_currentImg + 1} / ${_images.length}` : '';

    // Update thumbs
    thumbStrip?.querySelectorAll('.thumb').forEach((t, i) => {
      t.classList.toggle('active', i === _currentImg);
    });

    // Hide arrows if single slide
    if (prevBtn) prevBtn.classList.toggle('hidden', _images.length <= 1);
    if (nextBtn) nextBtn.classList.toggle('hidden', _images.length <= 1);
    if (dragHint) dragHint.classList.toggle('hidden', _images.length <= 1);
  }

  _showImage = _show;

  // Thumbnails
  if (thumbStrip && _images.length > 1) {
    thumbStrip.innerHTML = _images.map((img, i) => {
      if (img.type === 'video') {
        const posterHtml = img.poster
          ? `<img src="${_esc(img.poster)}" alt="${_esc(img.alt)}" loading="lazy">`
          : '';
        return `<span class="thumb thumb-video${i === 0 ? ' active' : ''}" data-idx="${i}">
          ${posterHtml}
          <span class="thumb-play-icon" aria-hidden="true">▶</span>
        </span>`;
      }
      const thumbSrc = _smallestSrcsetUrl(img.webpSrcset) || _smallestSrcsetUrl(img.fallbackSrcset) || img.url;
      return `<img class="thumb${i === 0 ? ' active' : ''}" src="${_esc(thumbSrc)}" alt="${_esc(img.alt)}" loading="lazy" data-idx="${i}">`;
    }).join('');

    thumbStrip.addEventListener('click', (e) => {
      const thumb = e.target.closest('.thumb');
      if (thumb) _show(parseInt(thumb.dataset.idx, 10));
    });
  }

  // Mute/unmute toggle
  muteToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!mainVideo) return;
    _videoMuted = !_videoMuted;
    mainVideo.muted = _videoMuted;
    muteToggle.textContent = _videoMuted ? '🔇' : '🔊';
    muteToggle.classList.toggle('unmuted', !_videoMuted);
    muteToggle.setAttribute('aria-label', _videoMuted ? 'تفعيل الصوت' : 'كتم الصوت');
    if (!_videoMuted) mainVideo.play().catch(() => {});
  });

  // Hydrate the first slide (activates the video branch when slide 0 is a video)
  _show(0);

  prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); _show(_currentImg - 1); });
  nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); _show(_currentImg + 1); });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') _show(_currentImg - 1);
    if (e.key === 'ArrowLeft')  _show(_currentImg + 1);
  });

  // Click-to-zoom (images only — video has its own controls)
  if (mainWrap) {
    mainWrap.addEventListener('click', (e) => {
      if (_images[_currentImg]?.type === 'video') return;
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

  // Rating — hidden until the product has at least one real review, since
  // a visible "0.0 · 0" with empty stars reads as negative social proof.
  const ratingHtml = reviewCount > 0
    ? `
    <div class="pi-rating">
      <span class="stars">${renderStars(rating)}</span>
      <span>${rating.toFixed(1)} · ${reviewCount} تقييم</span>
    </div>`
    : '';

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
    <div class="pi-option-section" id="size-option-section">
      <div class="pi-option-label">المقاس: <span id="selected-size-label">${_esc(_selectedSize || '—')}</span></div>
      <div class="pi-size-btns">
        ${sizes.map((s) => `<button class="size-btn" data-size="${_esc(s.name)}">${_esc(s.name)}</button>`).join('')}
      </div>
    </div>` : '';

  // Colors
  const colors = product.colors || [];
  const colorsHtml = colors.length ? `
    <div class="pi-option-section" id="color-option-section">
      <div class="pi-option-label">اللون: <span id="selected-color-label">${_esc(_selectedColor || '—')}</span></div>
      <div class="pi-color-swatches">
        ${colors.map((c) => `
          <button class="color-swatch" data-color="${_esc(c.name_ar)}" data-color-id="${c.id}" title="${_esc(c.name_ar)}"
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
    document.getElementById('size-option-section')?.classList.remove('error');
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
    _selectedColorId = parseInt(btn.dataset.colorId, 10) || null;
    const label = document.getElementById('selected-color-label');
    if (label) label.textContent = _selectedColor;
    document.getElementById('color-option-section')?.classList.remove('error');
    _scrollToColorImage(_selectedColorId);
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

    const needsSize  = (product.sizes || []).length > 0 && !_selectedSize;
    const needsColor = (product.colors || []).length > 0 && !_selectedColor;

    if (needsSize || needsColor) {
      document.getElementById('size-option-section')?.classList.toggle('error', needsSize);
      document.getElementById('color-option-section')?.classList.toggle('error', needsColor);

      const missing = [needsSize && 'المقاس', needsColor && 'اللون'].filter(Boolean).join(' و');
      showToast(`يُرجى اختيار ${missing} قبل إتمام الطلب.`);

      document.getElementById(needsSize ? 'size-option-section' : 'color-option-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Open the sheet right away — addToCart() is a real network round trip
    // (ensure-cart + add-item), and making the tap wait on it is what used
    // to show a multi-second "..." spinner before checkout even appeared.
    _openQuickOrder({ pending: true });

    try {
      await addToCart(product.id, _qty, _selectedSize, _selectedColor);
      trackAddToCart({ id: product.id, name: product.name_ar, price, qty: _qty });
      ttAddToCart({ id: product.id, name: product.name_ar, price, qty: _qty });
      _refreshQuickOrderCart();
    } catch {
      _closeQuickOrder();
      showToast('تعذّرت الإضافة، يُرجى المحاولة مجدداً.');
    }
  });
}

// ── Quick-order drawer ────────────────────────────────────
// Tracks the cart contents (ids + qty + total) last reported via
// InitiateCheckout — reopening the drawer without a real change to the
// cart (e.g. re-clicking "Add to Cart" or the sticky bar) must not
// re-fire the event and re-report value already sent to Meta.
let _lastCheckoutSignature = null;

function _updateQuickOrderTotal() {
  const items = getCartItems();
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const shipping = calcShipping();

  const itemsEl = document.getElementById('qo-order-items');
  if (itemsEl) {
    itemsEl.innerHTML = items.map((i) => `
      <div class="qo-item">
        ${i.image ? `<img class="qo-item-img" src="${_esc(i.image)}" alt="">` : ''}
        <div class="qo-item-info">
          <div class="qo-item-name">${_esc(i.productName)}</div>
          <div class="qo-item-meta">${[i.selectedSize, i.selectedColor].filter(Boolean).map(_esc).join(' · ')}${i.selectedSize || i.selectedColor ? ' · ' : ''}الكمية: ${i.qty}</div>
        </div>
        <div class="qo-item-price">${formatPrice(i.lineTotal)}</div>
        <div class="qo-item-qty">
          <button type="button" class="qo-qty-btn" data-action="dec" data-item-id="${i.id}" aria-label="إنقاص الكمية">−</button>
          <span class="qo-qty-val">${i.qty}</span>
          <button type="button" class="qo-qty-btn" data-action="inc" data-item-id="${i.id}" aria-label="زيادة الكمية">+</button>
        </div>
        <button type="button" class="qo-item-remove" data-item-id="${i.id}" aria-label="إزالة المنتج">×</button>
      </div>`).join('');
  }

  const subtotalEl = document.getElementById('qo-subtotal-val');
  const shippingEl = document.getElementById('qo-shipping-val');
  const totalEl = document.getElementById('qo-total-val');
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (shippingEl) shippingEl.textContent = formatPrice(shipping);
  if (totalEl) totalEl.textContent = formatPrice(subtotal + shipping);
}

// `pending: true` opens the sheet before addToCart() has resolved, so the
// tap-to-sheet transition isn't gated on a cart API round trip. The caller
// follows up with _refreshQuickOrderCart() once the cart is confirmed.
function _openQuickOrder({ pending = false } = {}) {
  const drawer = document.getElementById('quick-order');
  if (!drawer) return;

  drawer.classList.add('open');
  document.getElementById('qo-backdrop')?.classList.add('open');
  document.body.classList.add('qo-locked');

  _setQuickOrderPending(pending);

  if (!pending) _refreshQuickOrderCart();
}

function _setQuickOrderPending(isPending) {
  const confirmBtn = document.getElementById('qo-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = isPending;
  if (!isPending) return;

  ['qo-subtotal-val', 'qo-shipping-val', 'qo-total-val'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '...';
  });
  const itemsEl = document.getElementById('qo-order-items');
  if (itemsEl) itemsEl.innerHTML = '';
}

function _refreshQuickOrderCart() {
  _updateQuickOrderTotal();
  _setQuickOrderPending(false);

  const items = getCartItems();
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const signature = items.map((i) => `${i.id}:${i.qty}`).sort().join(',');

  if (signature !== _lastCheckoutSignature) {
    _lastCheckoutSignature = signature;
    trackInitiateCheckout({ items, total });
    ttInitiateCheckout({ items, total });
  }
}

function _closeQuickOrder() {
  document.getElementById('quick-order')?.classList.remove('open');
  document.getElementById('qo-backdrop')?.classList.remove('open');
  document.body.classList.remove('qo-locked');
}

function _wireQuickOrder() {
  document.getElementById('qo-close')?.addEventListener('click', _closeQuickOrder);
  document.getElementById('qo-backdrop')?.addEventListener('click', _closeQuickOrder);

  // Lets the client drop a line they added by mistake (e.g. tapped "أطلب
  // الآن" twice) without leaving the sheet. Closes the sheet if that was
  // the last item left — nothing to check out anymore.
  document.getElementById('qo-order-items')?.addEventListener('click', async (e) => {
    const qtyBtn = e.target.closest('.qo-qty-btn');
    if (qtyBtn) {
      // updateQty() only corrects the line total once its PATCH resolves,
      // so (unlike remove) we wait on it here rather than show a stale
      // price — this is a quick in-sheet tweak, not the first-tap path.
      const itemId = parseInt(qtyBtn.dataset.itemId, 10);
      const item = getCartItems().find((i) => i.id === itemId);
      if (!item) return;

      const newQty = qtyBtn.dataset.action === 'inc' ? item.qty + 1 : item.qty - 1;
      if (newQty < 1) return;

      qtyBtn.closest('.qo-item-qty').querySelectorAll('.qo-qty-btn').forEach((b) => { b.disabled = true; });
      await updateQty(itemId, newQty);
      _refreshQuickOrderCart();
      return;
    }

    const btn = e.target.closest('.qo-item-remove');
    if (!btn) return;

    const itemId = parseInt(btn.dataset.itemId, 10);
    // removeItem() updates the local cart synchronously (before its own
    // internal await on the delete request), so the sheet reflects the
    // removal immediately instead of waiting on that network round trip.
    removeItem(itemId);
    _refreshQuickOrderCart();

    if (getCartItems().length === 0) {
      _closeQuickOrder();
      showToast('تمت إزالة المنتج من السلة.');
    }
  });

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
        ttPurchase({
          orderId: order.order_number,
          items,
          total: parseFloat(order.grand_total_da ?? subtotal + calcShipping()),
        });
        clearCart();
        _closeQuickOrder();
        // Gadget pages are a dead-end landing page — stay put instead of the classic /shop.html default.
        showThanksOverlay(order, product.category?.is_gadget ? window.location.href : undefined);
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

  // Draw attention to the sticky CTA the first time it appears (3 finite
  // pulses via CSS animation, then it stops on its own — see .pulse in
  // product.css) without nagging on every scroll back into view.
  let _pulseFired = false;
  const observer = new IntersectionObserver(
    ([entry]) => {
      const show = !entry.isIntersecting;
      bar.classList.toggle('visible', show);
      if (show && !_pulseFired) {
        _pulseFired = true;
        stickyBtn?.classList.add('pulse');
      }
    },
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
    const isGadget = !!product.category?.is_gadget;
    const urls = [];
    if (catSlug) urls.push(`${API}/shop/products/?category=${catSlug}&page_size=4`);
    // Gadget pages are walled off from the classic catalog — never let the
    // cross-category "is_new" fallback pull in non-gadget products here.
    if (!isGadget) urls.push(`${API}/shop/products/?is_new=true&page_size=4`);

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
            imageWebp:   p.image_webp_url || '',
            imageWebpSrcset: p.image_webp_srcset || '',
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
        trackAddToCart({ id: pid, name: btn.dataset.name, price: parseFloat(btn.dataset.price) || 0, qty: 1 });
        ttAddToCart({ id: pid, name: btn.dataset.name, price: parseFloat(btn.dataset.price) || 0, qty: 1 });
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

  // The product gallery/info/quick-order wiring only need the SSR-embedded
  // product data — render them immediately instead of waiting on nav,
  // footer, cart and thanks-message, which each cost their own API round
  // trip and used to sit in front of this on the critical path.
  _initSlider();
  _renderProductInfo();
  _wireQuickOrder();

  // Nav/footer/cart/thanks-message/wilayas load in parallel in the
  // background — addToCart() only needs the cart id already cached in
  // localStorage, so nothing here blocks on loadCart() finishing. Loading
  // the wilaya list now (instead of lazily on first drawer open) means
  // it's already populated by the time the user taps "أطلب الآن".
  loadCart();
  initNav('/product/');
  initFooter();
  loadThanksMsg();
  initOrderForm(_updateQuickOrderTotal);

  // Non-blocking: related products
  _loadRelated();

  // Facebook Pixel — ViewContent
  trackViewContent({
    id:       product.id,
    name:     product.name_ar,
    category: product.category?.name_ar || '',
    price:    parseFloat(product.price) || 0,
  });
  // TikTok Pixel — ViewContent
  ttViewContent({
    id:       product.id,
    name:     product.name_ar,
    category: product.category?.name_ar || '',
    price:    parseFloat(product.price) || 0,
  });
});
