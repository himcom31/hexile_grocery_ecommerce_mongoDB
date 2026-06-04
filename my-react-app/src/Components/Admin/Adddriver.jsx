import { useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const VEHICLE_TYPES = ["Bike", "Scooter", "Cycle", "Mini Truck"];
const IDENTITY_TYPES = ["Aadhar", "Driving_License", "PAN"];
const GENDERS = ["Male", "Female", "Other"];

const initialState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  gender: "Male",
  drivingLicense: "",
  password: "",
  confirmPassword: "",
  dob: "",
  vehicleType: "",
  vehicleNumber: "",
  identityType: "",
  identityNumber: "",
};

function validate(form, photo) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.phone.trim()) errors.phone = "Phone number is required";
  else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone.trim()))
    errors.phone = "Enter a valid phone number";
  if (form.email && !/\S+@\S+\.\S+/.test(form.email.trim()))
    errors.email = "Enter a valid email address";
  if (!form.password) errors.password = "Password is required";
  else if (form.password.length < 6)
    errors.password = "Minimum 6 characters required";
  if (form.password !== form.confirmPassword)
    errors.confirmPassword = "Passwords do not match";
  if (!form.vehicleType) errors.vehicleType = "Vehicle type is required";
  if (!form.identityType) errors.identityType = "Identity type is required";
  if (!form.identityNumber.trim())
    errors.identityNumber = "Identity number is required";
  if (!photo) errors.photo = "Profile photo is required";
  return errors;
}

export default function AddDriver() {
  const [form, setForm] = useState(initialState);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handlePhotoSelect(file) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        photo: "Only jpg, jpeg, png formats supported",
      }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "File size must be under 5MB" }));
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, photo: "" }));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePhotoSelect(file);
  }

  function removePhoto() {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate(form, photo);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const token =
        localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken") || "";

      const formData = new FormData();
      const fullName = [form.firstName.trim(), form.lastName.trim()]
        .filter(Boolean)
        .join(" ");
      formData.append("fullName", fullName);
      formData.append("email", form.email.trim());
      formData.append("phone", form.phone.trim());
      formData.append("vehicleType", form.vehicleType);
      formData.append("vehicleNumber", form.vehicleNumber.trim());
      formData.append("identityType", form.identityType);
      formData.append("identityNumber", form.identityNumber.trim());
      formData.append("drivingLicense", form.drivingLicense.trim());

      if (form.dob) formData.append("dob", form.dob);
      formData.append("password", form.password);
      formData.append("profileImage", photo);

      const res = await fetch(`${API_BASE}/driver/add`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast("Driver onboarded successfully!", "success");
        setForm(initialState);
        removePhoto();
      } else {
        showToast(data.message || "Something went wrong. Please try again.", "error");
      }
    } catch (err) {
      showToast("Network error. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .ad-page {
          min-height: 100vh;
          background: #f5f5f4;
          padding: 2rem;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .ad-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1.5rem;
        }

        .ad-header-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ad-header h1 {
          font-size: 22px;
          font-weight: 600;
          color: #1c1c1c;
          letter-spacing: -0.3px;
        }

        .ad-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .ad-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #f3f4f6;
        }

        .ad-form-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 2rem;
        }

        @media (max-width: 900px) {
          .ad-form-layout { grid-template-columns: 1fr; }
          .ad-page { padding: 1rem; }
        }

        .ad-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem 1.25rem;
        }

        .ad-field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .ad-field.full {
          grid-column: 1 / -1;
        }

        .ad-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .ad-req {
          color: #ef4444;
          font-size: 14px;
          line-height: 1;
        }

        .ad-input,
        .ad-select {
          width: 100%;
          padding: 9px 12px;
          font-size: 14px;
          font-family: inherit;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          color: #1c1c1c;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          appearance: none;
          -webkit-appearance: none;
        }

        .ad-input:focus,
        .ad-select:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.1);
        }

        .ad-input::placeholder {
          color: #9ca3af;
        }

        .ad-input.error,
        .ad-select.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
        }

        .ad-select-wrap {
          position: relative;
        }

        .ad-select-wrap::after {
          content: '';
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #6b7280;
          pointer-events: none;
        }

        .ad-field-error {
          font-size: 11.5px;
          color: #ef4444;
          font-weight: 400;
        }

        /* Photo Upload */
        .ad-photo-label {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }

        .ad-photo-ratio {
          color: #16a34a;
          font-weight: 500;
        }

        .ad-photo-box {
          width: 100%;
          aspect-ratio: 1;
          border: 2px dashed #d1d5db;
          border-radius: 10px;
          background: #fafafa;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.15s, background 0.15s;
        }

        .ad-photo-box:hover,
        .ad-photo-box.drag-over {
          border-color: #16a34a;
          background: #f0fdf4;
        }

        .ad-photo-box.has-photo {
          border-style: solid;
          border-color: #16a34a;
        }

        .ad-photo-box.photo-error {
          border-color: #ef4444;
        }

        .ad-photo-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ad-photo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .ad-photo-box.has-photo:hover .ad-photo-overlay {
          opacity: 1;
        }

        .ad-photo-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          pointer-events: none;
        }

        .ad-photo-hint svg {
          width: 40px;
          height: 40px;
          color: #9ca3af;
        }

        .ad-photo-hint span {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .ad-photo-hint small {
          font-size: 11px;
          color: #9ca3af;
        }

        .ad-photo-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          font-size: 16px;
          color: #374151;
          transition: background 0.1s;
        }

        .ad-photo-remove:hover {
          background: #fee2e2;
          color: #ef4444;
        }

        .ad-photo-formats {
          font-size: 11.5px;
          color: #9ca3af;
          margin-top: 5px;
        }

        .ad-right-col {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Submit Row */
        .ad-submit-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid #f3f4f6;
        }

        .ad-btn-submit {
          background: #16a34a;
          color: #fff;
          border: none;
          padding: 10px 32px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: 0.1px;
          transition: background 0.15s, transform 0.1s;
        }

        .ad-btn-submit:hover:not(:disabled) { background: #15803d; }
        .ad-btn-submit:active:not(:disabled) { transform: scale(0.98); }
        .ad-btn-submit:disabled { background: #86efac; cursor: not-allowed; }

        .ad-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: ad-spin 0.65s linear infinite;
          flex-shrink: 0;
        }

        @keyframes ad-spin { to { transform: rotate(360deg); } }

        /* Toast */
        .ad-toast {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          padding: 12px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 500;
          font-family: 'DM Sans', system-ui, sans-serif;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.13);
          animation: ad-toast-in 0.25s ease;
          max-width: 360px;
        }

        .ad-toast.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .ad-toast.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .ad-toast-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 700;
        }

        .ad-toast.success .ad-toast-icon { background: #16a34a; color: #fff; }
        .ad-toast.error .ad-toast-icon { background: #ef4444; color: #fff; }

        @keyframes ad-toast-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="ad-page">
        <div className="ad-header">
          <div className="ad-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#374151" }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1>Create New Driver</h1>
        </div>

        <div className="ad-card">
          <div className="ad-section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            User Information
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="ad-form-layout">
              {/* Left Column */}
              <div className="ad-form-grid">
                {/* First Name */}
                <div className="ad-field">
                  <label className="ad-label">
                    First Name <span className="ad-req">*</span>
                  </label>
                  <input
                    className={`ad-input ${errors.firstName ? "error" : ""}`}
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <span className="ad-field-error">{errors.firstName}</span>
                  )}
                </div>

                {/* Last Name */}
                <div className="ad-field">
                  <label className="ad-label">Last Name</label>
                  <input
                    className="ad-input"
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    autoComplete="family-name"
                  />
                </div>

                {/* Phone */}
                <div className="ad-field full">
                  <label className="ad-label">
                    Phone Number <span className="ad-req">*</span>
                  </label>
                  <input
                    className={`ad-input ${errors.phone ? "error" : ""}`}
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    autoComplete="tel"
                  />
                  {errors.phone && (
                    <span className="ad-field-error">{errors.phone}</span>
                  )}
                </div>

                {/* Email */}
                <div className="ad-field full">
                  <label className="ad-label">Email</label>
                  <input
                    className={`ad-input ${errors.email ? "error" : ""}`}
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter Email Address"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <span className="ad-field-error">{errors.email}</span>
                  )}
                </div>

                {/* Gender */}
                <div className="ad-field full">
                  <label className="ad-label">Gender</label>
                  <div className="ad-select-wrap">
                    <select
                      className="ad-select"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                    >
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Driving License */}
                <div className="ad-field full">
                  <label className="ad-label">Driving License</label>
                  <input
                    className="ad-input"
                    type="text"
                    name="drivingLicense"
                    value={form.drivingLicense}
                    onChange={handleChange}
                    placeholder="Enter License"
                  />
                </div>

                {/* Password */}
                <div className="ad-field">
                  <label className="ad-label">
                    Password <span className="ad-req">*</span>
                  </label>
                  <input
                    className={`ad-input ${errors.password ? "error" : ""}`}
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter Password"
                    autoComplete="new-password"
                  />
                  {errors.password && (
                    <span className="ad-field-error">{errors.password}</span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="ad-field">
                  <label className="ad-label">
                    Confirm Password <span className="ad-req">*</span>
                  </label>
                  <input
                    className={`ad-input ${errors.confirmPassword ? "error" : ""}`}
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Enter Confirm Password"
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && (
                    <span className="ad-field-error">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="ad-right-col">
                {/* Profile Photo */}
                <div>
                  <p className="ad-photo-label">
                    Profile Photo{" "}
                    <span className="ad-photo-ratio">Ratio 1:1 (500 × 500 px)</span>{" "}
                    <span className="ad-req">*</span>
                  </p>
                  <div
                    className={`ad-photo-box ${photoPreview ? "has-photo" : ""} ${dragOver ? "drag-over" : ""} ${errors.photo ? "photo-error" : ""}`}
                    onClick={() => !photoPreview && fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    {photoPreview ? (
                      <>
                        <img className="ad-photo-img" src={photoPreview} alt="Profile preview" />
                        <div className="ad-photo-overlay">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            style={{ background: "rgba(255,255,255,0.9)", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}
                          >
                            Change Photo
                          </button>
                        </div>
                        <button
                          type="button"
                          className="ad-photo-remove"
                          onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                          title="Remove photo"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="ad-photo-hint">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span>Click or drag to upload</span>
                        <small>500 × 500 px recommended</small>
                      </div>
                    )}
                  </div>
                  <p className="ad-photo-formats">Supported formats: jpg, jpeg, png</p>
                  {errors.photo && (
                    <span className="ad-field-error">{errors.photo}</span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={(e) => handlePhotoSelect(e.target.files[0])}
                  />
                </div>

                {/* Date of Birth */}
                <div className="ad-field">
                  <label className="ad-label">Date of Birth</label>
                  <input
                    className="ad-input"
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                  />
                </div>

                {/* Vehicle Type */}
                <div className="ad-field">
                  <label className="ad-label">
                    Vehicle Type <span className="ad-req">*</span>
                  </label>
                  <div className="ad-select-wrap">
                    <select
                      className={`ad-select ${errors.vehicleType ? "error" : ""}`}
                      name="vehicleType"
                      value={form.vehicleType}
                      onChange={handleChange}
                    >
                      <option value="">Enter Vehicle Type</option>
                      {VEHICLE_TYPES.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  {errors.vehicleType && (
                    <span className="ad-field-error">{errors.vehicleType}</span>
                  )}
                </div>

                {/* Vehicle Number */}
                <div className="ad-field">
                  <label className="ad-label">Vehicle Number</label>
                  <input
                    className="ad-input"
                    type="text"
                    name="vehicleNumber"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    placeholder="e.g. BR-01-AX-1234"
                  />
                </div>

                {/* Identity Type */}
                <div className="ad-field">
                  <label className="ad-label">
                    Identity Type <span className="ad-req">*</span>
                  </label>
                  <div className="ad-select-wrap">
                    <select
                      className={`ad-select ${errors.identityType ? "error" : ""}`}
                      name="identityType"
                      value={form.identityType}
                      onChange={handleChange}
                    >
                      <option value="">Select Identity Type</option>
                      {IDENTITY_TYPES.map((t) => (
                        <option key={t} value={t}>{t.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                  {errors.identityType && (
                    <span className="ad-field-error">{errors.identityType}</span>
                  )}
                </div>

                {/* Identity Number */}
                <div className="ad-field">
                  <label className="ad-label">
                    Identity Number <span className="ad-req">*</span>
                  </label>
                  <input
                    className={`ad-input ${errors.identityNumber ? "error" : ""}`}
                    type="text"
                    name="identityNumber"
                    value={form.identityNumber}
                    onChange={handleChange}
                    placeholder="Enter identity number"
                  />
                  {errors.identityNumber && (
                    <span className="ad-field-error">{errors.identityNumber}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="ad-submit-row">
              <button className="ad-btn-submit" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="ad-spinner" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && (
        <div className={`ad-toast ${toast.type}`}>
          <div className="ad-toast-icon">
            {toast.type === "success" ? "✓" : "✕"}
          </div>
          {toast.message}
        </div>
      )}
    </>
  );
}