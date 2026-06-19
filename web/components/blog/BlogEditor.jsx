"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api, errMsg } from "@/lib/apiClient";

// CKEditor must load client-side only (the prebuilt editor uses `window`).
const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => <div className="ck-loading">Loading editor…</div>,
});

async function uploadImageFile(file) {
  const fd = new FormData();
  fd.append("image", file);
  const { data } = await api.post("/blog/upload-image", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data.image; // { url, publicId }
}

export default function BlogEditor({ initial, onSubmit }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [cover, setCover] = useState(initial?.coverImage || null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [content, setContent] = useState(initial?.contentHtml || "");

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [categoryId, setCategoryId] = useState(initial?.category?._id || initial?.category || "");
  const [tagIds, setTagIds] = useState((initial?.tags || []).map((t) => t._id || t));
  const [newTag, setNewTag] = useState("");
  const [newCat, setNewCat] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadTaxonomy = async () => {
    try {
      const [c, t] = await Promise.all([
        api.get("/blog/categories"),
        api.get("/blog/tags"),
      ]);
      setCategories(c.data.data.categories || []);
      setTags(t.data.data.tags || []);
    } catch {
      /* non-fatal: editor still works without taxonomy */
    }
  };
  useEffect(() => {
    loadTaxonomy();
  }, []);

  // ---- Cover ----
  const onCover = async (file) => {
    if (!file) return;
    setCoverBusy(true);
    try {
      const img = await uploadImageFile(file);
      setCover(img);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setCoverBusy(false);
    }
  };

  // ---- Taxonomy inline create ----
  const toggleTag = (id) =>
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const createTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    try {
      const { data } = await api.post("/blog/tags", { name });
      const tag = data.data.tag;
      setTags((prev) => [...prev, tag]);
      setTagIds((prev) => [...prev, tag._id]);
      setNewTag("");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const createCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    try {
      const { data } = await api.post("/blog/categories", { name });
      const cat = data.data.category;
      setCategories((prev) => [...prev, cat]);
      setCategoryId(cat._id);
      setNewCat("");
    } catch (err) {
      setError(errMsg(err));
    }
  };

  // ---- Submit ----
  const submit = async (status) => {
    setError("");
    if (!title.trim()) {
      setError("Please add a title.");
      return;
    }
    const payload = {
      title: title.trim(),
      // Excerpt is auto-derived from the content on the server.
      coverImage: cover || null, // null clears an existing cover
      contentHtml: content,
      category: categoryId || null,
      tags: tagIds,
      status,
    };

    setBusy(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="blog-editor" onSubmit={(e) => e.preventDefault()}>
      {error && <div className="alert error">{error}</div>}

      <label>Title</label>
      <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={180} />

      <label>Cover image</label>
      <div className="cover-row">
        {cover?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="cover" className="cover-thumb" />
        ) : (
          <div className="cover-thumb placeholder">No cover</div>
        )}
        <div className="cover-actions">
          <input type="file" accept="image/*" onChange={(e) => onCover(e.target.files?.[0])} />
          {coverBusy && <small className="muted">Uploading…</small>}
          {cover?.url && (
            <button type="button" className="btn btn-ghost sm" onClick={() => setCover(null)}>
              Remove cover
            </button>
          )}
        </div>
      </div>

      <div className="row">
        <div>
          <label>Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <div className="inline-add">
            <input placeholder="New category…" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button type="button" className="btn btn-ghost sm" onClick={createCategory}>Add</button>
          </div>
        </div>
        <div>
          <label>Tags</label>
          <div className="tag-pick">
            {tags.length === 0 && <small className="muted">No tags yet.</small>}
            {tags.map((t) => (
              <label key={t._id} className="checkbox">
                <input type="checkbox" checked={tagIds.includes(t._id)} onChange={() => toggleTag(t._id)} />
                {t.name}
              </label>
            ))}
          </div>
          <div className="inline-add">
            <input placeholder="New tag…" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
            <button type="button" className="btn btn-ghost sm" onClick={createTag}>Add</button>
          </div>
        </div>
      </div>

      <label>Content</label>
      <RichTextEditor value={content} onChange={setContent} />
      <small className="muted">
        Use the toolbar to format text, upload images, and embed YouTube videos (paste a YouTube URL via the media button).
      </small>

      <div className="editor-actions">
        {initial?.status === "published" ? (
          <span className="status green">Currently published</span>
        ) : initial ? (
          <span className="status">Currently draft</span>
        ) : null}
        <div className="spacer" />
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => submit("draft")}>
          {busy ? "Saving…" : "Save as draft"}
        </button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => submit("published")}>
          {busy ? "Saving…" : "Publish"}
        </button>
      </div>
    </form>
  );
}
