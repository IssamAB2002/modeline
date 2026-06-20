# MODELINE — Pre-Deploy & Feature Verification Checklist

> **How to use this file**
> Work top-to-bottom. Every section marked **PRE-DEPLOY TASK** must be completed and verified before the
> functional checks beneath it can be trusted. Check off each box as you go.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 | Critical — will break in production |
| 🟠 | Medium — causes bad behaviour |
| 🟡 | Minor — polish / best practice |
| 🔧 PRE-DEPLOY TASK | Must be fixed before the check below can pass |

---

## PART A — Infrastructure & Configuration Fixes

These must all be done before spinning up Docker or running `npm run build`.

### A1 — Backend `settings.py`

- [x] 🔧 **PRE-DEPLOY TASK — Wire `django-environ`**
  Add at top of `settings.py`:
  ```python
  import environ
  env = environ.Env()
  environ.Env.read_env(BASE_DIR / '.env')
  ```
  *(django-environ is already in `requirements.txt` but never called)*

- [x] 🔧 **PRE-DEPLOY TASK — `SECRET_KEY` from env**
  Replace hardcoded `django-insecure-mq@d%...` with:
  ```python
  SECRET_KEY = env('SECRET_KEY')
  ```
  Add `SECRET_KEY=<strong-random-value>` to `.env`.

- [x] 🔧 **PRE-DEPLOY TASK — `DEBUG` from env**
  Replace `DEBUG = True` with:
  ```python
  DEBUG = env.bool('DEBUG', default=False)
  ```
  Add `DEBUG=False` to `.env`.

- [x] 🔧 **PRE-DEPLOY TASK — `ALLOWED_HOSTS`**
  Replace `ALLOWED_HOSTS = []` with your VPS IP and domain, e.g.:
  ```python
  ALLOWED_HOSTS = ['modeline.dz', '1.2.3.4']
  ```

- [x] 🔧 **PRE-DEPLOY TASK — `STATIC_ROOT`**
  Add below `STATIC_URL`:
  ```python
  STATIC_ROOT = BASE_DIR / 'staticfiles'
  ```

- [x] 🔧 **PRE-DEPLOY TASK — `MEDIA_ROOT` / `MEDIA_URL`**
  Add:
  ```python
  MEDIA_ROOT = BASE_DIR / 'media'
  MEDIA_URL = '/media/'
  ```
  Also add to `backend/urls.py` (dev only guard):
  ```python
  from django.conf import settings
  from django.conf.urls.static import static
  if settings.DEBUG:
      urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
  ```

- [x] 🔧 **PRE-DEPLOY TASK — `CORS_ALLOWED_ORIGINS`**
  Add production frontend origin to the list:
  ```python
  CORS_ALLOWED_ORIGINS = [
      'http://localhost:5173',
      'https://modeline.dz',   # ← add this
  ]
  ```

- [ ] **Verify** — run `python manage.py check --deploy` on the VPS. Zero critical warnings expected.

---

### A2 — `requirements.txt`

- [x] 🔧 **PRE-DEPLOY TASK — Add `django-cors-headers`**
  ```
  django-cors-headers>=4.0,<5.0
  ```
  *(package is in `INSTALLED_APPS`/`MIDDLEWARE` but missing from requirements — Docker build will fail)*

- [x] 🔧 **PRE-DEPLOY TASK — Relax `Pillow` version cap**
  Change `Pillow>=9.0,<10.0` → `Pillow>=10.0`

- [x] 🔧 **PRE-DEPLOY TASK — Relax `redis` version cap**
  Change `redis>=4.0,<5.0` → `redis>=5.0`

- [ ] 🟠 **Decide: keep or remove Celery**
  If Celery is not used yet, remove `celery` and `redis` from `requirements.txt` and remove the
  `worker` service from `docker-compose.yml` to avoid a crash-looping container.
  If keeping it, add `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` to `settings.py` and `.env`.

- [ ] **Verify** — `pip install -r requirements.txt` completes without errors in a clean venv.

---

### A3 — Frontend API URLs

- [x] 🔧 **PRE-DEPLOY TASK — Replace all hardcoded `http://127.0.0.1:8000/api` strings**

  Files to update (all 8):

  | File | Line |
  |------|------|
  | `frontend/src/pages/HomePage.jsx` | 9 |
  | `frontend/src/pages/ShopPage.jsx` | 9 |
  | `frontend/src/pages/ProductDetailPage.jsx` | 8 |
  | `frontend/src/pages/CartPage.jsx` | 9 |
  | `frontend/src/pages/AboutPage.jsx` | 8 |
  | `frontend/src/pages/ContactPage.jsx` | 8 |
  | `frontend/src/context/CartContext.jsx` | 3 |
  | `frontend/src/context/FrontSettingsContext.jsx` | *(check first line with `API =`)* |

  Replace each `const API = "http://127.0.0.1:8000/api"` with:
  ```js
  const API = import.meta.env.VITE_API_URL;
  ```

  Create `frontend/.env.production`:
  ```
  VITE_API_URL=https://modeline.dz/api
  ```
  Create `frontend/.env.development` (keep local dev working):
  ```
  VITE_API_URL=http://127.0.0.1:8000/api
  ```

- [ ] **Verify** — `npm run build` outputs `dist/` with no hardcoded `127.0.0.1` strings.
  Quick check: `grep -r "127.0.0.1" dist/` should return nothing.

---

### A4 — Docker & `docker-compose.yml`

- [x] 🔧 **PRE-DEPLOY TASK — Switch `web` service to Gunicorn**
  Change:
  ```yaml
  command: python manage.py runserver 0.0.0.0:8000
  ```
  To:
  ```yaml
  command: gunicorn --bind 0.0.0.0:8000 backend.wsgi:application
  ```

- [ ] **Verify** — `docker compose up` starts without errors; `curl http://localhost:8000/api/home/front-settings/` returns JSON.

---

### A5 — Caddy Config (create from scratch)

- [x] 🔧 **PRE-DEPLOY TASK — Create Caddy config** *(using Caddy instead of Nginx — see `caddy/Caddyfile`)*
  Minimum required:
  ```nginx
  server {
      listen 80;
      server_name modeline.dz;

      # Serve React SPA
      root /var/www/modeline/dist;
      index index.html;
      location / {
          try_files $uri $uri/ /index.html;
      }

      # Django static files
      location /static/ {
          alias /app/staticfiles/;
      }

      # Django media files
      location /media/ {
          alias /app/media/;
      }

      # Reverse proxy to Gunicorn
      location /api/ {
          proxy_pass http://127.0.0.1:8000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }

      location /admin/ {
          proxy_pass http://127.0.0.1:8000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
  }
  ```

- [ ] **Verify** — Direct browser navigation to `/shop`, `/about`, `/cart` loads the page (not a 404).

---

## PART B — Page-by-Page Feature Checks

> **Prerequisite:** All Part A tasks must be completed and the stack must be running on the VPS
> (or a local Docker environment that mirrors it) before checking these.

---

### B1 — HomePage (`/`)

- [x] Page renders without blank white screen
- [x] **Topbar** — CMS text (`FrontSettings.home_topbar`) displays in correct language
- [x] **Nav** — logo, tagline from `FrontSettings.home_nav_logo_tagline` display; cart count badge shows
- [x] **Hero** — eyebrow, title (with `<em>` emphasis), subtitle all load from `FrontSettings`; primary and secondary CTA buttons scroll correctly
- [x] **Categories section** — category cards load from `GET /api/shop/categories/`; images display; clicking a card navigates to `/shop?category=<slug>`
- [x] **Featured Products section** — products load from `GET /api/shop/products/?featured=true`; product images display (served from `/media/`); badge labels show (sale/new/limited/bestseller)
- [x] **Quick-add** — clicking "Add to basket" on a product card increments the nav cart counter without full-page reload
- [x] **Trust Strip** — items load from `GET /api/home/trust-strips/`; falls back to i18n keys if DB is empty (no crash)
- [x] **Testimonials section** — loads from `GET /api/about/reviews/?limit=3`; star rating renders correctly
- [x] **Newsletter section** — "Contact us" button links to `/contact`
- [x] **Footer** — social links (`facebook_url`, `instagram_url`, `whatsapp_url`, `linkedin_url`) load from `GET /api/home/contact-info/`; category links in footer match DB categories; static links (About, Contact) navigate correctly
- [x] **Language toggle** — switching AR ↔ EN re-renders all translatable text correctly; RTL layout applies in Arabic mode

---

### B2 — Shop Page (`/shop`)

- [x] Page renders; product grid loads from `GET /api/shop/products/`
- [x] **Category sidebar filter** — categories load from `GET /api/shop/categories/`; clicking a category appends `?category=<slug>` and re-fetches products
- [x] **URL category pre-select** — landing on `/shop?category=djellaba` pre-selects that category in the sidebar
- [x] **Pagination** — Next/Prev controls appear when total count > 12; page increments correctly and re-fetches
- [x] **Price range slider** — filters displayed product list client-side
- [x] **Sort dropdown** — featured / new / price-asc / price-desc options re-order the list
- [x] **Text search filter** — typing in the search box filters product names client-side
- [x] **Grid / List view toggle** — layout switches without crash
- [x] **Wishlist toggle** — heart icon toggles visual state (client-side only)
- [x] **Add to cart** — quick-add button on product card fires `POST /api/cart/<id>/items/` and increments nav cart count
- [x] **Product card navigation** — clicking a product card navigates to `/product/<id>`
- [x] **Empty state** — when no products match filters, a friendly empty message appears instead of blank space
- [x] **Language toggle** — product names switch between `name` (EN) and `name_ar` (AR)

---

### B3 — Product Detail Page (`/product/:productId`)

- [x] Page loads correct product via `GET /api/shop/products/<id>/`
- [x] **404 handling** — navigating to `/product/99999` shows "not found" state, not a crash
- [x] **Image gallery** — primary image and thumbnails display; clicking thumbnail changes main image; hover zoom works
- [x] **Size selector** — available sizes from `product.available_sizes` render as buttons; unavailable if out-of-stock
- [x] **Color selector** — available colors render; selecting updates `selectedColor` state
- [x] **Quantity stepper** — +/- buttons increment/decrement within stock limits
- [x] **Add to cart** — button fires `POST /api/cart/<id>/items/` with correct size, color, quantity; toast confirmation appears
- [x] **Shipping calculator** — Wilaya dropdown loads from `GET /api/shop/wilayas/` (58 entries); selecting a Wilaya shows its shipping price
- [x] **Tabs** — Description / Details / Reviews tabs switch without crash
- [x] **Reviews list** — approved reviews load from `GET /api/shop/products/<id>/reviews/`; star rating renders; average rating computed
- [x] **Submit review** — form POSTs to `POST /api/shop/products/<id>/reviews/`; success message appears; form resets
- [x] **Related products** — section loads and links to their detail pages
- [x] **Language toggle** — product name, description switch between EN and AR fields

---

### B4 — About Page (`/about`)

- [x] Page renders from `FrontSettings` CMS fields without blank sections
- [x] **Principles section** — loads from `GET /api/about/principles/`
- [x] **Customer reviews section** — approved reviews load from `GET /api/about/reviews/`; star display correct
- [x] **Submit review form** — POSTs to `POST /api/about/reviews/submit/`; success message appears; pending-approval note shown
- [x] **Language toggle** — all bilingual fields switch correctly

---

### B5 — Contact Page (`/contact`)

- [x] Page renders; contact form fields display
- [x] **Showrooms section** — loads from `GET /api/contact/showrooms/`; address, hours, phone display per showroom
- [x] **FAQ section** — loads from `GET /api/contact/faqs/`; accordion opens/closes
- [x] **Contact form** — all fields (name, email, phone, subject, message, inquiry type) accept input
- [x] **Form submission** — POSTs to `POST /api/contact/messages/`; success banner appears after submit; form is reset
- [x] **Error handling** — submitting with missing required fields shows validation feedback
- [x] **Language toggle** — showroom names, FAQ questions/answers switch AR ↔ EN

---

### B6 — Cart Page (`/cart`)

- [x] Page renders; existing cart items load from `CartContext` (seeded from `GET /api/cart/<id>/`)
- [x] **Empty cart state** — displays friendly message with link to `/shop` when cart is empty
- [x] **Item list** — product image (served from `/media/`), name, size, color, unit price, line total all display
- [x] **Quantity update** — +/- buttons call `PATCH /api/cart/items/<id>/` and update totals
- [x] **Remove item** — delete button calls `DELETE /api/cart/items/<id>/delete/`; item disappears; totals recalculate
- [x] **Subtotal** — recalculates correctly after quantity change or removal
- [x] **Wilaya selector** — dropdown loads from `GET /api/shop/wilayas/`; selecting a province shows shipping cost and updates order total
- [x] **Order form** — full name, phone, city, address line, notes fields accept input
- [x] **Place order** — POSTs to `POST /api/orders/` with cart ID, delivery address, wilaya; on success shows order confirmation with order number
- [x] **Order confirmation** — order number displays; "Continue shopping" link navigates to `/shop`; cart is cleared after successful order
- [x] **Language toggle** — button labels, section titles switch AR ↔ EN

---

## PART C — Cross-Cutting Checks

### C1 — Bilingual / i18n

- [x] Language switcher exists and toggles between Arabic (`ar`) and English (`en`)
- [x] All 7 i18n namespaces load without 404 (`/locales/ar/*.json` and `/locales/en/*.json` served by Nginx)
- [x] Arabic mode applies RTL layout (`dir="rtl"`)
- [x] No missing translation keys visible as raw key strings (e.g. `home:hero.primaryCta`) anywhere in the UI

---

### C2 — Navigation & Routing

- [x] Nav renders consistently across all 6 pages
- [x] Direct browser access (hard-reload) to `/shop`, `/about`, `/contact`, `/product/1`, `/cart` returns the SPA (not a 404) — confirms Nginx `try_files` is working
- [x] Active page is visually highlighted in the nav
- [x] Cart badge count is accurate on every page

---

### C3 — Static Assets

- [x] `/image.png` (logo) loads on HomePage hero, Nav, and Newsletter sections
- [x] Google Fonts (Cormorant Garamond, EB Garamond, Cinzel) render correctly
- [x] No duplicate font `<link>` requests in browser Network tab (remove in-JSX `<link>` tags in `ShopPage`, `CartPage`, `ProductDetailPage`)
- [x] Django admin static files load at `/admin/` (`python manage.py collectstatic` ran successfully)

---

### C4 — Media / Image Uploads

- [x] Product images uploaded via Django admin display at `/media/shop/products/<filename>` in the frontend
- [x] Category images display at `/media/shop/categories/<filename>`
- [x] Broken-image placeholders appear gracefully when `image_url` is `null`

---

### C5 — Session & Cart Persistence

- [x] Adding items to cart, closing browser, and reopening restores the cart (uses `localStorage` `bb_cart_id` + `bb_session_key`)
- [x] Cart persists across page navigation without items disappearing

---

### C6 — Admin Panel

- [x] `/admin/` loads and accepts superuser login
- [x] `FrontSettings` singleton is editable; changes reflect on the frontend after page reload
- [x] `ContactInfo` singleton is editable; footer social links update
- [x] Products, Categories, ProductImages manageable with image upload working
- [x] Customer reviews visible and approvable (changing `is_approved` to `True` makes them visible on frontend)
- [x] `ContactMessage` entries (from Contact form submissions) appear in admin
- [x] Wilaya list shows all 58 Algerian provinces with shipping prices

---

## PART D — Minor Cleanup (optional before launch)

- [x] 🟡 Delete `frontend/src/css_diff.py` (stray Python file in React source tree)
- [x] 🟡 Confirm `db.sqlite3` is NOT copied to the VPS (verify `.gitignore` or rsync exclude list)
- [ ] 🟡 Add `base: '/'` to `frontend/vite.config.js` to be explicit about root deployment
- [ ] 🟡 Remove duplicate Google Fonts `<link>` tags from `ShopPage.jsx`, `CartPage.jsx`, `ProductDetailPage.jsx` (fonts already in `index.html`)

---

## Part E — Final Go/No-Go

| Check | Status |
|-------|--------|
| `python manage.py check --deploy` → 0 critical issues | ☐ |
| `grep -r "127.0.0.1" frontend/dist/` → 0 results | ☐ |
| `docker compose up` → all containers healthy | ☐ |
| `curl https://modeline.dz/api/home/front-settings/` → 200 JSON | ☐ |
| `curl https://modeline.dz/api/shop/products/` → 200 JSON with results | ☐ |
| Hard-reload of `https://modeline.dz/shop` → SPA loads (not 404) | ☐ |
| `/media/` image URL returns image (not 404) | ☐ |
| Arabic / English toggle works on live URL | ☐ |
| Place a test order end-to-end; order number appears in Django admin | ☐ |
| `/admin/` loads and static files render correctly | ☐ |
