import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { useCart, ensureCsrf, getCookie } from '../context/CartContext';
import { useLang } from '../hooks/useLang';
import { useFrontSettings } from '../context/FrontSettingsContext';
import { trackViewContent, trackAddToCart } from '../utils/pixel.js';

const API = import.meta.env.VITE_API_URL;

const BADGE_AR = {
  sale: 'تخفيض',
  new: 'جديد',
  limited: 'كمية محدودة',
  bestseller: 'الأكثر مبيعاً',
};
const badgeAr = (badge) => BADGE_AR[badge?.toLowerCase()] ?? badge;

/* ═══════════════════════════════════════════════════════════════
   BURNOUS & BROCADE — Product Detail Page
   Heritage Store · React Component
   ═══════════════════════════════════════════════════════════════ */

const ProductDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { productId } = useParams();
  const { addToCart, cartCount } = useCart();
  const { t } = useLang();
  const settings = useFrontSettings();

  /* ── State ── */
  const [currentImg, setCurrentImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const sliderRef = useRef(null);

  /* ── Reviews state ── */
  const [reviews, setReviews] = useState([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewForm, setReviewForm] = useState({ reviewer_name: '', rating: 5, body: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  /* computed from actual approved reviews once loaded */
  const computedReviewCount = reviewsLoaded ? reviews.length : null;
  const computedRating = reviewsLoaded && reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : reviewsLoaded ? '0.0' : null;

  /* ── Additional state ── */
  const [wilayas, setWilayas] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  /* ── API product override ── */
  const [apiProduct, setApiProduct] = useState(null);
  const [productLoaded, setProductLoaded] = useState(false);
  const [productNotFound, setProductNotFound] = useState(false);
  useEffect(() => {
    if (!productId) return;
    setProductLoaded(false);
    setProductNotFound(false);
    fetch(`${API}/shop/products/${productId}/`)
      .then((r) => {
        if (r.status === 404) { setProductNotFound(true); setProductLoaded(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (data) {
          setApiProduct(data);
          setProductLoaded(true);
          trackViewContent({
            id: data.id,
            name: data.name_ar || data.name,
            category: data.category?.name_ar || data.category?.name || '',
            price: parseFloat(data.price),
          });
          const sizes = Array.isArray(data.sizes) ? data.sizes : [];
          if (data.availability === 'out_of_stock' || data.availability === 'discontinued') {
            setSelectedSize(null);
          } else {
            setSelectedSize(sizes.length > 0 ? sizes[0].name : null);
          }
          const colors = Array.isArray(data.colors) ? data.colors : [];
          setSelectedColor(colors.length > 0 ? colors[0].name_ar : null);
          setCurrentImg(0);
          // Fetch related: same category + newest, deduplicated
          const catSlug = data.category?.slug;
          const catFetch = catSlug
            ? fetch(`${API}/shop/products/?category=${catSlug}&page_size=2`).then((r) => r.ok ? r.json() : null)
            : Promise.resolve(null);
          const newFetch = fetch(`${API}/shop/products/?is_new=true&page_size=2`).then((r) => r.ok ? r.json() : null);
          Promise.all([catFetch, newFetch]).then(([catData, newData]) => {
            const catList = Array.isArray(catData?.results) ? catData.results : (Array.isArray(catData) ? catData : []);
            const newList = Array.isArray(newData?.results) ? newData.results : (Array.isArray(newData) ? newData : []);
            const seen = new Set();
            const merged = [];
            for (const p of [...catList, ...newList]) {
              if (p.id !== parseInt(productId, 10) && !seen.has(p.id)) {
                seen.add(p.id);
                merged.push(p);
                if (merged.length === 4) break;
              }
            }
            setRelatedProducts(merged);
          });
        } else if (!productNotFound) {
          setProductNotFound(true);
          setProductLoaded(true);
        }
      })
      .catch(() => { setProductNotFound(true); setProductLoaded(true); });
  }, [productId]);

  useEffect(() => {
    fetch(`${API}/shop/wilayas/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setWilayas(Array.isArray(data) ? data : []))
      .catch(() => setWilayas([]));
  }, []);

  /* ── Product Data (fallback) ── */
  const fallbackProduct = {
    name: "Grand Ivory Burnous",
    subtitle: "Tlemcen · Pure Wool · Hand-stitched Trim",
    price: 12500,
    oldPrice: null,
    sku: "BB-TLE-001-IV",
    rating: 4.9,
    reviewCount: 24,
    origin: "Tlemcen",
    material: "100% Pure Wool",
    craftTime: "14–18 days",
    artisan: "Hadj Mourad Benali",
    availability: "متوفر",
    description: `A prestige burnous woven from the finest Tlemcen wool, featuring hand-stitched trim and a heritage drape favoured for weddings and celebrations. The burnous is the quintessential garment of the Maghreb — a cloak of dignity, warmth, and unmistakable presence.`,
    details: [
      "Hand-woven on traditional Tlemcen looms by fourth-generation artisans",
      "Pure undyed wool with natural ivory tone — no chemical bleaching",
      "Hand-stitched braided trim along the hood edge and front opening",
      "Weighted hem for graceful drape and wind resistance",
      "Includes wax-sealed artisan certificate and provenance card",
      "Ships in a hand-stamped cotton storage bag"
    ],
    care: [
      "Dry clean only — preserve the natural wool oils",
      "Store flat or on a wide hanger to maintain shape",
      "Avoid prolonged direct sunlight to prevent natural yellowing",
      "Air seasonally — wool benefits from gentle ventilation"
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    sizeGuide: {
      'S': { chest: '104 cm', length: '125 cm', sleeve: '58 cm' },
      'M': { chest: '110 cm', length: '130 cm', sleeve: '60 cm' },
      'L': { chest: '116 cm', length: '135 cm', sleeve: '62 cm' },
      'XL': { chest: '124 cm', length: '140 cm', sleeve: '64 cm' },
      'XXL': { chest: '132 cm', length: '145 cm', sleeve: '66 cm' }
    },
    colors: [
      { name: 'Ivory', hex: '#F5F0E8' },
      { name: 'Espresso', hex: '#2C1A08' },
      { name: 'Sand', hex: '#C4A882' },
      { name: 'Forest', hex: '#1B3A2E' }
    ],
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=85",
      "https://images.unsplash.com/photo-1597466599360-3b596c3d7cb7?w=900&q=85",
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=900&q=85",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900&q=85"
    ]
  };

  /* helper: split a newline-delimited text field into a non-empty string array */
  const splitLines = (text) =>
    (text || '').split('\n').map((l) => l.trim()).filter(Boolean);

  // Build the image gallery from DB data only — no hardcoded fallback images.
  // Priority: primary image_url first, then gallery images ordered by `order`.
  // If both are empty we keep an empty array and render a placeholder instead.
  const buildImages = (api) => {
    const primary = api.image_url || null;
    const gallery = (Array.isArray(api.images) ? api.images : [])
      .filter((img) => img && img.url)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((img) => img.url);

    const all = [];
    if (primary) all.push(primary);
    for (const url of gallery) {
      if (url !== primary) all.push(url);
    }
    return all;
  };

  // Merge API data over fallback; keep rich display fields from fallback when API doesn't have them
  const product = apiProduct
    ? {
        ...fallbackProduct,
        id: apiProduct.id,
        name: apiProduct.name,
        name_ar: apiProduct.name_ar,
        sku: apiProduct.sku,
        price: parseFloat(apiProduct.price),
        oldPrice: apiProduct.old_price
          ? parseFloat(apiProduct.old_price)
          : null,
        origin: apiProduct.origin || fallbackProduct.origin,
        material: apiProduct.material || fallbackProduct.material,
        description: apiProduct.description || fallbackProduct.description,
        description_ar: apiProduct.description_ar || null,
        // Empty string / no value → empty array so the "not available" message shows
        details: splitLines(apiProduct.details),
        care: splitLines(apiProduct.care_instructions),
        sizes:
          Array.isArray(apiProduct.sizes) && apiProduct.sizes.length > 0
            ? apiProduct.sizes.map((s) => s.name)
            : fallbackProduct.sizes,
        colors:
          Array.isArray(apiProduct.colors) && apiProduct.colors.length > 0
            ? apiProduct.colors.map((c) => ({ name: c.name_ar, hex: c.hex }))
            : [],
        rating: parseFloat(apiProduct.rating),
        reviewCount: apiProduct.review_count,
        availability:
          apiProduct.availability === "in_stock"
            ? "متوفر"
            : apiProduct.availability === "low_stock"
              ? "المخزون المنخفض"
              : apiProduct.availability === "out_of_stock"
                ? "غير متوفر"
                : "متوفر",
        images: buildImages(apiProduct),
        subtitle: `${apiProduct.origin || fallbackProduct.origin} · ${apiProduct.material || fallbackProduct.material}`,
        badge: apiProduct.badge && apiProduct.badge !== 'none' ? apiProduct.badge : null,
      }
    : fallbackProduct;


  /* ── Load reviews eagerly when product loads ── */
  useEffect(() => {
    if (!productId) return;
    setReviews([]);
    setReviewsLoaded(false);
    fetch(`${API}/shop/products/${productId}/reviews/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setReviews(Array.isArray(data) ? data : (data?.results || []));
        setReviewsLoaded(true);
      })
      .catch(() => setReviewsLoaded(true));
  }, [productId]);

  /* ── Handlers ── */
  const hasImages = product.images && product.images.length > 0;
  const nextImg = () => setCurrentImg((prev) => (prev + 1) % product.images.length);
  const prevImg = () => setCurrentImg((prev) => (prev - 1 + product.images.length) % product.images.length);

  const handleAddToCart = async () => {
    if (addingToCart) return;
    setAddingToCart(true);
    const effectiveSize = selectedSize ?? (product.sizes?.[0] ?? null);
    const effectiveColor = selectedColor ?? (product.colors?.[0]?.name ?? null);
    try {
      await addToCart(product.id || parseInt(productId, 10), qty, effectiveSize, effectiveColor);
      trackAddToCart({ id: product.id || parseInt(productId, 10), name: product.name_ar || product.name, price: product.price, qty });
    } catch {
      // ignore — CartContext surfaces the error
    }
    setTimeout(() => navigate('/cart'), 3000);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.reviewer_name.trim()) return;
    setReviewSubmitting(true);
    try {
      await ensureCsrf();
      const res = await fetch(`${API}/shop/products/${productId}/reviews/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
        body: JSON.stringify(reviewForm),
      });
      if (res.ok) {
        setReviewMsg('شكراً! تقييمك قيد المراجعة.');
        setReviewForm({ reviewer_name: '', rating: 5, body: '' });
      } else {
        setReviewMsg('حدث خطأ، حاول مرة أخرى.');
      }
    } catch {
      setReviewMsg('حدث خطأ، حاول مرة أخرى.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleZoomMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') nextImg();
      if (e.key === 'ArrowLeft') prevImg();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  /* ── Styles ── */
  const styles = {
    root: {
      '--gold': '#B8860B',
      '--gold-light': '#D4A017',
      '--gold-pale': '#F5E6C0',
      '--cream': '#FAF6EE',
      '--parchment': '#F0E8D5',
      '--bark': '#8B6914',
      '--espresso': '#2C1A08',
      '--ink': '#1A1208',
      '--warm-gray': '#7A6F63',
      '--border': '#D9C99A',
      fontFamily: "'EB Garamond', Georgia, serif",
      background: 'var(--cream)',
      color: 'var(--ink)',
      fontSize: '17px',
      lineHeight: 1.7,
      overflowX: 'hidden'
    },
    topbar: {
      background: 'var(--espresso)',
      color: 'var(--gold-pale)',
      textAlign: 'center',
      padding: '8px 20px',
      fontSize: '13px',
      letterSpacing: '0.12em',
      fontFamily: "'Cinzel', serif"
    },
    nav: {
      background: 'var(--cream)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 60px',
      height: '80px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    },
    navLogo: {
      fontFamily: "'Cinzel', serif",
      fontSize: '22px',
      fontWeight: 600,
      color: 'var(--espresso)',
      letterSpacing: '0.08em',
      textDecoration: 'none',
      lineHeight: 1.2,
      cursor: 'pointer'
    },
    navLogoSpan: {
      display: 'block',
      fontSize: '10px',
      letterSpacing: '0.22em',
      color: 'var(--gold)',
      fontWeight: 400,
      marginTop: '2px'
    },
    navLinks: {
      display: 'flex',
      gap: '36px',
      listStyle: 'none',
      alignItems: 'center',
      margin: 0,
      padding: 0
    },
    navLink: {
      fontFamily: "'Cinzel', serif",
      fontSize: '12px',
      letterSpacing: '0.14em',
      color: 'var(--espresso)',
      textDecoration: 'none',
      textTransform: 'uppercase',
      transition: 'color 0.2s',
      cursor: 'pointer'
    },
    navActions: {
      display: 'flex',
      gap: '20px',
      alignItems: 'center'
    },
    cartBtn: {
      background: 'var(--espresso)',
      color: 'var(--gold-pale)',
      padding: '9px 22px',
      borderRadius: '1px',
      fontFamily: "'Cinzel', serif",
      fontSize: '13px',
      letterSpacing: '0.1em',
      textDecoration: 'none',
      cursor: 'pointer',
      border: 'none',
      position: 'relative'
    },
    cartBadge: {
      position: 'absolute',
      top: '-8px',
      right: '-8px',
      background: 'var(--gold)',
      color: 'var(--espresso)',
      fontSize: '10px',
      fontWeight: 700,
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Cinzel', serif"
    },
    breadcrumb: {
      fontFamily: "'Cinzel', serif",
      fontSize: '10px',
      letterSpacing: '0.22em',
      color: 'rgba(253,248,238,0.55)',
      textTransform: 'uppercase',
      marginBottom: '18px'
    },
    breadcrumbLink: {
      color: 'rgba(253,248,238,0.55)',
      textDecoration: 'none',
      cursor: 'pointer'
    },
    pageHero: {
      background: 'linear-gradient(to bottom, rgba(28,14,4,0.6), rgba(28,14,4,0.55)), url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80) center 30%/cover no-repeat',
      padding: '60px 60px 50px',
      textAlign: 'center'
    },
    pageTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 'clamp(36px, 5vw, 62px)',
      fontWeight: 300,
      color: '#FDF8EE',
      lineHeight: 1.1,
      marginBottom: '12px'
    },
    pageTitleEm: {
      fontStyle: 'italic',
      color: 'var(--gold-pale)'
    },
    /* Product Layout */
    productLayout: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '60px',
      padding: '60px',
      maxWidth: '1400px',
      margin: '0 auto',
      alignItems: 'start'
    },
    /* Image Slider */
    sliderWrap: {
      position: 'relative',
      background: 'var(--parchment)',
      border: '1px solid var(--border)'
    },
    mainImageWrap: {
      position: 'relative',
      overflow: 'hidden',
      aspectRatio: '3/4',
      cursor: isZoomed ? 'zoom-out' : 'zoom-in'
    },
    mainImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: 'saturate(0.88)',
      display: 'block',
      transition: 'transform 0.4s ease',
      transform: isZoomed ? 'scale(2)' : 'scale(1)',
      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
    },
    sliderArrow: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '44px',
      height: '44px',
      background: 'rgba(250,246,238,0.9)',
      border: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '18px',
      color: 'var(--espresso)',
      zIndex: 2,
      transition: 'background 0.2s, border-color 0.2s',
      fontFamily: "'Cinzel', serif"
    },
    thumbStrip: {
      display: 'flex',
      gap: '8px',
      padding: '16px',
      background: 'var(--cream)',
      borderTop: '1px solid var(--border)',
      overflowX: 'auto'
    },
    thumb: {
      width: '72px',
      height: '72px',
      objectFit: 'cover',
      border: '2px solid transparent',
      cursor: 'pointer',
      filter: 'saturate(0.85)',
      transition: 'border-color 0.2s, opacity 0.2s',
      flexShrink: 0
    },
    thumbActive: {
      borderColor: 'var(--gold)',
      opacity: 1
    },
    thumbInactive: {
      borderColor: 'transparent',
      opacity: 0.6
    },
    imgCounter: {
      position: 'absolute',
      bottom: '100px',
      right: '16px',
      background: 'rgba(28,14,4,0.75)',
      color: 'var(--gold-pale)',
      fontFamily: "'Cinzel', serif",
      fontSize: '10px',
      letterSpacing: '0.16em',
      padding: '6px 12px',
      textTransform: 'uppercase'
    },
    zoomHint: {
      position: 'absolute',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(28,14,4,0.6)',
      color: 'var(--gold-pale)',
      fontFamily: "'Cinzel', serif",
      fontSize: '9px',
      letterSpacing: '0.14em',
      padding: '5px 12px',
      textTransform: 'uppercase',
      pointerEvents: 'none'
    },
    /* Product Info */
    productInfo: {
      paddingTop: '8px'
    },
    productEyebrow: {
      fontFamily: "'Cinzel', serif",
      fontSize: '10px',
      letterSpacing: '0.28em',
      color: 'var(--gold)',
      textTransform: 'uppercase',
      marginBottom: '14px',
      display: 'block'
    },
    productName: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 'clamp(32px, 4vw, 52px)',
      fontWeight: 600,
      color: 'var(--espresso)',
      lineHeight: 1.1,
      marginBottom: '10px',
      letterSpacing: '0.01em'
    },
    productSubtitle: {
      fontSize: '15px',
      color: 'var(--warm-gray)',
      fontStyle: 'italic',
      marginBottom: '20px'
    },
    ratingRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px'
    },
    stars: {
      color: 'var(--gold)',
      fontSize: '15px',
      letterSpacing: '3px'
    },
    ratingText: {
      fontFamily: "'Cinzel', serif",
      fontSize: '11px',
      letterSpacing: '0.12em',
      color: 'var(--warm-gray)',
      textTransform: 'uppercase'
    },
    priceRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '14px',
      marginBottom: '28px',
      paddingBottom: '28px',
      borderBottom: '1px solid var(--border)'
    },
    price: {
      fontFamily: "'Cinzel', serif",
      fontSize: '28px',
      color: 'var(--bark)',
      letterSpacing: '0.04em',
      fontWeight: 600
    },
    oldPrice: {
      fontFamily: "'Cinzel', serif",
      fontSize: '18px',
      color: 'var(--warm-gray)',
      textDecoration: 'line-through',
      letterSpacing: '0.04em'
    },
    sku: {
      fontFamily: "'Cinzel', serif",
      fontSize: '10px',
      letterSpacing: '0.16em',
      color: 'var(--warm-gray)',
      textTransform: 'uppercase'
    },
    /* Color Selector */
    selectorLabel: {
      fontFamily: "'Cinzel', serif",
      fontSize: '10px',
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: 'var(--espresso)',
      marginBottom: '12px',
      display: 'block'
    },
    colorRow: {
      display: 'flex',
      gap: '10px',
      marginBottom: '24px'
    },
    colorSwatch: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'transform 0.2s, border-color 0.2s',
      position: 'relative'
    },
    colorSwatchActive: {
      borderColor: 'var(--gold)',
      transform: 'scale(1.15)'
    },
    colorName: {
      fontSize: '13px',
      color: 'var(--warm-gray)',
      fontStyle: 'italic',
      marginLeft: '4px',
      marginBottom: '24px',
      display: 'block'
    },
    /* Size Selector */
    sizeRow: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px',
      flexWrap: 'wrap'
    },
    sizeBtn: {
      minWidth: '48px',
      height: '44px',
      border: '1px solid var(--border)',
      background: 'var(--cream)',
      fontFamily: "'Cinzel', serif",
      fontSize: '12px',
      letterSpacing: '0.08em',
      color: 'var(--espresso)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    sizeBtnActive: {
      background: 'var(--espresso)',
      color: 'var(--gold-pale)',
      borderColor: 'var(--espresso)'
    },
    sizeGuideLink: {
      fontSize: '13px',
      color: 'var(--bark)',
      fontStyle: 'italic',
      textDecoration: 'underline',
      textUnderlineOffset: '3px',
      cursor: 'pointer',
      marginBottom: '28px',
      display: 'inline-block'
    },
    /* Qty & Add to Cart */
    actionRow: {
      display: 'flex',
      gap: '14px',
      marginBottom: '24px'
    },
    qtyWrap: {
      display: 'flex',
      alignItems: 'center',
      border: '1px solid var(--border)',
      height: '52px'
    },
    qtyBtn: {
      width: '44px',
      height: '100%',
      border: 'none',
      background: 'var(--parchment)',
      fontFamily: "'Cinzel', serif",
      fontSize: '16px',
      color: 'var(--espresso)',
      cursor: 'pointer',
      transition: 'background 0.2s'
    },
    qtyDisplay: {
      width: '50px',
      textAlign: 'center',
      fontFamily: "'Cinzel', serif",
      fontSize: '14px',
      color: 'var(--espresso)',
      border: 'none',
      background: 'transparent'
    },
    addToCartBtn: {
      flex: 1,
      height: '52px',
      background: 'var(--espresso)',
      color: 'var(--gold-pale)',
      border: 'none',
      fontFamily: "'Cinzel', serif",
      fontSize: '11px',
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      transition: 'background 0.25s',
      fontWeight: 700,
      position: 'relative',
      overflow: 'hidden'
    },
    addToCartBtnHover: {
      background: 'var(--bark)'
    },
    wishlistBtn: {
      width: '52px',
      height: '52px',
      border: '1px solid var(--border)',
      background: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '20px',
      color: isWishlisted ? '#8B0000' : 'var(--warm-gray)',
      transition: 'color 0.2s, border-color 0.2s'
    },
    addedToast: {
      position: 'fixed',
      top: '100px',
      right: '30px',
      background: 'var(--espresso)',
      color: 'var(--gold-pale)',
      padding: '16px 28px',
      fontFamily: "'Cinzel', serif",
      fontSize: '11px',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      zIndex: 200,
      border: '1px solid var(--gold)',
      opacity: showAdded ? 1 : 0,
      transform: showAdded ? 'translateY(0)' : 'translateY(-20px)',
      transition: 'all 0.4s ease',
      pointerEvents: 'none'
    },
    /* Meta */
    metaGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '14px',
      padding: '20px 0',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      marginBottom: '28px'
    },
    metaItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    metaLabel: {
      fontFamily: "'Cinzel', serif",
      fontSize: '9px',
      letterSpacing: '0.18em',
      color: 'var(--warm-gray)',
      textTransform: 'uppercase'
    },
    metaValue: {
      fontSize: '14px',
      color: 'var(--espresso)',
      fontStyle: 'italic'
    },
    /* Tabs */
    tabsWrap: {
      marginTop: '8px'
    },
    tabList: {
      display: 'flex',
      gap: 0,
      borderBottom: '1px solid var(--border)',
      marginBottom: '28px'
    },
    tabBtn: {
      padding: '14px 28px',
      fontFamily: "'Cinzel', serif",
      fontSize: '11px',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: 'var(--warm-gray)',
      background: 'transparent',
      border: 'none',
      borderBottom: '2px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginBottom: '-1px'
    },
    tabBtnActive: {
      color: 'var(--espresso)',
      borderBottomColor: 'var(--gold)'
    },
    tabContent: {
      fontSize: '15.5px',
      color: 'var(--warm-gray)',
      lineHeight: 1.82,
      fontStyle: 'italic'
    },
    detailList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    detailItem: {
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      fontSize: '15px',
      color: 'var(--warm-gray)',
      fontStyle: 'italic'
    },
    detailBullet: {
      color: 'var(--gold)',
      fontSize: '18px',
      lineHeight: 1,
      marginTop: '2px',
      flexShrink: 0
    },
    /* Related Products */
    relatedSection: {
      padding: '80px 60px',
      background: 'var(--parchment)',
      borderTop: '1px solid var(--border)'
    },
    sectionHeader: {
      textAlign: 'center',
      marginBottom: '52px'
    },
    sectionEyebrow: {
      fontFamily: "'Cinzel', serif",
      fontSize: '10px',
      letterSpacing: '0.28em',
      color: 'var(--gold)',
      textTransform: 'uppercase',
      marginBottom: '14px',
      display: 'block'
    },
    sectionTitle: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: 'clamp(28px, 3.5vw, 42px)',
      fontWeight: 600,
      color: 'var(--espresso)',
      lineHeight: 1.2,
      marginBottom: '14px'
    },
    sectionTitleEm: {
      fontStyle: 'italic',
      fontWeight: 400,
      color: 'var(--bark)'
    },
    relatedGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '28px',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    relatedCard: {
      display: 'block',
      textDecoration: 'none',
      color: 'inherit',
      position: 'relative',
      background: 'var(--cream)',
      border: '1px solid var(--border)',
      transition: 'box-shadow 0.3s'
    },
    relatedImgWrap: {
      position: 'relative',
      overflow: 'hidden',
      aspectRatio: '3/4',
      background: 'var(--parchment)'
    },
    relatedImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: 'saturate(0.88)',
      display: 'block',
      transition: 'transform 0.6s ease'
    },
    relatedBadge: {
      position: 'absolute',
      top: '12px',
      left: 0,
      background: 'var(--espresso)',
      color: 'var(--gold-pale)',
      fontFamily: "'Cinzel', serif",
      fontSize: '9px',
      letterSpacing: '0.16em',
      padding: '5px 10px',
      textTransform: 'uppercase'
    },
    mainBadge: {
      position: 'absolute',
      top: '20px',
      right: 0,
      background: 'var(--espresso)',
      color: 'var(--gold-pale)',
      fontFamily: "'Amiri', serif",
      fontSize: '13px',
      letterSpacing: '0.06em',
      padding: '6px 16px',
      zIndex: 2,
    },
    relatedInfo: {
      padding: '18px 20px 22px'
    },
    relatedName: {
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: '18px',
      fontWeight: 400,
      color: 'var(--espresso)',
      marginBottom: '4px',
      lineHeight: 1.3
    },
    relatedOrigin: {
      fontSize: '12px',
      color: 'var(--warm-gray)',
      fontStyle: 'italic',
      marginBottom: '10px'
    },
    relatedPriceRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '8px'
    },
    relatedPrice: {
      fontFamily: "'Cinzel', serif",
      fontSize: '14px',
      color: 'var(--bark)',
      letterSpacing: '0.06em'
    },
    relatedOldPrice: {
      textDecoration: 'line-through',
      color: 'var(--warm-gray)',
      fontSize: '12px',
      fontFamily: "'Cinzel', serif"
    },
    relatedStars: {
      color: 'var(--gold)',
      fontSize: '11px',
      letterSpacing: '2px',
      marginBottom: '8px',
      display: 'block'
    },
    /* Footer */
    footer: {
      background: 'var(--espresso)',
      padding: '70px 60px 30px',
      color: 'rgba(253,248,238,0.65)'
    },
    footerGrid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr',
      gap: '48px',
      marginBottom: '56px',
      maxWidth: '1400px',
      margin: '0 auto 56px'
    },
    footerBrand: {
      fontFamily: "'Cinzel', serif",
      fontSize: '20px',
      color: 'var(--gold-pale)',
      letterSpacing: '0.08em',
      marginBottom: '16px'
    },
    footerBrandSpan: {
      display: 'block',
      fontSize: '10px',
      letterSpacing: '0.22em',
      color: 'var(--gold)',
      fontWeight: 400,
      marginTop: '3px'
    },
    footerDesc: {
      fontSize: '14px',
      lineHeight: 1.75,
      fontStyle: 'italic',
      marginBottom: '22px'
    },
    footerSocials: {
      display: 'flex',
      gap: '14px'
    },
    footerSocialLink: {
      width: '34px',
      height: '34px',
      border: '1px solid rgba(184,134,11,0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--gold)',
      fontSize: '13px',
      textDecoration: 'none',
      fontFamily: "'Cinzel', serif",
      transition: 'border-color 0.2s, background 0.2s',
      cursor: 'pointer'
    },
    footerColTitle: {
      fontFamily: "'Cinzel', serif",
      fontSize: '11px',
      letterSpacing: '0.2em',
      color: 'var(--gold-pale)',
      textTransform: 'uppercase',
      marginBottom: '20px',
      paddingBottom: '10px',
      borderBottom: '1px solid rgba(184,134,11,0.2)'
    },
    footerLinks: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    footerLink: {
      textDecoration: 'none',
      fontSize: '14px',
      color: 'rgba(253,248,238,0.58)',
      fontStyle: 'italic',
      transition: 'color 0.2s',
      cursor: 'pointer',
      display: 'block',
      marginTop: '10px'
    },
    footerBottom: {
      borderTop: '1px solid rgba(184,134,11,0.18)',
      paddingTop: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: "'Cinzel', serif",
      fontSize: '10px',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'rgba(253,248,238,0.3)',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    /* Divider */
    goldRule: {
      display: 'flex',
      alignItems: 'center',
      gap: '18px',
      padding: '0 60px',
      margin: '0 auto',
      maxWidth: '1400px'
    },
    goldRuleLine: {
      flex: 1,
      height: '1px',
      background: 'var(--border)'
    },
    goldRuleIcon: {
      fontFamily: "'Cinzel', serif",
      fontSize: '11px',
      letterSpacing: '0.3em',
      color: 'var(--gold)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      marginTop: "1rem"
    },
    /* Responsive */
    responsive: `
      @media (max-width: 1100px) {
        .product-layout { grid-template-columns: 1fr !important; gap: 40px !important; }
        .related-grid { grid-template-columns: repeat(2, 1fr) !important; }
        .footer-grid { grid-template-columns: 1fr 1fr !important; }
      }
      @media (max-width: 768px) {
        nav { padding: 0 20px !important; }
        .nav-links { display: none !important; }
        .product-layout { padding: 30px 20px !important; }
        .related-section { padding: 50px 20px !important; }
        .related-grid { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
        .footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        .footer-bottom { flex-direction: column !important; gap: 10px !important; text-align: center !important; }
        .page-hero { padding: 40px 20px 30px !important; }
        .gold-rule { padding: 0 20px !important; }
        .meta-grid { grid-template-columns: 1fr !important; }
        .action-row { flex-wrap: wrap !important; gap: 10px !important; }
        .qty-wrap { order: 1; }
        .wishlist-btn { order: 2; }
        .add-to-cart-btn { order: 3 !important; flex: 0 0 100% !important; }
      }
      @media (max-width: 480px) {
        .product-layout { padding: 20px 14px !important; }
        .tab-list button { flex: 1 !important; min-width: 0 !important; padding: 12px 6px !important; font-size: 10px !important; letter-spacing: 0.1em !important; }
        .size-btn { min-width: 40px !important; height: 38px !important; font-size: 11px !important; }
      }
    `
  };

  return (
    <div style={styles.root}>
      <style>{styles.responsive}</style>

      {/* ══ TOP BAR ══ */}
      <div style={styles.topbar}>
        {settings.home_topbar || t("common:topbar")}
      </div>

      {/* ══ NAVIGATION ══ */}
      <Nav
        variant="default"
        cartCount={cartCount}
        activePath={location.pathname}
        navTagline={settings.home_nav_logo_tagline}
      />

      {/* ══ LOADING ══ */}
      {!productLoaded && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            background: 'var(--cream)',
            gap: '28px',
          }}>
          <style>{`
            @keyframes pdp-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '3px solid var(--border)',
              borderTopColor: 'var(--gold)',
              borderRadius: '50%',
              animation: 'pdp-spin 0.9s linear infinite',
            }}
          />
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: '10px',
              letterSpacing: '0.28em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
            }}>
            جارٍ التحميل…
          </span>
        </div>
      )}

      {/* ══ NOT FOUND ══ */}
      {productLoaded && productNotFound && (
        <div
          style={{
            textAlign: "center",
            padding: "80px 40px",
            minHeight: "40vh",
          }}>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "11px",
              letterSpacing: "0.28em",
              color: "var(--gold)",
              textTransform: "uppercase",
              marginBottom: "18px",
            }}>
            404
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(28px, 4vw, 46px)",
              fontWeight: 600,
              color: "var(--espresso)",
              marginBottom: "16px",
            }}>
            {t("product:notFound.title") || "Product Not Found"}
          </h2>
          <p
            style={{
              color: "var(--warm-gray)",
              fontStyle: "italic",
              marginBottom: "28px",
            }}>
            {t("product:notFound.subtitle") ||
              "This product does not exist or has been removed."}
          </p>
          <Link
            to="/shop"
            style={{
              background: "var(--espresso)",
              color: "var(--gold-pale)",
              padding: "12px 32px",
              fontFamily: "'Cinzel', serif",
              fontSize: "11px",
              letterSpacing: "0.22em",
              textDecoration: "none",
              textTransform: "uppercase",
            }}>
            {t("product:notFound.cta") || "Back to Shop"}
          </Link>
        </div>
      )}

      {/* ══ PAGE CONTENT (only after load, only when found) ══ */}
      {productLoaded && !productNotFound && (
        <>
          {/* ══ PAGE HERO ══ */}
          <div style={styles.pageHero} className="page-hero">
            <div style={styles.breadcrumb}>
              <Link to="/" style={styles.breadcrumbLink}>
                {t("product:breadcrumb.home")}
              </Link>
              <span style={{ margin: "0 8px" }}>·</span>
              <Link to="/shop" style={styles.breadcrumbLink}>
                {t("product:breadcrumb.shop")}
              </Link>
              <span style={{ margin: "0 8px" }}>·</span>
              <span style={{ color: "var(--gold-pale)" }}>{product.name}</span>
            </div>
            <h1 style={styles.pageTitle}>
              {t("product:pageTitle").split("{{em}}")[0]}
              <em style={styles.pageTitleEm}>
                {t("product:pageTitle")
                  .split("{{em}}")[1]
                  ?.replace("{{/em}}", "") || ""}
              </em>
            </h1>
          </div>

          {/* ══ GOLD DIVIDER ══ */}
          <div
            style={{
              ...styles.goldRule,
              paddingTop: "40px",
              paddingBottom: "20px",
            }}
            className="gold-rule">
            <div style={styles.goldRuleLine}></div>
            <span style={styles.goldRuleIcon}>✦ صنع تراثي ✦</span>
            <div style={styles.goldRuleLine}></div>
          </div>

          {/* ══ PRODUCT LAYOUT ══ */}
          <div style={styles.productLayout} className="product-layout">
            {/* ── LEFT: Image Slider ── */}
            <div style={styles.sliderWrap}>
              <div
                style={styles.mainImageWrap}
                onClick={() => hasImages && setIsZoomed(!isZoomed)}
                onMouseMove={handleZoomMove}
                onMouseLeave={() => setIsZoomed(false)}>
                {hasImages ? (
                  <img
                    src={product.images[currentImg]}
                    alt={product.name}
                    style={styles.mainImage}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "var(--parchment)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                    <span
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "11px",
                        letterSpacing: "0.2em",
                        color: "var(--warm-gray)",
                        textTransform: "uppercase",
                      }}>
                      {"لا توجد صورة"}
                    </span>
                  </div>
                )}
                {product.badge && (
                  <span style={{
                    ...styles.mainBadge,
                    ...(product.badge.toLowerCase() === 'sale' ? { background: '#7a1a0a' } : {}),
                    ...(product.badge.toLowerCase() === 'limited' ? { background: '#5a2d00' } : {}),
                  }}>
                    {badgeAr(product.badge)}
                  </span>
                )}
                {hasImages && (
                  <>
                    <div style={styles.imgCounter}>
                      {currentImg + 1} / {product.images.length}
                    </div>
                    <div style={styles.zoomHint}>
                      {isZoomed ? "Click to zoom out" : "Click to zoom in"}
                    </div>
                  </>
                )}
              </div>

              {/* Arrows — only when more than one image */}
              {hasImages && product.images.length > 1 && (
                <>
                  <button
                    style={{ ...styles.sliderArrow, left: "12px" }}
                    onClick={prevImg}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--gold)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}>
                    ‹
                  </button>
                  <button
                    style={{ ...styles.sliderArrow, right: "12px" }}
                    onClick={nextImg}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--gold)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                    }}>
                    ›
                  </button>
                </>
              )}

              {/* Thumbnails — only when more than one image */}
              {hasImages && product.images.length > 1 && (
                <div style={styles.thumbStrip} ref={sliderRef}>
                  {product.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      style={{
                        ...styles.thumb,
                        ...(idx === currentImg
                          ? styles.thumbActive
                          : styles.thumbInactive),
                      }}
                      onClick={() => setCurrentImg(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Product Info ── */}
            <div style={styles.productInfo}>
              <span style={styles.productEyebrow}>
                {product.origin} · {product.material}
              </span>
              <h1 style={styles.productName}>
                {product.name_ar || product.name}
              </h1>
              <p style={styles.productSubtitle}>{product.subtitle}</p>

              {/* Rating — computed from actual approved reviews */}
              <div style={styles.ratingRow}>
                {(() => {
                  const displayRating =
                    computedRating !== null
                      ? parseFloat(computedRating)
                      : parseFloat(product.rating) || 0;
                  const r = Math.min(5, Math.max(0, Math.round(displayRating)));
                  return (
                    <span style={styles.stars}>
                      {"★".repeat(r)}
                      {"☆".repeat(5 - r)}
                    </span>
                  );
                })()}
                <span style={styles.ratingText}>
                  {computedRating !== null ? computedRating : product.rating}
                  {" · "}
                  {computedReviewCount !== null
                    ? computedReviewCount
                    : product.reviewCount}{" "}
                  {t("product:labels.reviews")}
                </span>
              </div>

              {/* Price */}
              <div style={styles.priceRow}>
                <span style={styles.price}>
                  {product.price.toLocaleString("fr-DZ")} DA
                </span>
                {product.oldPrice && (
                  <span style={styles.oldPrice}>
                    {product.oldPrice.toLocaleString("fr-DZ")} DA
                  </span>
                )}
                <span style={{ ...styles.sku, marginLeft: "auto" }}>
                  SKU: {product.sku}
                </span>
              </div>

              {/* Color — only shown when the admin has defined colours */}
              {product.colors && product.colors.length > 0 && (
                <>
                  <span style={styles.selectorLabel}>
                    {"اللون"}
                    {selectedColor && (
                      <span
                        style={{
                          fontStyle: "italic",
                          color: "var(--bark)",
                          marginLeft: "6px",
                        }}>
                        — {selectedColor}
                      </span>
                    )}
                  </span>
                  <div style={styles.colorRow}>
                    {product.colors.map((c) => (
                      <button
                        key={c.name}
                        style={{
                          ...styles.colorSwatch,
                          background: c.hex,
                          ...(selectedColor === c.name
                            ? styles.colorSwatchActive
                            : {}),
                        }}
                        onClick={() => setSelectedColor(c.name)}
                        title={c.name}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Size — only shown when the admin has defined sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <>
                  <span style={styles.selectorLabel}>
                    {"المقاس"}
                    {selectedSize && (
                      <span
                        style={{
                          fontStyle: "italic",
                          color: "var(--bark)",
                          marginLeft: "6px",
                        }}>
                        — {selectedSize}
                      </span>
                    )}
                  </span>
                  <div style={styles.sizeRow}>
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        className="size-btn"
                        style={{
                          ...styles.sizeBtn,
                          ...(selectedSize === s ? styles.sizeBtnActive : {}),
                          padding: "0 14px",
                        }}
                        onClick={() => setSelectedSize(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Qty & Actions */}
              <div style={styles.actionRow} className="action-row">
                <div style={styles.qtyWrap} className="qty-wrap">
                  <button
                    style={styles.qtyBtn}
                    onClick={() => setQty(Math.max(1, qty - 1))}>
                    −
                  </button>
                  <span style={styles.qtyDisplay}>{qty}</span>
                  <button style={styles.qtyBtn} onClick={() => setQty(qty + 1)}>
                    +
                  </button>
                </div>
                <button
                  style={styles.addToCartBtn}
                  className="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  onMouseEnter={(e) => {
                    if (!addingToCart)
                      e.currentTarget.style.background = "var(--bark)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--espresso)";
                  }}>
                  {addingToCart
                    ? "تمت الإضافة! جاري التوجيه…"
                    : `${t("product:labels.addToBasket")} — ${(product.price * qty).toLocaleString("fr-DZ")} DA`}
                </button>
                <button
                  style={styles.wishlistBtn}
                  className="wishlist-btn"
                  onClick={() => setIsWishlisted(!isWishlisted)}>
                  {isWishlisted ? "♥" : "♡"}
                </button>
              </div>

              {/* Meta */}
              <div style={styles.metaGrid} className="meta-grid">
                {/* <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Artisan</span>
              <span style={styles.metaValue}>{product.artisan}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Craft Time</span>
              <span style={styles.metaValue}>{product.craftTime}</span>
            </div> */}
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>مصنوع من</span>
                  <span style={styles.metaValue}>{product.material}</span>
                </div>
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>متوفر</span>
                  <span style={{ ...styles.metaValue, color: "#2d5a27" }}>
                    {product.availability}
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div style={styles.tabsWrap}>
                <div style={styles.tabList} className="tab-list">
                  {[
                    { id: "description", label: t("product:tabs.description") },
                    { id: "details", label: t("product:tabs.details") },
                    { id: "shipping", label: t("product:tabs.shipping") },
                    { id: "reviews", label: t("product:tabs.reviews") },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      style={{
                        ...styles.tabBtn,
                        ...(activeTab === tab.id ? styles.tabBtnActive : {}),
                      }}
                      onClick={() => setActiveTab(tab.id)}>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={styles.tabContent}>
                  {activeTab === "description" && (
                    <p>{product.description_ar || product.description}</p>
                  )}
                  {activeTab === "details" && (
                    <ul style={styles.detailList}>
                      {/* Product details */}
                      {product.details.length > 0 ? (
                        product.details.map((d, i) => (
                          <li key={i} style={styles.detailItem}>
                            <span style={styles.detailBullet}>✦</span>
                            {d}
                          </li>
                        ))
                      ) : (
                        <li
                          style={{
                            ...styles.detailItem,
                            color: "var(--warm-gray)",
                            fontStyle: "italic",
                          }}>
                          <span style={styles.detailBullet}>✦</span>
                          {"لا تفاصيل متوفرة بعد."}
                        </li>
                      )}

                      {/* Care instructions */}
                      <li
                        style={{
                          ...styles.detailItem,
                          borderBottom: "none",
                          marginTop: "14px",
                        }}>
                        <span style={styles.detailBullet}>◈</span>
                        <strong
                          style={{
                            color: "var(--espresso)",
                            fontStyle: "normal",
                          }}>
                          {"تعليمات العناية:"}
                        </strong>
                      </li>
                      {product.care.length > 0 ? (
                        product.care.map((c, i) => (
                          <li
                            key={`care-${i}`}
                            style={{
                              ...styles.detailItem,
                              paddingInlineStart: "30px",
                            }}>
                            {c}
                          </li>
                        ))
                      ) : (
                        <li
                          style={{
                            ...styles.detailItem,
                            paddingInlineStart: "30px",
                            color: "var(--warm-gray)",
                            fontStyle: "italic",
                          }}>
                          {"لا تعليمات عناية متوفرة."}
                        </li>
                      )}
                    </ul>
                  )}
                  {activeTab === "shipping" && (
                    <div>
                      <p style={{ marginBottom: "16px" }}>
                        {settings.product_shipping_intro}
                      </p>
                      <div style={{ marginBottom: "20px" }}>
                        <label
                          style={{
                            ...styles.selectorLabel,
                            display: "block",
                            marginBottom: "8px",
                          }}>
                          {"الولاية"}
                        </label>
                        <select
                          value={selectedWilaya?.id || ""}
                          onChange={(e) =>
                            setSelectedWilaya(
                              wilayas.find(
                                (w) => w.id === parseInt(e.target.value, 10),
                              ) || null,
                            )
                          }
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            border: "1px solid var(--border)",
                            background: "var(--cream)",
                            fontFamily: "'EB Garamond', Georgia, serif",
                            fontSize: "15px",
                            color: "var(--espresso)",
                            cursor: "pointer",
                          }}>
                          <option value="">{"اختر الولاية"}</option>
                          {wilayas.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name_ar}
                            </option>
                          ))}
                        </select>
                        {selectedWilaya && (
                          <p
                            style={{
                              marginTop: "10px",
                              color: "var(--bark)",
                              fontStyle: "italic",
                            }}>
                            {`📦 سعر الاستلام من المكتب — ${selectedWilaya.name_ar}: ${Number(selectedWilaya.shipping_price_desk_da).toLocaleString("fr-DZ")} DA`}
                          </p>
                        )}
                      </div>
                      <ul style={styles.detailList}>
                        <li style={styles.detailItem}>
                          <span style={styles.detailBullet}>✦</span>
                          {settings.product_shipping_algeria}
                        </li>
                        <li style={styles.detailItem}>
                          <span style={styles.detailBullet}>✦</span>
                          {settings.product_shipping_france}
                        </li>
                        <li style={styles.detailItem}>
                          <span style={styles.detailBullet}>✦</span>
                          {settings.product_shipping_tracking}
                        </li>
                      </ul>
                    </div>
                  )}
                  {activeTab === "reviews" && (
                    <div>
                      {/* Existing approved reviews */}
                      {!reviewsLoaded ? (
                        <p
                          style={{
                            color: "var(--warm-gray)",
                            fontStyle: "italic",
                          }}>
                          {"جاري التحميل…"}
                        </p>
                      ) : reviews.length === 0 ? (
                        <p
                          style={{
                            color: "var(--warm-gray)",
                            fontStyle: "italic",
                            marginBottom: "28px",
                          }}>
                          {"لا توجد تقييمات بعد. كن أول من يقيّم!"}
                        </p>
                      ) : (
                        <ul
                          style={{
                            ...styles.detailList,
                            marginBottom: "28px",
                          }}>
                          {reviews.map((rv) => {
                            const r = Math.min(5, Math.max(0, rv.rating));
                            return (
                              <li
                                key={rv.id}
                                style={{
                                  ...styles.detailItem,
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  gap: "6px",
                                }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                  }}>
                                  <span
                                    style={{
                                      color: "var(--gold)",
                                      fontSize: "14px",
                                      letterSpacing: "2px",
                                    }}>
                                    {"★".repeat(r)}
                                    {"☆".repeat(5 - r)}
                                  </span>
                                  <span style={{ ...styles.metaLabel }}>
                                    {rv.reviewer_name}
                                  </span>
                                </div>
                                {rv.body ? (
                                  <p style={{ margin: 0, fontStyle: "italic" }}>
                                    {rv.body}
                                  </p>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      {/* Submit a review */}
                      <div
                        style={{
                          borderTop: "1px solid var(--border)",
                          paddingTop: "24px",
                          marginTop: "8px",
                        }}>
                        <p
                          style={{
                            ...styles.selectorLabel,
                            marginBottom: "18px",
                          }}>
                          {"أضف تقييمك"}
                        </p>
                        <form
                          onSubmit={handleReviewSubmit}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                          }}>
                          <input
                            type="text"
                            required
                            placeholder={"اسمك"}
                            value={reviewForm.reviewer_name}
                            onChange={(e) =>
                              setReviewForm((f) => ({
                                ...f,
                                reviewer_name: e.target.value,
                              }))
                            }
                            style={{
                              padding: "10px 14px",
                              border: "1px solid var(--border)",
                              background: "var(--cream)",
                              fontFamily: "'EB Garamond', Georgia, serif",
                              fontSize: "15px",
                              color: "var(--espresso)",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}>
                            <span
                              style={{
                                ...styles.selectorLabel,
                                marginBottom: 0,
                              }}>
                              {"التقييم"}
                            </span>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() =>
                                  setReviewForm((f) => ({ ...f, rating: n }))
                                }
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "22px",
                                  color:
                                    n <= reviewForm.rating
                                      ? "var(--gold)"
                                      : "var(--border)",
                                  padding: "0 2px",
                                  lineHeight: 1,
                                }}>
                                ★
                              </button>
                            ))}
                          </div>
                          <textarea
                            placeholder={"تعليقك (اختياري)"}
                            value={reviewForm.body}
                            onChange={(e) =>
                              setReviewForm((f) => ({
                                ...f,
                                body: e.target.value,
                              }))
                            }
                            rows={3}
                            style={{
                              padding: "10px 14px",
                              border: "1px solid var(--border)",
                              background: "var(--cream)",
                              fontFamily: "'EB Garamond', Georgia, serif",
                              fontSize: "15px",
                              color: "var(--espresso)",
                              resize: "vertical",
                            }}
                          />
                          <button
                            type="submit"
                            disabled={reviewSubmitting}
                            style={{
                              ...styles.addToCartBtn,
                              height: "46px",
                              flex: "none",
                              width: "fit-content",
                              padding: "0 32px",
                            }}>
                            {reviewSubmitting
                              ? "جاري الإرسال…"
                              : "إرسال التقييم"}
                          </button>
                          {reviewMsg && (
                            <p
                              style={{
                                color: "var(--bark)",
                                fontStyle: "italic",
                                margin: 0,
                              }}>
                              {reviewMsg}
                            </p>
                          )}
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══ ADDED TO CART TOAST ══ */}
          <div style={styles.addedToast}>
            ✦ Added to Basket — {product.name} ({selectedSize}, {selectedColor})
            × {qty}
          </div>

          {/* ══ RELATED PRODUCTS ══ */}
          <section style={styles.relatedSection} className="related-section">
            <div style={styles.sectionHeader}>
              <span style={styles.sectionEyebrow}>قد تقدر أيضا</span>
              <h2 style={styles.sectionTitle}>
                منتجات <em style={styles.sectionTitleEm}>ذات صلة </em>
              </h2>
              <p
                style={{
                  fontSize: "16px",
                  color: "var(--warm-gray)",
                  fontStyle: "italic",
                  maxWidth: "500px",
                  margin: "0 auto",
                }}>
                الملابس التي تشترك في نفس روح الحرفة والتقاليد الإقليمية.
              </p>
            </div>

            <div style={styles.relatedGrid} className="related-grid">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  style={styles.relatedCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 8px 32px rgba(28,14,4,0.12)";
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    const img = e.currentTarget.querySelector("img");
                    if (img) img.style.transform = "scale(1)";
                  }}>
                  <div style={styles.relatedImgWrap}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        style={styles.relatedImg}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "var(--parchment)",
                        }}
                      />
                    )}
                    {item.badge && item.badge !== "none" && (
                      <span
                        style={{
                          ...styles.relatedBadge,
                          ...(item.badge === "Sale"
                            ? { background: "#7a1a0a" }
                            : {}),
                          ...(item.badge === "Limited"
                            ? { background: "#5a2d00" }
                            : {}),
                        }}>
                        {badgeAr(item.badge)}
                      </span>
                    )}
                  </div>
                  <div style={styles.relatedInfo}>
                    <span style={styles.relatedStars}>
                      {(() => {
                        const r = Math.min(
                          5,
                          Math.max(0, Math.round(parseFloat(item.rating) || 0)),
                        );
                        return "★".repeat(r) + "☆".repeat(5 - r);
                      })()}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--warm-gray)",
                        fontStyle: "italic",
                        display: "block",
                        marginBottom: "6px",
                      }}>
                      ({item.review_count || 0})
                    </span>
                    <div style={styles.relatedName}>
                      {item.name_ar || item.name}
                    </div>
                    <div style={styles.relatedOrigin}>{item.origin}</div>
                    <div style={styles.relatedPriceRow}>
                      <span style={styles.relatedPrice}>
                        {Number(item.price).toLocaleString("fr-DZ")} DA
                      </span>
                      {item.old_price && (
                        <span style={styles.relatedOldPrice}>
                          {Number(item.old_price).toLocaleString("fr-DZ")} DA
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <Footer />
        </>
      )}
    </div>
  );
};

export default ProductDetailPage;
