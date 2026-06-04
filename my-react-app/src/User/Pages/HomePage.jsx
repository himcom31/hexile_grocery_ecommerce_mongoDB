import { useState, useEffect } from "react";
import FlashSalePage from "./FlashSalePage";
import { openLoginModal } from "../utils/authEvents";
import { addToCart, toggleWishlist, fetchWishlist } from "../utils/cartWishlist";
import { useNavigate } from "react-router-dom";

// ─── Responsive Hook ──────────────────────────────────────────────────────────
const useResponsive = () => {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return {
    isMobile: width < 600,
    isTablet: width >= 600 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#e74c3c" : "none"} stroke={filled ? "#e74c3c" : "#bbb"} strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const StarIcon = ({ filled }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill={filled ? "#f39c12" : "#ddd"} stroke={filled ? "#f39c12" : "#ddd"} strokeWidth="1">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
);
const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
);

const StarRating = ({ rating = 4 }) => (
  <span style={{ display: "flex", gap: 1 }}>
    {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} filled={i <= rating} />)}
  </span>
);

// ─── Hero Banner ──────────────────────────────────────────────────────────────
const HeroBanner = () => {
  const { isMobile, isTablet } = useResponsive();
  const [slide, setSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const slides = [{ image: "/1.jpg" }, { image: "/2.jpg" }, { image: "/3.jpg" }];

  const goTo = (i) => {
    if (i === slide || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => { setSlide(i); setIsTransitioning(false); }, 300);
  };

  useEffect(() => {
    const t = setInterval(() => goTo((slide + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slide]);

  const height = isMobile ? 200 : isTablet ? 320 : 550;

  return (
    <div style={{
      position: "relative", width: "100%", height, borderRadius: isMobile ? 8 : 10,
      overflow: "hidden", marginBottom: isMobile ? 32 : isTablet ? 48 : 98,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
    }}>
      <img
        key={slide} src={slides[slide].image} alt="banner"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: isTransitioning ? 0 : 1, transition: "opacity 0.4s ease" }}
      />
      <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "flex-end", padding: isMobile ? "0 16px 16px" : "0 48px 32px" }}>
        <div style={{ display: "flex", gap: 5 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              width: i === slide ? 22 : 8, height: 8, borderRadius: 4,
              background: i === slide ? "#fff" : "rgba(255,255,255,0.45)",
              border: "none", cursor: "pointer", transition: "width 0.3s", padding: 0
            }} />
          ))}
        </div>
      </div>
      <button
        onClick={() => goTo((slide - 1 + slides.length) % slides.length)}
        style={{
          position: "absolute", top: "50%", left: isMobile ? 6 : 12, transform: "translateY(-50%)",
          width: isMobile ? 26 : 32, height: isMobile ? 26 : 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)",
          color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}><ChevronLeft /></button>
      <button
        onClick={() => goTo((slide + 1) % slides.length)}
        style={{
          position: "absolute", top: "50%", right: isMobile ? 6 : 12, transform: "translateY(-50%)",
          width: isMobile ? 26 : 32, height: isMobile ? 26 : 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.4)",
          color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
        }}><ChevronRight /></button>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ title, onPrev, onNext }) => {
  const { isMobile } = useResponsive();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h2 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{title}</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#2d9e2d", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>View All</span>
        {onPrev && (
          <>
            <button onClick={onPrev} style={navBtnStyle}><ChevronLeft /></button>
            <button onClick={onNext} style={navBtnStyle}><ChevronRight /></button>
          </>
        )}
      </div>
    </div>
  );
};

const navBtnStyle = {
  width: 26, height: 26, borderRadius: 4, border: "1px solid #ddd",
  background: "#fff", cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center", padding: 0
};

const categoryEmojis = ["🥦", "🐟", "🍎", "🥩", "🧀", "🍞", "🌶️", "🫒", "🥚"];

// ─── Feature Categories ───────────────────────────────────────────────────────
const FeatureCategories = ({ categories, loading, products }) => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [start, setStart] = useState(0);

  const visible = isMobile ? 3 : isTablet ? 4 : 6;
  const total = categories.length;

  const getCount = (catId) =>
    products.filter(p => {
      const cid = typeof p.category === "object" ? p.category?._id : p.category;
      return cid === catId;
    }).length;

  const handleCategoryClick = (catId) => navigate(`/user/product?categories=${catId}`);

  const cols = `repeat(${Math.min(total || visible, visible)}, 1fr)`;

  return (
    <section id="feature-categories" style={{ marginBottom: isMobile ? 32 : isTablet ? 48 : 98, scrollMarginTop: 80 }}>
      <SectionHeader
        title="Feature Category"
        onPrev={() => setStart(s => Math.max(0, s - 1))}
        onNext={() => setStart(s => Math.min(Math.max(0, total - visible), s + 1))}
      />
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: isMobile ? 8 : 14 }}>
          {[...Array(visible)].map((_, i) => (
            <div key={i} style={{ height: isMobile ? 120 : 200, borderRadius: 12, background: "#f0f0f0", animation: "pulse 1.4s ease-in-out infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: isMobile ? 8 : 14 }}>
          {categories.slice(start, start + visible).map((cat, i) => {
            const img = cat.thumbnail || cat.image;
            return (
              <div
                key={cat._id || i}
                onClick={() => handleCategoryClick(cat._id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: isMobile ? "10px 6px 10px" : "16px 12px 14px",
                  background: "#fff", borderRadius: 16, border: "5px solid #efefef",
                  cursor: "pointer", transition: "border 0.2s, box-shadow 0.2s",
                  boxShadow: "0 2px 9px rgba(0,0,0,0.07)"
                }}
                onMouseEnter={e => { e.currentTarget.style.border = "1.5px solid #2d9e2d"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(45,158,45,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.border = "5px solid #efefef"; e.currentTarget.style.boxShadow = "0 2px 9px rgba(0,0,0,0.07)"; }}
              >
                <div style={{
                  width: "100%", height: isMobile ? 70 : 150,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: isMobile ? 6 : 14, overflow: "hidden"
                }}>
                  {img
                    ? <img src={img} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
                    : <div style={{ fontSize: isMobile ? 32 : 60 }}>{categoryEmojis[i % categoryEmojis.length]}</div>
                  }
                </div>
                <div style={{ fontSize: isMobile ? 11 : 14, fontWeight: 700, color: "#1a1a1a", textAlign: "center", marginBottom: 2 }}>{cat.name}</div>
                <div style={{ fontSize: isMobile ? 10 : 12, color: "#888" }}>{getCount(cat._id)} Items</div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

// ─── Promo Banners ────────────────────────────────────────────────────────────
const PromoBanners = () => {
  const { isMobile, isTablet } = useResponsive();
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/ad/")
      .then(r => r.json())
      .then(data => setAds((data.ads || []).filter(a => a.isActive)))
      .catch(() => { });
  }, []);

  const fallbacks = [
    { bg: "#1a1a1a", emoji: "🥬", tag: "Fresh & healthy", label: "For home delivery", badge: "20% off", color: "#4caf50" },
    { bg: "#e67e22", emoji: "🛒", tag: "GROCERY", label: "SALE", sub: "BEST VEGETABLE ONLINE", badge: "SAVE 50%", color: "#fff" },
    { bg: "linear-gradient(135deg,#1a6b1a,#4caf50)", emoji: "🍅", tag: "Limited", label: "Fresh", sub: "Daily", badge: "50%", color: "#ffe600" },
  ];

  const items = ads.length > 0 ? ads : fallbacks;
  const cols = isMobile ? "1fr" : isTablet ? "1fr 1fr" : `repeat(${Math.min(items.length, 3)}, 1fr)`;
  const bannerHeight = isMobile ? 160 : isTablet ? 220 : 320;

  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: isMobile ? 10 : 20, marginBottom: isMobile ? 32 : isTablet ? 48 : 98 }}>
      {items.slice(0, isMobile ? 2 : 3).map((item, i) => {
        if (item.image) {
          return (
            <div
              key={item._id || i}
              style={{
                borderRadius: 10, overflow: "hidden", cursor: "pointer",
                position: "relative", boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                transition: "transform 0.2s", background: "#111"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <img src={item.image} alt={item.title} style={{ width: "100%", height: bannerHeight, objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.65))", padding: "18px 12px 10px" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", textAlign: "center" }}>{item.title}</div>
              </div>
            </div>
          );
        }
        return (
          <div
            key={i}
            style={{
              background: item.bg, borderRadius: 10, padding: isMobile ? "16px 14px" : "22px 20px",
              minHeight: isMobile ? 120 : 140, display: "flex", flexDirection: "column",
              justifyContent: "space-between", cursor: "pointer", overflow: "hidden",
              position: "relative", transition: "transform 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: isMobile ? 36 : 52, opacity: 0.25 }}>{item.emoji}</div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>{item.tag}</div>
              <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{item.label}</div>
              {item.sub && <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, color: "#fff", opacity: 0.85 }}>{item.sub}</div>}
            </div>
            <div style={{
              display: "inline-block", background: item.color,
              color: item.color === "#fff" ? "#e67e22" : "#000",
              fontWeight: 800, fontSize: 12, padding: "3px 10px", borderRadius: 4, alignSelf: "flex-start"
            }}>{item.badge}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product }) => {
    const navigate = useNavigate();   // ← ADD THIS LINE

  const { isMobile } = useResponsive();
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  const price = product.price || product.buyingPrice || 0;
  const oldPrice = product.oldPrice || product.sellingPrice;
  const name = product.name || product.title || "Product";
  const unit = product.unit || product.weight || "1 KG";
  const image = product.image || product.thumbnail || product.images?.[0];
  const stock = product.stockQuantity ?? 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 10;

  const isLoggedIn = () => !!localStorage.getItem("userToken");

  useEffect(() => {
    if (!isLoggedIn()) return;
    fetchWishlist()
      .then(data => {
        const ids = (data.products || []).map(p => p._id || p);
        setWished(ids.includes(product._id));
      })
      .catch(() => { });
  }, [product._id]);

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) { openLoginModal(); return; }
    if (loading) return;
    setLoading(true);
    try {
      await addToCart(product._id);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch {
      alert("Failed to add to cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) { openLoginModal(); return; }
    try {
      await toggleWishlist(product._id, wished);
      setWished(w => !w);
    } catch {
      alert("Failed to update wishlist. Please try again.");
    }
  };

  const imgHeight = isMobile ? 120 : 170;

  return (
    <div
      onClick={() => product.slug && navigate(`/products/${product.slug}`)}  // ← ADD THIS
      style={{
        background: "#fff", borderRadius: 10, padding: isMobile ? "8px 8px 10px" : "10px 10px 12px",
        border: "1px solid #efefef", boxShadow: "0 1px 5px rgba(0,0,0,0.06)",
        cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s",
        display: "flex", flexDirection: "column"
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.11)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 5px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "relative", marginBottom: 8 }}>
        <div style={{
          width: "100%", height: imgHeight, background: "#f5f5f5",
          borderRadius: 7, overflow: "hidden", display: "flex",
          alignItems: "center", justifyContent: "center"
        }}>
          {image
            ? <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 40 }}>🛒</span>
          }
        </div>
        {oldPrice && (
          <span style={{
            position: "absolute", top: 6, left: 6, background: "#ff6b35",
            color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 3
          }}>
            {Math.round((1 - price / oldPrice) * 100)}% off
          </span>
        )}
        <button
          onClick={handleWishlist}
          style={{
            position: "absolute", top: 6, right: 6, background: "#fff",
            border: "none", borderRadius: "50%", width: 26, height: 26,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.13)"
          }}>
          <HeartIcon filled={wished} />
        </button>
      </div>

      <div style={{ fontSize: 10, color: "#2d9e2d", fontWeight: 600, marginBottom: 2 }}>
        {typeof product.category === "object" ? (product.category?.name || "") : (product.category || "")}
      </div>
      <div style={{
        fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#1a1a1a",
        marginBottom: 4, lineHeight: 1.35, minHeight: isMobile ? 28 : 32,
        overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
      }}>
        {name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
        <StarRating rating={product.rating || 4} />
      </div>
      <div style={{ fontSize: 10, marginBottom: 6, color: isOutOfStock ? "#e74c3c" : isLowStock ? "#e67e22" : "#bbb" }}>
        {isOutOfStock ? "❌ Out of Stock" : isLowStock ? `⚠️ Only ${stock} left` : `✅ In Stock: ${stock}`}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, color: "#2d9e2d" }}>₹{price.toFixed(2)}</span>
        {oldPrice && <span style={{ fontSize: 11, color: "#ccc", textDecoration: "line-through" }}>₹{oldPrice.toFixed(2)}</span>}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#999" }}>{unit}</span>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        style={{
          width: "100%", padding: "7px 0",
          background: isOutOfStock ? "#ccc" : "#2d9e2d",
          color: "#fff", border: "none", borderRadius: 6, fontSize: 11,
          fontWeight: 700, cursor: isOutOfStock ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          transition: "background 0.2s", marginTop: "auto"
        }}
        onMouseEnter={e => { if (!isOutOfStock) e.currentTarget.style.background = "#218c21"; }}
        onMouseLeave={e => { if (!isOutOfStock) e.currentTarget.style.background = "#2d9e2d"; }}
      >
        <CartIcon /> {isOutOfStock ? "Out of Stock" : "Add To Cart"}
      </button>
    </div>
  );
};

// ─── Popular Products ─────────────────────────────────────────────────────────
const PopularProducts = ({ products, loading, onFlashSaleClick }) => {
  const { isMobile, isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState("All");
  const [categories, setCategories] = useState([]);
  const [flashSale, setFlashSale] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/Category/all")
      .then(r => r.json())
      .then(data => {
        const cats = Array.isArray(data) ? data : data.categories || data.data || [];
        setCategories(cats.filter(c => c.isActive));
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/flash/all")
      .then(r => r.json())
      .then(data => {
        const sales = data.sales || data.flashSales || data.data || [];
        const active = sales.find(s => s.isActive) || sales[0];
        if (active) setFlashSale(active);
      })
      .catch(() => { });
  }, []);

  const tabLabels = ["All", ...categories.map(c => c.name)];

  const getProductCatId = (p) => {
    if (!p.category) return "";
    if (typeof p.category === "object") return p.category._id || "";
    return p.category;
  };

  const getDisplayedProducts = () => {
    if (activeTab === "All") {
      const result = [];
      categories.forEach(cat => {
        products.filter(p => getProductCatId(p) === cat._id).slice(0, 2).forEach(p => result.push(p));
      });
      return result.length > 0 ? result.slice(0, 8) : products.slice(0, 8);
    }
    const selectedCat = categories.find(c => c.name === activeTab);
    if (!selectedCat) return [];
    return products.filter(p => getProductCatId(p) === selectedCat._id).slice(0, 8);
  };

  const displayedProducts = getDisplayedProducts();
  const discountBadge = flashSale?.minDiscount;
  const productCols = isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(4, 1fr)";

  return (
    <section id="popular-product" style={{ marginBottom: isMobile ? 32 : 36 }}>
      <SectionHeader title="Popular Products" />

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto",
        marginBottom: 16, paddingBottom: 2, scrollbarWidth: "none", WebkitOverflowScrolling: "touch"
      }}>
        {tabLabels.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer", transition: "all 0.2s",
              border: "1px solid " + (activeTab === t ? "#2d9e2d" : "#ddd"),
              background: activeTab === t ? "#2d9e2d" : "#fff",
              color: activeTab === t ? "#fff" : "#555",
            }}
          >{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: productCols, gap: 10 }}>
          {[...Array(isMobile ? 4 : 5)].map((_, i) => (
            <div key={i} style={{ height: 280, background: "#f0f0f0", borderRadius: 8, animation: "pulse 1.4s ease-in-out infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "290px 1fr",
          gap: 14, alignItems: "stretch"
        }}>
          {/* Flash Sale Card */}
          <div
            onClick={() => onFlashSaleClick(flashSale?._id || null)}
            style={{
              borderRadius: 14, overflow: "hidden", position: "relative",
              background: "#1a5c1a", boxShadow: "0 4px 18px rgba(0,0,0,0.18)",
              cursor: "pointer", minHeight: isMobile ? 200 : isTablet ? 240 : 420,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.015)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.28)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,0.18)"; }}
          >
            {(flashSale?.thumbnail || flashSale?.image) ? (
              <img
                src={flashSale.thumbnail || flashSale.image}
                alt={flashSale.name || "Flash Sale"}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a7a1a 0%, #0d4d0d 100%)" }} />
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.70) 100%)" }} />

            {discountBadge && (
              <div style={{
                position: "absolute", top: 16, left: 16, zIndex: 2,
                width: 66, height: 66, borderRadius: "50%", background: "#2d9e2d",
                border: "2.5px solid rgba(255,255,255,0.7)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{discountBadge}%</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.9)", lineHeight: 1.2 }}>OFF</span>
              </div>
            )}

            <div style={{
              position: "absolute", top: 14, right: 14, zIndex: 2,
              background: "rgba(255,230,0,0.18)", border: "1px solid rgba(255,230,0,0.4)",
              borderRadius: 6, padding: "4px 10px", fontSize: 10,
              fontWeight: 700, color: "#ffe600", letterSpacing: 0.5
            }}>
              TAP TO EXPLORE →
            </div>

            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: isMobile ? "16px 14px 14px" : "28px 20px 22px", zIndex: 2 }}>
              <div style={{
                fontSize: isMobile ? 20 : 28, fontWeight: 900, color: "#fff",
                lineHeight: 1.15, marginBottom: 6, letterSpacing: -0.5,
                textShadow: "0 2px 8px rgba(0,0,0,0.5)"
              }}>
                <span style={{ color: "#ffe600" }}>⚡</span> {flashSale?.name || "Flash Sale"}
              </div>
              {flashSale?.endDate && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginBottom: 14 }}>
                  Ends: {new Date(flashSale.endDate).toLocaleDateString()}{flashSale.endTime ? ` at ${flashSale.endTime}` : ""}
                </div>
              )}
              <button
                onClick={e => { e.stopPropagation(); onFlashSaleClick(flashSale?._id || null); }}
                style={{
                  width: "100%", padding: "12px 0", background: "#ffe600", color: "#111",
                  border: "none", borderRadius: 8, fontWeight: 900, fontSize: 14,
                  cursor: "pointer", letterSpacing: 0.5, transition: "opacity 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
              >
                ORDER NOW ⚡
              </button>
              <div style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 10 }}>www.readygrocery.com</div>
            </div>
          </div>

          {/* Product Grid */}
          <div style={{ display: "grid", gridTemplateColumns: productCols, gridAutoRows: "1fr", gap: 10 }}>
            {displayedProducts.length > 0
              ? displayedProducts.map((p, i) => <ProductCard key={p._id || i} product={p} />)
              : <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "#bbb", fontSize: 14 }}>No products found.</div>
            }
          </div>
        </div>
      )}
    </section>
  );
};

// ─── Stats Bar ────────────────────────────────────────────────────────────────
const StatsBar = () => {
  const { isMobile } = useResponsive();

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",  // always 3 columns
      background: "#f9fdf9",
      borderRadius: 10,
      border: "1px solid #e8f5e9",
      marginBottom: isMobile ? 16 : 28,
      overflow: "hidden",
    }}>
      {[
        { emoji: "👥", stat: "90%",  label: "User Positive Feedback" },
        { emoji: "🕐", stat: "24/7", label: "Online Support"          },
        { emoji: "🔒", stat: "48+",  label: "Secure Payment Gateways" },
      ].map((item, i) => (
        <div
          key={i}
          style={{
            padding: isMobile ? "12px 6px" : "24px 20px",
            borderRight: i < 2 ? "1px solid #e8f5e9" : "none",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",  // stack on mobile
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 4 : 14,
            textAlign: isMobile ? "center" : "left",
          }}
        >
          <span style={{ fontSize: isMobile ? 20 : 32, opacity: 0.7 }}>
            {item.emoji}
          </span>
          <div>
            <div style={{
              fontSize: isMobile ? 15 : 22,
              fontWeight: 800,
              color: "#2d9e2d",
              lineHeight: 1.2,
            }}>
              {item.stat}
            </div>
            <div style={{
              fontSize: isMobile ? 10 : 12,
              color: "#666",
              lineHeight: 1.3,
              wordBreak: "break-word",    // prevents overflow on tiny screens
            }}>
              {item.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Just For You ─────────────────────────────────────────────────────────────
const JustForYou = ({ products, loading }) => {
  const { isMobile, isTablet } = useResponsive();
  const [page, setPage] = useState(0);
  const perPage = 12;
  const paginated = products.slice(page * perPage, (page + 1) * perPage);
  const cols = isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(6, 1fr)";

  return (
    <section style={{ marginBottom: 28 }}>
      <SectionHeader title="Just For You" />
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 10 }}>
          {[...Array(isMobile ? 4 : 12)].map((_, i) => (
            <div key={i} style={{ height: 240, background: "#f0f0f0", borderRadius: 8, animation: "pulse 1.4s ease-in-out infinite" }} />
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: 10 }}>
            {paginated.map((p, i) => <ProductCard key={p._id || i} product={p} />)}
          </div>
          {products.length > perPage && (
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button
                onClick={() => setPage(pg => pg + 1)}
                style={{
                  padding: "10px 40px", background: "#fff", border: "1px solid #2d9e2d",
                  color: "#2d9e2d", borderRadius: 5, fontWeight: 600, fontSize: 13,
                  cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#2d9e2d"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#2d9e2d"; }}
              >Load More Products</button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { isMobile } = useResponsive();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [prodLoading, setProdLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(null);
  const [flashSaleId, setFlashSaleId] = useState(null);

  useEffect(() => {
    if (window.location.hash === "#feature-categories") {
      const timer = setTimeout(() => {
        const el = document.getElementById("feature-categories");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/Category/all")
      .then(r => r.json())
      .then(data => { setCategories(Array.isArray(data) ? data : data.categories || data.data || []); setCatLoading(false); })
      .catch(() => { setCatLoading(false); setError("Could not load categories."); });

    const fetchAllProducts = async () => {
      try {
        let allProducts = [], p = 1, totalPages = 1;
        do {
          const res = await fetch(`http://localhost:5000/api/Products/allFree?page=${p}&limit=100`);
          const data = await res.json();
          const batch = Array.isArray(data) ? data : data.products || data.data || [];
          allProducts = [...allProducts, ...batch];
          totalPages = data.totalPages || 1;
          p++;
        } while (p <= totalPages);
        setProducts(allProducts);
      } catch (err) {
        console.error(err);
      } finally {
        setProdLoading(false);
      }
    };
    fetchAllProducts();
  }, []);

  const handleFlashSaleClick = (id) => {
    setFlashSaleId(id);
    setPage("flash");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setPage(null);
    setFlashSaleId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Nunito', sans-serif; }

        /* Hide scrollbar for tab row */
        ::-webkit-scrollbar { display: none; }

        /* Touch-friendly tap targets */
        button { touch-action: manipulation; }

        /* Responsive image safety */
        img { max-width: 100%; }
      `}</style>

      {page === "flash" && (
        <FlashSalePage flashSaleId={flashSaleId} onBack={handleBack} />
      )}

      {page === null && (
        <div style={{
          maxWidth: 1400, margin: "0 auto",
          padding: isMobile ? "10px 10px 0" : "16px 16px 0"
        }}>
          {error && (
            <div style={{
              background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 6,
              padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#856404"
            }}>⚠️ {error}</div>
          )}
          <HeroBanner />
          <FeatureCategories categories={categories} loading={catLoading} products={products} />
          <PromoBanners />
          <PopularProducts products={products} loading={prodLoading} onFlashSaleClick={handleFlashSaleClick} />
          <StatsBar />
          <JustForYou products={products} loading={prodLoading} />
        </div>
      )}
    </>
  );
}