// API base URL — no trailing slash.
// All Django URLs live under /api/, so this prefix is required.
// Local dev
export const API = 'http://localhost:8000/api';

// Production (restore before deploying)
// export const API = '/api';

// Origin for full-page navigations to Django-rendered routes (/product/<id>/).
// Local dev: the static frontend (python -m http.server) and Django run on
// different ports, so links must point at Django directly.
// Production: Caddy reverse-proxies /product/* on the same origin — keep empty.
export const SITE_ORIGIN = 'http://localhost:8000';

// Production (restore before deploying)
// export const SITE_ORIGIN = '';
