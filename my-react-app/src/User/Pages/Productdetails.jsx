// src/Pages/ProductDetails.jsx
// Reusable Product Details Page — slug-based routing: /products/:slug
// Works with existing Cart, Wishlist & Checkout pages.

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Heart, ShoppingCart, ArrowLeft, Share2,
  Star, Package, Tag, Minus, Plus,
  CheckCircle, Loader2, ChevronRight,
  ZoomIn, X
} from "lucide-react";
import { addToCart, toggleWishlist, fetchWishlist } from "../utils/cartWishlist";

const API_URL  = "http://localhost:5000";
const getToken = () => localStorage.getItem("userToken");

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isLoggedIn = () => !!getToken();

const StarRating = ({ rating = 0, count = 0, size = 13 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size}
          fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
          color={i <= Math.round(rating) ? "#f59e0b" : "#d1d5db"}
          strokeWidth={1.5}
        />
      ))}
    </div>
    <span style={{ fontSize: 12, color: "#6b7280" }}>({count} reviews)</span>
  </div>
);

// ─── Image Lightbox ───────────────────────────────────────────────────────────
function Lightbox({ images, activeIdx, onClose }) {
  const [idx, setIdx] = useState(activeIdx);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % images.length);
      if (e.key === "ArrowLeft")  setIdx(i => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <button onClick={onClose} style={{
        position: "absolute", top: 16, right: 16,
        background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
        width: 40, height: 40, display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", color: "#fff",
      }}><X size={20} /></button>

      <button onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + images.length) % images.length); }}
        style={{
          position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
          width: 44, height: 44, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 22,
        }}>‹</button>

      <img src={images[idx]} alt="Product"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "85vh", maxWidth: "85vw", objectFit: "contain", borderRadius: 12 }} />

      <button onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % images.length); }}
        style={{
          position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
          background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
          width: 44, height: 44, display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 22,
        }}>›</button>

      <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 6 }}>
        {images.map((_, i) => (
          <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
            style={{
              width: i === idx ? 22 : 8, height: 8, borderRadius: 4,
              background: i === idx ? "#fff" : "rgba(255,255,255,0.4)",
              border: "none", cursor: "pointer", padding: 0, transition: "width 0.25s",
            }} />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ isMobile }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: 28, padding: isMobile ? "16px 14px" : "28px 24px",
    animation: "pdPulse 1.4s ease-in-out infinite",
  }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ height: isMobile ? 260 : 420, background: "#f0f0f0", borderRadius: 16 }} />
      <div style={{ display: "flex", gap: 8 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 70, background: "#f0f0f0", borderRadius: 10 }} />)}
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[40, 20, 28, 16, 100, 60].map((h, i) => (
        <div key={i} style={{ height: h, background: "#f0f0f0", borderRadius: 8,
          width: i === 0 ? "75%" : i === 1 ? "40%" : "100%" }} />
      ))}
    </div>
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  const colors = { success: "#166534", error: "#991b1b", info: "#1e40af" };
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
      background: colors[type] || colors.info, color: "#fff",
      padding: "12px 22px", borderRadius: 12, fontSize: 13, fontWeight: 600,
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
      maxWidth: "calc(100vw - 32px)", animation: "pdToastIn 0.25s ease",
    }}>
      {type === "success" && <CheckCircle size={15} />}
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductDetails() {
  const { slug } = useParams();
  const navigate  = useNavigate();

  const [product,   setProduct]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const [activeImg,   setActiveImg]   = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [qty,         setQty]         = useState(1);

  const [wished,      setWished]      = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [toast,       setToast]       = useState(null);

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
const [related, setRelated] = useState([]);

// Add this effect after the loadProduct effect:
useEffect(() => {
  if (!product) return;
  const catId = typeof product.category === "object" ? product.category?._id : product.category;
  if (!catId) return;

  fetch(`${API_URL}/api/Products/allFree?limit=100`)
    .then(r => r.json())
    .then(data => {
      const list = Array.isArray(data) ? data : data.products || data.data || [];
      const filtered = list
        .filter(p => {
          const pCat = typeof p.category === "object" ? p.category?._id : p.category;
          return pCat === catId && p._id !== product._id;
        })
        .slice(0, 8);
      setRelated(filtered);
    })
    .catch(() => {});
}, [product]);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // ── Load product by slug ──────────────────────────────────────────────────
  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all free products and find by slug (no auth endpoint for slug lookup)
      const res  = await fetch(`${API_URL}/api/Products/allFree?limit=500`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.products || data.data || [];
      const found = list.find(p => p.slug === slug);
      if (!found) {
        setError("Product not found.");
      } else {
        setProduct(found);
      }
    } catch {
      setError("Failed to load product. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  // ── Check wishlist ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!product || !isLoggedIn()) return;
    fetchWishlist()
      .then(data => {
        const ids = (data.products || []).map(p => p._id || p);
        setWished(ids.includes(product._id));
      })
      .catch(() => {});
  }, [product]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f4f6f4",
      fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <style>{`@keyframes pdPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Skeleton isMobile={isMobile} />
      </div>
    </div>
  );

  if (error || !product) return (
    <div style={{ minHeight: "100vh", background: "#f4f6f4", display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16,
      fontFamily: "'Nunito','Segoe UI',sans-serif", padding: 24 }}>
      <Package size={56} color="#d1d5db" strokeWidth={1.2} />
      <p style={{ fontSize: 16, color: "#6b7280", fontWeight: 600, margin: 0 }}>
        {error || "Product not found."}
      </p>
      <button onClick={() => navigate(-1)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "11px 24px",
        background: "#16a34a", color: "#fff", border: "none", borderRadius: 10,
        fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
      }}><ArrowLeft size={15} /> Go Back</button>
    </div>
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const allImages  = [product.thumbnail, ...(product.additionalImages || [])].filter(Boolean);
  const price      = product.buyingPrice  ?? 0;
  const oldPrice   = product.sellingPrice ?? null;
  const discount   = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : null;
  const stock      = product.stockQuantity ?? 0;
  const isOOS      = stock === 0;
  const isLow      = !isOOS && stock <= 10;
  const catName    = typeof product.category === "object" ? product.category?.name : product.category || "";
  const brandName  = typeof product.brand    === "object" ? product.brand?.name    : product.brand    || "";

  const minQty = product.minOrderQuantity ?? 1;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => setToast({ message, type });

  const handleAddToCart = async () => {
    if (!isLoggedIn()) { navigate("/user/login"); return; }
    if (isOOS || cartLoading) return;
    setCartLoading(true);
    try {
      await addToCart(product._id, qty);
      window.dispatchEvent(new CustomEvent("cart-item-added"));
      showToast("Added to cart!", "success");
    } catch {
      showToast("Failed to add to cart", "error");
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn()) { navigate("/user/login"); return; }
    if (isOOS) return;
    setCartLoading(true);
    try {
      await addToCart(product._id, qty);
      window.dispatchEvent(new CustomEvent("cart-item-added"));
      navigate("/user/checkout");
    } catch {
      showToast("Failed — please try again", "error");
      setCartLoading(false);
    }
  };

  const handleWishlist = async () => {
    if (!isLoggedIn()) { navigate("/user/login"); return; }
    if (wishLoading) return;
    setWishLoading(true);
    try {
      await toggleWishlist(product._id, wished);
      setWished(w => !w);
      showToast(wished ? "Removed from wishlist" : "Added to wishlist!", "success");
    } catch {
      showToast("Failed to update wishlist", "error");
    } finally {
      setWishLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => showToast("Link copied!", "info"))
        .catch(() => {});
    }
  };

  // ── Layout constants ──────────────────────────────────────────────────────
  const card = {
    background: "#fff", borderRadius: 16,
    boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
    padding: isMobile ? "16px 14px" : "22px 24px",
    marginBottom: 14,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f4",
      fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes pdFadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pdPulse   { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes pdToastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        .pd-thumb {
          cursor: pointer;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid transparent;
          transition: border-color 0.15s, transform 0.15s;
          aspect-ratio: 1/1;
          background: #f9fafb;
          flex-shrink: 0;
        }
        .pd-thumb:hover { transform: translateY(-1px); }
        .pd-thumb.active { border-color: #16a34a; }
        .pd-btn-cart {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 0; border-radius: 12px; font-size: 14px; font-weight: 800;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
          border: 2px solid #16a34a; background: #fff; color: #16a34a;
          min-height: 50px;
        }
        .pd-btn-cart:hover:not(:disabled) { background: #16a34a; color: #fff; }
        .pd-btn-cart:disabled { opacity: 0.6; cursor: not-allowed; }
        .pd-btn-buy {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 0; border-radius: 12px; font-size: 14px; font-weight: 800;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
          border: none; background: #16a34a; color: #fff;
          box-shadow: 0 4px 16px rgba(22,163,74,0.3); min-height: 50px;
        }
        .pd-btn-buy:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); }
        .pd-btn-buy:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* ── Breadcrumb ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: isMobile ? "10px 14px" : "10px 24px",
          display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
        }}>
          <button onClick={() => navigate(-1)} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            color: "#16a34a", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
            padding: "6px 0",
          }}>
            <ArrowLeft size={14} /> Back
          </button>
          {catName && <>
            <ChevronRight size={12} color="#d1d5db" />
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{catName}</span>
          </>}
          <ChevronRight size={12} color="#d1d5db" />
          <span style={{ fontSize: 12, color: "#374151", fontWeight: 600,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            maxWidth: isMobile ? 140 : 300 }}>
            {product.name}
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: isMobile ? "16px 12px 40px" : "24px 24px 48px",
        animation: "pdFadeUp 0.3s ease",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "480px 1fr",
          gap: isMobile ? 16 : 24,
          alignItems: "start",
        }}>

          {/* ══ LEFT — Image Gallery ══ */}
          <div>
            {/* Main image */}
            <div style={{
              ...card,
              padding: 12, marginBottom: 10,
              position: "relative", overflow: "hidden",
              cursor: "zoom-in",
            }} onClick={() => setLightboxIdx(activeImg)}>
              <div style={{
                width: "100%", aspectRatio: "1 / 1",
                background: "#f9fafb", borderRadius: 10, overflow: "hidden",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {allImages.length > 0
                  ? <img src={allImages[activeImg]} alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <Package size={64} color="#d1d5db" />
                }
              </div>
              {discount && (
                <div style={{
                  position: "absolute", top: 18, left: 18, zIndex: 2,
                  background: "#ef4444", color: "#fff", fontSize: 12, fontWeight: 800,
                  padding: "4px 10px", borderRadius: 6,
                }}>
                  {discount}% OFF
                </div>
              )}
              <div style={{
                position: "absolute", bottom: 18, right: 18, zIndex: 2,
                background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ZoomIn size={16} color="#fff" />
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto",
                paddingBottom: 4, scrollbarWidth: "none" }}>
                {allImages.map((img, i) => (
                  <div key={i}
                    className={`pd-thumb${activeImg === i ? " active" : ""}`}
                    style={{ width: 68, height: 68, minWidth: 68 }}
                    onClick={() => setActiveImg(i)}>
                    <img src={img} alt={`View ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══ RIGHT — Product Info ══ */}
          <div style={{ position: isMobile ? "static" : "sticky", top: 80 }}>
            <div style={card}>

              {/* Brand + Share + Wishlist */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {brandName && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af",
                      textTransform: "uppercase", letterSpacing: "0.6px" }}>
                      {brandName}
                    </span>
                  )}
                  {catName && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "#16a34a",
                      background: "#f0fdf4", border: "1px solid #bbf7d0",
                      padding: "2px 8px", borderRadius: 6, textTransform: "uppercase",
                    }}>
                      {catName}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleShare} style={{
                    width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #e5e7eb",
                    background: "#fff", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", color: "#6b7280",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#16a34a"; e.currentTarget.style.color = "#16a34a"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
                  ><Share2 size={14} /></button>
                  <button onClick={handleWishlist} disabled={wishLoading} style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: `1.5px solid ${wished ? "#fca5a5" : "#e5e7eb"}`,
                    background: wished ? "#fef2f2" : "#fff",
                    cursor: wishLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}>
                    {wishLoading
                      ? <Loader2 size={14} color="#ef4444" style={{ animation: "spin 0.7s linear infinite" }} />
                      : <Heart size={14} fill={wished ? "#ef4444" : "none"} color={wished ? "#ef4444" : "#6b7280"} />
                    }
                  </button>
                </div>
              </div>

              {/* Product Name */}
              <h1 style={{ margin: "0 0 8px", fontSize: isMobile ? 20 : 24,
                fontWeight: 900, color: "#1a2332", lineHeight: 1.25 }}>
                {product.name}
              </h1>

              {/* Short description */}
              {product.shortDescription && (
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280",
                  lineHeight: 1.65 }}>
                  {product.shortDescription}
                </p>
              )}

              {/* Rating (display only — no review form) */}
              {(product.averageRating || product.reviewCount) && (
                <div style={{ marginBottom: 12 }}>
                  <StarRating rating={product.averageRating || 0} count={product.reviewCount || 0} />
                </div>
              )}

              {/* Divider */}
              <div style={{ borderTop: "1px dashed #f0f0f0", margin: "12px 0" }} />

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: isMobile ? 28 : 34, fontWeight: 900, color: "#16a34a" }}>
                  ₹{price.toFixed(2)}
                </span>
                {oldPrice && oldPrice > price && (
                  <span style={{ fontSize: 16, color: "#9ca3af", textDecoration: "line-through", fontWeight: 500 }}>
                    ₹{oldPrice.toFixed(2)}
                  </span>
                )}
                {discount && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, background: "#fef2f2",
                    color: "#ef4444", border: "1px solid #fecaca",
                    borderRadius: 5, padding: "2px 8px",
                  }}>
                    Save {discount}%
                  </span>
                )}
              </div>

              {/* Stock badge */}
              <div style={{ marginBottom: 14 }}>
                {isOOS ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 12, fontWeight: 700, color: "#dc2626",
                    background: "#fef2f2", border: "1px solid #fecaca",
                    padding: "4px 10px", borderRadius: 6,
                  }}>
                    ❌ Out of Stock
                  </span>
                ) : isLow ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 12, fontWeight: 700, color: "#d97706",
                    background: "#fffbeb", border: "1px solid #fde68a",
                    padding: "4px 10px", borderRadius: 6,
                  }}>
                    ⚠️ Only {stock} left!
                  </span>
                ) : (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 12, fontWeight: 700, color: "#16a34a",
                    background: "#f0fdf4", border: "1px solid #bbf7d0",
                    padding: "4px 10px", borderRadius: 6,
                  }}>
                    <CheckCircle size={12} /> In Stock ({stock} available)
                  </span>
                )}
              </div>

              {/* Unit + SKU */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                {product.unit && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5,
                    fontSize: 12, color: "#6b7280", background: "#f9fafb",
                    border: "1px solid #e5e7eb", padding: "4px 10px", borderRadius: 6 }}>
                    <Tag size={11} /> {product.unit}
                  </div>
                )}
                {product.sku && (
                  <div style={{ fontSize: 12, color: "#9ca3af",
                    background: "#f9fafb", border: "1px solid #e5e7eb",
                    padding: "4px 10px", borderRadius: 6 }}>
                    SKU: {product.sku}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px dashed #f0f0f0", margin: "14px 0" }} />

              {/* Quantity Selector */}
              {!isOOS && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700,
                    color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Quantity
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      display: "flex", alignItems: "center",
                      border: "2px solid #e5e7eb", borderRadius: 10, overflow: "hidden",
                    }}>
                      <button
                        onClick={() => setQty(q => Math.max(minQty, q - 1))}
                        style={{
                          width: 40, height: 40, border: "none", background: "#f9fafb",
                          cursor: "pointer", display: "flex", alignItems: "center",
                          justifyContent: "center", color: "#374151",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                        onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
                      ><Minus size={14} /></button>
                      <span style={{
                        minWidth: 48, textAlign: "center", fontSize: 15,
                        fontWeight: 800, color: "#111",
                        borderLeft: "1px solid #e5e7eb", borderRight: "1px solid #e5e7eb",
                        lineHeight: "40px",
                      }}>{qty}</span>
                      <button
                        onClick={() => setQty(q => Math.min(stock, q + 1))}
                        style={{
                          width: 40, height: 40, border: "none", background: "#f9fafb",
                          cursor: "pointer", display: "flex", alignItems: "center",
                          justifyContent: "center", color: "#374151",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                        onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
                      ><Plus size={14} /></button>
                    </div>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                      Total: <strong style={{ color: "#16a34a" }}>₹{(price * qty).toFixed(2)}</strong>
                    </span>
                  </div>
                  {minQty > 1 && (
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af" }}>
                      Minimum order quantity: {minQty}
                    </p>
                  )}
                </div>
              )}

              {/* CTA Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="pd-btn-cart" onClick={handleAddToCart}
                  disabled={isOOS || cartLoading}>
                  {cartLoading
                    ? <Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} />
                    : <ShoppingCart size={16} />
                  }
                  {cartLoading ? "Adding…" : "Add to Cart"}
                </button>
                <button className="pd-btn-buy" onClick={handleBuyNow}
                  disabled={isOOS || cartLoading}>
                  {isOOS ? "Unavailable" : "Buy Now"}
                </button>
              </div>

              {/* Attributes */}
              {product.attributes?.length > 0 && (
                <>
                  <div style={{ borderTop: "1px dashed #f0f0f0", margin: "18px 0 14px" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700,
                      color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Specifications
                    </p>
                    {product.attributes.map((attr, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center",
                        fontSize: 13, gap: 8, padding: "6px 0",
                        borderBottom: i < product.attributes.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                        <span style={{ color: "#9ca3af", fontWeight: 600, minWidth: 100,
                          flexShrink: 0, fontSize: 12 }}>{attr.key}</span>
                        <span style={{ color: "#374151", fontWeight: 700 }}>{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Description card ── */}
            {product.description && (
              <div style={card}>
                <h2 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#1a2332" }}>
                  About This Product
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.75,
                  whiteSpace: "pre-line" }}>
                  {product.description}
                </p>
              </div>
            )}

            {/* ── Related Products ── */}
{related.length > 0 && (
  <div style={{ marginTop: 8 }}>
    <h2 style={{
      margin: "0 0 16px", fontSize: isMobile ? 17 : 20,
      fontWeight: 900, color: "#1a2332",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      Related Products
    </h2>
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "repeat(2, 1fr)"
        : "repeat(4, 1fr)",
      gap: isMobile ? 10 : 14,
    }}>
      {related.map((rel) => {
        const rPrice    = rel.buyingPrice  ?? 0;
        const rOld      = rel.sellingPrice ?? null;
        const rDiscount = rOld && rOld > rPrice ? Math.round((1 - rPrice / rOld) * 100) : null;
        const rImg      = rel.thumbnail || rel.additionalImages?.[0];
        const rCat      = typeof rel.category === "object" ? rel.category?.name : rel.category || "";

        return (
          <div
            key={rel._id}
            onClick={() => {
              navigate(`/products/${rel.slug}`);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{
              background: "#fff", borderRadius: 14, overflow: "hidden",
              border: "1px solid #e8f5e9", boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s",
              display: "flex", flexDirection: "column", position: "relative",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(22,163,74,0.13)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {/* Discount badge */}
            {rDiscount && (
              <div style={{
                position: "absolute", top: 8, left: 8, zIndex: 2,
                background: "#ef4444", color: "#fff", fontSize: 10,
                fontWeight: 800, padding: "2px 7px", borderRadius: 5,
              }}>
                {rDiscount}% OFF
              </div>
            )}

            {/* Image */}
            <div style={{
              width: "100%", aspectRatio: "1 / 1",
              background: "#f9fafb", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {rImg
                ? <img src={rImg} alt={rel.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <Package size={36} color="#d1d5db" />
              }
            </div>

            {/* Info */}
            <div style={{ padding: "10px 10px 12px", flex: 1,
              display: "flex", flexDirection: "column", gap: 4 }}>
              {rCat && (
                <span style={{ fontSize: 9, fontWeight: 700, color: "#16a34a",
                  textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {rCat}
                </span>
              )}
              <p style={{
                margin: 0, fontSize: 12, fontWeight: 700, color: "#1a2332",
                lineHeight: 1.35, display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {rel.name}
              </p>
              <div style={{ display: "flex", alignItems: "center",
                gap: 5, marginTop: 2, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>
                  ₹{rPrice.toFixed(2)}
                </span>
                {rOld && rOld > rPrice && (
                  <span style={{ fontSize: 11, color: "#9ca3af",
                    textDecoration: "line-through" }}>
                    ₹{rOld.toFixed(2)}
                  </span>
                )}
                {rel.unit && (
                  <span style={{ fontSize: 10, color: "#9ca3af",
                    marginLeft: "auto" }}>
                    {rel.unit}
                  </span>
                )}
              </div>

              {/* Add to Cart button */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!isLoggedIn()) { navigate("/login"); return; }
                  try {
                    await addToCart(rel._id, 1);
                    window.dispatchEvent(new CustomEvent("cart-item-added"));
                    showToast(`${rel.name} added to cart!`, "success");
                  } catch {
                    showToast("Failed to add to cart", "error");
                  }
                }}
                style={{
                  marginTop: 6, width: "100%", padding: "8px 0",
                  border: "1.5px solid #16a34a", borderRadius: 8,
                  background: "#fff", color: "#16a34a",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 5,
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#16a34a";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#fff";
                  e.currentTarget.style.color = "#16a34a";
                }}
              >
                <ShoppingCart size={12} /> Add to Cart
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <Lightbox images={allImages} activeIdx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}