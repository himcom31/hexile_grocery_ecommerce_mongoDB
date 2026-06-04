import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "http://localhost:5000/api/blog";
const CATEGORY_API = "http://localhost:5000/api/Category/all";

const getToken = () => localStorage.getItem("adminToken") || "";

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  let ago = "";
  if (diffDays < 1) ago = "Today";
  else if (diffDays < 30) ago = `${diffDays} days ago`;
  else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    ago = `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    ago = `${years} year${years > 1 ? "s" : ""} ago`;
  }
  return { formatted: `${day} ${month}, ${year}`, ago };
}

// ─── Color Palette Picker ────────────────────────────────────────────────────

const COLORS = [
  "#000000","#434343","#666666","#999999","#b7b7b7","#cccccc","#d9d9d9","#ffffff",
  "#ff0000","#ff9900","#ffff00","#00ff00","#00ffff","#0000ff","#9900ff","#ff00ff",
  "#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e0e3","#cfe2f3","#d9d2e9","#ead1dc",
  "#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd",
  "#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0",
  "#cc0000","#e69138","#f1c232","#6aa84f","#45818e","#3d85c8","#674ea7","#a64d79",
  "#990000","#b45f06","#bf9000","#38761d","#134f5c","#1155cc","#351c75","#741b47",
  "#660000","#783f04","#7f6000","#274e13","#0c343d","#1c4587","#20124d","#4c1130",
];

function ColorPicker({ onSelect, onClose }) {
  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-2"
      style={{ top: "100%", left: 0, width: 192 }}
    >
      <div className="grid grid-cols-8 gap-0.5">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onMouseDown={(e) => { e.preventDefault(); onSelect(c); onClose(); }}
            className="w-5 h-5 rounded-sm border border-gray-200 hover:scale-110 transition-transform"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Table Picker ────────────────────────────────────────────────────────────

function TablePicker({ onInsert, onClose }) {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const MAX = 8;

  const insertTable = (rows, cols) => {
    let html = '<table style="border-collapse:collapse;width:100%;margin:8px 0">';
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        html += `<td style="border:1px solid #ccc;padding:6px 10px;min-width:60px">&nbsp;</td>`;
      }
      html += "</tr>";
    }
    html += "</table><p><br></p>";
    onInsert(html);
    onClose();
  };

  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3"
      style={{ top: "100%", left: 0 }}
    >
      <p className="text-xs text-gray-500 mb-2">{hover.r} × {hover.c}</p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${MAX}, 1.25rem)` }}>
        {Array.from({ length: MAX * MAX }).map((_, idx) => {
          const r = Math.floor(idx / MAX) + 1;
          const c = (idx % MAX) + 1;
          const active = r <= hover.r && c <= hover.c;
          return (
            <div
              key={idx}
              onMouseEnter={() => setHover({ r, c })}
              onMouseDown={(e) => { e.preventDefault(); insertTable(hover.r, hover.c); }}
              className={`w-5 h-5 rounded-sm border transition-colors cursor-pointer ${active ? "bg-green-200 border-green-400" : "bg-gray-100 border-gray-300"}`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Math / Formula Input ────────────────────────────────────────────────────

function MathInput({ onInsert, onClose }) {
  const [expr, setExpr] = useState("");
  return (
    <div
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-3 w-64"
      style={{ top: "100%", left: 0 }}
    >
      <p className="text-xs font-semibold text-gray-600 mb-1">Insert Formula</p>
      <input
        autoFocus
        type="text"
        value={expr}
        onChange={(e) => setExpr(e.target.value)}
        placeholder="e.g. E = mc²"
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mb-2"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            if (expr.trim()) {
              onInsert(`<span class="formula" style="font-family:serif;font-style:italic;background:#f0f9ff;padding:1px 4px;border-radius:3px">${expr}</span>`);
              onClose();
            }
          }}
          className="flex-1 bg-green-600 text-white text-xs rounded py-1 hover:bg-green-700"
        >Insert</button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onClose(); }}
          className="flex-1 border text-xs rounded py-1 hover:bg-gray-50"
        >Cancel</button>
      </div>
    </div>
  );
}

// ─── Block Format Options ─────────────────────────────────────────────────────

const BLOCK_FORMATS = [
  { label: "Normal",      value: "p" },
  { label: "Heading 1",   value: "h1" },
  { label: "Heading 2",   value: "h2" },
  { label: "Heading 3",   value: "h3" },
  { label: "Heading 4",   value: "h4" },
  { label: "Heading 5",   value: "h5" },
  { label: "Heading 6",   value: "h6" },
  { label: "Code Block",  value: "pre" },
  { label: "Blockquote",  value: "blockquote" },
  { label: "Div",         value: "div" },
];

// ─── Font Family Options ──────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { label: "Sans Serif",         value: "sans-serif" },
  { label: "Serif",              value: "Georgia, serif" },
  { label: "Monospace",          value: "'Courier New', monospace" },
  { label: "Arial",              value: "Arial, sans-serif" },
  { label: "Arial Black",        value: "'Arial Black', sans-serif" },
  { label: "Verdana",            value: "Verdana, sans-serif" },
  { label: "Tahoma",             value: "Tahoma, sans-serif" },
  { label: "Trebuchet MS",       value: "'Trebuchet MS', sans-serif" },
  { label: "Impact",             value: "Impact, sans-serif" },
  { label: "Times New Roman",    value: "'Times New Roman', serif" },
  { label: "Georgia",            value: "Georgia, serif" },
  { label: "Garamond",           value: "Garamond, serif" },
  { label: "Palatino",           value: "'Palatino Linotype', serif" },
  { label: "Book Antiqua",       value: "'Book Antiqua', serif" },
  { label: "Courier New",        value: "'Courier New', monospace" },
  { label: "Lucida Console",     value: "'Lucida Console', monospace" },
  { label: "Comic Sans MS",      value: "'Comic Sans MS', cursive" },
  { label: "Brush Script MT",    value: "'Brush Script MT', cursive" },
  { label: "Lucida Handwriting", value: "'Lucida Handwriting', cursive" },
  { label: "Copperplate",        value: "Copperplate, fantasy" },
  { label: "Papyrus",            value: "Papyrus, fantasy" },
  { label: "System UI",          value: "system-ui, sans-serif" },
];

// ─── Font Size Options ────────────────────────────────────────────────────────

const FONT_SIZES = [
  { label: "8px",  value: "1" },
  { label: "10px", value: "2" },
  { label: "12px", value: "3" },
  { label: "14px", value: "4" },
  { label: "18px", value: "5" },
  { label: "24px", value: "6" },
  { label: "36px", value: "7" },
];

// ─── Full Rich Editor (identical to Add Blog) ────────────────────────────────

function RichEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const [openPanel, setOpenPanel] = useState(null);
  const [blockFormat, setBlockFormat] = useState("p");
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [fontSize, setFontSize] = useState("");
  const savedRange = useRef(null);
  const isFocused = useRef(false);

  // Initialise content once (and on external reset)
  useEffect(() => {
    if (editorRef.current && !isFocused.current) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (!savedRange.current) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange.current);
  };

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  const insertHTML = useCallback((html) => {
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  const handleInput = () => onChange(editorRef.current?.innerHTML || "");

  const syncToolbarState = () => {
    const node = window.getSelection()?.anchorNode;
    if (!node) return;
    let el = node.nodeType === 3 ? node.parentElement : node;
    while (el && el !== editorRef.current) {
      const tag = el.tagName?.toLowerCase();
      if (BLOCK_FORMATS.some(f => f.value === tag)) {
        setBlockFormat(tag);
        break;
      }
      el = el.parentElement;
    }
  };

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".panel-anchor")) setOpenPanel(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (panel) => {
    saveSelection();
    setOpenPanel(prev => prev === panel ? null : panel);
  };

  const Btn = ({ title, onMD, children, active }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onMD(e); }}
      className={`w-7 h-7 flex items-center justify-center rounded text-gray-700 hover:bg-gray-200 transition text-sm select-none ${active ? "bg-gray-200" : ""}`}
    >
      {children}
    </button>
  );

  const Sep = () => <div className="w-px h-5 bg-gray-300 mx-0.5" />;

  return (
    <div className="border border-gray-300 rounded-lg overflow-visible focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 rounded-t-lg">

        {/* Block Format */}
        <select
          value={blockFormat}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = e.target.value;
            setBlockFormat(val);
            editorRef.current?.focus();
            document.execCommand("formatBlock", false, val);
            onChange(editorRef.current?.innerHTML || "");
          }}
          className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-400 mr-0.5"
        >
          {BLOCK_FORMATS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        {/* Font Family */}
        <select
          value={fontFamily}
          className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-400 mr-0.5"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = e.target.value;
            setFontFamily(val);
            editorRef.current?.focus();
            document.execCommand("fontName", false, val);
            onChange(editorRef.current?.innerHTML || "");
          }}
        >
          {FONT_FAMILIES.map(f => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          value={fontSize}
          className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-400 mr-0.5"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = e.target.value;
            setFontSize(val);
            if (val) {
              editorRef.current?.focus();
              document.execCommand("fontSize", false, val);
              onChange(editorRef.current?.innerHTML || "");
            }
          }}
        >
          <option value="">Size</option>
          {FONT_SIZES.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <Sep />

        <Btn title="Bold (Ctrl+B)" onMD={() => exec("bold")}><strong>B</strong></Btn>
        <Btn title="Italic (Ctrl+I)" onMD={() => exec("italic")}><em>I</em></Btn>
        <Btn title="Underline (Ctrl+U)" onMD={() => exec("underline")}><span className="underline">U</span></Btn>
        <Btn title="Strikethrough" onMD={() => exec("strikeThrough")}><span className="line-through">S</span></Btn>
        <Btn title="Blockquote" onMD={() => { setBlockFormat("blockquote"); exec("formatBlock", "blockquote"); }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm3 0a2 2 0 100-4 2 2 0 000 4zm6-4a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </Btn>

        <Sep />

        <Btn title="Ordered List" onMD={() => exec("insertOrderedList")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </Btn>
        <Btn title="Unordered List" onMD={() => exec("insertUnorderedList")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4 4a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 000 2h9a1 1 0 000-2H7zm-3 5a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 000 2h9a1 1 0 000-2H7zm-3 5a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 000 2h9a1 1 0 000-2H7z" clipRule="evenodd" />
          </svg>
        </Btn>

        <Sep />

        <Btn title="Align Left" onMD={() => exec("justifyLeft")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h8a1 1 0 000-2H3zm0 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h8a1 1 0 000-2H3z" clipRule="evenodd" />
          </svg>
        </Btn>
        <Btn title="Align Center" onMD={() => exec("justifyCenter")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm3 4a1 1 0 000 2h8a1 1 0 000-2H6zm-3 4a1 1 0 000 2h14a1 1 0 000-2H3zm3 4a1 1 0 000 2h8a1 1 0 000-2H6z" clipRule="evenodd" />
          </svg>
        </Btn>
        <Btn title="Align Right" onMD={() => exec("justifyRight")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm6 4a1 1 0 000 2h8a1 1 0 000-2H9zm-6 4a1 1 0 000 2h14a1 1 0 000-2H3zm6 4a1 1 0 000 2h8a1 1 0 000-2H9z" clipRule="evenodd" />
          </svg>
        </Btn>
        <Btn title="Justify" onMD={() => exec("justifyFull")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h14a1 1 0 000-2H3z" clipRule="evenodd" />
          </svg>
        </Btn>
        <Btn title="Indent" onMD={() => exec("indent")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm4 4a1 1 0 000 2h10a1 1 0 000-2H7zm-4 4a1 1 0 000 2h14a1 1 0 000-2H3zm4 4a1 1 0 000 2h10a1 1 0 000-2H7z" clipRule="evenodd" />
          </svg>
        </Btn>
        <Btn title="Outdent" onMD={() => exec("outdent")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h10a1 1 0 000-2H3zm0 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h10a1 1 0 000-2H3z" clipRule="evenodd" />
          </svg>
        </Btn>

        <Sep />

        <Btn title="Subscript" onMD={() => exec("subscript")}>
          <span className="text-xs font-medium">X<sub>2</sub></span>
        </Btn>
        <Btn title="Superscript" onMD={() => exec("superscript")}>
          <span className="text-xs font-medium">X<sup>2</sup></span>
        </Btn>

        <Sep />

        {/* Text Color */}
        <div className="relative panel-anchor">
          <Btn title="Text Color" onMD={() => toggle("textColor")}>
            <span className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-bold leading-none" style={{ color: "#111" }}>A</span>
              <span className="w-4 h-1 rounded-sm" style={{ background: "#e53e3e" }} />
            </span>
          </Btn>
          {openPanel === "textColor" && (
            <ColorPicker
              onSelect={(c) => { restoreSelection(); exec("foreColor", c); }}
              onClose={() => setOpenPanel(null)}
            />
          )}
        </div>

        {/* BG/Highlight Color */}
        <div className="relative panel-anchor">
          <Btn title="Highlight / Background Color" onMD={() => toggle("bgColor")}>
            <span className="flex flex-col items-center gap-0.5">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-600">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-8 8A2 2 0 017 15H5a1 1 0 01-1-1v-2a2 2 0 01.586-1.414l8-8z" />
              </svg>
              <span className="w-4 h-1 rounded-sm" style={{ background: "#faf089" }} />
            </span>
          </Btn>
          {openPanel === "bgColor" && (
            <ColorPicker
              onSelect={(c) => { restoreSelection(); exec("hiliteColor", c); }}
              onClose={() => setOpenPanel(null)}
            />
          )}
        </div>

        <Sep />

        {/* Link */}
        <Btn title="Insert Link" onMD={() => {
          const url = prompt("Enter URL (e.g. https://example.com)");
          if (url) exec("createLink", url);
        }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
        </Btn>
        {/* Remove Link */}
        <Btn title="Remove Link" onMD={() => exec("unlink")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3.293 3.293a1 1 0 011.414 0L10 8.586l5.293-5.293a1 1 0 111.414 1.414L11.414 10l5.293 5.293a1 1 0 01-1.414 1.414L10 11.414l-5.293 5.293a1 1 0 01-1.414-1.414L8.586 10 3.293 4.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Btn>
        {/* Image */}
        <Btn title="Insert Image by URL" onMD={() => {
          const url = prompt("Enter image URL");
          if (url) insertHTML(`<img src="${url}" style="max-width:100%;height:auto;display:block;margin:8px 0" alt="image"/>`);
        }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </Btn>
        {/* Horizontal Rule */}
        <Btn title="Insert Horizontal Rule" onMD={() => exec("insertHorizontalRule")}>
          <span className="text-xs font-bold text-gray-600">―</span>
        </Btn>

        {/* Table */}
        <div className="relative panel-anchor">
          <Btn title="Insert Table" onMD={() => toggle("table")}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
            </svg>
          </Btn>
          {openPanel === "table" && (
            <TablePicker
              onInsert={insertHTML}
              onClose={() => setOpenPanel(null)}
            />
          )}
        </div>

        {/* Math / Formula */}
        <div className="relative panel-anchor">
          <Btn title="Insert Formula / Math" onMD={() => toggle("math")}>
            <span className="text-xs font-bold italic" style={{ fontFamily: "serif" }}>fx</span>
          </Btn>
          {openPanel === "math" && (
            <MathInput
              onInsert={insertHTML}
              onClose={() => setOpenPanel(null)}
            />
          )}
        </div>

        <Sep />

        <Btn title="Undo (Ctrl+Z)" onMD={() => exec("undo")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Btn>
        <Btn title="Redo (Ctrl+Y)" onMD={() => exec("redo")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Btn>
        <Btn title="Clear Formatting" onMD={() => exec("removeFormat")}>
          <span className="text-xs font-bold text-gray-500">Tx</span>
        </Btn>
      </div>

      {/* ── Editable Area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => { isFocused.current = false; }}
        onInput={handleInput}
        onKeyUp={syncToolbarState}
        onMouseUp={syncToolbarState}
        className="min-h-[320px] px-4 py-3 text-sm text-gray-800 focus:outline-none"
        style={{ lineHeight: "1.8", fontFamily: "sans-serif" }}
        data-placeholder="Start writing here..."
      />

      <style>{`
        [contenteditable]:empty:not(:focus)::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] h3 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] h4 { font-size: 1.1em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] h5 { font-size: 1em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] h6 { font-size: 0.875em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] blockquote {
          border-left: 4px solid #d1d5db;
          margin: 8px 0;
          padding: 4px 12px;
          color: #6b7280;
          font-style: italic;
        }
        [contenteditable] pre {
          background: #f3f4f6;
          padding: 10px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 0.875em;
          white-space: pre-wrap;
        }
        [contenteditable] hr { border: none; border-top: 2px solid #e5e7eb; margin: 12px 0; }
        [contenteditable] ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] a { color: #2563eb; text-decoration: underline; }
        [contenteditable] table { border-collapse: collapse; width: 100%; }
        [contenteditable] td, [contenteditable] th { border: 1px solid #d1d5db; padding: 6px 10px; }
        [contenteditable] img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────
function TagInput({ tags, setTags }) {
  const [input, setInput] = useState("");

  const addTag = (val) => {
    const trimmed = val.trim().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(input); setInput(""); }
    if (e.key === "Backspace" && !input && tags.length) setTags(tags.slice(0, -1));
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  return (
    <div className="border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition min-h-[42px] flex flex-wrap gap-1.5 items-center">
      {tags.map((tag, i) => (
        <span key={i} className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-green-900">&times;</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? "Write tag and press Enter" : ""}
        className="flex-1 min-w-[180px] text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
      />
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{ width: 44, height: 24, borderRadius: 12, background: checked ? "#22c55e" : "#d1d5db", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
    >
      <div style={{ position: "absolute", top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 10, padding: 28, width: 360, boxShadow: "0 10px 40px rgba(0,0,0,0.15)" }}>
        <p style={{ fontSize: 15, color: "#111827", marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "8px 20px", borderRadius: 6, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151" }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: type === "error" ? "#ef4444" : "#22c55e", color: "#fff", padding: "12px 20px", borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 2000, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>
      {message}
    </div>
  );
}

// ─── EDIT BLOG PAGE ───────────────────────────────────────────────────────────
function EditBlogPage({ blogId, onBack }) {
  const [blog, setBlog] = useState(null);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const fileInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [blogRes, catRes] = await Promise.all([
          fetch(`${API_BASE}/${blogId}`),
          fetch(CATEGORY_API),
        ]);
        const blogData = await blogRes.json();
        const catData = await catRes.json();

        if (blogData.success) {
          const b = blogData.blog;
          setBlog(b);
          setTitle(b.title || "");
          setCategory(b.category?._id || b.category || "");
          setTags(b.tags || []);
          setDescription(b.description || "");
          setThumbnailPreview(b.thumbnail || "");
        }
        if (catData.success) setCategories(catData.categories || catData.data || []);
      } catch (err) {
        showToast("Failed to load blog data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [blogId]);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title || !category || !description) {
      return showToast("Title, category, and description are required", "error");
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("tags", tags.join(","));
      formData.append("description", description);
      if (thumbnail) formData.append("thumbnail", thumbnail);

      const res = await fetch(`${API_BASE}/update/${blogId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        showToast("Blog updated successfully!");
        setTimeout(() => onBack(true), 1500);
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (blog) {
      setTitle(blog.title || "");
      setCategory(blog.category?._id || blog.category || "");
      setTags(blog.tags || []);
      setDescription(blog.description || "");
      setThumbnailPreview(blog.thumbnail || "");
      setThumbnail(null);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ background: "#fff", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Toast {...toast} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ padding: "20px 28px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #f3f4f6" }}>
        <button onClick={() => onBack(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px 4px 0", color: "#6b7280", fontSize: 20, lineHeight: 1 }}>←</button>
        <svg style={{ width: 20, height: 20, color: "#111827" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span style={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>Edit Blog</span>
      </div>

      <div style={{ padding: "28px 28px 100px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32 }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Title */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter blog title"
                style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, color: "#111827", outline: "none" }}
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Select Category <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "10px 36px 10px 14px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, color: "#111827", background: "#fff", outline: "none", appearance: "none" }}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <div style={{ pointerEvents: "none", position: "absolute", insetY: 0, right: 12, top: "50%", transform: "translateY(-50%)" }}>
                  <svg style={{ width: 16, height: 16, color: "#6b7280" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Tags</label>
              <TagInput tags={tags} setTags={setTags} />
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Write tag and press Enter to add</p>
            </div>

            {/* Description — full RichEditor */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                Description <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <RichEditor value={description} onChange={setDescription} />
            </div>
          </div>

          {/* Right column — Thumbnail */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Thumbnail <span style={{ color: "#6b7280", fontWeight: 400 }}>(880 × 440)</span>{" "}
              <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f && f.type.startsWith("image/")) {
                  setThumbnail(f);
                  setThumbnailPreview(URL.createObjectURL(f));
                }
              }}
              style={{ border: "2px dashed #d1d5db", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "#f9fafb", aspectRatio: "880/440", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#9ca3af", userSelect: "none" }}>
                  <svg style={{ width: 48, height: 48, color: "#d1d5db" }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zm-8.5-6.5l-2.5 3.01L7.5 13l-3.5 4.5h15l-6.5-5z" />
                  </svg>
                  <p style={{ fontSize: 12 }}>Click or drag to upload thumbnail</p>
                  <p style={{ fontSize: 12, color: "#d1d5db" }}>880 × 440 recommended</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleThumbnailChange} style={{ display: "none" }} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e5e7eb", padding: "14px 28px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          onClick={handleReset}
          style={{ padding: "9px 24px", border: "1px solid #d1d5db", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151" }}
        >Reset</button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ padding: "9px 28px", border: "none", borderRadius: 6, background: submitting ? "#86efac" : "#22c55e", color: "#fff", cursor: submitting ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 500 }}
        >
          {submitting ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg style={{ width: 16, height: 16, animation: "spin 0.8s linear infinite" }} fill="none" viewBox="0 0 24 24">
                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving...
            </span>
          ) : "Submit"}
        </button>
      </div>
    </div>
  );
}

// ─── BLOG LIST PAGE ───────────────────────────────────────────────────────────
export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  };

  const fetchBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/all`);
      const data = await res.json();
      if (data.success) setBlogs(data.blogs);
    } catch {
      showToast("Failed to load blogs", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const handleToggleStatus = async (blog) => {
    try {
      const res = await fetch(`${API_BASE}/toggle-status/${blog._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) => prev.map((b) => b._id === blog._id ? { ...b, isActive: !b.isActive } : b));
        showToast(`Blog ${data.blog.isActive ? "activated" : "deactivated"}`);
      }
    } catch {
      showToast("Failed to toggle status", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE}/delete/${deleteTarget}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) => prev.filter((b) => b._id !== deleteTarget));
        showToast("Blog deleted successfully");
      } else {
        showToast(data.message || "Delete failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (editingBlogId) {
    return <EditBlogPage blogId={editingBlogId} onBack={(refresh) => { setEditingBlogId(null); if (refresh) fetchBlogs(); }} />;
  }

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", padding: "28px 32px" }}>
      <Toast {...toast} />
      {deleteTarget && (
        <ConfirmModal
          message="Are you sure you want to delete this blog? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Page Header */}
    
      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e5e7eb", borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                {["SL", "Thumbnail", "Title", "Category", "Views", "Created Date", "Status", "Action"].map((h, i) => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: i === 0 || i === 1 ? "center" : i >= 7 ? "center" : "left", fontSize: 13, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af", fontSize: 14 }}>No blogs found</td>
                </tr>
              ) : (
                blogs.map((blog, idx) => {
                  const { formatted, ago } = formatDate(blog.createdAt);
                  return (
                    <tr
                      key={blog._id}
                      style={{ borderBottom: "1px solid #f9fafb", transition: "background 0.15s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
                    >
                      <td style={{ padding: "14px 16px", textAlign: "center", fontSize: 14, color: "#374151" }}>{idx + 1}</td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <img
                          src={blog.thumbnail}
                          alt={blog.title}
                          style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", display: "block", margin: "0 auto" }}
                          onError={(e) => { e.target.style.background = "#f3f4f6"; e.target.src = ""; }}
                        />
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 14, color: "#111827", maxWidth: 340 }}>
                        <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {blog.title}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151", whiteSpace: "nowrap" }}>
                        {blog.category?.name || "—"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151", textAlign: "left" }}>
                        {blog.views ?? 0}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 500 }}>{formatted}</div>
                        <div style={{ color: "#9ca3af", fontSize: 12 }}>{ago}</div>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <Toggle checked={blog.isActive} onChange={() => handleToggleStatus(blog)} />
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                          <button
                            onClick={() => setEditingBlogId(blog._id)}
                            title="Edit"
                            style={{ width: 34, height: 34, border: "1.5px solid #3b82f6", borderRadius: 6, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontSize: 15, transition: "background 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >✎</button>
                          <button
                            onClick={() => setDeleteTarget(blog._id)}
                            title="Delete"
                            style={{ width: 34, height: 34, border: "1.5px solid #ef4444", borderRadius: 6, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: 15, transition: "background 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                          >🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}