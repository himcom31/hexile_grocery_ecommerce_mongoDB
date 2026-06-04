import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShoppingCart, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { fetchCart, updateCartItem, removeFromCart } from "../utils/cartWishlist";

// ─── Cart Item ──────────────────────────────────────────────────────────────
function CartItem({ item, onQtyChange, onRemove, updating, removing }) {
  const product  = item.product || item;
  const price    = product.buyingPrice ?? product.price ?? 0;
  const oldPrice = product.sellingPrice ?? product.oldPrice ?? null;
  const name     = product.name || "Product";
  const image    = product.thumbnail || product.additionalImages?.[0] || product.image || product.images?.[0];
  const qty      = item.quantity || 1;
  const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;
  const isLoading = updating || removing;

  return (
    <div style={{
      display: "flex", gap: 12, padding: "14px 0",
      borderBottom: "1px solid #f0f0f0", opacity: isLoading ? 0.6 : 1,
      transition: "opacity 0.2s", position: "relative",
    }}>
      {/* Image */}
      <div style={{
        width: 68, height: 68, borderRadius: 12, overflow: "hidden",
        background: "#f8faf8", flexShrink: 0, border: "1.5px solid #e8f5e9",
      }}>
        {image
          ? <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🛒</div>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <p style={{
            margin: 0, fontSize: 13, fontWeight: 700, color: "#1a2332", lineHeight: 1.4,
            overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {name}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>₹{price.toFixed(2)}</span>
            {oldPrice && oldPrice > price && (
              <span style={{ fontSize: 11, color: "#bbb", textDecoration: "line-through" }}>₹{oldPrice.toFixed(2)}</span>
            )}
            {discount && (
              <span style={{ fontSize: 9, fontWeight: 800, background: "#fef2f2", color: "#ef4444",
                border: "1px solid #fecaca", borderRadius: 4, padding: "1px 5px" }}>
                -{discount}%
              </span>
            )}
          </div>
        </div>

        {/* Qty + Remove row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          {/* Quantity stepper */}
          <div style={{
            display: "flex", alignItems: "center",
            border: "1.5px solid #e5e7eb", borderRadius: 8, overflow: "hidden",
          }}>
            <button
              onClick={() => qty > 1 ? onQtyChange(product._id, qty - 1) : onRemove(product._id)}
              disabled={isLoading}
              style={{
                width: 34, height: 34, border: "none", background: "#f9fafb",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#374151", transition: "background 0.15s",
                /* large touch target */
                minWidth: 34,
              }}
              onMouseEnter={e => !isLoading && (e.currentTarget.style.background = "#f0fdf4")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f9fafb")}
            >
              {qty === 1 ? <Trash2 size={12} color="#ef4444" /> : <Minus size={12} />}
            </button>
            <span style={{
              minWidth: 34, textAlign: "center", fontSize: 13, fontWeight: 700, color: "#111",
              borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb",
              lineHeight: "34px", padding: "0 4px",
            }}>
              {qty}
            </span>
            <button
              onClick={() => onQtyChange(product._id, qty + 1)}
              disabled={isLoading}
              style={{
                width: 34, height: 34, border: "none", background: "#f9fafb",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#374151", transition: "background 0.15s",
                minWidth: 34,
              }}
              onMouseEnter={e => !isLoading && (e.currentTarget.style.background = "#f0fdf4")}
              onMouseLeave={e => (e.currentTarget.style.background = "#f9fafb")}
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Remove button — bigger tap target on mobile */}
          <button
            onClick={() => onRemove(product._id)}
            disabled={isLoading}
            style={{
              background: "none", border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              color: "#d1d5db", padding: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "color 0.15s",
              borderRadius: 8,
            }}
            onMouseEnter={e => !isLoading && (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}
            title="Remove item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Drawer ─────────────────────────────────────────────────────────────
export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();

  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Fetch cart when drawer opens
  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCart();
      setItems(data?.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadCart();
  }, [open, loadCart]);

  // Sync with cart-updated events
  useEffect(() => {
    const handler = (e) => setItems(e.detail?.items || []);
    window.addEventListener("cart-updated", handler);
    return () => window.removeEventListener("cart-updated", handler);
  }, []);

  const handleQtyChange = async (productId, qty) => {
    setUpdatingId(productId);
    try {
      const data = await updateCartItem(productId, qty);
      setItems(data?.items || []);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    try {
      const data = await removeFromCart(productId);
      setItems(data?.items || []);
    } finally {
      setRemovingId(null);
    }
  };

  const total = items.reduce((sum, item) => {
    const p = item.product || item;
    return sum + (p.buyingPrice ?? p.price ?? 0) * (item.quantity || 1);
  }, 0);
  const itemCount = items.reduce((s, i) => s + (i.quantity || 1), 0);

  const handleCheckout = () => {
    onClose();
    navigate("/user/checkout");
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }

        @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cartPulse     { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

        /* ── Drawer ── */
        .cart-drawer {
          position: fixed;
          top: 0; right: 0; bottom: 0;
          /* Full width on very small phones, capped at 420px */
          width: min(420px, 100vw);
          background: #fff;
          z-index: 1201;
          display: flex;
          flex-direction: column;
          box-shadow: -8px 0 40px rgba(0,0,0,0.15);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          /* iOS safe area padding */
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .cart-drawer--open  { transform: translateX(0); }
        .cart-drawer--closed { transform: translateX(100%); }

        /* ── Header ── */
        .cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px;
          border-bottom: 1.5px solid #f0f0f0;
          background: #fff;
          flex-shrink: 0;
        }
        @media (min-width: 400px) {
          .cart-header { padding: 18px 20px; }
        }

        /* ── Scrollable body ── */
        .cart-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 0 14px;
        }
        @media (min-width: 400px) {
          .cart-body { padding: 0 20px; }
        }

        /* ── Footer ── */
        .cart-footer {
          flex-shrink: 0;
          padding: 14px 14px 16px;
          border-top: 1.5px solid #f0f0f0;
          background: #fff;
        }
        @media (min-width: 400px) {
          .cart-footer { padding: 16px 20px 20px; }
        }

        /* ── Checkout button ── */
        .cart-checkout-btn {
          width: 100%;
          padding: 15px 0;
          background: #16a34a;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background 0.2s, transform 0.15s;
          box-shadow: 0 4px 16px rgba(22,163,74,0.3);
          /* Bigger tap zone on mobile */
          min-height: 50px;
        }
        .cart-checkout-btn:hover {
          background: #15803d;
          transform: translateY(-1px);
        }

        /* ── Continue shopping btn ── */
        .cart-continue-btn {
          width: 100%;
          margin-top: 10px;
          padding: 11px 0;
          background: none;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          font-family: inherit;
          transition: border-color 0.15s, color 0.15s;
          min-height: 44px;
        }
        .cart-continue-btn:hover {
          border-color: #16a34a;
          color: #16a34a;
        }

        /* ── Close button ── */
        .cart-close-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1.5px solid #e5e7eb;
          background: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #6b7280;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .cart-close-btn:hover {
          background: #fef2f2;
          border-color: #fca5a5;
          color: #ef4444;
        }
      `}</style>

      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1200,
            backdropFilter: "blur(2px)",
            animation: "overlayFadeIn 0.25s ease",
          }}
        />
      )}

      {/* Drawer */}
      <div className={`cart-drawer ${open ? "cart-drawer--open" : "cart-drawer--closed"}`}>

        {/* ── Header ── */}
        <div className="cart-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: "#f0fdf4",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <ShoppingCart size={18} color="#16a34a" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1a2332" }}>My Cart</h2>
              <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button className="cart-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="cart-body">

          {/* Loading skeleton */}
          {loading && (
            <div style={{ paddingTop: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{
                    width: 68, height: 68, borderRadius: 12, background: "#f0f0f0", flexShrink: 0,
                    animation: "cartPulse 1.4s ease-in-out infinite",
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 13, width: "70%", background: "#f0f0f0", borderRadius: 4, marginBottom: 8, animation: "cartPulse 1.4s ease-in-out infinite" }} />
                    <div style={{ height: 11, width: "35%", background: "#f0f0f0", borderRadius: 4, animation: "cartPulse 1.4s ease-in-out infinite" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "56px 16px", gap: 16, textAlign: "center",
            }}>
              <div style={{
                width: 76, height: 76, borderRadius: "50%", background: "#f0fdf4",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ShoppingBag size={34} color="#16a34a" strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#1a2332" }}>Your cart is empty</p>
                <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Add products to get started</p>
              </div>
              <button
                onClick={() => { onClose(); navigate("/user/product"); }}
                style={{
                  marginTop: 4, display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 24px", background: "#16a34a", color: "#fff",
                  border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit", minHeight: 44,
                }}
              >
                Browse Products <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Items list */}
          {!loading && items.length > 0 && (
            <div>
              {items.map((item) => {
                const product = item.product || item;
                return (
                  <CartItem
                    key={item._id || product._id}
                    item={item}
                    onQtyChange={handleQtyChange}
                    onRemove={handleRemove}
                    updating={updatingId === product._id}
                    removing={removingId === product._id}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && items.length > 0 && (
          <div className="cart-footer">
            {/* Subtotal */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 14, flexWrap: "wrap", gap: 4,
            }}>
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#1a2332" }}>₹{total.toFixed(2)}</span>
            </div>

            {/* Checkout */}
            <button className="cart-checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout <ArrowRight size={16} />
            </button>

            {/* Continue shopping */}
            <button
              className="cart-continue-btn"
              onClick={() => { onClose(); navigate("/user/product"); }}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}