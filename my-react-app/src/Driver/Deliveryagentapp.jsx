import { useState, useEffect, useCallback, createContext, useContext } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthCtx = createContext(null);
function useAuth() { return useContext(AuthCtx); }

// ─── Sidebar Context ──────────────────────────────────────────────────────────
const SidebarCtx = createContext(null);
function useSidebar() { return useContext(SidebarCtx); }

// ─── API helper ───────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}, token = null) {
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── Image Compression ────────────────────────────────────────────────────────
const QUALITY = 0.20;

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.onload  = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload  = () => {
        const canvas = document.createElement("canvas");
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Canvas compression failed")); return; }
            const compressedName = file.name.replace(/\.[^.]+$/, "") + "_compressed.jpg";
            resolve(new File([blob], compressedName, { type: "image/jpeg" }));
          },
          "image/jpeg",
          QUALITY
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusColor(status) {
  const map = {
    Pending:        "bg-yellow-100 text-yellow-700",
    Processing:     "bg-blue-100 text-blue-700",
    Shipped:        "bg-indigo-100 text-indigo-700",
    "Picked Up":    "bg-purple-100 text-purple-700",
    "In Transit":   "bg-cyan-100 text-cyan-700",
    "On The Way":   "bg-orange-100 text-orange-700",
    Delivered:      "bg-green-100 text-green-700",
    Cancelled:      "bg-red-100 text-red-700",
    Returned:       "bg-gray-100 text-gray-600",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

function stageColorDot(status) {
  const map = {
    "Picked Up":  "bg-purple-500",
    "In Transit": "bg-cyan-500",
    "On The Way": "bg-orange-500",
    "Delivered":  "bg-green-500",
    "Processing": "bg-blue-400",
    "Shipped":    "bg-indigo-400",
    "Cancelled":  "bg-red-400",
  };
  return map[status] || "bg-gray-400";
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = "h-8 w-8" }) {
  return (
    <div className={`${size} animate-spin rounded-full border-4 border-orange-200 border-t-orange-500`} />
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white";
  return (
    <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg text-sm font-medium ${colors}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function Sidebar({ currentPage, onNavigate, orders }) {
  const { driver, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  const stats = {
    total:     orders.length,
    active:    orders.filter(o => ["Picked Up", "In Transit", "On The Way"].includes(o.status)).length,
    delivered: orders.filter(o => o.status === "Delivered").length,
    cancelled: orders.filter(o => o.status === "Cancelled").length,
  };

  const navItems = [
    {
      id: "dashboard",
      label: "All Orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      count: stats.total,
    },
    {
      id: "active",
      label: "Active",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      count: stats.active,
      countColor: "bg-orange-500",
    },
    {
      id: "delivered",
      label: "Delivered",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      count: stats.delivered,
      countColor: "bg-green-500",
    },
    {
      id: "cancelled",
      label: "Cancelled",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      count: stats.cancelled,
      countColor: "bg-red-500",
    },
  ];

  const activePage = typeof currentPage === "string" ? currentPage : "dashboard";

  const handleNav = (id) => {
    onNavigate(id);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[90] lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-[100] w-64
          flex flex-col bg-white border-r border-gray-100
          shadow-2xl lg:shadow-none
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-auto
        `}
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-200 flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">DeliverEase</p>
            <p className="text-xs text-orange-500 font-medium">Agent Portal</p>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Driver Profile */}
        <div className="mx-4 mt-4 mb-2 p-3 bg-orange-50 rounded-2xl border border-orange-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {driver?.fullName?.charAt(0)?.toUpperCase() || "D"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{driver?.fullName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                <p className="text-xs text-gray-500 truncate">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats pills */}
        <div className="px-4 mb-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-orange-50 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold text-orange-600 leading-tight">{stats.active}</p>
              <p className="text-xs text-orange-400 font-medium">Active</p>
            </div>
            <div className="bg-green-50 rounded-xl px-3 py-2 text-center">
              <p className="text-lg font-bold text-green-600 leading-tight">{stats.delivered}</p>
              <p className="text-xs text-green-400 font-medium">Delivered</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 mb-2 border-t border-gray-100" />
        <p className="px-5 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Navigation</p>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                    : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                  }
                `}
              >
                <span className={`flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}>
                  {item.icon}
                </span>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.count > 0 && (
                  <span className={`
                    text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0
                    ${isActive ? "bg-white/20 text-white" : `${item.countColor || "bg-gray-200"} text-white`}
                  `}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Logout */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition group"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle, onBack, showBack }) {
  const { setSidebarOpen } = useSidebar();
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
      <div className="px-4 sm:px-6 py-3.5 flex items-center gap-3">
        {/* Hamburger (mobile only) */}
        {!showBack && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition flex-shrink-0"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        {/* Back button */}
        {showBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition flex-shrink-0"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-400 leading-tight truncate">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1: Login
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/driver/login", { method: "POST", body: JSON.stringify(form) });
      login(data.token, data.driver);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl mb-4 shadow-lg shadow-orange-200">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DeliverEase</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your delivery portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                autoComplete="email" placeholder="agent@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition placeholder-gray-400" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} name="password" value={form.password}
                  onChange={handleChange} required autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition placeholder-gray-400" />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2.5 border border-red-200">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md shadow-orange-200">
              {loading ? <Spinner size="h-5 w-5" /> : null}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">Contact your admin if you need access.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2: Dashboard
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ onSelectOrder, filterOverride, allOrders, loading }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Apply sidebar nav filter override
  const activeFilter = filterOverride || filter;

  const STATUS_TABS = ["All", "Picked Up", "In Transit", "Delivered", "Cancelled"];

  // Map sidebar route to status filter
  const routeFilterMap = {
    active: ["Picked Up", "In Transit", "On The Way"],
    delivered: ["Delivered"],
    cancelled: ["Cancelled"],
  };

  const filtered = allOrders.filter((o) => {
    let matchStatus;
    if (filterOverride && routeFilterMap[filterOverride]) {
      matchStatus = routeFilterMap[filterOverride].includes(o.status);
    } else {
      matchStatus = filter === "All" || o.status === filter;
    }
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.shippingAddress?.name?.toLowerCase().includes(q) ||
      o.shippingAddress?.phone?.includes(q);
    return matchStatus && matchSearch;
  });

  const pageTitle = {
    active: "Active Deliveries",
    delivered: "Delivered Orders",
    cancelled: "Cancelled Orders",
    dashboard: "All Orders",
  }[filterOverride] || "All Orders";

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      <Topbar title={pageTitle} subtitle={`${filtered.length} order${filtered.length !== 1 ? "s" : ""}`} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-5">

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total" value={allOrders.length} color="bg-blue-50 text-blue-700" />
            <StatCard label="Active" value={allOrders.filter(o => ["Picked Up","In Transit","On The Way"].includes(o.status)).length} color="bg-orange-50 text-orange-600" />
            <StatCard label="Done" value={allOrders.filter(o => o.status === "Delivered").length} color="bg-green-50 text-green-700" />
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or customer…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
          </div>

          {/* Status tabs (only show when on dashboard, not filtered routes) */}
          {!filterOverride && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {STATUS_TABS.map((tab) => (
                <button key={tab} onClick={() => setFilter(tab)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                    filter === tab
                      ? "bg-orange-500 text-white shadow"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-orange-300"
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Orders list */}
          {loading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState message="No orders found" />
          ) : (
            <div className="space-y-3">
              {filtered.map((order) => (
                <OrderCard key={order._id} order={order} onClick={() => onSelectOrder(order._id)} />
              ))}
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="text-xs mt-0.5 opacity-80">{label}</p>
    </div>
  );
}

function OrderCard({ order, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-md hover:border-orange-200 transition group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 font-mono tracking-tight">{order.orderNumber}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(order.status)}`}>{order.status}</span>
          </div>
          <p className="font-semibold text-gray-900 text-sm truncate">{order.shippingAddress?.name}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {order.shippingAddress?.road}, {order.shippingAddress?.city}</p>
          <p className="text-xs text-gray-400 mt-0.5">📞 {order.shippingAddress?.phone}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-900 text-sm">₹{order.total?.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">{order.items?.length} item{order.items?.length !== 1 ? "s" : ""}</p>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition mt-2 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-gray-50 text-xs text-gray-400">
        Ordered {formatDate(order.createdAt)}
      </div>
    </button>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="text-gray-500 font-medium">{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PICKUP SECTION
// ─────────────────────────────────────────────────────────────────────────────
function PickupSection({ orderId, token, onConfirmed }) {
  const [proofFile, setProofFile]   = useState(null);
  const [preview, setPreview]       = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [sizeInfo, setSizeInfo]     = useState(null);
  const [compressing, setCompressing] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setSizeInfo(null);
    setCompressing(true);
    setError("");
    try {
      const compressed = await compressImage(file);
      setProofFile(compressed);
      setSizeInfo({
        original:   (file.size / 1024).toFixed(0),
        compressed: (compressed.size / 1024).toFixed(0),
        saving:     Math.round((1 - compressed.size / file.size) * 100),
      });
    } catch {
      setProofFile(file);
      setError("Compression failed, original image will be used.");
    } finally {
      setCompressing(false);
    }
  };

  const handleConfirm = async () => {
    if (!proofFile) { setError("Please take a pickup photo first."); return; }
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("pickupProof", proofFile);
      const data = await apiFetch(`/driver/my-orders/${orderId}/pickup`, { method: "PATCH", body: fd }, token);
      onConfirmed(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section title="Confirm Pickup">
      <p className="text-sm text-gray-600 mb-3">
        Take a photo of the package at the pickup location before you leave.
      </p>
      <label className="block cursor-pointer mb-4">
        <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Pickup proof" className="w-full max-h-48 object-cover rounded-xl bg-gray-100" />
            <div className="absolute inset-0 bg-black/10 rounded-xl flex items-end justify-center pb-2">
              <span className="text-white text-xs bg-black/50 rounded-full px-3 py-1">Tap to change</span>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center hover:bg-purple-50 transition">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-purple-600">Take Pickup Photo</p>
            <p className="text-xs text-gray-400 mt-0.5">Photo of package at pickup point</p>
          </div>
        )}
      </label>

      {compressing && (
        <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2 mb-3">
          <Spinner size="h-3.5 w-3.5" /> Compressing image…
        </div>
      )}
      {sizeInfo && !compressing && (
        <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">
          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-700">
            Compressed: <span className="font-semibold">{sizeInfo.original} KB → {sizeInfo.compressed} KB</span>
            <span className="ml-1 text-green-500">({sizeInfo.saving}% smaller)</span>
          </span>
        </div>
      )}
      {error && <p className="text-red-600 text-xs mb-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button onClick={handleConfirm} disabled={submitting || !proofFile || compressing}
        className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm">
        {submitting ? <Spinner size="h-5 w-5" /> : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {submitting ? "Confirming pickup…" : "Confirm Pickup"}
      </button>
      {!proofFile && !compressing && (
        <p className="text-center text-xs text-gray-400 mt-2">Take a photo to enable this button</p>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS STEPPER
// ─────────────────────────────────────────────────────────────────────────────
function StatusStepper({ orderId, currentStatus, token, onUpdated }) {
  const STAGES = ["Picked Up", "In Transit", "On The Way", "Delivered"];
  const currentIdx = STAGES.indexOf(currentStatus);
  const nextStatus = STAGES[currentIdx + 1];

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [proofFile, setProofFile]   = useState(null);
  const [preview, setPreview]       = useState(null);
  const [sizeInfo, setSizeInfo]     = useState(null);
  const [compressing, setCompressing] = useState(false);

  const stageColors = {
    "Picked Up":  "bg-purple-500",
    "In Transit": "bg-cyan-500",
    "On The Way": "bg-orange-500",
    "Delivered":  "bg-green-500",
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setSizeInfo(null);
    setCompressing(true);
    setError("");
    try {
      const compressed = await compressImage(file);
      setProofFile(compressed);
      setSizeInfo({
        original:   (file.size / 1024).toFixed(0),
        compressed: (compressed.size / 1024).toFixed(0),
        saving:     Math.round((1 - compressed.size / file.size) * 100),
      });
    } catch {
      setProofFile(file);
      setError("Compression failed, original image will be used.");
    } finally {
      setCompressing(false);
    }
  };

  const handleAdvance = async () => {
    if (!nextStatus) return;
    if (nextStatus === "Delivered") {
      if (!proofFile) { setError("Please upload a delivery proof photo first."); return; }
      setSubmitting(true);
      setError("");
      try {
        const fd = new FormData();
        fd.append("proofImage", proofFile);
        const data = await apiFetch(`/driver/my-orders/${orderId}/deliver`, { method: "PATCH", body: fd }, token);
        onUpdated(data.order);
      } catch (err) {
        setError(err.message);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const data = await apiFetch(
        `/driver/my-orders/${orderId}/status`,
        { method: "PATCH", body: JSON.stringify({ status: nextStatus }) },
        token
      );
      onUpdated(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section title="Delivery Progress">
      {/* Stepper */}
      <div className="flex items-start gap-1 mb-5">
        {STAGES.map((stage, i) => (
          <div key={stage} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all ${
                i <= currentIdx ? stageColors[stage] : "bg-gray-200"
              }`}>
                {i < currentIdx ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : <span>{i + 1}</span>}
              </div>
              <p className={`text-center leading-tight mt-1 ${i <= currentIdx ? "text-gray-800 font-medium" : "text-gray-400"}`}
                style={{ fontSize: "10px" }}>
                {stage}
              </p>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 mb-5 transition-all ${i < currentIdx ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Delivery proof */}
      {nextStatus === "Delivered" && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">Take a delivery proof photo before marking as delivered.</p>
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Delivery proof" className="w-full max-h-48 object-cover rounded-xl bg-gray-100" />
                <div className="absolute inset-0 bg-black/10 rounded-xl flex items-end justify-center pb-2">
                  <span className="text-white text-xs bg-black/50 rounded-full px-3 py-1">Tap to change</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-green-300 rounded-xl p-5 text-center hover:bg-green-50 transition">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-600">Take Delivery Photo</p>
                <p className="text-xs text-gray-400 mt-0.5">Required for proof of delivery</p>
              </div>
            )}
          </label>
          {compressing && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2 mt-3">
              <Spinner size="h-3.5 w-3.5" /> Compressing image…
            </div>
          )}
          {sizeInfo && !compressing && (
            <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-3">
              <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700">
                Compressed: <span className="font-semibold">{sizeInfo.original} KB → {sizeInfo.compressed} KB</span>
                <span className="ml-1 text-green-500">({sizeInfo.saving}% smaller)</span>
              </span>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-600 text-xs mb-3 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {nextStatus && (
        <button onClick={handleAdvance}
          disabled={submitting || compressing || (nextStatus === "Delivered" && !proofFile)}
          className={`w-full text-white font-semibold py-3.5 rounded-2xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${
            nextStatus === "Delivered" ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"
          }`}>
          {submitting ? <Spinner size="h-5 w-5" /> : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {submitting ? "Updating…" : `Mark as ${nextStatus}`}
        </button>
      )}
      {nextStatus === "Delivered" && !proofFile && (
        <p className="text-center text-xs text-gray-400 mt-2">Upload proof photo to enable this button</p>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3: Order Detail
// ─────────────────────────────────────────────────────────────────────────────
function OrderDetail({ orderId, onBack }) {
  const { token } = useAuth();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/driver/my-orders/${orderId}`, {}, token);
      setOrder(data.order);
    } catch (err) {
      setToast({ msg: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Order not found.</p>
          <button onClick={onBack} className="mt-4 text-orange-500 text-sm underline">Go back</button>
        </div>
      </div>
    );
  }

  const showPickup  = ["Processing", "Shipped"].includes(order.status);
  const showStepper = ["Picked Up", "In Transit", "On The Way"].includes(order.status);

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <Topbar
        title={order.orderNumber}
        subtitle={order.status}
        showBack
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className={`text-sm px-4 py-1.5 rounded-full font-semibold ${statusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          {/* Customer */}
          <Section title="Customer">
            <InfoRow icon="👤" label="Name"  value={order.shippingAddress?.name} />
            <InfoRow icon="📞" label="Phone" value={order.shippingAddress?.phone} />
            {order.shippingAddress?.altPhone && (
              <InfoRow icon="📱" label="Alt Phone" value={order.shippingAddress.altPhone} />
            )}
            {order.user?.email && (
              <InfoRow icon="✉️" label="Email" value={order.user.email} />
            )}
          </Section>

          {/* Address */}
          <Section title="Delivery Address">
            <div className="text-sm text-gray-700 leading-relaxed">
              {order.shippingAddress?.house}, {order.shippingAddress?.road}
              {order.shippingAddress?.landmark && `, Near ${order.shippingAddress.landmark}`}
              <br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
            </div>
            <a href={`https://maps.google.com/?q=${encodeURIComponent(
                `${order.shippingAddress?.road}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.pincode}`
              )}`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-orange-500 font-medium hover:text-orange-600 transition">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Google Maps
            </a>
          </Section>

          {/* Items */}
          <Section title={`Order Items (${order.items?.length})`}>
            <div className="space-y-3">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 flex-shrink-0">₹{item.total?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Payment */}
          <Section title="Payment">
            <div className="space-y-1.5">
              <PricingRow label="Subtotal" value={order.subtotal} />
              {order.discount > 0 && <PricingRow label="Discount" value={-order.discount} isDiscount />}
              {order.shippingCharge > 0 && <PricingRow label="Shipping" value={order.shippingCharge} />}
              {order.tax > 0 && <PricingRow label="Tax" value={order.tax} />}
              <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-gray-900 text-sm">Total</span>
                <span className="font-bold text-gray-900">₹{order.total?.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">Payment:</span>
              <span className="text-xs font-medium text-gray-700">{order.paymentMethod}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                order.paymentStatus === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>{order.paymentStatus}</span>
            </div>
          </Section>

          {/* Timeline */}
          <Section title="Timeline">
            <InfoRow icon="📅" label="Ordered at"  value={formatDate(order.createdAt)} />
            {order.pickedUpAt  && <InfoRow icon="📦" label="Picked up at"  value={formatDate(order.pickedUpAt)} />}
            {order.deliveredAt && <InfoRow icon="✅" label="Delivered at" value={formatDate(order.deliveredAt)} />}
            {order.cancelledAt && <InfoRow icon="❌" label="Cancelled at" value={formatDate(order.cancelledAt)} />}
          </Section>

          {/* Status History */}
          {order.statusHistory?.length > 0 && (
            <Section title="Status History">
              <div className="space-y-2">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${stageColorDot(h.status)}`} />
                    <div className="flex-1 flex justify-between items-center min-w-0 gap-2">
                      <span className="text-sm text-gray-700 font-medium truncate">{h.status}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(h.changedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Proof photos */}
          {order.pickupProof && (
            <Section title="Pickup Proof">
              <img src={order.pickupProof} alt="Pickup proof" className="w-full max-h-64 object-contain rounded-xl bg-gray-100" />
              <p className="text-xs text-gray-400 mt-2 text-center">Photo captured at pickup — {formatDate(order.pickedUpAt)}</p>
            </Section>
          )}
          {order.deliveryProof && (
            <Section title="Delivery Proof">
              <img src={order.deliveryProof} alt="Delivery proof" className="w-full max-h-64 object-contain rounded-xl bg-gray-100" />
              <p className="text-xs text-gray-400 mt-2 text-center">Photo captured at delivery</p>
            </Section>
          )}

          {/* Actions */}
          {showPickup && (
            <PickupSection orderId={orderId} token={token}
              onConfirmed={(updated) => {
                setOrder(updated);
                setToast({ msg: "Pickup confirmed! ✓", type: "success" });
              }}
            />
          )}
          {showStepper && (
            <StatusStepper orderId={orderId} currentStatus={order.status} token={token}
              onUpdated={(updated) => {
                setOrder(updated);
                setToast({ msg: `Status updated to ${updated.status} ✓`, type: "success" });
              }}
            />
          )}

          {/* Delivered notice */}
          {order.status === "Delivered" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700">Delivered successfully</p>
                <p className="text-xs text-green-600">{formatDate(order.deliveredAt)}</p>
              </div>
            </div>
          )}

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

// ─── Reusable primitives ─────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 py-1">
      <span className="text-sm mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-400">{label}</span>
        <p className="text-sm text-gray-800 font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

function PricingRow({ label, value, isDiscount }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={isDiscount ? "text-green-600 font-medium" : "text-gray-700"}>
        {isDiscount ? `−₹${Math.abs(value).toLocaleString()}` : `₹${value?.toLocaleString()}`}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP SHELL with sidebar layout
// ─────────────────────────────────────────────────────────────────────────────
const TOKEN_KEY  = "driver_token";
const DRIVER_KEY = "driver_info";

function AuthenticatedApp() {
  const { token } = useAuth();

  // page: "dashboard" | "active" | "delivered" | "cancelled" | { page: "order", id }
  const [page, setPage]         = useState("dashboard");
  const [orders, setOrders]     = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [sidebarOpen, setSidebarOpen]     = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const data = await apiFetch("/driver/my-orders", {}, token);
      setOrders(data.orders || []);
    } catch {
      // silently fail
    } finally {
      setLoadingOrders(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const isOrderPage = typeof page === "object" && page.page === "order";
  const currentNav  = isOrderPage ? "dashboard" : page;

  return (
    <SidebarCtx.Provider value={{ sidebarOpen, setSidebarOpen }}>
      {/* Full-height flex row */}
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <Sidebar
          currentPage={currentNav}
          onNavigate={(id) => setPage(id)}
          orders={orders}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {isOrderPage ? (
            <OrderDetail
              orderId={page.id}
              onBack={() => setPage("dashboard")}
            />
          ) : (
            <Dashboard
              allOrders={orders}
              loading={loadingOrders}
              filterOverride={page !== "dashboard" ? page : null}
              onSelectOrder={(id) => setPage({ page: "order", id })}
            />
          )}
        </div>
      </div>
    </SidebarCtx.Provider>
  );
}

export default function DeliveryAgentApp() {
  const [token, setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [driver, setDriver] = useState(() => {
    try { return JSON.parse(localStorage.getItem(DRIVER_KEY)); }
    catch { return null; }
  });

  const login = (tok, driverInfo) => {
    localStorage.setItem(TOKEN_KEY, tok);
    localStorage.setItem(DRIVER_KEY, JSON.stringify(driverInfo));
    setToken(tok);
    setDriver(driverInfo);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(DRIVER_KEY);
    setToken(null);
    setDriver(null);
  };

  return (
    <AuthCtx.Provider value={{ token, driver, login, logout }}>
      {!token || !driver ? <LoginPage /> : <AuthenticatedApp />}
    </AuthCtx.Provider>
  );
}