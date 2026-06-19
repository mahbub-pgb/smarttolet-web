'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCompare } from '@/lib/CompareContext';
import { cldThumb } from '@/lib/img';

/**
 * Floating bar listing the selected compare items. Hidden when empty and on the
 * compare page itself (and in the admin area).
 */
export default function CompareBar() {
  const { items, remove, clear } = useCompare();
  const pathname = usePathname();

  if (!items.length) return null;
  if (pathname === '/compare' || pathname?.startsWith('/admin')) return null;

  return (
    <div className="compare-bar">
      <div className="compare-bar-items">
        {items.map((i) => (
          <div key={i._id} className="compare-chip">
            {i.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cldThumb(i.image, 80)} alt="" />
            ) : (
              <div className="compare-chip-noimg">🏠</div>
            )}
            <span className="compare-chip-title">{i.title}</span>
            <button
              type="button"
              className="compare-chip-x"
              onClick={() => remove(i._id)}
              aria-label="Remove from compare"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="compare-bar-actions">
        <button type="button" className="btn btn-ghost sm" onClick={clear}>
          Clear
        </button>
        <Link className="btn btn-primary sm" href="/compare">
          Compare ({items.length})
        </Link>
      </div>
    </div>
  );
}
