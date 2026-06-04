import { useState, useEffect, useRef } from "react";
import axios from "axios";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const token = () => localStorage.getItem("adminToken");
const authHeaders = () => ({ Authorization: `Bearer ${token()}` });

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #ddd",
  borderRadius: 8,
  fontSize: 14,
  color: "#333",
  background: "#fff",
  boxSizing: "border-box",
  outline: "none",
};

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: "#333",
  marginBottom: 6,
  display: "block",
};

const Req = () => <span style={{ color: "#e53935" }}> *</span>;

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 48,
        height: 26,
        borderRadius: 13,
        background: checked ? "#4CAF50" : "#ccc",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          background: "#fff",
          borderRadius: "50%",
          position: "absolute",
          top: 3,
          left: checked ? 25 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

// ─── Info Field (used in View page) ───────────────────────────────────────────

function InfoField({ label, value }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <p style={{ fontSize: 12, color: "#888", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <div style={{ fontSize: 15, fontWeight: 500, color: "#222" }}>{value || "—"}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — All Drivers List
// ══════════════════════════════════════════════════════════════════════════════

function AllDrivers({ onView, onEdit, onCreate }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filter, setFilter] = useState("Approved");

  const fetchDrivers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data } = await axios.get("http://localhost:5000/api/driver/all", { headers: authHeaders() });
      // Guard: API may return { drivers: [...] } or { data: [...] } or just [...]
      const list = Array.isArray(data) ? data : Array.isArray(data.drivers) ? data.drivers : [];
      setDrivers(list);
    } catch (err) {
      console.error("Failed to fetch drivers:", err);
      setFetchError(err.response?.data?.message || "Failed to load drivers.");
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleToggle = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/api/driver/status/${id}`, {}, { headers: authHeaders() });
      fetchDrivers();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  return (
    <div style={{ padding: "24px", background: "#f5f6fa", minHeight: "100vh" }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 20 }}>All Drivers</h2>

      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>All Drivers</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={onCreate}
              style={{ background: "#4CAF50", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
            >
              + Create New
            </button>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ border: "1px solid #ddd", borderRadius: 8, padding: "10px 14px", fontSize: 14, background: "#fff", cursor: "pointer" }}
            >
              <option>Approved</option>
              <option>Pending</option>
              <option>Blocked</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              {["SL.", "Profile", "Name", "Phone", "Status", "Action"].map((h) => (
                <th key={h} style={{ padding: "14px 24px", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#333", borderBottom: "1px solid #f0f0f0" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading...</td></tr>
            ) : fetchError ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#e53935" }}>{fetchError}</td></tr>
            ) : drivers.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#888" }}>No drivers found.</td></tr>
            ) : (
              drivers.map((driver, index) => (
                <tr key={driver._id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <td style={{ padding: "16px 24px", fontSize: 14 }}>{index + 1}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <img
                      src={driver.profileImage || "https://via.placeholder.com/40"}
                      alt={driver.fullName}
                      style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                    />
                  </td>
                  <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 500 }}>{driver.fullName}</td>
                  <td style={{ padding: "16px 24px", fontSize: 14, color: "#555" }}>{driver.phone}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <ToggleSwitch checked={driver.isOnline} onChange={() => handleToggle(driver._id)} />
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      {/* View */}
                      <button
                        onClick={() => onView(driver._id)}
                        title="View Driver"
                        style={{ background: "#e8f5e9", border: "none", borderRadius: 6, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}
                      >
                        👁
                      </button>
                      {/* Edit */}
                      <button
                        onClick={() => onEdit(driver._id)}
                        title="Edit Driver"
                        style={{ background: "#e3f2fd", border: "none", borderRadius: 6, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}
                      >
                        ✏️
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
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — View Driver
// ══════════════════════════════════════════════════════════════════════════════

function ViewDriver({ driverId, onBack, onEdit }) {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/driver/${driverId}`, { headers: authHeaders() });
        setDriver(data.driver);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch driver");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [driverId]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, color: "red" }}>{error}</div>;
  if (!driver) return null;

  return (
    <div style={{ padding: "24px", background: "#f5f6fa", minHeight: "100vh" }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        👤 Driver Details
      </h2>

      <div style={{ background: "#fff", borderRadius: 12, padding: 32, maxWidth: 900 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid #f0f0f0", flexWrap: "wrap" }}>
          <img
            src={driver.profileImage || "https://via.placeholder.com/100"}
            alt={driver.fullName}
            style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid #e8f5e9", flexShrink: 0 }}
          />
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{driver.fullName}</h3>
            <span style={{
              background: driver.isActive ? "#e8f5e9" : "#fce4e4",
              color: driver.isActive ? "#2e7d32" : "#c62828",
              padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
            }}>
              {driver.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => onEdit(driver._id)}
              style={{ background: "#4CAF50", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
            >
              ✏️ Edit Driver
            </button>
            <button
              onClick={onBack}
              style={{ background: "#fff", color: "#555", border: "1px solid #ddd", borderRadius: 8, padding: "10px 22px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 40px" }}>
          <InfoField label="Full Name" value={driver.fullName} />
          <InfoField label="Email" value={driver.email} />
          <InfoField label="Phone Number" value={driver.phone} />
          <InfoField label="Gender" value={driver.gender} />

          <InfoField
            label="Date of Birth"
            value={
              driver.dateOfBirth
                ? (() => {
                    const parts = driver.dateOfBirth.split("-");
                    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                    return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
                  })()
                : "—"
            }
          />

          <InfoField label="Driving License" value={driver.drivingLicense} />

          <InfoField
            label="Password"
            value={
              driver.password
                ? <span style={{ fontFamily: "monospace", fontSize: 14, letterSpacing: 1, color: "#333" }}>{driver.password}</span>
                : "—"
            }
          />

          <InfoField label="Vehicle Type" value={driver.vehicleType} />
          <InfoField label="Vehicle Number" value={driver.vehicleNumber} />
          <InfoField label="Identity Type" value={driver.identityType} />
          <InfoField label="Identity Number" value={driver.identityNumber} />
          <InfoField label="Total Orders Delivered" value={driver.totalOrdersDelivered} />
          <InfoField label="Total Earnings" value={`₹${driver.totalEarnings}`} />
          <InfoField label="Rating" value={`⭐ ${driver.rating} / 5`} />
          <InfoField
            label="Online Status"
            value={
              <span style={{ background: driver.isOnline ? "#e8f5e9" : "#f5f5f5", color: driver.isOnline ? "#2e7d32" : "#888", padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                {driver.isOnline ? "Online" : "Offline"}
              </span>
            }
          />
          <InfoField label="Joined" value={new Date(driver.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE 3 — Create / Edit Driver Form
// ══════════════════════════════════════════════════════════════════════════════

function DriverForm({ driverId, onBack }) {
  const isEdit = Boolean(driverId);
  const fileInputRef = useRef();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", email: "",
    gender: "Male", drivingLicense: "", password: "", confirmPassword: "",
    vehicleType: "", vehicleNumber: "", identityType: "Aadhar",
    identityNumber: "", dateOfBirth: "",
  });

  useEffect(() => {
    if (!isEdit) return;
    const fetch = async () => {
      try {
        const { data } = await axios.get(`http://localhost:5000/api/driver/${driverId}`, { headers: authHeaders() });
        const d = data.driver;
        const parts = (d.fullName || "").split(" ");
        setForm({
          firstName: parts[0] || "",
          lastName: parts.slice(1).join(" "),
          phone: d.phone || "",
          email: d.email || "",
          gender: d.gender || "Male",
          drivingLicense: d.drivingLicense || "",
          password: d.password || "",         // ✅ pre-fill real password from DB
          confirmPassword: d.password || "",   // ✅ pre-fill confirm too
          vehicleType: d.vehicleType || "",
          vehicleNumber: d.vehicleNumber || "",
          identityType: d.identityType || "Aadhar",
          identityNumber: d.identityNumber || "",
          dateOfBirth: d.dateOfBirth || "",    // ✅ plain "YYYY-MM-DD" string — no substring needed
        });
        if (d.profileImage) setPreviewImage(d.profileImage);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load driver");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [driverId]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.phone || !form.vehicleType) return alert("Please fill in all required fields.");
    if (form.password && form.password !== form.confirmPassword) return alert("Passwords do not match.");

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("fullName", `${form.firstName} ${form.lastName}`.trim());
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("gender", form.gender);
      fd.append("vehicleType", form.vehicleType);
      fd.append("vehicleNumber", form.vehicleNumber);
      fd.append("identityType", form.identityType);
      fd.append("identityNumber", form.identityNumber || form.drivingLicense);
      fd.append("drivingLicense", form.drivingLicense);
      fd.append("dob", form.dateOfBirth);     // ✅ key must be "dob" — matches controller
      fd.append("password", form.password);   // ✅ always send plain password
      if (imageFile) fd.append("profileImage", imageFile);

      if (isEdit) {
        await axios.put(`http://localhost:5000/api/driver/${driverId}`, fd, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
        alert("Driver updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/driver/add", fd, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
        alert("Driver created successfully!");
      }
      onBack();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading driver data...</div>;
  if (error) return <div style={{ padding: 40, color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: "24px", background: "#f5f6fa", minHeight: "100vh" }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <h2 style={{ fontWeight: 700, fontSize: 22, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
          👤 {isEdit ? "Update Driver" : "Create New Driver"}
        </h2>
        <button
          onClick={onBack}
          style={{ background: "#fff", color: "#555", border: "1px solid #ddd", borderRadius: 8, padding: "9px 20px", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
        >
          ← Back
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 32 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: "#333", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
          👤 User Information
        </p>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
          {/* LEFT */}
          <div>
            {/* First + Last Name */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>First Name <Req /></label>
                <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Enter first name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Enter last name" style={inputStyle} />
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Phone Number <Req /></label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="Enter phone number" style={inputStyle} />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Email</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="Enter Email Address" style={inputStyle} />
            </div>

            {/* Gender */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>

            {/* Driving License */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Driving License</label>
              <input name="drivingLicense" value={form.drivingLicense} onChange={handleChange} placeholder="Enter License" style={inputStyle} />
            </div>

            {/* Password + Confirm */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Password {!isEdit && <Req />}</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter Password" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirm Password {!isEdit && <Req />}</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Enter Confirm Password" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            {/* Profile Photo */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                Profile Photo{" "}
                <span style={{ color: "#1976d2", fontWeight: 400 }}>Ratio 1:1 (500 × 500 px)</span>{" "}
                <Req />
              </p>
              <div
                onClick={() => fileInputRef.current.click()}
                style={{
                  width: "100%", height: 200, background: "#f5f5f5", borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", overflow: "hidden", border: "1px dashed #ccc",
                }}
              >
                {previewImage
                  ? <img src={previewImage} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ color: "#aaa", fontSize: 14 }}>500 × 500</span>}
              </div>
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: "none" }} onChange={handleImageChange} />
              <p style={{ fontSize: 12, color: "#888", marginTop: 6 }}>Supported formats: jpg, jpeg, png</p>
            </div>

            {/* Date of Birth */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} style={inputStyle} />
            </div>

            {/* Vehicle Type */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Vehicle Type <Req /></label>
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange} style={inputStyle}>
                <option value="">Enter Vehicle Type</option>
                <option>Bike</option>
                <option>Scooter</option>
                <option>Cycle</option>
                <option>Mini Truck</option>
              </select>
            </div>

            {/* Vehicle Number */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Vehicle Number</label>
              <input name="vehicleNumber" value={form.vehicleNumber} onChange={handleChange} placeholder="e.g. BR-01-AX-1234" style={inputStyle} />
            </div>

            {/* Identity Type */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Identity Type <Req /></label>
              <select name="identityType" value={form.identityType} onChange={handleChange} style={inputStyle}>
                <option>Aadhar</option>
                <option>Driving_License</option>
                <option>PAN</option>
              </select>
            </div>

            {/* Identity Number */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Identity Number <Req /></label>
              <input name="identityNumber" value={form.identityNumber} onChange={handleChange} placeholder="Enter Identity Number" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              background: "#4CAF50", color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 40px", fontWeight: 700, fontSize: 15,
              cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT — Page router (no React Router needed)
// ══════════════════════════════════════════════════════════════════════════════

export default function Drivers() {
  // page: "list" | "view" | "form"
  const [page, setPage] = useState("list");
  const [selectedId, setSelectedId] = useState(null);

  const goList   = ()  => { setPage("list");  setSelectedId(null); };
  const goView   = (id) => { setPage("view");  setSelectedId(id);  };
  const goEdit   = (id) => { setPage("form");  setSelectedId(id);  };
  const goCreate = ()  => { setPage("form");  setSelectedId(null); };

  if (page === "list") {
    return <AllDrivers onView={goView} onEdit={goEdit} onCreate={goCreate} />;
  }
  if (page === "view") {
    return <ViewDriver driverId={selectedId} onBack={goList} onEdit={goEdit} />;
  }
  if (page === "form") {
    return <DriverForm driverId={selectedId} onBack={goList} />;
  }
  return null;
}