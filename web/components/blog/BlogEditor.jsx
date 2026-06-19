"use client";

import { useEffect, useRef, useState } from "react";
import { api, errMsg } from "@/lib/apiClient";

let blockSeq = 0;
const newKey = () => `b${Date.now()}_${blockSeq++}`;

// Map an existing post (or nothing) onto editable block state with stable keys.
function toBlocks(post) {
  const blocks = post?.blocks || [];
  return blocks.map((b) => ({ key: newKey(), ...b }));
}

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
  const [excerpt, setExcerpt] = useState(initial?.excerpt || "");
  const [cover, setCover] = useState(initial?.coverImage || null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [blocks, setBlocks] = useState(() => toBlocks(initial));

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [categoryId, setCategoryId] = useState(initial?.category?._id || initial?.category || "");
  const [tagIds, setTagIds] = useState(
    (initial?.tags || []).map((t) => t._id || t),
  );
  const [newTag, setNewTag] = useState("");
  const [newCat, setNewCat] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const coverInput = useRef(null);

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

  // ---- Blocks ----
  const addBlock = (type) => {
    const base = { key: newKey(), type };
    if (type === "text") base.text = "";
    if (type === "image") Object.assign(base, { url: "", publicId: "", caption: "" });
    if (type === "youtube") base.url = "";
    setBlocks((prev) => [...prev, base]);
  };

  const updateBlock = (key, patch) =>
    setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));

  const removeBlock = (key) => setBlocks((prev) => prev.filter((b) => b.key !== key));

  const moveBlock = (key, dir) =>
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const onBlockImage = async (key, file) => {
    if (!file) return;
    updateBlock(key, { uploading: true });
    try {
      const img = await uploadImageFile(file);
      updateBlock(key, { url: img.url, publicId: img.publicId, uploading: false });
    } catch (err) {
      updateBlock(key, { uploading: false });
      setError(errMsg(err));
    }
  };

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
  const submit = async (e, overrideStatus = "draft") => {
    e.preventDefault();
    setError("");
    const finalStatus = overrideStatus;
    if (!title.trim()) {
      setError("Please add a title.");
      return;
    }
    // Strip editor-only fields before sending.
    const cleanBlocks = blocks
      .map((b) => {
        if (b.type === "text") return { type: "text", text: b.text || "" };
        if (b.type === "image") {
          if (!b.url) return null; // drop image blocks with no uploaded image
          return { type: "image", url: b.url, publicId: b.publicId, caption: b.caption || "" };
        }
        if (b.type === "youtube") {
          if (!b.url) return null;
          return { type: "youtube", url: b.url };
        }
        return null;
      })
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      // null clears an existing cover; undefined would be dropped from JSON.
      coverImage: cover || null,
      blocks: cleanBlocks,
      category: categoryId || null,
      tags: tagIds,
      status: finalStatus,
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

      <label>Excerpt (short summary)</label>
      <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} maxLength={500} />

      <label>Cover image</label>
      <div className="cover-row">
        {cover?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.url} alt="cover" className="cover-thumb" />
        ) : (
          <div className="cover-thumb placeholder">No cover</div>
        )}
        <div className="cover-actions">
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            onChange={(e) => onCover(e.target.files?.[0])}
          />
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
            <input
              placeholder="New category…"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
            <button type="button" className="btn btn-ghost sm" onClick={createCategory}>Add</button>
          </div>
        </div>
        <div>
          <label>Tags</label>
          <div className="tag-pick">
            {tags.length === 0 && <small className="muted">No tags yet.</small>}
            {tags.map((t) => (
              <label key={t._id} className="checkbox">
                <input
                  type="checkbox"
                  checked={tagIds.includes(t._id)}
                  onChange={() => toggleTag(t._id)}
                />
                {t.name}
              </label>
            ))}
          </div>
          <div className="inline-add">
            <input
              placeholder="New tag…"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <button type="button" className="btn btn-ghost sm" onClick={createTag}>Add</button>
          </div>
        </div>
      </div>

      <h4>Content</h4>
      <div className="blocks">
        {blocks.length === 0 && (
          <p className="muted">No content yet. Add a block below.</p>
        )}
        {blocks.map((b, i) => (
          <div key={b.key} className="block">
            <div className="block-head">
              <span className="block-type">{b.type}</span>
              <div className="block-tools">
                <button type="button" className="btn btn-ghost sm" disabled={i === 0} onClick={() => moveBlock(b.key, -1)}>↑</button>
                <button type="button" className="btn btn-ghost sm" disabled={i === blocks.length - 1} onClick={() => moveBlock(b.key, 1)}>↓</button>
                <button type="button" className="btn btn-ghost sm" onClick={() => removeBlock(b.key)}>✕</button>
              </div>
            </div>

            {b.type === "text" && (
              <textarea
                rows={4}
                placeholder="Write a paragraph… (blank line starts a new paragraph)"
                value={b.text}
                onChange={(e) => updateBlock(b.key, { text: e.target.value })}
              />
            )}

            {b.type === "image" && (
              <div>
                {b.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.url} alt="" className="block-img" />
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onBlockImage(b.key, e.target.files?.[0])}
                />
                {b.uploading && <small className="muted">Uploading…</small>}
                <input
                  placeholder="Caption (optional)"
                  value={b.caption || ""}
                  onChange={(e) => updateBlock(b.key, { caption: e.target.value })}
                />
              </div>
            )}

            {b.type === "youtube" && (
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={b.url}
                onChange={(e) => updateBlock(b.key, { url: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      <div className="add-block-bar">
        <button type="button" className="btn btn-ghost sm" onClick={() => addBlock("text")}>+ Text</button>
        <button type="button" className="btn btn-ghost sm" onClick={() => addBlock("image")}>+ Image</button>
        <button type="button" className="btn btn-ghost sm" onClick={() => addBlock("youtube")}>+ YouTube</button>
      </div>

      <div className="editor-actions">
        {initial?.status === "published" ? (
          <span className="status green">Currently published</span>
        ) : initial ? (
          <span className="status">Currently draft</span>
        ) : null}
        <div className="spacer" />
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={(e) => submit(e, "draft")}
        >
          {busy ? "Saving…" : "Save as draft"}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={(e) => submit(e, "published")}
        >
          {busy ? "Saving…" : "Publish"}
        </button>
      </div>
    </form>
  );
}
