import { loadSettings } from './settings.js';
import { getCartCount, onCartChange } from './cart.js';
// import "../assets/image.png"

// Maps page path to the nav link href that should be marked active.
const NAV_LINKS = [
  { href: '/',           label: 'الرئيسية' },
  { href: '/shop.html',  label: 'المتجر'   },
  { href: '/about.html', label: 'من نحن'   },
  { href: '/contact.html', label: 'تواصل معنا' },
];

function _buildTopbar(text) {
  return `<div class="topbar">${text}</div>`;
}

function _buildNav(activePath, cartCount, tagline) {
  const links = NAV_LINKS.map(({ href, label }) => {
    const isActive = activePath === href;
    return `<li><a href="${href}"${isActive ? ' class="active"' : ''}>${label}</a></li>`;
  }).join('');

  const mobileLinks = NAV_LINKS.map(({ href, label }) => {
    const isActive = activePath === href;
    return `<li><a href="${href}"${isActive ? ' class="active"' : ''}>${label}</a></li>`;
  }).join('');

  const badgeHtml = cartCount > 0
    ? `<span class="desktop-cart-badge" id="cart-badge">${cartCount}</span>`
    : `<span class="desktop-cart-badge" id="cart-badge" style="display:none">${cartCount}</span>`;

  const mobileBadgeHtml =
    `<span class="cart-count-badge" id="cart-badge-mobile">${cartCount > 0 ? cartCount : ''}</span>`;

  return `
    <div class="nav-shell" style="position:relative">
      <nav>
        <a href="/" class="nav-logo">
          Modeline
          <span>${tagline || 'الأزياء التراثية الجزائرية'}</span>
        </a>

        <ul class="nav-links">${links}</ul>

        <div class="nav-actions">
          <a href="/cart.html" class="cart-btn" style="position:relative" aria-label="السلة">
            <span class="nav-icon basket-icon-wrap desktop-hide" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 7h15l-1.5 9h-12z"></path>
                <path d="M6 7l-2-2"></path>
                <path d="M9 7V4h6v3"></path>
                <circle cx="9.5" cy="20" r="1"></circle>
                <circle cx="17.5" cy="20" r="1"></circle>
              </svg>
              ${mobileBadgeHtml}
            </span>
            <span class="nav-action-text">السلة</span>
            ${badgeHtml}
          </a>
        </div>

        <button class="nav-hamburger" id="nav-hamburger" aria-label="فتح القائمة" aria-expanded="false" aria-controls="mobile-menu">
          <span class="hamburger-icon">
            <span></span><span></span><span></span>
          </span>
        </button>

        <div id="mobile-menu" class="mobile-menu">
          <ul class="mobile-nav-links">${mobileLinks}</ul>
        </div>
      </nav>
    </div>`;
}

function _wireHamburger() {
  const btn = document.getElementById('nav-hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  // Close on outside click
  document.addEventListener('mousedown', (e) => {
    const navShell = btn.closest('.nav-shell');
    if (navShell && !navShell.contains(e.target)) {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function _updateBadge(count) {
  const desktop = document.getElementById('cart-badge');
  const mobile  = document.getElementById('cart-badge-mobile');

  if (desktop) {
    desktop.textContent = count;
    desktop.style.display = count > 0 ? '' : 'none';
  }
  if (mobile) {
    mobile.textContent = count > 0 ? count : '';
  }
}

// Public entry point — call once from each page's JS on DOMContentLoaded.
// activePath must match one of the NAV_LINKS href values exactly.
export async function initNav(activePath) {
  const settings = await loadSettings();

  const topbarEl = document.getElementById('topbar');
  if (topbarEl) topbarEl.innerHTML = _buildTopbar(settings.home_topbar);

  const navEl = document.getElementById('nav-container');
  if (navEl) {
    navEl.innerHTML = _buildNav(activePath, getCartCount(), settings.home_nav_logo_tagline);
    _wireHamburger();
  }

  // Keep cart badge in sync as items change
  onCartChange((count) => _updateBadge(count));
}
