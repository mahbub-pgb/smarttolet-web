"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, errMsg } from "@/lib/apiClient";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
];

function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showManage, setShowManage] = useState(false);

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get("/blog/admin/list", {
        params: { status, ...params },
      });
      setPosts(data.data.posts || []);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(search ? { keyword: search } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const remove = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/blog/${post._id}`);
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
    } catch (err) {
      alert(errMsg(err));
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Blog</h1>
        <div className="actions">
          <button className="btn btn-ghost" onClick={() => setShowManage((s) => !s)}>
            Categories &amp; tags
          </button>
          <Link href="/admin/blog/new" className="btn btn-primary">+ New post</Link>
        </div>
      </div>

      {showManage && <TaxonomyManager onClose={() => setShowManage(false)} />}

      <div className="toolbar wrap">
        <div className="tabs">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              className={`tab ${status === t.value ? "active" : ""}`}
              onClick={() => setStatus(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <form
          className="inline grow"
          onSubmit={(e) => {
            e.preventDefault();
            load(search ? { keyword: search } : {});
          }}
        >
          <input
            placeholder="Search posts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-primary">Search</button>
        </form>
      </div>

      {error && <div className="alert error">{error}</div>}

      {loading ? (
        <p>Loading…</p>
      ) : posts.length === 0 ? (
        <p className="muted">No posts yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Category</th>
              <th>Views</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p._id}>
                <td>{p.title}</td>
                <td>
                  <span className={`status ${p.status === "published" ? "green" : ""}`}>
                    {p.status}
                  </span>
                </td>
                <td>{p.category?.name || "—"}</td>
                <td>{p.viewsCount || 0}</td>
                <td>{fmtDate(p.publishedAt || p.updatedAt)}</td>
                <td className="actions">
                  <Link href={`/admin/blog/${p._id}/edit`} className="btn btn-ghost sm">
                    Edit
                  </Link>
                  {p.status === "published" && (
                    <a
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost sm"
                    >
                      View
                    </a>
                  )}
                  <button className="btn btn-ghost sm" onClick={() => remove(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ---- Inline categories & tags management ----
function TaxonomyManager() {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [catName, setCatName] = useState("");
  const [tagName, setTagName] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const [c, t] = await Promise.all([
        api.get("/blog/categories"),
        api.get("/blog/tags"),
      ]);
      setCategories(c.data.data.categories || []);
      setTags(t.data.data.tags || []);
    } catch (e) {
      setErr(errMsg(e));
    }
  };
  useEffect(() => {
    load();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      const { data } = await api.post("/blog/categories", { name: catName.trim() });
      setCategories((prev) => [...prev, data.data.category]);
      setCatName("");
    } catch (e2) {
      setErr(errMsg(e2));
    }
  };

  const addTag = async (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    try {
      const { data } = await api.post("/blog/tags", { name: tagName.trim() });
      setTags((prev) => [...prev, data.data.tag]);
      setTagName("");
    } catch (e2) {
      setErr(errMsg(e2));
    }
  };

  const removeCategory = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await api.delete(`/blog/categories/${c._id}`);
      setCategories((prev) => prev.filter((x) => x._id !== c._id));
    } catch (e2) {
      alert(errMsg(e2));
    }
  };

  const removeTag = async (t) => {
    if (!window.confirm(`Delete tag "${t.name}"?`)) return;
    try {
      await api.delete(`/blog/tags/${t._id}`);
      setTags((prev) => prev.filter((x) => x._id !== t._id));
    } catch (e2) {
      alert(errMsg(e2));
    }
  };

  return (
    <div className="card taxonomy">
      {err && <div className="alert error">{err}</div>}
      <div className="row">
        <div>
          <h4>Categories</h4>
          <form className="inline-add" onSubmit={addCategory}>
            <input placeholder="New category…" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <button className="btn btn-ghost sm">Add</button>
          </form>
          <div className="chip-list">
            {categories.map((c) => (
              <span key={c._id} className="tag">
                {c.name}
                <button type="button" className="chip-x" onClick={() => removeCategory(c)}>✕</button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4>Tags</h4>
          <form className="inline-add" onSubmit={addTag}>
            <input placeholder="New tag…" value={tagName} onChange={(e) => setTagName(e.target.value)} />
            <button className="btn btn-ghost sm">Add</button>
          </form>
          <div className="chip-list">
            {tags.map((t) => (
              <span key={t._id} className="tag">
                {t.name}
                <button type="button" className="chip-x" onClick={() => removeTag(t)}>✕</button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
