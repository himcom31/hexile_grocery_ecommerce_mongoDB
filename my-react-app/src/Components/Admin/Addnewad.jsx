import { useState, useRef } from "react";

export default function AddNewAd() {
  const [title, setTitle] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      alert("Ad Image is required");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("image", image);

    // Get token from localStorage (adjust key name to match your app)
    const token = localStorage.getItem("adminToken");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/ad/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert("Advertisement added successfully!");
        setTitle("");
        setImage(null);
        setPreview(null);
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (err) {
      alert("Failed to submit: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <span style={styles.imageIcon}>🖼</span>
        <h2 style={styles.pageTitle}>Add New Ad</h2>
      </div>

      <div style={styles.card}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Title</label>
          <input
            type="text"
            placeholder="Enter Short Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.adLabel}>
            Ad{" "}
            <span style={styles.ratio}>Ratio (400 × 250 px)</span>{" "}
            <span style={styles.required}>*</span>
          </label>

          <div
            style={styles.imageBox}
            onClick={() => fileInputRef.current.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" style={styles.previewImg} />
            ) : (
              <div style={styles.placeholder}>
                <svg
                  width="60"
                  height="55"
                  viewBox="0 0 60 55"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="20" cy="14" r="7" fill="#9DB2BF" />
                  <path
                    d="M0 48 L18 28 L30 40 L42 26 L60 48 Z"
                    fill="#9DB2BF"
                  />
                </svg>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </div>
        </div>

        <div style={styles.submitRow}>
          <button
            style={{ ...styles.submitBtn, opacity: loading ? 0.75 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#f0f2f5",
    minHeight: "100vh",
    padding: "32px 40px",
    fontFamily: "'Segoe UI', sans-serif",
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  imageIcon: { fontSize: "20px" },
  pageTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "28px 32px 32px",
    maxWidth: "740px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
  },
  fieldGroup: { marginBottom: "22px" },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
  },
  adLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#111827",
    marginBottom: "10px",
  },
  ratio: { color: "#3b82f6", fontWeight: "600" },
  required: { color: "#ef4444", fontWeight: "700" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    color: "#374151",
    outline: "none",
    backgroundColor: "#fff",
  },
  imageBox: {
    width: "230px",
    height: "220px",
    borderRadius: "8px",
    backgroundColor: "#f3f4f6",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
  },
  placeholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImg: { width: "100%", height: "100%", objectFit: "cover" },
  submitRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "12px",
  },
  submitBtn: {
    backgroundColor: "#4caf72",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 48px",
    fontSize: "15px",
    fontWeight: "500",
    cursor: "pointer",
  },
};