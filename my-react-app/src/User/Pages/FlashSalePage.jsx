import { useState, useEffect } from "react";
import { openLoginModal } from "../utils/authEvents";
import { addToCart, toggleWishlist, fetchWishlist } from "../utils/cartWishlist";
import { useNavigate } from "react-router-dom";


// ─── Responsive Hook ──────────────────────────────────────────────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

function useIsTablet(breakpoint = 1024) {
  const [isTablet, setIsTablet] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsTablet(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isTablet;
}

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

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="11" y1="18" x2="13" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const StarRating = ({ rating = 4 }) => (
  <span style={{ display: "flex", gap: 1 }}>
    {[1, 2, 3, 4, 5].map(i => <StarIcon key={i} filled={i <= rating} />)}
  </span>
);

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function calcTimeLeft(endDate, endTime) {
  if (!endDate) return { d: 0, h: 0, m: 0, s: 0 };
  const datePart = endDate.split("T")[0];
  const end = endTime ? new Date(`${datePart}T${endTime}:00`) : new Date(endDate);
  const diff = end - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

const CountdownTimer = ({ endDate, endTime, compact = false }) => {
  const [time, setTime] = useState(() => calcTimeLeft(endDate, endTime));

  useEffect(() => {
    setTime(calcTimeLeft(endDate, endTime));
    const t = setInterval(() => setTime(calcTimeLeft(endDate, endTime)), 1000);
    return () => clearInterval(t);
  }, [endDate, endTime]);

  const pad = n => String(n).padStart(2, "0");

  if (compact) {
    // Compact inline timer for mobile hero
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {[
          [time.d, "D"],
          [time.h, "H"],
          [time.m, "M"],
          [time.s, "S"],
        ].map(([val, label], idx) => (
          <span key={label}>
            <span style={{
              background: "rgba(255,255,255,0.18)", borderRadius: 6,
              padding: "4px 7px", fontSize: 15, fontWeight: 900, color: "#fff",
            }}>{pad(val)}</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: 700, marginLeft: 1 }}>{label}</span>
            {idx < 3 && <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 900, marginLeft: 3 }}>:</span>}
          </span>
        ))}
      </div>
    );
  }

  const box = (val, label) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 12px", minWidth: 48, fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{pad(val)}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 3, fontWeight: 600 }}>{label}</div>
    </div>
  );
  const sep = <div style={{ fontSize: 22, fontWeight: 900, color: "rgba(255,255,255,0.5)", alignSelf: "flex-start", paddingTop: 6 }}>:</div>;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
      {box(time.d, "DAYS")}{sep}{box(time.h, "HRS")}{sep}{box(time.m, "MIN")}{sep}{box(time.s, "SEC")}
    </div>
  );
};

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, discountBadge, compact = false }) => {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();   // ← ADD THIS LINE


  const price = product.price || product.buyingPrice || 0;
  const oldPrice = product.oldPrice || product.sellingPrice;
  const name = product.name || product.title || "Product";
  const unit = product.unit || product.weight || "1 KG";
  const image = product.image || product.thumbnail || product.images?.[0];
  const sold = product.sold || Math.floor(Math.random() * 200);
  const total = product.total || Math.floor(Math.random() * 300 + 100);
  const discountPct = oldPrice ? Math.round((1 - price / oldPrice) * 100) : discountBadge;
  const inStock = product.stock !== 0 && product.status !== "out-of-stock";

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

  return (
    <div
      onClick={() => product.slug && navigate(`/products/${product.slug}`)}  // ← ADD THIS
      style={{
        background: "#fff", borderRadius: 12,
        padding: compact ? "10px 10px 12px" : "12px 12px 14px",
        border: "1px solid #efefef",
        boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
        cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s",
        display: "flex", flexDirection: "column",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "relative", marginBottom: 10 }}>
        <div style={{ width: "100%", height: compact ? 130 : 180, background: "#f7f7f7", borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {image
            ? <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 40 }}>🛒</span>}
        </div>
        {discountPct > 0 && (
          <span style={{ position: "absolute", top: 8, left: 8, background: "#ff6b35", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 7px", borderRadius: 4 }}>
            {discountPct}% OFF
          </span>
        )}
        <button
          onClick={handleWishlist}
          style={{
            position: "absolute", top: 8, right: 8, background: "#fff",
            border: "none", borderRadius: "50%", width: 30, height: 30,
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <HeartIcon filled={wished} />
        </button>
      </div>

      <div style={{ fontSize: 10, color: "#2d9e2d", fontWeight: 700, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.3 }}>
        {typeof product.category === "object" ? (product.category?.name || "") : (product.category || "")}
      </div>

      <div style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: "#1a1a1a", marginBottom: 5, lineHeight: 1.35, minHeight: 34, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {name}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
        <StarRating rating={product.rating || 4} />
      </div>
      <div style={{ fontSize: 10, color: "#bbb", marginBottom: 8 }}>Sold: {sold}/{total}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: compact ? 13 : 15, fontWeight: 800, color: "#2d9e2d" }}>₹{price.toFixed(2)}</span>
        {oldPrice && <span style={{ fontSize: 11, color: "#ccc", textDecoration: "line-through" }}>₹{oldPrice.toFixed(2)}</span>}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#999" }}>{unit}</span>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!inStock}
        style={{
          width: "100%", padding: compact ? "8px 0" : "9px 0",
          background: added ? "#218c21" : inStock ? "#2d9e2d" : "#e8e8e8",
          color: inStock ? "#fff" : "#aaa", border: "none", borderRadius: 8,
          fontSize: 12, fontWeight: 700, cursor: inStock ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          transition: "background 0.2s", marginTop: 4, minHeight: 38,
        }}
        onMouseEnter={e => { if (inStock && !added) e.currentTarget.style.background = "#218c21"; }}
        onMouseLeave={e => { if (inStock && !added) e.currentTarget.style.background = "#2d9e2d"; }}
      >
        <CartIcon />
        {added ? "Added ✓" : inStock ? "Add to Cart" : "Out of Stock"}
      </button>
    </div>
  );
};

// ─── Category Section ─────────────────────────────────────────────────────────
const CategorySection = ({ categoryName, products, discountBadge, isMobile, isTablet }) => {
  const [expanded, setExpanded] = useState(true);

  const cols = isMobile ? 2 : isTablet ? 3 : 5;
  const defaultVisible = cols * 2; // show 2 rows by default
  const visible = expanded ? products : products.slice(0, defaultVisible);

  return (
    <div style={{ marginBottom: isMobile ? 28 : 44 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 10, borderBottom: "2px solid #f0f0f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 4, height: 22, background: "#2d9e2d", borderRadius: 2, flexShrink: 0 }} />
          <h3 style={{ margin: 0, fontSize: isMobile ? 14 : 17, fontWeight: 800, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{categoryName}</h3>
          <span style={{ background: "#e8f5e9", color: "#2d9e2d", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>
            {products.length}
          </span>
        </div>
        {products.length > defaultVisible && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ fontSize: 11, fontWeight: 600, color: "#2d9e2d", background: "none", border: "1px solid #2d9e2d", borderRadius: 6, padding: "4px 10px", cursor: "pointer", flexShrink: 0, marginLeft: 8, whiteSpace: "nowrap" }}
          >
            {expanded ? "Less" : `View All`}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 10 : 14 }}>
        {visible.map((p, i) => (
          <ProductCard key={p._id || i} product={p} discountBadge={discountBadge} compact={isMobile} />
        ))}
      </div>
    </div>
  );
};

// ─── Main Flash Sale Page ─────────────────────────────────────────────────────
export default function FlashSalePage({ flashSaleId, onBack }) {
  const isMobile = useIsMobile(768);
  const isTablet = useIsTablet(1024);

  const [flashSale, setFlashSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fsRes = await fetch("http://localhost:5000/api/flash/all");
        const fsData = await fsRes.json();
        const sales = fsData.sales || fsData.flashSales || fsData.data || [];
        const sale = flashSaleId
          ? sales.find(s => s._id === flashSaleId)
          : (sales.find(s => s.isActive) || sales[0]);
        setFlashSale(sale);

        let fetchedProducts = [];
        let page = 1, totalPages = 1;
        do {
          const res = await fetch(`http://localhost:5000/api/Products/allFree?page=${page}&limit=100`);
          const data = await res.json();
          const batch = Array.isArray(data) ? data : data.products || data.data || [];
          fetchedProducts = [...fetchedProducts, ...batch];
          totalPages = data.totalPages || 1;
          page++;
        } while (page <= totalPages);

        if (sale?.products?.length) {
          const flashIds = new Set(sale.products.map(id => typeof id === "object" ? id._id : id));
          const matched = fetchedProducts.filter(p => flashIds.has(p._id));
          setProducts(matched.length > 0 ? matched : fetchedProducts);
        } else {
          setProducts(fetchedProducts);
        }

        const catRes = await fetch("http://localhost:5000/api/Category/all");
        const catData = await catRes.json();
        const cats = Array.isArray(catData) ? catData : catData.categories || catData.data || [];
        setCategories(cats.filter(c => c.isActive));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [flashSaleId]);

  const getCategoryName = (product) => {
    if (!product.category) return "Other";
    if (typeof product.category === "object") return product.category.name || "Other";
    const cat = categories.find(c => c._id === product.category);
    return cat ? cat.name : "Other";
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || (p.name || p.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === "All" || getCategoryName(p) === activeCategory;
    return matchesSearch && matchesCat;
  });

  const grouped = filteredProducts.reduce((acc, p) => {
    const cat = getCategoryName(p);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const categoryCounts = products.reduce((acc, p) => {
    const cat = getCategoryName(p);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const sidebarCats = ["All", ...Object.keys(categoryCounts).sort()];

  const cols = isMobile ? 2 : isTablet ? 3 : 5;

  if (loading) {
    return (
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
          {[...Array(cols * 2)].map((_, i) => (
            <div key={i} style={{ height: 260, borderRadius: 12, background: "#f0f0f0", animation: "pulse 1.4s ease-in-out infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Sidebar content (shared between drawer & desktop) ──
  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Search */}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "10px 12px 10px 34px", borderRadius: 8, border: "1.5px solid #e0e0e0", fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box", minHeight: 44 }}
        />
        <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      {/* Category Filter */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #efefef", overflow: "hidden", boxShadow: "0 1px 5px rgba(0,0,0,0.05)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", fontSize: 13, fontWeight: 800, color: "#1a1a1a" }}>
          Categories
        </div>
        {sidebarCats.map(cat => {
          const count = cat === "All" ? products.length : (categoryCounts[cat] || 0);
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); if (isMobile) setSidebarOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", border: "none", background: isActive ? "#e8f5e9" : "transparent",
                borderLeft: isActive ? "3px solid #2d9e2d" : "3px solid transparent",
                cursor: "pointer", fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? "#2d9e2d" : "#555", transition: "all 0.15s", textAlign: "left",
                minHeight: 44,
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f5f5f5"; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <span>{cat}</span>
              <span style={{ background: isActive ? "#2d9e2d" : "#eee", color: isActive ? "#fff" : "#888", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Nunito', sans-serif; background: #f8f8f8; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
      `}</style>

      {/* ── Hero Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #0d4d0d 0%, #1a7a1a 50%, #2d9e2d 100%)",
        padding: isMobile ? "20px 0 0" : "32px 0 0",
        marginBottom: isMobile ? 20 : 32,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 280, height: 280, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -40, left: 200, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "0 14px" : "0 24px" }}>
          {/* Back button */}
          <button
            onClick={onBack}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: isMobile ? 16 : 24, transition: "background 0.2s", minHeight: 40 }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          >
            <BackIcon /> Back to Home
          </button>

          {isMobile ? (
            // ── Mobile Hero Layout ──
            <div style={{ paddingBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>⚡</span>
                <span style={{ background: "#ffe600", color: "#111", fontSize: 10, fontWeight: 900, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.8 }}>FLASH SALE</span>
                {flashSale?.minDiscount && (
                  <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
                    Up to {flashSale.minDiscount}% OFF
                  </span>
                )}
              </div>
              <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
                {flashSale?.name || "Flash Sale"}
              </h1>
              <p style={{ margin: "0 0 14px", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                {products.length} deals · {Object.keys(grouped).length} categories
              </p>
              {flashSale?.endDate && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
                    <ClockIcon /> Ends in
                  </div>
                  <CountdownTimer endDate={flashSale.endDate} endTime={flashSale.endTime} compact={true} />
                </div>
              )}
            </div>
          ) : (
            // ── Desktop Hero Layout ──
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24, paddingBottom: 28 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 28 }}>⚡</span>
                  <span style={{ background: "#ffe600", color: "#111", fontSize: 11, fontWeight: 900, padding: "3px 10px", borderRadius: 4, letterSpacing: 1 }}>FLASH SALE</span>
                  {flashSale?.minDiscount && (
                    <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4 }}>
                      Up to {flashSale.minDiscount}% OFF
                    </span>
                  )}
                </div>
                <h1 style={{ margin: "0 0 6px", fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: -0.5, textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
                  {flashSale?.name || "Flash Sale"}
                </h1>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  {products.length} deals across {Object.keys(grouped).length} categories
                </p>
              </div>
              {flashSale?.endDate && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, marginBottom: 10, justifyContent: "flex-end" }}>
                    <ClockIcon /> Sale ends in
                  </div>
                  <CountdownTimer endDate={flashSale.endDate} endTime={flashSale.endTime} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: isMobile ? "0 12px 48px" : "0 16px 48px", display: "flex", gap: isMobile ? 0 : 24, alignItems: "flex-start" }}>

        {/* ── Mobile: Filter Bar ── */}
        {isMobile && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300, background: "#fff", borderTop: "1px solid #efefef", padding: "10px 16px", display: "flex", gap: 10, boxShadow: "0 -2px 12px rgba(0,0,0,0.1)" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#f5f5f5", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700, color: "#1a1a1a", cursor: "pointer", minHeight: 44 }}
            >
              <FilterIcon /> Filter & Search
              {(activeCategory !== "All" || searchQuery) && (
                <span style={{ background: "#2d9e2d", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {(activeCategory !== "All" ? 1 : 0) + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>
            {(activeCategory !== "All" || searchQuery) && (
              <button
                onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
                style={{ padding: "10px 14px", background: "#fff0f0", border: "1.5px solid #ffd0d0", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#e74c3c", cursor: "pointer", minHeight: 44, whiteSpace: "nowrap" }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        )}

        {/* ── Mobile Sidebar Drawer ── */}
        {isMobile && (
          <>
            {sidebarOpen && (
              <div
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400 }}
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <div style={{
              position: "fixed", bottom: 0, left: 0, right: 0,
              maxHeight: "80vh", background: "#f8f8f8",
              zIndex: 401, borderRadius: "20px 20px 0 0",
              overflowY: "auto",
              transform: sidebarOpen ? "translateY(0)" : "translateY(100%)",
              transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
            }}>
              {/* Handle */}
              <div style={{ padding: "12px 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#f8f8f8", zIndex: 1, borderBottom: "1px solid #efefef", paddingBottom: 12 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a" }}>Filter Products</span>
                <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
                  <CloseIcon />
                </button>
              </div>
              <div style={{ padding: "16px 16px 100px" }}>
                <SidebarContent />
              </div>
            </div>
          </>
        )}

        {/* ── Desktop Sidebar ── */}
        {!isMobile && (
          <aside style={{ width: isTablet ? 180 : 220, flexShrink: 0, position: "sticky", top: 16 }}>
            <SidebarContent />
          </aside>
        )}

        {/* ── Main Content ── */}
        <main style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? 80 : 0 }}>
          {/* Result count + active filter */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 14 : 20, flexWrap: "wrap", gap: 8 }}>
            <p style={{ margin: 0, fontSize: isMobile ? 12 : 14, color: "#666" }}>
              <strong style={{ color: "#1a1a1a" }}>{filteredProducts.length}</strong> products
              {activeCategory !== "All" && <> in <strong style={{ color: "#2d9e2d" }}>{activeCategory}</strong></>}
              {searchQuery && <> for "<strong style={{ color: "#2d9e2d" }}>{searchQuery}</strong>"</>}
            </p>
            {!isMobile && (activeCategory !== "All" || searchQuery) && (
              <button
                onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
                style={{ fontSize: 12, color: "#888", background: "#f5f5f5", border: "1px solid #e0e0e0", borderRadius: 6, padding: "4px 12px", cursor: "pointer" }}
              >
                ✕ Clear filters
              </button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#bbb" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>No products found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Try a different category or search term</div>
            </div>
          ) : activeCategory === "All" ? (
            Object.entries(grouped).map(([catName, catProducts]) => (
              <CategorySection
                key={catName}
                categoryName={catName}
                products={catProducts}
                discountBadge={flashSale?.minDiscount}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            ))
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 10 : 14 }}>
              {filteredProducts.map((p, i) => (
                <ProductCard key={p._id || i} product={p} discountBadge={flashSale?.minDiscount} compact={isMobile} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}