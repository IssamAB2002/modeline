// Production build for static-frontend/: bundles+minifies JS, minifies CSS,
// copies everything else through unchanged. Output goes to ../dist, which
// Dockerfile.frontend copies into the Caddy container instead of the raw
// static-frontend/ tree. Local dev is untouched — it keeps serving
// static-frontend/ directly, no build step required there.
import { build } from 'esbuild';
import { cpSync, rmSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'static-frontend');
const OUT = join(__dirname, '..', 'dist');

// JS entry points — one per page, loaded via <script type="module"> in the
// HTML/Django templates. Shared modules they import (cart.js, config.js,
// components.js, etc.) are deduplicated into shared chunks by --splitting.
const JS_ENTRIES = [
  'js/home.js',
  'js/shop.js',
  'js/cart-page.js',
  'js/about.js',
  'js/contact.js',
  'js/product.js',
].map((f) => join(SRC, f));

const CSS_ENTRIES = readdirSync(join(SRC, 'css'))
  .filter((f) => f.endsWith('.css'))
  .map((f) => join(SRC, 'css', f));

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 1. Copy everything through as-is (HTML, assets/, etc.). js/ and css/ are
//    cleared right after — esbuild below writes only the final bundled
//    entries/chunks, not the raw per-module source files.
cpSync(SRC, OUT, { recursive: true });
rmSync(join(OUT, 'js'), { recursive: true, force: true });
rmSync(join(OUT, 'css'), { recursive: true, force: true });

// 2. Bundle + minify JS (ESM, code-split shared modules).
await build({
  entryPoints: JS_ENTRIES,
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  outdir: join(OUT, 'js'),
  outbase: join(SRC, 'js'),
  target: ['es2020'],
  logLevel: 'info',
});

// 3. Minify CSS in place (no bundling — main.css stays its own cached file
//    shared across pages instead of being duplicated into each page bundle).
await build({
  entryPoints: CSS_ENTRIES,
  bundle: false,
  minify: true,
  outdir: join(OUT, 'css'),
  logLevel: 'info',
});

console.log('Build complete ->', OUT);
