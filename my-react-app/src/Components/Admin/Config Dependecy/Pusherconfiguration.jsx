import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Helper to get auth token from wherever your app stores it
const getToken = () => localStorage.getItem("adminToken") || "";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export default function PusherConfiguration() {
  const [formData, setFormData] = useState({
    appId: "",
    key: "",
    secret: "",
    cluster: "",
  });

  const [loading, setLoading] = useState(false);   // save button loading
  const [fetching, setFetching] = useState(true);  // initial data fetch
  const [toast, setToast] = useState(null);         // { type: 'success'|'error', message }

  // ─── Load existing config on mount ────────────────────────────────────────
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/pusher/get`, {
          headers: authHeaders(),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setFormData({
            appId:   json.data.appId   ?? "",
            key:     json.data.key     ?? "",
            secret:  json.data.secret  ?? "",
            cluster: json.data.cluster ?? "",
          });
        }
      } catch (err) {
        showToast("error", "Failed to load configuration.");
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  // ─── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Field change ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ─── Save ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const { appId, key, secret, cluster } = formData;
    if (!appId || !key || !secret || !cluster) {
      showToast("error", "All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pusher/save`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ appId, key, secret, cluster }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Pusher configuration saved successfully!");
      } else {
        showToast("error", json.error || "Failed to save configuration.");
      }
    } catch (err) {
      showToast("error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Fields config ─────────────────────────────────────────────────────────
  const fields = [
    { label: "PUSHER APP ID",      name: "appId",   placeholder: "e.g. 2075192"              },
    { label: "PUSHER APP KEY",     name: "key",     placeholder: "e.g. 7501ce4ce2d5cf546e85" },
    { label: "PUSHER APP SECRET",  name: "secret",  placeholder: "e.g. 1bc1edb021a0cb06783e" },
    { label: "PUSHER APP CLUSTER", name: "cluster", placeholder: "e.g. ap2"                  },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center pt-10 px-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-md shadow-lg text-white text-sm font-medium transition-all duration-300 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-200">
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Pusher Configuration
          </h1>
        </div>

        {/* Form Body */}
        <div className="px-8 py-8">
          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <svg
                className="animate-spin h-8 w-8 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
            </div>
          ) : (
            <div className="space-y-6">
              {fields.map(({ label, name, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-500 tracking-widest uppercase mb-2">
                    {label}
                  </label>
                  <input
                    type="text"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full border border-gray-300 rounded-md px-4 py-3 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Action */}
        <div className="px-8 pb-8">
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={handleSubmit}
              disabled={loading || fetching}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm px-7 py-3 rounded-md transition-colors duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Saving...
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