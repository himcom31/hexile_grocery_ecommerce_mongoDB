import { useState, useEffect, useCallback } from "react";

// ── Config ─────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api/sms-settings";
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

// ── Provider definitions ───────────────────────────────────────────────────────
const PROVIDERS = [
  {
    name: "Twilio",
    logo: (
      <div className="flex items-center gap-2 mb-4">
        {/* Twilio logo mark */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="15" fill="#F22F46" />
          <circle cx="10.5" cy="10.5" r="3" fill="white" />
          <circle cx="21.5" cy="10.5" r="3" fill="white" />
          <circle cx="10.5" cy="21.5" r="3" fill="white" />
          <circle cx="21.5" cy="21.5" r="3" fill="white" />
        </svg>
        <span style={{ fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 700, fontSize: 26, color: "#F22F46", letterSpacing: -0.5 }}>
          twilio
        </span>
      </div>
    ),
    fields: [
      { key: "twilioSid",   placeholder: "Twilio SID" },
      { key: "twilioToken", placeholder: "Twilio Token" },
      { key: "twilioFrom",  placeholder: "Twilio From" },
    ],
  },
  {
    name: "Nexmo",
    logo: (
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 700, fontSize: 26, color: "#00A4E0", letterSpacing: -0.5 }}>
          nexmo
        </span>
        {/* Nexmo swirl icon approximate */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 2a9 9 0 100 18A9 9 0 0011 2zm0 3a6 6 0 110 12A6 6 0 0111 5zm0 3a3 3 0 100 6 3 3 0 000-6z" fill="#00A4E0" />
        </svg>
      </div>
    ),
    fields: [
      { key: "nexmoKey",    placeholder: "Nexmo Key" },
      { key: "nexmoSecret", placeholder: "Nexmo Secret" },
      { key: "nexmoFrom",   placeholder: "Nexmo From" },
    ],
  },
  {
    name: "Telesign",
    logo: (
      <div className="flex items-center gap-2 mb-4">
        {/* Telesign spiral icon */}
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M13 2C7 2 2 7 2 13s5 11 11 11 11-5 11-11S19 2 13 2zm0 3c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8zm0 3c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" fill="#1E3A8A" />
        </svg>
        <span style={{ fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 700, fontSize: 24, color: "#1E3A8A" }}>
          telesign
        </span>
      </div>
    ),
    fields: [
      { key: "telesignCustomerId", placeholder: "Customer ID" },
      { key: "telesignApiKey",     placeholder: "API KEY" },
    ],
  },
  {
    name: "MessageBird",
    logo: (
      <div className="flex items-center gap-2 mb-4">
        {/* MessageBird bird icon */}
        <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
          <path d="M2 18L8 10l4 4 5-8 7 12H2z" fill="#2481D7" />
          <circle cx="20" cy="4" r="3" fill="#2481D7" />
        </svg>
        <span style={{ fontFamily: "'Helvetica Neue', sans-serif", fontWeight: 700, fontSize: 22, color: "#2481D7" }}>
          MessageBird
        </span>
      </div>
    ),
    fields: [
      { key: "messageBirdApiKey", placeholder: "API Key" },
      { key: "messageBirdFrom",   placeholder: "From" },
    ],
  },
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
            : "bg-green-50 border border-green-200 text-green-700"
          }`}
        style={{ minWidth: 240, animation: "slideIn .25s ease" }}
      >
        {t.msg}
      </div>
    ))}
  </div>
);

// ── Provider Card ──────────────────────────────────────────────────────────────
const ProviderCard = ({ provider, initial, activeProvider, onActivate, onSaved, activating }) => {
  const { name, logo, fields } = provider;

  const emptyForm = () =>
    Object.fromEntries(fields.map((f) => [f.key, initial?.[f.key] || ""]));

  const [form, setForm]       = useState(emptyForm);
  const [saving, setSaving]   = useState(false);

  // Sync when parent refreshes
  useEffect(() => {
    setForm(Object.fromEntries(fields.map((f) => [f.key, initial?.[f.key] || ""])));
  }, [initial]); // eslint-disable-line

  const isActive   = activeProvider === name;
  const isInactive = !isActive;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { providerName: name, ...form };
      const data = await apiFetch("/save", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onSaved(`${name} settings saved successfully!`);
    } catch (err) {
      onSaved(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRadio = async (makeActive) => {
    if (makeActive) {
      await onActivate(name);
    } else {
      // Clicking "Inactive" on the currently active provider → deactivate all
      if (isActive) {
        try {
          await apiFetch("/deactivate-all", { method: "PUT" });
          onSaved(`${name} deactivated.`);
        } catch (err) {
          onSaved(err.message, "error");
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Logo */}
      {logo}

      {/* Active / Inactive radios */}
      <div className="flex items-center gap-5 mb-4">
        <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600">
          <input
            type="radio"
            name={`status-${name}`}
            checked={isActive}
            onChange={() => handleRadio(true)}
            disabled={activating}
            className="accent-blue-600"
          />
          Active
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm text-slate-600">
          <input
            type="radio"
            name={`status-${name}`}
            checked={isInactive}
            onChange={() => handleRadio(false)}
            disabled={activating}
            className="accent-blue-600"
          />
          Inactive
        </label>
      </div>

      {/* Fields */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {fields.map((f) => (
          <input
            key={f.key}
            value={form[f.key]}
            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        ))}

        <button
          type="submit"
          disabled={saving}
          className="mt-1 px-5 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
        >
          {saving ? "Saving…" : "Update"}
        </button>
      </form>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SmsConfigPage() {
  const [settingsMap, setSettingsMap] = useState({}); // { Twilio: {...}, Nexmo: {...}, ... }
  const [activeProvider, setActiveProvider] = useState(null); // name string | null
  const [fetching, setFetching]   = useState(true);
  const [activating, setActivating] = useState(false);
  const [toasts, setToasts]       = useState([]);

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  // Build settingsMap & find active provider from API data
  const applySettings = (settings) => {
    const map = {};
    let active = null;
    settings.forEach((s) => {
      map[s.providerName] = s;
      if (s.status) active = s.providerName;
    });
    setSettingsMap(map);
    setActiveProvider(active);
  };

  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const data = await apiFetch("/all");
      applySettings(data.settings || []);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setFetching(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleActivate = async (providerName) => {
    setActivating(true);
    try {
      await apiFetch(`/activate/${providerName}`, { method: "PUT" });
      setActiveProvider(providerName);
      addToast(`${providerName} is now the active SMS provider.`);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />

      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800">SMS Configuration</h1>
        <span className="inline-block mt-1 px-3 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded">
          You can active only one provider at a time
        </span>
      </div>

      {fetching ? (
        <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
          Loading SMS settings…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PROVIDERS.map((p) => (
            <ProviderCard
              key={p.name}
              provider={p}
              initial={settingsMap[p.name] || null}
              activeProvider={activeProvider}
              onActivate={handleActivate}
              onSaved={(msg, type) => { addToast(msg, type); fetchAll(); }}
              activating={activating}
            />
          ))}
        </div>
      )}
    </div>
  );
}