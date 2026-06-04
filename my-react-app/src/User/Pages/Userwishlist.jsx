// src/Pages/UserWishlist.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Star, Package, ArrowRight, Loader2 } from 'lucide-react';
import {
  fetchWishlist,
  removeFromWishlist,
  addToCart,
} from '../utils/cartWishlist';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getImage = (prod) =>
  prod?.thumbnail || prod?.additionalImages?.[0] || null;

const formatPrice = (n) =>
  typeof n === 'number' ? `₹${n.toFixed(2)}` : '—';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: type === 'success' ? '#166534' : '#991b1b',
      color: '#fff',
      padding: '12px 20px',
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 600,
      boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
      animation: 'toastIn 0.25s ease',
      whiteSpace: 'nowrap',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <style>{`@keyframes toastIn { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
      {type === 'success' ? <ShoppingCart size={15} /> : <Trash2 size={15} />}
      {message}
    </div>
  );
};

// ─── Product Card ─────────────────────────────────────────────────────────────
const WishlistCard = ({ product, onRemove, onAddToCart, removing, addingToCart }) => {
  const image         = getImage(product);
  const price         = product.buyingPrice ?? 0;
  const originalPrice = product.sellingPrice ?? null;
  const hasDiscount   = originalPrice && originalPrice > price;
  const discountPct   = hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0;
  const catName       = typeof product.category === 'object' ? product.category?.name : product.category || '';
  const unit          = product.unit || '';
  const rating        = product.averageRating ?? 0;
  const reviewCount   = product.reviewCount ?? 0;
  const soldCount     = product.soldCount ?? product.sold ?? null;
  const stock         = product.stock ?? product.quantity ?? null;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e8f5e9',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, transform 0.2s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(22,163,74,0.13)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Discount badge */}
      {hasDiscount && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 2,
          background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 800,
          padding: '3px 8px', borderRadius: 6,
        }}>
          {discountPct}% OFF
        </div>
      )}

      {/* Remove from wishlist */}
      <button
        onClick={() => onRemove(product._id)}
        disabled={removing}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          background: removing ? '#fca5a5' : '#fff',
          border: '1.5px solid #fca5a5',
          borderRadius: '50%', width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: removing ? 'not-allowed' : 'pointer',
          color: '#ef4444',
          transition: 'background 0.15s, transform 0.15s',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          flexShrink: 0,
        }}
        title="Remove from wishlist"
      >
        {removing
          ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />
          : <Heart size={15} fill="#ef4444" />
        }
      </button>

      {/* Image */}
      <div style={{
        width: '100%', aspectRatio: '1 / 1',
        background: '#f9fafb', display: 'flex',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
        {image
          ? <img src={image} alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Package size={40} color="#d1d5db" />
        }
      </div>

      {/* Body */}
      <div style={{ padding: '12px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Category */}
        {catName && (
          <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {catName}
          </span>
        )}

        {/* Name */}
        <p style={{
          fontSize: 13, fontWeight: 700, color: '#111827',
          lineHeight: 1.35, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {product.name}
        </p>

        {/* Rating + Sold */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', flexWrap: 'wrap', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star size={11} fill={rating > 0 ? '#f59e0b' : 'none'} color={rating > 0 ? '#f59e0b' : '#d1d5db'} />
            <span style={{ fontWeight: 600, color: '#374151' }}>{rating.toFixed(1)}</span>
            <span>({reviewCount})</span>
          </div>
          {soldCount !== null && (
            <span style={{ fontSize: 10 }}>Sold: <strong>{soldCount}</strong>{stock ? `/${stock}` : ''}</span>
          )}
        </div>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, flexWrap: 'wrap', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
          {unit && (
            <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '2px 6px', borderRadius: 6 }}>
              {unit}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={() => onAddToCart(product._id)}
          disabled={addingToCart}
          style={{
            marginTop: 8,
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 0',
            border: '1.5px solid #16a34a',
            borderRadius: 10,
            background: addingToCart ? '#dcfce7' : '#fff',
            color: '#16a34a',
            fontSize: 12, fontWeight: 700,
            cursor: addingToCart ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s, color 0.15s',
            boxSizing: 'border-box',
          }}
          onMouseEnter={e => {
            if (!addingToCart) {
              e.currentTarget.style.background = '#16a34a';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={e => {
            if (!addingToCart) {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.color = '#16a34a';
            }
          }}
        >
          {addingToCart
            ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
            : <ShoppingCart size={14} />
          }
          {addingToCart ? 'Adding…' : 'Add To Cart'}
        </button>
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyWishlist = ({ onBrowse }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '48px 16px', gap: 16, textAlign: 'center',
  }}>
    <div style={{
      width: 80, height: 80, borderRadius: '50%',
      background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Heart size={36} color="#16a34a" />
    </div>
    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827', margin: 0 }}>
      Your wishlist is empty
    </h3>
    <p style={{ fontSize: 13, color: '#6b7280', margin: 0, maxWidth: 280 }}>
      Save products you love to your wishlist and add them to your cart when you're ready.
    </p>
    <button
      onClick={onBrowse}
      style={{
        marginTop: 8, display: 'flex', alignItems: 'center', gap: 8,
        padding: '11px 24px', background: '#16a34a', color: '#fff',
        border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700,
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      Browse Products <ArrowRight size={16} />
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const UserWishlist = () => {
  const navigate = useNavigate();

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [removing,   setRemoving]   = useState({});
  const [addingCart, setAddingCart] = useState({});
  const [toast,      setToast]      = useState(null);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWishlist();
      const list = data.products || data.data || (Array.isArray(data) ? data : []);
      setProducts(list);
    } catch {
      setError('Failed to load wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadWishlist(); }, [loadWishlist]);

  useEffect(() => {
    const handler = (e) => {
      const updated = e.detail?.products || e.detail?.data;
      if (Array.isArray(updated)) setProducts(updated);
    };
    window.addEventListener('wishlist-updated', handler);
    return () => window.removeEventListener('wishlist-updated', handler);
  }, []);

  const handleRemove = async (productId) => {
    setRemoving(p => ({ ...p, [productId]: true }));
    try {
      await removeFromWishlist(productId);
      setProducts(prev => prev.filter(p => p._id !== productId));
      setToast({ message: 'Removed from wishlist', type: 'remove' });
    } catch {
      setToast({ message: 'Failed to remove item', type: 'remove' });
    } finally {
      setRemoving(p => ({ ...p, [productId]: false }));
    }
  };

  const handleAddToCart = async (productId) => {
    setAddingCart(p => ({ ...p, [productId]: true }));
    try {
      await addToCart(productId, 1);
      setToast({ message: 'Added to cart!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to add to cart', type: 'remove' });
    } finally {
      setAddingCart(p => ({ ...p, [productId]: false }));
    }
  };

  return (
    <div style={{ flex: 1, padding: '0 0 40px', minHeight: 0, boxSizing: 'border-box' }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }

        /* ── Wishlist grid ── */
        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);   /* 2 cols on mobile */
          gap: 12px;
          animation: fadeUp 0.3s ease;
        }
        .wishlist-skeleton-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        /* ── Tablet and up ── */
        @media (min-width: 560px) {
          .wishlist-grid,
          .wishlist-skeleton-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
          }
        }

        /* ── Desktop ── */
        @media (min-width: 900px) {
          .wishlist-grid,
          .wishlist-skeleton-grid {
            grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
            gap: 20px;
          }
        }

        /* ── Header ── */
        .wishlist-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 10px;
          flex-wrap: wrap;
        }
        .wishlist-title {
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wishlist-shop-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1.5px solid #16a34a;
          color: #16a34a;
          border-radius: 10px;
          padding: 7px 13px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .wishlist-shop-btn:hover {
          background: #16a34a;
          color: #fff;
        }

        @media (min-width: 480px) {
          .wishlist-title  { font-size: 22px; }
          .wishlist-shop-btn { font-size: 13px; padding: 8px 16px; }
        }
      `}</style>

      {/* Header */}
      <div className="wishlist-header">
        <h2 className="wishlist-title">
          <Heart size={20} color="#16a34a" fill="#16a34a" />
          Wishlist
          {!loading && (
            <span style={{
              fontSize: 13, fontWeight: 700, color: '#16a34a',
              background: '#dcfce7', padding: '3px 10px', borderRadius: 20,
            }}>
              {products.length}
            </span>
          )}
        </h2>

        {products.length > 0 && (
          <button
            className="wishlist-shop-btn"
            onClick={() => navigate('/user/product')}
          >
            Continue Shopping <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="wishlist-skeleton-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: '#fff', borderRadius: 16, overflow: 'hidden',
              border: '1px solid #e8f5e9', animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <div style={{ width: '100%', aspectRatio: '1/1', background: '#f3f4f6' }} />
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 6, width: '55%' }} />
                <div style={{ height: 14, background: '#f3f4f6', borderRadius: 6 }} />
                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 6, width: '40%' }} />
                <div style={{ height: 34, background: '#f3f4f6', borderRadius: 10, marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{
          padding: '16px 20px', background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 12, color: '#991b1b', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={loadWishlist}
            style={{
              background: '#991b1b', color: '#fff', border: 'none',
              padding: '6px 14px', borderRadius: 8, fontSize: 13,
              fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && products.length === 0 && (
        <EmptyWishlist onBrowse={() => navigate('/user/product')} />
      )}

      {/* Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="wishlist-grid">
          {products.map(prod => (
            <WishlistCard
              key={prod._id}
              product={prod}
              onRemove={handleRemove}
              onAddToCart={handleAddToCart}
              removing={!!removing[prod._id]}
              addingToCart={!!addingCart[prod._id]}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default UserWishlist;