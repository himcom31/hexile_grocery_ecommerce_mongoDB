// src/components/SearchBar.jsx
// Drop-in search bar with live suggestions (products + categories)
// Usage in Navbar:
//   import SearchBar from './SearchBar';
//   <SearchBar />

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CategoryIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const ProductIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
  </svg>
);

const XIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ─── Highlight matching text ───────────────────────────────────────────────────
const Highlight = ({ text = "", query = "" }) => {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark style={{
        background: "rgba(45,158,45,0.15)", color: "#1a6b1a",
        fontWeight: 800, borderRadius: 2, padding: "0 1px",
      }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
};

// ─── Main SearchBar Component ─────────────────────────────────────────────────
export default function SearchBar({ placeholder = "Search products or categories…" }) {
  const navigate   = useNavigate();
  const inputRef   = useRef(null);
  const dropRef    = useRef(null);

  const [query,        setQuery]        = useState("");
  const [suggestions,  setSuggestions]  = useState({ products: [], categories: [] });
  const [loading,      setLoading]      = useState(false);
  const [open,         setOpen]         = useState(false);
  const [activeIndex,  setActiveIndex]  = useState(-1); // keyboard nav

  const debouncedQuery = useDebounce(query, 280);

  // ── Fetch suggestions ────────────────────────────────────────────────────
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q || q.length < 1) {
      setSuggestions({ products: [], categories: [] });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchSuggestions = async () => {
      try {
        // Fetch products + categories in parallel
        const [prodRes, catRes] = await Promise.all([
          fetch(`http://localhost:5000/api/Products/allFree?search=${encodeURIComponent(q)}&limit=5`),
          fetch(`http://localhost:5000/api/Category/all`),
        ]);

        if (cancelled) return;

        const prodData = await prodRes.json();
        const catData  = await catRes.json();

        // Products from backend (already filtered by search param)
        const products = (prodData.products || prodData.data || [])
          .slice(0, 5);

        // Categories — filter client-side by name match
        const allCats = Array.isArray(catData)
          ? catData
          : catData.categories || catData.data || [];
        const categories = allCats
          .filter(c =>
            c.isActive !== false &&
            c.name.toLowerCase().includes(q.toLowerCase())
          )
          .slice(0, 3);

        if (!cancelled) {
          setSuggestions({ products, categories });
          setLoading(false);
          setOpen(true);
          setActiveIndex(-1);
        }
      } catch (e) {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handle = (e) => {
      if (
        dropRef.current  && !dropRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const allSuggestions = [
    ...suggestions.categories.map(c => ({ type: "category", item: c })),
    ...suggestions.products.map(p  => ({ type: "product",  item: p  })),
  ];

  const handleKeyDown = (e) => {
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, allSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && allSuggestions[activeIndex]) {
        selectSuggestion(allSuggestions[activeIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // ── Navigate on select ────────────────────────────────────────────────────
  const selectSuggestion = ({ type, item }) => {
    setOpen(false);
    if (type === "category") {
      // Navigate to products page filtered by this category
      navigate(`/user/product?categories=${item._id}`);
      setQuery(item.name);
    } else {
      // Navigate to products page with product name search
      const name = item.name || item.title || "";
      setQuery(name);
      navigate(`/user/product?search=${encodeURIComponent(name)}`);
    }
  };

  // ── Submit full search ────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e?.preventDefault();
    const q = query.trim();
    setOpen(false);
    if (q) {
      navigate(`/user/product?search=${encodeURIComponent(q)}`);
    }
  };

  const clearQuery = () => {
    setQuery("");
    setSuggestions({ products: [], categories: [] });
    setOpen(false);
    inputRef.current?.focus();
  };

  const hasResults = suggestions.categories.length > 0 || suggestions.products.length > 0;
  const showDrop   = open && query.trim().length > 0;

  // ── Flat index tracking for keyboard highlight
  let flatIdx = -1;
  const nextIdx = () => { flatIdx++; return flatIdx; };

  return (
    <>
      <style>{`
        .sg-wrap  { position: relative; }
        .sg-form  { display: flex; align-items: center; }
        .sg-input {
          width: 320px; padding: 9px 38px 9px 14px;
          font-size: 13.5px; font-family: inherit;
          border: 1.5px solid #e0e0e0; border-right: none;
          border-radius: 10px 0 0 10px; outline: none;
          background: #fff; color: #1a1a1a;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .sg-input:focus {
          border-color: #2d9e2d;
          box-shadow: 0 0 0 3px rgba(45,158,45,0.1);
        }
        .sg-input-wrap { position: relative; }
        .sg-clear {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 2px;
          color: #bbb; display: flex; align-items: center;
          border-radius: 50%; transition: color 0.15s;
        }
        .sg-clear:hover { color: #888; }
        .sg-btn {
          padding: 9px 16px; background: #2d9e2d; border: none;
          border-radius: 0 10px 10px 0; cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          color: #fff; font-size: 13px; font-weight: 700;
          font-family: inherit; transition: background 0.2s;
          white-space: nowrap;
        }
        .sg-btn:hover { background: #218c21; }

        /* Dropdown */
        .sg-drop {
          position: absolute; top: calc(100% + 8px); left: 0;
          width: 100%; min-width: 360px;
          background: #fff; border: 1px solid #e8e8e8;
          border-radius: 14px; box-shadow: 0 12px 40px rgba(0,0,0,0.13);
          z-index: 9999; overflow: hidden;
          animation: sgFadeIn 0.18s ease;
        }
        @keyframes sgFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sg-section-label {
          font-size: 10px; font-weight: 800; letter-spacing: 0.8px;
          text-transform: uppercase; color: #bbb;
          padding: 10px 14px 5px; display: flex; align-items: center; gap: 6px;
        }

        .sg-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px; cursor: pointer;
          transition: background 0.12s;
          border: none; background: transparent; width: 100%;
          text-align: left; font-family: inherit;
        }
        .sg-item:hover, .sg-item.active { background: #f4faf4; }

        .sg-item-icon {
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justifyifyContent: center;
          flex-shrink: 0; overflow: hidden;
        }
        .sg-item-icon img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .sg-item-icon.cat-icon {
          background: #e8f5e9;
          display: flex; align-items: center; justify-content: center;
          color: #2d9e2d;
        }
        .sg-item-icon.prod-icon {
          background: #f5f5f5;
          display: flex; align-items: center; justify-content: center;
          color: #999;
        }

        .sg-item-text { flex: 1; min-width: 0; }
        .sg-item-name {
          font-size: 13px; font-weight: 600; color: #1a1a1a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sg-item-sub  { font-size: 11px; color: #aaa; margin-top: 1px; }
        .sg-item-price { font-size: 13px; font-weight: 800; color: #2d9e2d; flex-shrink: 0; }
        .sg-item-arrow { color: #ccc; flex-shrink: 0; }

        .sg-divider { height: 1px; background: #f0f0f0; margin: 4px 0; }

        .sg-footer {
          padding: 10px 14px; border-top: 1px solid #f0f0f0;
          display: flex; align-items: center; justify-content: space-between;
        }
        .sg-footer-hint { font-size: 11px; color: #bbb; }
        .sg-footer-btn {
          font-size: 12px; font-weight: 700; color: #2d9e2d;
          background: #f0faf0; border: 1px solid #c8e6c9;
          border-radius: 8px; padding: 5px 12px; cursor: pointer;
          font-family: inherit; transition: all 0.15s;
          display: flex; align-items: center; gap: 5px;
        }
        .sg-footer-btn:hover { background: #2d9e2d; color: #fff; border-color: #2d9e2d; }

        .sg-empty {
          padding: 20px 14px; text-align: center;
          font-size: 13px; color: #bbb;
        }
        .sg-loading {
          padding: 16px 14px; display: flex; align-items: center;
          justify-content: center; gap: 8px; color: #bbb; font-size: 13px;
        }
        .sg-spinner {
          width: 16px; height: 16px; border: 2px solid #e0e0e0;
          border-top-color: #2d9e2d; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .sg-input { width: 180px; font-size: 13px; }
          .sg-drop  { min-width: 280px; }
          .sg-btn span { display: none; }
        }
      `}</style>

      <div className="sg-wrap">
        <form className="sg-form" onSubmit={handleSearch}>
          <div className="sg-input-wrap">
            <input
              ref={inputRef}
              className="sg-input"
              type="text"
              value={query}
              placeholder={placeholder}
              autoComplete="off"
              onChange={e => {
                setQuery(e.target.value);
                if (e.target.value.trim()) setOpen(true);
                else { setOpen(false); setSuggestions({ products: [], categories: [] }); }
              }}
              onFocus={() => { if (query.trim() && hasResults) setOpen(true); }}
              onKeyDown={handleKeyDown}
            />
            {query && (
              <button type="button" className="sg-clear" onClick={clearQuery} tabIndex={-1}>
                <XIcon />
              </button>
            )}
          </div>
          <button type="submit" className="sg-btn">
            <SearchIcon />
            <span>Search</span>
          </button>
        </form>

        {/* ── Dropdown ── */}
        {showDrop && (
          <div className="sg-drop" ref={dropRef}>

            {loading ? (
              <div className="sg-loading">
                <div className="sg-spinner" />
                Searching…
              </div>

            ) : !hasResults ? (
              <div className="sg-empty">
                No results for <strong>"{query}"</strong>
              </div>

            ) : (
              <>
                {/* ── Categories Section ── */}
                {suggestions.categories.length > 0 && (
                  <>
                    <div className="sg-section-label">
                      <CategoryIcon /> Categories
                    </div>
                    {suggestions.categories.map(cat => {
                      const idx = nextIdx();
                      return (
                        <button
                          key={cat._id}
                          className={`sg-item${activeIndex === idx ? " active" : ""}`}
                          onMouseDown={() => selectSuggestion({ type: "category", item: cat })}
                          onMouseEnter={() => setActiveIndex(idx)}
                        >
                          <div className="sg-item-icon cat-icon">
                            {cat.thumbnail
                              ? <img src={cat.thumbnail} alt={cat.name} />
                              : <CategoryIcon />
                            }
                          </div>
                          <div className="sg-item-text">
                            <div className="sg-item-name">
                              <Highlight text={cat.name} query={query} />
                            </div>
                            <div className="sg-item-sub">Browse category</div>
                          </div>
                          <div className="sg-item-arrow"><ArrowIcon /></div>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Divider between sections */}
                {suggestions.categories.length > 0 && suggestions.products.length > 0 && (
                  <div className="sg-divider" />
                )}

                {/* ── Products Section ── */}
                {suggestions.products.length > 0 && (
                  <>
                    <div className="sg-section-label">
                      <ProductIcon /> Products
                    </div>
                    {suggestions.products.map(prod => {
                      const idx      = nextIdx();
                      const price    = prod.buyingPrice  || 0;
                      const oldPrice = prod.sellingPrice || null;
                      const image    = prod.thumbnail    || prod.additionalImages?.[0];
                      const catName  = typeof prod.category === "object"
                        ? prod.category?.name
                        : "";

                      return (
                        <button
                          key={prod._id}
                          className={`sg-item${activeIndex === idx ? " active" : ""}`}
                          onMouseDown={() => selectSuggestion({ type: "product", item: prod })}
                          onMouseEnter={() => setActiveIndex(idx)}
                        >
                          <div className="sg-item-icon prod-icon">
                            {image
                              ? <img src={image} alt={prod.name} />
                              : <ProductIcon />
                            }
                          </div>
                          <div className="sg-item-text">
                            <div className="sg-item-name">
                              <Highlight text={prod.name || ""} query={query} />
                            </div>
                            {catName && (
                              <div className="sg-item-sub">{catName}</div>
                            )}
                          </div>
                          <div className="sg-item-price">₹{price.toFixed(2)}</div>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Footer */}
                <div className="sg-footer">
                  <span className="sg-footer-hint">
                    ↑↓ navigate · Enter to select · Esc to close
                  </span>
                  <button
                    type="button"
                    className="sg-footer-btn"
                    onMouseDown={handleSearch}
                  >
                    <SearchIcon />
                    See all results
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}