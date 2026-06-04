import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api/support/admin/all";
const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const STATUS_COLORS = {
  Pending:   { bg: "#fef9c3", color: "#b45309", border: "#fde68a" },
  Confirm:   { bg: "#ede9fe", color: "#7c3aed", border: "#ddd6fe" },
  Completed: { bg: "#dcfce7", color: "#16a34a", border: "#bbf7d0" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_COLORS[status] || { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: 12, fontWeight: 700, padding: "3px 12px", borderRadius: 20,
      whiteSpace: "nowrap",
    }}>{status}</span>
  );
};

const ChevronRight = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f0f0f0", padding: "18px 22px", marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ height: 13, width: 100, background: "#f0f0f0", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ height: 13, width: 70, background: "#f0f0f0", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 22, width: 70, background: "#f0f0f0", borderRadius: 10, animation: "pulse 1.4s ease-in-out infinite" }} />
      </div>
    </div>
    <div style={{ display: "flex", gap: 40 }}>
      {[1,2,3].map(i => (
        <div key={i}>
          <div style={{ height: 10, width: 80, background: "#f0f0f0", borderRadius: 4, marginBottom: 6, animation: "pulse 1.4s ease-in-out infinite" }} />
          <div style={{ height: 14, width: 110, background: "#f0f0f0", borderRadius: 4, animation: "pulse 1.4s ease-in-out infinite" }} />
        </div>
      ))}
    </div>
  </div>
);

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
const FilterDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const options = ["All", "Pending", "Confirm", "Completed"];
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "9px 16px", background: "#4b5563", color: "#fff",
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        {value}
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100,
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", minWidth: 140,
        }}>
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                display: "block", width: "100%", padding: "10px 16px",
                background: value === opt ? "#f0fdf4" : "#fff",
                color: value === opt ? "#16a34a" : "#374151",
                border: "none", fontSize: 13, fontWeight: value === opt ? 700 : 400,
                cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (value !== opt) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={e => { if (value !== opt) e.currentTarget.style.background = "#fff"; }}
            >{opt}</button>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function AllHelpRequests() {
  const navigate = useNavigate();
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("All");

  const load = async (status = "All") => {
    setLoading(true);
    try {
      const url = status === "All" ? API : `${API}?status=${status}`;
      const res  = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setTickets(data.tickets);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(filter); }, [filter]);

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ padding: "28px 32px", minHeight: "100vh", background: "#f3f4f6", fontFamily: "'Nunito','Inter',sans-serif" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0 }}>All Help Requests</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Short By:</span>
            <FilterDropdown value={filter} onChange={setFilter} />
          </div>
        </div>

        {/* Outer card */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: "20px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>

          {loading
            ? [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
            : tickets.length === 0
              ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎫</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>No help requests found</div>
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
                  onClick={() => navigate(`/admin/support-tickets/${ticket._id}`)}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: "#6b7280" }}>{formatDate(ticket.createdAt)}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1" }}>#{ticket.ticketNumber}</span>
                      <StatusBadge status={ticket.status} />
                      {/* Arrow button */}
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", border: "1px solid #e5e7eb",
                        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      }}>
                        <ChevronRight />
                      </div>
                    </div>
                  </div>

                  {/* Info row */}
                  <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
                    <div style={{ flex: "0 0 33%", minWidth: 160 }}>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Order Number</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{ticket.orderNumber || "—"}</div>
                    </div>
                    <div style={{ flex: "0 0 33%", minWidth: 160 }}>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Issue Type</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{ticket.issueTypeName || "—"}</div>
                    </div>
                    <div style={{ flex: "0 0 33%", minWidth: 160 }}>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>Subject</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>{ticket.subject}</div>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </>
  );
}