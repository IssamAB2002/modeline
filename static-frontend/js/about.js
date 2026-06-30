import { API } from './config.js';
import { loadCart } from './cart.js';
import { loadSettings } from './settings.js';
import { initNav } from './nav.js';
import { initFooter } from './footer.js';
import { apiFetch } from './api.js';
import { renderStars } from './utils.js';

// ── Render helpers ────────────────────────────────────────

function _renderPillars(principles) {
  if (!principles.length) {
    return '<p class="section-empty-msg">لا توجد مبادئ بعد.</p>';
  }
  return principles.map((p) => `
    <div class="pillar-card">
      <div class="pillar-icon">${p.icon || '✦'}</div>
      <h3 class="pillar-title">${p.title_ar || p.title || ''}</h3>
      <p class="pillar-desc">${p.body_ar || p.description_ar || p.description || ''}</p>
    </div>`).join('');
}

function _renderReviewCard(r) {
  const date = r.created_at
    ? new Date(r.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long' })
    : '';
  return `
    <div class="review-card">
      <div class="review-stars">${renderStars(r.rating ?? r.stars ?? 0)}</div>
      <p class="review-body">${r.body_ar || r.body || ''}</p>
      <div class="review-footer">
        <div>
          <div class="reviewer-name">${r.client_name_ar || r.reviewer_name || r.name || ''}</div>
          <span class="reviewer-location">${r.location_ar || r.reviewer_location || ''}</span>
        </div>
        <div class="review-date">${date}</div>
      </div>
    </div>`;
}

function _renderRatingSummary(reviews) {
  const total = reviews.length;
  const avg = total > 0
    ? reviews.reduce((s, r) => s + (parseFloat(r.rating ?? r.stars) || 0), 0) / total
    : 0;
  const avgStr = avg.toFixed(1);
  const dist = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(parseFloat(r.rating ?? r.stars) || 0) === star).length;
    return { star, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
  });

  return `
    <div class="overall-rating">
      <div class="rating-big">${avgStr}</div>
      <div class="rating-details">
        <span class="rating-stars-big">${renderStars(avg)}</span>
        <div class="rating-meta">${avgStr} · بناءً على ${total} مراجعة موثّقة</div>
      </div>
    </div>
    <div class="rating-bars">
      ${dist.map((d) => `
        <div class="rating-bar-row">
          <span class="rating-bar-label">${d.star}</span>
          <div class="rating-bar-track">
            <div class="rating-bar-fill" style="width:${d.pct}%"></div>
          </div>
          <span class="rating-bar-count">${d.count}</span>
        </div>`).join('')}
    </div>`;
}

// ── Apply settings text ───────────────────────────────────

function _applySettings(settings) {
  const _set  = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };

  _set('about-hero-title-main', settings.about_hero_title_main);
  _set('about-hero-title-em',   settings.about_hero_title_emphasis);
  _set('about-hero-subtitle',  settings.about_hero_subtitle);
  _set('about-intro-eyebrow',  settings.about_intro_eyebrow);
  _set('about-intro-text',     settings.about_intro_text);

  const introTitleEl = document.getElementById('about-intro-title');
  if (introTitleEl) introTitleEl.textContent = settings.about_intro_title;

  // Story image
  const storyImg = document.getElementById('story-img');
  if (storyImg && settings.about_story_image_url) storyImg.src = settings.about_story_image_url;
  _set('story-img-label', settings.about_story_image_label);

  // Story text block
  const storyText = document.getElementById('story-text');
  if (storyText) {
    storyText.innerHTML = `
      <div class="story-eyebrow">قصة المتجر</div>
      <h2 class="story-title">
        ${settings.about_story_title_main}
        <span>${settings.about_story_title_emphasis || ''}</span>
      </h2>
      <p>${settings.about_story_paragraph_1 || ''}</p>
      <p>${settings.about_story_paragraph_2 || ''}</p>
      <p>${settings.about_story_paragraph_3 || ''}</p>`;
  }

  // Stats
  _set('stat-1-value', settings.about_stat_1_value);
  _set('stat-1-label', settings.about_stat_1_label);
  _set('stat-2-value', settings.about_stat_2_value);
  _set('stat-2-label', settings.about_stat_2_label);
  _set('stat-3-value', settings.about_stat_3_value);
  _set('stat-3-label', settings.about_stat_3_label);
  _set('stat-4-value', settings.about_stat_4_value);
  _set('stat-4-label', settings.about_stat_4_label);
}

// ── Data loaders ──────────────────────────────────────────

async function _loadPillars() {
  const grid = document.getElementById('pillars-grid');
  if (!grid) return;
  try {
    const res  = await fetch(`${API}/about/principles/`);
    const data = res.ok ? await res.json() : [];
    grid.innerHTML = _renderPillars(Array.isArray(data) ? data : []);
  } catch {
    grid.innerHTML = '<p class="section-empty-msg">تعذّر تحميل المبادئ.</p>';
  }
}

async function _loadReviews() {
  const grid      = document.getElementById('reviews-grid');
  const ratingBox = document.getElementById('rating-summary-box');
  if (!grid) return;

  try {
    const res     = await fetch(`${API}/about/reviews/`);
    const data    = res.ok ? await res.json() : [];
    const reviews = Array.isArray(data) ? data : [];

    if (ratingBox) ratingBox.innerHTML = _renderRatingSummary(reviews);
    grid.innerHTML = reviews.length
      ? reviews.map(_renderReviewCard).join('')
      : '<p class="section-empty-msg">لا توجد مراجعات بعد — كن أول من يشارك تجربته.</p>';
  } catch {
    if (ratingBox) ratingBox.innerHTML = _renderRatingSummary([]);
    grid.innerHTML = '<p class="section-empty-msg">تعذّر تحميل التقييمات.</p>';
  }
}

// ── Star picker ───────────────────────────────────────────

let _selectedRating = 0;

function _initStarPicker() {
  const picker = document.getElementById('star-picker');
  if (!picker) return;
  const stars = Array.from(picker.querySelectorAll('span'));

  const _light = (upTo) =>
    stars.forEach((s) => s.classList.toggle('lit', parseInt(s.dataset.v, 10) <= upTo));

  stars.forEach((s) => {
    s.addEventListener('mouseover',  () => _light(parseInt(s.dataset.v, 10)));
    s.addEventListener('click',      () => { _selectedRating = parseInt(s.dataset.v, 10); _light(_selectedRating); });
  });
  picker.addEventListener('mouseleave', () => _light(_selectedRating));
}

// ── Review submit ─────────────────────────────────────────

function _wireReviewForm() {
  const btn     = document.getElementById('btn-review-submit');
  const errEl   = document.getElementById('review-error');
  const success = document.getElementById('review-success');
  const formPanel = document.getElementById('review-form-panel');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const name = (document.getElementById('review-name')?.value || '').trim();
    const loc  = (document.getElementById('review-location')?.value || '').trim();
    const body = (document.getElementById('review-body')?.value || '').trim();

    if (errEl) errEl.style.display = 'none';

    if (_selectedRating === 0) {
      if (errEl) { errEl.textContent = 'يرجى اختيار تقييم بالنجوم.'; errEl.style.display = 'block'; }
      return;
    }
    if (name.length < 2) {
      if (errEl) { errEl.textContent = 'يرجى إدخال اسمك.'; errEl.style.display = 'block'; }
      return;
    }
    if (body.length < 5) {
      if (errEl) { errEl.textContent = 'يرجى كتابة تقييمك.'; errEl.style.display = 'block'; }
      return;
    }

    btn.disabled = true;
    btn.textContent = '…';

    try {
      const res = await apiFetch('/about/reviews/submit/', {
        method: 'POST',
        body: { rating: _selectedRating, client_name_ar: name, location_ar: loc, body_ar: body },
      });

      if (res.ok) {
        if (formPanel) formPanel.style.display = 'none';
        if (success)   success.style.display = 'block';
      } else {
        if (errEl) { errEl.textContent = 'تعذّر إرسال التقييم. يرجى المحاولة مجدداً.'; errEl.style.display = 'block'; }
        btn.disabled = false;
        btn.textContent = 'إرسال التقييم';
      }
    } catch {
      if (errEl) { errEl.textContent = 'خطأ في الاتصال. يرجى المحاولة لاحقاً.'; errEl.style.display = 'block'; }
      btn.disabled = false;
      btn.textContent = 'إرسال التقييم';
    }
  });
}

// ── Boot ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  loadCart();

  const [settings] = await Promise.all([
    loadSettings(),
    initNav('/about.html'),
    initFooter(),
    _loadPillars(),
    _loadReviews(),
  ]);

  _applySettings(settings);
  _initStarPicker();
  _wireReviewForm();
});
