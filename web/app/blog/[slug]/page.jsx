import Link from "next/link";
import { notFound } from "next/navigation";
import BlockRenderer from "@/components/blog/BlockRenderer";
import { apiGet } from "@/lib/apiServer";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export const revalidate = 300; // ISR: refresh post pages every 5 min

async function getPost(slug) {
  const data = await apiGet(`/blog/${slug}`, { revalidate: 300 });
  return data?.post || null;
}

function fmtDate(v) {
  if (!v) return "";
  return new Date(v).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  if (!post) return { title: "Post not found" };

  const description = (
    post.excerpt ||
    post.blocks?.find((b) => b.type === "text")?.text ||
    ""
  )
    .replace(/\s+/g, " ")
    .slice(0, 160);
  const url = `${SITE_URL}/blog/${post.slug || post._id}`;
  const image = post.coverImage?.url;

  return {
    title: `${post.title} · ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      siteName: SITE_NAME,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug || post._id}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    image: post.coverImage?.url ? [post.coverImage.url] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.author?.fullName || "Staff" },
    mainEntityOfPage: url,
  };

  return (
    <div className="container narrow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/blog" className="muted">
        ← Back to blog
      </Link>

      <article className="blog-post">
        {post.category?.name && <span className="badge">{post.category.name}</span>}
        <h1>{post.title}</h1>
        <div className="blog-post-meta muted">
          <span>{post.author?.fullName || "Staff"}</span>
          {post.publishedAt && <span> · {fmtDate(post.publishedAt)}</span>}
        </div>

        {post.coverImage?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="blog-cover" src={post.coverImage.url} alt={post.title} />
        )}

        <BlockRenderer blocks={post.blocks || []} />

        {post.tags?.length > 0 && (
          <div className="tag-row blog-tags">
            {post.tags.map((t) => (
              <Link key={t._id} href={`/blog?tag=${t.slug}`} className="tag">
                #{t.name}
              </Link>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
