// Direct port of frontend/src/utils/pixel.js — no changes to event logic.
const safe = (...args) => typeof window.fbq === 'function' && window.fbq(...args);

export function trackViewContent({ id, name, category, price }) {
  safe('track', 'ViewContent', {
    content_ids: [String(id)],
    content_name: name,
    content_category: category || '',
    value: price,
    currency: 'DZD',
    content_type: 'product',
  });
}

export function trackAddToCart({ id, name, price, qty = 1 }) {
  safe('track', 'AddToCart', {
    content_ids: [String(id)],
    content_name: name,
    value: price * qty,
    currency: 'DZD',
    num_items: qty,
    content_type: 'product',
  });
}

export function trackInitiateCheckout({ items, total }) {
  safe('track', 'InitiateCheckout', {
    content_ids: items.map((i) => String(i.productId)),
    value: total,
    num_items: items.reduce((s, i) => s + i.qty, 0),
    currency: 'DZD',
    content_type: 'product',
  });
}

export function trackPurchase({ orderId, items, total }) {
  safe('track', 'Purchase', {
    content_ids: items.map((i) => String(i.productId)),
    order_id: String(orderId),
    value: total,
    num_items: items.reduce((s, i) => s + i.qty, 0),
    currency: 'DZD',
    content_type: 'product',
  });
}
