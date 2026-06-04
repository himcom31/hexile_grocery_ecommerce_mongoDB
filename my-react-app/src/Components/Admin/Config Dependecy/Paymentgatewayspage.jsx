import { useState, useEffect, useCallback } from "react";

// ── Config ─────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api/payment";
const getToken = () => localStorage.getItem("adminToken") || "";

const apiFetch = async (path, options = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = {
    Authorization: `Bearer ${getToken()}`,
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ── Gateway meta (logos rendered as styled text / SVG like the screenshot) ────
const GATEWAYS = [
  { name: "Stripe",   color: "#635BFF", labelColor: "#635BFF" },
  { name: "Razorpay", color: "#2D81F7", labelColor: "#072654" },
];

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ toasts, remove }) => (
  <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        onClick={() => remove(t.id)}
        className={`pointer-events-auto cursor-pointer px-4 py-3 rounded-lg text-sm font-medium shadow-lg
          ${t.type === "error"
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-green-50 border border-green-200 text-green-700"}`}
        style={{ minWidth: 240, animation: "slideIn .25s ease" }}
      >
        {t.msg}
      </div>
    ))}
  </div>
);

// ── Toggle Switch ──────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled, label }) => (
  <div className="flex items-center gap-2">
    <span className={`text-sm font-semibold ${checked ? "text-green-600" : "text-slate-400"}`}>
      {checked ? "On" : "Off"}
    </span>
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none
        ${checked ? "bg-green-500" : "bg-slate-300"}
        ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200
          ${checked ? "left-[26px]" : "left-0.5"}`}
      />
    </button>
  </div>
);

// ── Gateway Logo (styled like the screenshot) ─────────────────────────────────
const GatewayLogo = ({ name, logoUrl }) => {
  if (logoUrl) {
    return (
      <div className="flex items-center justify-center h-20 py-4">
        <img src={logoUrl} alt={name} className="max-h-16 object-contain" />
      </div>
    );
  }

  if (name === "Stripe") {
    return (
      <div className="flex items-center justify-center h-20">
        <span style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: 42, fontWeight: 700, color: "#635BFF", letterSpacing: -1 }}>
          stripe
        </span>
      </div>
    );
  }

  if (name === "Razorpay") {
    return (
      <div className="flex items-center justify-center h-20 gap-2">
        {/* Simple Razorpay-style triangle logo */}
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <polygon points="18,2 34,32 2,32" fill="#2D81F7" />
          <polygon points="18,10 28,32 8,32" fill="#072654" opacity="0.5" />
        </svg>
        <span style={{ fontFamily: "'Helvetica Neue', sans-serif", fontSize: 28, fontWeight: 700, color: "#072654" }}>
          Razorpay
        </span>
      </div>
    );
  }

  return null;
};

// ── Field definitions per gateway ─────────────────────────────────────────────
const getFields = (name) =>
  name === "Stripe"
    ? [
        { key: "secretKey",    label: "Secret Key",            placeholder: "sk_test_..." },
        { key: "publishedKey", label: "Published Key",         placeholder: "pk_test_..." },
        { key: "title",        label: "Payment Gateway Title", placeholder: "Stripe" },
      ]
    : [
        { key: "publishedKey", label: "Key",                   placeholder: "rzp_test_..." },
        { key: "secretKey",    label: "Secret",                placeholder: "Your Razorpay secret" },
        { key: "title",        label: "Payment Gateway Title", placeholder: "Razorpay" },
      ];

// ── Single Gateway Card ────────────────────────────────────────────────────────
const GatewayCard = ({ gatewayMeta, initial, onSave, togglingName }) => {
  const { name } = gatewayMeta;
  const fields = getFields(name);

  const [form, setForm] = useState({
    mode:         initial?.mode         || "Test",
    secretKey:    initial?.secretKey    || "",
    publishedKey: initial?.publishedKey || "",
    title:        initial?.title        || name,
    status:       initial?.status       ?? false,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(initial?.logo || null);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Keep form in sync when parent re-fetches
  useEffect(() => {
    if (initial) {
      setForm({
        mode:         initial.mode         || "Test",
        secretKey:    initial.secretKey    || "",
        publishedKey: initial.publishedKey || "",
        title:        initial.title        || name,
        status:       initial.status       ?? false,
      });
      setLogoPreview(initial.logo || null);
    }
  }, [initial, name]);

  const handleChange = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const data = await apiFetch(`/toggle/${name}`, { method: "PATCH" });
      setForm((p) => ({ ...p, status: data.status }));
      onSave(name, { ...initial, status: data.status }, data.message);
    } catch (err) {
      onSave(name, null, err.message, "error");
    } finally {
      setToggling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("gatewayName", name);
      fd.append("status",       form.status);
      fd.append("mode",         form.mode);
      fd.append("secretKey",    form.secretKey);
      fd.append("publishedKey", form.publishedKey);
      fd.append("title",        form.title);
      if (logoFile) fd.append("logo", logoFile);

      // Try update first; if 404 / not-found, add
      let data;
      try {
        data = await apiFetch("/update", { method: "POST", body: fd });
      } catch (err) {
        if (err.message.toLowerCase().includes("not found") || err.message.toLowerCase().includes("exist")) {
          data = await apiFetch("/add", { method: "POST", body: fd });
        } else {
          throw err;
        }
      }

      onSave(name, data.settings || data.data, `${name} saved successfully!`);
    } catch (err) {
      onSave(name, null, err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-extrabold tracking-widest text-slate-800 uppercase">
          {name}
        </h2>
        <Toggle
          checked={form.status}
          onChange={handleToggle}
          disabled={toggling}
        />
      </div>

      {/* Logo area */}
      <div className="px-6 pt-5 pb-2 border-b border-gray-50">
        <GatewayLogo name={name} logoUrl={logoPreview} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {/* Mode */}
        <div>
          <label className="block text-sm text-slate-600 mb-1.5">Mode</label>
          <input
            value={form.mode}
            onChange={(e) => handleChange("mode", e.target.value)}
            placeholder="Test"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
        </div>

        {/* Dynamic fields */}
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm text-slate-600 mb-1.5">
              {f.label} <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-green-400 transition"
            />
          </div>
        ))}

        {/* Choose Logo */}
        <div>
          <label className="block text-sm text-slate-600 mb-1.5">Choose Logo</label>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden text-sm">
            <label className="px-4 py-2.5 bg-gray-50 text-slate-600 cursor-pointer hover:bg-gray-100 transition border-r border-slate-200 whitespace-nowrap">
              Choose File
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
            <span className="px-4 py-2.5 text-slate-400 truncate">
              {logoFile ? logoFile.name : "No file chosen"}
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            {saving ? "Saving…" : "Save And Update"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PaymentGatewaysPage() {
  const [settings, setSettings]   = useState({});   // { Stripe: {...}, Razorpay: {...} }
  const [fetching, setFetching]   = useState(true);
  const [toasts,   setToasts]     = useState([]);

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  // Fetch all gateway settings
  const fetchSettings = useCallback(async () => {
    setFetching(true);
    try {
      const data = await apiFetch("/all");
      const map = {};
      (data.settings || []).forEach((s) => { map[s.gatewayName] = s; });
      setSettings(map);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setFetching(false);
    }
  }, [addToast]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = (name, updated, msg, type = "success") => {
    if (updated) setSettings((p) => ({ ...p, [name]: updated }));
    addToast(msg, type);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />

      <h1 className="text-2xl font-bold text-slate-800 mb-6">Payment Gateways</h1>

      {fetching ? (
        <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
          Loading gateway settings…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {GATEWAYS.map((gw) => (
            <GatewayCard
              key={gw.name}
              gatewayMeta={gw}
              initial={settings[gw.name] || null}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}