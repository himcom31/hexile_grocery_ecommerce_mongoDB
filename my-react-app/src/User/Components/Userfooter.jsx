// src/components/UserFooter.jsx
// ✅ 100% MOBILE RESPONSIVE — all content visible on every screen size
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

const UserFooter = () => {
  const navigate = useNavigate();

  return (
    <footer style={{ background: '#1a1f1a', color: '#d1d5db', width: '100%', fontFamily: 'inherit' }}>
      <style>{`
        .uf-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px 20px;
        }
        @media (min-width: 640px) {
          .uf-grid {
            grid-template-columns: 1fr 1fr 1fr;
          }
        }
        @media (min-width: 900px) {
          .uf-grid {
            grid-template-columns: 2fr 1fr 1fr;
          }
        }

        .uf-social { display: flex; flex-wrap: wrap; gap: 10px; }

        .uf-top {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 28px 16px 20px;
          border-bottom: 1px solid #374151;
        }
        @media (min-width: 640px) {
          .uf-top {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 32px 32px 24px;
          }
        }
        @media (min-width: 1024px) {
          .uf-top { padding: 36px 48px 24px; }
        }

        .uf-main {
          padding: 24px 16px 20px;
        }
        @media (min-width: 640px) {
          .uf-main { padding: 28px 32px 24px; }
        }
        @media (min-width: 1024px) {
          .uf-main { padding: 32px 48px 24px; }
        }

        .uf-bottom {
          border-top: 1px solid #374151;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          text-align: center;
        }
        @media (min-width: 640px) {
          .uf-bottom {
            flex-direction: row;
            justify-content: space-between;
            padding: 14px 32px;
            text-align: left;
          }
        }
        @media (min-width: 1024px) {
          .uf-bottom { padding: 14px 48px; }
        }

        .uf-store-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
        }
        @media (min-width: 640px) {
          .uf-store-badges { justify-content: flex-end; }
        }

        .uf-store-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #000;
          border: 1px solid #4b5563;
          border-radius: 12px;
          padding: 8px 14px;
          text-decoration: none;
          transition: border-color 0.2s;
          min-height: 44px;
        }
        .uf-store-btn:hover { border-color: #9ca3af; }

        .uf-social-btn {
          width: 40px; height: 40px; min-width: 40px; min-height: 40px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.2s;
          text-decoration: none;
        }
        .uf-social-btn:hover { opacity: 0.85; }

        .uf-link {
          color: #9ca3af;
          text-decoration: none;
          font-size: 13px;
          transition: color 0.15s;
          line-height: 1.6;
        }
        .uf-link:hover { color: #fff; }

        .uf-col-title {
          color: #fff;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin: 0 0 16px;
        }

        /* About column spans full width on smallest screens */
        .uf-about-col {
          grid-column: 1 / -1;
        }
        @media (min-width: 640px) {
          .uf-about-col {
            grid-column: 1 / -1;
          }
        }
        @media (min-width: 900px) {
          .uf-about-col {
            grid-column: auto;
          }
        }
      `}</style>

      {/* ── Top: Logo + Social ── */}
      <div className="uf-top">
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          onClick={() => navigate('/user/home')}
        >
          <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
            <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
              <rect x="6" y="20" width="48" height="34" rx="4" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2.5"/>
              <path d="M20 20 C20 10 40 10 40 20" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial">R</text>
              <circle cx="20" cy="56" r="3" fill="white"/>
              <circle cx="40" cy="56" r="3" fill="white"/>
            </svg>
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <span style={{ display: 'block', color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>Ready</span>
            <span style={{ display: 'block', color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px', marginTop: -2 }}>Grocery</span>
          </div>
        </div>

        {/* Social Icons */}
        <div className="uf-social">
          {/* Facebook */}
          <a href="#" className="uf-social-btn" style={{ background: '#1877f2' }}>
            <svg viewBox="0 0 24 24" fill="white" style={{ width: 18, height: 18 }}>
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
            </svg>
          </a>
          {/* LinkedIn */}
          <a href="#" className="uf-social-btn" style={{ background: '#0a66c2' }}>
            <svg viewBox="0 0 24 24" fill="white" style={{ width: 18, height: 18 }}>
              <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
              <circle cx="4" cy="4" r="2" fill="white"/>
            </svg>
          </a>
          {/* Instagram */}
          <a href="#" className="uf-social-btn" style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
            </svg>
          </a>
          {/* YouTube */}
          <a href="#" className="uf-social-btn" style={{ background: '#ff0000' }}>
            <svg viewBox="0 0 24 24" fill="white" style={{ width: 18, height: 18 }}>
              <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/>
              <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#ff0000"/>
            </svg>
          </a>
          {/* WhatsApp */}
          <a href="#" className="uf-social-btn" style={{ background: '#25d366' }}>
            <svg viewBox="0 0 24 24" fill="white" style={{ width: 18, height: 18 }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.122 1.532 5.855L.057 23.535a.75.75 0 00.916.918l5.803-1.46A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.498-5.253-1.37l-.376-.214-3.898.981.998-3.792-.234-.389A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
            </svg>
          </a>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="uf-main">
        <div className="uf-grid">

          {/* About + Contact — full width on mobile/tablet, first col on desktop */}
          <div className="uf-about-col">
            <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.7, marginBottom: 20, maxWidth: 380, margin: '0 0 20px' }}>
              ReadyGrocery is your trusted online shop for fresh groceries, perfumes, and daily essentials.
              We deliver quality products at the best prices—right to your doorstep.
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#9ca3af' }}>
                <MapPin size={15} color="#22c55e" style={{ flexShrink: 0 }} />
                Dhaka, Bangladesh
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#9ca3af' }}>
                <Phone size={15} color="#22c55e" style={{ flexShrink: 0 }} />
                +8801711257498
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#9ca3af' }}>
                <Mail size={15} color="#22c55e" style={{ flexShrink: 0 }} />
                support@razinsoft.com
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="uf-col-title">Quick Links</h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Products', 'About us', 'Most Popular', 'Best Deal', 'Become a Seller', 'Blogs'].map(link => (
                <li key={link}>
                  <a href="#" className="uf-link">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="uf-col-title">Company</h4>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Contact', 'Terms & Conditions', 'Privacy Policy'].map(link => (
                <li key={link}>
                  <a href="#" className="uf-link">{link}</a>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="uf-bottom">
        {/* Copyright */}
        <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
          © 2026 All Rights Reserved By RazinSoft
        </p>

        {/* App Store Badges */}
        <div className="uf-store-badges">
          {/* Google Play */}
          <a href="#" className="uf-store-btn">
            <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
              <path d="M3.18 23.76a2 2 0 001.94-.21l11.81-6.82-3.36-3.36L3.18 23.76z" fill="#EA4335"/>
              <path d="M20.82 10.27L17.57 8.4l-3.73 3.73 3.73 3.73 3.27-1.89a2 2 0 000-3.7z" fill="#FBBC04"/>
              <path d="M1.22 1.5A2 2 0 001 2.46v19.08a2 2 0 00.22.96l.11.11 10.69-10.69v-.25L1.33 1.39l-.11.11z" fill="#4285F4"/>
              <path d="M13.57 13.57L3.12 24a2 2 0 001.94-.21l11.81-6.82-3.3-3.4z" fill="#34A853"/>
            </svg>
            <div style={{ lineHeight: 1.2 }}>
              <span style={{ display: 'block', color: '#9ca3af', fontSize: 9 }}>Download on the</span>
              <span style={{ display: 'block', color: '#fff', fontSize: 12, fontWeight: 600 }}>Google Play</span>
            </div>
          </a>

          {/* App Store */}
          <a href="#" className="uf-store-btn">
            <svg viewBox="0 0 24 24" fill="white" style={{ width: 22, height: 22, flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.15-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.37 2.78M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <div style={{ lineHeight: 1.2 }}>
              <span style={{ display: 'block', color: '#9ca3af', fontSize: 9 }}>Download on the</span>
              <span style={{ display: 'block', color: '#fff', fontSize: 12, fontWeight: 600 }}>App Store</span>
            </div>
          </a>
        </div>
      </div>

    </footer>
  );
};

export default UserFooter;