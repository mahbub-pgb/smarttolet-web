'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LISTING_TYPES } from '@/lib/constants';

// Amenity filter keys match the backend query params (see listing.service.js).
const AMENITIES = [
  { key: 'parking', label: 'Parking' },
  { key: 'lift', label: 'Lift/Elevator' },
  { key: 'generator', label: 'Generator' },
  { key: 'ac', label: 'Air conditioning' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'gas', label: 'Gas connection' },
  { key: 'security', label: 'Security guard' },
  { key: 'cctv', label: 'CCTV' },
  { key: 'gym', label: 'Gym' },
  { key: 'pool', label: 'Swimming pool' },
  { key: 'petFriendly', label: 'Pet friendly' },
];

const PRICE_MIN = 0;
const PRICE_MAX = 200000;
const PRICE_STEP = 1000;
const taka = (n) => `৳${Number(n).toLocaleString()}${n >= PRICE_MAX ? '+' : ''}`;

/**
 * URL-driven search/filter panel. Submitting pushes the query string so the
 * server can render filtered, paginated, shareable results. `showSort` adds the
 * sort control (grid only).
 */
export default function ListingFilters({ showSort = false, basePath = '/' }) {
  const router = useRouter();
  const sp = useSearchParams();

  const init = (k, d = '') => sp.get(k) ?? d;
  const [f, setF] = useState({
    keyword: init('keyword'),
    type: init('type'),
    bedrooms: init('bedrooms'),
    bathrooms: init('bathrooms'),
    balconies: init('balconies'),
    sort: init('sort'),
  });
  const [price, setPrice] = useState({
    min: Number(sp.get('minRent')) || PRICE_MIN,
    max: Number(sp.get('maxRent')) || PRICE_MAX,
  });
  const [amenities, setAmenities] = useState(
    Object.fromEntries(AMENITIES.map((a) => [a.key, sp.get(a.key) === 'true'])),
  );
  const [open, setOpen] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (k) => (e) => setAmenities({ ...amenities, [k]: e.target.checked });
  const setPriceMin = (e) =>
    setPrice((p) => ({ ...p, min: Math.min(Number(e.target.value), p.max - PRICE_STEP) }));
  const setPriceMax = (e) =>
    setPrice((p) => ({ ...p, max: Math.max(Number(e.target.value), p.min + PRICE_STEP) }));

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (v !== '' && v != null) params.set(k, v);
    });
    if (price.min > PRICE_MIN) params.set('minRent', String(price.min));
    if (price.max < PRICE_MAX) params.set('maxRent', String(price.max));
    AMENITIES.forEach((a) => {
      if (amenities[a.key]) params.set(a.key, 'true');
    });
    setOpen(false); // collapse the expanded filters once a search runs
    router.push(params.toString() ? `${basePath}?${params.toString()}` : basePath);
  };

  const reset = () => {
    setF({ keyword: '', type: '', bedrooms: '', bathrooms: '', balconies: '', sort: '' });
    setPrice({ min: PRICE_MIN, max: PRICE_MAX });
    setAmenities(Object.fromEntries(AMENITIES.map((a) => [a.key, false])));
    setOpen(false); // collapse the expanded filters when clearing
    router.push(basePath);
  };

  const amenityCount = Object.values(amenities).filter(Boolean).length;

  return (
    <form className="filters-panel" onSubmit={submit}>
      <div className="filters">
        <input placeholder="Search keyword…" value={f.keyword} onChange={set('keyword')} />
        <select value={f.type} onChange={set('type')}>
          <option value="">All types</option>
          {LISTING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide filters' : 'More filters'}
          {amenityCount > 0 ? ` (${amenityCount})` : ''}
        </button>
        <button className="btn btn-primary">Search</button>
        <button type="button" className="btn btn-ghost" onClick={reset}>
          Clear all
        </button>
      </div>

      {open && (
        <div className="filters-more">
          <label>
            Price range: <strong>{taka(price.min)}</strong> – <strong>{taka(price.max)}</strong>
          </label>
          <div className="price-slider">
            <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={price.min} onChange={setPriceMin} aria-label="Minimum rent" />
            <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={PRICE_STEP} value={price.max} onChange={setPriceMax} aria-label="Maximum rent" />
          </div>

          <div className="row">
            <div>
              <label>Bedrooms (min)</label>
              <input type="number" min={0} value={f.bedrooms} onChange={set('bedrooms')} />
            </div>
            <div>
              <label>Bathrooms (min)</label>
              <input type="number" min={0} value={f.bathrooms} onChange={set('bathrooms')} />
            </div>
            <div>
              <label>Balconies (min)</label>
              <input type="number" min={0} value={f.balconies} onChange={set('balconies')} />
            </div>
            {showSort && (
              <div>
                <label>Sort by</label>
                <select value={f.sort} onChange={set('sort')}>
                  <option value="">Newest</option>
                  <option value="rent_asc">Price: low to high</option>
                  <option value="rent_desc">Price: high to low</option>
                </select>
              </div>
            )}
          </div>

          <label>Amenities</label>
          <div className="checkbox-grid">
            {AMENITIES.map((a) => (
              <label key={a.key} className="checkbox">
                <input type="checkbox" checked={Boolean(amenities[a.key])} onChange={toggle(a.key)} />
                {a.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
