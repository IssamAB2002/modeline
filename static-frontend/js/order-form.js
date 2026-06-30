// Quick-order module for the product page — mirrors the checkout logic in
// cart-page.js (wilaya/baladia, validation, submit, thanks overlay) but
// scoped to the "qo-" prefixed fields inside the #quick-order drawer.
import { API } from './config.js';
import { apiFetch } from './api.js';
import { formatPrice } from './utils.js';

let _wilayas = [];
let _selectedWilaya = null;
let _shippingType = 'home';
let _isSubmitting = false;
let _thanksMsg = '';

function _esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getShippingType() {
  return _shippingType;
}

export function calcShipping() {
  if (!_selectedWilaya) return 700;
  return _shippingType === 'desk'
    ? parseFloat(_selectedWilaya.shipping_price_desk_da || 450)
    : parseFloat(_selectedWilaya.shipping_price_home_da || 700);
}

async function _loadWilayas(onChange) {
  try {
    const res = await fetch(`${API}/shop/wilayas/`);
    if (res.ok) _wilayas = await res.json();
  } catch { /* graceful */ }

  const wilayaEl = document.getElementById('qo-field-wilaya');
  if (!wilayaEl) return;

  wilayaEl.innerHTML = '<option value="">— اختر الولاية —</option>'
    + _wilayas.map((w, i) => `<option value="${w.id}" data-idx="${i}">(${w.code}) ${w.name_ar}</option>`).join('');

  wilayaEl.addEventListener('change', async () => {
    const idx = wilayaEl.selectedOptions[0]?.dataset.idx;
    _selectedWilaya = idx !== undefined ? _wilayas[parseInt(idx, 10)] : null;
    onChange();
    await _loadBaladias(wilayaEl.value);
  });
}

async function _loadBaladias(wilayaId) {
  const baladiaEl = document.getElementById('qo-field-baladia');
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

function _wireShippingToggle(onChange) {
  document.querySelectorAll('#quick-order .shipping-type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#quick-order .shipping-type-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      _shippingType = btn.dataset.type;
      document.getElementById('qo-form-grid')?.classList.toggle('desk-mode', _shippingType === 'desk');
      onChange();
    });
  });
}

function _validate() {
  const name      = document.getElementById('qo-field-name')?.value.trim() || '';
  const phone     = document.getElementById('qo-field-phone')?.value.trim() || '';
  const wilayaId  = document.getElementById('qo-field-wilaya')?.value;
  const baladiaId = document.getElementById('qo-field-baladia')?.value;
  const address   = document.getElementById('qo-field-address')?.value.trim() || '';

  if (name.length < 2) return 'يُرجى إدخال الاسم الكامل (حرفان على الأقل).';
  if (!phone) return 'يُرجى إدخال رقم الهاتف.';
  if (_shippingType === 'home') {
    if (!wilayaId) return 'يُرجى اختيار الولاية.';
    if (!baladiaId) return 'يُرجى اختيار البلدية.';
    if (!address) return 'يُرجى إدخال العنوان التفصيلي.';
  }
  return null;
}

// Loads wilayas + wires the home/desk toggle. `onChange` re-renders the
// caller's total whenever shipping cost changes.
export function initOrderForm(onChange) {
  _loadWilayas(onChange);
  _wireShippingToggle(onChange);
}

export async function placeQuickOrder({ cartId, onSuccess }) {
  if (_isSubmitting) return;

  const errEl = document.getElementById('qo-form-error');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }

  const err = _validate();
  if (err) {
    if (errEl) { errEl.textContent = err; errEl.style.display = 'block'; }
    return;
  }

  if (!cartId) {
    if (errEl) { errEl.textContent = 'لم يتم العثور على السلة، يُرجى إعادة المحاولة.'; errEl.style.display = 'block'; }
    return;
  }

  const wilayaEl  = document.getElementById('qo-field-wilaya');
  const baladiaEl = document.getElementById('qo-field-baladia');
  const selectedWilayaName  = wilayaEl?.selectedOptions[0]?.textContent?.replace(/^\(\d+\)\s*/, '').trim() || '';
  const selectedBaladiaName = baladiaEl?.selectedOptions[0]?.dataset.name || '';

  const payload = {
    cart_id:       cartId,
    shipping_da:   calcShipping(),
    shipping_type: _shippingType,
    full_name:     document.getElementById('qo-field-name')?.value.trim() || '',
    phone:         document.getElementById('qo-field-phone')?.value.trim() || '',
    city:          selectedWilayaName,
    baladia:       _shippingType === 'home' ? selectedBaladiaName : '',
    address_line:  _shippingType === 'home' ? (document.getElementById('qo-field-address')?.value.trim() || '') : '',
    notes:         document.getElementById('qo-field-notes')?.value.trim() || '',
  };

  const btn = document.getElementById('qo-confirm-btn');
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

    if (btn) { btn.disabled = false; btn.textContent = 'تأكيد الطلب'; }
    _isSubmitting = false;
    onSuccess(data);
  } catch {
    if (errEl) { errEl.textContent = 'حدث خطأ في الاتصال، يُرجى المحاولة مجدداً.'; errEl.style.display = 'block'; }
    if (btn) { btn.disabled = false; btn.textContent = 'تأكيد الطلب'; }
    _isSubmitting = false;
  }
}

export async function loadThanksMsg() {
  try {
    const res = await fetch(`${API}/orders/thanks-message/`);
    if (res.ok) {
      const data = await res.json();
      _thanksMsg = data.body || '';
    }
  } catch { /* graceful */ }
}

export function showThanksOverlay(order, redirectUrl = '/shop.html') {
  const overlay  = document.getElementById('thanks-overlay');
  const orderNum = document.getElementById('thanks-order-num');
  const msgEl    = document.getElementById('thanks-msg');
  const totalEl  = document.getElementById('thanks-total');
  const bar      = document.getElementById('thanks-countdown-bar');

  if (orderNum) orderNum.textContent = `رقم الطلب: ${order.order_number || ''}`;
  if (msgEl)    msgEl.textContent    = _thanksMsg || 'سيتواصل معك فريقنا قريباً لتأكيد طلبك وتحديد موعد التوصيل.';
  if (totalEl)  totalEl.textContent  = order.grand_total_da ? `الإجمالي: ${formatPrice(order.grand_total_da)}` : '';

  if (overlay) { overlay.style.display = 'flex'; overlay.removeAttribute('aria-hidden'); }

  const DURATION = 6000;
  if (bar) {
    bar.style.transition = `transform ${DURATION}ms linear`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { bar.style.transform = 'scaleX(0)'; });
    });
  }

  setTimeout(() => { window.location.href = redirectUrl; }, DURATION);
}
