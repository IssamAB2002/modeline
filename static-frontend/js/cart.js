// Cart state module — ES modules are singletons, so this state is shared
// across all importers on the same page. One source of truth per page load.
import { apiFetch, ensureCsrf, getCookie, getOrCreateSessionKey } from './api.js';

const BADGE_AR = {
  sale: 'تخفيض',
  new: 'جديد',
  limited: 'كمية محدودة',
  bestseller: 'الأكثر مبيعاً',
};

function _normalize(raw) {
  const badgeRaw =
    raw.product_badge && raw.product_badge !== 'none' ? raw.product_badge : null;
  return {
    id: raw.id,
    productId: raw.product,
    productName: raw.product_name_snapshot_ar,
    unitPriceDA: parseFloat(raw.unit_price_da_snapshot),
    qty: raw.quantity,
    selectedSize: raw.selected_size || null,
    selectedColor: raw.selected_color || null,
    sku: raw.sku_snapshot,
    image: raw.product_image_url || '',
    productOrigin: raw.product_origin || '',
    lineTotal: parseFloat(raw.line_total),
    badge: badgeRaw ? (BADGE_AR[badgeRaw.toLowerCase()] ?? badgeRaw) : null,
  };
}

// ── State ──────────────────────────────────────────────────
let _cartId = localStorage.getItem('bb_cart_id')
  ? parseInt(localStorage.getItem('bb_cart_id'), 10)
  : null;
let _cartItems = [];
let _listeners = [];

function _notify() {
  const count = getCartCount();
  _listeners.forEach((fn) => fn(count, _cartItems));
}

// ── Public: subscribe ───────────────────────────────────────
export function onCartChange(fn) {
  _listeners.push(fn);
}

export function getCartCount() {
  return _cartItems.reduce((sum, i) => sum + i.qty, 0);
}

export function getCartItems() {
  return _cartItems;
}

export function getCartId() {
  return _cartId;
}

// ── Load existing cart on page init ────────────────────────
export async function loadCart() {
  if (!_cartId) return;

  try {
    const res = await apiFetch(`/cart/${_cartId}/`);
    if (res.status === 404) {
      localStorage.removeItem('bb_cart_id');
      _cartId = null;
      _cartItems = [];
      _notify();
      return;
    }
    const data = await res.json();
    if (data.status && data.status !== 'active') {
      localStorage.removeItem('bb_cart_id');
      _cartId = null;
      _cartItems = [];
      _notify();
      return;
    }
    _cartItems = (data.items || []).map(_normalize);
    _notify();
  } catch {
    _cartItems = [];
    _notify();
  }
}

// ── Create cart if one doesn't exist ───────────────────────
async function _ensureCart() {
  if (_cartId) return _cartId;

  await ensureCsrf();
  const sessionKey = getOrCreateSessionKey();
  const res = await apiFetch('/cart/', {
    method: 'POST',
    body: { session_key: sessionKey },
  });
  const data = await res.json();
  _cartId = data.id;
  localStorage.setItem('bb_cart_id', String(_cartId));
  return _cartId;
}

// ── Mutations ───────────────────────────────────────────────
export async function addToCart(productId, qty = 1, size = null, color = null) {
  const body = {
    product_id: productId,
    quantity: qty,
    selected_size: size || '',
    selected_color: color || '',
  };

  let id = await _ensureCart();
  let res = await apiFetch(`/cart/${id}/items/`, { method: 'POST', body });

  if (res.status === 404) {
    // Stored cart is no longer active (converted/abandoned) — create a fresh one
    localStorage.removeItem('bb_cart_id');
    _cartId = null;
    _cartItems = [];
    id = await _ensureCart();
    res = await apiFetch(`/cart/${id}/items/`, { method: 'POST', body });
  }

  if (!res.ok) throw new Error('فشل إضافة المنتج إلى السلة');

  const raw = await res.json();
  const item = _normalize(raw);
  const idx = _cartItems.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    _cartItems = _cartItems.map((i) => (i.id === item.id ? item : i));
  } else {
    _cartItems = [..._cartItems, item];
  }
  _notify();
}

export async function updateQty(itemId, newQty) {
  if (newQty < 1) return;

  // Optimistic update
  _cartItems = _cartItems.map((i) => (i.id === itemId ? { ...i, qty: newQty } : i));
  _notify();

  const res = await apiFetch(`/cart/items/${itemId}/`, {
    method: 'PATCH',
    body: { quantity: newQty },
  });
  if (!res.ok) return;
  const raw = await res.json();
  const item = _normalize(raw);
  _cartItems = _cartItems.map((i) => (i.id === item.id ? item : i));
  _notify();
}

export async function removeItem(itemId) {
  // Optimistic remove
  _cartItems = _cartItems.filter((i) => i.id !== itemId);
  _notify();

  await apiFetch(`/cart/items/${itemId}/delete/`, { method: 'DELETE' });
}

export function clearCart() {
  localStorage.removeItem('bb_cart_id');
  _cartId = null;
  _cartItems = [];
  _notify();
}
