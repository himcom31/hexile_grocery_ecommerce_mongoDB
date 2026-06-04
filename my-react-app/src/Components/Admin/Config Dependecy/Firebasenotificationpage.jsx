import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken  } from "firebase/messaging";
import {
  Info, UploadCloud, CheckCircle2, AlertCircle,
  X, Loader2, Bell, Send, Radio,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   CONFIG  (Vite env vars — set in .env)
───────────────────────────────────────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Client-side Firebase config (public — NOT your service-account)
const FIREBASE_CLIENT_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const getAuthToken = () => localStorage.getItem("adminToken") || "";
const authHeaders  = () => ({ Authorization: `Bearer ${getAuthToken()}` });
const jsonHeaders  = () => ({ "Content-Type": "application/json", ...authHeaders() });

// Initialise client-side Firebase app once
const getFirebaseApp = () =>
  getApps().length === 0 ? initializeApp(FIREBASE_CLIENT_CONFIG) : getApps()[0];

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────────────────── */

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg
        border text-sm max-w-sm animate-fade-in
        ${ok ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
      {ok
        ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
        : <AlertCircle  className="w-4 h-4 mt-0.5 shrink-0 text-red-500"   />}
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 ml-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function SectionCard({ children, className = "" }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Spinner({ className = "w-4 h-4" }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function FirebaseNotificationPage() {

  /* ── Firebase config state ─────────────────────────────────────────────── */
  const [isConfigured,   setIsConfigured]   = useState(false);
  const [configMeta,     setConfigMeta]     = useState(null);   // { project_id, client_email }
  const [statusLoading,  setStatusLoading]  = useState(true);

  /* ── Upload / drop-zone state ──────────────────────────────────────────── */
  const [isDragging,     setIsDragging]     = useState(false);
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [uploadLoading,  setUploadLoading]  = useState(false);
  const fileInputRef = useRef(null);

  /* ── Send notification form ─────────────────────────────────────────────── */
  const [notifForm, setNotifForm] = useState({
    title: "", body: "", imageUrl: "", userId: "", topic: "",
  });
  const [sendLoading,    setSendLoading]    = useState(false);
  const [broadcastLoad,  setBroadcastLoad]  = useState(false);
  const [sendResult,     setSendResult]     = useState(null);   // last API response summary

  /* ── Device token registration ──────────────────────────────────────────── */
  const [tokenStatus,    setTokenStatus]    = useState("idle"); // idle | loading | granted | denied

  /* ── Toast ──────────────────────────────────────────────────────────────── */
  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }, []);

  /* ── Load config status on mount ────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/firebase/status`, { headers: authHeaders() });
        const json = await res.json();
        if (json.success) {
          setIsConfigured(json.isConfigured);
          setConfigMeta(json.data);
        }
      } catch {
        showToast("error", "Could not load Firebase status.");
      } finally {
        setStatusLoading(false);
      }
    })();
  }, [showToast]);

  /* ── File helpers ───────────────────────────────────────────────────────── */
  const validateFile = (file) => {
    if (!file) return false;
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      showToast("error", "Please select a valid .json service-account file."); return false;
    }
    if (file.size > 1 * 1024 * 1024) {
      showToast("error", "File must be under 1 MB."); return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (validateFile(f)) setSelectedFile(f);
  };

  const handleFileChange  = (e) => {
    const f = e.target.files[0];
    if (validateFile(f)) setSelectedFile(f);
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Upload service-account JSON ────────────────────────────────────────── */
  const handleUpload = async () => {
    if (!selectedFile) { showToast("error", "Please select a JSON file first."); return; }
    setUploadLoading(true);
    try {
      const form = new FormData();
      form.append("serviceAccount", selectedFile);

      const res  = await fetch(`${API_BASE}/firebase/upload-config`, {
        method: "POST", headers: authHeaders(), body: form,
      });
      const json = await res.json();

      if (json.success) {
        setIsConfigured(true);
        setConfigMeta({ project_id: json.data?.project_id, client_email: json.data?.client_email });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        showToast("success", "Firebase configuration uploaded and verified!");
      } else {
        showToast("error", json.error || "Upload failed.");
      }
    } catch {
      showToast("error", "Network error — please try again.");
    } finally {
      setUploadLoading(false);
    }
  };

  /* ── Send targeted notification ─────────────────────────────────────────── */
  const handleSendNotification = async () => {
    const { title, body, imageUrl, userId, topic } = notifForm;
    if (!title || !body) { showToast("error", "Title and body are required."); return; }
    if (!userId && !topic) { showToast("error", "Provide a User ID or a Topic."); return; }

    setSendLoading(true); setSendResult(null);
    try {
      const payload = { title, body, ...(imageUrl && { imageUrl }),
        ...(topic  ? { topic }  : {}),
        ...(userId ? { userId } : {}),
      };
      const res  = await fetch(`${API_BASE}/firebase/send`, {
        method: "POST", headers: jsonHeaders(), body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setSendResult(json);
        showToast("success", `Notification sent! ✓ ${json.successCount ?? 1} delivered.`);
      } else {
        showToast("error", json.error || "Failed to send notification.");
      }
    } catch {
      showToast("error", "Network error — please try again.");
    } finally {
      setSendLoading(false);
    }
  };

  /* ── Broadcast to all devices ───────────────────────────────────────────── */
  const handleBroadcast = async () => {
    const { title, body, imageUrl } = notifForm;
    if (!title || !body) { showToast("error", "Title and body are required for broadcast."); return; }
    if (!window.confirm("Send this notification to ALL registered devices?")) return;

    setBroadcastLoad(true); setSendResult(null);
    try {
      const res  = await fetch(`${API_BASE}/firebase/broadcast`, {
        method: "POST", headers: jsonHeaders(),
        body: JSON.stringify({ title, body, ...(imageUrl && { imageUrl }) }),
      });
      const json = await res.json();
      if (json.success) {
        setSendResult(json);
        showToast("success",
          `Broadcast done — ${json.successCount}/${json.totalDevices} devices reached.`
        );
      } else {
        showToast("error", json.error || "Broadcast failed.");
      }
    } catch {
      showToast("error", "Network error — please try again.");
    } finally {
      setBroadcastLoad(false);
    }
  };

  /* ── Register this browser's FCM token ─────────────────────────────────── */
  const handleRegisterToken = async () => {
    setTokenStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setTokenStatus("denied");
        showToast("error", "Notification permission was denied.");
        return;
      }
      const app       = getFirebaseApp();
      const messaging = getMessaging(app);
      const fcmToken  = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (!fcmToken) throw new Error("Failed to retrieve FCM token — check your VAPID key.");

      const res  = await fetch(`${API_BASE}/firebase/register-token`, {
        method: "POST", headers: jsonHeaders(),
        body: JSON.stringify({ token: fcmToken, platform: "web" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Token registration failed.");

      setTokenStatus("granted");
      showToast("success", "This device is now registered for push notifications.");
    } catch (err) {
      setTokenStatus("idle");
      showToast("error", err.message);
    }
  };

  /* ── UI ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-gray-500" />
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Firebase Notification
            </h1>
          </div>
          <a
            href="https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Get instructions <Info className="w-4 h-4" />
          </a>
        </div>

        {/* ── Status banner ───────────────────────────────────────────────── */}
        {!statusLoading && (
          isConfigured ? (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3.5">
              <span className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </span>
              <div>
                <p className="text-sm font-semibold text-green-800">Firebase Configuration Active</p>
                {configMeta && (
                  <p className="text-sm text-green-700 mt-0.5">
                    Project: <span className="font-medium">{configMeta.project_id}</span>
                    {configMeta.client_email && (
                      <> &nbsp;·&nbsp; {configMeta.client_email}</>
                    )}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* ── Exact red banner from the reference design ── */
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3.5">
              <span className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-white" />
              </span>
              <div>
                <p className="text-sm font-semibold text-red-700">Firebase Configuration Incomplete</p>
                <p className="text-sm text-red-600 mt-0.5">
                  Please complete Firebase configuration to enable notifications.
                  Notifications will not be sent without it.
                </p>
              </div>
            </div>
          )
        )}

        {/* ── Upload card — exact match to reference ───────────────────────── */}
        <SectionCard className="p-8">
          <h2 className="text-base font-medium text-gray-600 text-center mb-6">
            Select generated Json File
          </h2>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
              ${isDragging
                ? "border-green-400 bg-green-50 scale-[1.01]"
                : selectedFile
                  ? "border-green-500 bg-green-50/60"
                  : "border-green-400 hover:bg-green-50/50"}`}
            style={{ minHeight: 220 }}
          >
            <input
              ref={fileInputRef} type="file" accept=".json,application/json"
              className="hidden" onChange={handleFileChange}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              {selectedFile ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button onClick={clearFile}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors mt-0.5">
                    <X className="w-3 h-3" /> Remove
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                    <UploadCloud className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Drop file here or click to upload</p>
                </>
              )}
            </div>
          </div>

          {/* Upload action */}
          <div className="flex justify-end mt-5">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploadLoading}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600
                disabled:opacity-50 disabled:cursor-not-allowed
                text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              {uploadLoading
                ? <><Spinner /> Uploading…</>
                : <><UploadCloud className="w-4 h-4" />
                    {isConfigured ? "Replace Configuration" : "Upload Configuration"}</>}
            </button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            Download from{" "}
            <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer"
              className="text-green-600 hover:underline">Firebase Console</a>
            {" → "}Project Settings → Service Accounts → <em>Generate new private key</em>.
            Keep this file confidential — it grants admin access to your Firebase project.
          </p>
        </SectionCard>

        {/* ── Send notification card (only shown when configured) ────────── */}
        {isConfigured && (
          <SectionCard className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <Send className="w-4 h-4 text-gray-500" />
              <h2 className="text-base font-semibold text-gray-800">Send Push Notification</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input type="text" placeholder="Notification title"
                  value={notifForm.title}
                  onChange={(e) => setNotifForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                />
              </div>

              {/* Body */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Body <span className="text-red-500">*</span>
                </label>
                <textarea rows={3} placeholder="Notification message"
                  value={notifForm.body}
                  onChange={(e) => setNotifForm((p) => ({ ...p, body: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-y
                    focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                />
              </div>

              {/* Image URL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Image URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="url" placeholder="https://example.com/image.png"
                  value={notifForm.imageUrl}
                  onChange={(e) => setNotifForm((p) => ({ ...p, imageUrl: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                />
              </div>

              {/* User ID */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  User ID
                </label>
                <input type="text" placeholder="MongoDB ObjectId of the user"
                  value={notifForm.userId}
                  onChange={(e) => setNotifForm((p) => ({ ...p, userId: e.target.value, topic: "" }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Topic
                </label>
                <input type="text" placeholder="e.g. all-users"
                  value={notifForm.topic}
                  onChange={(e) => setNotifForm((p) => ({ ...p, topic: e.target.value, userId: "" }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Result badge */}
            {sendResult && (
              <div className="mt-4 flex flex-wrap gap-3">
                {sendResult.totalDevices !== undefined && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                    Total devices: <strong>{sendResult.totalDevices}</strong>
                  </span>
                )}
                {sendResult.successCount !== undefined && (
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                    ✓ Delivered: <strong>{sendResult.successCount}</strong>
                  </span>
                )}
                {sendResult.failureCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full">
                    ✗ Failed: <strong>{sendResult.failureCount}</strong>
                  </span>
                )}
                {sendResult.pruned > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full">
                    Pruned invalid tokens: <strong>{sendResult.pruned}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={handleSendNotification}
                disabled={sendLoading || broadcastLoad}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {sendLoading ? <><Spinner /> Sending…</> : <><Send className="w-4 h-4" /> Send Notification</>}
              </button>

              <button
                onClick={handleBroadcast}
                disabled={sendLoading || broadcastLoad}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {broadcastLoad ? <><Spinner /> Broadcasting…</> : <><Radio className="w-4 h-4" /> Broadcast to All</>}
              </button>
            </div>
          </SectionCard>
        )}

        {/* ── Register this browser device ─────────────────────────────────── */}
        {isConfigured && (
          <SectionCard className="px-6 py-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-medium text-gray-800">Register This Device</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Allow push notifications in your browser and register this device to receive them.
                </p>
              </div>
              <button
                onClick={handleRegisterToken}
                disabled={tokenStatus === "loading" || tokenStatus === "granted"}
                className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shrink-0
                  ${tokenStatus === "granted"
                    ? "bg-green-100 text-green-700 cursor-default"
                    : tokenStatus === "denied"
                      ? "bg-red-100 text-red-700 cursor-not-allowed"
                      : "bg-gray-800 hover:bg-gray-900 text-white disabled:opacity-50"}`}
              >
                {tokenStatus === "loading"  && <><Spinner /> Registering…</>}
                {tokenStatus === "granted"  && <><CheckCircle2 className="w-4 h-4" /> Registered</>}
                {tokenStatus === "denied"   && <><AlertCircle  className="w-4 h-4" /> Permission Denied</>}
                {tokenStatus === "idle"     && <><Bell className="w-4 h-4" /> Enable Notifications</>}
              </button>
            </div>
          </SectionCard>
        )}

      </div>
    </div>
  );
}