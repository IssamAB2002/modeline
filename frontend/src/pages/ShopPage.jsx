import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import "../pageStyles/shop.css";
import { useLang } from "../hooks/useLang";
import { useCart } from "../context/CartContext";
import { useFrontSettings } from "../context/FrontSettingsContext";
import { trackAddToCart } from "../utils/pixel.js";

const API = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 12;

const ShopPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLang();
  const { addToCart, cartCount } = useCart();
  const settings = useFrontSettings();

  // UI state
  const [viewMode, setViewMode] = useState("grid");
  const [wishlist, setWishlist] = useState({});
  const [showAdded, setShowAdded] = useState(false);
  const [addedProduct, setAddedProduct] = useState("");
  const [priceValue, setPriceValue] = useState(30000);
  const [sortOption, setSortOption] = useState("featured");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [textFilter, setTextFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState({ price: true });

  const toggleFilter = (key) => setFilterOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  // Data state
  const [apiProducts, setApiProducts] = useState(null); // null = loading
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Fetch products — re-runs when page changes
  useEffect(() => {
    setApiProducts(null);
    const url = `${API}/shop/products/?page=${page}&page_size=${PAGE_SIZE}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { setApiProducts([]); setTotalCount(0); return; }
        if (Array.isArray(data.results)) {
          setApiProducts(data.results);
          setTotalCount(data.count || 0);
        } else if (Array.isArray(data)) {
          setApiProducts(data);
          setTotalCount(data.length);
        } else {
          setApiProducts([]);
          setTotalCount(0);
        }
      })
      .catch(() => { setApiProducts([]); setTotalCount(0); });
  }, [page]);

  const normalizeProduct = (p) => {
    const badgeRaw = p.badge && p.badge !== "none" && p.badge !== "" ? p.badge : null;
    return {
      id: p.id,
      name: p.name_ar || p.name,
      origin: p.origin || "",
      price: parseFloat(p.price),
      oldPrice: p.old_price ? parseFloat(p.old_price) : null,
      badge: badgeRaw ? badgeRaw.charAt(0).toUpperCase() + badgeRaw.slice(1) : null,
      badgeType: badgeRaw,
      image: p.image_url || "",
      rating: parseFloat(p.rating) || 0,
      reviewCount: p.review_count || 0,
      desc: p.short_description_ar || p.short_description || "",
      isFeatured: !!p.is_featured,
    };
  };

  const products = (apiProducts || []).map(normalizeProduct);

  // Client-side filters applied to the current page
  const normalizedTextFilter = textFilter.trim().toLowerCase();
  const filteredProducts = products
    .filter((p) => p.price <= priceValue)
    .filter((p) => {
      if (!normalizedTextFilter) return true;
      return [p.name, p.origin, p.desc, p.badge]
        .filter(Boolean).join(" ").toLowerCase().includes(normalizedTextFilter);
    })
    .sort((a, b) => {
      if (sortOption === "featured") return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      if (sortOption === "lowToHigh") return a.price - b.price;
      if (sortOption === "highToLow") return b.price - a.price;
      if (sortOption === "bestReviewed") return (b.rating - a.rating) || (b.reviewCount - a.reviewCount);
      if (sortOption === "newest") return b.id - a.id;
      return 0;
    });

  const toggleWishlist = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQuickAdd = async (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, 1, null, null);
      trackAddToCart({ id: product.id, name: product.name, price: product.price, qty: 1 });
    } catch {
      // CartContext surfaces the error
    }
    setAddedProduct(product.name);
    setShowAdded(true);
    setTimeout(() => navigate('/cart'), 2000);
  };

  const formatPrice = (price) =>
    `${price.toLocaleString('ar-DZ', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${t("currency")}`;

  // Pagination helpers
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);
    const pages = [1];
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return (
      <div className="pagination">
        <button
          className="page-btn prev-next"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← {t("shop:pagination.prev")}
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} style={{ color: "var(--warm-gray)", fontFamily: "'Cinzel',serif", fontSize: "11px", padding: "0 4px" }}>…</span>
          ) : (
            <button
              key={p}
              className={`page-btn${page === p ? " active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          className="page-btn prev-next"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          {t("shop:pagination.next")} →
        </button>
      </div>
    );
  };

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
      {/* TOP BAR */}
      <div className="topbar">{settings.home_topbar || t("topbar")}</div>

      {/* NAVIGATION */}
      <Nav variant="shop" cartCount={cartCount} activePath={location.pathname} navTagline={settings.home_nav_logo_tagline} />

      {/* PAGE HERO */}
      <div className="page-hero">
        <div className="breadcrumb">
          <a href="/">{t("shop:hero.breadcrumbHome")}</a>
          <span>·</span>
          <span style={{ color: "var(--gold-pale)" }}>{t("shop:hero.breadcrumbShop")}</span>
        </div>
        <h1 className="page-title">
          {t("shop:hero.title.0")} <em>{t("shop:hero.title.1")}</em>
        </h1>
        <p className="page-subtitle">{t("shop:hero.subtitle")}</p>
      </div>

      {/* SHOP LAYOUT */}
      <div id="products" className="shop-layout">
        <button
          className="mobile-filter-toggle" style={{marginTop: "1rem"}}
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
          {mobileSidebarOpen ? t("shop:filters.mobileToggleHide") : t("shop:filters.mobileToggleShow")}
        </button>

        <aside className={`sidebar${mobileSidebarOpen ? " open" : ""}`}>
          {/* Filter: Price */}
          <div className="filter-section">
            <div className="filter-title" onClick={() => toggleFilter("price")}>
              {t("shop:filters.priceRange")}
              <span className="filter-toggle">{filterOpen.price ? "−" : "+"}</span>
            </div>
            {filterOpen.price && (
              <div className="price-range-wrap">
                <div className="price-range-display">
                  <span>{formatPrice(1000)}</span>
                  <span>{formatPrice(priceValue)}</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="60000"
                  value={priceValue}
                  step="500"
                  onChange={(e) => setPriceValue(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* <button className="filter-apply">{t("shop:filters.apply")}</button> */}
        </aside>

        {/* PRODUCT AREA */}
        <main className="product-area">
          {/* Toolbar */}
          <div className="shop-toolbar">
            <p className="result-count">
              {apiProducts === null
                ? t("shop:toolbar.loading")
                : t("shop:toolbar.showing", { count: filteredProducts.length })}
            </p>
            <div className="toolbar-right">
              <select
                className="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}>
                <option value="featured">{t("shop:sort.featured")}</option>
                <option value="lowToHigh">{t("shop:sort.lowToHigh")}</option>
                <option value="highToLow">{t("shop:sort.highToLow")}</option>
                <option value="newest">{t("shop:sort.newest")}</option>
                <option value="bestReviewed">{t("shop:sort.bestReviewed")}</option>
              </select>
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                  title={t("shop:viewToggle.grid")}
                  onClick={() => setViewMode("grid")}>
                  ⊞
                </button>
                <button
                  className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                  title={t("shop:viewToggle.list")}
                  onClick={() => setViewMode("list")}>
                  ☰
                </button>
              </div>
            </div>

            <div className="toolbar-text-filter">
              <label className="toolbar-text-label" htmlFor="shop-text-filter">
                {t("shop:toolbar.searchLabel")}
              </label>
              <input
                id="shop-text-filter"
                className="toolbar-text-input"
                type="text"
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
                placeholder={t("shop:toolbar.searchPlaceholder")}
              />
            </div>
          </div>

          {/* Product Grid / Empty / Loading */}
          {apiProducts === null ? (
            <p className="shop-loading-msg">{t("shop:toolbar.loading")}</p>
          ) : filteredProducts.length === 0 ? (
            <p className="shop-empty-msg">{t("shop:products.empty")}</p>
          ) : (
            <div className={`product-grid ${viewMode === "list" ? "list-view" : ""}`}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode={viewMode}
                  formatPrice={formatPrice}
                  t={t}
                  onAddToCart={handleQuickAdd}
                  wishlistActive={!!wishlist[product.id]}
                  onWishlist={toggleWishlist}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {renderPagination()}
        </main>
      </div>

      {/* ADDED TOAST */}
      <div className={`added-toast ${showAdded ? "show" : ""}`}>
        {t("shop:addedToast", { product: addedProduct })}
      </div>

      <Footer />
    </div>
  );
};

export default ShopPage;
