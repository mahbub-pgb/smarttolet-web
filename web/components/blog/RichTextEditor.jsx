"use client";

// CKEditor 5 (classic build) wrapped for our blog editor. Loaded only on the
// client — the prebuilt editor touches `window` at import time, so callers must
// pull this in via next/dynamic({ ssr: false }).

import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { api } from "@/lib/apiClient";

// Bridges CKEditor's image upload to our existing /blog/upload-image endpoint
// (Cloudinary, with a local-disk fallback in dev).
class BlogUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  async upload() {
    const file = await this.loader.file;
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post("/blog/upload-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // CKEditor expects { default: <url> } (optionally more sizes).
    return { default: data.data.image.url };
  }

  abort() {
    /* nothing to clean up: the request is fire-and-forget */
  }
}

function UploadAdapterPlugin(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) =>
    new BlogUploadAdapter(loader);
}

const EDITOR_CONFIG = {
  extraPlugins: [UploadAdapterPlugin],
  // Store the embed preview (the actual <iframe>) in the saved data so the
  // public page can render YouTube directly without re-resolving oEmbed.
  mediaEmbed: { previewsInData: true },
};

export default function RichTextEditor({ value, onChange }) {
  return (
    <div className="ck-wrap">
      <CKEditor
        editor={ClassicEditor}
        config={EDITOR_CONFIG}
        data={value || ""}
        onChange={(_event, editor) => onChange(editor.getData())}
      />
    </div>
  );
}
