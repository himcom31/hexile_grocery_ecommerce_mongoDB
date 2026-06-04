import { useState, useRef, useEffect } from "react";
import { Camera, CheckCircle, User, Mail, Phone, Globe, Calendar, Users } from "lucide-react";

const API_BASE = "http://localhost:5000/api/user";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh",
  "Belgium","Brazil","Canada","Chile","China","Colombia","Croatia","Czech Republic",
  "Denmark","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","Hungary",
  "India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Japan","Jordan",
  "Kenya","Malaysia","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway",
  "Pakistan","Peru","Philippines","Poland","Portugal","Romania","Russia","Saudi Arabia",
  "South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland","Thailand",
  "Turkey","Ukraine","United Arab Emirates","United Kingdom","United States","Vietnam",
];

// ─── Toast ─────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:24, left:"50%",
      transform:"translateX(-50%)",
      background: type === "error" ? "#ef4444" : "#16a34a",
      color:"#fff", padding:"12px 22px", borderRadius:40,
      boxShadow:"0 8px 28px rgba(0,0,0,.22)",
      fontSize:13, fontWeight:600, zIndex:9999,
      whiteSpace:"nowrap", animation:"toastUp .3s ease",
      display:"flex", alignItems:"center", gap:8,
      maxWidth:"calc(100vw - 32px)",
      boxSizing:"border-box",
    }}>
      {msg}
    </div>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────
function Field({ label, icon: Icon, badge, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{
        fontSize:11, fontWeight:700, color:"#64748b",
        letterSpacing:.5, textTransform:"uppercase",
        display:"flex", alignItems:"center",
        justifyContent:"space-between", gap:6,
      }}>
        <span style={{ display:"flex", alignItems:"center", gap:5 }}>
          {Icon && <Icon size={11} />}
          {label}
        </span>
        {badge}
      </label>
      {children}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span style={{
      display:"flex", alignItems:"center", gap:3,
      fontSize:10, color:"#22c55e", fontWeight:700,
      background:"#f0fdf4", border:"1px solid #bbf7d0",
      padding:"2px 8px", borderRadius:20, whiteSpace:"nowrap",
    }}>
      <CheckCircle size={10} /> Verified
    </span>
  );
}

// ─── Shared input style ────────────────────────────────────────────────────
const inp = {
  width:"100%", padding:"12px 14px",
  border:"1.5px solid #e2e8f0", borderRadius:10,
  fontSize:14, color:"#1e293b", background:"#fff",
  outline:"none", fontFamily:"inherit",
  transition:"border-color .2s, box-shadow .2s",
  boxSizing:"border-box",
  WebkitAppearance:"none", appearance:"none",
  minHeight:46,
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function UserProfile() {
  const token = localStorage.getItem("userToken") || "";

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState({ msg:"", type:"success" });
  const fileRef = useRef();

  const [form, setForm] = useState({
    fullName:"", country:"", phone:"", gender:"",
    dateOfBirth:"", email:"", avatar:"",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:"", type:"success" }), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/me`, {
          headers:{ Authorization:`Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const u = data.user;
          setForm({
            fullName:    u.fullName    || "",
            country:     u.country     || "",
            phone:       u.phone       || "",
            gender:      u.gender      || "",
            dateOfBirth: u.dateOfBirth ? u.dateOfBirth.slice(0,10) : "",
            email:       u.email       || "",
            avatar:      u.avatar      || "",
          });
        }
      } catch {
        showToast("Failed to load profile", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, avatar: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/update-profile`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          fullName:    form.fullName,
          country:     form.country,
          phone:       form.phone,
          gender:      form.gender,
          dateOfBirth: form.dateOfBirth,
          avatar:      form.avatar,
        }),
      });
      const data = await res.json();
      if (!data.success) return showToast(data.message, "error");
      showToast("✓ Profile updated successfully!");
    } catch {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  const initials = form.fullName
    ? form.fullName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()
    : "U";

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300 }}>
      <div style={{
        width:34, height:34, border:"3px solid #e2e8f0",
        borderTopColor:"#22c55e", borderRadius:"50%",
        animation:"spin 1s linear infinite",
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{
      maxWidth:680, margin:"0 auto",
      padding:"16px 12px 60px",
      fontFamily:"'DM Sans','Segoe UI',sans-serif",
      boxSizing:"border-box", width:"100%",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes toastUp {
          from { opacity:0; transform:translateX(-50%) translateY(16px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }

        input:focus, select:focus {
          border-color: #22c55e !important;
          box-shadow: 0 0 0 3px rgba(34,197,94,.14) !important;
          outline: none;
        }

        /* ── Responsive grid for form fields ── */
        .up-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 480px) {
          .up-grid { grid-template-columns: 1fr 1fr; gap: 16px 14px; }
        }

        /* ── Avatar row: stack on very small screens ── */
        .up-avatar-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* ── Save button: full width on mobile, auto on larger ── */
        .up-save-btn {
          width: 100%;
          padding: 14px 32px;
        }
        @media (min-width: 480px) {
          .up-save-btn { width: auto; }
        }

        /* ── Card inner padding ── */
        .up-card { padding: 18px 16px; }
        @media (min-width: 480px) { .up-card { padding: 22px 20px; } }
        @media (min-width: 640px) { .up-card { padding: 28px 28px; } }

        /* ── Section label ── */
        .up-section-label {
          font-size: 11px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase;
          color: #16a34a; margin-bottom: 20px;
        }

        /* ── Page header ── */
        .up-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 10px;
        }

        /* ── Phone prefix + input ── */
        .up-phone-wrap {
          display: flex;
          width: 100%;
        }
        .up-phone-prefix {
          padding: 12px 10px;
          background: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          border-right: none;
          border-radius: 10px 0 0 10px;
          font-size: 13px;
          color: #64748b;
          white-space: nowrap;
          display: flex;
          align-items: center;
          min-height: 46px;
          flex-shrink: 0;
        }
        .up-phone-input {
          border-radius: 0 10px 10px 0 !important;
          border-left: none !important;
          flex: 1;
          min-width: 0;
        }

        /* ── Select arrow ── */
        .up-select-wrap { position: relative; }
        .up-select-arrow {
          position: absolute; right: 13px; top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #94a3b8;
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="up-page-header">
        <div>
          <h2 style={{
            margin:0,
            fontSize:"clamp(18px,5vw,24px)",
            fontWeight:700, color:"#0f172a", lineHeight:1.2,
          }}>
            My Profile
          </h2>
          <p style={{ margin:"4px 0 0", fontSize:13, color:"#64748b" }}>
            Manage your personal information
          </p>
        </div>
        <span style={{
          display:"flex", alignItems:"center", gap:5,
          background:"#f0fdf4", border:"1.5px solid #bbf7d0",
          borderRadius:20, padding:"6px 12px",
          fontSize:11, fontWeight:700, color:"#16a34a",
          whiteSpace:"nowrap", flexShrink:0, marginTop:2,
        }}>
          <CheckCircle size={12} /> Verified
        </span>
      </div>

      {/* ── Avatar Card ── */}
      <div className="up-card" style={{
        background:"#fff", borderRadius:16,
        boxShadow:"0 1px 4px rgba(0,0,0,.05),0 4px 16px rgba(0,0,0,.06)",
        marginBottom:12, animation:"fadeUp .3s ease",
      }}>
        <div className="up-avatar-row">
          {/* Avatar ring */}
          <div style={{ flexShrink:0 }}>
            <div style={{
              width:80, height:80, borderRadius:"50%",
              background:"linear-gradient(135deg,#bbf7d0,#4ade80)",
              padding:3, boxShadow:"0 4px 14px rgba(34,197,94,.25)",
              flexShrink:0,
            }}>
              <div style={{
                width:"100%", height:"100%", borderRadius:"50%",
                background:"#f0fdf4", overflow:"hidden",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:24, fontWeight:700, color:"#16a34a",
                border:"2px solid #fff",
              }}>
                {form.avatar
                  ? <img src={form.avatar} alt="avatar"
                      style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <span>{initials}</span>
                }
              </div>
            </div>
          </div>

          {/* Name + email + button */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{
              fontSize:"clamp(14px,4vw,17px)", fontWeight:700,
              color:"#0f172a", overflow:"hidden",
              textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>
              {form.fullName || "Your Name"}
            </div>
            <div style={{
              fontSize:12, color:"#64748b", marginTop:2,
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            }}>
              {form.email || "email@example.com"}
            </div>
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ display:"none" }} onChange={handleFile}
            />
            <button
              onClick={() => fileRef.current.click()}
              style={{
                marginTop:10,
                display:"inline-flex", alignItems:"center", gap:6,
                background:"#0f172a", color:"#fff", border:"none",
                borderRadius:9, padding:"9px 16px",
                fontSize:12, fontWeight:600, cursor:"pointer",
                fontFamily:"inherit", letterSpacing:.2,
                transition:"background .2s",
                whiteSpace:"nowrap",
              }}
              onMouseOver={e => e.currentTarget.style.background="#334155"}
              onMouseOut={e => e.currentTarget.style.background="#0f172a"}
            >
              <Camera size={13} /> Change Photo
            </button>
          </div>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="up-card" style={{
        background:"#fff", borderRadius:16,
        boxShadow:"0 1px 4px rgba(0,0,0,.05),0 4px 16px rgba(0,0,0,.06)",
        animation:"fadeUp .35s ease .05s both",
      }}>
        <p className="up-section-label">Personal Information</p>

        <div className="up-grid">

          {/* Full Name */}
          <Field label="Full Name" icon={User}>
            <input
              name="fullName" value={form.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
              style={inp}
            />
          </Field>

          {/* Country */}
          <Field label="Country" icon={Globe}>
            <div className="up-select-wrap">
              <select name="country" value={form.country}
                onChange={handleChange}
                style={{ ...inp, paddingRight:36, cursor:"pointer" }}>
                <option value="">Select Country</option>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <span className="up-select-arrow" />
            </div>
          </Field>

          {/* Phone */}
          <Field label="Mobile Number" icon={Phone}>
            <div className="up-phone-wrap">
              <span className="up-phone-prefix">+00</span>
              <input
                name="phone" value={form.phone}
                onChange={handleChange}
                placeholder="Mobile number"
                type="tel"
                className="up-phone-input"
                style={{ ...inp }}
              />
            </div>
          </Field>

          {/* Gender */}
          <Field label="Gender" icon={Users}>
            <div className="up-select-wrap">
              <select name="gender" value={form.gender}
                onChange={handleChange}
                style={{ ...inp, paddingRight:36, cursor:"pointer" }}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <span className="up-select-arrow" />
            </div>
          </Field>

          {/* Date of Birth */}
          <Field label="Date of Birth" icon={Calendar}>
            <input
              type="date" name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              style={inp}
            />
          </Field>

          {/* Email — read only */}
          <Field label="Email Address" icon={Mail} badge={<VerifiedBadge />}>
            <input
              name="email" value={form.email}
              readOnly
              style={{
                ...inp,
                background:"#f8fafc", color:"#94a3b8",
                cursor:"not-allowed",
              }}
            />
          </Field>

        </div>

        {/* ── Save Button ── */}
        <div style={{ marginTop:24 }}>
          <button
            className="up-save-btn"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "#86efac" : "#22c55e",
              color:"#fff", border:"none", borderRadius:10,
              fontSize:14, fontWeight:700,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily:"inherit", letterSpacing:.3,
              transition:"background .2s, transform .15s, box-shadow .2s",
              display:"flex", alignItems:"center",
              justifyContent:"center", gap:8,
              minHeight:48,
            }}
            onMouseOver={e => {
              if (!saving) {
                e.currentTarget.style.background="#16a34a";
                e.currentTarget.style.transform="translateY(-1px)";
                e.currentTarget.style.boxShadow="0 6px 18px rgba(34,197,94,.35)";
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = saving ? "#86efac" : "#22c55e";
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.boxShadow="none";
            }}
          >
            {saving
              ? <><div style={{
                  width:16, height:16, border:"2.5px solid rgba(255,255,255,.4)",
                  borderTopColor:"#fff", borderRadius:"50%",
                  animation:"spin 0.7s linear infinite",
                }}/> Saving…</>
              : <><CheckCircle size={15}/> Update Profile</>
            }
          </button>
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}