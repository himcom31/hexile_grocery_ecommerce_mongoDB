import { useState, useEffect, useRef } from "react";

const BASE_URL = "http://localhost:5000/api/flash";
const PRODUCTS_API = "http://localhost:5000/api/products/all";

const getToken = () => localStorage.getItem("adminToken") || "";
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

function formatDateTime(date, time) {
  if (!date) return "—";
  const d = new Date(date);
  const dateStr = d.toISOString().split("T")[0];
  return `${dateStr} - ${time || ""}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4h6v2" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const BoltIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

// ─── Shared styles ────────────────────────────────────────────────────────────
const inp =
  "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition bg-white";
const lbl = "block text-sm font-medium text-gray-700 mb-1.5";
const Req = () => <span className="text-red-500 ml-0.5">*</span>;

// ─── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = ({ sm }) => (
  <svg
    className={`animate-spin ${sm ? "w-4 h-4" : "w-8 h-8"} border-4 border-green-400 border-t-transparent rounded-full`}
    fill="none"
    viewBox="0 0 24 24"
  />
);

// =============================================================================
// EDIT FLASH SALE
// =============================================================================
function EditFlashSale({ sale, onBack, onUpdated }) {
  const [form, setForm] = useState({
    name: sale.name || "",
    minDiscount: sale.minDiscount || "",
    startDate: sale.startDate ? new Date(sale.startDate).toISOString().split("T")[0] : "",
    startTime: sale.startTime || "",
    endDate: sale.endDate ? new Date(sale.endDate).toISOString().split("T")[0] : "",
    endTime: sale.endTime || "",
    description: sale.description || "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(sale.thumbnail || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const { name, minDiscount, startDate, startTime, endDate, endTime, description } = form;
    if (!name.trim()) return "Name is required.";
    if (!minDiscount || isNaN(minDiscount)) return "Valid discount required.";
    if (!startDate || !startTime || !endDate || !endTime) return "All date/time fields required.";
    if (new Date(`${endDate}T${endTime}`) <= new Date(`${startDate}T${startTime}`))
      return "End must be after Start.";
    if (!description.trim()) return "Description is required.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (thumbnail) fd.append("thumbnail", thumbnail);
      const res = await fetch(`${BASE_URL}/update/${sale._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed");
      onUpdated(data.sale);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-yellow-500"><BoltIcon /></span>
          <h1 className="text-2xl font-bold text-gray-900">Edit FlashSale</h1>
        </div>

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-8">
          {/* Fields */}
          <div className="flex-1 space-y-5">
            <div>
              <label className={lbl}>Name <Req /></label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Enter name" className={inp} />
            </div>
            <div>
              <label className={lbl}>Minimum Discount <Req /></label>
              <input name="minDiscount" type="number" value={form.minDiscount} onChange={handleChange} placeholder="e.g. 20" className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Start Date <Req /></label>
                <input name="startDate" type="date" value={form.startDate} onChange={handleChange} className={inp} />
              </div>
              <div>
                <label className={lbl}>Start Time <Req /></label>
                <input name="startTime" type="time" value={form.startTime} onChange={handleChange} className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>End Date <Req /></label>
                <input name="endDate" type="date" value={form.endDate} onChange={handleChange} className={inp} />
              </div>
              <div>
                <label className={lbl}>End Time <Req /></label>
                <input name="endTime" type="time" value={form.endTime} onChange={handleChange} className={inp} />
              </div>
            </div>
            <div>
              <label className={lbl}>Description <Req /></label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={`${inp} resize-y`} />
            </div>
          </div>

          {/* Thumbnail */}
          <div className="w-60 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Thumbnail <span className="text-blue-500 font-normal">Ratio 3:2 (600 × 400 px)</span> <Req />
            </label>
            <div
              onClick={() => fileRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="w-full h-52 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-green-400 hover:bg-green-50 transition flex items-center justify-center bg-gray-100 group"
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-gray-400 group-hover:text-green-500 transition text-xs">
                  <span className="text-3xl mb-1">🖼</span>
                  Click or drag to upload
                </div>
              )}
            </div>
            {thumbnailPreview && (
              <button
                onClick={() => { setThumbnail(null); setThumbnailPreview(null); fileRef.current.value = ""; }}
                className="mt-2 text-xs text-red-500 hover:underline w-full text-center"
              >
                Remove image
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
          <button onClick={onBack} disabled={loading}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-8 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition flex items-center gap-2 shadow-sm disabled:opacity-60">
            {loading ? <><Spinner sm /> Updating...</> : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// UPDATE PRODUCT MODAL
// =============================================================================
function UpdateProductModal({ saleId, product, onClose, onUpdated }) {
  const [price, setPrice] = useState(product.sellingPrice ?? product.price);
  const [quantity, setQuantity] = useState(product.stockQuantity ?? product.stock ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (price === "" || quantity === "") { setError("Both fields are required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/${saleId}/update-product/${product._id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ price: Number(price), quantity: Number(quantity) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed");
      onUpdated(data.product);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-800">Update Product</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition"><XIcon /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Name</p>
            <p className="text-sm font-medium text-gray-800">{product.name}</p>
          </div>
          {error && <p className="text-xs text-red-500">⚠️ {error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price <Req /></label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <Req /></label>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inp} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-5 pb-5">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition">
            Close
          </button>
          <button onClick={handleUpdate} disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-green-500 hover:bg-green-600 text-white transition disabled:opacity-60 flex items-center gap-2">
            {loading ? <><Spinner sm /> Updating...</> : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FLASH SALE DETAIL
// =============================================================================
function FlashSaleDetail({ saleId, onBack }) {
  const [sale, setSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [addingProduct, setAddingProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [error, setError] = useState("");

  const fetchSale = async () => {
    try {
      const res = await fetch(`${BASE_URL}/${saleId}`, { headers: authHeaders() });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load sale");
      setSale(data.sale);
      setProducts(Array.isArray(data.sale.products) ? data.sale.products : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await fetch(PRODUCTS_API, { headers: authHeaders() });
      const data = await res.json();
      // Handle any response shape and ALWAYS guarantee an array
      const raw = data.products ?? data.data ?? data;
      setAllProducts(Array.isArray(raw) ? raw : []);
    } catch (e) {
      console.error("Products fetch error:", e);
      setAllProducts([]); // never leave as non-array
    }
  };

  useEffect(() => {
    fetchSale();
    fetchAllProducts();
  }, [saleId]);

  const handleAddProduct = async () => {
    if (!selectedProductId) return;
    setAddingProduct(true);
    try {
      const res = await fetch(`${BASE_URL}/${saleId}/add-product`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProductId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add product");
      setProducts(Array.isArray(data.sale.products) ? data.sale.products : []);
      setSelectedProductId("");
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleRemoveProduct = async (productId) => {
    if (!window.confirm("Remove this product from the flash sale?")) return;
    try {
      const res = await fetch(`${BASE_URL}/${saleId}/remove-product/${productId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setProducts(Array.isArray(data.sale.products) ? data.sale.products : []);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleProductUpdated = (updatedProduct) => {
    setProducts((prev) =>
      prev.map((p) => (p._id === updatedProduct._id ? { ...p, ...updatedProduct } : p))
    );
    setEditProduct(null);
  };

  if (loadingPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-red-500">
        <p>{error || "Flash Sale not found"}</p>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 underline">
          ← Back
        </button>
      </div>
    );
  }

  // Exclude already-added products from the dropdown
  const addedIds = new Set(products.map((p) => String(p._id)));
  const availableProducts = allProducts.filter((p) => !addedIds.has(String(p._id)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={onBack} className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
          ← Back to Flash Sales
        </button>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            ⚠️ {error}
            <button onClick={() => setError("")} className="ml-3 text-red-400 hover:text-red-600 text-xs underline">dismiss</button>
          </div>
        )}

        {/* Deal Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Flash Deal Details</h2>
          <div className="grid grid-cols-3 gap-6 pb-4 border-b border-gray-100 mb-4">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">Deal Name:</p>
              <p className="text-sm text-gray-800 font-semibold">{sale.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">Start Date:</p>
              <p className="text-sm text-gray-800">{formatDateTime(sale.startDate, sale.startTime)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">End Date:</p>
              <p className="text-sm text-gray-800">{formatDateTime(sale.endDate, sale.endTime)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">Minimum Discount:</p>
              <p className="text-sm text-gray-800 font-semibold">{sale.minDiscount}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-0.5">Publish Status:</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  sale.isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {sale.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Add Product */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Product</h3>
          <div className="flex gap-3">
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className={`flex-1 ${inp}`}
            >
              <option value="">Select Product</option>
              {availableProducts.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}{p.price != null ? ` — $${p.price}` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddProduct}
              disabled={!selectedProductId || addingProduct}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 whitespace-nowrap"
            >
              {addingProduct ? "Adding..." : <><PlusIcon /> Add</>}
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Added Products</h3>
          </div>
          {products.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No products added yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left w-12">SL</th>
                  <th className="px-6 py-3 text-left w-20">Thumbnail</th>
                  <th className="px-6 py-3 text-left">Product Name</th>
                  <th className="px-6 py-3 text-left">Price</th>
                  <th className="px-6 py-3 text-left">Quantity</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product, i) => (
                  <tr key={product._id} className="hover:bg-gray-50/60 transition">
                    <td className="px-6 py-4 text-sm text-gray-600">{i + 1}</td>
                    <td className="px-6 py-4">
                      {product.thumbnail || product.image ? (
                        <img
                          src={product.thumbnail || product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-lg">🖼</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">${Number(product.sellingPrice ?? product.price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>{product.stockQuantity ?? product.stock ?? 0}</div>
                      <div className="text-xs text-gray-400">Sold: {product.sold || 0}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditProduct(product)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleRemoveProduct(product._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editProduct && (
        <UpdateProductModal
          saleId={saleId}
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onUpdated={handleProductUpdated}
        />
      )}
    </div>
  );
}

// =============================================================================
// FLASH SALE LIST
// =============================================================================
function FlashSaleList({ onCreateNew, onView, onEdit }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/all`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSales(Array.isArray(data.sales) ? data.sales : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSales(); }, []);

  const handleToggle = async (sale) => {
    try {
      const res = await fetch(`${BASE_URL}/toggle/${sale._id}`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSales((prev) =>
        prev.map((s) => (s._id === sale._id ? { ...s, isActive: data.sale.isActive } : s))
      );
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this flash sale? This cannot be undone.")) return;
    try {
      const res = await fetch(`${BASE_URL}/delete/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSales((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Flash Sales</h1>
          
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            ⚠️ {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center"><Spinner /></div>
          ) : sales.length === 0 ? (
            <div className="py-20 text-center text-gray-400">No flash sales yet. Create one!</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <th className="px-5 py-3.5 text-left w-10">SL</th>
                  <th className="px-5 py-3.5 text-left w-24">Thumbnail</th>
                  <th className="px-5 py-3.5 text-left">Name</th>
                  <th className="px-5 py-3.5 text-left">Start Date</th>
                  <th className="px-5 py-3.5 text-left">End Date</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-left">Description</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale, i) => (
                  <tr key={sale._id} className="hover:bg-gray-50/60 transition">
                    <td className="px-5 py-4 text-sm text-gray-600">{i + 1}</td>
                    <td className="px-5 py-4">
                      {sale.thumbnail ? (
                        <img src={sale.thumbnail} alt={sale.name} className="w-16 h-12 object-cover rounded-lg border border-gray-100" />
                      ) : (
                        <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">🖼</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-800">{sale.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(sale.startDate, sale.startTime)}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(sale.endDate, sale.endTime)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggle(sale)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          sale.isActive ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            sale.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">{sale.description}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onView(sale._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                          title="View"
                        >
                          <EyeIcon />
                        </button>
                        <button
                          onClick={() => onEdit(sale)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-100 transition"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(sale._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition"
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ROOT — in-app router
// =============================================================================
export default function FlashSaleApp() {
  const [page, setPage] = useState("list");
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  const goList = () => { setPage("list"); setSelectedSaleId(null); setSelectedSale(null); };

  if (page === "view") {
    return <FlashSaleDetail saleId={selectedSaleId} onBack={goList} />;
  }

  if (page === "edit") {
    return (
      <EditFlashSale
        sale={selectedSale}
        onBack={goList}
        onUpdated={goList}
      />
    )
  }

  return (
    <FlashSaleList
      onCreateNew={() => setPage("create")}
      onView={(id) => { setSelectedSaleId(id); setPage("view"); }}
      onEdit={(sale) => { setSelectedSale(sale); setPage("edit"); }}
    />
  );
}