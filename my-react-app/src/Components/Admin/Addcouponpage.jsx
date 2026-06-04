import { useState } from "react";

const API_BASE_URL = "http://localhost:5000/api/coupon"; // Update this to your backend URL

const CATEGORIES_API = "http://localhost:5000/api/Category/all"; // Update to your categories endpoint

const initialForm = {
  applicableFor: "All",
  category: "",
  couponCode: "",
  discountType: "Amount",
  discountValue: "",
  minOrderAmount: "",
  limitPerUser: "",
  maxDiscountAmount: "",
  startDate: "",
  startTime: "",
  expiryDate: "",
  expiryTime: "",
};

export default function AddCouponPage() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  // Fetch categories on mount
  useState(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const res = await fetch(CATEGORIES_API, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        // Adjust based on your API response shape: data.categories or data
        setCategories(Array.isArray(data) ? data : data.categories || []);
      } catch {
        // silently fail — categories dropdown will just be empty
      }
    };
    fetchCategories();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    const required = ["couponCode", "discountType", "discountValue", "minOrderAmount", "startDate", "startTime", "expiryDate", "expiryTime"];
    for (const field of required) {
      if (!form[field]) {
        showToast("error", `Please fill in all required fields.`);
        return;
      }
    }

    if (form.applicableFor === "Category_Specific" && !form.category) {
      showToast("error", "Please select a category for Category Specific coupons.");
      return;
    }

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

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken"); // Adjust token retrieval as needed
      const res = await fetch(`${API_BASE_URL}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast("success", data.message || "Promo Code Created!");
        setForm(initialForm);
      } else {
        showToast("error", data.error || data.message || "Something went wrong.");
      }
    } catch (err) {
      showToast("error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="w-full max-w-4xl bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <div className="w-7 h-7 rounded-full border-2 border-gray-700 flex items-center justify-center">
            <span className="text-gray-700 text-lg font-bold leading-none">+</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Add New Promo Code</h1>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Applicable For + Category (conditional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applicable For <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="applicableFor"
                  value={form.applicableFor}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"
                >
                  <option value="All">All</option>
                  <option value="New_User">New User</option>
                  <option value="Category_Specific">Category Specific</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {form.applicableFor === "Category_Specific" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coupon Code + Discount Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="couponCode"
                value={form.couponCode}
                onChange={handleChange}
                placeholder="Coupon code"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="discountType"
                  value={form.discountType}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"
                >
                  <option value="Amount">Amount</option>
                  <option value="Percentage">Percentage</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Discount + Minimum Order Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="discountValue"
                value={form.discountValue}
                onChange={handleChange}
                placeholder="Discount"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="minOrderAmount"
                value={form.minOrderAmount}
                onChange={handleChange}
                placeholder="Minimum Order Amount"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Limit For Single User + Maximum Discount Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limit For Single User</label>
              <input
                type="number"
                name="limitPerUser"
                value={form.limitPerUser}
                onChange={handleChange}
                placeholder="exm: 5"
                min="1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount Amount</label>
              <input
                type="number"
                name="maxDiscountAmount"
                value={form.maxDiscountAmount}
                onChange={handleChange}
                placeholder="exm: $300"
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Start Date + Start Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Expired Date + Expired Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expired Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expiryDate"
                value={form.expiryDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expired Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="expiryTime"
                value={form.expiryTime}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleCancel}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-8 py-2 text-sm font-semibold text-white rounded-md transition ${
              loading
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 active:bg-green-800"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}