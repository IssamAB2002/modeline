import React from 'react';
import { Link } from 'react-router-dom';

function starString(rating) {
  const r = Math.min(5, Math.max(0, Math.round(parseFloat(rating) || 0)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

function badgeClass(badgeType) {
  if (badgeType === 'sale') return 'sale';
  if (badgeType === 'new') return 'new-badge';
  if (badgeType === 'limited') return 'limited';
  if (badgeType === 'bestseller') return 'bestseller';
  return '';
}

const BADGE_AR = {
  sale: 'تخفيض',
  new: 'جديد',
  limited: 'كمية محدودة',
  bestseller: 'الأكثر مبيعاً',
};

/**
 * Shared product card for Home (grid only) and Shop (grid + list).
 *
 * Props:
 *   product     – normalised object: { id, name, origin, price, oldPrice,
 *                   badge, badgeType, image, rating, reviewCount, desc }
 *   lang        – 'ar' | 'en'
 *   viewMode    – 'grid' (default) | 'list'
 *   formatPrice – (number) => string
 *   t           – i18n translate fn
 *   onAddToCart – (product, event) => void
 *   wishlistActive – boolean (optional)
 *   onWishlist  – (id, event) => void (optional)
 */
const ProductCard = ({
  product,
  lang,
  viewMode = 'grid',
  formatPrice,
  t,
  onAddToCart,
  wishlistActive = false,
  onWishlist,
}) => {
  const isList = viewMode === 'list';
  const bc = product.badgeType ? badgeClass(product.badgeType) : '';

  const displayRating = parseFloat(product.rating) || 0;
  const displayCount = product.reviewCount || 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className={`product-card${isList ? ' list-card' : ''}`}
    >
      {/* ── Image ── */}
      <div className="product-img-wrap">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#e8dfc8' }} />
        )}

        {product.badge && (
          <span className={`product-badge${bc ? ` ${bc}` : ''}`}>
            {(product.badgeType && BADGE_AR[product.badgeType]) || product.badge}
          </span>
        )}

        {onWishlist && (
          <button
            className={`wishlist-btn${wishlistActive ? ' active' : ''}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlist(product.id, e); }}
          >
            {wishlistActive ? '♥' : '♡'}
          </button>
        )}

        <button
          className="product-quick"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product, e); }}
        >
          {t('buttons.addToBasket')}
        </button>
      </div>

      {/* ── Text content — wrapped so list-card grid places it correctly ── */}
      <div className="product-content">
        <div className="product-info">
          <div className="product-rating">
            <span className="stars">{starString(displayRating)}</span>
            <span className="review-count">
              {displayRating.toFixed(1)}
              {' · '}
              {displayCount}
              {' '}{t('product:labels.reviews')}
            </span>
          </div>
          <div className="product-name">{product.name}</div>
          <div className="product-origin">{product.origin}</div>
          <div className="product-price">
            {product.oldPrice && (
              <span className="price-old">{formatPrice(product.oldPrice)}</span>
            )}
            <span className={product.oldPrice ? 'price-sale' : ''}>
              {formatPrice(product.price)}
            </span>
          </div>
        </div>

        {isList && product.desc && (
          <p className="list-desc">{product.desc}</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
