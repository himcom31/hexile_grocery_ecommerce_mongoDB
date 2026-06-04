import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:5000/api/coupon"; // Update to your backend URL
const CATEGORIES_API = "http://localhost:5000/api/Category/all";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateTime(date, time) {
  if (!date) return "—";
  const d = new Date(date);
  const options = { month: "short", day: "2-digit", year: "numeric" };
  const datePart = d.toLocaleDateString("en-US", options);
  return time ? `${datePart} ${time}` : datePart;
}

function authHeaders() {
  const token = localStorage.getItem("adminToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditModal({ coupon, categories, onClose, onUpdated }) {
  const [form, setForm] = useState({
    couponCode: coupon.couponCode || "",
    discountType: coupon.discountType || "Amount",
    discountValue: coupon.discountValue ?? "",
    minOrderAmount: coupon.minOrderAmount ?? "",
    limitPerUser: coupon.limitPerUser ?? "",
    maxDiscountAmount: coupon.maxDiscountAmount ?? "",
    applicableFor: coupon.applicableFor || "All",
    category: coupon.category?._id || coupon.category || "",
    startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
    startTime: coupon.startTime || "",
    expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : "",
    expiryTime: coupon.expiryTime || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    const required = ["couponCode", "discountType", "discountValue", "minOrderAmount", "startDate", "startTime", "expiryDate", "expiryTime"];
    for (const f of required) {
      if (!form[f] && form[f] !== 0) {
        setError("Please fill in all required fields.");
        return;
      }
    }
    if (form.applicableFor === "Category_Specific" && !form.category) {
      setError("Please select a category.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const payload = {
        couponCode: form.couponCode.toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        limitPerUser: form.limitPerUser ? Number(form.limitPerUser) : 1,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
        applicableFor: form.applicableFor,
        category: form.applicableFor === "Category_Specific" ? form.category : undefined,
        startDate: form.startDate,
        startTime: form.startTime,
        expiryDate: form.expiryDate,
        expiryTime: form.expiryTime,
      };

      const res = await fetch(`${API_BASE_URL}/${coupon._id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUpdated(data.coupon);
      } else {
        setError(data.error || data.message || "Update failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const SelectArrow = () => (
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );

  const inputCls = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">Edit Promo Code</h2>
        </div>

        <div className="px-6 py-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-md">{error}</div>
          )}

          {/* Applicable For + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Applicable For <span className="text-red-500">*</span></label>
              <div className="relative">
                <select name="applicableFor" value={form.applicableFor} onChange={handleChange} className={`${inputCls} appearance-none bg-white`}>
                  <option value="All">All</option>
                  <option value="New_User">New User</option>
                  <option value="Category_Specific">Category Specific</option>
                </select>
                <SelectArrow />
              </div>
            </div>
            {form.applicableFor === "Category_Specific" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select name="category" value={form.category} onChange={handleChange} className={`${inputCls} appearance-none bg-white`}>
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  <SelectArrow />
                </div>
              </div>
            )}
          </div>

          {/* Voucher Code + Discount Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voucher Code <span className="text-red-500">*</span></label>
              <input type="text" name="couponCode" value={form.couponCode} onChange={handleChange} className={`${inputCls} uppercase`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type <span className="text-red-500">*</span></label>
              <div className="relative">
                <select name="discountType" value={form.discountType} onChange={handleChange} className={`${inputCls} appearance-none bg-white`}>
                  <option value="Amount">Amount</option>
                  <option value="Percentage">Percentage</option>
                </select>
                <SelectArrow />
              </div>
            </div>
          </div>

          {/* Discount + Min Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount <span className="text-red-500">*</span></label>
              <input type="number" name="discountValue" value={form.discountValue} onChange={handleChange} min="0" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount <span className="text-red-500">*</span></label>
              <input type="number" name="minOrderAmount" value={form.minOrderAmount} onChange={handleChange} min="0" className={inputCls} />
            </div>
          </div>

          {/* Limit + Max Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limit For Single User</label>
              <input type="number" name="limitPerUser" value={form.limitPerUser} onChange={handleChange} min="1" placeholder="exm: 5" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount Amount</label>
              <input type="number" name="maxDiscountAmount" value={form.maxDiscountAmount} onChange={handleChange} min="0" placeholder="exm: $300" className={inputCls} />
            </div>
          </div>

          {/* Start Date + Start Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time <span className="text-red-500">*</span></label>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className={inputCls} />
            </div>
          </div>

          {/* Expiry Date + Expiry Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expired Date <span className="text-red-500">*</span></label>
              <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expired Time <span className="text-red-500">*</span></label>
              <input type="time" name="expiryTime" value={form.expiryTime} onChange={handleChange} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className={`px-8 py-2 text-sm font-semibold text-white rounded-md transition ${loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Updating...
              </span>
            ) : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────

function DeleteModal({ coupon, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${coupon._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onDeleted(coupon._id);
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Delete Promo Code</h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete <span className="font-semibold text-gray-700">{coupon.couponCode}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 transition disabled:opacity-60">
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Switch ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-green-500" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function CouponListPage({ onCreateNew }) {
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [editCoupon, setEditCoupon] = useState(null);
  const [deleteCoupon, setDeleteCoupon] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/all`, { headers: authHeaders() });
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : data.coupons || []);
      } catch {
        showToast("error", "Failed to load coupons.");
      } finally {
        setLoadingList(false);
      }
    };
    fetchCoupons();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(CATEGORIES_API, { headers: authHeaders() });
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      } catch { /* silent */ }
    };
    fetchCategories();
  }, []);

  // Toggle active status
  const handleToggle = async (coupon) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${coupon._id}/toggle`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons((prev) =>
          prev.map((c) => (c._id === coupon._id ? { ...c, isActive: data.coupon.isActive } : c))
        );
      }
    } catch {
      showToast("error", "Failed to update status.");
    }
  };

  const handleUpdated = (updated) => {
    setCoupons((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
    setEditCoupon(null);
    showToast("success", "Promo code updated!");
  };

  const handleDeleted = (id) => {
    setCoupons((prev) => prev.filter((c) => c._id !== id));
    setDeleteCoupon(null);
    showToast("success", "Promo code deleted.");
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Page header */}
    

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-5 py-4 font-semibold text-gray-700">Code</th>
              <th className="text-left px-5 py-4 font-semibold text-gray-700">Discount</th>
              <th className="text-left px-5 py-4 font-semibold text-gray-700">Min Amount</th>
              <th className="text-left px-5 py-4 font-semibold text-gray-700">Started At</th>
              <th className="text-left px-5 py-4 font-semibold text-gray-700">Expired At</th>
              <th className="text-left px-5 py-4 font-semibold text-gray-700">Status</th>
              <th className="text-left px-5 py-4 font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {loadingList ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">No promo codes found.</td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                  <td className="px-5 py-4 text-gray-800 font-medium">{coupon.couponCode}</td>
                  <td className="px-5 py-4 text-gray-600">
                    {coupon.discountType === "Percentage"
                      ? `${coupon.discountValue}%`
                      : `$${coupon.discountValue}`}
                  </td>
                  <td className="px-5 py-4 text-gray-600">${coupon.minOrderAmount}</td>
                  <td className="px-5 py-4 text-gray-600">{formatDateTime(coupon.startDate, coupon.startTime)}</td>
                  <td className="px-5 py-4 text-gray-600">{formatDateTime(coupon.expiryDate, coupon.expiryTime)}</td>
                  <td className="px-5 py-4">
                    <Toggle checked={coupon.isActive} onChange={() => handleToggle(coupon)} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {/* Edit */}
                      <button
                        onClick={() => setEditCoupon(coupon)}
                        className="p-1.5 rounded-md border border-blue-200 text-blue-500 hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => setDeleteCoupon(coupon)}
                        className="p-1.5 rounded-md border border-red-200 text-red-400 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Edit Modal */}
      {editCoupon && (
        <EditModal
          coupon={editCoupon}
          categories={categories}
          onClose={() => setEditCoupon(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteCoupon && (
        <DeleteModal
          coupon={deleteCoupon}
          onClose={() => setDeleteCoupon(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}