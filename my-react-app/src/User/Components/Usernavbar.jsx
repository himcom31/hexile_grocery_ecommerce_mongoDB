// src/components/UserNavbar.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { MapPin, Search, Heart, ShoppingCart, User, LogOut, X, Menu } from 'lucide-react';
import AuthModal from '../Pages/UserLogin';
import { fetchCart, fetchWishlist } from "../utils/cartWishlist";
import CartDrawer from "../Components/Cartdrawer";

const NAV_LINKS = [
  { label: 'Home', to: '/user/home' },
  { label: 'Categories', to: '/user/home', scrollTo: 'feature-categories' },
  { label: 'Products', to: '/user/product' },
  { label: 'Most Popular', to: '/user/home', scrollTo: 'popular-product' },
  { label: 'Contact', to: '/user/contact' },
  { label: 'Blogs', to: '/user/blog' },
];

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Highlight matching text ──────────────────────────────────────────────────
const Highlight = ({ text = '', query = '' }) => {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <span style={{ background: 'rgba(45,158,45,0.15)', color: '#1a6b1a', fontWeight: 800, borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </span>
  );
};

// ─── Search Bar with Suggestions ─────────────────────────────────────────────
const SearchBar = ({ isMobile = false, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dropRef = useRef(null);
  const wrapRef = useRef(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setSuggestions(prev =>
        prev.products.length === 0 && prev.categories.length === 0
          ? prev
          : { products: [], categories: [] }
      );
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchSuggestions = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`http://localhost:5000/api/Products/allFree?search=${encodeURIComponent(q)}&limit=5`),
          fetch(`http://localhost:5000/api/Category/all`),
        ]);
        if (cancelled) return;
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        const products = (prodData.products || prodData.data || []).slice(0, 5);
        const allCats = Array.isArray(catData) ? catData : catData.categories || catData.data || [];
        const categories = allCats
          .filter(c => c.isActive !== false && c.name.toLowerCase().includes(q.toLowerCase()))
          .slice(0, 3);
        if (!cancelled) {
          setSuggestions({ products, categories });
          setLoading(false);
          setActiveIndex(-1);
        }
      } catch {
        if (!cancelled) {
          setSuggestions({ products: [], categories: [] });
          setLoading(false);
        }
      }
    };

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  useEffect(() => {
    const handle = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const allSuggestions = [
    ...suggestions.categories.map(c => ({ type: 'category', item: c })),
    ...suggestions.products.map(p => ({ type: 'product', item: p })),
  ];

  const hasResults = suggestions.categories.length > 0 || suggestions.products.length > 0;
  const showDrop = open && query.trim().length > 0 && (loading || hasResults);

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, allSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && allSuggestions[activeIndex]) {
        selectSuggestion(allSuggestions[activeIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const selectSuggestion = useCallback(({ type, item }) => {
    setOpen(false);
    setActiveIndex(-1);
    if (type === 'category') {
      setQuery(item.name);
      navigate(`/user/product?categories=${item._id}`);
    } else {
      const name = item.name || '';
      setQuery(name);
      navigate(`/user/product?search=${encodeURIComponent(name)}`);
    }
    if (isMobile && onClose) onClose();
  }, [navigate, isMobile, onClose]);

  const handleSearch = useCallback((e) => {
    e?.preventDefault();
    const q = query.trim();
    setOpen(false);
    setActiveIndex(-1);
    if (q) {
      navigate(`/user/product?search=${encodeURIComponent(q)}`);
      if (isMobile && onClose) onClose();
    }
  }, [query, navigate, isMobile, onClose]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) {
      setOpen(true);
    } else {
      setOpen(false);
      setSuggestions({ products: [], categories: [] });
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions({ products: [], categories: [] });
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  let flatIdx = -1;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: isMobile ? '100%' : 'auto' }}>
      <form onSubmit={handleSearch} className={`flex items-center ${isMobile ? 'w-full' : 'ml-6'}`}>
        <div style={{ position: 'relative', flex: isMobile ? 1 : 'unset' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.trim() && hasResults) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search products or categories…"
            autoComplete="off"
            className="border border-gray-200 rounded-l-lg px-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
            style={{ width: isMobile ? '100%' : 280, paddingRight: query ? 32 : 14 }}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                color: '#bbb', display: 'flex', alignItems: 'center'
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-r-lg transition flex items-center gap-1 flex-shrink-0"
        >
          <Search size={16} />
        </button>
      </form>

      {showDrop && (
        <div
          ref={dropRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: isMobile ? 0 : 'auto',
            right: 0,
            width: isMobile ? '100%' : 380,
            background: '#fff',
            border: '1px solid #e8e8e8',
            borderRadius: 14,
            boxShadow: '0 12px 40px rgba(0,0,0,0.13)',
            zIndex: 9999,
            overflow: 'hidden',
            animation: 'navSgFadeIn 0.18s ease',
          }}
        >
          <style>{`
            @keyframes navSgFadeIn {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .sg-nav-item {
              display: flex; align-items: center; gap: 10px;
              padding: 9px 14px; cursor: pointer; transition: background 0.12s;
              border: none; background: transparent; width: 100%;
              text-align: left; font-family: inherit;
            }
            .sg-nav-item:hover, .sg-nav-item.active { background: #f4faf4; }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>

          {loading && (
            <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#bbb', fontSize: 13 }}>
              <div style={{ width: 16, height: 16, border: '2px solid #e0e0e0', borderTopColor: '#2d9e2d', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Searching…
            </div>
          )}

          {!loading && !hasResults && (
            <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 13, color: '#bbb' }}>
              No results for <strong>"{query}"</strong>
            </div>
          )}

          {!loading && hasResults && (
            <>
              {suggestions.categories.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#bbb', padding: '10px 14px 5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Categories
                  </div>
                  {suggestions.categories.map(cat => {
                    flatIdx++;
                    const fi = flatIdx;
                    return (
                      <button
                        key={cat._id}
                        className={`sg-nav-item${activeIndex === fi ? ' active' : ''}`}
                        onMouseDown={() => selectSuggestion({ type: 'category', item: cat })}
                        onMouseEnter={() => setActiveIndex(fi)}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {cat.thumbnail
                            ? <img src={cat.thumbnail} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2d9e2d" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                              </svg>
                            )
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Highlight text={cat.name} query={query} />
                          </div>
                          <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>Browse category</div>
                        </div>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    );
                  })}
                </>
              )}

              {suggestions.categories.length > 0 && suggestions.products.length > 0 && (
                <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
              )}

              {suggestions.products.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#bbb', padding: '10px 14px 5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    </svg>
                    Products
                  </div>
                  {suggestions.products.map(prod => {
                    flatIdx++;
                    const fi = flatIdx;
                    const price = prod.buyingPrice || 0;
                    const image = prod.thumbnail || prod.additionalImages?.[0];
                    const cat = typeof prod.category === 'object' ? prod.category?.name : '';
                    return (
                      <button
                        key={prod._id}
                        className={`sg-nav-item${activeIndex === fi ? ' active' : ''}`}
                        onMouseDown={() => selectSuggestion({ type: 'product', item: prod })}
                        onMouseEnter={() => setActiveIndex(fi)}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {image
                            ? <img src={image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                              </svg>
                            )
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Highlight text={prod.name || ''} query={query} />
                          </div>
                          {cat && <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{cat}</div>}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#2d9e2d', flexShrink: 0 }}>
                          ₹{price.toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </>
              )}

              <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#bbb' }}>↑↓ navigate · Enter · Esc</span>
                <button
                  onMouseDown={handleSearch}
                  style={{ fontSize: 12, fontWeight: 700, color: '#2d9e2d', background: '#f0faf0', border: '1px solid #c8e6c9', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Search size={12} /> See all results
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Navbar ──────────────────────────────────────────────────────────────
const UserNavbar = () => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('userToken'));
  const [cartOpen, setCartOpen] = useState(false);

  // Mobile states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const hasFetchedRef = useRef(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!isLoggedIn) {
      hasFetchedRef.current = false;
      setCartCount(0);
      setWishlistCount(0);
      return;
    }
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchCart().then(data => {
      const total = (data?.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
      setCartCount(total);
    }).catch(() => setCartCount(0));

    fetchWishlist().then(data => {
      setWishlistCount((data?.products || []).length);
    }).catch(() => setWishlistCount(0));
  }, [isLoggedIn]);

  const onCartUpdate = useCallback((e) => {
    const total = (e.detail?.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
    setCartCount(total);
  }, []);

  const onWishlistUpdate = useCallback((e) => {
    setWishlistCount((e.detail?.products || []).length);
  }, []);

  useEffect(() => {
    window.addEventListener("cart-updated", onCartUpdate);
    window.addEventListener("wishlist-updated", onWishlistUpdate);
    return () => {
      window.removeEventListener("cart-updated", onCartUpdate);
      window.removeEventListener("wishlist-updated", onWishlistUpdate);
    };
  }, [onCartUpdate, onWishlistUpdate]);

  useEffect(() => {
    const handler = () => { setAuthMode('login'); setShowAuth(true); };
    window.addEventListener("open-login-modal", handler);
    return () => window.removeEventListener("open-login-modal", handler);
  }, []);

  const user = { name: 'John Doe', avatar: null };

  const openLogin = () => { setAuthMode('login'); setShowAuth(true); };

  const handleLoginSuccess = useCallback((token) => {
    localStorage.setItem('userToken', token);
    setIsLoggedIn(true);
    setShowAuth(false);
    navigate('/user/home');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userToken');
    setIsLoggedIn(false);
    setShowDropdown(false);
    setMobileMenuOpen(false);
    setCartCount(0);
    setWishlistCount(0);
    navigate('/user/home');
  }, [navigate]);

  const handleNavClick = useCallback((link) => {
    setMobileMenuOpen(false);
    if (!link.scrollTo) { navigate(link.to); return; }
    const scrollToSection = () => {
      const el = document.getElementById(link.scrollTo);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (location.pathname === link.to) {
      scrollToSection();
    } else {
      navigate(link.to);
      setTimeout(scrollToSection, 300);
    }
  }, [navigate, location.pathname]);

  return (
    <>
      <header className="w-full bg-white shadow-sm sticky top-0 z-40">

        {/* ── Desktop: Row 1 ── */}
        <div className="hidden md:flex items-center justify-between px-8 py-3 border-b border-gray-100">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => navigate('/user/home')}
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2" />
                <path d="M16 10a4 4 0 01-8 0" fill="none" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="block text-green-600 font-extrabold text-base tracking-tight">Ready</span>
              <span className="block text-green-600 font-extrabold text-base tracking-tight -mt-1">Grocery</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-gray-600 text-sm cursor-pointer hover:text-green-600 transition ml-6">
            <MapPin size={15} className="text-green-600 flex-shrink-0" />
          </div>

          <div className="flex-1" />

          {isLoggedIn ? (
            <div className="flex items-center gap-5">
              <button
                onClick={() => navigate('/user/wishlist')}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-green-600 transition"
              >
                <div className="relative">
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="font-medium">Wishlist</span>
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-green-600 transition"
              >
                <div className="relative">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="font-medium">My Cart</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowDropdown(p => !p)}
                  className="w-10 h-10 rounded-full border-2 border-green-500 overflow-hidden flex items-center justify-center bg-gray-100 hover:border-green-600 transition"
                >
                  {user.avatar
                    ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <User size={20} className="text-gray-500" />
                  }
                </button>

                {showDropdown && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-xl shadow-lg w-44 py-2 z-50">
                    <button
                      onClick={() => { navigate('/user/userDashboard'); setShowDropdown(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition flex items-center gap-2"
                    >
                      <User size={15} /> Dashboard
                    </button>
                   
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition flex items-center gap-2"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={openLogin}
              className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-green-600 transition"
            >
              <span>Login</span>
              <User size={20} className="text-gray-700" />
            </button>
          )}
        </div>

        {/* ── Desktop: Row 2 ── */}
        <div className="hidden md:flex items-center justify-between px-8 py-2 bg-gray-50">
          <nav className="flex items-center gap-6">
            {NAV_LINKS.map((link) => {
              if (link.scrollTo) {
                return (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link)}
                    className="text-sm font-medium transition whitespace-nowrap bg-transparent border-none cursor-pointer p-0 text-gray-700 hover:text-green-600"
                  >
                    {link.label}
                  </button>
                );
              }
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-sm font-medium transition whitespace-nowrap ${isActive ? 'text-green-600 font-semibold' : 'text-gray-700 hover:text-green-600'}`
                  }
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
          <SearchBar />
        </div>

        {/* ── Mobile Header ── */}
        <div className="flex md:hidden items-center justify-between px-4 py-3">
          {/* Hamburger */}
          <button
            onClick={() => { setMobileMenuOpen(p => !p); setMobileSearchOpen(false); }}
            className="p-1 text-gray-700 hover:text-green-600 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/user/home')}
          >
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2" />
                <path d="M16 10a4 4 0 01-8 0" fill="none" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="block text-green-600 font-extrabold text-sm tracking-tight">Ready</span>
              <span className="block text-green-600 font-extrabold text-sm tracking-tight -mt-0.5">Grocery</span>
            </div>
          </div>

          {/* Mobile right icons */}
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => { setMobileSearchOpen(p => !p); setMobileMenuOpen(false); }}
              className="p-1.5 text-gray-700 hover:text-green-600 transition"
              aria-label="Search"
            >
              {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            {isLoggedIn ? (
              <>
                {/* Wishlist */}
                <button
                  onClick={() => navigate('/user/wishlist')}
                  className="p-1.5 text-gray-700 hover:text-green-600 transition relative"
                  aria-label="Wishlist"
                >
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </button>

                {/* Cart */}
                <button
                  onClick={() => setCartOpen(true)}
                  className="p-1.5 text-gray-700 hover:text-green-600 transition relative"
                  aria-label="Cart"
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* Avatar */}
                <button
                  onClick={() => setShowDropdown(p => !p)}
                  className="w-8 h-8 rounded-full border-2 border-green-500 overflow-hidden flex items-center justify-center bg-gray-100"
                >
                  {user.avatar
                    ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <User size={16} className="text-gray-500" />
                  }
                </button>
              </>
            ) : (
              <button
                onClick={openLogin}
                className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-green-600 transition"
              >
                <User size={20} className="text-gray-700" />
              </button>
            )}
          </div>
        </div>

        {/* ── Mobile Search Bar (expands below header) ── */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 bg-white border-t border-gray-100">
            <SearchBar isMobile={true} onClose={() => setMobileSearchOpen(false)} />
          </div>
        )}

        {/* ── Mobile User Dropdown (below header) ── */}
        {showDropdown && isLoggedIn && (
          <div className="md:hidden absolute right-4 top-[60px] bg-white border border-gray-100 rounded-xl shadow-lg w-44 py-2 z-[200]">

            <button
              onClick={() => { navigate('/user/userDashboard'); setShowDropdown(false); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition flex items-center gap-2"
            >
              <User size={15} /> Dashboard
            </button>
            
            <hr className="my-1 border-gray-100" />
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition flex items-center gap-2"
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}
      </header>

      {/* ── Mobile Slide-In Menu ── */}
      {mobileMenuOpen && (
        <div
  className="fixed inset-0 z-[200] md:hidden"
  style={{ top: 0 }}
>
  {/* Backdrop */}
  <div
    className="absolute inset-0 bg-black/40"
    onClick={() => setMobileMenuOpen(false)}
  />

          {/* Drawer */}
          <div
            className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col"
            style={{ animation: 'mobileMenuSlideIn 0.25s ease' }}
          >
            <style>{`
              @keyframes mobileMenuSlideIn {
                from { transform: translateX(-100%); opacity: 0; }
                to   { transform: translateX(0);    opacity: 1; }
              }
            `}</style>

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-green-50">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => { navigate('/user/home'); setMobileMenuOpen(false); }}
              >
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" stroke="white" strokeWidth="2" />
                    <path d="M16 10a4 4 0 01-8 0" fill="none" stroke="white" strokeWidth="2" />
                  </svg>
                </div>
                <div className="leading-tight">
                  <span className="block text-green-600 font-extrabold text-sm">Ready Grocery</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col py-3 flex-1 overflow-y-auto">
              {NAV_LINKS.map((link) => {
                if (link.scrollTo) {
                  return (
                    <button
                      key={link.label}
                      onClick={() => handleNavClick(link)}
                      className="text-left px-5 py-3 text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-600 transition border-none bg-transparent"
                    >
                      {link.label}
                    </button>
                  );
                }
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-5 py-3 text-sm font-medium transition ${isActive ? 'text-green-600 font-semibold bg-green-50' : 'text-gray-700 hover:bg-green-50 hover:text-green-600'}`
                    }
                  >
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
              {isLoggedIn ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { navigate('/user/userDashboard'); setMobileMenuOpen(false); }}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-green-600 py-2 transition"
                  >
                    <User size={16} /> Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 py-2 transition"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { openLogin(); setMobileMenuOpen(false); }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg py-2.5 transition flex items-center justify-center gap-2"
                >
                  <User size={16} /> Login / Register
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Overlay to close desktop dropdown */}
      {showDropdown && (
        <div className="fixed inset-0 z-30" onClick={() => setShowDropdown(false)} />
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default UserNavbar;