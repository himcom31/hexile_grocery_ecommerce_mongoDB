// src/components/UserLayout.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

// User Pages — uncomment as you add them
import UserDashboard from './Components/Userdashboard';
import UserWishlist from './Pages/Userwishlist';
import Checkout from './Components/Checkout';

// ─── Mobile Bottom Navigation ────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: 'userDashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Wishlist',
    path: 'wishlist',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    label: 'Checkout',
    path: 'checkout',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  // Uncomment to add more nav items:
  // { label: 'Profile', path: 'profile', icon: <...> },
  // { label: 'Orders',  path: 'orders',  icon: <...> },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around h-16">
        {NAV_ITEMS.map(({ label, path, icon }) => {
          const isActive = location.pathname.includes(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center flex-1 gap-0.5 text-xs font-medium transition-colors duration-150
                ${isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <span className={`transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span>{label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// ─── Main Layout ─────────────────────────────────────────────────────────────
const UserLayout = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="flex flex-1 min-h-0 relative">

      {/* Optional Sidebar — uncomment if your desktop layout needs one */}
      {/* {!isMobile && <UserSidebar />} */}

      {/*
        Main content area:
        - On mobile: add bottom padding so content isn't hidden behind the nav bar
        - On desktop: normal layout
      */}
      <div
        className={`
          flex-1 overflow-y-auto w-full
          px-4 py-4
          sm:px-6 sm:py-6
          md:px-8 md:py-8
          ${isMobile ? 'pb-20' : ''}
        `}
      >
        <Routes>

          {/* Default /user/ → redirect to dashboard */}
          {/* <Route index element={<Navigate to="userDashboard" replace />} /> */}

          {/* Protected User Pages */}
          <Route path="userDashboard" element={<UserDashboard />} />
          <Route path="wishlist"      element={<UserWishlist />} />
          <Route path="checkout"      element={<Checkout />} />

          {/* Add more protected user routes here */}
          {/* <Route path="profile"       element={<UserProfile />} /> */}
          {/* <Route path="orders"        element={<UserOrders />} /> */}
          {/* <Route path="orders/:id"    element={<UserOrderDetail />} /> */}
          {/* <Route path="cart"          element={<UserCart />} /> */}
          {/* <Route path="addresses"     element={<UserAddresses />} /> */}
          {/* <Route path="wallet"        element={<UserWallet />} /> */}
          {/* <Route path="notifications" element={<UserNotifications />} /> */}
          {/* <Route path="settings"      element={<UserSettings />} /> */}

        </Routes>
      </div>

      {/* Mobile Bottom Navigation — only shown on small screens */}
      {isMobile && <MobileBottomNav />}

    </div>
  );
};

export default UserLayout;