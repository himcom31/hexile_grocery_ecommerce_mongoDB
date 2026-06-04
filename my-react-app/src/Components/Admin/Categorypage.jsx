import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:5000";

function getToken() {
  return localStorage.getItem("adminToken") || "";
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

export default function CategoryPage() {
  const [activeTab, setActiveTab] = useState("view");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });
  const [editId, setEditId] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: "",
    description: "",
    isActive: "true",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/Category/all`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      } else {
        showToast(data.message || "Failed to load categories", "error");
      }
    } catch (err) {
      showToast("Cannot reach server. Is it running?", "error");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = "success") {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3500);
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setForm({ name: "", description: "", isActive: "true" });
    setUploadedFile(null);
    setUploadPreview(null);
    setEditId(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleEdit(cat) {
    setForm({
      name: cat.name,
      description: cat.description || "",
      isActive: cat.isActive ? "true" : "false",
    });
    setUploadPreview(cat.thumbnail || null);
    setUploadedFile(null);
    setEditId(cat._id);
    setActiveTab("add");
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      showToast("Category name is required", "error");
      return;
    }
    if (!editId && !uploadedFile) {
      showToast("Please upload a thumbnail image", "error");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("isActive", form.isActive);
      if (uploadedFile) formData.append("thumbnail", uploadedFile);

      const url = editId
        ? `${API_BASE}/api/Category/${editId}`
        : `${API_BASE}/api/Category/add`;
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        showToast(
          editId
            ? `"${form.name}" updated successfully!`
            : `"${form.name}" created successfully!`
        );
        resetForm();
        await fetchCategories();
        setActiveTab("view");
      } else {
        showToast(data.message || "Something went wrong", "error");
      }
    } catch (err) {
      showToast("Network error. Check your server.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/Category/${cat._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`"${cat.name}" deleted`);
        setCategories((prev) => prev.filter((c) => c._id !== cat._id));
      } else {
        showToast(data.message || "Delete failed", "error");
      }
    } catch {
      showToast("Network error during delete", "error");
    }
  }

  async function handleToggleStatus(cat) {
    try {
      const formData = new FormData();
      formData.append("name", cat.name);
      formData.append("isActive", !cat.isActive);
      formData.append("description", cat.description || "");

      const res = await fetch(`${API_BASE}/api/Category/${cat._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((c) =>
            c._id === cat._id ? { ...c, isActive: !cat.isActive } : c
          )
        );
        showToast(`"${cat.name}" marked as ${!cat.isActive ? "active" : "inactive"}`);
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  }

  const filtered = categories.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
        ? c.isActive
        : !c.isActive;
    return matchSearch && matchStatus;
  });

  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.isActive).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.topbar}>
        <div>
          <h1 style={styles.pageTitle}>Category Management</h1>
          <p style={styles.pageSub}>Manage your product categories</p>
        </div>
        <button
          style={styles.btnPrimary}
          onClick={() => { resetForm(); setActiveTab("add"); }}
        >
          <span style={{ fontSize: 18 }}>＋</span> Add Category
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        {[
          { label: "Total Categories", value: totalCount, badge: "all time", badgeType: "gray" },
          { label: "Active", value: activeCount, badge: "✓ live on store", badgeType: "green" },
          { label: "Inactive", value: inactiveCount, badge: "hidden", badgeType: "gray" },
        ].map((s) => (
          <div key={s.label} style={styles.statCard}>
            <div style={styles.statLabel}>{s.label}</div>
            <div style={styles.statValue}>{s.value}</div>
            <span style={s.badgeType === "green" ? styles.badgeGreen : styles.badgeGray}>
              {s.badge}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === "view" ? styles.tabActive : {}) }}
          onClick={() => { setActiveTab("view"); fetchCategories(); }}
        >
          ⊞ View Categories
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "add" ? styles.tabActive : {}) }}
          onClick={() => { resetForm(); setActiveTab("add"); }}
        >
          ＋ {editId ? "Edit Category" : "Add Category"}
        </button>
      </div>

      {/* View Tab */}
      {activeTab === "view" && (
        <div style={styles.panel}>
          <div style={styles.searchRow}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                style={styles.searchInput}
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              style={styles.filterSelect}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button style={styles.btnGhost} onClick={fetchCategories}>
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div style={styles.emptyState}>
              <div style={styles.spinner} />
              <p style={{ color: "#888", marginTop: 16 }}>Loading categories...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
              <p style={{ color: "#888" }}>No categories found</p>
              <button
                style={{ ...styles.btnPrimary, marginTop: 16 }}
                onClick={() => { resetForm(); setActiveTab("add"); }}
              >
                Add your first category
              </button>
            </div>
          ) : (
            <div style={styles.catGrid}>
              {filtered.map((cat) => (
                <CategoryCard
                  key={cat._id}
                  cat={cat}
                  onEdit={() => handleEdit(cat)}
                  onDelete={() => handleDelete(cat)}
                  onToggle={() => handleToggleStatus(cat)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Tab */}
      {activeTab === "add" && (
        <div style={styles.panel}>
          <div style={styles.panelTitle}>
            <span style={{ color: "#1a7a4a", fontSize: 20 }}>📁</span>
            {editId ? "Edit Category" : "New Category"}
          </div>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>
                Category name <span style={{ color: "#e24b4a" }}>*</span>
              </label>
              <input
                style={styles.formInput}
                placeholder="e.g. Fresh Vegetables"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Status</label>
              <select
                style={styles.formSelect}
                value={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
              <label style={styles.formLabel}>Description</label>
              <textarea
                style={{ ...styles.formInput, resize: "vertical", minHeight: 80 }}
                placeholder="Brief description of the category..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
              <label style={styles.formLabel}>
                Thumbnail image {!editId && <span style={{ color: "#e24b4a" }}>*</span>}
              </label>
              <div
                style={styles.uploadZone}
                onClick={() => fileRef.current?.click()}
              >
                {uploadPreview ? (
                  <div style={{ textAlign: "center" }}>
                    <img
                      src={uploadPreview}
                      alt="preview"
                      style={{ height: 80, borderRadius: 8, objectFit: "cover", marginBottom: 8 }}
                    />
                    <p style={{ fontSize: 13, color: "#0f6e56", fontWeight: 500 }}>
                      {uploadedFile ? uploadedFile.name : "Current thumbnail"}
                    </p>
                    <span style={{ fontSize: 12, color: "#888" }}>Click to replace</span>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>☁</div>
                    <p style={{ fontSize: 13, color: "#555" }}>Click to upload thumbnail</p>
                    <span style={{ fontSize: 12, color: "#999", marginTop: 4, display: "block" }}>
                      PNG, JPG, WEBP up to 5MB
                    </span>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </div>
          <div style={styles.formActions}>
            <button style={styles.btnGhost} onClick={resetForm}>
              Clear form
            </button>
            <button
              style={{ ...styles.btnPrimary, opacity: submitting ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Saving..." : editId ? "✓ Update category" : "✓ Save category"}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        style={{
          ...styles.toast,
          ...(toast.type === "error" ? styles.toastError : {}),
          transform: toast.show ? "translateY(0)" : "translateY(80px)",
          opacity: toast.show ? 1 : 0,
        }}
      >
        {toast.type === "error" ? "✗" : "✓"} {toast.msg}
      </div>
    </div>
  );
}

function CategoryCard({ cat, onEdit, onDelete, onToggle }) {
  return (
    <div style={styles.catCard}>
      <div style={styles.catThumb}>
        {cat.thumbnail ? (
          <img
            src={cat.thumbnail}
            alt={cat.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 40 }}>📦</span>
        )}
        <span
          style={{
            ...styles.statusDot,
            background: cat.isActive ? "#1a7a4a" : "#aaa",
          }}
        />
      </div>
      <div style={styles.catBody}>
        <div style={styles.catName}>{cat.name}</div>
        <div style={styles.catDesc}>{cat.description || "No description"}</div>
        <div style={styles.catFooter}>
          <span style={cat.isActive ? styles.badgeGreen : styles.badgeGray}>
            {cat.isActive ? "✓ Active" : "○ Inactive"}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={styles.iconBtn} onClick={onToggle} title="Toggle status">
              {cat.isActive ? "⏸" : "▶"}
            </button>
            <button style={styles.iconBtn} onClick={onEdit} title="Edit">
              ✎
            </button>
            <button
              style={{ ...styles.iconBtn, ...styles.iconBtnDanger }}
              onClick={onDelete}
              title="Delete"
            >
              🗑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "1.5rem",
    maxWidth: 1100,
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
    background: "#f5f6fa",
    minHeight: "100vh",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
  },
  pageTitle: { fontSize: 22, fontWeight: 600, color: "#1a1a1a", margin: 0 },
  pageSub: { fontSize: 13, color: "#888", marginTop: 2 },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#1a7a4a",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  btnGhost: {
    padding: "9px 16px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    background: "#fff",
    color: "#555",
    fontFamily: "inherit",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginBottom: "1.5rem",
  },
  statCard: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 12,
    padding: "1rem 1.25rem",
  },
  statLabel: { fontSize: 13, color: "#888", marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 600, color: "#1a1a1a" },
  badgeGreen: {
    display: "inline-block",
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 20,
    background: "#e1f5ee",
    color: "#0f6e56",
    fontWeight: 500,
    marginTop: 4,
  },
  badgeGray: {
    display: "inline-block",
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 20,
    background: "#f0f0f0",
    color: "#666",
    fontWeight: 500,
    marginTop: 4,
  },
  tabs: {
    display: "flex",
    gap: 0,
    marginBottom: "1.5rem",
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 10,
    padding: 4,
    width: "fit-content",
  },
  tab: {
    padding: "8px 22px",
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    background: "transparent",
    color: "#888",
  },
  tabActive: { background: "#1a7a4a", color: "#fff" },
  panel: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 14,
    padding: "1.5rem",
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a1a",
    marginBottom: "1.25rem",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: "1.25rem",
  },
  searchIcon: {
    position: "absolute",
    left: 11,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
    color: "#aaa",
  },
  searchInput: {
    width: "100%",
    padding: "9px 12px 9px 36px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
  },
  filterSelect: {
    padding: "9px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
    minWidth: 130,
  },
  catGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 14,
  },
  catCard: {
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 12,
    overflow: "hidden",
    transition: "border-color 0.15s, transform 0.15s",
  },
  catThumb: {
    height: 110,
    background: "#f5f6fa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  statusDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: "50%",
  },
  catBody: { padding: "12px" },
  catName: { fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 },
  catDesc: {
    fontSize: 12,
    color: "#888",
    lineHeight: 1.5,
    marginBottom: 10,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  catFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderTop: "1px solid #eee",
    paddingTop: 10,
  },
  iconBtn: {
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #eee",
    borderRadius: 7,
    cursor: "pointer",
    background: "#fff",
    fontSize: 14,
  },
  iconBtnDanger: { color: "#a32d2d" },
  emptyState: {
    textAlign: "center",
    padding: "3rem 1rem",
    color: "#888",
  },
  spinner: {
    width: 36,
    height: 36,
    border: "3px solid #eee",
    borderTop: "3px solid #1a7a4a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  formGroup: { display: "flex", flexDirection: "column", gap: 6 },
  formLabel: { fontSize: 13, fontWeight: 500, color: "#555" },
  formInput: {
    padding: "9px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    color: "#1a1a1a",
    outline: "none",
    fontFamily: "inherit",
  },
  formSelect: {
    padding: "9px 12px",
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    color: "#1a1a1a",
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  uploadZone: {
    border: "2px dashed #ddd",
    borderRadius: 8,
    padding: "2rem",
    textAlign: "center",
    cursor: "pointer",
    background: "#fafafa",
    transition: "border-color 0.15s",
  },
  formActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: "1.5rem",
    paddingTop: "1.25rem",
    borderTop: "1px solid #eee",
  },
  toast: {
    position: "fixed",
    bottom: 24,
    right: 24,
    background: "#1a7a4a",
    color: "#fff",
    padding: "12px 20px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.3s",
    zIndex: 9999,
    pointerEvents: "none",
    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  },
  toastError: { background: "#a32d2d" },
};