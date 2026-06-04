import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, Send, Radio, AlertCircle, CheckCircle2,
  X, Loader2, Image as ImageIcon, Filter, Users,
  ChevronLeft, ChevronRight, Smartphone, Monitor, Tablet,
  Settings, RefreshCw,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────────────────────── */
const API_BASE     = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const getToken     = () => localStorage.getItem("adminToken") || "";
const authHeaders  = () => ({ Authorization: `Bearer ${getToken()}` });
const jsonHeaders  = () => ({ "Content-Type": "application/json", ...authHeaders() });

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const PLATFORM_OPTIONS = [
  { value: "all",     label: "All" },
  { value: "web",     label: "Web" },
  { value: "android", label: "Android" },
  { value: "ios",     label: "iOS" },
];

const platformIcon = (p) => {
  if (p === "android") return <Smartphone className="w-3 h-3" />;
  if (p === "ios")     return <Tablet     className="w-3 h-3" />;
  return                      <Monitor    className="w-3 h-3" />;
};

function Spinner({ className = "w-4 h-4" }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

/* ─────────────────────────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-start gap-3 px-4 py-3 rounded-lg
        shadow-xl border text-sm max-w-sm
        ${ok
          ? "bg-green-50 border-green-200 text-green-800"
          : "bg-red-50 border-red-200 text-red-800"}`}
      style={{ animation: "slideIn .25s ease" }}
    >
      {ok
        ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
        : <AlertCircle  className="w-4 h-4 mt-0.5 shrink-0 text-red-500"   />}
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   FIREBASE STATUS BANNER  (top of page)
───────────────────────────────────────────────────────────────────────────── */
function FirebaseBanner({ isConfigured, onGoToConfig }) {
  if (isConfigured) return null;
  return (
    <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3.5 mb-5">
      <div className="flex items-start gap-3">
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
      <button
        onClick={onGoToConfig}
        className="shrink-0 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold
          px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
      >
        Go to Config
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   IMAGE PREVIEW STRIP
───────────────────────────────────────────────────────────────────────────── */
function ImagePreview({ file, onClear }) {
  const url = file ? URL.createObjectURL(file) : null;
  if (!url) return null;
  return (
    <div className="relative inline-block mt-2">
      <img src={url} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
      <button
        onClick={onClear}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white
          flex items-center justify-center shadow hover:bg-red-600 transition"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function PushNotificationPage() {

  /* ── Firebase config status ─────────────────────────────────────────────── */
  const [isConfigured,  setIsConfigured]  = useState(true);   // optimistic; refetched
  const [configLoading, setConfigLoading] = useState(true);

  /* ── Compose form ───────────────────────────────────────────────────────── */
  const [title,       setTitle]       = useState("");
  const [message,     setMessage]     = useState("");
  const [imageFile,   setImageFile]   = useState(null);
  const fileRef = useRef(null);

  /* ── Users table ────────────────────────────────────────────────────────── */
  const [users,        setUsers]        = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [platform,     setPlatform]     = useState("all");
  const [selected,     setSelected]     = useState(new Set());   // Set of userId strings
  const [page,         setPage]         = useState(1);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalUsers,   setTotalUsers]   = useState(0);
  const LIMIT = 10;

  /* ── Send state ─────────────────────────────────────────────────────────── */
  const [sending,     setSending]     = useState(false);   // targeted
  const [broadcasting,setBroadcasting]= useState(false);   // broadcast-all
  const [lastResult,  setLastResult]  = useState(null);

  /* ── Toast ──────────────────────────────────────────────────────────────── */
  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, msg) => {
    setToast({ type, message: msg });
    setTimeout(() => setToast(null), 4500);
  }, []);

  /* ── Fetch Firebase status ──────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/firebase/status`, { headers: authHeaders() });
        const j = await r.json();
        if (j.success) setIsConfigured(j.isConfigured);
      } catch { /* silently use optimistic true */ }
      finally { setConfigLoading(false); }
    })();
  }, []);

  /* ── Fetch users ────────────────────────────────────────────────────────── */
  const fetchUsers = useCallback(async (pg = 1, plat = "all") => {
    setUsersLoading(true);
    try {
      const r = await fetch(
        `${API_BASE}/notifications/users?platform=${plat}&page=${pg}&limit=${LIMIT}`,
        { headers: authHeaders() }
      );
      const j = await r.json();
      if (j.success) {
        setUsers(j.users);
        setTotalPages(j.totalPages);
        setTotalUsers(j.total);
        setPage(pg);
      }
    } catch { showToast("error", "Failed to load users."); }
    finally { setUsersLoading(false); }
  }, [showToast]);

  useEffect(() => { fetchUsers(1, platform); }, []);   // initial load

  /* ── Selection helpers ──────────────────────────────────────────────────── */
  const allSelected   = users.length > 0 && users.every((u) => selected.has(u._id));
  const someSelected  = users.some((u) => selected.has(u._id));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selected);
      users.forEach((u) => next.delete(u._id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      users.forEach((u) => next.add(u._id));
      setSelected(next);
    }
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  /* ── Platform filter change ──────────────────────────────────────────────── */
  const handlePlatformChange = (val) => {
    setPlatform(val);
    setSelected(new Set());
    fetchUsers(1, val);
  };

  /* ── Image file ──────────────────────────────────────────────────────────── */
  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { showToast("error", "Image must be under 5 MB."); return; }
    setImageFile(f);
  };

  const clearImage = () => {
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Validate form ───────────────────────────────────────────────────────── */
  const validateForm = () => {
    if (!title.trim())   { showToast("error", "Notification title is required.");   return false; }
    if (!message.trim()) { showToast("error", "Notification message is required."); return false; }
    return true;
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("body",  message.trim());
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  /* ── Broadcast to ALL ────────────────────────────────────────────────────── */
  const handleBroadcast = async () => {
    if (!validateForm()) return;
    if (!isConfigured)   { showToast("error", "Firebase is not configured."); return; }
    if (!window.confirm("Send this notification to ALL registered devices?")) return;

    setBroadcasting(true); setLastResult(null);
    try {
      const r = await fetch(`${API_BASE}/notifications/send-all`, {
        method: "POST", headers: authHeaders(), body: buildFormData(),
      });
      const j = await r.json();
      if (j.success) {
        setLastResult({ type: "broadcast" });
        showToast("success", "Notification broadcast to all users!");
        setTitle(""); setMessage(""); clearImage();
      } else {
        showToast("error", j.error || "Broadcast failed.");
      }
    } catch { showToast("error", "Network error — please try again."); }
    finally { setBroadcasting(false); }
  };

  /* ── Send to selected users ─────────────────────────────────────────────── */
  const handleSendMessage = async () => {
    if (!validateForm()) return;
    if (!isConfigured) { showToast("error", "Firebase is not configured."); return; }

    const userIds = [...selected];
    if (userIds.length === 0) {
      // No checkboxes selected → fall back to broadcast
      await handleBroadcast();
      return;
    }

    setSending(true); setLastResult(null);
    try {
      const fd = buildFormData();
      userIds.forEach((id) => fd.append("userIds[]", id));

      const r = await fetch(`${API_BASE}/notifications/send-users`, {
        method: "POST", headers: authHeaders(), body: fd,
      });
      const j = await r.json();
      if (j.success) {
        setLastResult(j);
        showToast("success", `Sent to ${userIds.length} user(s). ✓ ${j.successCount ?? "?"} devices reached.`);
        setTitle(""); setMessage(""); clearImage(); setSelected(new Set());
      } else {
        showToast("error", j.error || "Send failed.");
      }
    } catch { showToast("error", "Network error — please try again."); }
    finally { setSending(false); }
  };

  const isBusy = sending || broadcasting;

  /* ── Avatar fallback ────────────────────────────────────────────────────── */
  const avatarUrl = (u) =>
    u.image || u.avatar || u.profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=e5f7ee&color=16a34a&size=64`;

  /* ── UI ──────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Firebase banner ──────────────────────────────────────────────── */}
        {!configLoading && (
          <FirebaseBanner
            isConfigured={isConfigured}
            onGoToConfig={() => {
              // Navigate to your Firebase config page; adjust the path as needed
              window.location.href = "/admin/firebase";
            }}
          />
        )}

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 mb-1">
          <Bell className="w-5 h-5 text-gray-500" />
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Push Notification</h1>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            COMPOSE CARD
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Notification Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isBusy}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
                disabled:opacity-60 disabled:bg-gray-50 transition"
            />
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Notification Message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isBusy}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-y
                focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
                disabled:opacity-60 disabled:bg-gray-50 transition"
            />
          </div>

          {/* Image upload */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Image <span className="text-gray-400 font-normal text-xs">(optional · max 5 MB)</span>
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isBusy}
                className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm
                  text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                <ImageIcon className="w-4 h-4" />
                {imageFile ? "Change Image" : "Choose Image"}
              </button>
              {imageFile && (
                <span className="text-xs text-gray-500 truncate max-w-[180px]">{imageFile.name}</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <ImagePreview file={imageFile} onClear={clearImage} />
          </div>

          {/* Result badges */}
          {lastResult && lastResult.successCount !== undefined && (
            <div className="flex flex-wrap gap-2 mb-4">
              {lastResult.totalDevices !== undefined && (
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                  Devices: <strong>{lastResult.totalDevices}</strong>
                </span>
              )}
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                ✓ Delivered: <strong>{lastResult.successCount}</strong>
              </span>
              {lastResult.failureCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full">
                  ✗ Failed: <strong>{lastResult.failureCount}</strong>
                </span>
              )}
              {lastResult.pruned > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full">
                  Pruned: <strong>{lastResult.pruned}</strong>
                </span>
              )}
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-gray-400">
              {selected.size > 0
                ? `${selected.size} user(s) selected — will send targeted notification`
                : "No users selected — Send Message will broadcast to all"}
            </p>
            <div className="flex gap-2.5 flex-wrap">
              {/* Broadcast button (always available) */}
              <button
                onClick={handleBroadcast}
                disabled={isBusy || !isConfigured}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                {broadcasting ? <><Spinner /> Broadcasting…</> : <><Radio className="w-4 h-4" /> Broadcast All</>}
              </button>

              {/* Primary: send to selected (or all if none selected) */}
              <button
                onClick={handleSendMessage}
                disabled={isBusy || !isConfigured}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                {sending
                  ? <><Spinner /> Sending…</>
                  : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            USERS TABLE CARD
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">

          {/* Table toolbar */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Filter by Device Type</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Platform dropdown */}
              <select
                value={platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
              >
                {PLATFORM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Refresh */}
              <button
                onClick={() => fetchUsers(page, platform)}
                disabled={usersLoading}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800
                  border border-gray-300 rounded-lg px-3 py-1.5 transition disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>

              {/* Selection count */}
              {selected.size > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                  {selected.size} selected
                </span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="w-10 px-5 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-green-500
                        focus:ring-green-400 cursor-pointer accent-green-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">
                    Thumbnail
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">
                    Email Address
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">
                    Phone Number
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">
                    Devices
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usersLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Spinner className="w-6 h-6" />
                        <span className="text-sm">Loading users…</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Users className="w-8 h-8 opacity-40" />
                        <span className="text-sm">No users found for this filter.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u._id}
                      onClick={() => toggleOne(u._id)}
                      className={`cursor-pointer transition-colors
                        ${selected.has(u._id)
                          ? "bg-green-50 hover:bg-green-50/80"
                          : "hover:bg-gray-50/70"}`}
                    >
                      {/* Checkbox */}
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(u._id)}
                          onChange={() => toggleOne(u._id)}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-green-500"
                        />
                      </td>

                      {/* Avatar */}
                      <td className="px-4 py-3.5">
                        <img
                          src={avatarUrl(u)}
                          alt={u.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=e5f7ee&color=16a34a&size=64`;
                          }}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200"
                        />
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-gray-800">{u.name || "—"}</span>
                        {!u.hasToken && (
                          <span className="ml-2 text-xs text-gray-400">(no token)</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3.5 text-gray-600">{u.email || "—"}</td>

                      {/* Phone */}
                      <td className="px-4 py-3.5 text-gray-600">{u.phone || "—"}</td>

                      {/* Devices / platforms */}
                      <td className="px-4 py-3.5">
                        {u.platforms?.length > 0 ? (
                          <div className="flex gap-1.5 flex-wrap">
                            {[...new Set(u.platforms)].map((p) => (
                              <span
                                key={p}
                                className="inline-flex items-center gap-1 text-xs bg-gray-100
                                  text-gray-600 px-2 py-0.5 rounded-full capitalize"
                              >
                                {platformIcon(p)} {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {!usersLoading && totalUsers > 0 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 flex-wrap gap-3">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalUsers)} of {totalUsers} users
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { const p = page - 1; setPage(p); fetchUsers(p, platform); }}
                  disabled={page <= 1 || usersLoading}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50
                    disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => { setPage(pg); fetchUsers(pg, platform); }}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition
                        ${pg === page
                          ? "bg-green-500 text-white shadow-sm"
                          : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  onClick={() => { const p = page + 1; setPage(p); fetchUsers(p, platform); }}
                  disabled={page >= totalPages || usersLoading}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50
                    disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}