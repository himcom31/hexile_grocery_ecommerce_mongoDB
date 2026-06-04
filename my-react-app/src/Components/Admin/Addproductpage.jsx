import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:5000/api/products";
const getToken = () => localStorage.getItem("adminToken") || "";

async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
}

// ─── Tiny helpers ──────────────────────────────────────────────
function Label({ children, required }) {
    return (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {children} {required && <span className="text-red-500">*</span>}
        </label>
    );
}

function Input({ className = "", ...props }) {
    return (
        <input
            className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-gray-400 transition ${className}`}
            {...props}
        />
    );
}

function Textarea({ className = "", ...props }) {
    return (
        <textarea
            className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-gray-400 transition resize-y ${className}`}
            {...props}
        />
    );
}

function Select({ className = "", children, ...props }) {
    return (
        <select
            className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-gray-700 transition ${className}`}
            {...props}
        >
            {children}
        </select>
    );
}

function SectionCard({ title, children, icon }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                {icon && <span className="text-emerald-500">{icon}</span>}
                <h2 className="text-sm font-bold text-gray-800 tracking-tight">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
    );
}

function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div
            style={{ animation: "toastIn 0.2s ease-out" }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}
        >
            {toast.type === "error" ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            )}
            {toast.msg}
        </div>
    );
}

// ─── Rich Text Toolbar ─────────────────────────────────────────
const TOOLBAR_BUTTONS = [
    { label: "B", title: "Bold", cmd: "bold" },
    { label: "I", title: "Italic", cmd: "italic" },
    { label: "U", title: "Underline", cmd: "underline" },
    { label: "S", title: "Strikethrough", cmd: "strikeThrough" },
];

function RichEditor({ value, onChange }) {
    const editorRef = useRef(null);

    // Sync initial value into the contentEditable only once on mount
    useEffect(() => {
        if (editorRef.current && value && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function execCmd(cmd) {
        editorRef.current?.focus();
        document.execCommand(cmd, false, null);
        onChange(editorRef.current?.innerHTML || "");
    }

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-transparent transition">
            <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-100 flex-wrap">
                <select className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white mr-1 focus:outline-none">
                    <option>Normal</option><option>H1</option><option>H2</option><option>H3</option>
                </select>
                <select className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white mr-2 focus:outline-none">
                    <option>Sans Serif</option><option>Serif</option><option>Monospace</option>
                </select>
                {TOOLBAR_BUTTONS.map((btn) => (
                    <button
                        key={btn.cmd}
                        type="button"
                        title={btn.title}
                        onClick={() => execCmd(btn.cmd)}
                        className={`h-7 w-7 flex items-center justify-center rounded text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors ${btn.label === "B" ? "font-black" : btn.label === "I" ? "italic" : btn.label === "U" ? "underline" : "line-through"}`}
                    >
                        {btn.label}
                    </button>
                ))}
                <div className="w-px h-5 bg-gray-200 mx-1" />
                {[{ title: "UL", icon: "≡" }, { title: "OL", icon: "1≡" }].map((b) => (
                    <button key={b.title} type="button" title={b.title} className="h-7 w-7 flex items-center justify-center rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors">{b.icon}</button>
                ))}
                <div className="w-px h-5 bg-gray-200 mx-1" />
                {["🔗", "🖼", "📋", "f(x)"].map((ic) => (
                    <button key={ic} type="button" className="h-7 px-1.5 flex items-center justify-center rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors">{ic}</button>
                ))}
            </div>
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                className="min-h-[100px] px-4 py-3 text-sm text-gray-700 focus:outline-none"
                data-placeholder="Enter product description…"
                style={{ lineHeight: "1.6" }}
            />
        </div>
    );
}

// ─── Image Drop Zone ──────────────────────────────────────────
function ImageDropzone({ label, hint, multiple = false, onChange, maxFiles = 1, existingUrls = [] }) {
    const [previews, setPreviews] = useState(existingUrls);
    const inputRef = useRef();

    // Sync existingUrls when prop changes (edit mode)
    useEffect(() => {
        if (existingUrls.length > 0) setPreviews(existingUrls);
    }, [existingUrls.join(',')]);

    function handleFiles(files) {
        const arr = Array.from(files).slice(0, maxFiles);
        const urls = arr.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        onChange(multiple ? arr : arr[0]);
    }

    function handleDrop(e) {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    }

    return (
        <div>
            <Label>{label} {hint && <span className="text-blue-500 font-normal ml-1">({hint})</span>} <span className="text-red-500">*</span></Label>
            <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => inputRef.current.click()} className="relative group flex flex-wrap gap-3 cursor-pointer">
                {previews.length === 0 ? (
                    <div className="h-24 w-24 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-300 hover:border-emerald-400 hover:text-emerald-400 transition-colors bg-gray-50">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                        </svg>
                    </div>
                ) : (
                    previews.map((url, i) => (
                        <div key={i} className="relative h-24 w-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <img src={url} alt="" className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); const next = previews.filter((_, j) => j !== i); setPreviews(next); if (!multiple) onChange(null); }}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shadow"
                            >×</button>
                        </div>
                    ))
                )}
                {multiple && previews.length < maxFiles && previews.length > 0 && (
                    <div className="h-24 w-24 border-2 border-dashed border-emerald-300 rounded-xl flex items-center justify-center text-emerald-400 text-2xl hover:bg-emerald-50 transition-colors">+</div>
                )}
                <input ref={inputRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </div>
        </div>
    );
}

// ─── Meta Keywords tag input ──────────────────────────────────
function TagInput({ tags, onChange }) {
    const [input, setInput] = useState("");

    function addTag(e) {
        if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            if (!tags.includes(input.trim())) onChange([...tags, input.trim()]);
            setInput("");
        }
    }

    function removeTag(t) { onChange(tags.filter((x) => x !== t)); }

    return (
        <div className="min-h-[40px] flex flex-wrap gap-1.5 items-center px-3 py-2 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-transparent transition">
            {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full ring-1 ring-emerald-200">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="text-emerald-400 hover:text-emerald-600 text-sm leading-none">×</button>
                </span>
            ))}
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={addTag}
                placeholder={tags.length === 0 ? "Write keywords and Press enter to add new one" : ""}
                className="flex-1 min-w-[140px] text-sm focus:outline-none placeholder-gray-400 bg-transparent"
            />
        </div>
    );
}

// ─── Helper: safely resolve an id or populated object to an id string ───
function resolveId(field) {
    if (!field) return "";
    if (typeof field === "object" && field._id) return field._id;
    return field;
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
/**
 * Props:
 *   existingProduct  – product object from the list (edit mode). Omit for add mode.
 *   onSaved          – callback after a successful add or update
 *   onCancel         – callback when the user clicks Back / Cancel (edit mode only)
 */
export default function AddProductPage({ existingProduct = null, onSaved, onCancel }) {
    const isEditMode = Boolean(existingProduct);

    // ── Form state ────────────────────────────────────────────
    const [name, setName]               = useState("");
    const [slug, setSlug]               = useState("");
    const [shortDesc, setShortDesc]     = useState("");
    const [description, setDescription] = useState("");

    const [brand, setBrand]             = useState("");
    const [unit, setUnit]               = useState("");
    const [sku, setSku]                 = useState(String(Math.floor(100000 + Math.random() * 900000)));
    const [selectedCategories, setSelectedCategories] = useState([]);

    const [buyingPrice, setBuyingPrice]   = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("0");
    const [stockQty, setStockQty]         = useState("");
    const [minOrderQty, setMinOrderQty]   = useState("1");

    const [thumbnail, setThumbnail]           = useState(null);           // new File or null
    const [existingThumbnail, setExistingThumbnail] = useState("");       // current URL in edit mode
    const [additionalImages, setAdditionalImages] = useState([]);
    const [existingAdditional, setExistingAdditional] = useState([]);
    const [videoType, setVideoType] = useState("Upload Video File");
    const [videoFile, setVideoFile] = useState(null);

    const [metaTitle, setMetaTitle]       = useState("");
    const [metaDesc, setMetaDesc]         = useState("");
    const [metaKeywords, setMetaKeywords] = useState([]);

    const [brands, setBrands]               = useState([]);
    const [categories, setCategories]       = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [submitting, setSubmitting]       = useState(false);
    const [toast, setToast]                 = useState(null);
    const [attributes, setAttributes]       = useState([]);

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    // ── Pre-fill form when in edit mode ───────────────────────
    useEffect(() => {
        if (!existingProduct) return;
        const p = existingProduct;
        setName(p.name || "");
        setSlug(p.slug || "");
        setShortDesc(p.shortDescription || "");
        setDescription(p.description || "");
        setBrand(resolveId(p.brand));
        setUnit(p.unit || "");
        setSku(p.sku || "");
        // Category: might be a single id/object or an array
        const catId = resolveId(p.category);
        setSelectedCategories(catId ? [catId] : []);
        setBuyingPrice(p.buyingPrice ?? "");
        setSellingPrice(p.sellingPrice ?? p.price ?? "");
        setDiscountPrice(p.discountPrice ?? "0");
        setStockQty(p.stockQuantity ?? "");
        setMinOrderQty(p.minOrderQuantity ?? "1");
        setExistingThumbnail(p.thumbnail || "");
        setExistingAdditional(p.additionalImages || []);
        setMetaTitle(p.metaTitle || "");
        setMetaDesc(p.metaDescription || "");
        setMetaKeywords(
            Array.isArray(p.metaKeywords)
                ? p.metaKeywords
                : typeof p.metaKeywords === "string"
                    ? JSON.parse(p.metaKeywords || "[]")
                    : []
        );
        setAttributes(Array.isArray(p.attributes) ? p.attributes : []);
    }, [existingProduct]);

    // Auto-slug from name (only in add mode, don't overwrite existing slug while editing)
    useEffect(() => {
        if (!isEditMode) {
            setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
        }
    }, [name, isEditMode]);

    // Load brands
    useEffect(() => {
        apiFetch("/brand/all").then((d) => setBrands(d.brands || [])).catch(() => { });
    }, []);

    // Load categories
    useEffect(() => {
        fetch(`http://localhost:5000/api/Category/all`, {
            headers: { Authorization: `Bearer ${getToken()}` },
        })
            .then((r) => r.json())
            .then((d) => setCategories(d.categories || d.data || d || []))
            .catch(() => { })
            .finally(() => setCategoriesLoading(false));
    }, []);

    function generateSku() { setSku(String(Math.floor(100000 + Math.random() * 900000))); }

    function handleAttributeChange(key, value) {
        setAttributes(prev => {
            const existing = prev.find(a => a.key === key);
            if (existing) return prev.map(a => a.key === key ? { key, value } : a);
            return [...prev, { key, value }];
        });
    }

    function toggleCategory(id) {
        setSelectedCategories((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    }

    // ── Submit (add or update) ────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();

        // In add mode, require a new thumbnail; in edit mode it's optional (keep existing)
        if (!isEditMode && !thumbnail) return showToast("Thumbnail image is required", "error");
        if (selectedCategories.length === 0) return showToast("Please select at least one category", "error");

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("name", name);
            fd.append("slug", slug);
            fd.append("shortDescription", shortDesc);
            fd.append("description", description);
            fd.append("brand", brand);
            fd.append("unit", unit);
            fd.append("sku", sku);
            fd.append("category", selectedCategories[0]);
            fd.append("buyingPrice", buyingPrice);
            fd.append("sellingPrice", sellingPrice);
            fd.append("discountPrice", discountPrice || 0);
            fd.append("stockQuantity", stockQty);
            fd.append("minOrderQuantity", minOrderQty);
            fd.append("metaTitle", metaTitle);
            fd.append("metaDescription", metaDesc);
            fd.append("metaKeywords", JSON.stringify(metaKeywords));
            fd.append("attributes", JSON.stringify(attributes));

            // Only attach new files if the user picked them
            if (thumbnail) fd.append("thumbnail", thumbnail);
            additionalImages.forEach((img) => fd.append("additionalImages", img));
            if (videoFile) { fd.append("videoType", "Upload"); fd.append("video", videoFile); }

            if (isEditMode) {
                // PUT /api/products/update/:id
                await apiFetch(`/update/${existingProduct._id}`, { method: "PUT", body: fd });
            } else {
                await apiFetch("/add", { method: "POST", body: fd });
            }

            if (onSaved) onSaved();
            else showToast(isEditMode ? "Product updated successfully!" : "Product added successfully!");

            if (!isEditMode) handleReset();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSubmitting(false);
        }
    }

    function handleReset() {
        if (isEditMode && existingProduct) {
            // Reset to original values
            const p = existingProduct;
            setName(p.name || ""); setSlug(p.slug || ""); setShortDesc(p.shortDescription || "");
            setDescription(p.description || ""); setBrand(resolveId(p.brand)); setUnit(p.unit || "");
            setSku(p.sku || ""); setBuyingPrice(p.buyingPrice ?? ""); setSellingPrice(p.sellingPrice ?? "");
            setDiscountPrice(p.discountPrice ?? "0"); setStockQty(p.stockQuantity ?? "");
            setMinOrderQty(p.minOrderQuantity ?? "1"); setMetaTitle(p.metaTitle || "");
            setMetaDesc(p.metaDescription || ""); setThumbnail(null); setAdditionalImages([]);
            return;
        }
        setName(""); setSlug(""); setShortDesc(""); setDescription("");
        setBrand(""); setUnit(""); setSku(String(Math.floor(100000 + Math.random() * 900000)));
        setSelectedCategories([]); setBuyingPrice(""); setSellingPrice(""); setDiscountPrice("0");
        setStockQty(""); setMinOrderQty("1"); setThumbnail(null); setAdditionalImages([]);
        setVideoFile(null); setMetaTitle(""); setMetaDesc(""); setMetaKeywords([]); setAttributes([]);
    }

    // ── Render ────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 font-[Outfit,sans-serif]">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #9ca3af; }
      `}</style>

            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {/* Back button in edit mode */}
                        {isEditMode && onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex items-center gap-1.5 mr-2 text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back
                            </button>
                        )}
                        <span className="font-semibold text-gray-800">Products</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>{isEditMode ? "Edit Product" : "Add New Product"}</span>
                    </div>

                    {/* Edit mode badge */}
                    {isEditMode && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-100">
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-xs font-semibold text-blue-600 truncate max-w-[200px]">Editing: {existingProduct?.name}</span>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button type="button" onClick={isEditMode && onCancel ? onCancel : handleReset}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            {isEditMode ? "Cancel" : "Reset"}
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg transition-colors shadow-sm shadow-emerald-200"
                        >
                            {submitting && <Spinner />}
                            {submitting ? "Saving…" : isEditMode ? "Update Product" : "Submit"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-6">
                <div className="mb-5 flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900">
                        {isEditMode ? "Edit Product" : "Add New Product"}
                    </h1>
                    {isEditMode && (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">EDIT MODE</span>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_300px] gap-5 items-start">

                    {/* ── LEFT COLUMN ── */}
                    <div className="space-y-5">

                        {/* Product Info */}
                        <SectionCard title="Product Info" icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        }>
                            <div className="space-y-4">
                                <div>
                                    <Label required>Product Name</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter Product Name" required />
                                </div>
                                <div>
                                    <Label>Product Permalink/Slug</Label>
                                    <div className="flex">
                                        <span className="flex items-center px-3 text-xs text-gray-500 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg whitespace-nowrap">
                                            https://readygrocery.razinsoft.com/products/
                                        </span>
                                        <input
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                            placeholder="your-product-permalink"
                                            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent placeholder-gray-400 bg-white transition"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label required>Short Description</Label>
                                    <Textarea value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} rows={3} placeholder="Enter short description" required />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Label required>Description</Label>
                                        <button type="button" className="flex items-center gap-1 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-lg transition-colors -mt-1">
                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 4a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z" /></svg>
                                            Generate AI
                                        </button>
                                    </div>
                                    <RichEditor value={description} onChange={setDescription} />
                                </div>
                            </div>
                        </SectionCard>

                        {/* General Information */}
                        <SectionCard title="General Information" icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <Label>Select Brand</Label>
                                    <Select value={brand} onChange={(e) => setBrand(e.target.value)}>
                                        <option value="">Select Brand</option>
                                        {brands.map((b) => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Label required>Unit</Label>
                                    <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit (e.g. kg, pc, packet)" required />
                                </div>
                                <div className="col-span-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <Label required>Product SKU</Label>
                                        </div>
                                        <button type="button" onClick={generateSku} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
                                            Generate Code
                                        </button>
                                    </div>
                                    <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" required className="max-w-xs" />
                                </div>
                            </div>
                        </SectionCard>

                        {/* Price Information */}
                        <SectionCard title="Price Information" icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label required>Buying Price</Label>
                                    <Input type="number" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} placeholder="Buying Price" min="0" step="0.01" required />
                                </div>
                                <div>
                                    <Label required>Selling Price</Label>
                                    <Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="Selling Price" min="0" step="0.01" required />
                                </div>
                                <div>
                                    <Label>Discount Price</Label>
                                    <Input type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} placeholder="0" min="0" step="0.01" />
                                </div>
                                <div>
                                    <Label required>Current Stock Quantity</Label>
                                    <Input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} placeholder="Current Stock Quantity" min="0" required />
                                </div>
                                <div>
                                    <Label>Minimum Order Quantity</Label>
                                    <Input type="number" value={minOrderQty} onChange={(e) => setMinOrderQty(e.target.value)} placeholder="1" min="1" />
                                </div>
                            </div>
                        </SectionCard>

                        {/* Images */}
                        <SectionCard title="Images" icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        }>
                            <div className="space-y-5">
                                {/* In edit mode, show note if there's an existing thumbnail */}
                                {isEditMode && existingThumbnail && !thumbnail && (
                                    <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-600">
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Current thumbnail will be kept unless you upload a new one.
                                    </div>
                                )}
                                <ImageDropzone
                                    label="Thumbnail"
                                    hint="Ratio 1280 × 960 px"
                                    onChange={setThumbnail}
                                    existingUrls={existingThumbnail ? [existingThumbnail] : []}
                                />
                                <ImageDropzone
                                    label="Additional Thumbnail"
                                    hint="Ratio 1280 × 960 px"
                                    multiple
                                    maxFiles={5}
                                    onChange={setAdditionalImages}
                                    existingUrls={existingAdditional}
                                />
                                <div>
                                    <button type="button" className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-emerald-600 transition-colors">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        Upload or Add Product Video
                                    </button>
                                    <div className="mt-3 grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Select Video Type</Label>
                                            <Select value={videoType} onChange={(e) => setVideoType(e.target.value)}>
                                                <option>Upload Video File</option>
                                                <option>YouTube</option>
                                                <option>Vimeo</option>
                                                <option>Dailymotion</option>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Upload Product Video</Label>
                                            {videoType === "Upload Video File" ? (
                                                <div>
                                                    <input type="file" accept="video/mp4,video/avi,video/mov,video/wmv" onChange={(e) => setVideoFile(e.target.files[0])}
                                                        className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 border border-gray-200 rounded-lg" />
                                                    <p className="text-xs text-gray-400 mt-1">Supported formats: MP4, AVI, MOV, WMV</p>
                                                </div>
                                            ) : (
                                                <Input placeholder={`Paste ${videoType} URL`} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* SEO */}
                        <SectionCard title="SEO Information" icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        }>
                            <div className="space-y-4">
                                <div>
                                    <Label>Meta Title</Label>
                                    <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Meta Title" />
                                </div>
                                <div>
                                    <Label>Meta Description</Label>
                                    <Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={3} placeholder="Meta Description" />
                                </div>
                                <div>
                                    <Label>Meta Keywords</Label>
                                    <TagInput tags={metaKeywords} onChange={setMetaKeywords} />
                                    <p className="text-xs text-gray-400 mt-1">Write keywords and Press enter to add new one</p>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Footer buttons */}
                        <div className="flex justify-end gap-3 pb-6">
                            <button type="button" onClick={isEditMode && onCancel ? onCancel : handleReset}
                                className="px-6 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                {isEditMode ? "Cancel" : "Reset"}
                            </button>
                            <button type="submit" disabled={submitting}
                                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl transition-colors shadow-sm shadow-emerald-200">
                                {submitting && <Spinner />}
                                {submitting ? "Saving…" : isEditMode ? "Update Product" : "Submit"}
                            </button>
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN ── */}
                    <div className="space-y-5 sticky top-[72px]">

                        {/* Categories */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="text-sm font-bold text-gray-800">Categories</h3>
                            </div>
                            <div className="p-4 space-y-1 max-h-72 overflow-y-auto">
                                {categoriesLoading ? (
                                    <div className="flex items-center gap-2 py-4 text-gray-400 text-xs">
                                        <svg className="animate-spin h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Loading categories…
                                    </div>
                                ) : categories.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic py-3">No categories found.</p>
                                ) : (
                                    categories.map((cat) => (
                                        <label key={cat._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(cat._id)}
                                                onChange={() => toggleCategory(cat._id)}
                                                className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400 accent-emerald-500"
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{cat.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            {selectedCategories.length > 0 && (
                                <div className="px-4 py-3 border-t border-gray-50 bg-emerald-50/40">
                                    <p className="text-xs text-emerald-700 font-semibold">
                                        {selectedCategories.length} selected:{" "}
                                        {selectedCategories.map((id) => categories.find((c) => c._id === id)?.name).filter(Boolean).join(", ")}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Category Attribute */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="text-sm font-bold text-gray-800">Category Attribute</h3>
                            </div>
                            <div className="p-4">
                                {selectedCategories.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">Select a category to see its attributes.</p>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-gray-500 font-medium">
                                            Attributes for: <span className="text-gray-700 font-semibold">{categories.find((c) => c._id === selectedCategories[0])?.name}</span>
                                        </p>
                                        {["Size", "Weight", "Color"].map((attr) => (
                                            <div key={attr}>
                                                <Label>{attr}</Label>
                                                <Input
                                                    placeholder={`Enter ${attr}`}
                                                    value={attributes.find(a => a.key === attr)?.value || ""}
                                                    onChange={(e) => handleAttributeChange(attr, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick summary card */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-md shadow-emerald-200">
                            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-3">Product Summary</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="opacity-75">Name</span>
                                    <span className="font-semibold truncate ml-2 max-w-[140px]">{name || "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-75">SKU</span>
                                    <span className="font-semibold">{sku}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-75">Selling Price</span>
                                    <span className="font-semibold">{sellingPrice ? `৳${sellingPrice}` : "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-75">Stock</span>
                                    <span className="font-semibold">{stockQty || "—"}</span>
                                </div>
                                {isEditMode && (
                                    <div className="pt-2 border-t border-white/20 flex justify-between">
                                        <span className="opacity-75">Mode</span>
                                        <span className="font-semibold text-yellow-200">✏ Editing</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </main>

            <Toast toast={toast} />
        </div>
    );
}