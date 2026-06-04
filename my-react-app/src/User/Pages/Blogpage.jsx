import { useState, useEffect, useCallback } from "react";

const BLOG_API = "http://localhost:5000/api/blog";
const CAT_API = "http://localhost:5000/api/Category/all";

// ─── Responsive Hook ──────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function getCategoryName(blog, categories) {
  if (!blog.category) return "";
  if (typeof blog.category === "object") return blog.category.name || "";
  const found = categories.find((c) => c._id === blog.category);
  return found ? found.name : "";
}

function getCategoryId(blog) {
  if (!blog.category) return null;
  if (typeof blog.category === "object") return blog.category._id;
  return blog.category;
}

function stripHtml(str) {
  return (str || "").replace(/<[^>]+>/g, "");
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

function Thumbnail({ src, alt, style }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div
        style={{
          ...style,
          background: "#e8ede8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#aaa",
          fontSize: 12,
        }}
      >
        No Image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt || ""}
      style={style}
      onError={() => setError(true)}
    />
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  categories,
  blogs,
  filteredCat,
  search,
  tags,
  onFilterCat,
  onSearch,
  onFilterTag,
  onOpenBlog,
  isMobile,
  isOpen,
  onClose,
}) {
  const latest = blogs.slice(0, 5);

  const content = (
    <aside style={isMobile ? S.sidebarMobile : S.sidebar}>
      {isMobile && (
        <div style={S.sidebarMobileHeader}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Filters & Info</span>
          <button style={S.closeBtn} onClick={onClose} aria-label="Close sidebar">
            ✕
          </button>
        </div>
      )}

      {/* Categories */}
      <div style={S.sideCard}>
        <h3 style={S.sideTitle}>Categories</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li
            style={{ ...S.catItem, ...(filteredCat === null ? S.catActive : {}) }}
            onClick={() => { onFilterCat(null); if (isMobile) onClose(); }}
          >
            All
          </li>
          {categories.map((c) => (
            <li
              key={c._id}
              style={{ ...S.catItem, ...(filteredCat === c._id ? S.catActive : {}) }}
              onClick={() => { onFilterCat(c._id); if (isMobile) onClose(); }}
            >
              {c.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Search */}
      <div style={S.sideCard}>
        <h3 style={S.sideTitle}>Search</h3>
        <div style={S.searchRow}>
          <input
            type="text"
            placeholder="Search …"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            style={S.searchInput}
          />
          <button style={S.searchBtn} aria-label="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      {/* Latest Posts */}
      <div style={S.sideCard}>
        <h3 style={S.sideTitle}>Latest Posts</h3>
        {latest.map((b) => (
          <div
            key={b._id}
            style={S.latestItem}
            onClick={() => { onOpenBlog(b._id); if (isMobile) onClose(); }}
          >
            <Thumbnail src={b.thumbnail} alt={b.title} style={S.latestThumb} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={S.latestTitle}>{b.title}</p>
              <span style={S.latestDate}>{formatDate(b.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={S.sideCard}>
          <h3 style={S.sideTitle}>Tags</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.map((t) => (
              <span
                key={t}
                style={S.tagPill}
                onClick={() => { onFilterTag(t); if (isMobile) onClose(); }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div style={S.overlay} onClick={onClose} />
        )}
        {/* Drawer */}
        <div
          style={{
            ...S.drawer,
            transform: isOpen ? "translateX(0)" : "translateX(100%)",
          }}
        >
          {content}
        </div>
      </>
    );
  }

  return content;
}

// ─── Blog List ────────────────────────────────────────────────────────────────

function BlogList({ blogs, categories, onOpenBlog, isMobile }) {
  if (blogs.length === 0) {
    return <div style={S.empty}>No blogs found.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {blogs.map((b) => (
        <BlogCard
          key={b._id}
          blog={b}
          categories={categories}
          onOpenBlog={onOpenBlog}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}

function BlogCard({ blog, categories, onOpenBlog, isMobile }) {
  const [hovered, setHovered] = useState(false);
  const cat = getCategoryName(blog, categories);
  const excerpt = stripHtml(blog.description);

  return (
    <article
      style={{
        ...S.card,
        flexDirection: isMobile ? "column" : "row",
        ...(hovered ? S.cardHover : {}),
      }}
      onClick={() => onOpenBlog(blog._id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image with date badge */}
      <div
        style={{
          ...S.imgWrap,
          width: isMobile ? "100%" : 260,
          height: isMobile ? 200 : "auto",
          minHeight: isMobile ? undefined : 180,
        }}
      >
        <Thumbnail src={blog.thumbnail} alt={blog.title} style={S.cardImg} />
        <span style={S.dateBadge}>{formatDate(blog.createdAt)}</span>
      </div>

      {/* Body */}
      <div
        style={{
          ...S.cardBody,
          padding: isMobile ? "20px 20px" : "28px 32px",
        }}
      >
        <h2
          style={{
            ...S.cardTitle,
            fontSize: isMobile ? 18 : 22,
          }}
        >
          {blog.title}
        </h2>
        <p style={S.cardExcerpt}>
          {excerpt.slice(0, isMobile ? 100 : 160)}
          {excerpt.length > (isMobile ? 100 : 160) ? "…" : ""}
        </p>
        <div style={S.cardFooter}>
          {cat && <span style={S.catLabel}>{cat}</span>}
          <span style={S.readMore}>READ MORE&nbsp;→</span>
        </div>
      </div>
    </article>
  );
}

// ─── Blog Detail ──────────────────────────────────────────────────────────────

function BlogDetail({ blog, blogs, categories, onBack, onOpenBlog, isMobile }) {
  const idx = blogs.findIndex((b) => b._id === blog._id);
  const prev = idx > 0 ? blogs[idx - 1] : null;
  const next = idx < blogs.length - 1 ? blogs[idx + 1] : null;
  const author =
    typeof blog.author === "object" ? blog.author?.name : blog.author || "Admin";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [blog._id]);

  return (
    <div>
      <button style={S.backBtn} onClick={onBack}>
        ← Back to Blog
      </button>

      {/* Hero */}
      <div
        style={{
          ...S.detailHero,
          height: isMobile ? 220 : 360,
        }}
      >
        <Thumbnail src={blog.thumbnail} alt={blog.title} style={S.detailHeroImg} />
      </div>

      {/* Content */}
      <div
        style={{
          ...S.detailCard,
          padding: isMobile ? "20px 16px" : "28px 32px",
        }}
      >
        <div style={S.detailMeta}>
          <span>
            By{" "}
            <strong style={{ color: "#1a2e1a", fontWeight: 600 }}>{author}</strong>
          </span>
          <span style={{ color: "#ccc" }}>•</span>
          <span>{formatDate(blog.createdAt)}</span>
          {!isMobile && (
            <>
              <span style={{ color: "#ccc" }}>•</span>
              <span>{getCategoryName(blog, categories)}</span>
            </>
          )}
        </div>

        <h1
          style={{
            ...S.detailTitle,
            fontSize: isMobile ? 22 : 28,
          }}
        >
          {blog.title}
        </h1>

        <div
          style={{
            ...S.detailBody,
            fontSize: isMobile ? 14 : 15,
          }}
          dangerouslySetInnerHTML={{ __html: blog.description || "" }}
        />

        {(blog.tags || []).length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid #eee",
            }}
          >
            {blog.tags.map((t) => (
              <span key={t} style={S.tagPill}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Prev / Next */}
      <div
        style={{
          ...S.navRow,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <div
          style={{
            ...S.navPost,
            opacity: prev ? 1 : 0.3,
            pointerEvents: prev ? "auto" : "none",
          }}
          onClick={() => prev && onOpenBlog(prev._id)}
        >
          <div style={S.navDir}>← Previous Post</div>
          <p style={S.navTitle}>{prev ? prev.title : "—"}</p>
        </div>
        <div
          style={{
            ...S.navPost,
            textAlign: isMobile ? "left" : "right",
            opacity: next ? 1 : 0.3,
            pointerEvents: next ? "auto" : "none",
          }}
          onClick={() => next && onOpenBlog(next._id)}
        >
          <div
            style={{
              ...S.navDir,
              justifyContent: isMobile ? "flex-start" : "flex-end",
            }}
          >
            Next Post →
          </div>
          <p style={S.navTitle}>{next ? next.title : "—"}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const isMobile = useIsMobile(768);
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [search, setSearch] = useState("");
  const [filteredCat, setFilteredCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [blogsRes, catsRes] = await Promise.all([
          fetch(`${BLOG_API}/all`),
          fetch(CAT_API),
        ]);
        if (!blogsRes.ok) throw new Error(`Blog API error: ${blogsRes.status}`);
        if (!catsRes.ok) throw new Error(`Category API error: ${catsRes.status}`);
        const blogsData = await blogsRes.json();
        const catsData = await catsRes.json();
        const fetchedBlogs = blogsData.blogs || [];
        const fetchedCats = catsData.categories || catsData || [];
        const tagSet = new Set();
        fetchedBlogs.forEach((b) => (b.tags || []).forEach((t) => tagSet.add(t)));
        setBlogs(fetchedBlogs);
        setCategories(fetchedCats);
        setTags([...tagSet]);
        setError(null);
      } catch (e) {
        setError(e.message || "Failed to load blog data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredBlogs = blogs.filter((b) => {
    if (b.isActive === false) return false;
    if (filteredCat && getCategoryId(b) !== filteredCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        stripHtml(b.description).toLowerCase().includes(q) ||
        (b.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenBlog = useCallback(
    (id) => {
      const blog = blogs.find((b) => b._id === id);
      if (blog) setSelectedBlog(blog);
    },
    [blogs]
  );
  const handleBack = useCallback(() => setSelectedBlog(null), []);
  const handleFilterCat = useCallback((id) => {
    setFilteredCat(id);
    setSelectedBlog(null);
  }, []);
  const handleFilterTag = useCallback((tag) => {
    setSearch(tag);
    setSelectedBlog(null);
  }, []);

  const sidebarProps = {
    categories,
    blogs,
    filteredCat,
    search,
    tags,
    onFilterCat: handleFilterCat,
    onSearch: setSearch,
    onFilterTag: handleFilterTag,
    onOpenBlog: handleOpenBlog,
    isMobile,
    isOpen: sidebarOpen,
    onClose: () => setSidebarOpen(false),
  };

  if (loading) {
    return (
      <div style={S.page}>
        <div style={S.loadingWrap}>
          <div style={S.spinner} />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {/* Mobile top bar */}
      {isMobile && (
        <div style={S.mobileTopBar}>
          <span style={S.mobileTopBarTitle}>Blog</span>
          <button
            style={S.filterToggle}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open filters"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Filters
          </button>
        </div>
      )}

      {error && <div style={S.errorBanner}>⚠ {error}</div>}

      <div
        style={{
          ...S.layout,
          flexDirection: isMobile ? "column" : "row",
          padding: isMobile ? "0 12px" : "0 24px",
          gap: isMobile ? 0 : 28,
        }}
      >
        <main style={S.main}>
          {selectedBlog ? (
            <BlogDetail
              blog={selectedBlog}
              blogs={blogs}
              categories={categories}
              onBack={handleBack}
              onOpenBlog={handleOpenBlog}
              isMobile={isMobile}
            />
          ) : (
            <BlogList
              blogs={filteredBlogs}
              categories={categories}
              onOpenBlog={handleOpenBlog}
              isMobile={isMobile}
            />
          )}
        </main>

        {/* On desktop: static sidebar. On mobile: drawer via Sidebar component */}
        <Sidebar {...sidebarProps} />
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: "100vh",
    background: "#eef2ee",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#1a2e1a",
    padding: "0 0 64px",
  },

  // Mobile top bar
  mobileTopBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    background: "#fff",
    borderBottom: "1px solid #e8ede8",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  mobileTopBarTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a2e1a",
  },
  filterToggle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#f0f4f0",
    border: "1px solid #d8e4d8",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    color: "#1a2e1a",
    cursor: "pointer",
    fontFamily: "inherit",
    minHeight: 40,
  },

  // Overlay for mobile sidebar
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 200,
  },

  // Drawer for mobile
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "85vw",
    maxWidth: 340,
    background: "#eef2ee",
    zIndex: 201,
    overflowY: "auto",
    transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
    boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
    padding: "0 0 40px",
  },
  sidebarMobileHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #e0e8e0",
    background: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#888",
    padding: "4px 8px",
    lineHeight: 1,
    fontFamily: "inherit",
    minWidth: 36,
    minHeight: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  layout: {
    maxWidth: 1100,
    margin: "0 auto",
    paddingTop: 28,
    display: "flex",
    alignItems: "flex-start",
  },
  main: { flex: 1, minWidth: 0 },

  // Loading
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 80,
    fontSize: 14,
    color: "#888",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid #ddd",
    borderTop: "2px solid #3aaa7a",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  errorBanner: {
    maxWidth: 1100,
    margin: "0 auto 20px",
    padding: "10px 16px",
    background: "#fff0f0",
    color: "#c0392b",
    border: "1px solid #f5c6c6",
    borderRadius: 8,
    fontSize: 13,
  },
  empty: {
    padding: "60px 0",
    textAlign: "center",
    color: "#aaa",
    fontSize: 14,
  },

  // Blog card
  card: {
    display: "flex",
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    transition: "box-shadow 0.2s, transform 0.2s",
  },
  cardHover: {
    boxShadow: "0 4px 18px rgba(0,0,0,0.11)",
    transform: "translateY(-2px)",
  },
  imgWrap: {
    position: "relative",
    flexShrink: 0,
    overflow: "hidden",
    background: "#e8ede8",
  },
  cardImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  dateBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    background: "#3aaa7a",
    color: "#fff",
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 20,
  },
  cardBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minWidth: 0,
  },
  cardTitle: {
    fontWeight: 700,
    color: "#1a2e1a",
    lineHeight: 1.35,
    marginBottom: 12,
    marginTop: 0,
  },
  cardExcerpt: {
    fontSize: 14,
    color: "#555",
    lineHeight: 1.65,
    flex: 1,
    marginBottom: 16,
    marginTop: 0,
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  catLabel: {
    fontSize: 13,
    color: "#999",
  },
  readMore: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1a2e1a",
    letterSpacing: "0.3px",
    cursor: "pointer",
  },

  // Desktop Sidebar
  sidebar: {
    width: 300,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  sidebarMobile: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: "16px 12px",
  },
  sideCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "22px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  sideTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1a2e1a",
    marginBottom: 16,
    marginTop: 0,
  },
  catItem: {
    padding: "10px 0",
    fontSize: 14,
    color: "#888",
    cursor: "pointer",
    listStyle: "none",
    transition: "color 0.15s",
    borderBottom: "1px solid #f3f3f3",
    minHeight: 44,
    display: "flex",
    alignItems: "center",
  },
  catActive: {
    color: "#1a2e1a",
    fontWeight: 600,
  },
  searchRow: {
    display: "flex",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: "10px 14px",
    fontSize: 14,
    border: "1px solid #e0e0e0",
    borderRadius: 8,
    outline: "none",
    color: "#1a2e1a",
    background: "#fafafa",
    fontFamily: "inherit",
    minHeight: 44,
    boxSizing: "border-box",
  },
  searchBtn: {
    width: 44,
    height: 44,
    border: "1px solid #e0e0e0",
    borderRadius: "50%",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#555",
    flexShrink: 0,
  },
  latestItem: {
    display: "flex",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #f3f3f3",
    cursor: "pointer",
    alignItems: "flex-start",
    minHeight: 44,
  },
  latestThumb: {
    width: 60,
    height: 50,
    borderRadius: 8,
    objectFit: "cover",
    flexShrink: 0,
  },
  latestTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a2e1a",
    lineHeight: 1.4,
    margin: "0 0 4px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  latestDate: {
    fontSize: 12,
    color: "#aaa",
  },
  tagPill: {
    fontSize: 12,
    color: "#555",
    background: "#f0f4f0",
    border: "1px solid #e0e8e0",
    borderRadius: 20,
    padding: "6px 12px",
    cursor: "pointer",
    transition: "background 0.15s",
    minHeight: 32,
    display: "inline-flex",
    alignItems: "center",
  },

  // Detail
  backBtn: {
    background: "none",
    border: "none",
    fontSize: 13,
    color: "#888",
    cursor: "pointer",
    padding: 0,
    marginBottom: 16,
    fontFamily: "inherit",
    minHeight: 44,
    display: "flex",
    alignItems: "center",
  },
  detailHero: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    background: "#e8ede8",
  },
  detailHeroImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  detailCard: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    marginBottom: 16,
  },
  detailMeta: {
    display: "flex",
    gap: 8,
    fontSize: 13,
    color: "#999",
    marginBottom: 14,
    alignItems: "center",
    flexWrap: "wrap",
  },
  detailTitle: {
    fontWeight: 700,
    color: "#1a2e1a",
    lineHeight: 1.3,
    marginBottom: 20,
    marginTop: 0,
  },
  detailBody: {
    lineHeight: 1.8,
    color: "#444",
  },
  navRow: {
    display: "flex",
    gap: 12,
  },
  navPost: {
    flex: 1,
    background: "#fff",
    borderRadius: 12,
    padding: "14px 16px",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    transition: "box-shadow 0.2s",
  },
  navDir: {
    fontSize: 12,
    color: "#bbb",
    marginBottom: 6,
    display: "flex",
    alignItems: "center",
  },
  navTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a2e1a",
    lineHeight: 1.4,
    margin: 0,
  },
};