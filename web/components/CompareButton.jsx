'use client';

import { useCompare } from '@/lib/CompareContext';

/**
 * Add/remove a listing from the compare set (max 3). `label` renders a text
 * button (detail page); otherwise a compact icon button (card overlay).
 */
export default function CompareButton({ listing, label = false, className = '' }) {
  const { isComparing, toggle, full } = useCompare();
  const on = isComparing(listing._id);

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!on && full) {
      alert('You can compare up to 3 listings. Remove one first.');
      return;
    }
    toggle(listing);
  };

  return (
    <button
      type="button"
      className={`cmp-btn ${on ? 'active' : ''} ${label ? 'cmp-labeled' : ''} ${className}`}
      onClick={onClick}
      aria-pressed={on}
      title={on ? 'Remove from compare' : 'Add to compare'}
    >
      <span className="cmp-icon">⇄</span>
      {label && <span>{on ? 'Added to compare' : 'Compare'}</span>}
    </button>
  );
}
