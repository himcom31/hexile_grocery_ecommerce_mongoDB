import { useState, useEffect } from "react";

const API_URL = "http://localhost:5000";
const getToken = () => localStorage.getItem("adminToken");
const authHdr = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const DELIVERY_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "On The Way", "Cancelled", "Returned"];

const statusStyle = (s) => ({
  Pending: { background: "#fef08a", color: "#854d0e" },
  Processing: { background: "#bfdbfe", color: "#1e40af" },
  Shipped: { background: "#ddd6fe", color: "#5b21b6" },
  Delivered: { background: "#bbf7d0", color: "#166534" },
  Cancelled: { background: "#fecaca", color: "#991b1b" },
  "On The Way": { background: "#ffffff", color: "#db2777" },
  Returned: { background: "#fed7aa", color: "#9a3412" },
  "Picked Up": { background: "#d1fae5", color: "#065f46" },
  "In Transit": { background: "#e0e7ff", color: "#3730a3" },
  "Out for Delivery": { background: "#fce7f3", color: "#9d174d" },
}[s] || { background: "#e5e7eb", color: "#374151" });

const payStyle = (s) => ({
  Paid: { background: "#bbf7d0", color: "#166534" },
  Pending: { background: "#fef08a", color: "#854d0e" },
  Failed: { background: "#fecaca", color: "#991b1b" },
  Refunded: { background: "#ddd6fe", color: "#5b21b6" },
}[s] || { background: "#e5e7eb", color: "#374151" });

const Badge = ({ label, type = "delivery" }) => {
  const s = type === "payment" ? payStyle(label) : statusStyle(label);
  return (
    <span style={{
      ...s, fontSize: 11, fontWeight: 700, padding: "3px 10px",
      borderRadius: 4, display: "inline-block", whiteSpace: "nowrap",
    }}>{label}</span>
  );
};

// ─── Timeline dot colors by status ────────────────────────────────────────────
const timelineDotColor = (status) => ({
  "Pending": "#f59e0b",
  "Processing": "#3b82f6",
  "Shipped": "#8b5cf6",
  "Picked Up": "#10b981",
  "In Transit": "#6366f1",
  "Out for Delivery": "#ec4899",
  "Delivered": "#16a34a",
  "Cancelled": "#ef4444",
  "Returned": "#f97316",
  "On The Way": "#db2777",
}[status] || "#9ca3af");

// ─── Format date/time helper ──────────────────────────────────────────────────
const fmtDT = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return d.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

// ─── Proof Image Tile ─────────────────────────────────────────────────────────
function ProofImage({ src, label }) {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  return (
    <>
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
        <div
          onClick={() => setOpen(true)}
          style={{
            borderRadius: 8, overflow: "hidden", cursor: "zoom-in",
            border: "1.5px solid #e5e7eb", background: "#f9fafb",
            position: "relative",
          }}
        >
          <img src={src} alt={label} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
          <div style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0)"}
          >
            <span style={{ color: "#fff", fontSize: 20, opacity: 0, transition: "opacity 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
              onMouseLeave={e => e.currentTarget.style.opacity = "0"}
            >🔍</span>
          </div>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 10, color: "#9ca3af", textAlign: "center" }}>Click to enlarge</p>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img src={src} alt={label} style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 10, objectFit: "contain" }} />
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute", top: -12, right: -12,
                width: 30, height: 30, borderRadius: "50%",
                background: "#fff", border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 800, color: "#374151",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >✕</button>
            <p style={{ color: "#fff", textAlign: "center", marginTop: 8, fontSize: 13, opacity: 0.7 }}>{label}</p>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Delivery History Section ─────────────────────────────────────────────────
function DeliveryHistorySection({ order }) {
  const rider = order?.assignedRider;

  // Build timeline from statusHistory or fallback to timestamp fields
  const buildTimeline = () => {
    if (order?.statusHistory?.length) {
      return order.statusHistory.map(h => ({
        status: h.status,
        time: h.changedAt || h.timestamp || h.updatedAt,
        note: h.note || h.description || "",
      }));
    }
    // Fallback: derive from known timestamp fields
    const entries = [];
    if (order?.createdAt) entries.push({ status: "Pending", time: order.createdAt });
    if (order?.assignedAt) entries.push({ status: "Assigned to Agent", time: order.assignedAt });
    if (order?.pickedUpAt) entries.push({ status: "Picked Up", time: order.pickedUpAt });
    if (order?.inTransitAt) entries.push({ status: "In Transit", time: order.inTransitAt });
    if (order?.outForDeliveryAt) entries.push({ status: "Out for Delivery", time: order.outForDeliveryAt });
    if (order?.deliveredAt) entries.push({ status: "Delivered", time: order.deliveredAt });
    if (order?.cancelledAt) entries.push({ status: "Cancelled", time: order.cancelledAt });
    return entries;
  };

  const timeline = buildTimeline();
  const hasAnyDeliveryData = rider || order?.pickedUpAt || order?.deliveredAt || order?.assignedAt
    || order?.pickupProof || order?.deliveryProof || timeline.length > 0;

  if (!hasAnyDeliveryData) return null;

  const infoRows = [
    { label: "Agent Name", value: rider?.fullName, icon: "👤" },
    { label: "Contact Number", value: rider?.phone, icon: "📞" },
    { label: "Vehicle Type", value: rider?.vehicleType, icon: "🚗" },
    { label: "Assignment Date", value: fmtDT(order?.assignedAt), icon: "📅" },
    { label: "Pickup Date & Time", value: fmtDT(order?.pickedUpAt), icon: "📦" },
    { label: "In Transit At", value: fmtDT(order?.inTransitAt), icon: "🚚" },
    { label: "Out for Delivery At", value: fmtDT(order?.outForDeliveryAt), icon: "🛵" },
    { label: "Delivered At", value: fmtDT(order?.deliveredAt), icon: "✅" },
    { label: "Current Status", value: order?.status, icon: "🔖", isBadge: true },
  ].filter(r => r.value && r.value !== "—");

  return (
    <div style={{
      background: "#fff", borderRadius: 10, padding: "18px 20px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#16a34a,#15803d)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
        }}>🚚</div>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#111827" }}>Delivery History</h3>
      </div>

      {/* Agent + Timestamps Info Grid */}
      {infoRows.length > 0 && (
        <div style={{
          background: "#f9fafb", borderRadius: 8, padding: "12px 14px", marginBottom: 16,
          border: "1px solid #f3f4f6",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
            {infoRows.map((r, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "6px 0",
                borderBottom: i < infoRows.length - 1 ? "1px solid #e5e7eb" : "none",
                gridColumn: r.label === "Agent Name" ? "1 / -1" : "auto",
              }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{r.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{r.label}</p>
                  {r.isBadge
                    ? <div style={{ marginTop: 2 }}><Badge label={r.value} /></div>
                    : <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111827", marginTop: 1 }}>{r.value}</p>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Notes */}
      {(order?.deliveryNotes || order?.deliveryNote || order?.driverNote) && (
        <div style={{
          background: "#fffbeb", borderRadius: 8, padding: "10px 12px",
          border: "1px solid #fde68a", marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 700, color: "#92400e" }}>📝 Delivery Notes</p>
          <p style={{ margin: 0, fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>
            {order.deliveryNotes || order.deliveryNote || order.driverNote}
          </p>
        </div>
      )}

      {/* Proof Photos */}
      {(order?.pickupProof || order?.deliveryProof) && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#374151" }}>📸 Proof Photos</p>
          <div style={{ display: "flex", gap: 12 }}>
            <ProofImage src={order.pickupProof} label="Pickup Proof" />
            <ProofImage src={order.deliveryProof} label="Delivery Proof" />
          </div>
        </div>
      )}

      {/* Delivery Timeline */}
      {timeline.length > 0 && (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#374151" }}>📋 Delivery Timeline</p>
          <div style={{ position: "relative", paddingLeft: 20 }}>
            {/* Vertical line */}
            <div style={{
              position: "absolute", left: 6, top: 8, bottom: 8,
              width: 2, background: "#e5e7eb", borderRadius: 2,
            }} />
            {timeline.map((entry, i) => (
              <div key={i} style={{
                position: "relative", marginBottom: i < timeline.length - 1 ? 12 : 0,
              }}>
                {/* Dot */}
                <div style={{
                  position: "absolute", left: -14, top: 4,
                  width: 10, height: 10, borderRadius: "50%",
                  background: timelineDotColor(entry.status),
                  border: "2px solid #fff",
                  boxShadow: `0 0 0 2px ${timelineDotColor(entry.status)}33`,
                }} />
                <div style={{ paddingLeft: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Badge label={entry.status} />
                    {entry.time && entry.time !== "—" && (
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>{fmtDT(entry.time)}</span>
                    )}
                  </div>
                  {entry.note && (
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "#6b7280", fontStyle: "italic" }}>
                      {entry.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Driver Row ───────────────────────────────────────────────────────────────
function DriverRow({ driver, selected, onSelect }) {
  const isSelected = selected === driver._id;
  return (
    <div
      onClick={() => onSelect(driver._id)}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
        borderRadius: 6, cursor: "pointer", marginBottom: 2,
        background: isSelected ? "#f0fdf4" : "transparent",
        border: `1px solid ${isSelected ? "#86efac" : "transparent"}`,
        transition: "all 0.15s",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        {driver.profileImage
          ? <img src={driver.profileImage} alt={driver.fullName}
            style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
          : (
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: driver.isOnline ? "#dcfce7" : "#f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800,
              color: driver.isOnline ? "#16a34a" : "#6b7280",
            }}>
              {driver.fullName?.charAt(0).toUpperCase()}
            </div>
          )
        }
        <span style={{
          position: "absolute", bottom: 0, right: 0,
          width: 8, height: 8, borderRadius: "50%",
          background: driver.isOnline ? "#22c55e" : "#d1d5db",
          border: "1.5px solid #fff",
        }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 700, color: "#1a2332",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>
          {driver.fullName}
        </p>
        <p style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}>
          {driver.vehicleType} · {driver.phone}
        </p>
      </div>
      <div style={{ flexShrink: 0, textAlign: "right" }}>
        <p style={{ margin: 0, fontSize: 11, color: "#d97706", fontWeight: 700 }}>
          ★ {driver.rating?.toFixed(1) || "5.0"}
        </p>
        <p style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}>
          {driver.totalOrdersDelivered || 0} orders
        </p>
      </div>
      {isSelected && <span style={{ color: "#16a34a", fontSize: 15, flexShrink: 0 }}>✓</span>}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function OrderDetailModal({ order: initialOrder, onClose, onStatusUpdate }) {
  const [order, setOrder] = useState(initialOrder);
  const [fetching, setFetching] = useState(true);

  const [newStatus, setNewStatus] = useState(initialOrder?.status || "");
  const [payStatus, setPayStatus] = useState(initialOrder?.paymentStatus || "");
  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [drivers, setDrivers] = useState([]);
  const [selectedRider, setSelectedRider] = useState(initialOrder?.assignedRider?._id || "");
  const [assigning, setAssigning] = useState(false);
  const [riderMsg, setRiderMsg] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);


  useEffect(() => {
    if (!initialOrder?._id) return;
    setFetching(true);
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders/admin/${initialOrder._id}`, { headers: authHdr() });
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
          setNewStatus(data.order.status);
          setPayStatus(data.order.paymentStatus);
          setSelectedRider(data.order.assignedRider?._id || "");
        }
      } catch { }
      finally { setFetching(false); }
    })();
  }, [initialOrder?._id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/driver/all`, { headers: authHdr() });
        const data = await res.json();
        if (data.success) setDrivers(data.drivers || []);
      } catch { }
    })();
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const handleDownloadInvoice = async () => {
    setInvoiceLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/invoice/${order._id}/invoice?download=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${order.orderNumber || order._id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download invoice. Please try again.");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    setReceiptLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/receipt/${order._id}/receipt?download=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receipt-${order.orderNumber || order._id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch { alert("Failed to download receipt"); }
    finally { setReceiptLoading(false); }
  };
  const handleStatusUpdate = async () => {
    setUpdating(true); setStatusMsg("");
    try {
      const res = await fetch(`${API_URL}/api/orders/admin/${order._id}/status`, {
        method: "PATCH", headers: authHdr(),
        body: JSON.stringify({ status: newStatus, paymentStatus: payStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(prev => ({ ...prev, status: newStatus, paymentStatus: payStatus }));
        setStatusMsg("success");
        onStatusUpdate && onStatusUpdate(order._id, newStatus);
      } else { setStatusMsg("error:" + (data.message || "Update failed.")); }
    } catch { setStatusMsg("error:Network error."); }
    finally { setUpdating(false); }
  };

  const handleAssignRider = async () => {
    if (!selectedRider) return;
    setAssigning(true); setRiderMsg("");
    try {
      const res = await fetch(`${API_URL}/api/orders/admin/${order._id}/assign-rider`, {
        method: "PATCH", headers: authHdr(),
        body: JSON.stringify({ driverId: selectedRider }),
      });
      const data = await res.json();
      if (data.success) {
        const driver = drivers.find(d => d._id === selectedRider);
        setOrder(prev => ({ ...prev, assignedRider: driver }));
        setRiderMsg("success");
      } else { setRiderMsg("error:" + (data.message || "Failed.")); }
    } catch { setRiderMsg("error:Network error."); }
    finally { setAssigning(false); }
  };

  const showRider =
    ["Processing", "Shipped"].includes(newStatus) ||
    ["Processing", "Shipped"].includes(order?.status);

  const onlineDrivers = drivers.filter(d => d.isOnline && d.isActive);
  const offlineDrivers = drivers.filter(d => !d.isOnline && d.isActive);
  const addr = order?.shippingAddress || {};

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.97) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .odm-btn:hover:not(:disabled) { opacity: 0.85; }
        .odm-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 10px center; padding-right: 32px !important;
        }
      `}</style>

      <div
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
        }}
      >
        <div style={{
          background: "#f3f4f6", borderRadius: 14, width: "100%", maxWidth: 1040,
          maxHeight: "93vh", overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)", animation: "modalIn 0.2s ease",
        }}>
          <div style={{ padding: 18 }}>

            {/* Top Action Bar */}
            <div style={{
              background: "#fff", borderRadius: 10, padding: "13px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#111827" }}>Order Details</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="odm-btn" style={{ padding: "7px 13px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  📎 Attach Product Barcode
                </button>


                <button onClick={handleDownloadReceipt} disabled={receiptLoading} className="odm-btn"
                  style={{
                    padding: "7px 13px", background: receiptLoading ? "#1e40af" : "#1d4ed8",
                    color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700,
                    cursor: receiptLoading ? "not-allowed" : "pointer", opacity: receiptLoading ? 0.75 : 1
                  }}>
                  {receiptLoading ? "Generating…" : "🧾 Download Receipt"}
                </button>

                <button
                  onClick={handleDownloadInvoice}
                  disabled={invoiceLoading}
                  className="odm-btn"
                  style={{
                    padding: "7px 13px",
                    background: invoiceLoading ? "#166534" : "#15803d",
                    color: "#fff",
                    border: "none",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: invoiceLoading ? "not-allowed" : "pointer",
                    opacity: invoiceLoading ? 0.75 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "opacity 0.2s",
                  }}
                >
                  {invoiceLoading ? (
                    <>
                      <div style={{
                        width: 11, height: 11,
                        border: "2px solid rgba(255,255,255,0.35)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        flexShrink: 0,
                      }} />
                      Downloading…
                    </>
                  ) : (
                    <>⬇ Download Invoice</>
                  )}
                </button>
                <button onClick={onClose} style={{
                  marginLeft: 4, width: 32, height: 32, borderRadius: "50%",
                  background: "#f3f4f6", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, color: "#6b7280", flexShrink: 0,
                }}>✕</button>
              </div>
            </div>

            {/* Two-column grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 310px", gap: 14, alignItems: "start" }}>

              {/* ════ LEFT COLUMN ════ */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Order Info Card */}
                <div style={{ background: "#fff", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
                  {fetching && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 11, color: "#9ca3af" }}>
                      <div style={{ width: 12, height: 12, border: "2px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                      Loading full details…
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", marginBottom: 18 }}>
                    <div style={{ paddingRight: 20 }}>
                      {[
                        { label: "Order Id:", value: order?.orderNumber },
                        { label: "Payment Status:", value: order?.paymentStatus },
                        { label: "Payment Method:", value: order?.paymentMethod },
                      ].map((r, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, borderBottom: i < 2 ? "1px solid #f9fafb" : "none" }}>
                          <span style={{ color: "#6b7280" }}>{r.label}</span>
                          <span style={{ fontWeight: 700, color: "#111827" }}>{r.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "#e5e7eb" }} />
                    <div style={{ paddingLeft: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: 13, borderBottom: "1px solid #f9fafb" }}>
                        <span style={{ color: "#6b7280" }}>Order Status:</span>
                        <Badge label={order?.status || "—"} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, borderBottom: "1px solid #f9fafb" }}>
                        <span style={{ color: "#6b7280" }}>Order Date:</span>
                        <span style={{ fontWeight: 600, color: "#111827" }}>
                          {order?.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
                        <span style={{ color: "#6b7280" }}>Delivery Date:</span>
                        <span style={{ color: "#9ca3af" }}>
                          {order?.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                          {["SL", "Product", "Shop", "Quantity", "Unit", "Price", "Total"].map(h => (
                            <th key={h} style={{ padding: "9px 8px", fontSize: 12, fontWeight: 700, color: "#374151", textAlign: h === "SL" || h === "Product" ? "left" : "center" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {order?.items?.length
                          ? order.items.map((item, i) => (
                            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                              <td style={{ padding: "11px 8px", fontSize: 13, color: "#6b7280" }}>{i + 1}</td>
                              <td style={{ padding: "11px 8px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                  <div style={{ width: 36, height: 36, borderRadius: 6, overflow: "hidden", background: "#f3f4f6", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {item.image ? <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 16 }}>📦</span>}
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.name}</span>
                                </div>
                              </td>
                              <td style={{ padding: "11px 8px", fontSize: 13, color: "#374151", textAlign: "center" }}>{item.shop || order.shopName || "My Shop"}</td>
                              <td style={{ padding: "11px 8px", fontSize: 13, textAlign: "center", color: "#374151" }}>{item.quantity}</td>
                              <td style={{ padding: "11px 8px", fontSize: 13, textAlign: "center", color: "#374151" }}>{item.unit || "PCS"}</td>
                              <td style={{ padding: "11px 8px", fontSize: 13, textAlign: "center", color: "#374151" }}>₹{item.price?.toFixed(2)}</td>
                              <td style={{ padding: "11px 8px", fontSize: 13, textAlign: "center", fontWeight: 700, color: "#111827" }}>₹{item.total?.toFixed(2)}</td>
                            </tr>
                          ))
                          : (
                            <tr>
                              <td colSpan={7} style={{ padding: "20px 0", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
                                {fetching ? (
                                  <div style={{ display: "flex", justifyContent: "center", gap: 6, alignItems: "center" }}>
                                    <div style={{ width: 14, height: 14, border: "2px solid #e5e7eb", borderTopColor: "#16a34a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    Loading items…
                                  </div>
                                ) : "No items found"}
                              </td>
                            </tr>
                          )
                        }
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Summary */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                    <div style={{ minWidth: 260 }}>
                      {[
                        { label: "Sub Total", value: `₹${(order?.subtotal ?? 0).toFixed(2)}` },
                        { label: "Coupon Discount", value: `-₹${(order?.couponDiscount ?? 0).toFixed(2)}` },
                        { label: "Delivery Charge", value: (!order?.shippingCharge) ? "₹0" : `₹${order.shippingCharge.toFixed(2)}` },
                        { label: "VAT & Tax", value: `₹${(order?.tax ?? 0).toFixed(2)}` },
                      ].map((row, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f3f4f6", fontSize: 13, color: "#6b7280" }}>
                          <span>{row.label}</span>
                          <span style={{ fontWeight: 500, color: "#374151" }}>{row.value}</span>
                        </div>
                      ))}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", fontSize: 15, fontWeight: 800, color: "#111827" }}>
                        <span>Grand Total</span>
                        <span>₹{(order?.total ?? 0).toFixed(2)}</span>
                      </div>
                      {order?.razorpayOrderId && (
                        <p style={{ margin: "5px 0 0", fontSize: 11, color: "#9ca3af", wordBreak: "break-all" }}>
                          Razorpay: {order.razorpayOrderId}{order.razorpayPaymentId && ` / ${order.razorpayPaymentId}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#111827" }}>Customer Info</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {[
                      { label: "Name:", value: order?.user?.fullName || addr.name || "—" },
                      { label: "Phone:", value: order?.user?.phone || addr.phone || "—" },
                      { label: "Email:", value: order?.user?.email || "—" },
                    ].map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, fontSize: 13, alignItems: "center" }}>
                        <span style={{ color: "#6b7280", minWidth: 46 }}>{r.label}</span>
                        <span style={{ fontWeight: 600, color: "#111827" }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Note */}
                {order?.note && (
                  <div style={{ background: "#fffbeb", borderRadius: 10, padding: "12px 16px", border: "1px solid #fde68a" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#92400e" }}>Note from customer</p>
                    <p style={{ margin: 0, fontSize: 13, color: "#78350f", lineHeight: 1.5 }}>{order.note}</p>
                  </div>
                )}

                {/* ── DELIVERY HISTORY SECTION ── */}
                <DeliveryHistorySection order={order} />

              </div>{/* end LEFT */}

              {/* ════ RIGHT COLUMN ════ */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Order & Shipping Info */}
                <div style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
                  <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: "#111827" }}>Order &amp; Shipping Info</h3>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>Change Order Status</span>
                    <select
                      value={newStatus}
                      onChange={e => { setNewStatus(e.target.value); setStatusMsg(""); }}
                      className="odm-select"
                      style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, color: "#111827", background: "#fff", cursor: "pointer", fontFamily: "inherit", minWidth: 120 }}
                    >
                      {DELIVERY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>Payment Status</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "#374151" }}>{payStatus}</span>
                      <div
                        onClick={() => { setPayStatus(p => p === "Paid" ? "Pending" : "Paid"); setStatusMsg(""); }}
                        style={{ width: 38, height: 20, borderRadius: 10, cursor: "pointer", background: payStatus === "Paid" ? "#16a34a" : "#d1d5db", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
                      >
                        <div style={{ position: "absolute", top: 2, width: 16, height: 16, left: payStatus === "Paid" ? 20 : 2, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                      </div>
                    </div>
                  </div>

                  {statusMsg === "success" && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#16a34a" }}>✓ Status updated successfully.</p>}
                  {statusMsg.startsWith?.("error:") && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#ef4444" }}>✗ {statusMsg.slice(6)}</p>}

                  <button className="odm-btn" onClick={handleStatusUpdate} disabled={updating} style={{
                    width: "100%", padding: "9px 0", background: "#16a34a", color: "#fff",
                    border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                    cursor: updating ? "not-allowed" : "pointer", fontFamily: "inherit",
                    opacity: updating ? 0.65 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {updating
                      ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Updating…</>
                      : "Confirm Status"
                    }
                  </button>
                </div>

                {/* Shipping Address */}
                <div style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#111827" }}>Shipping Address</h3>
                  {[
                    { label: "Name:", value: addr.name || "—" },
                    { label: "Phone:", value: addr.phone || "—" },
                    { label: "Address Type:", value: addr.type || addr.addressType || "—" },
                    { label: "Area:", value: addr.area || "—" },
                    { label: "Road No:", value: [addr.road && `Road: ${addr.road}`, addr.flat && `Flat: ${addr.flat}`, addr.house && `House: ${addr.house}`].filter(Boolean).join(", ") || "—" },
                    { label: "Post Code:", value: addr.pincode || addr.postCode || "—" },
                    { label: "Address Line:", value: addr.landmark || addr.addressLine || "—" },
                    { label: "Address Line 2:", value: addr.addressLine2 || "—" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: "1px solid #f9fafb", fontSize: 13, gap: 8 }}>
                      <span style={{ color: "#6b7280", flexShrink: 0 }}>{r.label}</span>
                      <span style={{ fontWeight: 500, color: "#111827", textAlign: "right", wordBreak: "break-word" }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Assign Rider Panel */}
                {showRider && (
                  <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1.5px solid #86efac" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#166534" }}>Assign Delivery Rider</h3>

                    {order?.assignedRider && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "#dcfce7", borderRadius: 8, border: "1px solid #86efac", marginBottom: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                          {order.assignedRider.fullName?.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#166534" }}>{order.assignedRider.fullName}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "#16a34a" }}>Currently assigned rider</p>
                        </div>
                        <span style={{ fontSize: 16, color: "#16a34a" }}>✓</span>
                      </div>
                    )}

                    <div style={{ maxHeight: 190, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 8, padding: 4, background: "#fff", marginBottom: 10 }}>
                      {onlineDrivers.length > 0 && <p style={{ margin: "4px 8px 2px", fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>🟢 Online ({onlineDrivers.length})</p>}
                      {onlineDrivers.map(d => <DriverRow key={d._id} driver={d} selected={selectedRider} onSelect={setSelectedRider} />)}
                      {offlineDrivers.length > 0 && <p style={{ margin: "6px 8px 2px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>⚫ Offline ({offlineDrivers.length})</p>}
                      {offlineDrivers.map(d => <DriverRow key={d._id} driver={d} selected={selectedRider} onSelect={setSelectedRider} />)}
                      {drivers.length === 0 && <p style={{ margin: 0, padding: "14px 0", textAlign: "center", fontSize: 13, color: "#9ca3af" }}>No drivers available</p>}
                    </div>

                    {riderMsg === "success" && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#16a34a" }}>✓ Rider assigned successfully.</p>}
                    {riderMsg.startsWith?.("error:") && <p style={{ margin: "0 0 8px", fontSize: 12, color: "#ef4444" }}>✗ {riderMsg.slice(6)}</p>}

                    <button className="odm-btn" onClick={handleAssignRider} disabled={!selectedRider || assigning} style={{
                      width: "100%", padding: "9px 0",
                      background: selectedRider ? "#16a34a" : "#e5e7eb",
                      color: selectedRider ? "#fff" : "#9ca3af",
                      border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
                      cursor: selectedRider && !assigning ? "pointer" : "not-allowed",
                      fontFamily: "inherit", opacity: assigning ? 0.65 : 1,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      {assigning
                        ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Assigning…</>
                        : "Confirm Assign Rider"
                      }
                    </button>
                  </div>
                )}

              </div>{/* end RIGHT */}
            </div>{/* end grid */}
          </div>
        </div>
      </div>
    </>
  );
}