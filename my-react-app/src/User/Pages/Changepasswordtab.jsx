import { useState } from "react";

// ─── Must be outside ChangePasswordTab to prevent remount on every keystroke ───
const PasswordField = ({ label, fieldKey, placeholder, value, showKey, showState, onToggleShow, onChange, onSubmit, errors }) => {
  const hasErr = !!errors[fieldKey];

  const strength = (() => {
    if (fieldKey !== "newPassword" || !value) return null;
    let score = 0;
    if (value.length >= 6)             score++;
    if (value.length >= 10)            score++;
    if (/[A-Z]/.test(value))           score++;
    if (/[0-9]/.test(value))           score++;
    if (/[^A-Za-z0-9]/.test(value))   score++;
    if (score <= 1) return { label: "Weak",   color: "#ef4444", width: "25%"  };
    if (score <= 2) return { label: "Fair",   color: "#f59e0b", width: "50%"  };
    if (score <= 3) return { label: "Good",   color: "#3b82f6", width: "75%"  };
    return            { label: "Strong", color: "#16a34a", width: "100%" };
  })();

  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8, display: "block" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={showState[showKey] ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(fieldKey, e.target.value)}
          onKeyDown={e => e.key === "Enter" && onSubmit()}
          style={{
            width: "100%", padding: "13px 46px 13px 16px",
            border: `1.5px solid ${hasErr ? "#ef4444" : "#e5e7eb"}`,
            borderRadius: 10, fontSize: 14, color: "#111",
            background: "#fff", fontFamily: "inherit",
            outline: "none", boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={e  => { if (!hasErr) e.target.style.borderColor = "#16a34a"; }}
          onBlur={e   => { e.target.style.borderColor = hasErr ? "#ef4444" : "#e5e7eb"; }}
        />
        <button
          type="button"
          onClick={() => onToggleShow(showKey)}
          style={{
            position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "#9ca3af", display: "flex", alignItems: "center", padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#374151"}
          onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}
        >
          {showState[showKey]
            ? <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
          }
        </button>
      </div>

      {strength && (
        <div style={{ marginTop: 6 }}>
          <div style={{ height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: strength.width, background: strength.color, borderRadius: 99, transition: "width 0.3s, background 0.3s" }} />
          </div>
          <div style={{ fontSize: 11, color: strength.color, fontWeight: 700, marginTop: 3 }}>{strength.label}</div>
        </div>
      )}

      {hasErr && (
        <div style={{ fontSize: 12, color: "#ef4444", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="#ef4444">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="#fff" strokeWidth="2"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="#fff" strokeWidth="2"/>
          </svg>
          {errors[fieldKey]}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function ChangePasswordTab({ onToast }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [show,   setShow]   = useState({ current: false, new: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  };

  const handleToggleShow = (key) => {
    setShow(s => ({ ...s, [key]: !s[key] }));
  };

  const validate = () => {
    const e = {};
    if (!form.currentPassword)
      e.currentPassword = "Current password is required";
    if (!form.newPassword)
      e.newPassword = "New password is required";
    else if (form.newPassword.length < 6)
      e.newPassword = "Password must be at least 6 characters";
    else if (form.newPassword === form.currentPassword)
      e.newPassword = "New password must be different from current password";
    if (!form.confirmPassword)
      e.confirmPassword = "Please confirm your new password";
    else if (form.confirmPassword !== form.newPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res  = await fetch("http://localhost:5000/api/user/change-password", {
        method:  "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${localStorage.getItem("userToken")}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword:     form.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onToast({ message: "Password updated successfully!", type: "success" });
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setErrors({});
      } else {
        if (data.message?.toLowerCase().includes("current")) {
          setErrors({ currentPassword: data.message });
        } else {
          onToast({ message: data.message || "Failed to update password", type: "error" });
        }
      }
    } catch {
      onToast({ message: "Network error. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const sharedProps = { showState: show, onToggleShow: handleToggleShow, onChange: handleChange, onSubmit: handleSubmit, errors };

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, fontSize: 13, color: "#9ca3af" }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        <span>Profile</span>
        <span style={{ color: "#d1d5db" }}>/</span>
        <span style={{ color: "#374151", fontWeight: 600 }}>Change Password</span>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 20px" }}>Change Password</h1>

      {/* Card */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", padding: "28px 28px 32px", maxWidth: 700, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid #f3f4f6" }}>
          Change Password
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PasswordField label="Current Password"    fieldKey="currentPassword" placeholder="Enter Current Password"      value={form.currentPassword} showKey="current" {...sharedProps} />
          <PasswordField label="Create New Password" fieldKey="newPassword"     placeholder="Enter New Password"          value={form.newPassword}     showKey="new"     {...sharedProps} />
          <PasswordField label="Confirm New Password" fieldKey="confirmPassword" placeholder="Confirm New Password"       value={form.confirmPassword} showKey="confirm" {...sharedProps} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            marginTop: 28, padding: "13px 36px",
            background: saving ? "#15803d" : "#16a34a",
            color: "#fff", border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 10,
            transition: "background 0.2s, transform 0.15s",
          }}
          onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
          onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {saving
            ? <><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.7s linear infinite" }}><path d="M12 2a10 10 0 0110 10" /></svg> Updating…</>
            : "Update Password"
          }
        </button>
      </div>
    </div>
  );
}