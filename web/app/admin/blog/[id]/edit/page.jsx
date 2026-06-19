"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BlogEditor from "@/components/blog/BlogEditor";
import { api, errMsg } from "@/lib/apiClient";

export default function EditBlogPostPage() {
  const router = useRouter();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/blog/admin/${id}`);
        setPost(data.data.post);
      } catch (err) {
        setError(errMsg(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onSubmit = async (payload) => {
    await api.put(`/blog/${id}`, payload);
    router.push("/admin/blog");
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <div className="alert error">{error}</div>;
  if (!post) return <p>Post not found.</p>;

  return (
    <div>
      <div className="page-head">
        <h1>Edit post</h1>
        <a className="btn btn-ghost" href={`/blog/${post.slug}`} target="_blank" rel="noreferrer">
          View ↗
        </a>
      </div>
      <BlogEditor initial={post} onSubmit={onSubmit} />
    </div>
  );
}
