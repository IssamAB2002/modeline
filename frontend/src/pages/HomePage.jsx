import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import ProductCard from '../components/ProductCard';
import '../pageStyles/home.css';
import { useLang } from '../hooks/useLang';
import { useFrontSettings } from '../context/FrontSettingsContext';
import { useCart } from '../context/CartContext';

const API = import.meta.env.VITE_API_URL;
const LOGO = '/image.png';
const BRAND = 'MODELINE';

function renderEmphasis(text) {
  const parts = String(text).split(/\{\{em\}\}|\{\{\/em\}\}/);
  return parts.map((part, index) => (index % 2 === 1 ? <em key={index}>{part}</em> : part));
}

function SectionDivider() {
  return (
    <div className="ornament-divider" aria-hidden="true">
      <span className="ornament-sym">*</span>
    </div>
  );
}

function starString(rating) {
  const n = Math.min(5, Math.max(0, Math.round(parseFloat(rating) || 0)));
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

const FALLBACK_TRUST_KEYS = [
  { key: 'dispatch', icon: '✦' },
  { key: 'authentic', icon: '◈' },
  { key: 'returns', icon: '⬡' },
  { key: 'payment', icon: '◇' },
];

export default function HomePage() {
  const { t, currentLang } = useLang();
  const settings = useFrontSettings();
  const { addToCart, cartCount } = useCart();
  const navigate = useNavigate();
  const lang = currentLang.split('-')[0] === 'ar' ? 'ar' : 'en';

  const [showAdded, setShowAdded] = useState(false);
  const [addedProduct, setAddedProduct] = useState('');
  const [dbCategories, setDbCategories] = useState(null);
  const [dbProducts, setDbProducts] = useState(null);
  const [trustStrips, setTrustStrips] = useState(null);
  const [testimonials, setTestimonials] = useState(null);
  const [footerContactInfo, setFooterContactInfo] = useState(null);

  useEffect(() => {
    fetch(`${API}/shop/categories/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDbCategories(Array.isArray(data) ? data : []))
      .catch(() => setDbCategories([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/shop/products/?featured=true`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { setDbProducts([]); return; }
        if (Array.isArray(data.results)) setDbProducts(data.results);
        else if (Array.isArray(data)) setDbProducts(data);
        else setDbProducts([]);
      })
      .catch(() => setDbProducts([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/home/trust-strips/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTrustStrips(Array.isArray(data) ? data : []))
      .catch(() => setTrustStrips([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/about/reviews/?limit=3`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTestimonials(Array.isArray(data) ? data : []))
      .catch(() => setTestimonials([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/home/contact-info/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setFooterContactInfo(data))
      .catch(() => setFooterContactInfo(null));
  }, []);

  const hero = {
    eyebrow: settings.home_hero_eyebrow,
    title: [settings.home_hero_title_line1, settings.home_hero_title_emphasis, settings.home_hero_title_line3],
    subtitle: settings.home_hero_subtitle,
  };

  const renderCategories = () => {
    if (dbCategories === null) return null;
    if (dbCategories.length === 0) {
      return <p className="section-empty-msg">{t('home:categories.empty')}</p>;
    }
    return (
      <div className="cat-grid">
        {dbCategories.map((cat) => (
          <Link key={cat.id} to={`/shop?category=${cat.slug}#products`} className="cat-card">
            {cat.image_url ? (
              <img src={cat.image_url} alt={lang === 'ar' ? (cat.name_ar || cat.name) : cat.name} />
            ) : (
              <div className="cat-card-placeholder" style={{ height: 220, background: '#e8dfc8' }} />
            )}
            <div className="cat-card-overlay">
              <div className="cat-card-label">{cat.is_featured ? t('home:categories.featuredLabel') : ''}</div>
              <div className={`cat-card-title${cat.is_featured ? ' cat-card-title--featured' : ''}`}>
                {lang === 'ar' ? (cat.name_ar || cat.name) : cat.name}
              </div>
              <span className="cat-card-arrow">{t('home:categories.cta')} </span>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const normalizeHomeProduct = (p) => {
    const badgeRaw = p.badge && p.badge !== 'none' && p.badge !== '' ? p.badge : null;
    return {
      id: p.id,
      name: lang === 'ar' ? (p.name_ar || p.name) : p.name,
      origin: p.origin || '',
      price: parseFloat(p.price),
      oldPrice: p.old_price ? parseFloat(p.old_price) : null,
      badge: badgeRaw ? badgeRaw.charAt(0).toUpperCase() + badgeRaw.slice(1) : null,
      badgeType: badgeRaw || null,
      image: p.image_url || '',
      rating: parseFloat(p.rating) || 0,
      reviewCount: p.review_count || 0,
      desc: lang === 'ar' ? (p.short_description_ar || p.short_description || '') : (p.short_description || ''),
    };
  };

  const formatHomePrice = (price) =>
    `${Number(price).toLocaleString('fr-DZ')} ${t('currency')}`;

  const handleQuickAdd = async (prod, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(prod.id, 1);
    } catch {
      // CartContext surfaces the error
    }
    setAddedProduct(prod.name);
    setShowAdded(true);
    setTimeout(() => navigate('/cart'), 2000);
  };

  const renderProducts = () => {
    if (dbProducts === null) return null;
    if (dbProducts.length === 0) {
      return <p className="section-empty-msg">{t('home:products.empty')}</p>;
    }
    return (
      <div className="product-grid">
        {dbProducts.slice(0, 8).map((p) => (
          <ProductCard
            key={p.id}
            product={normalizeHomeProduct(p)}
            lang={lang}
            viewMode="grid"
            formatPrice={formatHomePrice}
            t={t}
            onAddToCart={handleQuickAdd}
          />
        ))}
      </div>
    );
  };

  const renderTrustStrip = () => {
    if (trustStrips === null) {
      return FALLBACK_TRUST_KEYS.map(({ key, icon }, idx) => (
        <div key={`${key}-${idx}`} className="trust-item">
          <span className="trust-icon">{icon}</span>
          <span className="trust-label">{t(`home:trust.${key}.label`)}</span>
          <p className="trust-desc">{t(`home:trust.${key}.desc`)}</p>
        </div>
      ));
    }
    if (trustStrips.length > 0) {
      return trustStrips.map((strip) => (
        <div key={strip.id} className="trust-item">
          <span className="trust-icon">{strip.icon}</span>
          <span className="trust-label">{lang === 'ar' ? strip.label_ar : strip.label_en}</span>
          <p className="trust-desc">{lang === 'ar' ? strip.description_ar : strip.description_en}</p>
        </div>
      ));
    }
    // Empty DB — fallback with updated payment copy
    return FALLBACK_TRUST_KEYS.map(({ key, icon }, idx) => (
      <div key={`${key}-${idx}`} className="trust-item">
        <span className="trust-icon">{icon}</span>
        <span className="trust-label">{t(`home:trust.${key}.label`)}</span>
        <p className="trust-desc">{t(`home:trust.${key}.desc`)}</p>
      </div>
    ));
  };

  const renderTestimonials = () => {
    if (testimonials === null) return null;
    if (testimonials.length === 0) {
      return <p className="section-empty-msg">{t('home:testimonials.empty')}</p>;
    }
    return (
      <div className="test-grid">
        {testimonials.map((r, idx) => (
          <div key={r.id ?? idx} className="test-card">
            <div className="test-stars">{starString(r.rating)}</div>
            <p className="test-text">"{lang === 'ar' ? r.body_ar : (r.body_en || r.body_ar)}"</p>
            <div className="test-author">
              {lang === 'ar' ? r.client_name_ar : (r.client_name_en || r.client_name_ar)}
            </div>
            <div className="test-place">
              {lang === 'ar' ? r.location_ar : (r.location_en || r.location_ar)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-shell">
      <div className="topbar">{settings.home_topbar}</div>

      <Nav variant="home" cartCount={cartCount} activePath="/" navTagline={settings.home_nav_logo_tagline} />

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-inner">
          <img src={LOGO} alt={BRAND} className="hero-mark" />
          <div className="hero-eyebrow">{hero.eyebrow}</div>
          <h1>
            {hero.title[0]} <em>{hero.title[1]}</em>
            <br />
            {hero.title[2]}
          </h1>
          <p className="hero-sub">{hero.subtitle}</p>
          <div className="hero-ctas">
            <a href="#collections" className="btn-primary">{t('home:hero.primaryCta')}</a>
            <a href="#story" className="btn-ghost">{t('home:hero.secondaryCta')}</a>
          </div>
        </div>
        <div className="scroll-hint">{t('home:scrollHint')}</div>
      </section>

      {/* CATEGORIES */}
      <SectionDivider />
      <div className="section-header">
        <div className="section-eyebrow">{t('home:categories.sectionEyebrow')}</div>
        <h2 className="section-title">{renderEmphasis(t('home:categories.sectionTitle'))}</h2>
        <div className="section-rule" />
      </div>
      <section className="categories" id="collections">
        {renderCategories()}
      </section>

      {/* FEATURED PRODUCTS */}
      <SectionDivider />
      <div className="section-header">
        <div className="section-eyebrow">{t('home:products.sectionEyebrow')}</div>
        <h2 className="section-title">{renderEmphasis(t('home:products.sectionTitle'))}</h2>
        <div className="section-rule" />
      </div>
      <section className="products-section" id="products">
        {renderProducts()}
      </section>

      {/* TRUST STRIP */}
      <section className="trust-strip">
        {renderTrustStrip()}
      </section>

      {/* TESTIMONIALS */}
      <SectionDivider />
      <div className="section-header">
        <div className="section-eyebrow">{t('home:testimonials.sectionEyebrow')}</div>
        <h2 className="section-title">{renderEmphasis(t('home:testimonials.sectionTitle'))}</h2>
        <div className="section-rule" />
      </div>
      <section className="testimonials">
        {renderTestimonials()}
      </section>

      {/* NEWSLETTER */}
      <section className="newsletter" id="newsletter">
        <img src={LOGO} alt={BRAND} className="newsletter-mark" />
        <h2 className="newsletter-title">
          {t('home:newsletter.title.0')} <em>{t('home:newsletter.title.1')}</em>
          <br />
          {t('home:newsletter.title.2')}
        </h2>
        <p className="newsletter-sub">{t('home:newsletter.subtitle')}</p>
        <Link to="/contact" className="newsletter-contact-btn">
          {t('home:newsletter.contactButton')}
        </Link>
      </section>

      {/* FOOTER */}
      <footer id="contact">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">{t('footer.brand')}<span>{t('footer.since')}</span></div>
            <p className="footer-desc">{t('footer.desc')}</p>
            <div className="footer-socials">
              <a href={footerContactInfo?.facebook_url || '#'}>f</a>
              <a href={footerContactInfo?.linkedin_url || '#'}>in</a>
              <a href={footerContactInfo?.whatsapp_url || '#'}>wa</a>
              <a href={footerContactInfo?.instagram_url || '#'}>ig</a>
            </div>
          </div>
          <div>
            <div className="footer-col-title">{t('footer.collections')}</div>
            <ul className="footer-links">
              {dbCategories && dbCategories.length > 0
                ? dbCategories.map((cat) => (
                    <li key={cat.id}><Link to={`/shop?category=${cat.slug}#products`}>{lang === 'ar' ? (cat.name_ar || cat.name) : cat.name}</Link></li>
                  ))
                : null}
              <li><Link to="/shop?sort=new">{t('footer.links.newArrivals')}</Link></li>
            </ul>
          </div>
          <div>
            <div className="footer-col-title">{t('footer.information')}</div>
            <ul className="footer-links">
              <li><Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.ourStory')}</Link></li>
              <li><Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.ourArtisans')}</Link></li>
              <li><Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.authenticity')}</Link></li>
              <li><Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.shipping')}</Link></li>
              {/* <li><Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.returns')}</Link></li> */}
              {/* <li><Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.sizeGuide')}</Link></li> */}
            </ul>
          </div>
          <div>
            <div className="footer-col-title">{t('footer.contact')}</div>
            <ul className="footer-links">
              <li><Link to="/contact" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.whatsapp')}</Link></li>
              <li><Link to="/contact" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.email')}</Link></li>
              <li><Link to="/contact" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.showroom')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{t('footer.bottom.left')}</span>
          <span>{t('footer.bottom.right')}</span>
        </div>
      </footer>

      <div style={{
        position: 'fixed', top: '100px', right: '30px',
        background: 'var(--espresso)', color: 'var(--gold-pale)',
        padding: '16px 28px', fontFamily: "'Cinzel', serif", fontSize: '11px',
        letterSpacing: '0.16em', textTransform: 'uppercase', zIndex: 200,
        border: '1px solid var(--gold)', pointerEvents: 'none',
        opacity: showAdded ? 1 : 0, transform: showAdded ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 0.4s ease',
      }}>
        {addedProduct} — {lang === 'ar' ? 'تمت الإضافة! جاري التوجيه…' : 'Added! Redirecting…'}
      </div>
    </div>
  );
}
