import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useLang } from '../hooks/useLang';
import { useFrontSettings } from '../context/FrontSettingsContext';
import '../pageStyles/about.css';
import { useCart, getCookie, ensureCsrf } from "../context/CartContext";
const API = import.meta.env.VITE_API_URL;

function renderEmphasis(text) {
  const parts = String(text).split(/\{\{em\}\}|\{\{\/em\}\}/);
  return parts.map((part, index) => (index % 2 === 1 ? <em key={index}>{part}</em> : part));
}

function starString(n) {
  const safe = Math.min(5, Math.max(0, Math.round(n)));
  return '★'.repeat(safe) + '☆'.repeat(5 - safe);
}

function computeStarString(n) {
  return starString(n);
}

function StarPicker({ value, onChange }) {
  const stars = useMemo(() => [1, 2, 3, 4, 5], []);
  return (
    <div className="star-picker" role="radiogroup" aria-label="Your rating" id="star-picker">
      {stars.map((v) => (
        <span
          key={v}
          data-val={v}
          role="radio"
          aria-checked={value === v}
          tabIndex={0}
          className={value >= v ? 'lit' : ''}
          onMouseEnter={() => onChange(v)}
          onClick={() => onChange(v)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onChange(v); }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function AboutPage() {
  const location = useLocation();
  const settings = useFrontSettings();
  const { t } = useLang();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Review form state
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewName, setReviewName] = useState('');
  const [reviewLocation, setReviewLocation] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [formVisible, setFormVisible] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // DB data
  const [principles, setPrinciples] = useState(null); // null = loading
  const [dbReviews, setDbReviews] = useState(null);   // null = loading

  useEffect(() => {
    fetch(`${API}/about/principles/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPrinciples(Array.isArray(data) ? data : []))
      .catch(() => setPrinciples([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/about/reviews/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDbReviews(Array.isArray(data) ? data : []))
      .catch(() => setDbReviews([]));
  }, []);

  const submitReview = async () => {
    if (!selectedRating) {
      alert(t('about:reviews.form.errorRating'));
      return;
    }
    if (!reviewName.trim()) {
      alert(t('about:reviews.form.errorName'));
      return;
    }
    if (!reviewBody.trim()) {
      alert(t('about:reviews.form.errorBody'));
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await ensureCsrf();
      const res = await fetch(`${API}/about/reviews/submit/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        body: JSON.stringify({
          rating: selectedRating,
          body_ar: reviewBody.trim(),
          body_en: reviewBody.trim(),
          client_name_ar: reviewName.trim(),
          client_name_en: reviewName.trim(),
          location_ar: reviewLocation.trim() || 'Algeria',
          location_en: reviewLocation.trim() || 'Algeria',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || t('about:reviews.form.errorSubmit'));
      }
      const newReview = await res.json();
      setDbReviews((prev) => [newReview, ...(prev || [])]);
      setFormVisible(false);
      setTimeout(() => {
        const firstCard = document.querySelector('#reviews-grid .review-card');
        if (firstCard && 'scrollIntoView' in firstCard) {
          firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 0);
    } catch (err) {
      setSubmitError(err.message || t('about:reviews.form.errorSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic review stats computed from DB reviews
  const totalReviews = dbReviews?.length ?? 0;
  const avgRating = totalReviews > 0
    ? (dbReviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
    : '0.0';
  const ratingDist = [5, 4, 3, 2, 1].map((star) => {
    const count = dbReviews?.filter((r) => Math.round(r.rating) === star).length ?? 0;
    return {
      label: String(star),
      count,
      pct: totalReviews > 0 ? `${Math.round((count / totalReviews) * 100)}%` : '0%',
    };
  });

  // i18n fallback pillars (3 items)
  const i18nPillars = [0, 1, 2].map((i) => ({
    num: t(`about:pillars.items.${i}.num`),
    icon: t(`about:pillars.items.${i}.icon`),
    title: t(`about:pillars.items.${i}.title`),
    desc: t(`about:pillars.items.${i}.desc`),
  }));

  const pillarsToRender = (principles === null || principles.length === 0)
    ? i18nPillars
    : principles.map((p) => ({
        num: String(p.sort_order + 1).padStart(2, '0'),
        icon: '',
        title: p.title_ar,
        desc: p.body_ar,
      }));

  const renderReviews = () => {
    if (dbReviews === null) return null;
    if (dbReviews.length === 0) {
      return (
        <p className="reviews-empty-msg" style={{ textAlign: 'center', color: 'var(--warm-gray)', padding: '2rem 0' }}>
          {t('about:reviews.empty')}
        </p>
      );
    }
    return dbReviews.map((r, idx) => {
      const body = r.body_ar;
      const name = r.client_name_ar;
      const loc = r.location_ar;
      const date = new Date(r.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      return (
        <div key={r.id ?? idx} className="review-card">
          <div className="review-stars">{starString(r.rating)}</div>
          <p className="review-body">{body}</p>
          <div className="review-footer">
            <div>
              <div className="reviewer-name">{name}</div>
              <span className="reviewer-location">{loc}</span>
              {r.verified ? <div className="verified-badge">✓ Verified Purchase</div> : null}
            </div>
            <span className="review-date">{date}</span>
          </div>
        </div>
      );
    });
  };

  return (
    <div>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,700;1,400&family=Cinzel:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* TOP BAR */}
      <div className="topbar">{settings.home_topbar || t('common:topbar')}</div>

      {/* NAVIGATION */}
      <Nav
        variant="about"
        cartCount={0}
        activePath={location.pathname}
        navTagline={settings.home_nav_logo_tagline}
      />

      {/* PAGE HERO */}
      <div className="page-hero">
        <div className="breadcrumb">
          <Link to="/" style={{ color: 'rgba(253,248,238,0.55)', textDecoration: 'none' }}>الرئيسية</Link>
          <span>·</span>
          <span style={{ color: 'var(--gold-pale)' }}>من نحن</span>
        </div>
        <h1 className="page-title">
          {settings.about_hero_title_main} <em>{settings.about_hero_title_emphasis}</em>
        </h1>
        <p className="page-subtitle">{settings.about_hero_subtitle}</p>
      </div>

      {/* INTRO STATEMENT */}
      <div className="intro-statement">
        <span className="eyebrow">{settings.about_intro_eyebrow || t('about:intro.eyebrow')}</span>
        <h2>{renderEmphasis(settings.about_intro_title || t('about:intro.title'))}</h2>
        <p>{settings.about_intro_text || t('about:intro.text')}</p>
      </div>

      {/* GOLD RULE */}
      <div className="gold-rule" style={{ marginTop: 56 }}>
        <span className="gold-rule-icon">✦ منذ سنين ✦</span>
      </div>

      {/* STORY SECTION */}
      <div className="story-section" id="story">
        <div className="story-img">
          <img
            src={
              settings.about_story_image_full_url ||
              settings.about_story_image_url ||
              'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80'
            }
            alt="Artisan at work"
          />
          <div className="story-img-label">
            {settings.about_story_image_label || 'Tlemcen Traditional Collection, 2024'}
          </div>
        </div>
        <div className="story-text">
          <span className="section-eyebrow">{t('about:story.eyebrow')}</span>
          <h2>
            {settings.about_story_title_main} <em>{settings.about_story_title_emphasis}</em>
          </h2>
          <p>{settings.about_story_paragraph_1}</p>
          <p>{settings.about_story_paragraph_2}</p>
          <p>{settings.about_story_paragraph_3 || t('about:story.paragraph3')}</p>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="stats-row">
        {[1, 2, 3, 4].map((n) => {
          const val = settings[`about_stat_${n}_value`] || t(`about:stats.${n - 1}.value`);
          const label = settings[`about_stat_${n}_label`] || t(`about:stats.${n - 1}.label`);
          return (
            <div key={n} className="stat-item">
              <div className="stat-num">{val}</div>
              <div className="stat-label">{label}</div>
            </div>
          );
        })}
      </div>

      {/* PILLARS / VALUES */}
      <div className="pillars-section">
        <div className="section-header">
          <span className="section-eyebrow">{t('about:pillars.eyebrow')}</span>
          <h2>{renderEmphasis(t('about:pillars.title'))}</h2>
          <p>{t('about:pillars.subtitle')}</p>
        </div>
        <div className="pillars-grid">
          {pillarsToRender.map((pillar, i) => (
            <div key={i} className="pillar-card">
              <span className="pillar-num">{pillar.num}</span>
              {pillar.icon ? <span className="pillar-icon">{pillar.icon}</span> : null}
              <h3>{pillar.title}</h3>
              <p>{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <section className="reviews-section" id="reviews">
        <div className="reviews-intro">
          <div className="reviews-left">
            <span className="section-eyebrow">{t('about:reviews.eyebrow')}</span>
            <h2>{renderEmphasis(t('about:reviews.title'))}</h2>
            <p>{t('about:reviews.subtitle')}</p>

            <div className="overall-rating">
              <div className="rating-big">{avgRating}</div>
              <div className="rating-details">
                <span className="rating-stars-big">{computeStarString(parseFloat(avgRating))}</span>
                <div className="rating-meta">
                  {t('about:reviews.overall', { rating: avgRating, count: String(totalReviews) })}
                </div>
              </div>
            </div>

            <div className="rating-bars">
              {ratingDist.map((bar) => (
                <div key={bar.label} className="rating-bar-row">
                  <span className="rating-bar-label">{bar.label}</span>
                  <div className="rating-bar-track">
                    <div className="rating-bar-fill" style={{ width: bar.pct }} />
                  </div>
                  <span className="rating-bar-count">{bar.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="reviews-right">
            <div
              className="review-form-wrap"
              id="review-form-wrap"
              style={{ display: formVisible ? 'block' : 'none' }}>
              <h3>{t('about:reviews.form.title')}</h3>

              <div className="form-row">
                <label>{t('about:reviews.form.ratingLabel')}</label>
                <StarPicker value={selectedRating} onChange={setSelectedRating} />
              </div>

              <div className="form-row-split">
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label>{t('about:reviews.form.nameLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('about:reviews.form.namePlaceholder')}
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                  />
                </div>
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label>{t('about:reviews.form.locationLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('about:reviews.form.locationPlaceholder')}
                    value={reviewLocation}
                    onChange={(e) => setReviewLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: 18 }}>
                <label>{t('about:reviews.form.reviewLabel')}</label>
                <textarea
                  placeholder={t('about:reviews.form.reviewPlaceholder')}
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                />
              </div>

              {submitError && (
                <p style={{ color: '#a00', fontSize: '0.9rem', marginTop: '0.5rem' }}>{submitError}</p>
              )}

              <button
                className="btn-submit-review"
                onClick={submitReview}
                disabled={submitting}
                type="button">
                {submitting ? t('about:reviews.form.submitting') : t('about:reviews.form.submit')}
              </button>
            </div>

            <div
              className="review-success"
              id="review-success"
              style={{ display: formVisible ? 'none' : 'block' }}>
              <p>"{t('about:reviews.form.successQuote')}"</p>
              <span>{t('about:reviews.form.successMessage')}</span>
            </div>
          </div>
        </div>

        <div className="reviews-divider">
          <span>{t('about:reviews.recentDivider')}</span>
        </div>

        <div className="reviews-grid" id="reviews-grid">
          {renderReviews()}
        </div>
      </section>

      <Footer />
    </div>
  );
}
