import { useState, useEffect, useRef, useCallback } from "react";

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
  { label: "Sans Serif",        value: "sans-serif" },
  { label: "Serif",             value: "Georgia, serif" },
  { label: "Monospace",         value: "'Courier New', monospace" },
  { label: "Arial",             value: "Arial, sans-serif" },
  { label: "Arial Black",       value: "'Arial Black', sans-serif" },
  { label: "Verdana",           value: "Verdana, sans-serif" },
  { label: "Tahoma",            value: "Tahoma, sans-serif" },
  { label: "Trebuchet MS",      value: "'Trebuchet MS', sans-serif" },
  { label: "Impact",            value: "Impact, sans-serif" },
  { label: "Times New Roman",   value: "'Times New Roman', serif" },
  { label: "Georgia",           value: "Georgia, serif" },
  { label: "Garamond",          value: "Garamond, serif" },
  { label: "Palatino",          value: "'Palatino Linotype', serif" },
  { label: "Book Antiqua",      value: "'Book Antiqua', serif" },
  { label: "Courier New",       value: "'Courier New', monospace" },
  { label: "Lucida Console",    value: "'Lucida Console', monospace" },
  { label: "Comic Sans MS",     value: "'Comic Sans MS', cursive" },
  { label: "Brush Script MT",   value: "'Brush Script MT', cursive" },
  { label: "Lucida Handwriting",value: "'Lucida Handwriting', cursive" },
  { label: "Copperplate",       value: "Copperplate, fantasy" },
  { label: "Papyrus",           value: "Papyrus, fantasy" },
  { label: "System UI",         value: "system-ui, sans-serif" },
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

// ─── Main Rich Editor ────────────────────────────────────────────────────────

export function RichEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const [openPanel, setOpenPanel] = useState(null); // 'textColor'|'bgColor'|'table'|'math'
  const [blockFormat, setBlockFormat] = useState("p");
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [fontSize, setFontSize] = useState("");
  const savedRange = useRef(null);

  // Save selection before opening panel
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore selection after opening panel
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

  // Sync blockFormat state from cursor position
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

  useEffect(() => {
    if (editorRef.current && value === "") {
      editorRef.current.innerHTML = "";
    }
  }, [value]);

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

  // ── Toolbar button helper ──
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

        {/* ── Block Format (controlled) ── */}
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

        {/* ── Font Family (controlled) ── */}
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

        {/* ── Font Size (controlled) ── */}
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

        {/* Bold */}
        <Btn title="Bold (Ctrl+B)" onMD={() => exec("bold")}>
          <strong>B</strong>
        </Btn>
        {/* Italic */}
        <Btn title="Italic (Ctrl+I)" onMD={() => exec("italic")}>
          <em>I</em>
        </Btn>
        {/* Underline */}
        <Btn title="Underline (Ctrl+U)" onMD={() => exec("underline")}>
          <span className="underline">U</span>
        </Btn>
        {/* Strikethrough */}
        <Btn title="Strikethrough" onMD={() => exec("strikeThrough")}>
          <span className="line-through">S</span>
        </Btn>
        {/* Blockquote */}
        <Btn title="Blockquote" onMD={() => {
          setBlockFormat("blockquote");
          exec("formatBlock", "blockquote");
        }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm3 0a2 2 0 100-4 2 2 0 000 4zm6-4a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </Btn>

        <Sep />

        {/* Ordered List */}
        <Btn title="Ordered List" onMD={() => exec("insertOrderedList")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </Btn>
        {/* Unordered List */}
        <Btn title="Unordered List" onMD={() => exec("insertUnorderedList")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4 4a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 000 2h9a1 1 0 000-2H7zm-3 5a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 000 2h9a1 1 0 000-2H7zm-3 5a1 1 0 100 2 1 1 0 000-2zm3 1a1 1 0 000 2h9a1 1 0 000-2H7z" clipRule="evenodd" />
          </svg>
        </Btn>

        <Sep />

        {/* Align Left */}
        <Btn title="Align Left" onMD={() => exec("justifyLeft")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h8a1 1 0 000-2H3zm0 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h8a1 1 0 000-2H3z" clipRule="evenodd" />
          </svg>
        </Btn>
        {/* Align Center */}
        <Btn title="Align Center" onMD={() => exec("justifyCenter")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm3 4a1 1 0 000 2h8a1 1 0 000-2H6zm-3 4a1 1 0 000 2h14a1 1 0 000-2H3zm3 4a1 1 0 000 2h8a1 1 0 000-2H6z" clipRule="evenodd" />
          </svg>
        </Btn>
        {/* Align Right */}
        <Btn title="Align Right" onMD={() => exec("justifyRight")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm6 4a1 1 0 000 2h8a1 1 0 000-2H9zm-6 4a1 1 0 000 2h14a1 1 0 000-2H3zm6 4a1 1 0 000 2h8a1 1 0 000-2H9z" clipRule="evenodd" />
          </svg>
        </Btn>
        {/* Justify */}
        <Btn title="Justify" onMD={() => exec("justifyFull")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h14a1 1 0 000-2H3z" clipRule="evenodd" />
          </svg>
        </Btn>

        {/* Indent */}
        <Btn title="Indent" onMD={() => exec("indent")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm4 4a1 1 0 000 2h10a1 1 0 000-2H7zm-4 4a1 1 0 000 2h14a1 1 0 000-2H3zm4 4a1 1 0 000 2h10a1 1 0 000-2H7z" clipRule="evenodd" />
          </svg>
        </Btn>
        {/* Outdent */}
        <Btn title="Outdent" onMD={() => exec("outdent")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h10a1 1 0 000-2H3zm0 4a1 1 0 000 2h14a1 1 0 000-2H3zm0 4a1 1 0 000 2h10a1 1 0 000-2H3z" clipRule="evenodd" />
          </svg>
        </Btn>

        <Sep />

        {/* Subscript */}
        <Btn title="Subscript" onMD={() => exec("subscript")}>
          <span className="text-xs font-medium">X<sub>2</sub></span>
        </Btn>
        {/* Superscript */}
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

        {/* Undo */}
        <Btn title="Undo (Ctrl+Z)" onMD={() => exec("undo")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </Btn>
        {/* Redo */}
        <Btn title="Redo (Ctrl+Y)" onMD={() => exec("redo")}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Btn>

        {/* Remove Format */}
        <Btn title="Clear Formatting" onMD={() => exec("removeFormat")}>
          <span className="text-xs font-bold text-gray-500">Tx</span>
        </Btn>
      </div>

      {/* ── Editable Area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={syncToolbarState}
        onMouseUp={syncToolbarState}
        className="min-h-[220px] px-4 py-3 text-sm text-gray-800 focus:outline-none"
        style={{
          lineHeight: "1.8",
          fontFamily: "sans-serif",
        }}
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
        [contenteditable] hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 12px 0;
        }
        [contenteditable] ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
        [contenteditable] a { color: #2563eb; text-decoration: underline; }
        [contenteditable] table { border-collapse: collapse; width: 100%; }
        [contenteditable] td, [contenteditable] th {
          border: 1px solid #d1d5db; padding: 6px 10px;
        }
        [contenteditable] img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}

// ─── Tag Input ───────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  const addTag = (val) => {
    const tag = val.trim();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addTag(input); }
    if (e.key === "Backspace" && !input && tags.length) onChange(tags.slice(0, -1));
  };

  return (
    <div className="border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition min-h-[42px] flex flex-wrap gap-1.5 items-center">
      {tags.map((tag, i) => (
        <span key={i} className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((_, idx) => idx !== i))} className="hover:text-green-900">&times;</button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={tags.length === 0 ? "Write tag and press Enter" : ""}
        className="flex-1 min-w-[180px] text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent"
      />
    </div>
  );
}

// ─── Thumbnail Uploader ──────────────────────────────────────────────────────

function ThumbnailUpload({ file, preview, onChange }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) onChange(f);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="w-full aspect-[880/440] rounded-lg border-2 border-dashed border-gray-300 hover:border-green-400 bg-gray-50 hover:bg-green-50 transition cursor-pointer overflow-hidden flex items-center justify-center"
    >
      {preview ? (
        <img src={preview} alt="Thumbnail preview" className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-2 text-gray-400 select-none">
          <svg className="w-14 h-14 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zm-8.5-6.5l-2.5 3.01L7.5 13l-3.5 4.5h15l-6.5-5z" />
          </svg>
          <p className="text-xs">Click or drag to upload thumbnail</p>
          <p className="text-xs text-gray-300">880 × 440 recommended</p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) onChange(e.target.files[0]); }} />
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE_URL = "http://localhost:5000";
const CATEGORIES_API = `${API_BASE_URL}/api/Category/all`;
const BLOGS_API = `${API_BASE_URL}/api/blog/add`;

function authHeaders() {
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Add Blog Page ────────────────────────────────────────────────────────────

const initialForm = { title: "", category: "", tags: [], description: "" };

export default function AddBlogPage({ onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(CATEGORIES_API, { headers: authHeaders() });
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      } catch { /* silent */ }
    })();
  }, []);

  const handleThumbnailChange = (file) => {
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleReset = () => {
    setForm(initialForm);
    setThumbnailFile(null);
    setThumbnailPreview("");
  };

  const handleSubmit = async () => {
    if (!form.title)                              { showToast("error", "Title is required."); return; }
    if (!form.category)                           { showToast("error", "Please select a category."); return; }
    if (!form.description || form.description === "<br>") { showToast("error", "Description is required."); return; }
    if (!thumbnailFile)                           { showToast("error", "Thumbnail image is required."); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("category", form.category);
      fd.append("tags", form.tags.join(","));
      fd.append("description", form.description);
      fd.append("thumbnail", thumbnailFile);

      const res = await fetch(BLOGS_API, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", data.message || "Blog published!");
        handleReset();
      } else {
        showToast("error", data.error || data.message || "Submission failed.");
      }
    } catch {
      showToast("error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in ${toast.type === "success" ? "bg-green-600" : "bg-red-500"}`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h1 className="text-xl font-semibold text-gray-900">Add New Blog</h1>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT */}
        <div className="flex-1 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Enter blog title"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <TagInput tags={form.tags} onChange={(tags) => setForm(p => ({ ...p, tags }))} />
            <p className="text-xs text-gray-400 mt-1">Write tag and press Enter to add</p>
          </div>

          {/* Description / Rich Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <RichEditor
              value={form.description}
              onChange={(html) => setForm(p => ({ ...p, description: html }))}
            />
          </div>
        </div>

        {/* RIGHT — thumbnail */}
        <div className="lg:w-72 xl:w-80 shrink-0">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thumbnail <span className="text-blue-500 font-normal">(880 × 440)</span>{" "}
            <span className="text-red-500">*</span>
          </label>
          <ThumbnailUpload
            file={thumbnailFile}
            preview={thumbnailPreview}
            onChange={handleThumbnailChange}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 mt-8">
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className={`px-8 py-2 text-sm font-semibold text-white rounded-lg transition ${loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Publishing...
            </span>
          ) : "Submit"}
        </button>
      </div>
    </div>
  );
}