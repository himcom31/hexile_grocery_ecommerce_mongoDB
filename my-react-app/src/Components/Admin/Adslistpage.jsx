import { useState, useRef, useEffect } from "react";

const API_BASE = "http://localhost:5000/api/ad";

export default function AdsListPage() {
  const [ads, setAds] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAd, setEditAd] = useState(null);
  const [form, setForm] = useState({ title: "", image: null, preview: "" });
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileRef = useRef();

  // Fetch all ads on mount
  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch(`${API_BASE}`);
      const data = await res.json();
      if (data.success) {
        setAds(data.ads);
      } else {
        alert(data.message || "Failed to fetch ads.");
      }
    } catch {
      alert("Could not connect to server.");
    } finally {
      setFetchLoading(false);
    }
  };

  const openEdit = (ad) => {
    setEditAd(ad);
    setForm({ title: ad.title, image: null, preview: ad.image });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditAd(null);
    setForm({ title: "", image: null, preview: "" });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditAd(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setForm((f) => ({ ...f, image: file, preview }));
  };

  const handleToggle = async (ad) => {
    // Optimistic update
    setAds((prev) =>
      prev.map((a) => (a._id === ad._id ? { ...a, isActive: !a.isActive } : a))
    );
    try {
      const res = await fetch(`${API_BASE}/${ad._id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setAds((prev) =>
          prev.map((a) => (a._id === ad._id ? { ...a, isActive: ad.isActive } : a))
        );
      }
    } catch {
      setAds((prev) =>
        prev.map((a) => (a._id === ad._id ? { ...a, isActive: ad.isActive } : a))
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAds((prev) => prev.filter((a) => a._id !== id));
      } else {
        alert(data.message || "Failed to delete ad.");
      }
    } catch {
      alert("Failed to delete ad.");
    }
    setDeleteConfirm(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert("Title is required.");
    if (!editAd && !form.image) return alert("Ad image is required.");
    setLoading(true);

    const formData = new FormData();
    formData.append("title", form.title);
    if (form.image) formData.append("image", form.image);

    try {
      if (editAd) {
        const res = await fetch(`${API_BASE}/${editAd._id}`, {
          method: "PUT",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setAds((prev) =>
            prev.map((a) => (a._id === editAd._id ? data.ad : a))
          );
          closeModal();
        } else {
          alert(data.message || "Failed to update ad.");
        }
      } else {
        const res = await fetch(`${API_BASE}/add`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          setAds((prev) => [data.ad, ...prev]);
          closeModal();
        } else {
          alert(data.message || "Failed to create ad.");
        }
      }
    } catch {
      alert("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-gray-800">
          Ads List{" "}
          <span className="text-sm font-normal text-gray-500">
            (max 2 ads show in home page)
          </span>
        </h1>
         
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-sm font-semibold text-gray-700 px-6 py-3 w-48">Thumbnail</th>
              <th className="text-left text-sm font-semibold text-gray-700 px-4 py-3">Title</th>
              <th className="text-left text-sm font-semibold text-gray-700 px-4 py-3 w-40">Status</th>
              <th className="text-left text-sm font-semibold text-gray-700 px-4 py-3 w-32">Action</th>
            </tr>
          </thead>
          <tbody>
            {fetchLoading ? (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading ads...
                  </div>
                </td>
              </tr>
            ) : ads.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-12 text-sm">
                  No ads found. Create one to get started.
                </td>
              </tr>
            ) : (
              ads.map((ad) => (
                <tr key={ad._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <img
                      src={ad.image}
                      alt={ad.title}
                      className="w-16 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{ad.title}</td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggle(ad)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        ad.isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                      aria-label={ad.isActive ? "Deactivate" : "Activate"}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                          ad.isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(ad)}
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(ad._id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* Edit / Create Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-800 font-medium text-base">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {editAd ? "Edit Ad" : "Create New Ad"}
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Enter ad title"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  <span className="text-gray-700">Ad </span>
                  <span className="text-blue-500 font-semibold">Ratio (400 × 250 px)</span>
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div
                  onClick={() => fileRef.current.click()}
                  className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-gray-300 transition-colors w-fit"
                >
                  {form.preview ? (
                    <img src={form.preview} alt="Preview" className="w-52 h-36 object-cover rounded" />
                  ) : (
                    <div className="w-52 h-36 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
                      <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs">Click to upload</span>
                      <span className="text-xs text-gray-300 mt-0.5">400 × 250 px</span>
                    </div>
                  )}
                </div>

                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                {form.preview && (
                  <button onClick={() => fileRef.current.click()} className="mt-2 text-xs text-blue-500 hover:underline">
                    Change image
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-sm font-medium px-8 py-2 rounded-lg transition-colors"
              >
                {loading ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">Delete this ad?</p>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}