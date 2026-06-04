import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ChangePasswordTab from "../Pages/Changepasswordtab";
import UserSupportTicket from "../Pages/Usersupportticket";
import UserProfile from "../Pages/Userprofile";
import OrderHistoryTab from "./Orderhistorytab";

// ─── API utils ─────────────────────────────────────────────────────────────
const API_URL = "http://localhost:5000";
const getToken = () => localStorage.getItem("userToken");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const fetchCart = async () => (await fetch(`${API_URL}/api/cart`, { headers: authHeaders() })).json();
const fetchWishlist = async () => (await fetch(`${API_URL}/api/wishlist`, { headers: authHeaders() })).json();
const fetchOrders = async () => (await fetch(`${API_URL}/api/orders/my`, { headers: authHeaders() })).json();
const fetchProfile = async () => (await fetch(`${API_URL}/api/user/me`, { headers: authHeaders() })).json();
const fetchRecentlyViewed = async () =>
  (await fetch(`${API_URL}/api/user/recently-viewed`, { headers: authHeaders() })).json().catch(() => ({ products: [] }));

const fetchAddresses = async () => (await fetch(`${API_URL}/api/address`, { headers: authHeaders() })).json();
const apiAddAddress = async (data) => (await fetch(`${API_URL}/api/address`, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) })).json();
const apiUpdateAddress = async (id, data) => (await fetch(`${API_URL}/api/address/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) })).json();
const apiDeleteAddress = async (id) => (await fetch(`${API_URL}/api/address/${id}`, { method: "DELETE", headers: authHeaders() })).json();
const apiSetDefaultAddress = async (id) => (await fetch(`${API_URL}/api/address/${id}/set-default`, { method: "PATCH", headers: authHeaders() })).json();

const apiUpdateCartItem = async (productId, quantity) => {
  const res = await fetch(`${API_URL}/api/cart/update/${productId}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ quantity }) });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
  return data;
};
const apiRemoveFromCart = async (productId) => {
  const res = await fetch(`${API_URL}/api/cart/remove/${productId}`, { method: "DELETE", headers: authHeaders() });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
  return data;
};
const apiAddToCart = async (productId, quantity = 1) => {
  const res = await fetch(`${API_URL}/api/cart/add`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ productId, quantity }) });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: data }));
  return data;
};
const apiRemoveFromWishlist = async (productId) => {
  const res = await fetch(`${API_URL}/api/wishlist/remove/${productId}`, { method: "DELETE", headers: authHeaders() });
  const data = await res.json();
  window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: data }));
  return data;
};

// ─── SVG Icons ──────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = "currentColor", fill = "none", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const DashIcon    = () => <Icon d={["M3 3h7v7H3z","M14 3h7v7h-7z","M14 14h7v7h-7z","M3 14h7v7H3z"]} />;
const OrderIcon   = () => <Icon d={["M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2","M9 5a2 2 0 002 2h2a2 2 0 002-2","M9 12h6","M9 16h4"]} />;
const HeartIcon   = () => <Icon d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />;
const MsgIcon     = () => <Icon d={["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"]} />;
const UserIcon    = () => <Icon d={["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2","M12 11a4 4 0 100-8 4 4 0 000 8z"]} />;
const PinIcon     = () => <Icon d={["M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z","M12 13a3 3 0 100-6 3 3 0 000 6z"]} />;
const SupportIcon = () => <Icon d={["M3 18v-6a9 9 0 0118 0v6","M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3z","M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"]} />;
const LockIcon    = () => <Icon d={["M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z","M7 11V7a5 5 0 0110 0v4"]} />;
const LogoutIcon  = () => <Icon d={["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4","M16 17l5-5-5-5","M21 12H9"]} />;
const CartBagIcon = () => <Icon d={["M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z","M3 6h18","M16 10a4 4 0 01-8 0"]} size={18} />;
const BoxIcon     = () => <Icon d={["M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z","M3.27 6.96L12 12.01l8.73-5.05","M12 22.08V12"]} size={18} />;
const VoucherIcon = () => <Icon d={["M20 12v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2","M20 12V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6","M12 12v8","M8 8h.01","M16 8h.01"]} size={16} />;
const ChevRight   = () => <Icon d="M9 18l6-6-6-6" size={14} />;
const ArrowRight  = () => <Icon d="M5 12h14M12 5l7 7-7 7" size={15} />;
const EditIcon    = () => <Icon d={["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7","M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"]} size={14} />;
const TrashIcon2  = () => <Icon d={["M3 6h18","M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6","M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"]} size={14} />;
const HomeAddr    = () => <Icon d={["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z","M9 22V12h6v10"]} size={20} />;
const WorkAddr    = () => <Icon d={["M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"]} size={20} />;
const OtherAddr   = () => <Icon d={["M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z","M12 13a3 3 0 100-6 3 3 0 000 6z"]} size={20} />;
const MenuIcon    = () => <Icon d={["M3 12h18","M3 6h18","M3 18h18"]} size={22} />;
const CloseIcon   = () => <Icon d={["M18 6L6 18","M6 6l12 12"]} size={22} />;

const SpinnerIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}>
    <path d="M12 2a10 10 0 0110 10" />
  </svg>
);
const StarFill = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const LocateIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    <circle cx="12" cy="12" r="8" strokeDasharray="2 2" />
  </svg>
);

// ─── useIsMobile hook ────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

// ─── Sidebar Nav Item ────────────────────────────────────────────────────────
const NavItem = ({ icon, label, active, onClick, badge, collapsed }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%", display: "flex", alignItems: "center",
      gap: collapsed ? 0 : 12,
      padding: collapsed ? "11px 0" : "11px 16px",
      justifyContent: collapsed ? "center" : "flex-start",
      border: "none", borderRadius: 10, cursor: "pointer",
      background: active ? "#f0fdf4" : "transparent",
      color: active ? "#16a34a" : "#4b5563",
      fontWeight: active ? 600 : 400, fontSize: 14,
      fontFamily: "inherit", transition: "all 0.15s", textAlign: "left",
      position: "relative",
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f9fafb"; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
  >
    <span style={{ color: active ? "#16a34a" : "#9ca3af", flexShrink: 0 }}>{icon}</span>
    {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
    {badge > 0 && !collapsed && (
      <span style={{ background: "#16a34a", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
        {badge}
      </span>
    )}
    {badge > 0 && collapsed && (
      <span style={{ position: "absolute", top: 6, right: 8, background: "#16a34a", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 99, padding: "1px 5px", minWidth: 16, textAlign: "center" }}>
        {badge}
      </span>
    )}
  </button>
);

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ value, label, icon, color }) => (
  <div style={{
    flex: 1, border: `1.5px solid ${color}20`, borderRadius: 10,
    padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#fff", minWidth: 0,
  }}>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#111", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, lineHeight: 1.3 }}>{label}</div>
    </div>
    <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ color }}>{icon}</span>
    </div>
  </div>
);

// ─── Cart Item Row ───────────────────────────────────────────────────────────
const CartItemRow = ({ item, onQtyChange, onRemove }) => {
  const product  = item.product || item;
  const price    = product.price || product.buyingPrice || 0;
  const oldPrice = product.oldPrice || product.sellingPrice;
  const name     = product.name || "Product";
  const image    = product.image || product.thumbnail || product.images?.[0];
  const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : null;
  const qty      = item.quantity || 1;
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3f4f6", alignItems: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: "#f9fafb", flexShrink: 0 }}>
        {image
          ? <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🛒</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#111", lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>${price.toFixed(2)}</span>
          {oldPrice && <span style={{ fontSize: 10, color: "#d1d5db", textDecoration: "line-through" }}>${oldPrice.toFixed(2)}</span>}
          {discount && <span style={{ fontSize: 9, fontWeight: 800, background: "#16a34a", color: "#fff", borderRadius: 3, padding: "1px 4px" }}>{discount}% OFF</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
        <button onClick={() => qty > 1 ? onQtyChange(product._id, qty - 1) : onRemove(product._id)}
          style={{ width: 26, height: 26, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#374151" }}>−</button>
        <span style={{ width: 28, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#111" }}>{qty}</span>
        <button onClick={() => onQtyChange(product._id, qty + 1)}
          style={{ width: 26, height: 26, border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#374151" }}>+</button>
      </div>
    </div>
  );
};

// ─── Recently Viewed Card ────────────────────────────────────────────────────
const RecentCard = ({ product }) => {
  const price    = product.price || product.buyingPrice || 0;
  const oldPrice = product.oldPrice || product.sellingPrice;
  const name     = product.name || "Product";
  const image    = product.image || product.thumbnail || product.images?.[0];
  const rating   = product.rating || 0;
  const reviews  = product.reviews || product.reviewCount || 0;
  const sold     = product.sold || product.soldCount || 0;
  const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : null;
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3f4f6", alignItems: "center" }}>
      <div style={{ width: 50, height: 50, borderRadius: 8, overflow: "hidden", background: "#f9fafb", flexShrink: 0 }}>
        {image
          ? <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#111", lineHeight: 1.3, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>${price.toFixed(2)}</span>
          {oldPrice && <span style={{ fontSize: 10, color: "#d1d5db", textDecoration: "line-through" }}>${oldPrice.toFixed(2)}</span>}
          {discount && <span style={{ fontSize: 9, fontWeight: 800, background: "#ef4444", color: "#fff", borderRadius: 3, padding: "1px 4px" }}>{discount}% OFF</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
          <StarFill size={11} />
          <span style={{ fontSize: 10, color: "#6b7280" }}>{rating.toFixed(1)} ({reviews})</span>
          <span style={{ fontSize: 10, color: "#d1d5db" }}>|</span>
          <span style={{ fontSize: 10, color: "#6b7280" }}>{sold} Sold</span>
        </div>
      </div>
    </div>
  );
};

// ─── Wishlist Product Card ───────────────────────────────────────────────────
const WishlistCard = ({ product, onRemove, onAddToCart, removing, addingToCart }) => {
  const image        = product.thumbnail || product.additionalImages?.[0] || product.image || product.images?.[0];
  const price        = product.buyingPrice ?? product.price ?? 0;
  const sellingPrice = product.sellingPrice ?? product.oldPrice ?? null;
  const hasDiscount  = sellingPrice && sellingPrice > price;
  const discountPct  = hasDiscount ? Math.round((1 - price / sellingPrice) * 100) : 0;
  const catName      = typeof product.category === "object" ? product.category?.name : product.category || "";
  const unit         = product.unit || "";
  const rating       = product.averageRating ?? product.rating ?? 0;
  const reviewCount  = product.reviewCount ?? product.reviews ?? 0;
  const soldCount    = product.soldCount ?? product.sold ?? null;
  const stock        = product.stock ?? product.quantity ?? null;
  return (
    <div
      style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #e8f5e9", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", position: "relative", transition: "box-shadow 0.2s, transform 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(22,163,74,0.13)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {hasDiscount && (
        <div style={{ position: "absolute", top: 8, left: 8, zIndex: 2, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 5 }}>{discountPct}% OFF</div>
      )}
      <button onClick={() => onRemove(product._id)} disabled={removing} title="Remove from wishlist"
        style={{ position: "absolute", top: 8, right: 8, zIndex: 2, width: 30, height: 30, borderRadius: "50%", background: "#fff", border: "1.5px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", cursor: removing ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        {removing ? <SpinnerIcon size={12} /> : <svg width="13" height="13" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>}
      </button>
      <div style={{ width: "100%", aspectRatio: "1/1", maxHeight: 160, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {image ? <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ fontSize: 36 }}>📦</div>}
      </div>
      <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {catName && <span style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.4px" }}>{catName}</span>}
        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.35, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.name}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "#6b7280" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <StarFill size={11} /><span style={{ fontWeight: 600, color: "#374151" }}>{rating.toFixed(1)}</span><span>({reviewCount})</span>
          </div>
          {soldCount !== null && <span>Sold: <strong>{soldCount}</strong>{stock ? `/${stock}` : ""}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>${price.toFixed(2)}</span>
            {hasDiscount && <span style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>${sellingPrice.toFixed(2)}</span>}
          </div>
          {unit && <span style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "2px 6px", borderRadius: 5 }}>{unit}</span>}
        </div>
        <button onClick={() => onAddToCart(product._id)} disabled={addingToCart}
          style={{ marginTop: 6, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", border: "1.5px solid #16a34a", borderRadius: 9, background: addingToCart ? "#dcfce7" : "#fff", color: "#16a34a", fontSize: 12, fontWeight: 700, cursor: addingToCart ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.15s, color 0.15s" }}
          onMouseEnter={e => { if (!addingToCart) { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.color = "#fff"; } }}
          onMouseLeave={e => { if (!addingToCart) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#16a34a"; } }}>
          {addingToCart ? <><SpinnerIcon size={13} /> Adding…</> : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg> Add To Cart</>}
        </button>
      </div>
    </div>
  );
};

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", bottom: 80, right: 16, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, background: type === "success" ? "#166534" : "#991b1b", color: "#fff", padding: "12px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.18)", animation: "fadeIn 0.25s ease", maxWidth: "calc(100vw - 32px)" }}>
      {message}
    </div>
  );
};

// ─── Wishlist Skeleton ───────────────────────────────────────────────────────
const WishlistSkeleton = () => (
  <div className="wishlist-grid">
    {[1,2,3,4].map(i => (
      <div key={i} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #e8f5e9" }}>
        <div style={{ width: "100%", aspectRatio: "1/1", background: "#f3f4f6", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ height: 9, width: "55%", background: "#f3f4f6", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
          <div style={{ height: 13, background: "#f3f4f6", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
          <div style={{ height: 9, width: "40%", background: "#f3f4f6", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
          <div style={{ height: 36, background: "#f3f4f6", borderRadius: 9, marginTop: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
        </div>
      </div>
    ))}
  </div>
);

// ─── Group cart items by store ───────────────────────────────────────────────
const groupByStore = (items) => {
  const groups = {};
  items.forEach(item => {
    const product = item.product || item;
    const store   = product.store?.name || product.seller?.name || product.storeName || "Store";
    const storeId = product.store?._id  || product.seller?._id  || store;
    if (!groups[storeId]) groups[storeId] = { name: store, rating: product.store?.rating || 5, items: [] };
    groups[storeId].items.push(item);
  });
  return Object.values(groups);
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── ADDRESS FORM MODAL ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
const EMPTY_FORM = { name: "", phone: "", altPhone: "", pincode: "", state: "", city: "", house: "", road: "", landmark: "", type: "Home", isDefault: false };

const AddressFormModal = ({ initial, onSave, onClose, saving }) => {
  const [form,     setForm]     = useState(initial || EMPTY_FORM);
  const [errors,   setErrors]   = useState({});
  const [locating, setLocating] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Full name is required";
    if (!form.phone.trim())   e.phone   = "Phone number is required";
    if (!form.pincode.trim()) e.pincode = "Pincode is required";
    if (!form.state.trim())   e.state   = "State is required";
    if (!form.city.trim())    e.city    = "City is required";
    if (!form.house.trim())   e.house   = "House/Building is required";
    if (!form.road.trim())    e.road    = "Road/Area is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (validate()) onSave(form); };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await resp.json();
        const addr = data.address || {};
        setForm(f => ({
          ...f,
          pincode: addr.postcode || f.pincode,
          state:   addr.state    || f.state,
          city:    addr.city || addr.town || addr.village || f.city,
          road:    addr.road || addr.suburb || f.road,
        }));
      } catch {} finally { setLocating(false); }
    }, () => setLocating(false));
  };

  const inputStyle = (hasErr) => ({
    width: "100%", padding: "10px 12px", border: `1.5px solid ${hasErr ? "#ef4444" : "#e5e7eb"}`,
    borderRadius: 10, fontSize: 13, color: "#111", background: "#fff", fontFamily: "inherit",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  });
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" };
  const errStyle   = { fontSize: 11, color: "#ef4444", marginTop: 3 };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 600, maxHeight: "95vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", animation: "slideUp 0.25s ease" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "20px 20px 0 0" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111" }}>
            {initial ? "Edit Address" : "Add New Address"}
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#374151" }}>×</button>
        </div>

        {/* Form body */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Full Name */}
          <div>
            <label style={labelStyle}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={inputStyle(errors.name)} placeholder="Full Name (Required)*" value={form.name} onChange={e => set("name", e.target.value)}
              onFocus={e => e.target.style.borderColor = "#16a34a"} onBlur={e => e.target.style.borderColor = errors.name ? "#ef4444" : "#e5e7eb"} />
            {errors.name && <div style={errStyle}>{errors.name}</div>}
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone Number <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={inputStyle(errors.phone)} placeholder="Phone number (Required)*" value={form.phone} onChange={e => set("phone", e.target.value)}
              onFocus={e => e.target.style.borderColor = "#16a34a"} onBlur={e => e.target.style.borderColor = errors.phone ? "#ef4444" : "#e5e7eb"} />
            {errors.phone && <div style={errStyle}>{errors.phone}</div>}
          </div>

          {/* Alt Phone */}
          <div>
            <button onClick={() => set("_showAlt", !form._showAlt)} style={{ background: "none", border: "none", color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
              + {form._showAlt ? "Hide" : "Add"} Alternate Phone Number
            </button>
            {form._showAlt && (
              <input style={{ ...inputStyle(false), marginTop: 8 }} placeholder="Alternate Phone Number" value={form.altPhone} onChange={e => set("altPhone", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#16a34a"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            )}
          </div>

          {/* Pincode + Location */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Pincode <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={inputStyle(errors.pincode)} placeholder="Pincode*" value={form.pincode} onChange={e => set("pincode", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#16a34a"} onBlur={e => e.target.style.borderColor = errors.pincode ? "#ef4444" : "#e5e7eb"} />
              {errors.pincode && <div style={errStyle}>{errors.pincode}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={useMyLocation} disabled={locating}
                style={{ width: "100%", padding: "10px 8px", background: locating ? "#1d4ed8" : "#2563eb", color: "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: locating ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {locating ? <><SpinnerIcon size={13} /> Locating…</> : <><LocateIcon /> Use location</>}
              </button>
            </div>
          </div>

          {/* State + City */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>State <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={inputStyle(errors.state)} placeholder="State*" value={form.state} onChange={e => set("state", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#16a34a"} onBlur={e => e.target.style.borderColor = errors.state ? "#ef4444" : "#e5e7eb"} />
              {errors.state && <div style={errStyle}>{errors.state}</div>}
            </div>
            <div>
              <label style={labelStyle}>City <span style={{ color: "#ef4444" }}>*</span></label>
              <input style={inputStyle(errors.city)} placeholder="City*" value={form.city} onChange={e => set("city", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#16a34a"} onBlur={e => e.target.style.borderColor = errors.city ? "#ef4444" : "#e5e7eb"} />
              {errors.city && <div style={errStyle}>{errors.city}</div>}
            </div>
          </div>

          {/* House */}
          <div>
            <label style={labelStyle}>House No., Building Name <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={inputStyle(errors.house)} placeholder="House No., Building Name*" value={form.house} onChange={e => set("house", e.target.value)}
              onFocus={e => e.target.style.borderColor = "#16a34a"} onBlur={e => e.target.style.borderColor = errors.house ? "#ef4444" : "#e5e7eb"} />
            {errors.house && <div style={errStyle}>{errors.house}</div>}
          </div>

          {/* Road */}
          <div>
            <label style={labelStyle}>Road Name, Area, Colony <span style={{ color: "#ef4444" }}>*</span></label>
            <input style={inputStyle(errors.road)} placeholder="Road name, Area, Colony*" value={form.road} onChange={e => set("road", e.target.value)}
              onFocus={e => e.target.style.borderColor = "#16a34a"} onBlur={e => e.target.style.borderColor = errors.road ? "#ef4444" : "#e5e7eb"} />
            {errors.road && <div style={errStyle}>{errors.road}</div>}
          </div>

          {/* Landmark */}
          <div>
            <button onClick={() => set("_showLandmark", !form._showLandmark)} style={{ background: "none", border: "none", color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
              + {form._showLandmark ? "Hide" : "Add"} Landmark
            </button>
            {form._showLandmark && (
              <input style={{ ...inputStyle(false), marginTop: 8 }} placeholder="Landmark (optional)" value={form.landmark} onChange={e => set("landmark", e.target.value)}
                onFocus={e => e.target.style.borderColor = "#16a34a"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            )}
          </div>

          {/* Address Type */}
          <div>
            <label style={labelStyle}>Type of address</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Home","Work","Other"].map(t => (
                <button key={t} onClick={() => set("type", t)}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 6px", border: `2px solid ${form.type === t ? "#16a34a" : "#e5e7eb"}`, borderRadius: 10, background: form.type === t ? "#f0fdf4" : "#fff", color: form.type === t ? "#16a34a" : "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ color: form.type === t ? "#16a34a" : "#9ca3af" }}>
                    {t === "Home" ? <HomeAddr /> : t === "Work" ? <WorkAddr /> : <OtherAddr />}
                  </span>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Set as Default */}
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isDefault} onChange={e => set("isDefault", e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#16a34a", cursor: "pointer" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Set as default address</span>
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px 20px", borderTop: "1px solid #f0f0f0", position: "sticky", bottom: 0, background: "#fff" }}>
          <button onClick={handleSubmit} disabled={saving}
            style={{ width: "100%", padding: "13px 0", background: saving ? "#15803d" : "#ea580c", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {saving ? <><SpinnerIcon size={16} /> Saving…</> : "Save Address"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Address Card ─────────────────────────────────────────────────────────────
const AddressCard = ({ addr, onEdit, onDelete, onSetDefault, deletingId, settingDefaultId }) => {
  const typeIcon     = addr.type === "Home" ? <HomeAddr /> : addr.type === "Work" ? <WorkAddr /> : <OtherAddr />;
  const isDeleting   = deletingId === addr._id;
  const isSettingDef = settingDefaultId === addr._id;
  const fullAddress  = [addr.house, addr.road, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
  return (
    <div style={{ background: "#fff", border: `2px solid ${addr.isDefault ? "#16a34a" : "#f0f0f0"}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12, position: "relative", boxShadow: addr.isDefault ? "0 4px 16px rgba(22,163,74,0.1)" : "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: addr.isDefault ? "#f0fdf4" : "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: addr.isDefault ? "#16a34a" : "#9ca3af", border: `1.5px solid ${addr.isDefault ? "#bbf7d0" : "#f0f0f0"}` }}>
        {typeIcon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{addr.name}</span>
          <span style={{ fontSize: 10, fontWeight: 700, background: addr.isDefault ? "#16a34a" : "#1f2937", color: "#fff", padding: "2px 8px", borderRadius: 5 }}>
            {addr.type?.toUpperCase() || "HOME"}
          </span>
          {addr.isDefault && <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>Default</span>}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{addr.phone}{addr.altPhone ? `, ${addr.altPhone}` : ""}</div>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{fullAddress}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button onClick={() => onEdit(addr)}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", border: "1.5px solid #16a34a", borderRadius: 7, background: "#fff", color: "#16a34a", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#16a34a"; }}>
            <EditIcon /> Edit
          </button>
          <button onClick={() => onDelete(addr._id)} disabled={isDeleting}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", border: "1.5px solid #fca5a5", borderRadius: 7, background: "#fff", color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: isDeleting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => { if (!isDeleting) { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#ef4444"; } }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fca5a5"; }}>
            {isDeleting ? <SpinnerIcon size={11} /> : <TrashIcon2 />} {isDeleting ? "Removing…" : "Remove"}
          </button>
          {!addr.isDefault && (
            <button onClick={() => onSetDefault(addr._id)} disabled={isSettingDef}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", border: "1.5px solid #e5e7eb", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: isSettingDef ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { if (!isSettingDef) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}>
              {isSettingDef ? <SpinnerIcon size={11} /> : null} {isSettingDef ? "Setting…" : "Set Default"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Mobile Bottom Nav Bar ───────────────────────────────────────────────────
const BottomNav = ({ activeTab, setActiveTab, wishCount, cartCount, onMenuOpen }) => {
  const mainItems = [
    { id: "dashboard", label: "Home",     icon: <DashIcon /> },
    { id: "orders",    label: "Orders",   icon: <OrderIcon /> },
    { id: "wishlist",  label: "Wishlist", icon: <HeartIcon />, badge: wishCount },
    { id: "profile",   label: "Profile",  icon: <UserIcon /> },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500,
      background: "#fff", borderTop: "1.5px solid #e5e7eb",
      display: "flex", alignItems: "stretch",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {mainItems.map(item => (
        <button key={item.id} onClick={() => setActiveTab(item.id)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3, padding: "10px 4px 8px", border: "none", background: "transparent",
            color: activeTab === item.id ? "#16a34a" : "#9ca3af",
            fontFamily: "inherit", cursor: "pointer", position: "relative", fontSize: 10, fontWeight: 600,
          }}>
          <span style={{ color: activeTab === item.id ? "#16a34a" : "#9ca3af" }}>{item.icon}</span>
          {item.label}
          {item.badge > 0 && (
            <span style={{ position: "absolute", top: 6, right: "calc(50% - 14px)", background: "#ef4444", color: "#fff", fontSize: 8, fontWeight: 800, borderRadius: 99, padding: "1px 4px", minWidth: 14, textAlign: "center" }}>
              {item.badge}
            </span>
          )}
          {activeTab === item.id && (
            <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 2.5, background: "#16a34a", borderRadius: "0 0 3px 3px" }} />
          )}
        </button>
      ))}
      {/* More button */}
      <button onClick={onMenuOpen}
        style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 3, padding: "10px 4px 8px", border: "none", background: "transparent",
          color: ["address","support","password"].includes(activeTab) ? "#16a34a" : "#9ca3af",
          fontFamily: "inherit", cursor: "pointer", fontSize: 10, fontWeight: 600,
        }}>
        <MenuIcon />
        More
      </button>
    </nav>
  );
};

// ─── Mobile Drawer Menu ──────────────────────────────────────────────────────
const MobileDrawer = ({ open, onClose, activeTab, setActiveTab, profile, onLogout }) => {
  const extraItems = [
    { id: "address",  label: "Manage Address",  icon: <PinIcon /> },
    { id: "support",  label: "Support Ticket",  icon: <SupportIcon /> },
    { id: "password", label: "Change Password", icon: <LockIcon /> },
  ];
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.4)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 700,
        background: "#fff", borderRadius: "20px 20px 0 0", padding: "0 0 env(safe-area-inset-bottom, 16px)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)", animation: "slideUp 0.22s ease",
      }}>
        <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "12px auto 16px" }} />
        {/* Profile mini */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px 16px", borderBottom: "1px solid #f0f0f0", marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f3f4f6", overflow: "hidden", border: "2px solid #e5e7eb", flexShrink: 0 }}>
            {profile?.avatar ? <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👤</div>}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{profile?.name || profile?.fullName || "Demo Customer"}</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>{profile?.phone || profile?.phoneNumber || ""}</div>
          </div>
        </div>
        {extraItems.map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); onClose(); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14,
              padding: "13px 20px", border: "none", background: activeTab === item.id ? "#f0fdf4" : "transparent",
              color: activeTab === item.id ? "#16a34a" : "#374151", fontWeight: activeTab === item.id ? 700 : 500,
              fontSize: 14, fontFamily: "inherit", cursor: "pointer",
            }}>
            <span style={{ color: activeTab === item.id ? "#16a34a" : "#9ca3af" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button onClick={onLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", border: "none", background: "transparent", color: "#ef4444", fontSize: 14, fontFamily: "inherit", cursor: "pointer", borderTop: "1px solid #f0f0f0", marginTop: 4 }}>
          <LogoutIcon /> Logout
        </button>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── MAIN DASHBOARD COMPONENT ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function UserDashboard() {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();

  const [activeTab,         setActiveTab]         = useState("dashboard");
  const [profile,           setProfile]           = useState(null);
  const [cartData,          setCartData]           = useState({ items: [] });
  const [wishlistData,      setWishlistData]       = useState({ products: [] });
  const [ordersData,        setOrdersData]         = useState([]);
  const [recentViewed,      setRecentViewed]       = useState([]);
  const [loading,           setLoading]            = useState(true);
  const [cartTotal,         setCartTotal]          = useState(0);
  const [removingId,        setRemovingId]         = useState(null);
  const [addingId,          setAddingId]           = useState(null);
  const [toast,             setToast]             = useState(null);
  const [addresses,         setAddresses]          = useState([]);
  const [addrLoading,       setAddrLoading]        = useState(false);
  const [showAddrModal,     setShowAddrModal]      = useState(false);
  const [editingAddr,       setEditingAddr]        = useState(null);
  const [savingAddr,        setSavingAddr]         = useState(false);
  const [deletingAddrId,    setDeletingAddrId]     = useState(null);
  const [settingDefaultId,  setSettingDefaultId]   = useState(null);
  const [mobileDrawerOpen,  setMobileDrawerOpen]   = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cart, wishlist, orders, prof, addrs] = await Promise.allSettled([
        fetchCart(), fetchWishlist(), fetchOrders(), fetchProfile(), fetchAddresses(),
      ]);
      if (cart.status     === "fulfilled") setCartData(cart.value);
      if (wishlist.status === "fulfilled") setWishlistData(wishlist.value);
      if (orders.status   === "fulfilled") setOrdersData(Array.isArray(orders.value) ? orders.value : orders.value?.orders || []);
      if (prof.status     === "fulfilled") setProfile(prof.value?.user || prof.value);
      if (addrs.status    === "fulfilled") setAddresses(addrs.value?.addresses || []);
      try { const rv = await fetchRecentlyViewed(); setRecentViewed(rv?.products || []); } catch {}
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (activeTab === "address") {
      setAddrLoading(true);
      fetchAddresses()
        .then(data => setAddresses(data?.addresses || []))
        .catch(() => {})
        .finally(() => setAddrLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    const items = cartData?.items || [];
    setCartTotal(items.reduce((sum, item) => {
      const p = item.product || item;
      return sum + (p.price || p.buyingPrice || 0) * (item.quantity || 1);
    }, 0));
  }, [cartData]);

  useEffect(() => {
    const handler = (e) => setCartData(e.detail || { items: [] });
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const updated = e.detail?.products || e.detail?.data;
      if (Array.isArray(updated)) setWishlistData(prev => ({ ...prev, products: updated }));
    };
    window.addEventListener("wishlist-updated", handler);
    return () => window.removeEventListener("wishlist-updated", handler);
  }, []);

  const handleQtyChange  = async (productId, qty) => setCartData(await apiUpdateCartItem(productId, qty));
  const handleRemoveCart = async (productId) => setCartData(await apiRemoveFromCart(productId));

  const handleRemoveFromWishlist = async (productId) => {
    setRemovingId(productId);
    try {
      await apiRemoveFromWishlist(productId);
      setWishlistData(prev => ({ ...prev, products: (prev.products || []).filter(p => p._id !== productId) }));
      setToast({ message: "Removed from wishlist", type: "remove" });
    } catch {
      setToast({ message: "Failed to remove item", type: "remove" });
    } finally { setRemovingId(null); }
  };

  const handleAddToCart = async (productId) => {
    setAddingId(productId);
    try {
      await apiAddToCart(productId, 1);
      setToast({ message: "Added to cart!", type: "success" });
    } catch {
      setToast({ message: "Failed to add to cart", type: "remove" });
    } finally { setAddingId(null); }
  };

  const handleSaveAddress = async (formData) => {
    setSavingAddr(true);
    try {
      let res;
      if (editingAddr?._id) {
        res = await apiUpdateAddress(editingAddr._id, formData);
      } else {
        res = await apiAddAddress(formData);
      }
      if (res?.success) {
        setAddresses(res.addresses || []);
        setShowAddrModal(false);
        setEditingAddr(null);
        setToast({ message: editingAddr?._id ? "Address updated!" : "Address saved!", type: "success" });
      } else {
        setToast({ message: res?.message || "Failed to save address", type: "remove" });
      }
    } catch {
      setToast({ message: "An error occurred", type: "remove" });
    } finally { setSavingAddr(false); }
  };

  const handleDeleteAddress = async (id) => {
    setDeletingAddrId(id);
    try {
      const res = await apiDeleteAddress(id);
      if (res?.success) {
        setAddresses(res.addresses || []);
        setToast({ message: "Address removed", type: "remove" });
      }
    } catch {
      setToast({ message: "Failed to remove address", type: "remove" });
    } finally { setDeletingAddrId(null); }
  };

  const handleSetDefault = async (id) => {
    setSettingDefaultId(id);
    try {
      const res = await apiSetDefaultAddress(id);
      if (res?.success) {
        setAddresses(res.addresses || []);
        setToast({ message: "Default address updated!", type: "success" });
      }
    } catch {
      setToast({ message: "Failed to update default", type: "remove" });
    } finally { setSettingDefaultId(null); }
  };

  const handleEditAddress = (addr) => {
    setEditingAddr(addr);
    setShowAddrModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/user/home");
  };

  const cartItems    = cartData?.items || [];
  const cartCount    = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);
  const wishProducts = wishlistData?.products || [];
  const wishCount    = wishProducts.length;
  const orderCount   = ordersData.length;
  const ongoingCount = ordersData.filter(o => ["pending","processing","shipped"].includes(o.status?.toLowerCase())).length;
  const storeGroups  = groupByStore(cartItems);
  const defaultAddr  = addresses.find(a => a.isDefault) || addresses[0] || null;

  const navItems = [
    { id: "dashboard", label: "Dashboard",       icon: <DashIcon /> },
    { id: "orders",    label: "Order History",   icon: <OrderIcon /> },
    { id: "wishlist",  label: "Wishlist",         icon: <HeartIcon />, badge: wishCount },
    { id: "profile",   label: "My Profile",       icon: <UserIcon /> },
    { id: "address",   label: "Manage Address",   icon: <PinIcon /> },
    { id: "support",   label: "Support Ticket",   icon: <SupportIcon /> },
    { id: "password",  label: "Change Password",  icon: <LockIcon /> },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Nunito', sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(6px); }  to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes spin    { to { transform:rotate(360deg); } }

        /* Responsive grid classes */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 16px;
          align-items: start;
        }
        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 16px;
        }

        @media (max-width: 900px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .stat-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .wishlist-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }
        @media (max-width: 360px) {
          .wishlist-grid {
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Nunito', sans-serif", background: "#f3f4f6" }}>

        {/* ════ DESKTOP SIDEBAR ════ */}
        {!isMobile && (
          <aside style={{
            width: 230, background: "#fff", borderRight: "1px solid #f0f0f0",
            display: "flex", flexDirection: "column", padding: "28px 12px 20px",
            flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto",
          }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 78, height: 78, borderRadius: "50%", background: "#f3f4f6", margin: "0 auto 10px", overflow: "hidden", border: "3px solid #e5e7eb" }}>
                {profile?.avatar
                  ? <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>👤</div>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{loading ? "Loading…" : profile?.name || profile?.fullName || "Demo Customer"}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{profile?.phone || profile?.phoneNumber || ""}</div>
            </div>
            <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              {navItems.map(item => (
                <NavItem key={item.id} icon={item.icon} label={item.label}
                  active={activeTab === item.id} badge={item.badge}
                  onClick={() => setActiveTab(item.id)} />
              ))}
            </nav>
            <button onClick={handleLogout}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", border: "none", borderRadius: 10, cursor: "pointer", background: "transparent", color: "#ef4444", fontSize: 14, fontFamily: "inherit", marginTop: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <LogoutIcon /> Logout
            </button>
          </aside>
        )}

        {/* ════ MOBILE TOP BAR ════ */}
        {isMobile && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 400,
            background: "#fff", borderBottom: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#f3f4f6", overflow: "hidden", border: "2px solid #e5e7eb" }}>
                {profile?.avatar
                  ? <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👤</div>}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111", lineHeight: 1.2 }}>{loading ? "Loading…" : profile?.name || profile?.fullName || "Demo Customer"}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  {navItems.find(n => n.id === activeTab)?.label || "Dashboard"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {wishCount > 0 && (
                <button onClick={() => setActiveTab("wishlist")}
                  style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6b7280" }}>
                  <HeartIcon />
                  <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 99, padding: "1px 4px", minWidth: 14, textAlign: "center" }}>{wishCount}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ════ MAIN CONTENT ════ */}
        <main style={{
          flex: 1,
          padding: isMobile ? "72px 14px 90px" : "28px 24px",
          overflowY: "auto", minWidth: 0,
        }}>

          {/* ════ DASHBOARD TAB ════ */}
          {activeTab === "dashboard" && (
            <>
              <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#111", margin: "0 0 16px" }}>Dashboard</h1>

              {/* Stat cards */}
              <div className="stat-grid">
                <StatCard value={loading ? "…" : ongoingCount}  label="On Going Order"       icon={<BoxIcon />}     color="#f59e0b" />
                <StatCard value={loading ? "…" : cartCount}     label="Products in Cart"     icon={<CartBagIcon />} color="#16a34a" />
                <StatCard value={loading ? "…" : wishCount}     label="In Wishlist"          icon={<HeartIcon />}   color="#ef4444" />
                <StatCard value={loading ? "…" : orderCount}    label="Products Ordered"     icon={<BoxIcon />}     color="#3b82f6" />
              </div>

              <div className="dashboard-grid">
                {/* My Cart */}
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", overflow: "hidden", animation: "fadeIn 0.3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
                    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111" }}>My Cart</h2>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
                  </div>
                  {loading ? (
                    <div style={{ padding: "16px" }}>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                          <div style={{ width: 56, height: 56, borderRadius: 8, background: "#f0f0f0", animation: "pulse 1.4s ease-in-out infinite" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ height: 11, width: "60%", background: "#f0f0f0", borderRadius: 4, marginBottom: 7, animation: "pulse 1.4s ease-in-out infinite" }} />
                            <div style={{ height: 10, width: "35%", background: "#f0f0f0", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : cartItems.length === 0 ? (
                    <div style={{ padding: "44px 16px", textAlign: "center", color: "#9ca3af" }}>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>🛒</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Your cart is empty</div>
                    </div>
                  ) : (
                    <div style={{ padding: "0 16px", maxHeight: 400, overflowY: "auto" }}>
                      {storeGroups.map((group, gi) => (
                        <div key={gi}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0 5px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#16a34a" }} />
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{group.name}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <StarFill size={11} />
                              <span style={{ fontSize: 11, color: "#6b7280" }}>{group.rating}</span>
                            </div>
                          </div>
                          {group.items.map((item, ii) => (
                            <CartItemRow key={item._id || ii} item={item} onQtyChange={handleQtyChange} onRemove={handleRemoveCart} />
                          ))}
                          <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", fontFamily: "inherit" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#6b7280", fontSize: 12 }}>
                              <VoucherIcon /> Apply Store voucher
                            </div>
                            <ChevRight />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {cartItems.length > 0 && (
                    <div style={{ padding: "12px 16px", borderTop: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div>
                        <span style={{ fontSize: 12, color: "#6b7280" }}>Cart Amount </span>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>${cartTotal.toFixed(2)}</span>
                      </div>
                      <button onClick={() => navigate("/user/checkout")}
                        style={{ padding: "10px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#15803d"}
                        onMouseLeave={e => e.currentTarget.style.background = "#16a34a"}>
                        Checkout →
                      </button>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Default Address */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: "14px 16px", animation: "fadeIn 0.3s ease" }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#111" }}>Default Shipping Address</h3>
                    {loading
                      ? <div style={{ height: 54, background: "#f0f0f0", borderRadius: 6, animation: "pulse 1.4s ease-in-out infinite" }} />
                      : defaultAddr
                        ? (
                          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                              <span style={{ fontWeight: 700, color: "#111" }}>{defaultAddr.name}</span>
                              <span style={{ background: "#1f2937", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 4 }}>
                                {defaultAddr.type?.toUpperCase() || "HOME"}
                              </span>
                            </div>
                            <div style={{ color: "#6b7280" }}>{defaultAddr.phone}{defaultAddr.altPhone ? `, ${defaultAddr.altPhone}` : ""}</div>
                            <div style={{ color: "#6b7280" }}>
                              {[defaultAddr.house, defaultAddr.road, defaultAddr.landmark, defaultAddr.city, defaultAddr.state, defaultAddr.pincode].filter(Boolean).join(", ")}
                            </div>
                          </div>
                        )
                        : (
                          <div style={{ fontSize: 12, color: "#9ca3af" }}>
                            No default address.{" "}
                            <button onClick={() => setActiveTab("address")}
                              style={{ background: "none", border: "none", color: "#16a34a", fontWeight: 700, cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "inherit" }}>
                              Add one →
                            </button>
                          </div>
                        )
                    }
                  </div>

                  {/* Recently Viewed */}
                  <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: "14px 16px", animation: "fadeIn 0.4s ease" }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#111" }}>Recently Viewed</h3>
                    {loading ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[...Array(3)].map((_, i) => (
                          <div key={i} style={{ display: "flex", gap: 10 }}>
                            <div style={{ width: 50, height: 50, borderRadius: 8, background: "#f0f0f0", animation: "pulse 1.4s ease-in-out infinite" }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ height: 10, width: "70%", background: "#f0f0f0", borderRadius: 4, marginBottom: 5, animation: "pulse 1.4s ease-in-out infinite" }} />
                              <div style={{ height: 10, width: "40%", background: "#f0f0f0", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : recentViewed.length === 0
                      ? <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "14px 0" }}>No recently viewed products.</div>
                      : <div style={{ maxHeight: 300, overflowY: "auto" }}>{recentViewed.map((p, i) => <RecentCard key={p._id || i} product={p} />)}</div>
                    }
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ════ WISHLIST TAB ════ */}
          {activeTab === "wishlist" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 16 : 22, flexWrap: "wrap", gap: 10 }}>
                <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#111", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#16a34a" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  Wishlist
                  {!loading && <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "2px 9px", borderRadius: 20 }}>{wishCount}</span>}
                </h1>
                {wishCount > 0 && (
                  <button onClick={() => navigate("/user/product")}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1.5px solid #16a34a", color: "#16a34a", borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#16a34a"; }}>
                    Continue Shopping <ArrowRight />
                  </button>
                )}
              </div>
              {loading && <WishlistSkeleton />}
              {!loading && wishCount === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 14, textAlign: "center" }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="#16a34a" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>Your wishlist is empty</h3>
                  <p style={{ fontSize: 13, color: "#6b7280", margin: 0, maxWidth: 280 }}>Save products you love and add them to your cart when you're ready.</p>
                  <button onClick={() => navigate("/user/product")}
                    style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                    Browse Products <ArrowRight />
                  </button>
                </div>
              )}
              {!loading && wishCount > 0 && (
                <div className="wishlist-grid">
                  {wishProducts.map(prod => (
                    <WishlistCard key={prod._id} product={prod} onRemove={handleRemoveFromWishlist} onAddToCart={handleAddToCart}
                      removing={removingId === prod._id} addingToCart={addingId === prod._id} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ MANAGE ADDRESS TAB ════ */}
          {activeTab === "address" && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 16 : 22 }}>
                <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#111", margin: 0 }}>Manage Address</h1>
              </div>
              {addrLoading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1,2].map(i => (
                    <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "16px", display: "flex", gap: 12, border: "2px solid #f0f0f0" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f0f0f0", flexShrink: 0, animation: "pulse 1.4s ease-in-out infinite" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 13, width: "30%", background: "#f0f0f0", borderRadius: 4, marginBottom: 9, animation: "pulse 1.4s ease-in-out infinite" }} />
                        <div style={{ height: 10, width: "20%", background: "#f0f0f0", borderRadius: 4, marginBottom: 7, animation: "pulse 1.4s ease-in-out infinite" }} />
                        <div style={{ height: 10, width: "70%", background: "#f0f0f0", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!addrLoading && (
                <>
                  {addresses.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 14, textAlign: "center" }}>
                      <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                        <PinIcon />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: 0 }}>No addresses saved</h3>
                      <p style={{ fontSize: 13, color: "#6b7280", margin: 0, maxWidth: 280 }}>Add a delivery address to speed up checkout.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {addresses.map(addr => (
                        <AddressCard key={addr._id} addr={addr}
                          onEdit={handleEditAddress}
                          onDelete={handleDeleteAddress}
                          onSetDefault={handleSetDefault}
                          deletingId={deletingAddrId}
                          settingDefaultId={settingDefaultId} />
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                    <button onClick={() => { setEditingAddr(null); setShowAddrModal(true); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 13, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 18px rgba(22,163,74,0.28)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; }}>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Address
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════ CHANGE PASSWORD TAB ════ */}
          {activeTab === "password" && <ChangePasswordTab onToast={setToast} />}

          {/* ════ SUPPORT TICKET TAB ════ */}
          {activeTab === "support" && <UserSupportTicket />}

          {/* ════ USER PROFILE TAB ════ */}
          {activeTab === "profile" && <UserProfile />}

          {/* ════ ORDER HISTORY TAB ════ */}
          {activeTab === "orders" && <OrderHistoryTab />}
        </main>
      </div>


      {/* ════ MOBILE BOTTOM NAV ════ */}
      {isMobile && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          wishCount={wishCount}
          cartCount={cartCount}
          onMenuOpen={() => setMobileDrawerOpen(true)}
        />
      )}

      {/* ════ MOBILE DRAWER ════ */}
      {isMobile && (
        <MobileDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profile={profile}
          onLogout={handleLogout}
        />
      )}

      {/* ════ ADDRESS FORM MODAL ════ */}
      {showAddrModal && (
        <AddressFormModal
          initial={editingAddr ? { ...editingAddr, _showAlt: !!editingAddr.altPhone, _showLandmark: !!editingAddr.landmark } : undefined}
          onSave={handleSaveAddress}
          onClose={() => { setShowAddrModal(false); setEditingAddr(null); }}
          saving={savingAddr}
        />
      )}

      {/* ════ TOAST NOTIFICATION ════ */}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}