import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

function getOrCreateSessionKey() {
  let key = localStorage.getItem("bb_session_key");
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem("bb_session_key", key);
  }
  return key;
}

export function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

export async function ensureCsrf() {
  if (!getCookie("csrftoken")) {
    await fetch(`${API}/csrf/`, { credentials: "include" });
  }
}

const BADGE_AR = {
  sale: 'تخفيض',
  new: 'جديد',
  limited: 'كمية محدودة',
  bestseller: 'الأكثر مبيعاً',
};

function normalizeItem(raw) {
  const badgeRaw = raw.product_badge && raw.product_badge !== 'none' ? raw.product_badge : null;
  return {
    id: raw.id,
    productId: raw.product,
    productName: raw.product_name_snapshot_en,
    unitPriceDA: parseFloat(raw.unit_price_da_snapshot),
    qty: raw.quantity,
    selectedSize: raw.selected_size || null,
    selectedColor: raw.selected_color || null,
    sku: raw.sku_snapshot,
    image: raw.product_image_url || "",
    productOrigin: raw.product_origin || "",
    lineTotal: parseFloat(raw.line_total),
    badge: badgeRaw ? (BADGE_AR[badgeRaw.toLowerCase()] ?? badgeRaw) : null,
  };
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartId, setCartId] = useState(() => {
    const stored = localStorage.getItem("bb_cart_id");
    return stored ? parseInt(stored, 10) : null;
  });
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Grab the CSRF cookie once, as early as possible
  useEffect(() => {
    ensureCsrf();
  }, []);

  // Load existing cart on mount
  useEffect(() => {
    if (!cartId) return;
    setLoading(true);
    fetch(`${API}/cart/${cartId}/`, { credentials: "include" })
      .then((r) => {
        if (r.status === 404) {
          localStorage.removeItem("bb_cart_id");
          setCartId(null);
          setCartItems([]);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setCartItems((data.items || []).map(normalizeItem));
      })
      .catch(() => {
        setCartItems([]);
      })
      .finally(() => setLoading(false));
  }, [cartId]);

  const ensureCart = useCallback(async () => {
    if (cartId) return cartId;
    await ensureCsrf();
    const sessionKey = getOrCreateSessionKey();
    const res = await fetch(`${API}/cart/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ session_key: sessionKey }),
    });
    const data = await res.json();
    localStorage.setItem("bb_cart_id", String(data.id));
    setCartId(data.id);
    return data.id;
  }, [cartId]);

  const addToCart = useCallback(async (productId, qty = 1, size = null, color = null) => {
    setError(null);
    try {
      const id = await ensureCart();
      await ensureCsrf();
      const res = await fetch(`${API}/cart/${id}/items/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: qty,
          selected_size: size || "",
          selected_color: color || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      const raw = await res.json();
      const item = normalizeItem(raw);
      setCartItems((prev) => {
        const idx = prev.findIndex((i) => i.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = item;
          return next;
        }
        return [...prev, item];
      });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [ensureCart]);

  const updateQty = useCallback(async (itemId, newQty) => {
    if (newQty < 1) return;
    setError(null);
    setCartItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, qty: newQty } : i))
    );
    try {
      await ensureCsrf();
      const res = await fetch(`${API}/cart/items/${itemId}/`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      const raw = await res.json();
      const item = normalizeItem(raw);
      setCartItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const removeItem = useCallback(async (itemId) => {
    setError(null);
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await ensureCsrf();
      await fetch(`${API}/cart/items/${itemId}/delete/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem("bb_cart_id");
    setCartId(null);
    setCartItems([]);
  }, []);

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ cartId, cartItems, cartCount, loading, error, addToCart, updateQty, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
