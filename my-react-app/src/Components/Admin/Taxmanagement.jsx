import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000/api/taxes"; // adjust if your base path differs

// ─── tiny helpers ────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("adminToken") || "";

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts, remove }) => (
  <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
    {toasts.map((t) => (
      <div
        key={t.id}
        onClick={() => remove(t.id)}
        style={{
          background: t.type === "error" ? "#fee2e2" : "#dcfce7",
          border: `1px solid ${t.type === "error" ? "#fca5a5" : "#86efac"}`,
          color: t.type === "error" ? "#b91c1c" : "#15803d",
          padding: "10px 16px",
          borderRadius: 8,
          fontSize: 14,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,.10)",
          minWidth: 240,
          animation: "slideIn .25s ease",
        }}
      >
        {t.msg}
      </div>
    ))}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, onSubmit, loading, initial }) => {
  const [taxName, setTaxName] = useState(initial?.taxName || "");
  const [percentage, setPercentage] = useState(initial?.percentage ?? "");

  const handle = (e) => {
    e.preventDefault();
    onSubmit({ taxName: taxName.trim(), percentage: Number(percentage) });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff", borderRadius: 12, width: "100%", maxWidth: 500,
          boxShadow: "0 20px 60px rgba(0,0,0,.18)", fontFamily: "'DM Sans', sans-serif",
          overflow: "hidden",
        }}
      >
        {/* header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: "#1e293b" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>

        {/* form */}
        <form onSubmit={handle} style={{ padding: 24 }}>
          <label style={labelStyle}>Tax Name <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            required
            placeholder="Tax Name"
            value={taxName}
            onChange={(e) => setTaxName(e.target.value)}
            style={inputStyle}
          />

          <label style={{ ...labelStyle, marginTop: 16 }}>Percentage (%) <span style={{ color: "#ef4444" }}>*</span></label>
          <input
            required
            type="number"
            min={0}
            max={100}
            step="0.01"
            placeholder="Percentage(%)"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            style={inputStyle}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Close</button>
            <button type="submit" disabled={loading} style={submitBtnStyle(loading)}>
              {loading ? "Saving…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
const Confirm = ({ msg, onConfirm, onCancel, loading }) => (
  <div
    style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}
  >
    <div style={{ background: "#fff", borderRadius: 12, padding: 28, width: 340, boxShadow: "0 20px 60px rgba(0,0,0,.18)", fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ margin: "0 0 20px", color: "#334155", fontSize: 15 }}>{msg}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
        <button onClick={onConfirm} disabled={loading} style={{ ...submitBtnStyle(loading), background: loading ? "#fca5a5" : "#ef4444" }}>
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

// ─── shared styles ────────────────────────────────────────────────────────────
const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 };
const inputStyle = {
  width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0",
  borderRadius: 8, fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
};
const cancelBtnStyle = {
  padding: "8px 18px", border: "1px solid #cbd5e1", borderRadius: 7, background: "#64748b",
  color: "#fff", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500,
};
const submitBtnStyle = (loading) => ({
  padding: "8px 20px", border: "none", borderRadius: 7,
  background: loading ? "#86efac" : "#22c55e", color: "#fff",
  cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
});

// ─── Toggle Switch ────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    style={{
      width: 48, height: 26, borderRadius: 13,
      background: checked ? "#22c55e" : "#cbd5e1",
      border: "none", cursor: disabled ? "not-allowed" : "pointer",
      position: "relative", transition: "background .2s", padding: 0,
    }}
  >
    <span style={{
      position: "absolute", top: 3, left: checked ? 25 : 3,
      width: 20, height: 20, borderRadius: "50%", background: "#fff",
      transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)",
    }} />
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TaxManagement() {
  const [taxes, setTaxes] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null); // null | { mode: 'add' } | { mode: 'edit', tax }
  const [modalLoading, setModalLoading] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // null | tax object
  const [deleteLoading, setDeleteLoading] = useState(false);

  // toast helpers
  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  // fetch all taxes
  const fetchTaxes = useCallback(async () => {
    setFetching(true);
    try {
      const data = await apiFetch("/all");
      setTaxes(data.taxes || []);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setFetching(false);
    }
  }, [addToast]);

  useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

  // add or update
  const handleModalSubmit = async ({ taxName, percentage }) => {
    setModalLoading(true);
    try {
      if (modal.mode === "add") {
        await apiFetch("/add", { method: "POST", body: JSON.stringify({ taxName, percentage }) });
        addToast("Tax added successfully");
      } else {
        await apiFetch(`/update/${modal.tax._id}`, { method: "PUT", body: JSON.stringify({ taxName, percentage }) });
        addToast("Tax updated successfully");
      }
      setModal(null);
      fetchTaxes();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setModalLoading(false);
    }
  };

  // toggle status
  const handleToggle = async (tax) => {
    setTogglingId(tax._id);
    try {
      const data = await apiFetch(`/toggle/${tax._id}`, { method: "PATCH" });
      setTaxes((prev) => prev.map((t) => t._id === tax._id ? { ...t, isActive: data.isActive } : t));
      addToast(data.message);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setTogglingId(null);
    }
  };

  // delete
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiFetch(`/delete/${confirmDelete._id}`, { method: "DELETE" });
      addToast("Tax deleted successfully");
      setConfirmDelete(null);
      fetchTaxes();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; background: #f1f5f9; }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />

      {modal && (
        <Modal
          title={modal.mode === "add" ? "Add New Tax" : "Edit Tax"}
          initial={modal.mode === "edit" ? modal.tax : null}
          onClose={() => setModal(null)}
          onSubmit={handleModalSubmit}
          loading={modalLoading}
        />
      )}

      {confirmDelete && (
        <Confirm
          msg={`Delete tax "${confirmDelete.taxName}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleteLoading}
        />
      )}

      <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", padding: "28px 32px" }}>

        {/* Info Banner */}
        <div style={{
          background: "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
          border: "1px solid #bae6fd", borderRadius: 12, padding: "18px 22px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 20 }}>☀️</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "#0c4a6e", fontSize: 15 }}>Important Information</p>
              <p style={{ margin: "4px 0 0", color: "#0369a1", fontSize: 14, lineHeight: 1.6 }}>
                Just a quick note: <strong>VAT and Taxes are calculated based on your order.</strong> If you have multiple VAT and Tax rates active, your total VAT and Tax amount will be clearly displayed on the checkout page for your convenience.
              </p>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.07)", overflow: "hidden" }}>

          {/* Card Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>All Taxes</h2>
            <button
              onClick={() => setModal({ mode: "add" })}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 18px", background: "#22c55e", border: "none",
                borderRadius: 8, color: "#fff", fontWeight: 600, fontSize: 14,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 2px 8px rgba(34,197,94,.30)", transition: "background .15s",
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#16a34a"}
              onMouseOut={(e) => e.currentTarget.style.background = "#22c55e"}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Create New
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["SL", "Name", "Percentage", "Status", "Action"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 20px", textAlign: h === "Action" || h === "Status" ? "center" : "left",
                      fontSize: 13, fontWeight: 600, color: "#64748b", letterSpacing: ".3px",
                      borderBottom: "1px solid #e2e8f0",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>
                      Loading…
                    </td>
                  </tr>
                ) : taxes.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 14 }}>
                      No taxes found. Click <strong>Create New</strong> to add one.
                    </td>
                  </tr>
                ) : (
                  taxes.map((tax, i) => (
                    <tr
                      key={tax._id}
                      style={{ borderBottom: "1px solid #f1f5f9", transition: "background .12s" }}
                      onMouseOver={(e) => e.currentTarget.style.background = "#fafcff"}
                      onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={tdStyle}>{i + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 500, color: "#1e293b" }}>{tax.taxName}</td>
                      <td style={tdStyle}>{tax.percentage}%</td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <Toggle
                          checked={tax.isActive}
                          onChange={() => handleToggle(tax)}
                          disabled={togglingId === tax._id}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                          {/* Edit */}
                          <button
                            onClick={() => setModal({ mode: "edit", tax })}
                            title="Edit"
                            style={iconBtnStyle("#3b82f6")}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDelete(tax)}
                            title="Delete"
                            style={iconBtnStyle("#ef4444")}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

const tdStyle = { padding: "14px 20px", fontSize: 14, color: "#475569" };
const iconBtnStyle = (color) => ({
  background: "none", border: "none", cursor: "pointer",
  color, padding: 4, borderRadius: 6, display: "flex", alignItems: "center",
  transition: "background .12s",
});