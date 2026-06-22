import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useFrontSettings } from '../context/FrontSettingsContext';
import { useLang } from '../hooks/useLang';
import '../pageStyles/contact.css';
import { useCart, getCookie, ensureCsrf } from "../context/CartContext";

function renderEmphasis(text) {
  const parts = String(text).split(/\{\{em\}\}|\{\{\/em\}\}/);
  return parts.map((part, index) => (index % 2 === 1 ? <em key={index}>{part}</em> : part));
}

const API = import.meta.env.VITE_API_URL;




/* ═══════════════════════════════════════════════════════════════
   BURNOUS & BROCADE — Contact Us Page
   Heritage Store · React Component
   Design preserved exactly from original theme
   ═══════════════════════════════════════════════════════════════ */

const ContactPage = () => {
  const { t } = useLang();
  const location = useLocation();
  const settings = useFrontSettings();

  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState('');
  const [cartCount] = useState(0);

  // DB data
  const [dbShowrooms, setDbShowrooms] = useState(null); // null = loading
  const [dbFaqs, setDbFaqs] = useState(null);           // null = loading
  const [dbContactInfo, setDbContactInfo] = useState(null);

  useEffect(() => {
    fetch(`${API}/contact/showrooms/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDbShowrooms(Array.isArray(data) ? data : []))
      .catch(() => setDbShowrooms([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/contact/faqs/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDbFaqs(Array.isArray(data) ? data : []))
      .catch(() => setDbFaqs([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/home/contact-info/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setDbContactInfo(data))
      .catch(() => setDbContactInfo(null));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    await ensureCsrf();
    e.preventDefault();
    setSubmittingContact(true);
    setContactError('');
    try {
      const res = await fetch(`${API}/contact/messages/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        body: JSON.stringify({
          inquiry_type: formData.inquiryType,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || t('contact:form.error'));
      }
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', inquiryType: 'general' });
    } catch (err) {
      setContactError(err.message || t('contact:form.error'));
    } finally {
      setSubmittingContact(false);
    }
  };

  const inquiryTypes = [
    { value: 'general', label: t('contact:form.types.general') },
    { value: 'order', label: t('contact:form.types.order') },
    { value: 'custom', label: t('contact:form.types.custom') },
    { value: 'wholesale', label: t('contact:form.types.wholesale') },
    { value: 'returns', label: t('contact:form.types.returns') },
    { value: 'artisan', label: t('contact:form.types.artisan') },
  ];

  // i18n fallback FAQs (for when DB is empty)
  const i18nFaqsRaw = t('contact:faq.items', { returnObjects: true });
  const i18nFaqs = Array.isArray(i18nFaqsRaw) ? i18nFaqsRaw : [];

  // Resolve showrooms and faqs to render
  const showrooms = dbShowrooms !== null && dbShowrooms.length > 0
    ? dbShowrooms.map((r) => ({
        city: r.city_ar,
        address: r.address_ar,
        hours: r.hours_ar,
        phone: r.phone || '',
        email: r.email || '',
        note: r.note_ar,
      }))
    : null; // null = loading or empty (handled in render)

  const faqs = (dbFaqs !== null && dbFaqs.length > 0)
    ? dbFaqs.map((f) => ({
        q: f.question_ar,
        a: f.answer_ar,
      }))
    : i18nFaqs; // fall back to i18n if DB empty or loading

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div
      style={{
        "--gold": "#B8860B",
        "--gold-light": "#D4A017",
        "--gold-pale": "#F5E6C0",
        "--cream": "#FAF6EE",
        "--parchment": "#F0E8D5",
        "--bark": "#8B6914",
        "--espresso": "#2C1A08",
        "--ink": "#1A1208",
        "--warm-gray": "#7A6F63",
        "--border": "#D9C99A",
        fontFamily: "'EB Garamond', Georgia, serif",
        background: "var(--cream)",
        color: "var(--ink)",
        fontSize: "17px",
        lineHeight: 1.7,
        overflowX: "hidden",
        margin: 0,
        padding: 0,
      }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cinzel:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        /* ── TOP BAR ── */
        .topbar {
          background: var(--espresso);
          color: var(--gold-pale);
          text-align: center;
          padding: 8px 20px;
          font-size: 13px;
          letter-spacing: 0.12em;
          font-family: 'Cinzel', serif;
        }

        /* ── NAV ── */
        .contact-nav {
          background: var(--cream);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 60px;
          height: 80px;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .nav-logo {
          font-family: 'Cinzel', serif;
          font-size: 22px;
          font-weight: 600;
          color: var(--espresso);
          letter-spacing: 0.08em;
          text-decoration: none;
          line-height: 1.2;
        }
        .nav-logo span {
          display: block;
          font-size: 10px;
          letter-spacing: 0.22em;
          color: var(--gold);
          font-weight: 400;
          margin-top: 2px;
        }
        .nav-links {
          display: flex;
          gap: 36px;
          list-style: none;
          align-items: center;
        }
        .nav-links a {
          font-family: 'Cinzel', serif;
          font-size: 12px;
          letter-spacing: 0.14em;
          color: var(--espresso);
          text-decoration: none;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .nav-links a:hover { color: var(--gold); }
        .nav-links a.active {
          color: var(--gold);
          border-bottom: 1px solid var(--gold);
          padding-bottom: 2px;
        }
        .nav-actions {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        .nav-actions a {
          color: var(--espresso);
          text-decoration: none;
          font-size: 13px;
          font-family: 'Cinzel', serif;
          letter-spacing: 0.1em;
          transition: color 0.2s;
        }
        .nav-actions a:hover { color: var(--gold); }
        .cart-btn {
          background: var(--espresso);
          color: var(--ink) !important;
          padding: 9px 22px;
          border-radius: 1px;
          border: none;
          font-family: 'Cinzel', serif;
          font-size: 13px;
          letter-spacing: 0.1em;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          position: relative;
        }
        .cart-btn:hover { background: var(--bark) !important; }
        .cart-badge {
          position: absolute;
          top: -8px;
          inset-inline-end: -8px;
          background: var(--gold);
          color: var(--espresso);
          font-size: 10px;
          font-weight: 700;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cinzel', serif;
        }

        /* ── PAGE HERO ── */
        .page-hero {
          background:
            linear-gradient(to bottom, rgba(28,14,4,0.65), rgba(28,14,4,0.58)),
            url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80') center 40%/cover no-repeat;
          padding: 90px 60px 80px;
          text-align: center;
        }
        .breadcrumb {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.22em;
          color: rgba(253,248,238,0.55);
          text-transform: uppercase;
          margin-bottom: 18px;
        }
        .breadcrumb a { color: rgba(253,248,238,0.55); text-decoration: none; }
        .breadcrumb a:hover { color: var(--gold-pale); }
        .breadcrumb span { margin: 0 8px; }
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(38px, 5.5vw, 68px);
          font-weight: 600;
          color: #FDF8EE;
          line-height: 1.1;
          margin-bottom: 14px;
          letter-spacing: 0.02em;
        }
        .page-title em { font-style: italic; color: var(--gold-pale); font-weight: 300; }
        .page-subtitle {
          font-size: 17px;
          color: rgba(253,248,238,0.70);
          font-style: italic;
          max-width: 560px;
          margin: 0 auto;
        }

        /* ── GOLD DIVIDER ── */
        .gold-rule {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 0 60px;
          margin: 56px 0 0;
        }
        .gold-rule::before, .gold-rule::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .gold-rule-icon {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 0.3em;
          color: var(--gold);
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* ── INTRO STATEMENT ── */
        .intro-statement {
          text-align: center;
          padding: 60px 60px 0;
          max-width: 860px;
          margin: 0 auto;
        }
        .intro-statement .eyebrow {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.3em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 22px;
          display: block;
        }
        .intro-statement h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 3.5vw, 46px);
          font-weight: 600;
          color: var(--espresso);
          line-height: 1.2;
          margin-bottom: 24px;
          letter-spacing: 0.01em;
        }
        .intro-statement h2 em {
          font-style: italic;
          font-weight: 300;
          color: var(--bark);
        }
        .intro-statement p {
          font-size: 18px;
          color: var(--warm-gray);
          font-style: italic;
          line-height: 1.8;
        }

        /* ── CONTACT LAYOUT ── */
        .contact-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          padding: 70px 60px;
          max-width: 1400px;
          margin: 0 auto;
          align-items: start;
        }

        /* ── CONTACT FORM ── */
        .contact-form-wrap {
          background: var(--parchment);
          border: 1px solid var(--border);
          padding: 48px 44px;
        }
        .form-header {
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border);
        }
        .form-header .eyebrow {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.3em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 10px;
          display: block;
        }
        .form-header h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(24px, 3vw, 34px);
          font-weight: 600;
          color: var(--espresso);
          line-height: 1.15;
        }
        .form-header h3 em {
          font-style: italic;
          font-weight: 300;
          color: var(--bark);
        }
        .form-row { margin-bottom: 20px; }
        .form-row label {
          display: block;
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--bark);
          margin-bottom: 8px;
        }
        .form-row input,
        .form-row textarea,
        .form-row select {
          width: 100%;
          background: var(--cream);
          border: 1px solid var(--border);
          padding: 12px 16px;
          font-family: 'EB Garamond', serif;
          font-size: 15px;
          color: var(--ink);
          font-style: italic;
          outline: none;
          resize: vertical;
          transition: border-color 0.2s;
        }
        .form-row input:focus,
        .form-row textarea:focus,
        .form-row select:focus { border-color: var(--gold); }
        .form-row textarea { min-height: 140px; }
        .form-row select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238B6914' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-inline-end: 36px;
        }
        [dir="rtl"] .form-row select {
          background-position: left 14px center;
        }
        .form-row-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .btn-submit {
          width: 100%;
          background: var(--espresso);
          color: var(--gold-pale);
          border: none;
          padding: 16px;
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          cursor: pointer;
          margin-top: 6px;
          transition: background 0.2s;
          font-weight: 700;
        }
        .btn-submit:hover { background: var(--bark); }

        /* ── CONTACT INFO PANEL ── */
        .contact-info {
          padding-inline-start: 64px;
        }
        .info-block {
          margin-bottom: 40px;
        }
        .info-block .eyebrow {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.3em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 16px;
          display: block;
        }
        .info-block h3 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(22px, 2.5vw, 32px);
          font-weight: 700;
          color: var(--espresso);
          line-height: 1.15;
          margin-bottom: 18px;
        }
        .info-block h3 em {
          font-style: italic;
          font-weight: 400;
          color: var(--bark);
        }
        .info-block p {
          font-size: 16px;
          color: var(--warm-gray);
          font-style: italic;
          line-height: 1.82;
          margin-bottom: 16px;
        }
        .info-block p strong {
          color: var(--espresso);
          font-style: normal;
          font-weight: 700;
        }
        .contact-detail {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
        }
        .contact-detail .icon {
          font-size: 20px;
          color: var(--gold);
          line-height: 1;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .contact-detail .label {
          font-family: 'Cinzel', serif;
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--warm-gray);
          text-transform: uppercase;
          display: block;
          margin-bottom: 2px;
        }
        .contact-detail .value {
          font-size: 15px;
          color: var(--espresso);
          font-style: italic;
          text-decoration: none;
          transition: color 0.2s;
        }
        .contact-detail a.value:hover { color: var(--gold); }

        /* ── SHOWROOMS SECTION ── */
        .showrooms-section {
          background: var(--espresso);
          padding: 80px 60px;
        }
        .showrooms-section .section-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .showrooms-section .section-header .eyebrow {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.28em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 14px;
          display: block;
        }
        .showrooms-section .section-header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 700;
          color: var(--gold-pale);
          line-height: 1.2;
          margin-bottom: 14px;
        }
        .showrooms-section .section-header h2 em {
          font-style: italic;
          font-weight: 400;
          color: var(--gold);
        }
        .showrooms-section .section-header p {
          font-size: 16px;
          color: rgba(245,230,192,0.55);
          font-style: italic;
          max-width: 500px;
          margin: 0 auto;
        }
        .showrooms-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .showroom-card {
          background: rgba(250,246,238,0.04);
          border: 1px solid rgba(184,134,11,0.18);
          padding: 36px 32px;
          position: relative;
          transition: border-color 0.3s, background 0.3s;
        }
        .showroom-card:hover {
          border-color: rgba(184,134,11,0.4);
          background: rgba(250,246,238,0.07);
        }
        .showroom-card .city {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--gold-pale);
          margin-bottom: 16px;
          line-height: 1;
        }
        .showroom-card .city em {
          font-style: italic;
          font-weight: 400;
          color: var(--gold);
          font-size: 20px;
        }
        .showroom-detail {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
        }
        .showroom-detail .icon {
          font-size: 14px;
          color: var(--gold);
          line-height: 1;
          margin-top: 4px;
          flex-shrink: 0;
        }
        .showroom-detail .label {
          font-family: 'Cinzel', serif;
          font-size: 9px;
          letter-spacing: 0.16em;
          color: rgba(245,230,192,0.45);
          text-transform: uppercase;
          display: block;
          margin-bottom: 2px;
        }
        .showroom-detail .value {
          font-size: 14px;
          color: rgba(245,230,192,0.72);
          font-style: italic;
          line-height: 1.5;
        }
        .showroom-detail a.value {
          color: var(--gold-pale);
          text-decoration: none;
          transition: color 0.2s;
        }
        .showroom-detail a.value:hover { color: var(--gold); }
        .showroom-note {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(184,134,11,0.15);
          font-size: 12px;
          color: rgba(245,230,192,0.45);
          font-style: italic;
          font-family: 'Cinzel', serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ── FAQ SECTION ── */
        .faq-section {
          padding: 80px 60px;
          background: var(--cream);
          border-top: 1px solid var(--border);
        }
        .faq-section .section-header {
          text-align: center;
          margin-bottom: 56px;
        }
        .faq-section .section-header .eyebrow {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.28em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 14px;
          display: block;
        }
        .faq-section .section-header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(28px, 3vw, 42px);
          font-weight: 700;
          color: var(--espresso);
          line-height: 1.2;
          margin-bottom: 14px;
        }
        .faq-section .section-header h2 em {
          font-style: italic;
          font-weight: 400;
          color: var(--bark);
        }
        .faq-section .section-header p {
          font-size: 16px;
          color: var(--warm-gray);
          font-style: italic;
          max-width: 500px;
          margin: 0 auto;
        }
        .faq-list {
          max-width: 860px;
          margin: 0 auto;
        }
        .faq-item {
          border-bottom: 1px solid var(--border);
        }
        .faq-question {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 0;
          cursor: pointer;
          transition: color 0.2s;
        }
        .faq-question:hover { color: var(--gold); }
        .faq-question h4 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--espresso);
          line-height: 1.3;
          padding-inline-end: 20px;
        }
        .faq-question .toggle {
          font-family: 'Cinzel', serif;
          font-size: 18px;
          color: var(--gold);
          line-height: 1;
          flex-shrink: 0;
          transition: transform 0.3s;
        }
        .faq-question .toggle.open { transform: rotate(45deg); }
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease, padding 0.4s ease;
        }
        .faq-answer.open {
          max-height: 300px;
          padding-bottom: 24px;
        }
        .faq-answer p {
          font-size: 15.5px;
          color: var(--warm-gray);
          font-style: italic;
          line-height: 1.82;
          padding-inline-end: 40px;
        }

        /* ── SUCCESS MESSAGE ── */
        .form-success {
          text-align: center;
          padding: 40px 20px;
          background: var(--cream);
          border: 1px solid var(--gold);
        }
        .form-success p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 600;
          color: var(--espresso);
          font-style: italic;
          margin-bottom: 8px;
        }
        .form-success span {
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.18em;
          color: var(--gold);
          text-transform: uppercase;
        }

        /* ── FOOTER ── */
        .contact-footer {
          background: var(--espresso);
          padding: 70px 60px 30px;
          color: rgba(253,248,238,0.65);
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 56px;
        }
        .footer-brand {
          font-family: 'Cinzel', serif;
          font-size: 20px;
          color: var(--gold-pale);
          letter-spacing: 0.08em;
          margin-bottom: 16px;
        }
        .footer-brand span {
          display: block;
          font-size: 10px;
          letter-spacing: 0.22em;
          color: var(--gold);
          font-weight: 400;
          margin-top: 3px;
        }
        .footer-desc {
          font-size: 14px;
          line-height: 1.75;
          font-style: italic;
          margin-bottom: 22px;
        }
        .footer-socials { display: flex; gap: 14px; }
        .footer-socials a {
          width: 34px; height: 34px;
          border: 1px solid rgba(184,134,11,0.35);
          display: flex; align-items: center; justify-content: center;
          color: var(--gold); font-size: 13px; text-decoration: none;
          font-family: 'Cinzel', serif;
          transition: border-color 0.2s, background 0.2s;
        }
        .footer-socials a:hover { border-color: var(--gold); background: rgba(184,134,11,0.12); }
        .footer-col-title {
          font-family: 'Cinzel', serif;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: var(--gold-pale);
          text-transform: uppercase;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(184,134,11,0.2);
        }
        .footer-links { list-style: none; }
        .footer-links li + li { margin-top: 10px; }
        .footer-links a {
          text-decoration: none; font-size: 14px;
          color: rgba(253,248,238,0.58); font-style: italic;
          transition: color 0.2s;
        }
        .footer-links a:hover { color: var(--gold-pale); }
        .footer-bottom {
          border-top: 1px solid rgba(184,134,11,0.18);
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Cinzel', serif;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(253,248,238,0.3);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1100px) {
          .showrooms-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .contact-layout { grid-template-columns: 1fr; gap: 50px; padding: 50px 30px; }
          .contact-info { padding: 0; }
          .contact-nav, .page-hero, .showrooms-section, .faq-section, .contact-footer { padding-left: 30px; padding-right: 30px; }
          .gold-rule { padding: 0 30px; }
          .intro-statement { padding: 50px 30px 0; }
          .footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .contact-nav { padding: 0 20px; }
          .nav-links { display: none; }
          .page-hero { padding: 50px 20px 40px; }
          .contact-layout { padding: 30px 20px; }
          .contact-form-wrap { padding: 30px 24px; }
          .form-row-split { grid-template-columns: 1fr; }
          .showrooms-section { padding: 50px 20px; }
          .showrooms-grid { grid-template-columns: 1fr; }
          .faq-section { padding: 50px 20px; }
          .contact-footer { padding: 50px 20px 24px; }
          .footer-grid { grid-template-columns: 1fr; gap: 28px; }
          .footer-bottom { flex-direction: column; gap: 10px; text-align: center; }
          .gold-rule { padding: 0 20px; }
          .intro-statement { padding: 40px 20px 0; }
        }
      `}</style>

      {/* ════════════════════════════════════════
          TOP BAR
         ════════════════════════════════════════ */}
      <div className="topbar">{settings.home_topbar || t("common:topbar")}</div>

      {/* ════════════════════════════════════════
          NAVIGATION
         ════════════════════════════════════════ */}
      {/* NAVIGATION */}
      <Nav
        variant="contact"
        cartCount={cartCount}
        activePath={location.pathname}
        navTagline={settings.home_nav_logo_tagline}
      />

      {/* ════════════════════════════════════════
          PAGE HERO
         ════════════════════════════════════════ */}
      <div className="page-hero">
        <div className="breadcrumb">
          <Link
            to="/"
            style={{ color: "rgba(253,248,238,0.55)", textDecoration: "none" }}>
            الرئيسية
          </Link>
          <span>·</span>
          <span style={{ color: "var(--gold-pale)" }}>تواصل معنا</span>
        </div>
        <h1 className="page-title">
          {settings.contact_hero_title_main}{" "}
          <em>{settings.contact_hero_title_emphasis}</em>
        </h1>
        <p className="page-subtitle">{settings.contact_hero_subtitle}</p>
      </div>

      {/* ════════════════════════════════════════
          GOLD DIVIDER
         ════════════════════════════════════════ */}
      <div className="gold-rule">
        <span className="gold-rule-icon">✦ منذ سنين ✦</span>
      </div>

      {/* ════════════════════════════════════════
          INTRO STATEMENT
         ════════════════════════════════════════ */}
      <div className="intro-statement">
        <span className="eyebrow">متجر تراثي . غرداية</span>
        <h2>
          {settings.contact_intro_title_main}{" "}
          <em>{settings.contact_intro_title_emphasis}</em>
        </h2>
        <p>{settings.contact_intro_text}</p>
      </div>

      {/* ════════════════════════════════════════
          CONTACT LAYOUT
         ════════════════════════════════════════ */}
      <div className="contact-layout">
        {/* ── LEFT: Contact Form ── */}
        <div className="contact-form-wrap">
          {submitted ? (
            <div className="form-success">
              <p>{t("contact:form.success.title")}</p>
              <span>{t("contact:form.success.subtitle")}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-header">
                <span className="eyebrow">{t("contact:form.eyebrow")}</span>
                <h3>{renderEmphasis(t("contact:form.title"))}</h3>
              </div>

              <div className="form-row">
                <label>{t("contact:form.fields.inquiryType")}</label>

                <select
                  name="inquiryType"
                  value={formData.inquiryType}
                  onChange={handleChange}>
                  {inquiryTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row-split">
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label>{t("contact:form.fields.name")}</label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("contact:form.placeholders.name")}
                    required
                  />
                </div>
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label>{t("contact:form.fields.email")}</label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("contact:form.placeholders.email")}
                    required
                  />
                </div>
              </div>

              <div className="form-row-split" style={{ marginTop: "20px" }}>
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label>{t("contact:form.fields.phone")}</label>

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("contact:form.placeholders.phone")}
                  />
                </div>
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label>{t("contact:form.fields.subject")}</label>

                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t("contact:form.placeholders.subject")}
                    required
                  />
                </div>
              </div>

              <div className="form-row" style={{ marginTop: "20px" }}>
                <label>{t("contact:form.fields.message")}</label>

                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t("contact:form.placeholders.message")}
                  required
                />
              </div>

              {contactError && (
                <p
                  style={{
                    color: "#a00",
                    fontSize: "0.9rem",
                    marginTop: "0.75rem",
                  }}>
                  {contactError}
                </p>
              )}

              <button
                type="submit"
                className="btn-submit"
                disabled={submittingContact}>
                {submittingContact
                  ? t("contact:form.submitting")
                  : t("contact:form.submit")}
              </button>
            </form>
          )}
        </div>

        {/* ── RIGHT: Contact Info ── */}
        <div className="contact-info">
          <div className="info-block">
            <span className="eyebrow">{t("contact:contactInfo.eyebrow")}</span>
            <h3>{renderEmphasis(t("contact:contactInfo.title"))}</h3>
            <p>{t("contact:contactInfo.subtitle")}</p>

            <div className="contact-detail">
              <span className="icon">✉</span>
              <div>
                <span className="label">
                  {t("contact:contactInfo.emailLabel")}
                </span>
                <a
                  href={`mailto:${dbContactInfo?.store_email || t("contact:contactInfo.email")}`}
                  className="value">
                  {dbContactInfo?.store_email || t("contact:contactInfo.email")}
                </a>
              </div>
            </div>
            <div className="contact-detail">
              <span className="icon">☎</span>
              <div>
                <span className="label">
                  {t("contact:contactInfo.phoneLabel")}
                </span>
                <a
                  href={`tel:${(dbContactInfo?.store_phone || t("contact:contactInfo.phone")).replace(/\s/g, "")}`}
                  className="value">
                  {dbContactInfo?.store_phone || t("contact:contactInfo.phone")}
                </a>
              </div>
            </div>
            <div className="contact-detail">
              <span className="icon">✆</span>
              <div>
                <span className="label">
                  {t("contact:contactInfo.whatsappLabel")}
                </span>
                <a
                  href={
                    dbContactInfo?.whatsapp_url ||
                    `https://wa.me/${t("contact:contactInfo.whatsapp").replace(/\s/g, "")}`
                  }
                  className="value">
                  {dbContactInfo?.store_whatsapp ||
                    t("contact:contactInfo.whatsapp")}
                </a>
              </div>
            </div>
            <div className="contact-detail">
              <span className="icon">◈</span>
              <div>
                <span className="label">
                  {t("contact:contactInfo.hoursLabel")}
                </span>
                <span className="value">
                  {dbContactInfo?.store_hours_ar ||
                    t("contact:contactInfo.hoursValue")}
                </span>
              </div>
            </div>
          </div>

          <div className="info-block">
            <span className="eyebrow">{t("contact:commissions.eyebrow")}</span>
            <h3>{renderEmphasis(t("contact:commissions.title"))}</h3>
            <p>
              {t("contact:commissions.desc", {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>

            <p style={{ marginTop: "12px" }}>{t("contact:commissions.note")}</p>
          </div>

          <div className="info-block">
            <span className="eyebrow">{t("contact:partnerships.eyebrow")}</span>
            <h3>{renderEmphasis(t("contact:partnerships.title"))}</h3>
            <p>
              {(() => {
                const text = t("contact:partnerships.text");
                const email =
                  dbContactInfo?.store_email || t("contact:partnerships.email");
                const token = "{{email}}";

                if (!text || !text.includes(token)) return text;

                const [before, after] = text.split(token);
                return (
                  <>
                    {before}
                    <a
                      href={`mailto:${email}`}
                      className="value"
                      style={{
                        color: "var(--bark)",
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                      }}>
                      {email}
                    </a>
                    {after}
                  </>
                );
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SHOWROOMS SECTION
         ════════════════════════════════════════ */}
      <section className="showrooms-section">
        <div className="section-header">
          <span className="eyebrow">{t("contact:showrooms.eyebrow")}</span>
          <h2>{renderEmphasis(t("contact:showrooms.title"))}</h2>
          <p>{t("contact:showrooms.subtitle")}</p>
        </div>
        {showrooms === null ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--warm-gray)",
              padding: "2rem 0",
              fontStyle: "italic",
            }}>
            {t("contact:showrooms.empty")}
          </p>
        ) : (
          <div className="showrooms-grid">
            {showrooms.map((room, idx) => (
              <div key={idx} className="showroom-card">
                <div className="city">
                  {room.city} <em>✦</em>
                </div>
                <div className="showroom-detail">
                  <span className="icon">◎</span>
                  <div>
                    <span className="label">
                      {t("contact:showrooms.labels.address")}
                    </span>
                    <span className="value">{room.address}</span>
                  </div>
                </div>
                <div className="showroom-detail">
                  <span className="icon">◈</span>
                  <div>
                    <span className="label">
                      {t("contact:showrooms.labels.hours")}
                    </span>
                    <span className="value">{room.hours}</span>
                  </div>
                </div>
                {room.phone ? (
                  <div className="showroom-detail">
                    <span className="icon">☎</span>
                    <div>
                      <span className="label">
                        {t("contact:showrooms.labels.phone")}
                      </span>
                      <a
                        href={`tel:${room.phone.replace(/\s/g, "")}`}
                        className="value">
                        {room.phone}
                      </a>
                    </div>
                  </div>
                ) : null}
                {room.email ? (
                  <div className="showroom-detail">
                    <span className="icon">✉</span>
                    <div>
                      <span className="label">
                        {t("contact:showrooms.labels.email")}
                      </span>
                      <a href={`mailto:${room.email}`} className="value">
                        {room.email}
                      </a>
                    </div>
                  </div>
                ) : null}
                {room.note ? (
                  <div className="showroom-note">{room.note}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════
          FAQ SECTION
         ════════════════════════════════════════ */}
      <section className="faq-section">
        <div className="section-header">
          <span className="eyebrow">{t("contact:faq.eyebrow")}</span>
          <h2>{renderEmphasis(t("contact:faq.title"))}</h2>
          <p>{t("contact:faq.subtitle")}</p>
        </div>
        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div key={idx} className="faq-item">
              <div
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                <h4>{faq.q}</h4>
                <span className={`toggle ${openFaq === idx ? "open" : ""}`}>
                  +
                </span>
              </div>
              <div className={`faq-answer ${openFaq === idx ? "open" : ""}`}>
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;
