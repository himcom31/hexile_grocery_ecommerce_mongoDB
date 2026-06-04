import { useState, useEffect, useCallback } from "react";

// ── Config ─────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api/google";
const getToken = () => localStorage.getItem("adminToken") || "";

const apiFetch = async (path, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

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
            : "bg-green-50 border border-green-200 text-green-700"
          }`}
        style={{ minWidth: 240, animation: "slideIn .25s ease" }}
      >
        {t.msg}
      </div>
    ))}
  </div>
);

// ── Toggle Switch ──────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm text-slate-500">{checked ? "On" : "Off"}</span>
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

// ── Google Logo ────────────────────────────────────────────────────────────────
const GoogleLogo = () => (
  <div className="flex items-center gap-2">
    {/* Google "G" multi-colour icon */}
    <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.7C34.3 33.1 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6.1-6.1C34.6 5.9 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-7.9 19.7-20 0-1.3-.1-2.7-.2-4z" fill="#FFC107"/>
      <path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3 0 5.7 1.1 7.8 2.9l6.1-6.1C34.6 5.9 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" fill="#FF3D00"/>
      <path d="M24 44c5.5 0 10.5-1.9 14.3-5l-6.6-5.6C29.7 35.1 27 36 24 36c-5.7 0-10.3-2.9-11.7-7.5l-7 5.4C8.3 40 15.6 44 24 44z" fill="#4CAF50"/>
      <path d="M44.5 20H24v8.5h11.7c-.7 2.1-2 3.9-3.7 5.1l6.6 5.6C42.3 36 44.5 30.5 44.5 24c0-1.3-.1-2.7-.2-4z" fill="#1976D2"/>
    </svg>
    <span className="text-xl font-extrabold tracking-widest text-slate-800 uppercase">Google</span>
  </div>
);

// ── Google Card ────────────────────────────────────────────────────────────────
const GoogleCard = ({ initial, onSaved }) => {
  const [clientId,     setClientId]     = useState(initial?.clientId     || "");
  const [clientSecret, setClientSecret] = useState(initial?.clientSecret || "");
  const [redirectUrl,  setRedirectUrl]  = useState(initial?.redirectUrl  || "postmessage");
  const [status,       setStatus]       = useState(initial?.status       ?? false);
  const [saving,       setSaving]       = useState(false);
  const [toggling,     setToggling]     = useState(false);

  // Sync if parent re-fetches
  useEffect(() => {
    if (initial) {
      setClientId(initial.clientId     || "");
      setClientSecret(initial.clientSecret || "");
      setRedirectUrl(initial.redirectUrl  || "postmessage");
      setStatus(initial.status         ?? false);
    }
  }, [initial]);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const data = await apiFetch("/toggle/Google", { method: "PATCH" });
      setStatus(data.status);
      onSaved(data.message);
    } catch (err) {
      onSaved(err.message, "error");
    } finally {
      setToggling(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/save", {
        method: "POST",
        body: JSON.stringify({
          provider: "Google",
          clientId,
          clientSecret,
          redirectUrl,
        }),
      });
      onSaved("Google settings saved successfully!");
    } catch (err) {
      onSaved(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <GoogleLogo />
        <Toggle checked={status} onChange={handleToggle} disabled={toggling} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client ID */}
        <div>
          <label className="block text-sm text-slate-600 mb-1.5">
            Client ID <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Enter GOOGLE Client ID"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
        </div>

        {/* Client Secret */}
        <div>
          <label className="block text-sm text-slate-600 mb-1.5">
            Client Secret <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="Enter GOOGLE Client Secret"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
        </div>

        {/* Redirect URL */}
        <div>
          <label className="block text-sm text-slate-600 mb-1.5">
            Redirect URL / Return URL
          </label>
          <input
            value={redirectUrl}
            onChange={(e) => setRedirectUrl(e.target.value)}
            placeholder="postmessage"
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 transition"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-1">
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
export default function SocialAuthPage() {
  const [googleSettings, setGoogleSettings] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [toasts,   setToasts]   = useState([]);

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  const fetchSettings = useCallback(async () => {
    setFetching(true);
    try {
      const data = await apiFetch("/all");
      const google = (data.settings || []).find((s) => s.provider === "Google") || null;
      setGoogleSettings(google);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setFetching(false);
    }
  }, [addToast]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaved = (msg, type = "success") => {
    addToast(msg, type);
    fetchSettings(); // re-sync from DB
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />

      <h1 className="text-2xl font-bold text-slate-800 mb-6">Social Authentication</h1>

      {fetching ? (
        <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
          Loading settings…
        </div>
      ) : (
        <GoogleCard initial={googleSettings} onSaved={handleSaved} />
      )}
    </div>
  );
}