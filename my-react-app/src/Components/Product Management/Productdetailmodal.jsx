import React from 'react';
import { X, Globe, Star } from 'lucide-react';

// Safely extract category name from any format:
// "Vegetables" (string) → "Vegetables"
// { name: "Vegetables" } (object) → "Vegetables"  
// "69e1ff391914e11bea84fa2e" (ObjectId string) → null → shows "—"
const getCategoryName = (cat) => {
  if (!cat) return null;
  if (typeof cat === 'object') return cat.name ?? cat.title ?? cat.label ?? null;
  // If it looks like a MongoDB ObjectId (24 hex chars), it's not a readable name
  if (/^[a-f\d]{24}$/i.test(cat)) return null;
  return cat;
};

export default function ProductDetailModal({ product, onClose }) {
  if (!product) return null;

  const fmt        = (v) => (v && v > 0 ? `$${v}` : '$0');
  const categoryName = getCategoryName(product.category);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
      >
        {/* Modal card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff', borderRadius: 14, width: '100%', maxWidth: 860,
            maxHeight: '90vh', overflowY: 'auto', padding: 28,
            position: 'relative', fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: '#F3F4F6', border: 'none', borderRadius: 8,
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={16} color="#374151" />
          </button>

          {/* Title */}
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 20 }}>
            Product Details
          </h2>

          {/* Top section */}
          <div style={{
            background: '#F9FAFB', border: '1px solid #EAECF0',
            borderRadius: 12, padding: 24, marginBottom: 20,
          }}>
            {/* Stats row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1F2B' }}>
                {product.totalOrders ?? 0} Orders
              </span>
              <span style={{ color: '#D1D5DB' }}>|</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#1A1F2B' }}>
                <Star size={14} fill="#F59E0B" color="#F59E0B" />
                {Number(product.rating ?? 0).toFixed(1)}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1F2B' }}>
                {Number(product.reviewCount ?? 0).toFixed(1)} Reviews
              </span>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: '#6B7280', marginRight: 8 }}>status:</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#DCFCE7', color: '#16A34A',
                fontSize: 12, fontWeight: 600, padding: '3px 10px',
                borderRadius: 20, border: '1px solid #BBF7D0',
              }}>
                ✓ {product.status ?? 'Approved'}
              </span>
            </div>

            {/* Image + Name */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {/* Thumbnail */}
              <div style={{
                width: 160, height: 140, border: '1px solid #E5E7EB',
                borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {product.thumbnail
                  ? <img
                      src={product.thumbnail}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  : null
                }
                <span style={{
                  display: product.thumbnail ? 'none' : 'flex',
                  color: '#9CA3AF', fontSize: 12, alignItems: 'center', justifyContent: 'center',
                  width: '100%', height: '100%',
                }}>No Image</span>
              </div>

              {/* Name + short desc + View Live */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 22, fontWeight: 600, color: '#111827', margin: '0 0 6px' }}>
                  {product.name}
                </h3>
                {product.shortDescription && (
                  <>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>
                      Short Description
                    </p>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.6 }}>
                      {product.shortDescription}
                    </p>
                  </>
                )}
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  border: '1.5px solid #00B14F', color: '#00B14F',
                  background: 'transparent', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, padding: '7px 14px', cursor: 'pointer',
                }}>
                  <Globe size={14} /> View Live
                </button>
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            border: '1px solid #EAECF0', borderRadius: 12, overflow: 'hidden',
            marginBottom: 20,
          }}>
            {/* General */}
            <div style={{ padding: '20px 24px', borderRight: '1px solid #EAECF0' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
                General Information
              </p>
              <InfoRow label="Brand" value={typeof product.brand === "object" && product.brand !== null ? (product.brand.name ?? "") : product.brand} />
              <InfoRow label="Categories" value={categoryName} />
              <InfoRow label="Unit"       value={product.unit ? `1 ${product.unit.toUpperCase()}` : null} />
            </div>

            {/* Price */}
            <div style={{ padding: '20px 24px', borderRight: '1px solid #EAECF0' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
                Price Information
              </p>
              <InfoRow label="Price"          value={fmt(product.sellingPrice ?? product.price)} />
              <InfoRow label="Discount Price" value={fmt(product.discountPrice)} />
            </div>

            {/* Stock */}
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>
                Current Stock Quantity
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
                {product.stockQuantity ?? product.stock ?? 0}
              </p>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div style={{ borderTop: '1px solid #EAECF0', paddingTop: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
                Description
              </p>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, margin: 0 }}>
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10, fontSize: 13 }}>
      <span style={{ color: '#374151', minWidth: 110 }}>{label}</span>
      <span style={{ color: '#6B7280' }}>:</span>
      <span style={{ color: '#374151', fontWeight: 500 }}>
        {value ?? <span style={{ color: '#D1D5DB' }}>—</span>}
      </span>
    </div>
  );
}