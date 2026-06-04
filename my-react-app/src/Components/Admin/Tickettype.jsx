import { useState, useEffect } from "react";

const API = "http://localhost:5000/api/ticket";
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    style={{
      width: 48, height: 26, borderRadius: 99, border: "none",
      background: checked ? "#16a34a" : "#d1d5db",
      position: "relative", cursor: disabled ? "not-allowed" : "pointer",
      transition: "background 0.2s", flexShrink: 0, padding: 0,
    }}
  >
    <span style={{
      position: "absolute", top: 3,
      left: checked ? 25 : 3,
      width: 20, height: 20, borderRadius: "50%",
      background: "#fff", transition: "left 0.2s",
      boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
    }} />
  </button>
);

// ─── Edit Icon ────────────────────────────────────────────────────────────────
const EditIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <path d="M15 3h6v6" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ─── Trash Icon ───────────────────────────────────────────────────────────────
const TrashIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ animation: "spin 0.7s linear infinite" }}>
    <path d="M12 2a10 10 0 0110 10" />
  </svg>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ mode, initial, onSave, onClose, saving }) => {
  const [name, setName] = useState(initial || "");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!name.trim()) { setError("Name is required"); return; }
    onSave(name.trim());
  };

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 12, width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)", animation: "fadeIn 0.2s ease",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: "1px solid #f0f0f0",
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>
            {mode === "edit" ? "Edit Ticket Issue Type" : "Create Ticket Issue Type"}
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 22, color: "#6b7280", lineHeight: 1, padding: 0,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 22px 8px" }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
            Name <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            autoFocus
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            placeholder="Name"
            style={{
              width: "100%", padding: "11px 14px",
              border: `1.5px solid ${error ? "#ef4444" : "#e5e7eb"}`,
              borderRadius: 8, fontSize: 14, color: "#111",
              outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onFocus={e => { if (!error) e.target.style.borderColor = "#16a34a"; }}
            onBlur={e  => { e.target.style.borderColor = error ? "#ef4444" : "#e5e7eb"; }}
          />
          {error && (
            <div style={{ fontSize: 12, color: "#ef4444", marginTop: 5 }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 10,
          padding: "16px 22px", borderTop: "1px solid #f0f0f0", marginTop: 16,
        }}>
          <button onClick={onClose} style={{
            padding: "10px 22px", borderRadius: 8, border: "none",
            background: "#4b5563", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#374151"}
            onMouseLeave={e => e.currentTarget.style.background = "#4b5563"}
          >Close</button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "10px 22px", borderRadius: 8, border: "none",
            background: saving ? "#15803d" : "#16a34a", color: "#fff",
            fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
            transition: "background 0.15s",
          }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = "#15803d"; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.background = "#16a34a"; }}
          >
            {saving ? <><Spinner size={14} /> Saving…</> : "Save Issue Type"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ name, onConfirm, onClose, deleting }) => (
  <div
    onClick={e => e.target === e.currentTarget && onClose()}
    style={{
      position: "fixed", inset: 0, zIndex: 1001,
      background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}
  >
    <div style={{
      background: "#fff", borderRadius: 12, width: "100%", maxWidth: 400,
      padding: "28px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
      textAlign: "center", animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: "50%", background: "#fef2f2",
        display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
      }}>
        <TrashIcon />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 8 }}>Delete Issue Type?</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
        Are you sure you want to delete <strong>"{name}"</strong>? This cannot be undone.
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={onClose} style={{
          padding: "10px 24px", borderRadius: 8, border: "1.5px solid #e5e7eb",
          background: "#fff", color: "#374151", fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>Cancel</button>
        <button onClick={onConfirm} disabled={deleting} style={{
          padding: "10px 24px", borderRadius: 8, border: "none",
          background: deleting ? "#dc2626" : "#ef4444", color: "#fff",
          fontSize: 13, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer",
          fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
        }}>
          {deleting ? <><Spinner size={14} /> Deleting…</> : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: type === "success" ? "#166534" : "#991b1b",
      color: "#fff", padding: "12px 20px", borderRadius: 12,
      fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
      animation: "fadeIn 0.25s ease",
    }}>
      {message}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function TicketIssueTypes() {
  const [types,       setTypes]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);   // null = create, obj = edit
  const [deleteTarget,setDeleteTarget]= useState(null);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [togglingId,  setTogglingId]  = useState(null);
  const [toast,       setToast]       = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(API, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setTypes(data.types);
    } catch {
      setToast({ message: "Failed to load issue types", type: "error" });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Create / Edit ──────────────────────────────────────────────────────────
  const handleSave = async (name) => {
    setSaving(true);
    try {
      const isEdit = !!editTarget;
      const url    = isEdit ? `${API}/${editTarget._id}` : API;
      const method = isEdit ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify({ name }) });
      const data   = await res.json();
      if (data.success) {
        setTypes(prev =>
          isEdit
            ? prev.map(t => t._id === editTarget._id ? data.type : t)
            : [data.type, ...prev]
        );
        setToast({ message: isEdit ? "Issue type updated!" : "Issue type created!", type: "success" });
        setShowModal(false);
        setEditTarget(null);
      } else {
        setToast({ message: data.message || "Failed to save", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally { setSaving(false); }
  };

  // ── Toggle Status ──────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    setTogglingId(id);
    try {
      const res  = await fetch(`${API}/${id}/toggle`, { method: "PATCH", headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setTypes(prev => prev.map(t => t._id === id ? data.type : t));
      }
    } catch {
      setToast({ message: "Failed to update status", type: "error" });
    } finally { setTogglingId(null); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res  = await fetch(`${API}/${deleteTarget._id}`, { method: "DELETE", headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setTypes(prev => prev.filter(t => t._id !== deleteTarget._id));
        setToast({ message: "Issue type deleted", type: "success" });
        setDeleteTarget(null);
      } else {
        setToast({ message: data.message || "Failed to delete", type: "error" });
      }
    } catch {
      setToast({ message: "Network error", type: "error" });
    } finally { setDeleting(false); }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      <div style={{ padding: "28px 32px", minHeight: "100vh", background: "#f3f4f6", fontFamily: "'Nunito', 'Inter', sans-serif" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0 }}>Ticket Issue Types</h1>
          <button
            onClick={() => { setEditTarget(null); setShowModal(true); }}
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
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create New
          </button>
        </div>

        {/* ── Table Card ── */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          {/* Card header */}
          <div style={{ padding: "16px 22px", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>Ticket Issue Types</span>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["SL", "Name", "Status", "Action"].map((h, i) => (
                    <th key={h} style={{
                      padding: "13px 20px", fontSize: 13, fontWeight: 700, color: "#374151",
                      textAlign: i === 0 ? "center" : i === 3 ? "right" : "left",
                      borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? [...Array(3)].map((_, i) => (
                      <tr key={i}>
                        {[1,2,3,4].map(j => (
                          <td key={j} style={{ padding: "14px 20px" }}>
                            <div style={{ height: 14, background: "#f0f0f0", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite", width: j === 1 ? 24 : j === 3 ? 48 : "60%" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : types.length === 0
                    ? (
                      <tr>
                        <td colSpan={4} style={{ padding: "48px 20px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                          No issue types found. Click <strong>Create New</strong> to add one.
                        </td>
                      </tr>
                    )
                    : types.map((type, idx) => (
                      <tr key={type._id}
                        style={{ borderBottom: "1px solid #f3f4f6", transition: "background 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        {/* SL */}
                        <td style={{ padding: "14px 20px", textAlign: "center", fontSize: 14, color: "#374151", fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        {/* Name */}
                        <td style={{ padding: "14px 20px", fontSize: 14, color: "#111", fontWeight: 500 }}>
                          {type.name}
                        </td>
                        {/* Status */}
                        <td style={{ padding: "14px 20px" }}>
                          <Toggle
                            checked={type.status}
                            onChange={() => handleToggle(type._id)}
                            disabled={togglingId === type._id}
                          />
                        </td>
                        {/* Action */}
                        <td style={{ padding: "14px 20px", textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                            {/* Edit */}
                            <button
                              onClick={() => { setEditTarget(type); setShowModal(true); }}
                              title="Edit"
                              style={{
                                width: 34, height: 34, borderRadius: 8,
                                border: "1.5px solid #bae6fd", background: "#f0f9ff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "background 0.15s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "#e0f2fe"}
                              onMouseLeave={e => e.currentTarget.style.background = "#f0f9ff"}
                            >
                              <EditIcon />
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(type)}
                              title="Delete"
                              style={{
                                width: 34, height: 34, borderRadius: 8,
                                border: "1.5px solid #fca5a5", background: "#fff5f5",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", transition: "background 0.15s",
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                              onMouseLeave={e => e.currentTarget.style.background = "#fff5f5"}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <Modal
          mode={editTarget ? "edit" : "create"}
          initial={editTarget?.name || ""}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          saving={saving}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}