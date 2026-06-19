"use client";

import { useRouter } from "next/navigation";
import BlogEditor from "@/components/blog/BlogEditor";
import { api } from "@/lib/apiClient";

export default function NewBlogPostPage() {
  const router = useRouter();

  const onSubmit = async (payload) => {
    await api.post("/blog", payload);
    router.push("/admin/blog");
  };

  return (
    <div>
      <div className="page-head">
        <h1>New post</h1>
      </div>
      <BlogEditor onSubmit={onSubmit} />
    </div>
  );
}
