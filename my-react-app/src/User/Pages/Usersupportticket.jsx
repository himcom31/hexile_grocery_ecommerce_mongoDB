import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE   = "http://localhost:5000/api/support";
const ISSUE_API  = "http://localhost:5000/api/ticket";
const ORDER_API  = "http://localhost:5000/api/orders/my";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("userToken")}`,
});
const jsonHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("userToken")}`,
});

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  Pending:   { bg: "#fef9c3", color: "#b45309", border: "#fde68a" },
  Confirm:   { bg: "#ede9fe", color: "#7c3aed", border: "#ddd6fe" },
  Completed: { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
  Cancel:    { bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
};
const StatusBadge = ({ status }) => {
  const s = STATUS_STYLE[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>
      {status}
    </span>
  );
};

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
    style={{ animation: "spin 0.7s linear infinite" }}>
    <path d="M12 2a10 10 0 0110 10" />
  </svg>
);

// ─── ChevronRight ─────────────────────────────────────────────────────────────
const ChevronRight = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

// ─── Upload Icon ──────────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── CREATE TICKET MODAL ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
const CreateTicketModal = ({ onClose, onCreated }) => {
  const [orders,      setOrders]      = useState([]);
  const [issueTypes,  setIssueTypes]  = useState([]);
  const [form, setForm] = useState({
    orderNumber: "", issueType: "", issueTypeName: "",
    subject: "", message: "", email: "", phone: "",
    includeEmail: true, includePhone: false,
  });
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [dragOver,setDragOver]= useState(false);
  const fileRef = useRef();

  useEffect(() => {
    // Fetch orders and issue types in parallel
    Promise.all([
      fetch(ORDER_API, { headers: authHeaders() }).then(r => r.json()).catch(() => ({ orders: [] })),
      fetch(ISSUE_API, { headers: authHeaders() }).then(r => r.json()).catch(() => ({ types: [] })),
    ]).then(([ordRes, issRes]) => {
      setOrders(Array.isArray(ordRes) ? ordRes : ordRes.orders || []);
      setIssueTypes((issRes.types || []).filter(t => t.status));
    });
  }, []);

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  };

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(f.type)) { setErrors(e => ({ ...e, file: "Only jpg, jpeg, png, pdf allowed" })); return; }
    setFile(f);
    setErrors(e => ({ ...e, file: "" }));
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.issueType)  e.issueType = "Issue type is required";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim()) e.message = "Message is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("orderNumber",   form.orderNumber);
      fd.append("issueType",     form.issueType);
      fd.append("issueTypeName", form.issueTypeName);
      fd.append("subject",       form.subject);
      fd.append("message",       form.message);
      if (form.includeEmail) fd.append("email", form.email);
      if (form.includePhone) fd.append("phone", form.phone);
      if (file) fd.append("attachment", file);

      const res  = await fetch(API_BASE, { method: "POST", headers: authHeaders(), body: fd });
      const data = await res.json();
      if (data.success) { onCreated(data.ticket); onClose(); }
      else setErrors({ submit: data.message || "Failed to create ticket" });
    } catch {
      setErrors({ submit: "Network error. Please try again." });
    } finally { setSaving(false); }
  };

  const inputStyle = (err) => ({
    width: "100%", padding: "12px 14px", border: `1.5px solid ${err ? "#ef4444" : "#e5e7eb"}`,
    borderRadius: 8, fontSize: 14, color: "#111", fontFamily: "inherit",
    outline: "none", boxSizing: "border-box", background: "#fff", transition: "border-color 0.15s",
  });

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 720, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s ease" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 26px", borderBottom: "1px solid #f0f0f0", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "16px 16px 0 0" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#111" }}>Create Support Ticket</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f3f4f6", cursor: "pointer", fontSize: 20, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Order Number + Issue Type */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Order Number</label>
              <select value={form.orderNumber} onChange={e => set("orderNumber", e.target.value)}
                style={{ ...inputStyle(false), appearance: "none", cursor: "pointer" }}
                onFocus={e => e.target.style.borderColor = "#16a34a"}
                onBlur={e  => e.target.style.borderColor = "#e5e7eb"}>
                <option value="">Select order number</option>
                {orders.map(o => (
                  <option key={o._id} value={o.orderNumber || o._id}>
                    {o.orderNumber || `#${o._id.slice(-6).toUpperCase()}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                Issue Type <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <select value={form.issueType}
                onChange={e => {
                  const selected = issueTypes.find(t => t._id === e.target.value);
                  setForm(f => ({ ...f, issueType: e.target.value, issueTypeName: selected?.name || "" }));
                  if (errors.issueType) setErrors(er => ({ ...er, issueType: "" }));
                }}
                style={{ ...inputStyle(errors.issueType), appearance: "none", cursor: "pointer" }}
                onFocus={e => e.target.style.borderColor = "#16a34a"}
                onBlur={e  => e.target.style.borderColor = errors.issueType ? "#ef4444" : "#e5e7eb"}>
                <option value="">Select issue type</option>
                {issueTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              {errors.issueType && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.issueType}</div>}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Subject</label>
            <input value={form.subject} onChange={e => set("subject", e.target.value)} placeholder="Enter subject"
              style={inputStyle(errors.subject)}
              onFocus={e => e.target.style.borderColor = "#16a34a"}
              onBlur={e  => e.target.style.borderColor = errors.subject ? "#ef4444" : "#e5e7eb"} />
            {errors.subject && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.subject}</div>}
          </div>

          {/* Message + File Attachment */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                Message <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <textarea value={form.message} onChange={e => set("message", e.target.value)}
                placeholder="Write your message..."
                rows={6}
                style={{ ...inputStyle(errors.message), resize: "vertical", minHeight: 120 }}
                onFocus={e => e.target.style.borderColor = "#16a34a"}
                onBlur={e  => e.target.style.borderColor = errors.message ? "#ef4444" : "#e5e7eb"} />
              {errors.message && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.message}</div>}
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                File Attachment <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>(jpg, jpeg, png, pdf)</span>
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                style={{
                  border: `2px dashed ${dragOver ? "#16a34a" : errors.file ? "#ef4444" : "#d1fae5"}`,
                  borderRadius: 10, padding: "28px 16px", textAlign: "center",
                  cursor: "pointer", background: dragOver ? "#f0fdf4" : "#fafff8",
                  transition: "all 0.15s", minHeight: 120,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                {file
                  ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      {preview
                        ? <img src={preview} alt="preview" style={{ width: 60, height: 48, objectFit: "cover", borderRadius: 6 }} />
                        : <div style={{ fontSize: 28 }}>📄</div>}
                      <span style={{ fontSize: 12, color: "#374151", fontWeight: 600, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                      <button type="button" onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); }}
                        style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                    </div>
                  ) : (
                    <>
                      <UploadIcon />
                      <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>Click to upload or, drag and drop here</span>
                    </>
                  )
                }
              </div>
              {errors.file && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{errors.file}</div>}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Contact Info</span>
              <div style={{ display: "flex", gap: 16 }}>
                {[["includeEmail", "Email Address"], ["includePhone", "Phone Number"]].map(([key, label]) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "#16a34a", cursor: "pointer" }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="Enter email address" disabled={!form.includeEmail}
                  style={{ ...inputStyle(false), paddingLeft: 36, opacity: form.includeEmail ? 1 : 0.5 }}
                  onFocus={e => { if (form.includeEmail) e.target.style.borderColor = "#16a34a"; }}
                  onBlur={e  => e.target.style.borderColor = "#e5e7eb"} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.03 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92v2z"/></svg>
                </span>
                <input value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="Enter phone number" disabled={!form.includePhone}
                  style={{ ...inputStyle(false), paddingLeft: 36, opacity: form.includePhone ? 1 : 0.5 }}
                  onFocus={e => { if (form.includePhone) e.target.style.borderColor = "#16a34a"; }}
                  onBlur={e  => e.target.style.borderColor = "#e5e7eb"} />
              </div>
            </div>
          </div>

          {errors.submit && (
            <div style={{ fontSize: 13, color: "#ef4444", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, border: "1px solid #fca5a5" }}>
              {errors.submit}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "0 26px 26px" }}>
          <button onClick={handleSubmit} disabled={saving}
            style={{
              width: "100%", padding: "14px 0",
              background: saving ? "#15803d" : "#16a34a",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "background 0.2s",
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#15803d"; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = "#16a34a"; }}
          >
            {saving ? <><Spinner size={16} /> Submitting…</> : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function UserSupportTicket() {
  const navigate = useNavigate();
  const [activeTab,   setActiveTab]   = useState("Running");
  const [tickets,     setTickets]     = useState([]);
  const [counts,      setCounts]      = useState({ running: 0, completed: 0, cancel: 0 });
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);

  const loadCounts = async () => {
    try {
      const res  = await fetch(`${API_BASE}/my/counts`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setCounts(data.counts);
    } catch {}
  };

  const loadTickets = async (tab) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/my?tab=${tab}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setTickets(data.tickets);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadCounts();
    loadTickets(activeTab);
  }, [activeTab]);

  const handleCreated = (ticket) => {
    loadCounts();
    loadTickets(activeTab);
  };

  const tabs = [
    { key: "Running",   label: "Running",   count: counts.running   },
    { key: "Completed", label: "Completed", count: counts.completed },
    { key: "Cancel",    label: "Cancel",    count: counts.cancel    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ fontFamily: "'Nunito','Inter',sans-serif", minHeight: "100vh", background: "#f3f4f6" }}>
        <div style={{ padding: "28px 28px 0" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0 }}>Support Ticket</h1>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "11px 22px", background: "#16a34a", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(22,163,74,0.3)",
                transition: "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Create Ticket
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: 20, borderBottom: "2px solid #e5e7eb" }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "12px 20px", border: "none", background: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: activeTab === tab.key ? 700 : 500,
                  color: activeTab === tab.key ? "#16a34a" : "#6b7280",
                  borderBottom: activeTab === tab.key ? "2.5px solid #16a34a" : "2.5px solid transparent",
                  marginBottom: -2, fontFamily: "inherit", transition: "color 0.15s",
                }}>
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Ticket list */}
        <div style={{ padding: "20px 28px" }}>
          <div style={{ background: "#e8f0ea", borderRadius: 14, padding: "20px" }}>
            {loading
              ? [...Array(2)].map((_, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #f0f0f0", padding: "18px 22px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                      <div style={{ height: 13, width: 100, background: "#f0f0f0", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ height: 13, width: 70, background: "#f0f0f0", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
                        <div style={{ height: 22, width: 70, background: "#f0f0f0", borderRadius: 10, animation: "pulse 1.4s ease-in-out infinite" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 40 }}>
                      {[1,2,3].map(j => (
                        <div key={j}>
                          <div style={{ height: 10, width: 80, background: "#f0f0f0", borderRadius: 4, marginBottom: 6, animation: "pulse 1.4s ease-in-out infinite" }} />
                          <div style={{ height: 14, width: 110, background: "#f0f0f0", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              : tickets.length === 0
                ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>No {activeTab.toLowerCase()} tickets</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>
                      {activeTab === "Running" ? "Click Create Ticket to raise a new support request." : "Nothing here yet."}
                    </div>
                  </div>
                )
                : tickets.map(ticket => (
                  <div key={ticket._id}
                    style={{
                      background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
                      padding: "18px 22px", marginBottom: 14, cursor: "pointer",
                      transition: "box-shadow 0.2s, transform 0.15s",
                      animation: "fadeIn 0.3s ease",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                    onClick={() => navigate(`/user/support-tickets/${ticket._id}`)}
                  >
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>{formatDate(ticket.createdAt)}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1" }}>#{ticket.ticketNumber}</span>
                        <StatusBadge status={ticket.status} />
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                          <ChevronRight />
                        </div>
                      </div>
                    </div>

                    {/* Info row */}
                    <div style={{ display: "flex", flexWrap: "wrap" }}>
                      <div style={{ flex: "0 0 33%", minWidth: 140 }}>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Order Number</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{ticket.orderNumber || "—"}</div>
                      </div>
                      <div style={{ flex: "0 0 33%", minWidth: 140 }}>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Issue Type</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{ticket.issueTypeName || "—"}</div>
                      </div>
                      <div style={{ flex: "0 0 33%", minWidth: 140 }}>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Subject</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>{ticket.subject}</div>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}