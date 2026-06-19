import Link from "next/link";
import { apiGet, apiGetWithMeta } from "@/lib/apiServer";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const revalidate = 120; // ISR: refresh the blog index every 2 min

export const metadata = {
  title: `Blog · ${SITE_NAME}`,
  description: "Tips, guides and news about renting in Bangladesh.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

function fmtDate(v) {
  if (!v) return "";
  return new Date(v).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogIndexPage({ searchParams }) {
  const page = Number(searchParams?.page) || 1;
  const category = searchParams?.category || "";
  const tag = searchParams?.tag || "";
  const q = searchParams?.q || "";

  const [{ data, meta }, catData] = await Promise.all([
    apiGetWithMeta("/blog", {
      revalidate: 120,
      params: { page, category, tag, keyword: q, limit: 12 },
    }),
    apiGet("/blog/categories", { revalidate: 600 }),
  ]);

  const posts = data?.posts || [];
  const categories = catData?.categories || [];
  const totalPages = meta?.totalPages || 1;

  // Preserve active filters when building pagination links.
  const qs = (overrides) => {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (tag) p.set("tag", tag);
    if (q) p.set("q", q);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    const s = p.toString();
    return s ? `/blog?${s}` : "/blog";
  };

  return (
    <div className="container">
      <div className="blog-head">
        <h1>Blog</h1>
        <p className="muted">Tips, guides and news about renting in Bangladesh.</p>
      </div>

      <form className="toolbar" action="/blog" method="get">
        {category && <input type="hidden" name="category" value={category} />}
        <input name="q" defaultValue={q} placeholder="Search posts…" />
        <button className="btn btn-primary">Search</button>
      </form>

      {categories.length > 0 && (
        <div className="tag-row blog-cats">
          <Link href={qs({ category: "", page: "" })} className={`tag ${!category ? "active" : ""}`}>
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c._id}
              href={qs({ category: c.slug, page: "" })}
              className={`tag ${category === c.slug ? "active" : ""}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="muted">No posts found.</p>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => (
            <Link key={post._id} href={`/blog/${post.slug}`} className="blog-card">
              {post.coverImage?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="blog-card-cover" src={post.coverImage.url} alt={post.title} />
              ) : (
                <div className="blog-card-cover placeholder">📝</div>
              )}
              <div className="blog-card-body">
                {post.category?.name && <span className="badge">{post.category.name}</span>}
                <h3>{post.title}</h3>
                {post.excerpt && <p className="muted">{post.excerpt}</p>}
                <div className="blog-card-meta muted">
                  <span>{post.author?.fullName || "Staff"}</span>
                  {post.publishedAt && <span> · {fmtDate(post.publishedAt)}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && (
            <Link className="btn btn-ghost" href={qs({ page: String(page - 1) })}>
              ← Newer
            </Link>
          )}
          <span className="muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link className="btn btn-ghost" href={qs({ page: String(page + 1) })}>
              Older →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
