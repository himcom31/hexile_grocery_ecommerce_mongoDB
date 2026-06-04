import React from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import ScrollToTop from './Components/ScrollToTop';  // adjust path as needed


// Admin Pages & Components
import LoginPage from './Admin/Pages/Login';
import AdminLayout from './Components/AdminLayout';

// User Pages & Components
import UserLoginPage from './User/Pages/UserLogin';
import UserLayout from './User/UserLayout';
import HomePage from './User/Pages/HomePage';

// User Shell — visible on all user-side pages
import UserNavbar from './User/Components/Usernavbar';
import UserFooter from './User/Components/Userfooter';

// driver
import DeliveryAgentApp from './Driver/DeliveryAgentApp';



///////////////////////////

import ProductsPage from './User/Pages/Productspage';
import BlogPage from './User/Pages/Blogpage';
import ProductDetails from './User/Pages/Productdetails';


// ─────────────────────────────────────────
// Admin Protected Route — checks adminToken
// If no token → redirect to /admin/login
// ─────────────────────────────────────────
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};


// ─────────────────────────────────────────
// User Protected Route — checks userToken
// If no token → redirect to /user/login
// ─────────────────────────────────────────
const UserProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('userToken');
  if (!token) {
    return <Navigate to="/user/login" replace />;
  }
  return children;
};


// ─────────────────────────────────────────
// Layout wrapper — shows navbar & footer
// only on non-admin routes
// ─────────────────────────────────────────
const AppLayout = ({ children }) => {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');
    const isDriverRoute = pathname.startsWith('/driver');   // ← add this


  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />                              {/* ← ADD HERE */}
      {!isAdminRoute && !isDriverRoute && <UserNavbar />}   {/* ← updated */}
      <main className="flex-1">{children}</main>
      {!isAdminRoute && !isDriverRoute && <UserFooter />}   {/* ← updated */}
    </div>
  );
};


function App() {
  return (
    <AppLayout>
      <Routes>

        {/* 1. Default Route → redirect to home page */}
        <Route path="/" element={<Navigate to="/user/home" replace />} />

        {/* ──────────────────────────────── */}
        {/*         ADMIN ROUTES             */}
        {/* ──────────────────────────────── */}

        {/* 2. Public Route — Admin Login */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* 3. Protected Admin Routes
            - Any path under /admin/* is protected
            - No token → goes back to /admin/login automatically */}
        <Route
          path="/admin/*"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        />

        {/* ──────────────────────────────── */}
        {/*         USER ROUTES              */}
        {/* ──────────────────────────────── */}

        {/* 4. Public Routes — no token required */}
        <Route path="/user/login" element={<UserLoginPage />} />
        <Route path="/user/home" element={<HomePage />} />
        <Route path="/user/product" element={<ProductsPage />} />
        <Route path="/user/blog" element={<BlogPage />} />
        <Route path="/products/:slug" element={<ProductDetails />} />


        {/* /////////////////// driver /////////////////////////////////// */}


        <Route path="/driver/*" element={<DeliveryAgentApp />} />

        {/* /////////////////// driver /////////////////////////////////// */}



        {/* 5. Protected User Routes
            - Any path under /user/* is protected
            - No token → goes back to /user/login automatically */}
        <Route
          path="/user/*"
          element={
            <UserProtectedRoute>
              <UserLayout />
            </UserProtectedRoute>
          }
        />

        {/* 6. 404 Fallback */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center h-screen font-bold text-2xl text-slate-400">
              404 - Page Not Found
            </div>
          }
        />

      </Routes>
    </AppLayout>
  );
}

export default App;