// Renders the ordered post body produced by the block editor. Server-safe
// (no client hooks) so it can be used directly in Server Components.

function TextBlock({ text }) {
  // Preserve paragraph breaks the author typed (blank line between paragraphs).
  const paragraphs = String(text || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        // Single newlines inside a paragraph become <br/>.
        <p key={i}>
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

function ImageBlock({ url, caption }) {
  if (!url) return null;
  return (
    <figure className="blog-figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={caption || ""} loading="lazy" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function YouTubeBlock({ videoId, url }) {
  // Fall back to parsing the url if the stored id is missing.
  const id =
    videoId ||
    (String(url || "").match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
    ) || [])[1];
  if (!id) return null;
  return (
    <div className="video-embed">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default function BlockRenderer({ blocks = [] }) {
  return (
    <div className="blog-body">
      {blocks.map((b, i) => {
        if (b.type === "text") return <TextBlock key={i} text={b.text} />;
        if (b.type === "image")
          return <ImageBlock key={i} url={b.url} caption={b.caption} />;
        if (b.type === "youtube")
          return <YouTubeBlock key={i} videoId={b.videoId} url={b.url} />;
        return null;
      })}
    </div>
  );
}
