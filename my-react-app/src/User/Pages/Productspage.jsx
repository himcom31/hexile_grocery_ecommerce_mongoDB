// src/Pages/ProductsPage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { openLoginModal } from "../utils/authEvents";
import { addToCart, toggleWishlist, fetchWishlist } from "../utils/cartWishlist";

// ─── Google Font ──────────────────────────────────────────────────────────────
const FontLink = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');`}</style>
);

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, stroke = "currentColor", fill = "none", strokeWidth = 2, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const SearchIcon    = (p) => <Icon size={p.size||16} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" {...p}/>;
const FilterIcon    = (p) => <Icon size={p.size||16} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" {...p}/>;
const GridIcon      = (p) => <Icon size={p.size||16} d={["M3 3h7v7H3z","M14 3h7v7h-7z","M14 14h7v7h-7z","M3 14h7v7H3z"]} {...p}/>;
const ListIcon      = (p) => <Icon size={p.size||16} d={["M8 6h13","M8 12h13","M8 18h13","M3 6h.01","M3 12h.01","M3 18h.01"]} {...p}/>;
const HeartIcon     = ({ filled, ...p }) => <Icon size={p.size||16} fill={filled?"#e74c3c":"none"} stroke={filled?"#e74c3c":"currentColor"} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" {...p}/>;
const CartIcon      = (p) => <Icon size={p.size||16} d={["M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z","M3 6h18","M16 10a4 4 0 01-8 0"]} {...p}/>;
const ChevronDown   = (p) => <Icon size={p.size||14} d="M6 9l6 6 6-6" {...p}/>;
const ChevronUp     = (p) => <Icon size={p.size||14} d="M18 15l-6-6-6 6" {...p}/>;
const XIcon         = (p) => <Icon size={p.size||14} d="M18 6L6 18M6 6l12 12" {...p}/>;
const StarFilled    = (p) => <Icon size={p.size||12} fill="#f39c12" stroke="#f39c12" strokeWidth={1} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" {...p}/>;
const SortIcon      = (p) => <Icon size={p.size||16} d={["M3 6h18","M7 12h10","M10 18h4"]} {...p}/>;
const TagIcon       = (p) => <Icon size={p.size||14} d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" {...p}/>;
const PackageIcon   = (p) => <Icon size={p.size||14} d={["M16.5 9.4l-9-5.19","M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z","M3.27 6.96L12 12.01l8.73-5.05","M12 22.08V12"]} {...p}/>;
const CloseIcon     = (p) => <Icon size={p.size||20} d="M18 6L6 18M6 6l12 12" {...p}/>;

// ─── Star Rating ──────────────────────────────────────────────────────────────
const StarRating = ({ rating = 4, size = 12 }) => (
  <span style={{ display:"flex", gap:1 }}>
    {[1,2,3,4,5].map(i => (
      <svg key={i} width={size} height={size} viewBox="0 0 24 24"
        fill={i<=rating?"#f39c12":"#e0e0e0"} stroke={i<=rating?"#f39c12":"#e0e0e0"} strokeWidth="1">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ))}
  </span>
);

// ─── Collapsible Filter Section ───────────────────────────────────────────────
const FilterSection = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom:"1px solid #f0f0f0", paddingBottom: open?16:0, marginBottom:16 }}>
      <button onClick={() => setOpen(o=>!o)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", background:"none", border:"none", cursor:"pointer", padding:"0 0 12px", color:"#1a1a1a" }}>
        <span style={{ display:"flex", alignItems:"center", gap:7, fontSize:13, fontWeight:700, letterSpacing:0.3 }}>
          {icon} {title}
        </span>
        {open ? <ChevronUp size={13} stroke="#999"/> : <ChevronDown size={13} stroke="#999"/>}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

// ─── Checkbox Filter Row ──────────────────────────────────────────────────────
const CheckRow = ({ label, count, checked, onChange }) => (
  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"5px 0", userSelect:"none" }}>
    <span style={{
      width:18, height:18, borderRadius:4, border:`2px solid ${checked?"#2d9e2d":"#ddd"}`,
      background: checked?"#2d9e2d":"#fff", display:"flex", alignItems:"center", justifyContent:"center",
      transition:"all 0.15s", flexShrink:0,
    }} onClick={onChange}>
      {checked && <svg width="10" height="10" viewBox="0 0 9 9"><polyline points="1.5 4.5 3.5 6.5 7.5 2.5" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </span>
    <span style={{ fontSize:14, color:"#444", flex:1 }}>{label}</span>
    {count!=null && <span style={{ fontSize:11, color:"#bbb", background:"#f5f5f5", borderRadius:10, padding:"1px 7px" }}>{count}</span>}
  </label>
);

// ─── Price Range Slider ───────────────────────────────────────────────────────
const PriceSlider = ({ min, max, value, onChange }) => {
  const [localVal, setLocalVal] = useState(value);
  useEffect(() => setLocalVal(value), [value]);
  const pct = ((localVal - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
        <span style={{ fontSize:12, color:"#888" }}>₹{min}</span>
        <span style={{ fontSize:13, fontWeight:700, color:"#2d9e2d" }}>Up to ₹{localVal}</span>
        <span style={{ fontSize:12, color:"#888" }}>₹{max}</span>
      </div>
      <div style={{ position:"relative", height:24, display:"flex", alignItems:"center" }}>
        <div style={{ position:"absolute", left:0, right:0, height:4, background:"#e8e8e8", borderRadius:2 }}/>
        <div style={{ position:"absolute", left:0, width:pct+"%", height:4, background:"#2d9e2d", borderRadius:2 }}/>
        <input type="range" min={min} max={max} value={localVal}
          onChange={e => setLocalVal(Number(e.target.value))}
          onMouseUp={() => onChange(localVal)} onTouchEnd={() => onChange(localVal)}
          style={{ position:"absolute", width:"100%", opacity:0, cursor:"pointer", height:24, zIndex:2 }}/>
        <div style={{
          position:"absolute", left:`calc(${pct}% - 12px)`,
          width:24, height:24, borderRadius:"50%", background:"#2d9e2d",
          border:"3px solid #fff", boxShadow:"0 1px 6px rgba(45,158,45,0.4)", pointerEvents:"none",
        }}/>
      </div>
    </div>
  );
};

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = ({ product, view = "grid", isMobile = false }) => {
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();   // ← ADD THIS LINE


  const price    = product.price || product.buyingPrice || 0;
  const oldPrice = product.oldPrice || product.sellingPrice;
  const name     = product.name || product.title || "Product";
  const unit     = product.unit || product.weight || "";
  const image    = product.image || product.thumbnail || product.images?.[0];
  const catName  = typeof product.category==="object" ? product.category?.name : product.category || "";
  const rating   = product.rating || 4;
  const reviews  = product.reviews || Math.floor(Math.random()*120+5);
  const discount = oldPrice ? Math.round((1-price/oldPrice)*100) : null;
  const stock    = product.stockQuantity ?? 0;
  const inStock  = stock > 0;
  const isLowStock = stock > 0 && stock <= 10;
  const isLoggedIn = () => !!localStorage.getItem("userToken");

  useEffect(() => {
    if (!isLoggedIn()) return;
    fetchWishlist().then(data => {
      const ids = (data.products||[]).map(p=>p._id||p);
      setWished(ids.includes(product._id));
    }).catch(()=>{});
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
    } catch { alert("Failed to add to cart."); }
    finally { setLoading(false); }
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) { openLoginModal(); return; }
    try {
      await toggleWishlist(product._id, wished);
      setWished(w=>!w);
    } catch { alert("Failed to update wishlist."); }
  };

  // ── List view ──
  if (view === "list") {
    return (
      <div style={{
        display:"flex", gap:isMobile?10:16, background:"#fff", borderRadius:12,
        border:"1px solid #f0f0f0", boxShadow:"0 1px 6px rgba(0,0,0,0.05)",
        padding: isMobile ? "10px" : "14px",
        transition:"box-shadow 0.2s,transform 0.2s", cursor:"pointer", animation:"fadeIn 0.3s ease",
      }}>
        <div style={{ position:"relative", width: isMobile?90:120, height: isMobile?90:120, flexShrink:0, borderRadius:8, overflow:"hidden", background:"#f8f8f8" }}>
          {image ? <img src={image} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:30, display:"flex", alignItems:"center", justifyContent:"center", height:"100%" }}>🛒</span>}
          {discount && <span style={{ position:"absolute", top:4, left:4, background:"#ff6b35", color:"#fff", fontSize:8, fontWeight:800, padding:"2px 5px", borderRadius:3 }}>{discount}%</span>}
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:3, minWidth:0 }}>
          <div style={{ fontSize:10, color:"#2d9e2d", fontWeight:600 }}>{catName}</div>
          <div style={{ fontSize: isMobile?12:14, fontWeight:700, color:"#1a1a1a", lineHeight:1.35, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <StarRating rating={rating} size={isMobile?10:12}/>
            <span style={{ fontSize:10, color:"#999" }}>({reviews})</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:"auto", paddingTop:4 }}>
            <span style={{ fontSize: isMobile?15:18, fontWeight:800, color:"#2d9e2d" }}>₹{price.toFixed(2)}</span>
            {oldPrice && <span style={{ fontSize:10, color:"#ccc", textDecoration:"line-through" }}>₹{oldPrice.toFixed(2)}</span>}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", justifyContent:"space-between", flexShrink:0, gap:6 }}>
          <button onClick={handleWishlist} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}>
            <HeartIcon filled={wished} size={isMobile?16:18} stroke={wished?"#e74c3c":"#ccc"}/>
          </button>
          <button onClick={handleAddToCart} disabled={!inStock} style={{
            padding: isMobile?"7px 10px":"8px 14px",
            background: added?"#218c21": inStock?"#2d9e2d":"#e0e0e0",
            color: inStock?"#fff":"#aaa", border:"none", borderRadius:8,
            fontSize: isMobile?11:12, fontWeight:700, cursor: inStock?"pointer":"not-allowed",
            display:"flex", alignItems:"center", gap:4, whiteSpace:"nowrap",
          }}>
            <CartIcon size={12} stroke={inStock?"#fff":"#aaa"}/>
            {isMobile ? (added?"✓":"Add") : (added?"Added!":"Add to Cart")}
          </button>
        </div>
      </div>
    );
  }

  // ── Grid view ──
  return (
    <div
      onClick={() => product.slug && navigate(`/products/${product.slug}`)}  // ← ADD THIS
     style={{
      
      background:"#fff", borderRadius:12, border:"1px solid #f0f0f0",
      boxShadow:"0 1px 6px rgba(0,0,0,0.05)", cursor:"pointer",
      transition:"box-shadow 0.2s,transform 0.2s", display:"flex", flexDirection:"column",
      overflow:"hidden", animation:"fadeIn 0.3s ease",
    }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 22px rgba(0,0,0,0.11)";e.currentTarget.style.transform="translateY(-3px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,0.05)";e.currentTarget.style.transform="translateY(0)";}}
    >
      <div style={{ position:"relative" }}>
        <div style={{ width:"100%", height: isMobile?150:190, background:"#f8f8f8", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {image ? <img src={image} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover", transition:"transform 0.4s" }}
            onMouseEnter={e=>e.target.style.transform="scale(1.06)"}
            onMouseLeave={e=>e.target.style.transform="scale(1)"}
          /> : <span style={{ fontSize:isMobile?32:44 }}>🛒</span>}
        </div>
        {discount && (
          <span style={{ position:"absolute", top:6, left:6, background:"#ff6b35", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:4 }}>
            {discount}% OFF
          </span>
        )}
        {!inStock && (
          <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.7)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#e74c3c", background:"#fff", padding:"3px 10px", borderRadius:20, border:"1px solid #fdd" }}>Out of Stock</span>
          </div>
        )}
        <button onClick={handleWishlist} style={{
          position:"absolute", top:6, right:6, background:"#fff", border:"none",
          borderRadius:"50%", width:28, height:28, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 1px 6px rgba(0,0,0,0.15)", transition:"transform 0.2s",
        }}>
          <HeartIcon filled={wished} size={14} stroke={wished?"#e74c3c":"#bbb"}/>
        </button>
      </div>

      <div style={{ padding: isMobile?"10px 10px 12px":"12px 12px 14px", display:"flex", flexDirection:"column", gap: isMobile?3:5, flex:1 }}>
        <div style={{ fontSize:9, color:"#2d9e2d", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>{catName}</div>
        <div style={{ fontSize: isMobile?12:13, fontWeight:700, color:"#1a1a1a", lineHeight:1.35, minHeight: isMobile?30:36, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <StarRating rating={rating} size={isMobile?10:12}/>
          <span style={{ fontSize:9, color:"#bbb" }}>({reviews})</span>
        </div>
        {!isMobile && unit && <div style={{ fontSize:11, color:"#bbb" }}>{unit}</div>}
        <div style={{ fontSize:9, fontWeight:700, color: !inStock?"#e74c3c": isLowStock?"#e67e22":"#27ae60" }}>
          {!inStock ? "❌ Out of Stock" : isLowStock ? `⚠️ Only ${stock} left` : `✅ In Stock`}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:"auto", paddingTop:4 }}>
          <span style={{ fontSize: isMobile?14:16, fontWeight:800, color:"#2d9e2d" }}>₹{price.toFixed(2)}</span>
          {oldPrice && <span style={{ fontSize:10, color:"#ccc", textDecoration:"line-through" }}>₹{oldPrice.toFixed(2)}</span>}
        </div>
        <button onClick={handleAddToCart} disabled={!inStock} style={{
          width:"100%", padding: isMobile?"8px 0":"9px 0",
          background: added?"#218c21": inStock?"#2d9e2d":"#e8e8e8",
          color: inStock?"#fff":"#aaa", border:"none", borderRadius:8,
          fontSize:12, fontWeight:700, cursor: inStock?"pointer":"not-allowed",
          display:"flex", alignItems:"center", justifyContent:"center", gap:5,
          transition:"background 0.2s", marginTop:4,
        }}>
          <CartIcon size={13} stroke={inStock?"#fff":"#aaa"}/>
          {added ? "Added ✓" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

// ─── Active Filter Chip ───────────────────────────────────────────────────────
const FilterChip = ({ label, onRemove }) => (
  <span style={{
    display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px",
    background:"#e8f5e9", border:"1px solid #c8e6c9", borderRadius:20,
    fontSize:12, fontWeight:600, color:"#2d9e2d", whiteSpace:"nowrap",
  }}>
    {label}
    <button onClick={onRemove} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", lineHeight:1 }}>
      <XIcon size={12} stroke="#2d9e2d"/>
    </button>
  </span>
);

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = ({ isMobile }) => (
  <div style={{ borderRadius:12, overflow:"hidden", background:"#fff", border:"1px solid #f0f0f0" }}>
    <div style={{ height: isMobile?150:190, background:"#f0f0f0", animation:"shimmer 1.4s ease-in-out infinite" }}/>
    <div style={{ padding:"12px 12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
      {[40,85,60,100].map((w,i) => (
        <div key={i} style={{ height: i===3?34:i===1?14:10, width:w+"%", background:"#f0f0f0", borderRadius: i===3?8:4, animation:"shimmer 1.4s ease-in-out infinite" }}/>
      ))}
    </div>
  </div>
);

const SORT_OPTIONS = [
  { value:"default",    label:"Default" },
  { value:"price-asc",  label:"Price: Low → High" },
  { value:"price-desc", label:"Price: High → Low" },
  { value:"rating",     label:"Top Rated" },
  { value:"newest",     label:"Newest First" },
  { value:"discount",   label:"Biggest Discount" },
  { value:"name-asc",   label:"Name: A–Z" },
  { value:"name-desc",  label:"Name: Z–A" },
];

const RATING_OPTIONS = [
  { value:4, label:"4★ & above" },
  { value:3, label:"3★ & above" },
  { value:2, label:"2★ & above" },
];

const DISCOUNT_OPTIONS = [
  { value:10, label:"10% or more" },
  { value:25, label:"25% or more" },
  { value:50, label:"50% or more" },
  { value:70, label:"70% or more" },
];

const MAX_PRICE = 1000;

// ─── Category Row Header ──────────────────────────────────────────────────────
const CategoryRowHeader = ({ name, totalCount, onViewAll }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, paddingBottom:10, borderBottom:"2px solid #f0f0f0" }}>
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:4, height:20, background:"#2d9e2d", borderRadius:2 }}/>
      <h2 style={{ margin:0, fontSize:16, fontWeight:800, color:"#1a1a1a" }}>{name}</h2>
      <span style={{ fontSize:12, color:"#aaa", background:"#f5f5f5", borderRadius:10, padding:"2px 8px" }}>{totalCount}</span>
    </div>
    {totalCount > 2 && (
      <button onClick={onViewAll} style={{
        fontSize:12, fontWeight:700, color:"#2d9e2d", background:"#f0faf0",
        border:"1px solid #c8e6c9", borderRadius:8, padding:"5px 12px",
        cursor:"pointer", fontFamily:"inherit",
      }}>View all →</button>
    )}
  </div>
);

// ─── Filter Drawer (mobile) / Sidebar (desktop) ───────────────────────────────
const FilterPanel = ({
  isMobile, open, onClose,
  categories, catLoading, catCounts, selectedCats, toggleCat,
  maxPrice, priceMax, setMaxPrice,
  minRating, setMinRating,
  minDiscount, setMinDiscount,
  inStockOnly, setInStockOnly,
  onSaleOnly, setOnSaleOnly,
  activeFilters, clearAllFilters, resetPage,
}) => {
  const inner = (
    <div style={{ padding: isMobile?"0 16px 24px":"18px 16px", fontFamily:"'Nunito',sans-serif" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingTop: isMobile?0:0 }}>
        <span style={{ fontSize:15, fontWeight:800, color:"#1a1a1a", display:"flex", alignItems:"center", gap:7 }}>
          <FilterIcon size={15} stroke="#2d9e2d"/> Filters
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {activeFilters.length > 0 && (
            <button onClick={clearAllFilters} style={{ fontSize:11, color:"#e74c3c", background:"#fff3f3", border:"1px solid #fdd", borderRadius:10, padding:"2px 8px", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
              Reset all
            </button>
          )}
          {isMobile && (
            <button onClick={onClose} style={{ background:"#f5f5f5", border:"none", borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <CloseIcon size={16} stroke="#555"/>
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <FilterSection title="Categories" icon={<PackageIcon size={13} stroke="#2d9e2d"/>}>
        {catLoading ? (
          [...Array(5)].map((_,i) => <div key={i} style={{ height:24, background:"#f0f0f0", borderRadius:4, marginBottom:6, animation:"shimmer 1.4s ease-in-out infinite" }}/>)
        ) : categories.length === 0 ? (
          <p style={{ fontSize:12, color:"#bbb", margin:0 }}>No categories found.</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:2, maxHeight:220, overflowY:"auto", paddingRight:4 }}>
            {categories.map(cat => (
              <CheckRow key={cat._id} label={cat.name} count={catCounts[cat._id]||0}
                checked={selectedCats.includes(cat._id)} onChange={()=>toggleCat(cat._id)}/>
            ))}
          </div>
        )}
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price Range" icon={<TagIcon size={13} stroke="#2d9e2d"/>}>
        <PriceSlider min={0} max={priceMax||MAX_PRICE}
          value={maxPrice>(priceMax||MAX_PRICE)?(priceMax||MAX_PRICE):maxPrice}
          onChange={v=>{setMaxPrice(v);resetPage();}}/>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Customer Rating" icon={<StarFilled size={13}/>}>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {RATING_OPTIONS.map(opt => (
            <label key={opt.value} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"5px 0" }}>
              <span style={{
                width:18, height:18, borderRadius:"50%", border:`2px solid ${minRating===opt.value?"#2d9e2d":"#ddd"}`,
                background: minRating===opt.value?"#2d9e2d":"#fff",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s",
              }} onClick={()=>{setMinRating(minRating===opt.value?null:opt.value);resetPage();}}>
                {minRating===opt.value && <span style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
              </span>
              <StarRating rating={opt.value} size={13}/>
              <span style={{ fontSize:13, color:"#555" }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Discount */}
      <FilterSection title="Discount" icon={<TagIcon size={13} stroke="#ff6b35"/>}>
        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {DISCOUNT_OPTIONS.map(opt => (
            <label key={opt.value} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"5px 0" }}>
              <span style={{
                width:18, height:18, borderRadius:"50%", border:`2px solid ${minDiscount===opt.value?"#ff6b35":"#ddd"}`,
                background: minDiscount===opt.value?"#ff6b35":"#fff",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s",
              }} onClick={()=>{setMinDiscount(minDiscount===opt.value?null:opt.value);resetPage();}}>
                {minDiscount===opt.value && <span style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
              </span>
              <span style={{ fontSize:13, color:"#555" }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" icon={<PackageIcon size={13} stroke="#2d9e2d"/>}>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <CheckRow label="In Stock Only" checked={inStockOnly} onChange={()=>{setInStockOnly(v=>!v);resetPage();}}/>
          <CheckRow label="On Sale" checked={onSaleOnly} onChange={()=>{setOnSaleOnly(v=>!v);resetPage();}}/>
        </div>
      </FilterSection>

      {isMobile && (
        <button onClick={onClose} style={{
          width:"100%", padding:"13px 0", background:"#2d9e2d", color:"#fff",
          border:"none", borderRadius:12, fontSize:14, fontWeight:800,
          cursor:"pointer", fontFamily:"inherit", marginTop:8,
        }}>
          Show Results
        </button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div onClick={onClose} style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:998,
          opacity: open?1:0, pointerEvents: open?"auto":"none", transition:"opacity 0.3s",
        }}/>
        {/* Drawer */}
        <div style={{
          position:"fixed", left:0, right:0, bottom:0, zIndex:999,
          background:"#fff", borderRadius:"20px 20px 0 0",
          boxShadow:"0 -8px 32px rgba(0,0,0,0.15)",
          transform: open?"translateY(0)":"translateY(100%)",
          transition:"transform 0.35s cubic-bezier(0.32,0.72,0,1)",
          maxHeight:"88vh", overflowY:"auto",
          paddingBottom:"env(safe-area-inset-bottom)",
        }}>
          {/* Drag handle */}
          <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px" }}>
            <div style={{ width:40, height:4, background:"#e0e0e0", borderRadius:2 }}/>
          </div>
          {inner}
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside style={{
      width: open?256:0, minWidth: open?256:0,
      overflow:"hidden", transition:"all 0.3s ease", flexShrink:0,
    }}>
      <div style={{
        background:"#fff", borderRadius:14, border:"1px solid #f0f0f0",
        boxShadow:"0 2px 12px rgba(0,0,0,0.05)",
        position:"sticky", top:80, width:256,
        maxHeight:"calc(100vh - 100px)", overflowY:"auto",
      }}>
        {inner}
      </div>
    </aside>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Data
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [catLoading, setCatLoading]   = useState(true);

  // Search
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  // Filters
  const [selectedCats, setSelectedCats] = useState(
    searchParams.get("categories") ? searchParams.get("categories").split(",") : []
  );
  const [maxPrice, setMaxPrice]       = useState(MAX_PRICE);
  const [minRating, setMinRating]     = useState(null);
  const [minDiscount, setMinDiscount] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly]   = useState(false);
  const [sortBy, setSortBy]           = useState("default");

  // UI
  const [view, setView]               = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [sortDropOpen, setSortDropOpen] = useState(false);

  const PER_PAGE = view === "grid" ? 20 : 15;
  const searchQuery = searchParams.get("search") || "";

  // Sync URL → state
  useEffect(() => {
    const q = searchParams.get("search") || "";
    setSearchInput(q); setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    const cats = searchParams.get("categories");
    setSelectedCats(cats ? cats.split(",") : []); setCurrentPage(1);
  }, [searchParams]);

  // Fetch products
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        let all=[],page=1,totalPages=1;
        do {
          const res  = await fetch(`http://localhost:5000/api/Products/allFree?page=${page}&limit=100`);
          const data = await res.json();
          const batch = Array.isArray(data)?data:data.products||data.data||[];
          all=[...all,...batch];
          totalPages = data.totalPages||1; page++;
        } while(page<=totalPages);
        setAllProducts(all);
      } catch(e){ console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  // Fetch categories
  useEffect(() => {
    fetch("http://localhost:5000/api/Category/all")
      .then(r=>r.json())
      .then(data=>{
        const cats=Array.isArray(data)?data:data.categories||data.data||[];
        setCategories(cats.filter(c=>c.isActive!==false));
      }).catch(()=>{}).finally(()=>setCatLoading(false));
  }, []);

  const priceMax = allProducts.length
    ? Math.min(MAX_PRICE, Math.ceil(Math.max(...allProducts.map(p=>p.price||p.buyingPrice||0))))
    : MAX_PRICE;

  const catCounts = categories.reduce((acc,cat) => {
    const id=cat._id;
    acc[id]=allProducts.filter(p=>{
      const cid=typeof p.category==="object"?p.category?._id:p.category;
      return cid===id;
    }).length;
    return acc;
  }, {});

  const isDefaultView = !searchQuery && selectedCats.length===0 && maxPrice>=priceMax
    && minRating===null && minDiscount===null && !inStockOnly && !onSaleOnly && sortBy==="default";

  const defaultViewGroups = !loading && isDefaultView
    ? categories.filter(cat=>(catCounts[cat._id]||0)>0).map(cat => {
        const catId=cat._id;
        const products=allProducts.filter(p=>{
          const cid=typeof p.category==="object"?p.category?._id:p.category;
          return cid===catId;
        }).slice(0,2);
        return { cat, products, totalCount:catCounts[catId]||0 };
      })
    : [];

  const filtered = allProducts.filter(p => {
    const price=p.price||p.buyingPrice||0;
    const oldPrice=p.oldPrice||p.sellingPrice;
    const rating=p.rating||4;
    const name=(p.name||p.title||"").toLowerCase();
    const catId=typeof p.category==="object"?p.category?._id:p.category||"";
    const inStock=(p.stockQuantity??0)>0;
    const discount=oldPrice?Math.round((1-price/oldPrice)*100):0;

    if(searchQuery && !name.includes(searchQuery.toLowerCase())) return false;
    if(selectedCats.length && !selectedCats.includes(catId)) return false;
    if(price>maxPrice) return false;
    if(minRating && rating<minRating) return false;
    if(minDiscount && discount<minDiscount) return false;
    if(inStockOnly && !inStock) return false;
    if(onSaleOnly && !oldPrice) return false;
    return true;
  });

  const sorted = [...filtered].sort((a,b) => {
    const pa=a.price||a.buyingPrice||0, pb=b.price||b.buyingPrice||0;
    const oa=a.oldPrice||a.sellingPrice, ob=b.oldPrice||b.sellingPrice;
    const da=oa?Math.round((1-pa/oa)*100):0, db=ob?Math.round((1-pb/ob)*100):0;
    switch(sortBy){
      case "price-asc":  return pa-pb;
      case "price-desc": return pb-pa;
      case "rating":     return (b.rating||4)-(a.rating||4);
      case "discount":   return db-da;
      case "name-asc":   return (a.name||"").localeCompare(b.name||"");
      case "name-desc":  return (b.name||"").localeCompare(a.name||"");
      default: return 0;
    }
  });

  const totalPages = Math.ceil(sorted.length/PER_PAGE);
  const paginated  = sorted.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);
  const resetPage  = () => setCurrentPage(1);

  const activeFilters = [
    ...selectedCats.map(id=>{
      const cat=categories.find(c=>c._id===id);
      return cat ? { key:`cat-${id}`, label:cat.name, remove:()=>{setSelectedCats(s=>s.filter(x=>x!==id));resetPage();} } : null;
    }).filter(Boolean),
    maxPrice<priceMax ? { key:"price", label:`Under ₹${maxPrice}`, remove:()=>{setMaxPrice(priceMax);resetPage();} } : null,
    minRating ? { key:"rating", label:`${minRating}★+`, remove:()=>{setMinRating(null);resetPage();} } : null,
    minDiscount ? { key:"discount", label:`${minDiscount}%+ off`, remove:()=>{setMinDiscount(null);resetPage();} } : null,
    inStockOnly ? { key:"stock", label:"In Stock", remove:()=>{setInStockOnly(false);resetPage();} } : null,
    onSaleOnly ? { key:"sale", label:"On Sale", remove:()=>{setOnSaleOnly(false);resetPage();} } : null,
  ].filter(Boolean);

  const clearAllFilters = () => {
    setSelectedCats([]); setMaxPrice(priceMax); setMinRating(null);
    setMinDiscount(null); setInStockOnly(false); setOnSaleOnly(false);
    setSortBy("default"); setSearchParams({}); resetPage();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q=searchInput.trim();
    if(q) setSearchParams({search:q}); else setSearchParams({});
    resetPage();
  };

  const toggleCat = (id) => {
    setSelectedCats(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
    resetPage();
  };

  const handleViewAllCategory = (catId) => {
    setSelectedCats([catId]); resetPage();
  };

  const pageRange = () => {
    const pages=[]; const delta=isMobile?1:2;
    for(let i=Math.max(1,currentPage-delta); i<=Math.min(totalPages,currentPage+delta); i++) pages.push(i);
    return pages;
  };

  const filterPanelProps = {
    isMobile, open: isMobile?drawerOpen:sidebarOpen, onClose:()=>setDrawerOpen(false),
    categories, catLoading, catCounts, selectedCats, toggleCat,
    maxPrice, priceMax, setMaxPrice,
    minRating, setMinRating,
    minDiscount, setMinDiscount,
    inStockOnly, setInStockOnly,
    onSaleOnly, setOnSaleOnly,
    activeFilters, clearAllFilters, resetPage,
  };

  // Grid columns based on screen and sidebar
  const gridCols = isMobile
    ? "repeat(2, 1fr)"
    : sidebarOpen
      ? "repeat(auto-fill, minmax(200px,1fr))"
      : "repeat(auto-fill, minmax(220px,1fr))";

  return (
    <>
      <FontLink/>
      <style>{`
        * { box-sizing:border-box; }
        body { font-family:'Nunito',sans-serif; background:#f8f9fa; margin:0; }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.5} }
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#f1f1f1}
        ::-webkit-scrollbar-thumb{background:#ccc;border-radius:10px}
        
.mobile-search-bar {
  position: sticky; top: 0;
  background: #fff;
  padding: 10px 14px 8px;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
        .filter-chips-scroll {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px;
          -webkit-overflow-scrolling: touch; scrollbar-width: none;
        }
        .filter-chips-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ maxWidth:1440, margin:"0 auto", padding: isMobile?"0 0 80px":"24px 20px 40px" }}>

        {/* ── Mobile sticky top bar ── */}
        {isMobile ? (
          <div className="mobile-search-bar" style={{ zIndex: drawerOpen ? 10 : 90 }}>
            {/* Search row */}
            <form onSubmit={handleSearchSubmit} style={{ display:"flex", gap:0, marginBottom:8 }}>
              <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
                placeholder="Search products…"
                style={{
                  flex:1, padding:"10px 14px", fontSize:14, border:"1.5px solid #e0e0e0",
                  borderRight:"none", borderRadius:"10px 0 0 10px", outline:"none",
                  background:"#f8f9fa", fontFamily:"inherit", color:"#1a1a1a",
                }}
                onFocus={e=>e.target.style.borderColor="#2d9e2d"}
                onBlur={e=>e.target.style.borderColor="#e0e0e0"}
              />
              <button type="submit" style={{ padding:"10px 14px", background:"#2d9e2d", border:"none", borderRadius:"0 10px 10px 0", cursor:"pointer", display:"flex", alignItems:"center" }}>
                <SearchIcon size={18} stroke="#fff"/>
              </button>
            </form>

            {/* Toolbar row */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {/* Filter button */}
              <button onClick={()=>setDrawerOpen(true)} style={{
                display:"flex", alignItems:"center", gap:5, padding:"7px 12px",
                background: activeFilters.length?"#2d9e2d":"#f5f5f5",
                color: activeFilters.length?"#fff":"#555",
                border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit",
                flexShrink:0,
              }}>
                <FilterIcon size={14} stroke={activeFilters.length?"#fff":"#555"}/>
                Filters {activeFilters.length>0 && `(${activeFilters.length})`}
              </button>

              {/* Sort dropdown */}
              <div style={{ position:"relative", flex:1 }}>
                <button onClick={()=>setSortDropOpen(o=>!o)} style={{
                  width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", gap:4,
                  padding:"7px 12px", background:"#f5f5f5", border:"none",
                  borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, color:"#444", fontFamily:"inherit",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <SortIcon size={13}/>
                    <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:100 }}>
                      {SORT_OPTIONS.find(o=>o.value===sortBy)?.label||"Sort"}
                    </span>
                  </div>
                  <ChevronDown size={11}/>
                </button>
                {sortDropOpen && (
                  <>
                    <div style={{ position:"fixed", inset:0, zIndex:10 }} onClick={()=>setSortDropOpen(false)}/>
                    <div style={{
                      position:"absolute", top:"calc(100% + 6px)", right:0, left:0, zIndex:20,
                      background:"#fff", border:"1px solid #f0f0f0", borderRadius:10,
                      boxShadow:"0 8px 30px rgba(0,0,0,0.15)", overflow:"hidden",
                    }}>
                      {SORT_OPTIONS.map(opt=>(
                        <button key={opt.value} onClick={()=>{setSortBy(opt.value);setSortDropOpen(false);resetPage();}} style={{
                          display:"block", width:"100%", textAlign:"left", padding:"11px 14px",
                          fontSize:14, background: sortBy===opt.value?"#f0faf0":"#fff",
                          color: sortBy===opt.value?"#2d9e2d":"#333",
                          fontWeight: sortBy===opt.value?700:400,
                          border:"none", cursor:"pointer", fontFamily:"inherit",
                        }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* View toggle */}
              <div style={{ display:"flex", border:"1.5px solid #e8e8e8", borderRadius:8, overflow:"hidden", flexShrink:0 }}>
                {[["grid",<GridIcon size={14}/>],["list",<ListIcon size={14}/>]].map(([v,icon])=>(
                  <button key={v} onClick={()=>setView(v)} style={{
                    padding:"7px 9px", border:"none",
                    background: view===v?"#2d9e2d":"#fff",
                    color: view===v?"#fff":"#999", cursor:"pointer", display:"flex", alignItems:"center",
                  }}>{icon}</button>
                ))}
              </div>
            </div>

            {/* Active filter chips (scrollable) */}
            {(activeFilters.length>0 || searchQuery) && (
              <div className="filter-chips-scroll" style={{ marginTop:8 }}>
                {searchQuery && <FilterChip label={`"${searchQuery}"`} onRemove={()=>{setSearchParams({});setSearchInput("");resetPage();}}/>}
                {activeFilters.map(f=><FilterChip key={f.key} label={f.label} onRemove={f.remove}/>)}
                <button onClick={clearAllFilters} style={{ fontSize:12, color:"#e74c3c", background:"none", border:"1px solid #fdd", borderRadius:20, padding:"4px 10px", cursor:"pointer", fontWeight:600, whiteSpace:"nowrap", fontFamily:"inherit" }}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Desktop page header ── */
          <>
            <div style={{ marginBottom:20, display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <h1 style={{ fontSize:26, fontWeight:900, color:"#1a1a1a", margin:0, letterSpacing:-0.5 }}>
                  {searchQuery ? `Results for "${searchQuery}"` : "All Products"}
                </h1>
                <p style={{ fontSize:13, color:"#888", margin:"4px 0 0" }}>
                  {loading ? "Loading products…"
                    : isDefaultView
                      ? `${allProducts.length.toLocaleString()} products across ${defaultViewGroups.length} categories`
                      : `${sorted.length.toLocaleString()} products found`}
                </p>
              </div>
              <form onSubmit={handleSearchSubmit} style={{ display:"flex", alignItems:"center" }}>
                <input value={searchInput} onChange={e=>setSearchInput(e.target.value)}
                  placeholder="Search products…"
                  style={{ width:260, padding:"9px 14px", fontSize:13, border:"1.5px solid #e0e0e0", borderRight:"none", borderRadius:"8px 0 0 8px", outline:"none", background:"#fff", fontFamily:"inherit", color:"#1a1a1a" }}
                  onFocus={e=>e.target.style.borderColor="#2d9e2d"} onBlur={e=>e.target.style.borderColor="#e0e0e0"}
                />
                <button type="submit" style={{ padding:"9px 14px", background:"#2d9e2d", border:"none", borderRadius:"0 8px 8px 0", cursor:"pointer", display:"flex", alignItems:"center" }}>
                  <SearchIcon size={16} stroke="#fff"/>
                </button>
              </form>
            </div>

            {/* Desktop active filter chips */}
            {(activeFilters.length>0 || searchQuery) && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16, alignItems:"center" }}>
                <span style={{ fontSize:12, color:"#888", fontWeight:600 }}>Active filters:</span>
                {searchQuery && <FilterChip label={`"${searchQuery}"`} onRemove={()=>{setSearchParams({});setSearchInput("");resetPage();}}/>}
                {activeFilters.map(f=><FilterChip key={f.key} label={f.label} onRemove={f.remove}/>)}
                <button onClick={clearAllFilters} style={{ fontSize:12, color:"#e74c3c", background:"none", border:"none", cursor:"pointer", fontWeight:600, textDecoration:"underline", fontFamily:"inherit" }}>
                  Clear all
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Main layout ── */}
        <div style={{
          display:"flex", gap: isMobile?0:20, alignItems:"flex-start",
          padding: isMobile?"12px 12px 0":0,
        }}>

          {/* Filter Panel (sidebar on desktop, drawer on mobile) */}
          <FilterPanel {...filterPanelProps}/>

          {/* ── Content ── */}
          <div style={{ flex:1, minWidth:0 }}>

            {/* Desktop toolbar */}
            {!isMobile && (
              <div style={{
                display:"flex", alignItems:"center", gap:10, marginBottom:16,
                background:"#fff", borderRadius:10, padding:"10px 14px",
                border:"1px solid #f0f0f0", boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <button onClick={()=>setSidebarOpen(o=>!o)} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
                  background:"#f5f5f5", border:"none", borderRadius:7, cursor:"pointer",
                  fontSize:12, fontWeight:600, color:"#555", fontFamily:"inherit",
                }}>
                  <FilterIcon size={13} stroke="#555"/> {sidebarOpen?"Hide":"Filters"}
                </button>
                <div style={{ flex:1 }}/>
                {!isDefaultView && (
                  <span style={{ fontSize:12, color:"#aaa", whiteSpace:"nowrap" }}>
                    {loading?"…":`${(currentPage-1)*PER_PAGE+1}–${Math.min(currentPage*PER_PAGE,sorted.length)} of ${sorted.length}`}
                  </span>
                )}
                {!isDefaultView && (
                  <div style={{ position:"relative" }}>
                    <button onClick={()=>setSortDropOpen(o=>!o)} style={{
                      display:"flex", alignItems:"center", gap:6, padding:"7px 12px",
                      background:"#fff", border:"1.5px solid #e8e8e8", borderRadius:8,
                      cursor:"pointer", fontSize:12, fontWeight:600, color:"#444", fontFamily:"inherit", whiteSpace:"nowrap",
                    }}>
                      <SortIcon size={13}/> {SORT_OPTIONS.find(o=>o.value===sortBy)?.label||"Sort"} <ChevronDown size={11}/>
                    </button>
                    {sortDropOpen && (
                      <>
                        <div style={{ position:"fixed", inset:0, zIndex:10 }} onClick={()=>setSortDropOpen(false)}/>
                        <div style={{
                          position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:20,
                          background:"#fff", border:"1px solid #f0f0f0", borderRadius:10,
                          boxShadow:"0 8px 30px rgba(0,0,0,0.12)", minWidth:200, overflow:"hidden",
                        }}>
                          {SORT_OPTIONS.map(opt=>(
                            <button key={opt.value} onClick={()=>{setSortBy(opt.value);setSortDropOpen(false);resetPage();}} style={{
                              display:"block", width:"100%", textAlign:"left", padding:"9px 14px",
                              fontSize:13, background: sortBy===opt.value?"#f0faf0":"#fff",
                              color: sortBy===opt.value?"#2d9e2d":"#333",
                              fontWeight: sortBy===opt.value?700:400,
                              border:"none", cursor:"pointer", fontFamily:"inherit",
                            }}
                              onMouseEnter={e=>{if(sortBy!==opt.value)e.target.style.background="#f8f8f8";}}
                              onMouseLeave={e=>{e.target.style.background=sortBy===opt.value?"#f0faf0":"#fff";}}
                            >{opt.label}</button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div style={{ display:"flex", border:"1.5px solid #e8e8e8", borderRadius:8, overflow:"hidden" }}>
                  {[["grid",<GridIcon size={14}/>],["list",<ListIcon size={14}/>]].map(([v,icon])=>(
                    <button key={v} onClick={()=>setView(v)} style={{
                      padding:"6px 10px", border:"none", background: view===v?"#2d9e2d":"#fff",
                      color: view===v?"#fff":"#999", cursor:"pointer", display:"flex", alignItems:"center", transition:"all 0.15s",
                    }}>{icon}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile page title (below sticky bar) */}
            {isMobile && (
              <div style={{ marginBottom:12 }}>
                <h1 style={{ fontSize:20, fontWeight:900, color:"#1a1a1a", margin:"0 0 2px", letterSpacing:-0.3 }}>
                  {searchQuery ? `"${searchQuery}"` : "All Products"}
                </h1>
                <p style={{ fontSize:12, color:"#888", margin:0 }}>
                  {loading ? "Loading…"
                    : isDefaultView
                      ? `${allProducts.length.toLocaleString()} products`
                      : `${sorted.length.toLocaleString()} found`}
                </p>
              </div>
            )}

            {/* ── Product Display ── */}
            {loading ? (
              <div style={{ display:"grid", gridTemplateColumns: view==="list"?"1fr":gridCols, gap: isMobile?10:14 }}>
                {[...Array(isMobile?6:12)].map((_,i)=><SkeletonCard key={i} isMobile={isMobile}/>)}
              </div>
            ) : isDefaultView ? (
              <div style={{ display:"flex", flexDirection:"column", gap: isMobile?24:32 }}>
                {defaultViewGroups.length===0 ? (
                  <div style={{ textAlign:"center", padding:"60px 20px", background:"#fff", borderRadius:14, border:"1px solid #f0f0f0" }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
                    <h3 style={{ fontSize:18, fontWeight:800, color:"#1a1a1a", margin:"0 0 6px" }}>No products yet</h3>
                    <p style={{ fontSize:13, color:"#aaa", margin:0 }}>Check back soon!</p>
                  </div>
                ) : defaultViewGroups.map(({ cat, products, totalCount }) => (
                  <div key={cat._id} style={{ animation:"fadeIn 0.3s ease" }}>
                    <CategoryRowHeader name={cat.name} totalCount={totalCount} onViewAll={()=>handleViewAllCategory(cat._id)}/>
                    <div style={{ display:"grid", gridTemplateColumns: view==="list"?"1fr":gridCols, gap: isMobile?10:14 }}>
                      {products.map((p,i)=><ProductCard key={p._id||i} product={p} view={view} isMobile={isMobile}/>)}
                    </div>
                  </div>
                ))}
              </div>
            ) : paginated.length===0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", background:"#fff", borderRadius:14, border:"1px solid #f0f0f0" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
                <h3 style={{ fontSize:18, fontWeight:800, color:"#1a1a1a", margin:"0 0 6px" }}>No products found</h3>
                <p style={{ fontSize:13, color:"#aaa", margin:"0 0 16px" }}>Try adjusting your filters</p>
                <button onClick={clearAllFilters} style={{ padding:"10px 24px", background:"#2d9e2d", color:"#fff", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns: view==="list"?"1fr":gridCols, gap: isMobile?10:14 }}>
                {paginated.map((p,i)=><ProductCard key={p._id||i} product={p} view={view} isMobile={isMobile}/>)}
              </div>
            )}

            {/* ── Pagination ── */}
            {!loading && !isDefaultView && totalPages>1 && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap: isMobile?4:6, marginTop:24, flexWrap:"wrap" }}>
                <button onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}
                  style={{ padding: isMobile?"7px 11px":"7px 14px", border:"1.5px solid #e0e0e0", borderRadius:8, background:"#fff", cursor: currentPage===1?"not-allowed":"pointer", fontSize:12, fontWeight:600, color: currentPage===1?"#ccc":"#444", fontFamily:"inherit" }}>
                  ← {!isMobile && "Prev"}
                </button>

                {currentPage>3 && <>
                  <button onClick={()=>setCurrentPage(1)} style={paginBtnStyle(false,isMobile)}>1</button>
                  {currentPage>4 && <span style={{ color:"#bbb" }}>…</span>}
                </>}

                {pageRange().map(n=>(
                  <button key={n} onClick={()=>setCurrentPage(n)} style={paginBtnStyle(n===currentPage,isMobile)}>{n}</button>
                ))}

                {currentPage<totalPages-2 && <>
                  {currentPage<totalPages-3 && <span style={{ color:"#bbb" }}>…</span>}
                  <button onClick={()=>setCurrentPage(totalPages)} style={paginBtnStyle(totalPages===currentPage,isMobile)}>{totalPages}</button>
                </>}

                <button onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}
                  style={{ padding: isMobile?"7px 11px":"7px 14px", border:"1.5px solid #e0e0e0", borderRadius:8, background:"#fff", cursor: currentPage===totalPages?"not-allowed":"pointer", fontSize:12, fontWeight:600, color: currentPage===totalPages?"#ccc":"#444", fontFamily:"inherit" }}>
                  {!isMobile && "Next"} →
                </button>
              </div>
            )}

          </div>{/* /content */}
        </div>{/* /flex row */}
      </div>
    </>
  );
}

const paginBtnStyle = (active, isMobile) => ({
  width: isMobile?34:36, height: isMobile?34:36,
  border:`1.5px solid ${active?"#2d9e2d":"#e0e0e0"}`,
  borderRadius:8, background: active?"#2d9e2d":"#fff",
  color: active?"#fff":"#555", cursor:"pointer", fontSize:13,
  fontWeight: active?700:500, fontFamily:"inherit", transition:"all 0.15s",
});