import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:5000/api/products";

// ---------- helpers ----------
const getToken = () => localStorage.getItem("adminToken") || "";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ---------- tiny components ----------
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-emerald-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-400"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// ---------- Modal ----------
function Modal({ open, onClose, title, children }) {
  const overlayRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      {/* panel */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-[modalIn_0.2s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- BrandForm ----------
function BrandForm({ initial, onSubmit, loading }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(initial?.logo || null);
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", name);
    fd.append("description", description);
    fd.append("isActive", isActive);
    if (logo) fd.append("logo", logo);
    onSubmit(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Logo upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Logo</label>
        <div
          onClick={() => fileRef.current.click()}
          className="group relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-all duration-200 overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="preview" className="h-full w-full object-contain p-3" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-emerald-500 transition-colors">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Click to upload logo</span>
              <span className="text-xs">PNG, JPG, WEBP up to 5MB</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        {preview && (
          <button
            type="button"
            onClick={() => { setLogo(null); setPreview(null); }}
            className="mt-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Remove image
          </button>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand Name <span className="text-red-400">*</span></label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Nike, Apple, Sony…"
          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-gray-400 transition"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Short description about the brand…"
          className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-gray-400 transition resize-none"
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-700">Active Status</p>
          <p className="text-xs text-gray-400 mt-0.5">Enable to make this brand visible</p>
        </div>
        <Toggle checked={isActive} onChange={setIsActive} />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold text-sm py-3 rounded-xl transition-colors duration-200 shadow-sm shadow-emerald-200"
      >
        {loading && <Spinner />}
        {loading ? "Saving…" : initial ? "Update Brand" : "Create Brand"}
      </button>
    </form>
  );
}

// ---------- DeleteConfirm ----------
function DeleteConfirm({ brand, onConfirm, onCancel, loading }) {
  return (
    <div className="text-center space-y-4">
      <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-red-50">
        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>
      <div>
        <p className="text-base font-bold text-gray-800">Delete "{brand.name}"?</p>
        <p className="text-sm text-gray-500 mt-1">This action cannot be undone. The brand will be permanently removed.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Spinner />}
          {loading ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

// ---------- Main Page ----------
export default function BrandPage() {
  const [brands, setBrands] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [deleteBrand, setDeleteBrand] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchBrands() {
    setLoadingList(true);
    setError("");
    try {
      const data = await apiFetch("/brand/all");
      setBrands(data.brands || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => { fetchBrands(); }, []);

  async function handleAdd(fd) {
    setSubmitting(true);
    try {
      await apiFetch("/brand/add", { method: "POST", body: fd });
      showToast("Brand created successfully!");
      setAddOpen(false);
      fetchBrands();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(fd) {
    setSubmitting(true);
    try {
      await apiFetch(`/update/${editBrand._id}`, { method: "PUT", body: fd });
      showToast("Brand updated successfully!");
      setEditBrand(null);
      fetchBrands();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await apiFetch(`/delete/${deleteBrand._id}`, { method: "DELETE" });
      showToast("Brand deleted successfully!");
      setDeleteBrand(null);
      fetchBrands();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(brand) {
    try {
      const fd = new FormData();
      fd.append("name", brand.name);
      fd.append("description", brand.description || "");
      fd.append("isActive", !brand.isActive);
      await apiFetch(`/update/${brand._id}`, { method: "PUT", body: fd });
      showToast(`Brand ${!brand.isActive ? "activated" : "deactivated"}`);
      fetchBrands();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  const filtered = brands.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterActive === "all" ||
      (filterActive === "active" && b.isActive) ||
      (filterActive === "inactive" && !b.isActive);
    return matchSearch && matchStatus;
  });

  const activeCnt = brands.filter((b) => b.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50 font-[Outfit,sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .row-in { animation: fadeUp 0.18s ease-out both; }
      `}</style>

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">Brand Management</h1>
              <p className="text-xs text-gray-400 leading-tight">{brands.length} brands · {activeCnt} active</p>
            </div>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-emerald-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create New
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Brands", value: brands.length, icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z", color: "text-blue-500 bg-blue-50" },
            { label: "Active", value: activeCnt, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-emerald-500 bg-emerald-50" },
            { label: "Inactive", value: brands.length - activeCnt, icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-orange-500 bg-orange-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* toolbar */}
          <div className="px-5 py-4 border-b border-gray-50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <p className="text-sm font-bold text-gray-700 mr-auto">Brands</p>
            {/* search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brands…"
                className="pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent w-48 placeholder-gray-400 transition"
              />
            </div>
            {/* filter */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 text-xs font-semibold">
              {["all", "active", "inactive"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterActive(f)}
                  className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                    filterActive === f ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-14">SL</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Logo</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loadingList ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <svg className="animate-spin w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span className="text-sm">Loading brands…</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <p className="text-sm text-red-500 font-medium">{error}</p>
                        <button onClick={fetchBrands} className="text-xs text-emerald-600 hover:underline font-semibold">Retry</button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium">No brands found</p>
                        <button
                          onClick={() => setAddOpen(true)}
                          className="text-xs text-emerald-600 hover:underline font-semibold"
                        >
                          Create your first brand
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((brand, i) => (
                    <tr
                      key={brand._id}
                      className="row-in hover:bg-gray-50/60 transition-colors group"
                      style={{ animationDelay: `${i * 35}ms` }}
                    >
                      <td className="px-5 py-3.5 text-gray-400 font-semibold text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-800">{brand.name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {brand.logo ? (
                          <div className="h-10 w-10 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden shadow-sm">
                            <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain p-1" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-xl border border-gray-100 bg-gray-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-gray-500 text-xs line-clamp-1 max-w-xs">
                          {brand.description || <span className="italic text-gray-300">No description</span>}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={brand.isActive}
                            onChange={() => handleToggleStatus(brand)}
                          />
                          <StatusBadge active={brand.isActive} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditBrand(brand)}
                            title="Edit"
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteBrand(brand)}
                            title="Delete"
                            className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
                <span className="font-semibold text-gray-600">{brands.length}</span> brands
              </p>
            </div>
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create New Brand">
        <BrandForm onSubmit={handleAdd} loading={submitting} />
      </Modal>

      <Modal open={!!editBrand} onClose={() => setEditBrand(null)} title="Edit Brand">
        {editBrand && (
          <BrandForm initial={editBrand} onSubmit={handleUpdate} loading={submitting} />
        )}
      </Modal>

      <Modal open={!!deleteBrand} onClose={() => setDeleteBrand(null)} title="Confirm Deletion">
        {deleteBrand && (
          <DeleteConfirm
            brand={deleteBrand}
            onConfirm={handleDelete}
            onCancel={() => setDeleteBrand(null)}
            loading={submitting}
          />
        )}
      </Modal>

      {/* ── Toast ── */}
      {toast && (
        <div
          style={{ animation: "toastIn 0.2s ease-out" }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${
            toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
          }`}
        >
          {toast.type === "error" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
}