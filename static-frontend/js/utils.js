// Shared utility functions used across 2+ page modules.

export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Formats a number as Algerian price string: "12,500 DA"
export function formatPrice(amount) {
  if (amount == null) return '';
  return Number(amount).toLocaleString('ar-DZ') + ' DA';
}

// Returns a 5-star string: "★★★★☆"
export function renderStars(rating) {
  const r = Math.min(5, Math.max(0, Math.round(parseFloat(rating) || 0)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

// Shows the global .toast element with a message, auto-hides after `ms`.
export function showToast(msg, ms = 3000) {
  let el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), ms);
}
