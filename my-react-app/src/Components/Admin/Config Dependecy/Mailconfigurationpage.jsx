import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("adminToken") || "";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-5 right-5 z-50 px-5 py-3 rounded shadow-lg text-white text-sm font-medium transition-all duration-300 ${
        toast.type === "success" ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {toast.message}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition";

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MailConfigurationPage() {
  // Send Test Mail state
  const [testOpen, setTestOpen] = useState(true);
  const [testForm, setTestForm] = useState({ to: "", message: "" });
  const [testLoading, setTestLoading] = useState(false);

  // Mail Config state
  const [config, setConfig] = useState({
    mailMailer: "",
    mailHost: "",
    mailPort: "",
    mailUserName: "",
    mailPassword: "",
    mailEncryption: "",
    mailFromAddress: "",
  });
  const [fetching, setFetching] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Load existing config on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/mail/get`, { headers: authHeaders() });
        const json = await res.json();
        if (json.success && json.data) {
          setConfig({
            mailMailer:      json.data.mailMailer      ?? "",
            mailHost:        json.data.mailHost        ?? "",
            mailPort:        json.data.mailPort        ?? "",
            mailUserName:    json.data.mailUserName    ?? "",
            mailPassword:    json.data.mailPassword    ?? "",
            mailEncryption:  json.data.mailEncryption  ?? "",
            mailFromAddress: json.data.mailFromAddress ?? "",
          });
        }
      } catch {
        showToast("error", "Failed to load mail configuration.");
      } finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  // Save config
  const handleSave = async () => {
    if (!config.mailFromAddress) {
      showToast("error", "Mail From Address is required.");
      return;
    }
    setSaveLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mail/save`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Mail configuration saved successfully!");
      } else {
        showToast("error", json.error || "Failed to save configuration.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Send test mail
  const handleSendTest = async () => {
    if (!testForm.to) {
      showToast("error", "Recipient email is required.");
      return;
    }
    setTestLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mail/test`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ to: testForm.to, message: testForm.message }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message || "Test mail sent!");
        setTestForm({ to: "", message: "" });
      } else {
        showToast("error", json.message || json.error || "Failed to send test mail.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toast toast={toast} />

      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Send Test Mail Panel ───────────────────────────────────────────── */}
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
          {/* Accordion header */}
          <button
            onClick={() => setTestOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">Send Test Mail</span>
            {testOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {testOpen && (
            <div className="px-5 py-5 space-y-4">
              <Field label="To / Recipient Email">
                <input
                  type="email"
                  className={inputCls}
                  placeholder="Recipient's Email"
                  value={testForm.to}
                  onChange={(e) => setTestForm((p) => ({ ...p, to: e.target.value }))}
                />
              </Field>

              <Field label="Message">
                <textarea
                  rows={3}
                  className={`${inputCls} resize-y`}
                  placeholder="Message to be sent"
                  value={testForm.message}
                  onChange={(e) =>
                    setTestForm((p) => ({ ...p, message: e.target.value }))
                  }
                />
              </Field>

              <div className="flex justify-end">
                <button
                  onClick={handleSendTest}
                  disabled={testLoading}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded transition-colors flex items-center gap-2"
                >
                  {testLoading ? (
                    <>
                      <Spinner /> Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Mail Configuration Panel ───────────────────────────────────────── */}
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm px-6 py-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Mail Configuration</h2>

          {fetching ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-7 h-7 text-green-500" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Row 1: Mailer + Host */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Mail Mailer">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="smtp"
                    value={config.mailMailer}
                    onChange={(e) =>
                      setConfig((p) => ({ ...p, mailMailer: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Mail Host">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="mailpit"
                    value={config.mailHost}
                    onChange={(e) =>
                      setConfig((p) => ({ ...p, mailHost: e.target.value }))
                    }
                  />
                </Field>
              </div>

              {/* Row 2: Port + Username */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Mail Port">
                  <input
                    type="number"
                    className={inputCls}
                    placeholder="1025"
                    value={config.mailPort}
                    onChange={(e) =>
                      setConfig((p) => ({ ...p, mailPort: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Mail User Name">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="ex: example@gmail.com"
                    value={config.mailUserName}
                    onChange={(e) =>
                      setConfig((p) => ({ ...p, mailUserName: e.target.value }))
                    }
                  />
                </Field>
              </div>

              {/* Row 3: Password + Encryption */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Mail Password">
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="Your app password"
                    value={config.mailPassword}
                    onChange={(e) =>
                      setConfig((p) => ({ ...p, mailPassword: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Mail Encryption">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="tls or ssl"
                    value={config.mailEncryption}
                    onChange={(e) =>
                      setConfig((p) => ({ ...p, mailEncryption: e.target.value }))
                    }
                  />
                </Field>
              </div>

              {/* Row 4: From Address (half-width) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Mail From Address" required>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="from email address"
                    value={config.mailFromAddress}
                    onChange={(e) =>
                      setConfig((p) => ({ ...p, mailFromAddress: e.target.value }))
                    }
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="mt-7">
            <button
              onClick={handleSave}
              disabled={saveLoading || fetching}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded transition-colors flex items-center gap-2"
            >
              {saveLoading ? (
                <>
                  <Spinner /> Saving...
                </>
              ) : (
                "Save And Update"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline spinner ────────────────────────────────────────────────────────────
function Spinner({ className = "w-4 h-4 text-white" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}