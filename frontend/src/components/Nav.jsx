import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../hooks/useLang';

/**
 * Nav component extracted from existing pages.
 * IMPORTANT: This component only renders the navigation structure.
 * Page-specific styling (CSS classes / inline styles) remains in each page.
 */
export default function Nav({ variant = 'default', cartCount = 0, activePath = '', navTagline = '' }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentLang, t, toggleLanguage } = useLang();

  const menuRef = useRef(null);

  const isActive = (path) => (activePath === path ? 'active' : '');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const targetEl = event.target;

      const clickedInsideMenu =
        menuRef.current && menuRef.current.contains(targetEl);

      if (!clickedInsideMenu) setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [activePath]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="nav-shell">
      <nav>
        <Link to="/" className="nav-logo">
          {t('nav.brand')}
          <span>{navTagline || t('nav.tagline')}</span>
        </Link>

        <ul className="nav-links">
          <li>
            <Link to="/" className={isActive("/")}>
              {t('nav.home')}
            </Link>
          </li>
          <li>
            <Link to="/shop" className={isActive("/shop")}>
              {t('nav.shop')}
            </Link>
          </li>
          <li>
            <Link to="/about" className={isActive("/about")}>
              {t('nav.about')}
            </Link>
          </li>
          <li>
            <Link to="/contact" className={isActive("/contact")}>
              {t('nav.contact')}
            </Link>
          </li>
        </ul>

        <div className="nav-actions">
          <Link
            to={"/cart"}
            className="cart-btn nav-action-link"
            aria-label={`Basket (${cartCount})`}
            style={{ position: 'relative' }}
          >
            <span
              className="nav-icon basket-icon-wrap desktop-hide"
              aria-hidden="true"
            >
              {/* basket/cart */}
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 7h15l-1.5 9h-12z"></path>
                <path d="M6 7l-2-2"></path>
                <path d="M9 7V4h6v3"></path>
                <circle cx="9.5" cy="20" r="1"></circle>
                <circle cx="17.5" cy="20" r="1"></circle>
              </svg>

              <span className="cart-count-badge" aria-hidden="true">
                {cartCount}
              </span>
            </span>

            <span className="nav-action-text desktop-cart-text-white">
              {t('nav.basket')}
            </span>

            {/* Desktop-only cart count badge */}
            {cartCount > 0 && (
              <span className="desktop-cart-badge" aria-hidden="true">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Language Switcher (explicit for i18n integration) */}
          <button
            onClick={toggleLanguage}
            className="lang-switcher"
            aria-label="Toggle language"
          >
            {currentLang === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="nav-hamburger"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
        >
          <span className="hamburger-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Mobile Dropdown Menu */}
        <div
          id="mobile-menu"
          className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
          ref={menuRef}
        >
          <ul className="mobile-nav-links">
            <li>
              <Link to="/" className={isActive("/")} onClick={closeMenu}>
                {t('nav.home')}
              </Link>
            </li>
            <li>
              <Link to="/shop" className={isActive("/shop")} onClick={closeMenu}>
                {t('nav.shop')}
              </Link>
            </li>
            <li>
              <Link to="/about" className={isActive("/about")} onClick={closeMenu}>
                {t('nav.about')}
              </Link>
            </li>
            <li>
              <Link to="/contact" className={isActive("/contact")} onClick={closeMenu}>
                {t('nav.contact')}
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}
