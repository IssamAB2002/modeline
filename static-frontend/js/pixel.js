const safe = (...args) => typeof window.fbq === 'function' && window.fbq(...args);

// Unique per-call ID — lets Meta dedupe this browser event against a future
// server-side (Conversions API) event carrying the same eventID.
function genEventId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function trackViewContent({ id, name, category, price }) {
  safe('track', 'ViewContent', {
    content_ids: [String(id)],
    content_name: name,
    content_category: category || '',
    value: price,
    currency: 'DZD',
    content_type: 'product',
  }, { eventID: genEventId('vc') });
}

export function trackAddToCart({ id, name, price, qty = 1 }) {
  safe('track', 'AddToCart', {
    content_ids: [String(id)],
    content_name: name,
    value: price * qty,
    currency: 'DZD',
    num_items: qty,
    content_type: 'product',
  }, { eventID: genEventId('atc') });
}

export function trackInitiateCheckout({ items, total }) {
  safe('track', 'InitiateCheckout', {
    content_ids: items.map((i) => String(i.productId)),
    value: total,
    num_items: items.reduce((s, i) => s + i.qty, 0),
    currency: 'DZD',
    content_type: 'product',
  }, { eventID: genEventId('ic') });
}

// Orders already placed in this page's lifetime — guards against a Purchase
// event firing twice for the same order (e.g. a stray double-invoke).
const _purchaseTracked = new Set();

export function trackPurchase({ orderId, items, total }) {
  const key = String(orderId);
  if (_purchaseTracked.has(key)) return;
  _purchaseTracked.add(key);

  safe('track', 'Purchase', {
    content_ids: items.map((i) => String(i.productId)),
    order_id: key,
    value: total,
    num_items: items.reduce((s, i) => s + i.qty, 0),
    currency: 'DZD',
    content_type: 'product',
  }, { eventID: `purchase_${key}` });
}
