// src/components/ScrollToTop.jsx
// Handles two things:
//   1. Auto-scroll to top on every route change
//   2. Shows a floating button when user scrolls down 300px+
//
// Usage in App.jsx (inside <Router>):
//   import ScrollToTop from './components/ScrollToTop';
//   <ScrollToTop />

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  // ── 1. Auto-scroll to top on route change ──────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  // ── 2. Show/hide button based on scroll position ───────────────────────
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <style>{`
        .stt-btn {
          position: fixed;
          bottom: 28px;
          right: 24px;
          z-index: 9999;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #2d9e2d;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(45, 158, 45, 0.35);
          transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s;
          opacity: 0;
          transform: translateY(16px) scale(0.85);
          pointer-events: none;
        }
        .stt-btn.stt-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .stt-btn:hover {
          background: #218c21;
          transform: translateY(-2px) scale(1.07);
          box-shadow: 0 6px 20px rgba(45, 158, 45, 0.45);
        }
        .stt-btn:active {
          transform: scale(0.95);
        }

        /* Nudge up on mobile so it clears bottom nav bars */
        @media (max-width: 768px) {
          .stt-btn {
            bottom: 90px;
            right: 16px;
            width: 40px;
            height: 40px;
          }
        }
      `}</style>

      <button
        className={`stt-btn${visible ? " stt-visible" : ""}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Back to top"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </>
  );
}