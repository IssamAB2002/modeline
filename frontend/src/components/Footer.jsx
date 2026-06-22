import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../hooks/useLang';

const API = import.meta.env.VITE_API_URL;

export default function Footer() {
  const { t } = useLang();
  const [categories, setCategories] = useState([]);
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    fetch(`${API}/shop/categories/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetch(`${API}/home/contact-info/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setContactInfo(data))
      .catch(() => setContactInfo(null));
  }, []);

  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div className="footer-brand">{t('footer.brand')}<span>{t('footer.since')}</span></div>
          <p className="footer-desc">{t('footer.desc')}</p>
          <div className="footer-socials">
            <a href={contactInfo?.facebook_url || '#'}>FB</a>
            <a href={contactInfo?.linkedin_url || '#'}>LD</a>
            <a href={contactInfo?.whatsapp_url || '#'}>WA</a>
            <a href={contactInfo?.instagram_url || '#'}>IG</a>
          </div>
        </div>
        <div>
          <div className="footer-col-title">{t('footer.collections')}</div>
          <ul className="footer-links">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link to={`/shop?category=${cat.slug}#products`}>{cat.name_ar || cat.name}</Link>
              </li>
            ))}
            <li><Link to="/shop?sort=new#products">{t('footer.links.newArrivals')}</Link></li>
          </ul>
        </div>
        <div>
          <div className="footer-col-title">{t('footer.information')}</div>
          <ul className="footer-links">
            <li><Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.ourStory')}</Link></li>
            <li><Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.ourArtisans')}</Link></li>
            <li><Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.authenticity')}</Link></li>
            <li><Link to="/about" onClick={() => window.scrollTo(0, 0)}>{t('footer.links.shipping')}</Link></li>
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
  );
}
