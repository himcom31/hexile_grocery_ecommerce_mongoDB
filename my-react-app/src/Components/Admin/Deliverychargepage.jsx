import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000/api/delivery";

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

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ toasts, remove }) => (
  <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
    {toasts.map((t) => (
      <div
        key={t.id}
        onClick={() => remove(t.id)}
        className={`cursor-pointer px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all
          ${t.type === "error"
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-green-50 border border-green-200 text-green-700"
          }`}
        style={{ minWidth: 240, animation: "slideIn .25s ease" }}
      >
        {t.msg}
      </div>
    ))}
  </div>
);

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
const Confirm = ({ msg, onConfirm, onCancel, loading }) => (
  <div
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    onClick={(e) => e.target === e.currentTarget && onCancel()}
  >
    <div className="bg-white rounded-xl shadow-2xl p-7 w-80">
      <p className="text-slate-700 text-sm mb-5">{msg}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition"
        >
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  </div>
);

// ── Form Card (Add / Edit inline) ──────────────────────────────────────────────
const DeliveryForm = ({ initial, onSubmit, loading, onCancel }) => {
  const [minOrderQty, setMin]    = useState(initial?.minOrderQty ?? "");
  const [maxOrderQty, setMax]    = useState(initial?.maxOrderQty ?? "");
  const [charge,      setCharge] = useState(initial?.charge      ?? "");
  const [err,         setErr]    = useState("");

  const handle = (e) => {
    e.preventDefault();
    setErr("");
    if (Number(minOrderQty) >= Number(maxOrderQty)) {
      setErr("Max. Order QTY must be greater than Min. Order QTY");
      return;
    }
    onSubmit({ minOrderQty: Number(minOrderQty), maxOrderQty: Number(maxOrderQty), charge: Number(charge) });
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-5 flex items-center gap-2">
        <span className="text-base">🖼</span>
        {initial ? "Edit Delivery Charge" : "Add New Delivery Charge"}
      </h2>

      {err && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{err}</p>
      )}

      <form onSubmit={handle}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Min QTY */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Minimum Order Quantity <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="number"
              min={0}
              placeholder="Enter Minimum Order Quantity"
              value={minOrderQty}
              onChange={(e) => setMin(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>

          {/* Max QTY */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Maximum Order Quantity <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="number"
              min={0}
              placeholder="Enter Maximum Order Quantity"
              value={maxOrderQty}
              onChange={(e) => setMax(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Charge */}
        <div className="mb-6 md:w-1/2">
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            Delivery Charge <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="number"
            min={0}
            step="0.01"
            placeholder="Enter Delivery Charge"
            value={charge}
            onChange={(e) => setCharge(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition"
          />
        </div>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-medium bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-60 transition shadow-sm"
          >
            {loading ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function DeliveryChargePage() {
  const [charges,       setCharges]       = useState([]);
  const [fetching,      setFetching]      = useState(true);
  const [showForm,      setShowForm]      = useState(false);   // "add" form visibility
  const [editRow,       setEditRow]       = useState(null);    // row being edited
  const [formLoading,   setFormLoading]   = useState(false);
  const [confirmDel,    setConfirmDel]    = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toasts,        setToasts]        = useState([]);

  const addToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  // fetch
  const fetchCharges = useCallback(async () => {
    setFetching(true);
    try {
      const data = await apiFetch("/all");
      setCharges(data.charges || []);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setFetching(false);
    }
  }, [addToast]);

  useEffect(() => { fetchCharges(); }, [fetchCharges]);

  // add
  const handleAdd = async (payload) => {
    setFormLoading(true);
    try {
      await apiFetch("/add", { method: "POST", body: JSON.stringify(payload) });
      addToast("Delivery charge added successfully");
      setShowForm(false);
      fetchCharges();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setFormLoading(false);
    }
  };

  // update
  const handleUpdate = async (payload) => {
    setFormLoading(true);
    try {
      await apiFetch(`/update/${editRow._id}`, { method: "PUT", body: JSON.stringify(payload) });
      addToast("Delivery charge updated successfully");
      setEditRow(null);
      fetchCharges();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setFormLoading(false);
    }
  };

  // delete
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiFetch(`/delete/${confirmDel._id}`, { method: "DELETE" });
      addToast("Delivery charge deleted successfully");
      setConfirmDel(null);
      fetchCharges();
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8 font-sans">
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      <Toast toasts={toasts} remove={removeToast} />

      {confirmDel && (
        <Confirm
          msg={`Delete this delivery charge (Min: ${confirmDel.minOrderQty} / Max: ${confirmDel.maxOrderQty})? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDel(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── Add Form ── */}
      {showForm && (
        <DeliveryForm
          onSubmit={handleAdd}
          loading={formLoading}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ── Edit Form ── */}
      {editRow && (
        <DeliveryForm
          initial={editRow}
          onSubmit={handleUpdate}
          loading={formLoading}
          onCancel={() => setEditRow(null)}
        />
      )}

      {/* ── Table Card ── */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h1 className="text-xl font-bold text-slate-800">Manage Delivery Charge</h1>
          {!showForm && !editRow && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg shadow-sm transition"
            >
              <span className="text-lg leading-none">+</span> Create New
            </button>
          )}
        </div>

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["SL", "Min. Order QTY", "Max. Order QTY", "Charge", "Action"].map((h) => (
                  <th
                    key={h}
                    className={`px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-gray-100
                      ${h === "Action" || h === "Charge" ? "text-center" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                    Loading…
                  </td>
                </tr>
              ) : charges.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                    No delivery charges found. Click <strong>Create New</strong> to add one.
                  </td>
                </tr>
              ) : (
                charges.map((row, i) => (
                  <tr key={row._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-slate-600">{i + 1}.</td>
                    <td className="px-6 py-4 text-slate-700 font-medium text-center">{row.minOrderQty}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium text-center">{row.maxOrderQty}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium text-center">${row.charge}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* Edit */}
                        <button
                          onClick={() => { setEditRow(row); setShowForm(false); }}
                          title="Edit"
                          className="text-blue-500 hover:text-blue-700 transition p-1 rounded"
                        >
                          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setConfirmDel(row)}
                          title="Delete"
                          className="text-red-400 hover:text-red-600 transition p-1 rounded"
                        >
                          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
  );
}