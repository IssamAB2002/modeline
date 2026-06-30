import { API } from './config.js';

export function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

export async function ensureCsrf() {
  if (!getCookie('csrftoken')) {
    await fetch(`${API}/csrf/`, { credentials: 'include' });
  }
}

export function getOrCreateSessionKey() {
  let key = localStorage.getItem('bb_session_key');
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem('bb_session_key', key);
  }
  return key;
}

// Central fetch wrapper — adds credentials + CSRF header on mutating requests.
export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...options.headers };

  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    await ensureCsrf();
    headers['X-CSRFToken'] = getCookie('csrftoken');
    if (options.body && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options = { ...options, body: JSON.stringify(options.body) };
    }
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  return res;
}
