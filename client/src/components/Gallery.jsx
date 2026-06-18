import { useCallback, useEffect, useState } from 'react';

/**
 * Listing image gallery: a large main image with a thumbnail strip, plus a
 * fullscreen lightbox (click to open; arrow keys / Esc to navigate / close).
 */
export default function Gallery({ images = [], title = '' }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const count = images.length;
  const go = useCallback(
    (delta) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  // Keyboard controls + scroll lock while the lightbox is open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, go]);

  if (!count) return <div className="no-img big">No images</div>;

  const current = images[index];

  return (
    <div className="gallery2">
      <button type="button" className="gallery2-main" onClick={() => setOpen(true)} aria-label="Open image">
        <img src={current.url} alt={`${title} ${index + 1}`} />
        <span className="gallery2-zoom">⤢ View full</span>
      </button>

      {count > 1 && (
        <div className="gallery2-thumbs">
          {images.map((img, i) => (
            <button
              type="button"
              key={i}
              className={`gallery2-thumb ${i === index ? 'active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Image ${i + 1}`}
            >
              <img src={img.url} alt={`${title} thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="lightbox" onClick={() => setOpen(false)}>
          <button type="button" className="lightbox-close" onClick={() => setOpen(false)} aria-label="Close">
            ✕
          </button>
          {count > 1 && (
            <button
              type="button"
              className="lightbox-nav prev"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Previous"
            >
              ‹
            </button>
          )}
          <img
            className="lightbox-img"
            src={current.url}
            alt={`${title} ${index + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          {count > 1 && (
            <button
              type="button"
              className="lightbox-nav next"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Next"
            >
              ›
            </button>
          )}
          <div className="lightbox-count">
            {index + 1} / {count}
          </div>
        </div>
      )}
    </div>
  );
}
