'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useCompare } from '@/lib/CompareContext';
import { api } from '@/lib/apiClient';
import { cldThumb } from '@/lib/img';

const yn = (v) => (v ? '✓' : '—');

// Comparison rows: label + how to read the value off a listing.
const ROWS = [
  { label: 'Monthly rent', get: (l) => `৳ ${Number(l.monthlyRent || 0).toLocaleString()}` },
  { label: 'Type', get: (l) => l.type?.replace(/_/g, ' ') || '—' },
  { label: 'Location', get: (l) => l.location?.area || l.location?.district || '—' },
  { label: 'Bedrooms', get: (l) => l.details?.bedrooms ?? '—' },
  { label: 'Bathrooms', get: (l) => l.details?.bathrooms ?? '—' },
  { label: 'Balconies', get: (l) => l.details?.balconies ?? '—' },
  { label: 'Area (sqft)', get: (l) => l.details?.areaSqft ?? '—' },
  { label: 'Advance', get: (l) => (l.advanceAmount ? `৳ ${Number(l.advanceAmount).toLocaleString()}` : '—') },
  { label: 'Parking', get: (l) => yn(l.details?.parkingAvailable) },
  { label: 'Lift', get: (l) => yn(l.details?.liftAvailable) },
  { label: 'Generator', get: (l) => yn(l.details?.generatorAvailable) },
  { label: 'Air conditioning', get: (l) => yn(l.details?.airConditioning) },
  { label: 'WiFi', get: (l) => yn(l.utilities?.internet) },
  { label: 'Gas', get: (l) => yn(l.utilities?.gas) },
  { label: 'Security guard', get: (l) => yn(l.utilities?.securityGuard) },
  { label: 'CCTV', get: (l) => yn(l.utilities?.cctv) },
];

export default function ComparePage() {
  const { items, remove, clear } = useCompare();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refetch whenever the set of ids changes.
  const key = useMemo(() => items.map((i) => i._id).join(','), [items]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const results = await Promise.all(
        items.map((i) =>
          api
            .get(`/listings/${i.slug || i._id}`)
            .then((r) => r.data.data.listing)
            .catch(() => null),
        ),
      );
      if (active) {
        setListings(results.filter(Boolean));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div className="container">
      <div className="page-head">
        <h1>Compare listings</h1>
        {items.length > 0 && (
          <button className="btn btn-ghost sm" onClick={clear}>
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="muted">
          You haven&apos;t added any listings to compare yet. Browse listings and tap{' '}
          <strong>⇄ Compare</strong> on up to 3 of them.{' '}
          <Link href="/">Browse listings →</Link>
        </p>
      ) : loading ? (
        <p>Loading…</p>
      ) : (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="compare-rowhead" />
                {listings.map((l) => (
                  <th key={l._id}>
                    <div className="compare-col-head">
                      <Link href={`/listings/${l.slug || l._id}`}>
                        {l.images?.[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cldThumb(l.images[0].url, 320)} alt={l.title} />
                        ) : (
                          <div className="compare-noimg">No image</div>
                        )}
                        <span className="compare-col-title">{l.title}</span>
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost sm"
                        onClick={() => remove(l._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="compare-rowhead">{row.label}</td>
                  {listings.map((l) => (
                    <td key={l._id}>{row.get(l)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
