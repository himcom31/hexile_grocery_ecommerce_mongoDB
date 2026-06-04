const API_URL = "http://localhost:5000";
const getToken = () => localStorage.getItem("userToken");
const headers  = () => ({
  "Content-Type":  "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

// ─── CART ──────────────────────────────────────────────────────
export const fetchCart = async () => {
  const res = await fetch(`${API_URL}/api/cart`, { headers: headers() });
  return res.json();
};

export const addToCart = async (productId, quantity = 1) => {
  const res = await fetch(`${API_URL}/api/cart/add`, {
    method:  "POST",
    headers: headers(),
    body:    JSON.stringify({ productId, quantity }),
  });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
  return data;
};

export const updateCartItem = async (productId, quantity) => {
  const res = await fetch(`${API_URL}/api/cart/update/${productId}`, {
    method:  "PUT",
    headers: headers(),
    body:    JSON.stringify({ quantity }),
  });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
  return data;
};

export const removeFromCart = async (productId) => {
  const res = await fetch(`${API_URL}/api/cart/remove/${productId}`, {
    method:  "DELETE",
    headers: headers(),
  });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
  return data;
};

export const clearCart = async () => {
  await fetch(`${API_URL}/api/cart/clear`, { method: "DELETE", headers: headers() });
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: { items: [] } }));
};

// ─── WISHLIST ──────────────────────────────────────────────────
export const fetchWishlist = async () => {
  const res = await fetch(`${API_URL}/api/wishlist`, { headers: headers() });
  return res.json();
};

export const addToWishlist = async (productId) => {
  const res = await fetch(`${API_URL}/api/wishlist/add`, {
    method:  "POST",
    headers: headers(),
    body:    JSON.stringify({ productId }),
  });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: data }));
  return data;
};

export const removeFromWishlist = async (productId) => {
  const res = await fetch(`${API_URL}/api/wishlist/remove/${productId}`, {
    method:  "DELETE",
    headers: headers(),
  });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: data }));
  return data;
};

export const toggleWishlist = async (productId, isCurrentlyWished) => {
  if (isCurrentlyWished) return removeFromWishlist(productId);
  return addToWishlist(productId);
};