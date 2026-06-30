import { API } from './config.js';
import { loadCart, getCartItems, getCartId, updateQty, removeItem, clearCart, onCartChange } from './cart.js';
import { loadSettings } from './settings.js';
import { initNav } from './nav.js';
import { initFooter } from './footer.js';
import { apiFetch } from './api.js';
import { showToast, formatPrice } from './utils.js';
import { trackInitiateCheckout, trackPurchase } from './pixel.js';

// ── State ────────────────────────────────────────────────
let _wilayas = [];
let _selectedWilaya = null;
let _shippingType = 'home';      // 'home' | 'desk'
let _thanksMsg = '';
let _isSubmitting = false;

// ── Render cart items ────────────────────────────────────
function _renderItems() {
  const items = getCartItems();
  const listEl = document.getElementById('cart-items-list');
  const layoutEl = document.getElementById('cart-layout');
  const emptyEl = document.getElementById('cart-empty');

  if (!listEl) return;

  if (!items.length) {
    if (layoutEl) layoutEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (layoutEl) layoutEl.style.display = '';
  if (emptyEl) emptyEl.style.display = 'none';

  listEl.innerHTML = items.map((item) => {
    const meta = [
      item.selectedSize  ? `مقاس: ${item.selectedSize}` : '',
      item.selectedColor ? `لون: ${item.selectedColor}` : '',
    ].filter(Boolean).join(' — ');

    return `
      <div class="cart-item" data-item-id="${item.id}">
        <img
          class="cart-item-img"
          src="${item.image || ''}"
          alt="${_esc(item.productName)}"
          loading="lazy"
        >
        <div class="cart-item-info">
          <div class="cart-item-name">${_esc(item.productName)}</div>
          ${meta ? `<div class="cart-item-meta"><span>${_esc(meta)}</span></div>` : ''}
          <div class="cart-item-qty">
            <button class="qty-btn" data-action="minus" data-item="${item.id}" aria-label="تقليل">−</button>
            <span class="qty-display">${item.qty}</span>
            <button class="qty-btn" data-action="plus" data-item="${item.id}" aria-label="زيادة">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <div class="cart-item-price">${formatPrice(item.lineTotal)}</div>
          <button class="cart-remove-btn" data-item="${item.id}">حذف</button>
        </div>
      </div>`;
  }).join('');

  _renderSummary();
}

// ── Render order summary ─────────────────────────────────
function _renderSummary() {
  const items = getCartItems();
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const shipping = _calcShipping();
  const total = subtotal + shipping;

  const _set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  _set('subtotal-val', formatPrice(subtotal));
  _set('shipping-val', shipping === 0 ? 'مجاني' : formatPrice(shipping));
  _set('total-val', formatPrice(total));
}

function _calcShipping() {
  if (!_selectedWilaya) return 700;   // default fallback
  return _shippingType === 'desk'
    ? parseFloat(_selectedWilaya.shipping_price_desk_da || 450)
    : parseFloat(_selectedWilaya.shipping_price_home_da || 700);
}

// ── Qty and remove via event delegation ──────────────────
function _wireItemActions() {
  document.addEventListener('click', async (e) => {
    const qtyBtn = e.target.closest('.qty-btn');
    const removeBtn = e.target.closest('.cart-remove-btn');

    if (qtyBtn) {
      const itemId = parseInt(qtyBtn.dataset.item, 10);
      const action  = qtyBtn.dataset.action;
      const item    = getCartItems().find((i) => i.id === itemId);
      if (!item) return;
      const newQty = action === 'plus' ? item.qty + 1 : item.qty - 1;
      if (newQty < 1) {
        await removeItem(itemId);
      } else {
        await updateQty(itemId, newQty);
      }
      _renderItems();
      return;
    }

    if (removeBtn) {
      const itemId = parseInt(removeBtn.dataset.item, 10);
      await removeItem(itemId);
      _renderItems();
    }
  });
}

// ── Wilaya select ────────────────────────────────────────
async function _loadWilayas() {
  try {
    const res = await fetch(`${API}/shop/wilayas/`);
    if (res.ok) _wilayas = await res.json();
  } catch { /* graceful */ }

  const wilayaEl = document.getElementById('field-wilaya');
  if (!wilayaEl) return;

  wilayaEl.innerHTML = '<option value="">— اختر الولاية —</option>'
    + _wilayas.map((w) => `<option value="${w.id}" data-idx="${_wilayas.indexOf(w)}">(${w.code}) ${w.name_ar}</option>`).join('');

  wilayaEl.addEventListener('change', async () => {
    const idx = wilayaEl.selectedOptions[0]?.dataset.idx;
    _selectedWilaya = idx !== undefined ? _wilayas[parseInt(idx, 10)] : null;
    _renderSummary();
    await _loadBaladias(wilayaEl.value);
  });
}

async function _loadBaladias(wilayaId) {
  const baladiaEl = document.getElementById('field-baladia');
  if (!baladiaEl) return;

  baladiaEl.innerHTML = '<option value="">جاري التحميل…</option>';

  if (!wilayaId) {
    baladiaEl.innerHTML = '<option value="">— اختر البلدية —</option>';
    return;
  }

  try {
    const res = await fetch(`${API}/shop/baladias/?wilaya_id=${wilayaId}`);
    const data = res.ok ? await res.json() : [];
    baladiaEl.innerHTML = '<option value="">— اختر البلدية —</option>'
      + data.map((b) => `<option value="${b.id}" data-name="${_esc(b.name_ar)}">${b.name_ar}</option>`).join('');
  } catch {
    baladiaEl.innerHTML = '<option value="">— اختر البلدية —</option>';
  }
}

// ── Shipping type toggle ──────────────────────────────────
function _wireShippingToggle() {
  const formEl = document.getElementById('delivery-panel');

  document.querySelectorAll('.shipping-type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shipping-type-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      _shippingType = btn.dataset.type;
      if (formEl) formEl.classList.toggle('desk-mode', _shippingType === 'desk');
      _renderSummary();
    });
  });
}

// ── Validation ────────────────────────────────────────────
function _validate() {
  const name    = document.getElementById('field-name')?.value.trim() || '';
  const phone   = document.getElementById('field-phone')?.value.trim() || '';
  const wilayaEl = document.getElementById('field-wilaya');
  const wilayaId = wilayaEl?.value;
  const baladiaEl = document.getElementById('field-baladia');
  const baladiaId = baladiaEl?.value;
  const address = document.getElementById('field-address')?.value.trim() || '';

  if (name.length < 2) return 'يُرجى إدخال الاسم الكامل (حرفان على الأقل).';
  if (!phone) return 'يُرجى إدخال رقم الهاتف.';
  if (_shippingType === 'home') {
    if (!wilayaId) return 'يُرجى اختيار الولاية.';
    if (!baladiaId) return 'يُرجى اختيار البلدية.';
    if (!address) return 'يُرجى إدخال العنوان التفصيلي.';
  }
  return null;
}

// ── Place order ───────────────────────────────────────────
async function _placeOrder() {
  if (_isSubmitting) return;

  const errEl = document.getElementById('form-error');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

  const validationErr = _validate();
  if (validationErr) {
    if (errEl) { errEl.textContent = validationErr; errEl.style.display = 'block'; }
    return;
  }

  const items = getCartItems();
  if (!items.length) { showToast('سلتك فارغة.'); return; }

  const cartId = getCartId();
  if (!cartId) { showToast('لم يتم العثور على السلة، يُرجى إعادة المحاولة.'); return; }

  // Gather form values
  const wilayaEl   = document.getElementById('field-wilaya');
  const baladiaEl  = document.getElementById('field-baladia');
  const selectedWilayaName  = wilayaEl?.selectedOptions[0]?.textContent?.replace(/^\(\d+\)\s*/, '').trim() || '';
  const selectedBaladiaName = baladiaEl?.selectedOptions[0]?.dataset.name || baladiaEl?.selectedOptions[0]?.textContent?.trim() || '';

  const payload = {
    cart_id:       cartId,
    shipping_da:   _calcShipping(),
    shipping_type: _shippingType,
    full_name:     document.getElementById('field-name')?.value.trim() || '',
    phone:         document.getElementById('field-phone')?.value.trim() || '',
    city:          selectedWilayaName,
    baladia:       _shippingType === 'home' ? selectedBaladiaName : '',
    address_line:  _shippingType === 'home' ? (document.getElementById('field-address')?.value.trim() || '') : '',
    notes:         document.getElementById('field-notes')?.value.trim() || '',
  };

  const btn = document.getElementById('btn-place-order');
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  _isSubmitting = true;

  try {
    const res = await apiFetch('/orders/', { method: 'POST', body: payload });
    const data = await res.json();

    if (!res.ok) {
      const msg = data?.detail || Object.values(data)?.[0]?.[0] || 'حدث خطأ، يُرجى المحاولة مجدداً.';
      if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
      if (btn) { btn.disabled = false; btn.textContent = 'تأكيد الطلب'; }
      _isSubmitting = false;
      return;
    }

    // Pixel
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    trackPurchase({
      orderId: data.order_number,
      items,
      total: parseFloat(data.grand_total_da ?? subtotal + _calcShipping()),
    });

    clearCart();
    _showThanks(data);
  } catch {
    if (errEl) { errEl.textContent = 'حدث خطأ في الاتصال، يُرجى المحاولة مجدداً.'; errEl.style.display = 'block'; }
    if (btn) { btn.disabled = false; btn.textContent = 'تأكيد الطلب'; }
    _isSubmitting = false;
  }
}

// ── Thanks overlay + countdown ────────────────────────────
function _showThanks(order) {
  const overlay  = document.getElementById('thanks-overlay');
  const orderNum = document.getElementById('thanks-order-num');
  const msgEl    = document.getElementById('thanks-msg');
  const totalEl  = document.getElementById('thanks-total');
  const bar      = document.getElementById('thanks-countdown-bar');

  if (orderNum) orderNum.textContent = `رقم الطلب: ${order.order_number || ''}`;
  if (msgEl)    msgEl.textContent    = _thanksMsg || 'سيتواصل معك فريقنا قريباً لتأكيد طلبك وتحديد موعد التوصيل.';
  if (totalEl)  totalEl.textContent  = order.grand_total_da ? `الإجمالي: ${formatPrice(order.grand_total_da)}` : '';

  if (overlay) { overlay.style.display = 'flex'; overlay.removeAttribute('aria-hidden'); }

  // 6-second countdown then redirect
  const DURATION = 6000;
  if (bar) {
    bar.style.transition = `transform ${DURATION}ms linear`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { bar.style.transform = 'scaleX(0)'; });
    });
  }

  setTimeout(() => { window.location.href = '/shop.html'; }, DURATION);
}

// ── Thanks message fetch ──────────────────────────────────
async function _loadThanksMsg() {
  try {
    const res = await fetch(`${API}/orders/thanks-message/`);
    if (res.ok) {
      const data = await res.json();
      _thanksMsg = data.body || '';
    }
  } catch { /* graceful */ }
}

// ── Escape helper ─────────────────────────────────────────
function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadCart();

  await Promise.all([
    initNav('/cart.html'),
    initFooter(),
    _loadWilayas(),
    _loadThanksMsg(),
  ]);

  _renderItems();
  _wireItemActions();
  _wireShippingToggle();

  // Pixel — InitiateCheckout if cart has items
  const items = getCartItems();
  if (items.length) {
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    trackInitiateCheckout({ items, total: subtotal });
  }

  // Cart changes re-render items + summary
  onCartChange(() => {
    _renderItems();
    _renderSummary();
  });

  // Place order button
  document.getElementById('btn-place-order')?.addEventListener('click', _placeOrder);
});
