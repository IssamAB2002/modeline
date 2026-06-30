import { API } from './config.js';

function _buildFooter(contactInfo) {
  const fbUrl   = contactInfo?.facebook_url  || '#';
  const igUrl   = contactInfo?.instagram_url || '#';
  const waUrl   = contactInfo?.whatsapp_url  || '#';

  return `
    <footer>
      <div class="footer-grid">
        <div>
          <div class="footer-brand">
            Modeline
            <span>الأزياء التراثية الجزائرية</span>
          </div>
          <p class="footer-desc">
            متجر عائلي متخصص في الملابس التقليدية الجزائرية الراقية — كل قطعة تحكي قصة.
          </p>
          <div class="footer-socials">
            <a href="${fbUrl}" target="_blank" rel="noopener" aria-label="Facebook">FB</a>
            <a href="${igUrl}" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
            <a href="${waUrl}" target="_blank" rel="noopener" aria-label="WhatsApp">WA</a>
          </div>
        </div>

        <div>
          <div class="footer-col-title">التشكيلات</div>
          <ul class="footer-links">
            <li><a href="/shop.html?sort=new">وصل حديثاً</a></li>
            <li><a href="/shop.html?sort=bestseller">الأكثر مبيعاً</a></li>
            <li><a href="/shop.html?sort=featured">مميزة</a></li>
          </ul>
        </div>

        <div>
          <div class="footer-col-title">معلومات</div>
          <ul class="footer-links">
            <li><a href="/about.html">قصتنا</a></li>
            <li><a href="/about.html">حرفيونا</a></li>
            <li><a href="/about.html">الأصالة والضمان</a></li>
            <li><a href="/about.html">الشحن والتوصيل</a></li>
          </ul>
        </div>

        <div>
          <div class="footer-col-title">تواصل</div>
          <ul class="footer-links">
            <li><a href="${waUrl}" target="_blank" rel="noopener">واتساب</a></li>
            <li><a href="/contact.html">راسلنا</a></li>
            <li><a href="/contact.html">صالات العرض</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <span>جميع الحقوق محفوظة © 2026 Modeline</span>
        <span>حجوط - تيبازة</span>
      </div>
      <div class="footer-credit">
        <a href="https://www.facebook.com/issam.ab.79393/" target="_blank" rel="noopener noreferrer">
          Website Created By Issam AB
        </a>
      </div>
    </footer>`;
}

// Public entry point — call from each page's JS on DOMContentLoaded.
export async function initFooter() {
  const footerEl = document.getElementById('footer-container');
  if (!footerEl) return;

  const contactInfo = await fetch(`${API}/home/contact-info/`)
    .then((r) => r.ok ? r.json() : null)
    .catch(() => null);

  footerEl.innerHTML = _buildFooter(contactInfo);
}
