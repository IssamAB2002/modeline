import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Nav from "../components/Nav";
import "../pageStyles/cart.css";
import { useLang } from "../hooks/useLang";
import { useCart, getCookie, ensureCsrf } from "../context/CartContext";
import { useFrontSettings } from "../context/FrontSettingsContext";

const API = import.meta.env.VITE_API_URL;

function renderEmphasis(text) {
  const parts = text.split(/\{\{em\}\}|\{\{\/em\}\}/);
  return parts.map((part, index) => (index % 2 === 1 ? <em key={index}>{part}</em> : part));
}

const CartPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, currentLang } = useLang();
  const lang = currentLang.split('-')[0] === 'ar' ? 'ar' : 'en';
  const { cartItems, cartCount, cartId, updateQty, removeItem, clearCart } = useCart();
  const settings = useFrontSettings();

  const [wilayas, setWilayas] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState(null);

  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: "",
    phone: "",
    city: "",
    addressLine: "",
    notes: "",
  });

  useEffect(() => {
    fetch(`${API}/shop/wilayas/`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setWilayas(Array.isArray(data) ? data : []))
      .catch(() => setWilayas([]));
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [showAdded, setShowAdded] = useState(false);
  const [addedToastText, setAddedToastText] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { navigate('/shop'); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  const subtotalDA = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.unitPriceDA * i.qty, 0),
    [cartItems],
  );

  const shippingDA = useMemo(
    () => (cartItems.length === 0 ? 0 : selectedWilaya ? Number(selectedWilaya.shipping_price_da) : 700),
    [cartItems.length, selectedWilaya],
  );

  const totalDA = useMemo(() => subtotalDA + shippingDA, [subtotalDA, shippingDA]);

  const showToast = (text, duration = 1800) => {
    setAddedToastText(text);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), duration);
  };

  const handlePlaceOrder = async () => {
    const { fullName, phone, city, addressLine, notes } = deliveryAddress;
    if (!fullName.trim() || fullName.trim().length < 2 || !phone.trim() || !selectedWilaya || !addressLine.trim()) {
      showToast(t("cart:summary.validationError"), 3000);
      return;
    }
    if (!cartId || cartItems.length === 0) {
      showToast(t("cart:empty"), 2500);
      return;
    }

    setSubmitting(true);
    try {
      await ensureCsrf();
      const res = await fetch(`${API}/orders/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          cart_id: cartId,
          shipping_da: shippingDA,
          full_name: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address_line: addressLine.trim(),
          notes: notes.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || t("cart:summary.serverError"));
      }
      const order = await res.json();
      clearCart();
      setConfirmedOrder(order);
      setCountdown(6);
    } catch (err) {
      showToast(err.message || t("cart:summary.serverError"), 3500);
    } finally {
      setSubmitting(false);
    }
  };

  function SectionDivider() {
    return (
      <div className="ornament-divider" aria-hidden="true">
        <span className="ornament-sym">*</span>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-topbar">{settings.home_topbar || t("cart:topbar")}</div>

      <Nav variant="cart" cartCount={cartCount} activePath={location.pathname} navTagline={settings.home_nav_logo_tagline} />

      <div className="cart-page-hero">
        <div className="cart-breadcrumb">
          <a href="#">{t("cart:hero.breadcrumbHome")}</a>
          <span>·</span>
          <a href="#">{t("cart:hero.breadcrumbShop")}</a>
          <span>·</span>
          <span style={{ color: "var(--gold-pale)" }}>{t("cart:hero.breadcrumbCart")}</span>
        </div>
        <h1 className="cart-page-title">
          {t("cart:hero.title.0")} <em>{t("cart:hero.title.1")}</em>
        </h1>
        <p className="cart-page-sub">{t("cart:hero.subtitle")}</p>
      </div>

      <SectionDivider />

      <div className="cart-layout">
        {/* Left: cart items + delivery fields */}
        <section className="cart-main">
          <div className="cart-panel">
            <div className="section-header compact">
              <div className="section-eyebrow">{t("cart:sections.items.eyebrow")}</div>
              <h2 className="section-title">
                {renderEmphasis(t("cart:sections.items.title"))}
              </h2>
              <div className="section-rule" />
            </div>

            {cartItems.length === 0 ? (
              <p className="cart-empty">{t("cart:empty")}</p>
            ) : (
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item-row">
                    <div className="cart-item-img-wrap">
                      {item.image ? (
                        <img src={item.image} alt={item.productName} className="cart-item-img" />
                      ) : (
                        <div className="cart-item-img" style={{ background: "#e8dfc8" }} />
                      )}
                      {item.badge ? (
                        <span className="cart-item-badge">{item.badge}</span>
                      ) : null}
                    </div>

                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.productName}</div>
                      <div className="cart-item-meta">
                        {item.productOrigin}
                        <div className="cart-item-variant-line">
                          {item.selectedSize ? t("cart:item.size", { size: item.selectedSize }) : "—"}
                          {" · "}
                          {item.selectedColor ? t("cart:item.color", { color: item.selectedColor }) : "—"}
                        </div>
                        <div className="cart-item-variant-line">{t("cart:item.sku", { sku: item.sku })}</div>
                      </div>
                    </div>

                    <div className="cart-item-controls">
                      <div className="cart-item-qty-controls">
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          disabled={item.qty <= 1}>
                          −
                        </button>
                        <div className="cart-qty-display">{item.qty}</div>
                        <button
                          className="cart-qty-btn"
                          onClick={() => updateQty(item.id, item.qty + 1)}>
                          +
                        </button>
                      </div>
                      <div className="cart-price-cell">
                        {(item.unitPriceDA * item.qty).toLocaleString("fr-DZ")} DA
                      </div>
                      <button
                        className="cart-remove-btn"
                        onClick={() => removeItem(item.id)}>
                        {t("cart:item.remove")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery address */}
          <div className="cart-panel">
            <div className="section-header compact">
              <div className="section-eyebrow">{t("cart:sections.delivery.eyebrow")}</div>
              <h2 className="section-title">
                {renderEmphasis(t("cart:sections.delivery.title"))}
              </h2>
              <div className="section-rule" />
            </div>

            <div className="cart-form-grid">
              <div className="form-row">
                <div className="form-group">
                  <label className="cart-field-label">{t("cart:deliveryForm.fullName")}</label>
                  <input
                    className="cart-input"
                    value={deliveryAddress.fullName}
                    onChange={(e) => setDeliveryAddress((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder={t("cart:deliveryForm.fullNamePlaceholder")}
                  />
                </div>
                <div className="form-group">
                  <label className="cart-field-label">{t("cart:deliveryForm.phone")}</label>
                  <input
                    className="cart-input"
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress((p) => ({ ...p, phone: e.target.value }))}
                    placeholder={t("cart:deliveryForm.phonePlaceholder")}
                  />
                </div>
              </div>

              <div className="form-group full">
                <label className="cart-field-label">{t("cart:deliveryForm.city")}</label>
                <select
                  className="cart-input"
                  value={selectedWilaya?.id || ''}
                  onChange={(e) => {
                    const w = wilayas.find((w) => w.id === parseInt(e.target.value, 10)) || null;
                    setSelectedWilaya(w);
                    setDeliveryAddress((p) => ({ ...p, city: w ? (lang === 'ar' ? w.name_ar : w.name_fr) : '' }));
                  }}
                >
                  <option value="">{lang === 'ar' ? 'اختر الولاية' : 'Select Wilaya'}</option>
                  {wilayas.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} — {lang === 'ar' ? w.name_ar : w.name_fr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full">
                <label className="cart-field-label">{t("cart:deliveryForm.address")}</label>
                <input
                  className="cart-input"
                  value={deliveryAddress.addressLine}
                  onChange={(e) => setDeliveryAddress((p) => ({ ...p, addressLine: e.target.value }))}
                  placeholder={t("cart:deliveryForm.addressPlaceholder")}
                />
              </div>

              <div className="form-group full">
                <label className="cart-field-label">{t("cart:deliveryForm.notes")}</label>
                <textarea
                  className="cart-input"
                  rows={3}
                  value={deliveryAddress.notes}
                  onChange={(e) => setDeliveryAddress((p) => ({ ...p, notes: e.target.value }))}
                  placeholder={t("cart:deliveryForm.notesPlaceholder")}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right: summary / confirmation */}
        <aside className="cart-sidebar">
          <div className="cart-panel sticky">
            {confirmedOrder ? (
              /* ── Order Confirmation ── */
              <div className="cart-summary-body">
                <div className="section-header compact">
                  <div className="section-eyebrow">{t("cart:confirmation.eyebrow")}</div>
                  <h2 className="section-title">
                    {renderEmphasis(t("cart:confirmation.title"))}
                  </h2>
                  <div className="section-rule" />
                </div>
                <p style={{ marginBottom: "0.25rem", color: "var(--warm-gray)", fontSize: "0.95rem" }}>
                  {t("cart:confirmation.subtitle")}
                </p>
                {countdown !== null && countdown > 0 && (
                  <p style={{ fontSize: "0.8rem", color: "var(--warm-gray)", fontStyle: "italic", marginBottom: "0.5rem" }}>
                    {lang === 'ar'
                      ? `ستنتقل إلى المتجر خلال ${countdown} ثوانٍ…`
                      : `Redirecting to shop in ${countdown}s…`}
                  </p>
                )}
                <div className="cart-summary-row" style={{ marginTop: "1.25rem" }}>
                  <span style={{ fontWeight: 600 }}>{t("cart:confirmation.orderNumber")}</span>
                  <span style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.08em", color: "var(--gold)" }}>
                    {confirmedOrder.order_number}
                  </span>
                </div>
                <div className="cart-summary-row">
                  <span>{t("cart:confirmation.clientName")}</span>
                  <span>{confirmedOrder.full_name}</span>
                </div>
                <div className="cart-summary-total">
                  <div className="cart-total-label">{t("cart:summary.total")}</div>
                  <div className="cart-total-value">
                    {parseFloat(confirmedOrder.grand_total_da).toLocaleString("fr-DZ")} DA
                  </div>
                </div>
                <Link to="/shop" className="cart-continue-btn" style={{ marginTop: "1.25rem" }}>
                  {t("cart:confirmation.continue")}
                </Link>
              </div>
            ) : (
              /* ── Order Summary ── */
              <>
                <div className="section-header compact">
                  <div className="section-eyebrow">{t("cart:sections.order.eyebrow")}</div>
                  <h2 className="section-title">
                    {renderEmphasis(t("cart:sections.order.title"))}
                  </h2>
                  <div className="section-rule" />
                </div>

                <div className="cart-summary-body">
                  <div className="cart-summary-row">
                    <span>{t("cart:summary.subtotal")}</span>
                    <span>{subtotalDA.toLocaleString("fr-DZ")} DA</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>{t("cart:summary.shipping")}</span>
                    <span>{shippingDA.toLocaleString("fr-DZ")} DA</span>
                  </div>

                  <div className="cart-summary-total">
                    <div className="cart-total-label">{t("cart:summary.total")}</div>
                    <div className="cart-total-value">
                      {totalDA.toLocaleString("fr-DZ")} DA
                    </div>
                  </div>

                  <button
                    className="cart-faux-checkout-btn"
                    onClick={handlePlaceOrder}
                    disabled={submitting || cartItems.length === 0}>
                    {submitting ? t("cart:summary.submitting") : t("cart:summary.checkout")}
                  </button>

                  <p className="cart-safe-note">{t("cart:summary.safeNote")}</p>

                  <Link to="/shop" className="cart-continue-btn">
                    {t("cart:summary.continue")}
                  </Link>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      <div className={`cart-added-toast${showAdded ? " is-visible" : ""}`}>
        {addedToastText}
      </div>
    </div>
  );
};

export default CartPage;
