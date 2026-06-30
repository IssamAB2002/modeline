import { API } from './config.js';
import { loadCart } from './cart.js';
import { loadSettings } from './settings.js';
import { initNav } from './nav.js';
import { initFooter } from './footer.js';
import { apiFetch } from './api.js';

// ── Render helpers ────────────────────────────────────────

function _renderContactInfo(info) {
  if (!info) return '<p class="section-empty-msg">معلومات التواصل غير متاحة.</p>';

  const rows = [];
  if (info.store_email)    rows.push({ icon: '✉', label: 'البريد الإلكتروني', value: `<a href="mailto:${info.store_email}">${info.store_email}</a>` });
  if (info.store_phone)    rows.push({ icon: '☎', label: 'الهاتف',            value: `<a href="tel:${info.store_phone}">${info.store_phone}</a>` });
  if (info.whatsapp_url)   rows.push({ icon: '◈', label: 'واتساب',            value: `<a href="${info.whatsapp_url}" target="_blank" rel="noopener">تواصل عبر واتساب</a>` });
  if (info.facebook_url)   rows.push({ icon: 'f', label: 'فيسبوك',            value: `<a href="${info.facebook_url}" target="_blank" rel="noopener">صفحتنا على فيسبوك</a>` });
  if (info.instagram_url)  rows.push({ icon: '◇', label: 'إنستغرام',          value: `<a href="${info.instagram_url}" target="_blank" rel="noopener">صفحتنا على إنستغرام</a>` });
  if (info.store_hours_ar) rows.push({ icon: '◎', label: 'أوقات العمل',       value: info.store_hours_ar });

  return `
    <div class="contact-info-panel">
      <div class="contact-info-title">معلومات التواصل</div>
      <ul class="contact-info-list">
        ${rows.map((r) => `
          <li class="contact-info-item">
            <span class="contact-info-icon">${r.icon}</span>
            <div>
              <div class="contact-info-label">${r.label}</div>
              <div class="contact-info-value">${r.value}</div>
            </div>
          </li>`).join('')}
      </ul>
    </div>`;
}

function _renderShowrooms(showrooms) {
  if (!showrooms.length) {
    return '<p class="section-empty-msg">لا توجد صالات عرض بعد.</p>';
  }
  return showrooms.map((s) => `
    <div class="showroom-card">
      ${s.image_url ? `<img class="showroom-img" src="${s.image_url}" alt="${s.name_ar || s.name || ''}">` : ''}
      <div class="showroom-body">
        <div class="showroom-name">${s.name_ar || s.name || ''}</div>
        <div class="showroom-address">${s.address_ar || s.address || ''}</div>
        ${s.phone     ? `<div class="showroom-detail"><a href="tel:${s.phone}">${s.phone}</a></div>` : ''}
        ${s.hours_ar  ? `<div class="showroom-detail">${s.hours_ar}</div>` : ''}
      </div>
    </div>`).join('');
}

function _renderFaq(faqs) {
  if (!faqs.length) {
    return '<p class="section-empty-msg">لا توجد أسئلة بعد.</p>';
  }
  return faqs.map((f, i) => `
    <div class="faq-item" data-idx="${i}">
      <button class="faq-question" aria-expanded="false">
        <span>${f.question_ar || f.question || ''}</span>
        <span class="faq-chevron" aria-hidden="true">›</span>
      </button>
      <div class="faq-answer">
        <div class="faq-answer-inner">${f.answer_ar || f.answer || ''}</div>
      </div>
    </div>`).join('');
}

// ── Settings text ─────────────────────────────────────────

function _applySettings(settings) {
  const _set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };

  _set('contact-hero-title-main', settings.contact_hero_title_main);
  _set('contact-hero-title-em',   settings.contact_hero_title_emphasis);
  _set('contact-hero-subtitle',   settings.contact_hero_subtitle);
  _set('contact-intro-text',      settings.contact_intro_text);

  const titleEl = document.getElementById('contact-intro-title');
  if (titleEl) {
    titleEl.innerHTML = `${settings.contact_intro_title_main} <span>${settings.contact_intro_title_emphasis || ''}</span>`;
  }
}

// ── Data loaders ──────────────────────────────────────────

async function _loadContactInfo() {
  const el = document.getElementById('contact-info');
  if (!el) return;
  try {
    const res  = await fetch(`${API}/home/contact-info/`);
    const data = res.ok ? await res.json() : null;
    el.innerHTML = _renderContactInfo(data);
  } catch {
    el.innerHTML = '<p class="section-empty-msg">تعذّر تحميل معلومات التواصل.</p>';
  }
}

async function _loadShowrooms() {
  const grid = document.getElementById('showrooms-grid');
  if (!grid) return;
  try {
    const res  = await fetch(`${API}/contact/showrooms/`);
    const data = res.ok ? await res.json() : [];
    grid.innerHTML = _renderShowrooms(Array.isArray(data) ? data : []);
  } catch {
    grid.innerHTML = '<p class="section-empty-msg">تعذّر تحميل صالات العرض.</p>';
  }
}

async function _loadFaqs() {
  const list = document.getElementById('faq-list');
  if (!list) return;
  try {
    const res  = await fetch(`${API}/contact/faqs/`);
    const data = res.ok ? await res.json() : [];
    list.innerHTML = _renderFaq(Array.isArray(data) ? data : []);
    _wireFaqAccordion(list);
  } catch {
    list.innerHTML = '<p class="section-empty-msg">تعذّر تحميل الأسئلة الشائعة.</p>';
  }
}

// ── FAQ accordion ─────────────────────────────────────────

function _wireFaqAccordion(container) {
  let openIdx = -1;

  container.querySelectorAll('.faq-item').forEach((item) => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const idx    = parseInt(item.dataset.idx, 10);
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = openIdx === idx;

      // Close currently open item
      if (openIdx >= 0) {
        const prev = container.querySelector(`.faq-item[data-idx="${openIdx}"]`);
        if (prev) {
          prev.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          prev.querySelector('.faq-answer').style.maxHeight = '0';
        }
      }

      if (isOpen) {
        openIdx = -1;
      } else {
        openIdx = idx;
        btn.setAttribute('aria-expanded', 'true');
        const inner = answer.querySelector('.faq-answer-inner');
        answer.style.maxHeight = inner ? inner.scrollHeight + 'px' : '200px';
      }
    });
  });
}

// ── Contact form submit ───────────────────────────────────

function _wireContactForm() {
  const form    = document.getElementById('contact-form');
  const errEl   = document.getElementById('contact-error');
  const success = document.getElementById('form-success');
  const wrap    = document.getElementById('contact-form-wrap');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errEl) errEl.style.display = 'none';

    const name    = (form.elements['name']?.value    || '').trim();
    const email   = (form.elements['email']?.value   || '').trim();
    const subject = (form.elements['subject']?.value || '').trim();
    const message = (form.elements['message']?.value || '').trim();
    const type    = form.elements['inquiryType']?.value || 'general';
    const phone   = (form.elements['phone']?.value   || '').trim();

    if (name.length < 2) {
      if (errEl) { errEl.textContent = 'يرجى إدخال اسمك الكامل.'; errEl.style.display = 'block'; }
      return;
    }
    if (!email.includes('@')) {
      if (errEl) { errEl.textContent = 'يرجى إدخال بريد إلكتروني صحيح.'; errEl.style.display = 'block'; }
      return;
    }
    if (subject.length < 3) {
      if (errEl) { errEl.textContent = 'يرجى إدخال موضوع الرسالة.'; errEl.style.display = 'block'; }
      return;
    }
    if (message.length < 10) {
      if (errEl) { errEl.textContent = 'يرجى كتابة رسالتك (10 أحرف على الأقل).'; errEl.style.display = 'block'; }
      return;
    }

    const btn = document.getElementById('btn-contact-submit');
    if (btn) { btn.disabled = true; btn.textContent = '…'; }

    try {
      const res = await apiFetch('/contact/messages/', {
        method: 'POST',
        body: { name, email, phone, subject, message, inquiry_type: type },
      });

      if (res.ok) {
        if (form)    form.style.display = 'none';
        if (success) success.style.display = 'block';
      } else {
        if (errEl) { errEl.textContent = 'تعذّر إرسال رسالتك. يرجى المحاولة مجدداً.'; errEl.style.display = 'block'; }
        if (btn) { btn.disabled = false; btn.textContent = 'إرسال الرسالة'; }
      }
    } catch {
      if (errEl) { errEl.textContent = 'خطأ في الاتصال. يرجى المحاولة لاحقاً.'; errEl.style.display = 'block'; }
      if (btn) { btn.disabled = false; btn.textContent = 'إرسال الرسالة'; }
    }
  });
}

// ── Boot ─────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  loadCart();

  const [settings] = await Promise.all([
    loadSettings(),
    initNav('/contact.html'),
    initFooter(),
    _loadContactInfo(),
    _loadShowrooms(),
    _loadFaqs(),
  ]);

  _applySettings(settings);
  _wireContactForm();
});
