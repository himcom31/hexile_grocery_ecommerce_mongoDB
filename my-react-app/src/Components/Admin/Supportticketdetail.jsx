import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const BASE = "http://localhost:5000/api/support/admin";
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const STATUS_OPTIONS = ["Pending", "Confirm", "Completed"];
const STATUS_COLORS  = {
  Pending:   { bg: "#f59e0b", color: "#fff" },
  Confirm:   { bg: "#7c3aed", color: "#fff" },
  Completed: { bg: "#16a34a", color: "#fff" },
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// ─── Toggle ───────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button type="button" onClick={onChange} disabled={disabled}
    style={{
      width: 48, height: 26, borderRadius: 99, border: "none",
      background: checked ? "#16a34a" : "#d1d5db",
      position: "relative", cursor: disabled ? "not-allowed" : "pointer",
      transition: "background 0.2s", padding: 0, flexShrink: 0,
    }}>
    <span style={{
      position: "absolute", top: 3, left: checked ? 25 : 3,
      width: 20, height: 20, borderRadius: "50%", background: "#fff",
      transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
    }} />
  </button>
);

// ─── Status Dropdown ──────────────────────────────────────────────────────────
const StatusDropdown = ({ value, onChange, saving }) => {
  const [open, setOpen] = useState(false);
  const sc = STATUS_COLORS[value] || { bg: "#6b7280", color: "#fff" };
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} disabled={saving}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 16px", background: sc.bg, color: sc.color,
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
          minWidth: 110,
        }}>
        {value}
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 200,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", minWidth: 140,
        }}>
          {STATUS_OPTIONS.map(opt => {
            const c = STATUS_COLORS[opt];
            return (
              <button key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "10px 14px", border: "none",
                  background: value === opt ? "#f9fafb" : "#fff",
                  cursor: "pointer", fontFamily: "inherit", fontSize: 13,
                  fontWeight: value === opt ? 700 : 400, color: "#111",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                onMouseLeave={e => e.currentTarget.style.background = value === opt ? "#f9fafb" : "#fff"}
              >
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c.bg, flexShrink: 0 }} />
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Schedule Modal ───────────────────────────────────────────────────────────
const ScheduleModal = ({ current, onSave, onClose, saving }) => {
  const [val, setVal] = useState(current ? new Date(current).toISOString().slice(0, 16) : "");
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 420, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", animation: "fadeIn 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Set Schedule</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#6b7280", cursor: "pointer", padding: 0 }}>×</button>
        </div>
        <div style={{ padding: "22px" }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Date & Time</label>
          <input type="datetime-local" value={val} onChange={e => setVal(e.target.value)}
            style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            onFocus={e => e.target.style.borderColor = "#16a34a"}
            onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "14px 22px", borderTop: "1px solid #f0f0f0" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => onSave(val)} disabled={saving || !val}
            style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: saving ? "#15803d" : "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {saving ? "Saving…" : "Save Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
const ChatBubble = ({ msg }) => {
  const isAdmin = msg.sender === "admin";
  return (
    <div style={{ display: "flex", justifyContent: isAdmin ? "flex-start" : "flex-end", marginBottom: 16, gap: 10, alignItems: "flex-end" }}>
      {isAdmin && (
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          🛡️
        </div>
      )}
      <div>
        <div style={{
          maxWidth: 320, padding: "10px 14px", borderRadius: isAdmin ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
          background: isAdmin ? "#e5e7eb" : "#16a34a",
          color: isAdmin ? "#111" : "#fff",
          fontSize: 14, lineHeight: 1.5,
        }}>
          {msg.message}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, textAlign: isAdmin ? "left" : "right" }}>
          {formatDate(msg.createdAt)}
        </div>
      </div>
      {!isAdmin && (
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#dbeafe", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          👤
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function SupportTicketDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const chatRef     = useRef(null);

  const [ticket,        setTicket]        = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [reply,         setReply]         = useState("");
  const [sending,       setSending]       = useState(false);
  const [savingStatus,  setSavingStatus]  = useState(false);
  const [showSchedule,  setShowSchedule]  = useState(false);
  const [savingSchedule,setSavingSchedule]= useState(false);
  const [togglingMsg,   setTogglingMsg]   = useState(false);
  const [toast,         setToast]         = useState(null);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [ticket?.messages]);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/${id}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setTicket(data.ticket);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  // ── Status change ────────────────────────────────────────────────────────
  const handleStatusChange = async (status) => {
    setSavingStatus(true);
    try {
      const res  = await fetch(`${BASE}/${id}/status`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify({ status }) });
      const data = await res.json();
      if (data.success) { setTicket(data.ticket); showToast(`Status updated to ${status}`); }
    } catch { showToast("Failed to update status", "error"); }
    finally { setSavingStatus(false); }
  };

  // ── Set schedule ─────────────────────────────────────────────────────────
  const handleSchedule = async (scheduledAt) => {
    setSavingSchedule(true);
    try {
      const res  = await fetch(`${BASE}/${id}/schedule`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify({ scheduledAt }) });
      const data = await res.json();
      if (data.success) { setTicket(data.ticket); setShowSchedule(false); showToast("Schedule saved!"); }
    } catch { showToast("Failed to set schedule", "error"); }
    finally { setSavingSchedule(false); }
  };

  // ── Toggle messaging ──────────────────────────────────────────────────────
  const handleToggleMsg = async () => {
    setTogglingMsg(true);
    try {
      const res  = await fetch(`${BASE}/${id}/toggle-msg`, { method: "PATCH", headers: getHeaders() });
      const data = await res.json();
      if (data.success) setTicket(t => ({ ...t, customerCanReply: data.customerCanReply }));
    } catch { showToast("Failed to toggle", "error"); }
    finally { setTogglingMsg(false); }
  };

  // ── Send reply ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res  = await fetch(`${BASE}/${id}/reply`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ message: reply.trim() }) });
      const data = await res.json();
      if (data.success) { setTicket(data.ticket); setReply(""); }
    } catch { showToast("Failed to send message", "error"); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div style={{ padding: "28px 32px", fontFamily: "'Nunito','Inter',sans-serif" }}>
      <div style={{ height: 28, width: 260, background: "#f0f0f0", borderRadius: 6, marginBottom: 28, animation: "pulse 1.4s ease-in-out infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 14, height: 460, animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ background: "#fff", borderRadius: 14, height: 460, animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
    </div>
  );

  if (!ticket) return (
    <div style={{ padding: "60px 32px", textAlign: "center", color: "#9ca3af", fontFamily: "'Nunito','Inter',sans-serif" }}>
      Ticket not found.
    </div>
  );

  const user = ticket.user || {};

  return (
    <>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ padding: "28px 32px", minHeight: "100vh", background: "#f3f4f6", fontFamily: "'Nunito','Inter',sans-serif" }}>

        {/* Page Title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", display: "flex", padding: 0 }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0 }}>
            Support Ticket #{ticket.ticketNumber}
          </h1>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "start" }}>

          {/* ── LEFT: Ticket Info ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: "22px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", animation: "fadeIn 0.3s ease" }}>

              {/* Top row: date, ticket#, status dropdown, set schedule */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>{formatDate(ticket.createdAt)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1" }}>#{ticket.ticketNumber}</span>
                <StatusDropdown value={ticket.status} onChange={handleStatusChange} saving={savingStatus} />
                <button onClick={() => setShowSchedule(true)}
                  style={{
                    padding: "10px 18px", background: "#16a34a", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#15803d"}
                  onMouseLeave={e => e.currentTarget.style.background = "#16a34a"}
                >
                  Set Schedule
                </button>
                {ticket.scheduledAt && (
                  <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, background: "#f0fdf4", padding: "4px 10px", borderRadius: 20, border: "1px solid #bbf7d0" }}>
                    📅 {new Date(ticket.scheduledAt).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Order + Issue Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Order Number</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{ticket.orderNumber || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Issue Type</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{ticket.issueTypeName || "—"}</div>
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Subject</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{ticket.subject}</div>
              </div>

              {/* Contact Info */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 12 }}>Contact Info</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Email</div>
                    <div style={{ fontSize: 14, color: "#374151" }}>{ticket.email || user.email || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Phone</div>
                    <div style={{ fontSize: 14, color: "#374151" }}>{ticket.phone || user.phone || "—"}</div>
                  </div>
                </div>
              </div>

              {/* File Attachment */}
              {ticket.attachment && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#111", marginBottom: 10 }}>File Attachment</div>
                  <a href={ticket.attachment} target="_blank" rel="noopener noreferrer">
                    <img src={ticket.attachment} alt="attachment"
                      style={{ width: 90, height: 72, objectFit: "cover", borderRadius: 8, border: "1.5px solid #e5e7eb", cursor: "pointer" }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                  </a>
                </div>
              )}
            </div>

            {/* Customer Send Message Toggle */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Customer Send Message Enable/Disable</span>
              <Toggle checked={ticket.customerCanReply} onChange={handleToggleMsg} disabled={togglingMsg} />
            </div>
          </div>

          {/* ── RIGHT: Chat Panel ── */}
          <div style={{ background: "#f1f5f9", borderRadius: 14, border: "1px solid #f0f0f0", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 520, boxShadow: "0 2px 12px rgba(0,0,0,0.04)", animation: "fadeIn 0.4s ease" }}>

            {/* Messages */}
            <div ref={chatRef} style={{ flex: 1, padding: "20px 16px", overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 420, maxHeight: 520 }}>
              {ticket.messages.length === 0
                ? <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: "auto", paddingBottom: 20 }}>No messages yet.</div>
                : ticket.messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)
              }
            </div>

            {/* Reply input */}
            <div style={{ padding: "12px 14px", background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 10 }}>
              <input
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Reply..."
                style={{
                  flex: 1, padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 24,
                  fontSize: 14, outline: "none", fontFamily: "inherit", color: "#111", background: "#f9fafb",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderColor = "#16a34a"}
                onBlur={e  => e.target.style.borderColor = "#e5e7eb"}
              />
              <button onClick={handleSend} disabled={sending || !reply.trim()}
                style={{
                  width: 44, height: 44, borderRadius: "50%", border: "none",
                  background: reply.trim() ? "#16a34a" : "#d1fae5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: sending || !reply.trim() ? "not-allowed" : "pointer",
                  flexShrink: 0, transition: "background 0.15s",
                }}>
                {sending
                  ? <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}><path d="M12 2a10 10 0 0110 10"/></svg>
                  : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={reply.trim() ? "#fff" : "#16a34a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showSchedule && (
        <ScheduleModal
          current={ticket.scheduledAt}
          onSave={handleSchedule}
          onClose={() => setShowSchedule(false)}
          saving={savingSchedule}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          background: toast.type === "success" ? "#166534" : "#991b1b",
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
          animation: "fadeIn 0.25s ease",
        }}>
          {toast.message}
        </div>
      )}
    </>
  );
}