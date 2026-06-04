import { useState, useRef } from "react";

const BASE_URL = "http://localhost:5000/api/flash"; // Update this to your actual API base URL

export default function CreateFlashSale() {
  const [form, setForm] = useState({
    name: "",
    minDiscount: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: "",
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please drop a valid image file.");
      return;
    }
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setError("");
  };

  const validate = () => {
    const { name, minDiscount, startDate, startTime, endDate, endTime, description } = form;
    if (!name.trim()) return "Name is required.";
    if (!minDiscount || isNaN(minDiscount) || Number(minDiscount) < 0 || Number(minDiscount) > 100)
      return "Minimum Discount must be a number between 0 and 100.";
    if (!startDate) return "Start Date is required.";
    if (!startTime) return "Start Time is required.";
    if (!endDate) return "End Date is required.";
    if (!endTime) return "End Time is required.";
    if (new Date(`${endDate}T${endTime}`) <= new Date(`${startDate}T${startTime}`))
      return "End date/time must be after start date/time.";
    if (!description.trim()) return "Description is required.";
    if (!thumbnail) return "Thumbnail is required.";
    return null;
  };

  const getToken = () => localStorage.getItem("adminToken") || "";

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("minDiscount", form.minDiscount);
      formData.append("startDate", form.startDate);
      formData.append("startTime", form.startTime);
      formData.append("endDate", form.endDate);
      formData.append("endTime", form.endTime);
      formData.append("description", form.description);
      formData.append("thumbnail", thumbnail);

      const res = await fetch(`${BASE_URL}/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create flash sale.");
      }

      setSuccess("Flash Sale created successfully!");
      setForm({
        name: "",
        minDiscount: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        description: "",
      });
      setThumbnail(null);
      setThumbnailPreview(null);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: "",
      minDiscount: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      description: "",
    });
    setThumbnail(null);
    setThumbnailPreview(null);
    setError("");
    setSuccess("");
  };

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const requiredStar = <span className="text-red-500 ml-0.5">*</span>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-yellow-500 text-2xl">⚡</span>
          <h1 className="text-2xl font-bold text-gray-900">Create New FlashSale</h1>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-5 flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
            <span className="mt-0.5">✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* Form Layout */}
        <div className="flex gap-8">
          {/* Left: Fields */}
          <div className="flex-1 space-y-5">
            {/* Name */}
            <div>
              <label className={labelClass}>Name {requiredStar}</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter name"
                className={inputClass}
              />
            </div>

            {/* Minimum Discount */}
            <div>
              <label className={labelClass}>Minimum Discount {requiredStar}</label>
              <input
                type="number"
                name="minDiscount"
                value={form.minDiscount}
                onChange={handleChange}
                placeholder="Enter discount (e.g. 20)"
                min="0"
                max="100"
                className={inputClass}
              />
            </div>

            {/* Start Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Start Date {requiredStar}</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Start Time {requiredStar}</label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>End Date {requiredStar}</label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>End Time {requiredStar}</label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description {requiredStar}</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter short description"
                rows={4}
                className={`${inputClass} resize-y`}
              />
            </div>
          </div>

          {/* Right: Thumbnail */}
          <div className="w-60 flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Thumbnail{" "}
              <span className="text-blue-500 font-normal">Ratio 3:2 (600 × 400 px)</span>{" "}
              {requiredStar}
            </label>

            <div
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="w-full h-44 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-green-400 hover:bg-green-50 transition flex items-center justify-center bg-gray-100 group"
            >
              {thumbnailPreview ? (
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400 group-hover:text-green-500 transition select-none">
                  <svg className="w-12 h-12 mb-2 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                  </svg>
                  <span className="text-xs">Click or drag to upload</span>
                </div>
              )}
            </div>

            {thumbnailPreview && (
              <button
                onClick={() => {
                  setThumbnail(null);
                  setThumbnailPreview(null);
                  fileInputRef.current.value = "";
                }}
                className="mt-2 text-xs text-red-500 hover:underline w-full text-center"
              >
                Remove image
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}