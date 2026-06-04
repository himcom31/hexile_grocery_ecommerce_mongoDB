// pages/Checkout.jsx
// ✅ 100% MOBILE RESPONSIVE — everything visible on all screen sizes
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, ChevronDown, ChevronUp, Tag, Truck,
  CreditCard, Banknote, CheckCircle, ChevronRight,
  AlertCircle, Package, ArrowLeft, X, ShoppingBag
} from "lucide-react";

const API_URL  = "http://localhost:5000";
const getToken = () => localStorage.getItem("userToken");
const authHdr  = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

// ─── API helpers ──────────────────────────────────────────────────────────────
const api = {
  cart:           () => fetch(`${API_URL}/api/cart`,                { headers: authHdr() }).then(r => r.json()),
  addresses:      () => fetch(`${API_URL}/api/address`,             { headers: authHdr() }).then(r => r.json()),
  gateways:       () => fetch(`${API_URL}/api/payment/active`).then(r => r.json()),
  coupon:         (body) => fetch(`${API_URL}/api/coupon/validate`,  { method: "POST", headers: authHdr(), body: JSON.stringify(body) }).then(r => r.json()),
  placeOrder:     (body) => fetch(`${API_URL}/api/orders/place`,    { method: "POST", headers: authHdr(), body: JSON.stringify(body) }).then(r => r.json()),
  razorpayInit:   (body) => fetch(`${API_URL}/api/payment/process`, { method: "POST", headers: authHdr(), body: JSON.stringify(body) }).then(r => r.json()),
  razorpayVerify: (body) => fetch(`${API_URL}/api/payment/verify`,  { method: "POST", headers: authHdr(), body: JSON.stringify(body) }).then(r => r.json()),
  taxRate:        () => fetch(`${API_URL}/api/taxes/active-rate`).then(r => r.json()),
  deliveryRate:   (qty) => fetch(`${API_URL}/api/delivery/charge-for-qty?qty=${qty}`).then(r => r.json()),
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round"
    style={{ animation: "ckSpin 0.7s linear infinite", display: "inline-block", flexShrink: 0 }}>
    <path d="M12 2a10 10 0 0110 10" />
  </svg>
);

const Badge = ({ children, color = "#1f2937" }) => (
  <span style={{
    fontSize: 10, fontWeight: 800, background: color, color: "#fff",
    padding: "2px 7px", borderRadius: 5, letterSpacing: "0.4px", whiteSpace: "nowrap",
  }}>
    {children}
  </span>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, action }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
    <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1a2332",
      display: "flex", alignItems: "center", gap: 8 }}>
      {icon} {title}
    </h2>
    {action}
  </div>
);

// ─── Address Modal ─────────────────────────────────────────────────────────────
function AddressModal({ addresses, selectedId, onSelect, onClose }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 1100,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", width: "100%", maxWidth: 560,
        borderRadius: "20px 20px 0 0", maxHeight: "85vh",
        display: "flex", flexDirection: "column",
        animation: "ckSlideUp 0.28s cubic-bezier(0.32,0.72,0,1)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 2 }} />
        </div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 18px 14px", borderBottom: "1px solid #f3f4f6", flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1a2332" }}>Select Address</h3>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", cursor: "pointer",
            borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="#6b7280" />
          </button>
        </div>
        {/* List */}
        <div style={{ padding: "14px 16px 28px", display: "flex", flexDirection: "column",
          gap: 10, overflowY: "auto", flex: 1 }}>
          {addresses.map(addr => {
            const sel  = addr._id === selectedId;
            const full = [addr.house, addr.road, addr.landmark, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ");
            return (
              <div key={addr._id} onClick={() => { onSelect(addr._id); onClose(); }}
                style={{
                  border: `2px solid ${sel ? "#16a34a" : "#e5e7eb"}`,
                  borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                  background: sel ? "#f0fdf4" : "#fff", transition: "all 0.15s",
                  minHeight: 44,
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#1a2332" }}>{addr.name}</span>
                  <Badge>{addr.type?.toUpperCase() || "HOME"}</Badge>
                  {addr.isDefault && <Badge color="#16a34a">DEFAULT</Badge>}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{addr.phone}</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{full}</div>
                {sel && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5,
                    color: "#16a34a", fontSize: 12, fontWeight: 700 }}>
                    <CheckCircle size={13} /> Selected
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Success Screen ────────────────────────────────────────────────────────────
function OrderSuccess({ order, onDone }) {
  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg,#f0fdf4 0%,#f8faf8 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Nunito','Segoe UI',sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "clamp(28px,6vw,44px) clamp(20px,5vw,36px)",
        maxWidth: 440, width: "100%", textAlign: "center",
        boxShadow: "0 8px 50px rgba(22,163,74,0.12)", animation: "ckFadeUp 0.4s ease",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4",
          border: "3px solid #bbf7d0",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <CheckCircle size={40} color="#16a34a" strokeWidth={2} />
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: "clamp(20px,5vw,24px)", fontWeight: 800, color: "#1a2332" }}>
          Order Placed! 🎉
        </h2>
        <p style={{ margin: "0 0 4px", fontSize: 14, color: "#6b7280" }}>Your order has been confirmed.</p>
        <p style={{ margin: "0 0 24px", fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
          #{order?.orderNumber || "Processing…"}
        </p>
        <div style={{ background: "#f8faf8", borderRadius: 14, padding: "16px 18px", marginBottom: 24, textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>Total Paid</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1a2332" }}>₹{order?.total?.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#6b7280" }}>Payment</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{order?.paymentMethod}</span>
          </div>
        </div>
        <button onClick={onDone} style={{
          width: "100%", padding: "15px 0", background: "#16a34a", color: "#fff",
          border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: "pointer",
          fontFamily: "inherit", boxShadow: "0 4px 16px rgba(22,163,74,0.3)", minHeight: 52,
        }}>
          Go to My Orders
        </button>
      </div>
    </div>
  );
}

// ─── Price Summary Rows ────────────────────────────────────────────────────────
function SummaryRows({ subtotal, couponDiscount, taxableAmount, shippingCharge, deliveryLoading, taxRate, tax, total }) {
  const Row = ({ label, value, valueColor, borderStyle = "1px dashed #f0f0f0" }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0", borderBottom: borderStyle }}>
      <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: valueColor || "#374151" }}>{value}</span>
    </div>
  );
  return (
    <div>
      <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
      {couponDiscount > 0 && <>
        <Row label="Coupon Discount" value={`-₹${couponDiscount.toFixed(2)}`} valueColor="#ef4444" />
        <Row label="After Discount" value={`₹${taxableAmount.toFixed(2)}`} />
      </>}
      <Row
        label={<span style={{ display: "flex", alignItems: "center", gap: 5 }}><Truck size={12} color="#9ca3af" /> Shipping</span>}
        value={deliveryLoading ? <Spinner size={12} /> : shippingCharge === 0 ? "Free" : `₹${shippingCharge.toFixed(2)}`}
        valueColor={shippingCharge === 0 ? "#16a34a" : undefined}
      />
      <Row
        label={<span>Tax {taxRate > 0 && <span style={{ fontSize: 11, color: "#9ca3af" }}>({taxRate}%)</span>}</span>}
        value={taxRate === 0 ? "₹0.00" : `₹${tax.toFixed(2)}`}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, marginTop: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#1a2332" }}>Total Payable</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#1a2332" }}>₹{total.toFixed(2)}</span>
      </div>
    </div>
  );
}

// ─── Coupon Input ──────────────────────────────────────────────────────────────
function CouponSection({ couponApplied, couponCode, setCouponCode, couponError, setCouponError, couponLoading, handleCouponApply, removeCoupon, couponDiscount }) {
  return (
    <div style={{ marginTop: 16, background: "#f8faf8", borderRadius: 14, padding: "14px" }}>
      <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#374151",
        display: "flex", alignItems: "center", gap: 6 }}>
        <Tag size={13} color="#16a34a" /> Have a coupon?
      </p>
      {couponApplied ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, padding: "10px 14px",
          flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <CheckCircle size={14} color="#16a34a" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{couponApplied.couponCode}</span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>–₹{couponDiscount.toFixed(2)} off</span>
          </div>
          <button onClick={removeCoupon} style={{ background: "none", border: "none", cursor: "pointer",
            color: "#9ca3af", display: "flex", padding: 4, minHeight: 32, minWidth: 32,
            alignItems: "center", justifyContent: "center" }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: "flex" }}>
          <input
            type="text" value={couponCode}
            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
            onKeyDown={e => e.key === "Enter" && handleCouponApply()}
            placeholder="Enter coupon code"
            style={{ flex: 1, padding: "11px 13px", border: "1.5px solid #e5e7eb",
              borderRight: "none", borderRadius: "10px 0 0 10px", fontSize: 13,
              fontFamily: "inherit", color: "#374151", minWidth: 0, minHeight: 44 }}
          />
          <button onClick={handleCouponApply} disabled={couponLoading}
            style={{ padding: "11px 16px", background: "#1a2332", color: "#fff", border: "none",
              borderRadius: "0 10px 10px 0", cursor: couponLoading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700,
              fontFamily: "inherit", flexShrink: 0, minHeight: 44 }}>
            {couponLoading ? <Spinner size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      )}
      {couponError && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#ef4444",
          display: "flex", alignItems: "center", gap: 5 }}>
          <AlertCircle size={12} /> {couponError}
        </p>
      )}
    </div>
  );
}

// ─── Full Summary Panel (desktop sidebar) ─────────────────────────────────────
function OrderSummaryPanel({ summaryRowsProps, couponProps, error, placing, cartItems, selectedAddressId, handlePlaceOrder, navigate }) {
  return (
    <>
      <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#1a2332" }}>Order Summary</h2>
      <SummaryRows {...summaryRowsProps} />
      <CouponSection {...couponProps} />

      {error && (
        <div style={{ marginTop: 12, background: "#fef2f2", border: "1.5px solid #fecaca",
          borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 8,
          fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      <button onClick={handlePlaceOrder}
        disabled={placing || cartItems.length === 0 || !selectedAddressId}
        style={{
          width: "100%", marginTop: 14, padding: "15px 0",
          background: placing ? "#15803d" : "#16a34a",
          color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800,
          cursor: (placing || !selectedAddressId) ? "not-allowed" : "pointer",
          fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, transition: "background 0.2s", boxShadow: "0 4px 16px rgba(22,163,74,0.3)",
          opacity: !selectedAddressId ? 0.7 : 1, minHeight: 52,
        }}>
        {placing ? <><Spinner size={16} /> Placing Order…</> : "Place Order"}
      </button>

      <button onClick={() => navigate(-1)}
        style={{ width: "100%", marginTop: 10, padding: "12px 0", background: "none",
          border: "1.5px solid #e5e7eb", borderRadius: 12, fontSize: 13, fontWeight: 600,
          color: "#6b7280", cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 46 }}>
        <ArrowLeft size={14} /> Back to Cart
      </button>
    </>
  );
}

// ─── Payment Option Button ─────────────────────────────────────────────────────
const PayBtn = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "13px 14px", border: `2px solid ${active ? "#16a34a" : "#e5e7eb"}`,
    borderRadius: 12, cursor: "pointer", background: active ? "#f0fdf4" : "#fff",
    fontFamily: "inherit", transition: "all 0.15s", textAlign: "left",
    width: "100%", minHeight: 52,
  }}>
    <div style={{ width: 20, height: 20, borderRadius: "50%",
      border: `2px solid ${active ? "#16a34a" : "#d1d5db"}`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />}
    </div>
    {icon}
    <span style={{ fontSize: 13, fontWeight: 700, color: active ? "#16a34a" : "#374151" }}>{label}</span>
  </button>
);

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    {[100, 80, 120].map((h, i) => (
      <div key={i} style={{
        height: h, background: "#fff", borderRadius: 14,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        animation: "ckPulse 1.4s ease-in-out infinite",
      }} />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN CHECKOUT PAGE ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function Checkout() {
  const navigate = useNavigate();

  const [cartItems,         setCartItems]         = useState([]);
  const [addresses,         setAddresses]         = useState([]);
  const [gateways,          setGateways]          = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod,     setPaymentMethod]     = useState("COD");
  const [note,              setNote]              = useState("");
  const [showItems,         setShowItems]         = useState(false);
  const [showAddrModal,     setShowAddrModal]     = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const [shippingCharge,  setShippingCharge]  = useState(0);
  const [taxRate,         setTaxRate]         = useState(0);
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  const [couponCode,    setCouponCode]    = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [couponError,   setCouponError]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const [placing,      setPlacing]      = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error,        setError]        = useState("");

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cartRes, addrRes, gwRes, taxRes] = await Promise.allSettled([
        api.cart(), api.addresses(), api.gateways(), api.taxRate(),
      ]);
      let resolvedQty = 1;
      if (cartRes.status === "fulfilled") {
        const items = cartRes.value?.items || [];
        setCartItems(items);
        if (items.length === 0) navigate("/user/product");
        resolvedQty = items.reduce((s, i) => s + (i.quantity || 1), 0);
      }
      if (addrRes.status === "fulfilled") {
        const addrs = addrRes.value?.addresses || [];
        setAddresses(addrs);
        const def = addrs.find(a => a.isDefault) || addrs[0];
        if (def) setSelectedAddressId(def._id);
      }
      if (gwRes.status === "fulfilled") setGateways(gwRes.value?.gateways || []);
      if (taxRes.status === "fulfilled" && taxRes.value?.success) {
        setTaxRate(taxRes.value.totalPercentage || 0);
      }
      try {
        const dRes = await api.deliveryRate(resolvedQty);
        if (dRes?.success) setShippingCharge(dRes.charge ?? 0);
      } catch {}
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (cartItems.length === 0) return;
    const qty = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);
    setDeliveryLoading(true);
    api.deliveryRate(qty)
      .then(res => { if (res?.success) setShippingCharge(res.charge ?? 0); })
      .catch(() => {})
      .finally(() => setDeliveryLoading(false));
  }, [cartItems]);

  // ── Derived pricing ────────────────────────────────────────────────────────
  const subtotal = cartItems.reduce((s, i) => {
    const p = i.product || i;
    return s + (p.buyingPrice ?? p.price ?? 0) * (i.quantity || 1);
  }, 0);
  const couponDiscount = couponApplied
    ? couponApplied.discountType === "Percentage"
      ? Math.min((subtotal * couponApplied.discountValue) / 100, couponApplied.maxDiscount || Infinity)
      : couponApplied.discountValue
    : 0;
  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const tax           = parseFloat(((taxableAmount * taxRate) / 100).toFixed(2));
  const total         = Math.max(0, taxableAmount + shippingCharge + tax);
  const selectedAddress = addresses.find(a => a._id === selectedAddressId) || null;
  const itemCount       = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);

  // ── Coupon ─────────────────────────────────────────────────────────────────
  const handleCouponApply = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError("");
    try {
      const data = await api.coupon({ code: couponCode.trim(), orderAmount: subtotal });
      if (data.success) setCouponApplied(data.coupon);
      else setCouponError(data.message || "Invalid coupon");
    } catch { setCouponError("Failed to validate coupon"); }
    finally { setCouponLoading(false); }
  };
  const removeCoupon = () => { setCouponApplied(null); setCouponCode(""); setCouponError(""); };

  // ── Place Order ────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { setError("Please select a delivery address"); return; }
    setError(""); setPlacing(true);
    try {
      if (paymentMethod === "Razorpay") {
        const rzpData = await api.razorpayInit({ amount: total });
        if (!rzpData.success) { setError(rzpData.message || "Payment init failed"); setPlacing(false); return; }
        const options = {
          key: rzpData.key_id, amount: rzpData.amount, currency: "INR",
          order_id: rzpData.order_id, name: "Ready Grocery", description: "Order Payment",
          handler: async (response) => {
            const verify = await api.razorpayVerify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (!verify.success) { setError("Payment verification failed"); setPlacing(false); return; }
            const orderRes = await api.placeOrder({
              addressId: selectedAddressId, paymentMethod: "Razorpay", note,
              couponCode: couponApplied?.couponCode || null, couponDiscount, shippingCharge, tax,
              razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id,
            });
            if (orderRes.success) {
              window.dispatchEvent(new CustomEvent("cart-updated", { detail: { items: [] } }));
              setOrderSuccess(orderRes.order);
            } else { setError(orderRes.message || "Order failed"); }
            setPlacing(false);
          },
          modal: { ondismiss: () => setPlacing(false) },
        };
        new window.Razorpay(options).open();
      } else {
        const orderRes = await api.placeOrder({
          addressId: selectedAddressId,
          paymentMethod: paymentMethod === "Card" ? "Card" : "COD",
          note, couponCode: couponApplied?.couponCode || null, couponDiscount, shippingCharge, tax,
        });
        if (orderRes.success) {
          window.dispatchEvent(new CustomEvent("cart-updated", { detail: { items: [] } }));
          setOrderSuccess(orderRes.order);
        } else { setError(orderRes.message || "Failed to place order"); }
        setPlacing(false);
      }
    } catch { setError("Something went wrong. Please try again."); setPlacing(false); }
  };

  if (orderSuccess) {
    return <OrderSuccess order={orderSuccess} onDone={() => navigate("/user/userDashboard")} />;
  }

  // ── Shared props ────────────────────────────────────────────────────────────
  const summaryRowsProps = { subtotal, couponDiscount, taxableAmount, shippingCharge, deliveryLoading, taxRate, tax, total };
  const couponProps = { couponApplied, couponCode, setCouponCode, couponError, setCouponError, couponLoading, handleCouponApply, removeCoupon, couponDiscount };

  // ── Card style ──────────────────────────────────────────────────────────────
  const card = {
    background: "#fff", borderRadius: 16, padding: isMobile ? "16px 14px" : "22px",
    marginBottom: 14, boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f4", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes ckFadeUp  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ckSlideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ckSpin    { to { transform: rotate(360deg); } }
        @keyframes ckPulse   { 0%,100%{opacity:1} 50%{opacity:0.45} }
        input:focus,textarea:focus {
          border-color: #16a34a !important;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
          outline: none;
        }
        /* Hide scrollbar on mobile summary */
        .ck-summary-scroll::-webkit-scrollbar { display: none; }
        .ck-summary-scroll { scrollbar-width: none; }
      `}</style>

      {/* ── Top breadcrumb bar ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{
          maxWidth: 1080, margin: "0 auto",
          padding: isMobile ? "10px 14px" : "10px 20px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {/* Back button always visible on mobile */}
          <button onClick={() => navigate(-1)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "#16a34a", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
            padding: "6px 0", minHeight: 36,
          }}>
            <ArrowLeft size={15} /> {isMobile ? "Cart" : "Back to Cart"}
          </button>
          {!isMobile && <>
            <ChevronRight size={13} color="#9ca3af" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a2332" }}>Checkout</span>
          </>}
          {isMobile && (
            <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#1a2332" }}>Checkout</span>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{
        maxWidth: 1080, margin: "0 auto",
        padding: isMobile ? "14px 12px 170px" : "24px 20px 40px",
      }}>

        {/* ── Page title ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 800, color: "#1a2332" }}>Checkout</h1>
          {!loading && (
            <button onClick={() => setShowItems(p => !p)} style={{
              display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4",
              border: "1.5px solid #bbf7d0", borderRadius: 10, padding: "7px 12px",
              cursor: "pointer", fontFamily: "inherit", color: "#16a34a",
              fontSize: 13, fontWeight: 700, minHeight: 38,
            }}>
              <ShoppingBag size={14} />
              {itemCount} item{itemCount !== 1 ? "s" : ""}
              {showItems ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>

        {/* ── Expanded cart items ── */}
        {showItems && !loading && (
          <div style={{ ...card, animation: "ckFadeUp 0.2s ease" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: "#1a2332",
              display: "flex", alignItems: "center", gap: 7 }}>
              <Package size={14} color="#16a34a" /> Order Items
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {cartItems.map((item, i) => {
                const p     = item.product || item;
                const price = p.buyingPrice ?? p.price ?? 0;
                const name  = p.name || "Product";
                const img   = p.thumbnail || p.additionalImages?.[0] || p.image;
                const qty   = item.quantity || 1;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                    borderBottom: i < cartItems.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}>
                    <div style={{ width: 50, height: 50, borderRadius: 10, overflow: "hidden",
                      background: "#f8faf8", border: "1px solid #e8f5e9", flexShrink: 0 }}>
                      {img
                        ? <img src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📦</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a2332",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>Qty: {qty}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#16a34a", whiteSpace: "nowrap" }}>
                      ₹{(price * qty).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && <Skeleton />}

        {!loading && (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
            gap: isMobile ? 0 : 20,
            alignItems: "start",
          }}>

            {/* ══════════ LEFT COLUMN ══════════ */}
            <div>

              {/* ── Shipping Address ── */}
              <div style={card}>
                <SectionHeader
                  icon={<MapPin size={15} color="#16a34a" />}
                  title="Shipping Address"
                  action={addresses.length > 0 && (
                    <button onClick={() => setShowAddrModal(true)} style={{
                      background: "none", border: "none", cursor: "pointer", color: "#16a34a",
                      fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                      padding: "6px 8px", minHeight: 36,
                    }}>
                      Change
                    </button>
                  )}
                />

                {addresses.length === 0 ? (
                  <div style={{ border: "2px dashed #e5e7eb", borderRadius: 12, padding: "20px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 12px", fontSize: 14, color: "#9ca3af" }}>No address saved yet.</p>
                    <button onClick={() => navigate("/user/userDashboard")} style={{
                      background: "#16a34a", color: "#fff", border: "none", borderRadius: 10,
                      padding: "11px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit", minHeight: 46,
                    }}>
                      Add Address
                    </button>
                  </div>
                ) : selectedAddress ? (
                  <div style={{ border: "2px solid #16a34a", borderRadius: 12,
                    padding: "14px 16px", background: "#f0fdf4" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <MapPin size={13} color="#16a34a" />
                      <span style={{ fontWeight: 800, fontSize: 14, color: "#1a2332" }}>{selectedAddress.name}</span>
                      <Badge>{selectedAddress.type?.toUpperCase() || "HOME"}</Badge>
                      {selectedAddress.isDefault && <Badge color="#16a34a">DEFAULT</Badge>}
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 13, color: "#6b7280" }}>{selectedAddress.phone}</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                      {[selectedAddress.house, selectedAddress.road, selectedAddress.landmark,
                        selectedAddress.city, selectedAddress.state, selectedAddress.pincode].filter(Boolean).join(", ")}
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "16px 0", fontSize: 13, color: "#9ca3af" }}>
                    No address selected.
                  </div>
                )}
              </div>

              {/* ── Payment Method ── */}
              <div style={card}>
                <SectionHeader
                  icon={<CreditCard size={15} color="#16a34a" />}
                  title="Payment Method"
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <PayBtn
                    active={paymentMethod === "COD"}
                    onClick={() => setPaymentMethod("COD")}
                    icon={<Banknote size={18} color={paymentMethod === "COD" ? "#16a34a" : "#9ca3af"} />}
                    label="Cash on Delivery"
                  />
                  {gateways.some(g => g.gatewayName === "Razorpay") && (
                    <PayBtn
                      active={paymentMethod === "Razorpay"}
                      onClick={() => setPaymentMethod("Razorpay")}
                      icon={<CreditCard size={18} color={paymentMethod === "Razorpay" ? "#16a34a" : "#9ca3af"} />}
                      label="Razorpay"
                    />
                  )}
                  {gateways.some(g => g.gatewayName === "Stripe") && (
                    <PayBtn
                      active={paymentMethod === "Card"}
                      onClick={() => setPaymentMethod("Card")}
                      icon={<CreditCard size={18} color={paymentMethod === "Card" ? "#16a34a" : "#9ca3af"} />}
                      label="Credit / Debit Card"
                    />
                  )}
                </div>
              </div>

              {/* ── Note ── */}
              <div style={card}>
                <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#1a2332" }}>
                  Note <span style={{ fontWeight: 500, fontSize: 13, color: "#9ca3af" }}>(Optional)</span>
                </h2>
                <textarea
                  value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Write any special instructions for your order…"
                  rows={3}
                  style={{ width: "100%", padding: "11px 13px", border: "1.5px solid #e5e7eb",
                    borderRadius: 10, fontSize: 13, color: "#374151", fontFamily: "inherit",
                    resize: "vertical", transition: "border-color 0.2s", lineHeight: 1.6 }}
                />
              </div>

              {/* ── Mobile: Order Summary inline (above bottom bar) ── */}
              {isMobile && (
                <div style={card}>
                  <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 800, color: "#1a2332" }}>
                    Order Summary
                  </h2>
                  <SummaryRows {...summaryRowsProps} />
                  <CouponSection {...couponProps} />

                  {error && (
                    <div style={{ marginTop: 12, background: "#fef2f2", border: "1.5px solid #fecaca",
                      borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "flex-start",
                      gap: 8, fontSize: 13, color: "#ef4444", fontWeight: 600 }}>
                      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ══════════ RIGHT COLUMN — desktop only ══════════ */}
            {!isMobile && (
              <div style={{ position: "sticky", top: 90 }}>
                <div style={card}>
                  <OrderSummaryPanel
                    summaryRowsProps={summaryRowsProps}
                    couponProps={couponProps}
                    error={error}
                    placing={placing}
                    cartItems={cartItems}
                    selectedAddressId={selectedAddressId}
                    handlePlaceOrder={handlePlaceOrder}
                    navigate={navigate}
                  />
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ══════════ MOBILE BOTTOM STICKY BAR ══════════ */}
      {!loading && isMobile && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 500,
          background: "#fff", borderTop: "1.5px solid #e5e7eb",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.10)",
          paddingBottom: "env(safe-area-inset-bottom,0px)",
        }}>
          {/* Single row: total on left, Place Order on right */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", gap: 12,
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 2 }}>Total Payable</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1a2332", lineHeight: 1 }}>
                ₹{total.toFixed(2)}
              </div>
              {shippingCharge === 0 && (
                <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>
                  🎉 Free delivery
                </div>
              )}
            </div>
            <button
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddressId}
              style={{
                padding: "13px 24px",
                background: placing ? "#15803d" : !selectedAddressId ? "#9ca3af" : "#16a34a",
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 800, cursor: placing || !selectedAddressId ? "not-allowed" : "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
                whiteSpace: "nowrap", minHeight: 50, flexShrink: 0,
                boxShadow: selectedAddressId ? "0 4px 14px rgba(22,163,74,0.3)" : "none",
              }}>
              {placing ? <><Spinner size={15} /> Placing…</> : "Place Order"}
            </button>
          </div>

          {/* No address warning */}
          {!selectedAddressId && (
            <div style={{ padding: "0 14px 10px", display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
              <AlertCircle size={12} /> Please select a delivery address above
            </div>
          )}
        </div>
      )}

      {/* Address Modal */}
      {showAddrModal && (
        <AddressModal
          addresses={addresses}
          selectedId={selectedAddressId}
          onSelect={setSelectedAddressId}
          onClose={() => setShowAddrModal(false)}
        />
      )}
    </div>
  );
}