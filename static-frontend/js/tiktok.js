const safe = (...args) => typeof window.ttq === 'function' && window.ttq(...args);

// Unique per-call ID — lets TikTok dedupe this browser event against a future
// server-side (Events API) event carrying the same event_id.
function genEventId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function trackViewContent({ id, name, category, price }) {
  safe('track', 'ViewContent', {
    content_id: String(id),
    content_name: name,
    content_category: category || '',
    value: price,
    currency: 'DZD',
    content_type: 'product',
  }, { event_id: genEventId('vc') });
}

export function trackAddToCart({ id, name, price, qty = 1 }) {
  safe('track', 'AddToCart', {
    content_id: String(id),
    content_name: name,
    value: price * qty,
    currency: 'DZD',
    quantity: qty,
    content_type: 'product',
  }, { event_id: genEventId('atc') });
}

export function trackInitiateCheckout({ items, total }) {
  safe('track', 'InitiateCheckout', {
    contents: items.map((i) => ({ content_id: String(i.productId) })),
    value: total,
    quantity: items.reduce((s, i) => s + i.qty, 0),
    currency: 'DZD',
    content_type: 'product',
  }, { event_id: genEventId('ic') });
}

// Orders already placed in this page's lifetime — guards against a
// CompletePayment event firing twice for the same order.
const _purchaseTracked = new Set();

export function trackPurchase({ orderId, items, total }) {
  const key = String(orderId);
  if (_purchaseTracked.has(key)) return;
  _purchaseTracked.add(key);

  safe('track', 'CompletePayment', {
    contents: items.map((i) => ({ content_id: String(i.productId) })),
    order_id: key,
    value: total,
    quantity: items.reduce((s, i) => s + i.qty, 0),
    currency: 'DZD',
    content_type: 'product',
  }, { event_id: `purchase_${key}` });
}
