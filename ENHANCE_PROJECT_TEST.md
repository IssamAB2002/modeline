# Enhance Website Speed & Performance
## Insights & Results of PageSpeed Test:
1. For https://modeline.store/product/20/ 
- Performance:
74 Performance
95 Accessibility
100 Best Practices
92 SEO
1/4 Agentic Browsing

- Metrics:

First Contentful Paint 2.7 s
Largest Contentful Paint 4.0 s
Total Blocking Time 110 ms
Cumulative Layout Shift 0.134
Speed Index 4.6 s

- Insights

Render-blocking requests Est savings of 1,930 ms
Layout shift culprits
LCP request discovery
Network dependency tree
Use efficient cache lifetimes Est savings of 2,221 KiB
Improve image delivery Est savings of 1,729 KiB
Legacy JavaScript Est savings of 21 KiB

- Diagnostics

Minify JavaScript Est savings of 2 KiB
Reduce unused JavaScript Est savings of 146 KiB
Avoid enormous network payloads Total size was 2,751 KiB
Avoid long main-thread tasks 3 long tasks found

- Agentic Browsing

Cumulative Layout Shift 0.134
Agent Discoverability
llms.txt does not follow recommendations
ai-catalog.json schema is invalid

2. For "https://modeline.store/product/14/"

- Performance:
60 Performance
95 Accessibility
100 Best Practices
92 SEO
1/4 Agentic Browsing

- Metrics:

First Contentful Paint 2.8 s
Largest Contentful Paint 5.4 s
Total Blocking Time 300 ms
Cumulative Layout Shift 0.134
Speed Index 5.3 s

- Insights

Render-blocking requests Est savings of 1,920 ms
Use efficient cache lifetimes Est savings of 10,895 KiB
Layout shift culprits
LCP breakdown
LCP request discovery
Network dependency tree
Improve image delivery Est savings of 10,393 KiB
Legacy JavaScript Est savings of 21 KiB

- Diagnostics:

Reduce unused JavaScript Est savings of 146 KiB
Minify JavaScript Est savings of 2 KiB
Avoid enormous network payloads Total size was 11,427 KiB

- Agentic Browsing

Cumulative Layout Shift 0.134
Agent Discoverability
llms.txt does not follow recommendations
ai-catalog.json schema is invalid

3. for "https://modeline.store/shop.html"

- Performance:
61 Performance
90 Accessibility
100 Best Practices
92 SEO 
0/4 Agentic Browsing

- Metrics

First Contentful Paint 2.9 s
Largest Contentful Paint 7.1 s
Total Blocking Time 170 ms
Cumulative Layout Shift 0.134
Speed Index 5.1 s

- Insights 

Render-blocking requests Est savings of 1,580 ms
Use efficient cache lifetimes Est savings of 4,983 KiB
Legacy JavaScript Est savings of 21 KiB
Layout shift culprits
Forced reflow
LCP request discovery
Network dependency tree
Improve image delivery Est savings of 4,518 KiB

- Diagnostics

Reduce unused JavaScript Est savings of 147 KiB
Avoid enormous network payloads Total size was 5,511 KiB

- Agentic Browsing

Cumulative Layout Shift 0.134
Agent Accessibility
Accessibility tree is not well-formed
These audits highlight best practices for improving the accessibility of the website for AI agents.
Agent Discoverability
llms.txt does not follow recommendations
ai-catalog.json schema is invalid

4. For "https://modeline.store/" 

- Performance
59 Performance
93 Accessibility
96 Best Practices
92 SEO
1/4 Agentic Browsing

- Metrics

First Contentful Paint 3.0 s
Largest Contentful Paint 6.4 s
Total Blocking Time 260 ms
Cumulative Layout Shift 0.152
Speed Index 3.9 s

- Insights

Use efficient cache lifetimes Est savings of 4,735 KiB
Render-blocking requests Est savings of 1,790 ms
Legacy JavaScript Est savings of 21 KiB
Layout shift culprits
Forced reflow
LCP request discovery
Network dependency tree
Improve image delivery Est savings of 4,403 KiB

- Diagnostics

Reduce unused JavaScript Est savings of 147 KiB
Avoid enormous network payloads Total size was 5,204 KiB
Avoid long main-thread tasks 4 long tasks found

- Agentic Browsing

Cumulative Layout Shift 0.152
Agent Discoverability
llms.txt does not follow recommendations
ai-catalog.json schema is invalid


---

# Root Cause Analysis & Optimization Plan

## Root Causes

### 1. Caching (Est. 2MB-10MB wasted) — Railway-specific regression
- `WhiteNoiseMiddleware` is installed (`backend/backend/settings.py`) but has **zero `WHITENOISE_*` settings** and no `ManifestStaticFilesStorage`/`STORAGES` config — static files are never hashed, so WhiteNoise can't serve them as `immutable, max-age=31536000` and falls back to short-lived caching.
- `backend/backend/urls.py:37-51` registers `/media/*` via Django's **dev-only** `django.views.static.serve`, and it's wired up unconditionally (not just under `DEBUG`) — so in production on Railway, every product image/video is served with **no `Cache-Control` header at all**.
- The old VPS `Caddyfile` set `Cache-Control: public, max-age=31536000, immutable` directly on `/static/*` and `/media/*`. The new `deploy/Caddyfile.railway` proxies both straight to Django instead and never re-adds that header — a regression introduced by the Railway migration.

### 2. Images (Est. 1.7MB-10MB wasted) — explains the 11MB product/14 page
- Uploaded images are resized to max 1600px / JPEG q82 (`backend/apps/shop/utils.py`), but there is **no responsive `srcset`** — a 280px grid thumbnail downloads the same 1600px file as the full product hero.
- No WebP/AVIF generation anywhere — JPEG/PNG only.
- `Product.image_url` / `video_thumbnail_url` are plain `URLField`s for externally-hosted images that **completely bypass the resize pipeline** — likely the cause of the 11MB product/14 page.
- Homepage hero hot-links a 1600px Unsplash image directly in CSS (`static-frontend/css/home.css:11-16`) — likely the LCP element, loaded from an uncontrolled third-party domain with no `fetchpriority`/`preload`.

### 3. Render-blocking requests (Est. 1.6-1.9s)
- Synchronous Google Fonts `<link>` (no preload-swap pattern) + 2-3 unminified local stylesheets per page, duplicated across `index.html`, `shop.html`, `product_ssr.html`.
- No bundler/minifier (webpack/vite/django-compressor) for the served `static-frontend/` tree — raw unminified CSS/JS.

### 4. Unused/Legacy JS (Est. 146KB unused, 21KB legacy)
- Not first-party code — Facebook Pixel + TikTok Pixel SDKs loaded in full on every page (home/shop/product) for 1-2 tracked events each.

### 5. Layout Shift (CLS 0.13-0.15) / Forced Reflow
- `static-frontend/js/home.js` fetches nav, footer, products grid, trust strip, and testimonials after load and injects via `innerHTML` into empty `<div>`s with no reserved `min-height` — each pops in and shifts content, including the nav bar appearing after the hero already painted.

## Optimization Plan

### Phase 1 — Caching fix (highest ROI, config only, lowest risk) — ✅ DONE
1. ✅ `backend/backend/settings.py` — added `STORAGES["staticfiles"]["BACKEND"] = "whitenoise.storage.CompressedManifestStaticFilesStorage"` and `WHITENOISE_MAX_AGE = 31536000`.
2. ✅ `backend/backend/urls.py` — the unconditional `django.views.static.serve` media route (no cache headers, ran in production) is now only used under `DEBUG`; production serves `/media/*` through a `cache_control(public=True, max_age=86400)`-wrapped view instead.

**Manual step required (not code):** run `python manage.py collectstatic` as part of the Railway build/deploy (check it already runs — if not, add it to the Railway build command or a release step) so WhiteNoise's manifest + hashed filenames exist; without this step, `ManifestStaticFilesStorage` will raise errors looking up unhashed names.

### Phase 2 — Images (biggest payload win) — ✅ DONE
3. ✅ `backend/apps/shop/utils.py` — `generate_responsive_variants()` creates 320/640/1024w JPEG+WebP siblings plus a full-size WebP next to every saved image, written directly to storage by filename convention (no new model fields/migration needed). `get_responsive_sources()`/`get_webp_url()` build `srcset` strings for templates/serializers, skipping any variant that wasn't generated.
4. ✅ Wired into `Product.save()` (`image`, `video_thumbnail`), `ProductImage.save()`, and `Category.save()` (previously had no optimization at all).
5. ✅ `product_ssr.html` + `product_gadget_ssr.html` main image now renders as `<picture>` with WebP `srcset` + JPEG fallback `srcset`, built server-side in `ProductSSRView`. API serializers (`CategorySerializer`, `ProductListSerializer`, `ProductDetailSerializer`, `ProductImageSerializer`) now also expose `image_webp_url`/`webp_url`. `components.js` product cards and `product.js` gallery/slider prefer the WebP URL when present.
6. ✅ Added `validate_external_image_url` (requires `https://`, allowlisted image extension when one is present in the path) to `Product.image_url` and `Product.video_thumbnail_url` — a trivial migration (`0027_alter_product_image_url_and_more.py`) was generated since Django tracks validators in migration state, but it's a no-op at the DB level.
7. ✅ Self-hosted the homepage/about/shared-hero images: downloaded, resized, and converted to JPEG+WebP into `static-frontend/assets/` (`hero-showroom.*`, `story-heritage.*`), replacing the Unsplash hotlinks in `home.css`, `main.css`, `about.html`, and the `settings.js` fallback.
8. ✅ `optimize_product_images` management command now also backfills WebP/responsive variants for existing `Product.image`, `Product.video_thumbnail`, `ProductImage.image`, and `Category.image` (new `--variants-only` flag to skip the resize/recompress pass and just (re)generate variants).

**Found while self-hosting the hero images:** the homepage hero background URL (`photo-1597466599360-3b596c3d7cb7`, `home.css` line 13) was already a dead Unsplash link — 404 in production. It's been replaced with the self-hosted `hero-showroom` photo (the same one used in the newsletter CTA / shared page-hero), since the original photo no longer exists on Unsplash. Worth a quick visual check that this substitution looks right.

**Manual steps required:**
- Run `python manage.py optimize_product_images` on Railway (or `--variants-only` if you don't want existing files re-resized) to backfill WebP/responsive variants for images uploaded before this change.
- Visually confirm the hero-showroom substitution on the homepage and newsletter CTA looks acceptable (see note above).
- Run `python manage.py migrate` to apply the no-op `0027` migration.

### Phase 3 — Render-blocking & JS weight — ✅ DONE
7. ✅ Switched Google Fonts to the preload+swap pattern across all pages (`index.html`, `shop.html`, `cart.html`, `about.html`, `contact.html`, `product_ssr.html`).
8. ✅ **(3.8)** Added a build step that bundles + minifies `static-frontend`'s JS and minifies its CSS before deploy:
   - `frontend-build/` — a small Node package (`esbuild`) with `build.mjs`: bundles the 6 page entry points (`home.js`, `shop.js`, `cart-page.js`, `about.js`, `contact.js`, `product.js`) into minified ESM output with `--splitting` (shared modules like `cart.js`/`config.js`/`components.js`/`utils.js`/etc. get deduped into shared chunk files instead of being duplicated per page), and minifies all 8 CSS files in place (not bundled together — `main.css` stays separate so it's cached once across every page instead of being inlined into each page's bundle). Output goes to `dist/`, mirroring `static-frontend/`'s structure exactly (same `js/`, `css/`, `assets/`, HTML filenames) so no template/HTML path changes were needed.
   - `Dockerfile.frontend` is now a multi-stage build: a `node:20-alpine` stage runs `frontend-build`'s build and produces `dist/`, then the `caddy:alpine` stage copies `dist/` into `/srv` instead of the raw `static-frontend/` tree. Railway already builds from this Dockerfile, so the bundling kicks in automatically on the next deploy — no Railway config changes needed.
   - Local dev is untouched: `static-frontend/` stays served raw, with no build step, for fast iteration. The build only runs inside the Docker image.
9. ✅ Facebook + TikTok Pixel scripts now load via `requestIdleCallback` (falling back to `window.load`) instead of executing immediately in `<head>`, across all pages.

**Manual steps required:**
- After deploying, re-run PageSpeed/Lighthouse on all 4 tested URLs to confirm Total Blocking Time, render-blocking, and "Minify JavaScript"/"Reduce unused JavaScript" savings actually dropped.
- If you add a new page (new HTML file + JS entry), add that JS file to the `JS_ENTRIES` list in `frontend-build/build.mjs` — otherwise it'll ship unbundled/unminified (still works, just not optimized).

### Phase 4 — CLS — ✅ DONE
10. ✅ Reserved approximate space via `min-height` for `#topbar`, `#nav-container`, `#footer-container` (`main.css`), `.product-grid` (shared home/shop/related grids), `.trust-strip`, and `.test-grid` (`home.css`) so injected async content doesn't shift the page.

**Manual step required:** these `min-height` values are estimates (not measured against real rendered content) — load the site after deploying and visually confirm the reserved space roughly matches what gets injected; tighten/loosen the numbers if there's a visible gap or residual jump.

## Not yet started / explicitly deferred
- **Deleting the old `frontend/` (React/Vite) folder** — confirmed safe (nothing in the active deploy references it), but deletion itself is pending user confirmation/action.
