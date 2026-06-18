import { useState } from 'react';

const TYPES = [
  'apartment', 'flat', 'family_house', 'bachelor_room', 'sublet',
  'hostel', 'mess', 'office', 'shop', 'commercial_space',
];

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

// Price slider bounds (BDT). PRICE_MAX doubles as "no upper limit".
const PRICE_MIN = 0;
const PRICE_MAX = 200000;
const PRICE_STEP = 1000;

const EMPTY = {
  keyword: '', type: '', bedrooms: '', bathrooms: '', balconies: '', sort: '',
};
const FULL_RANGE = { min: PRICE_MIN, max: PRICE_MAX };

const taka = (n) => `৳${Number(n).toLocaleString()}${n >= PRICE_MAX ? '+' : ''}`;

/**
 * Shared search/filter panel for the listings grid and map. Builds a clean
 * params object (only non-empty values) and hands it to `onApply`. `showSort`
 * adds the sort control (grid only — the map has no ordering).
 */
export default function ListingFilters({ showSort = false, onApply }) {
  const [f, setF] = useState(EMPTY);
  const [price, setPrice] = useState(FULL_RANGE);
  const [amenities, setAmenities] = useState({});
  const [open, setOpen] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggle = (k) => (e) => setAmenities({ ...amenities, [k]: e.target.checked });

  // Keep the two thumbs from crossing over each other.
  const setPriceMin = (e) =>
    setPrice((p) => ({ ...p, min: Math.min(Number(e.target.value), p.max - PRICE_STEP) }));
  const setPriceMax = (e) =>
    setPrice((p) => ({ ...p, max: Math.max(Number(e.target.value), p.min + PRICE_STEP) }));

  const build = () => {
    const params = {};
    Object.entries(f).forEach(([k, v]) => {
      if (v !== '' && v != null) params[k] = v;
    });
    // Only send price bounds when they differ from the full range.
    if (price.min > PRICE_MIN) params.minRent = price.min;
    if (price.max < PRICE_MAX) params.maxRent = price.max;
    Object.entries(amenities).forEach(([k, v]) => {
      if (v) params[k] = 'true';
    });
    return params;
  };

  const submit = (e) => {
    e.preventDefault();
    onApply(build());
  };

  const reset = () => {
    setF(EMPTY);
    setPrice(FULL_RANGE);
    setAmenities({});
    onApply({});
  };

  const amenityCount = Object.values(amenities).filter(Boolean).length;

  return (
    <form className="filters-panel" onSubmit={submit}>
      <div className="filters">
        <input
          placeholder="Search keyword…"
          value={f.keyword}
          onChange={set('keyword')}
        />
        <select value={f.type} onChange={set('type')}>
          <option value="">All types</option>
          {TYPES.map((t) => (
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
      </div>

      {open && (
        <div className="filters-more">
          <label>
            Price range: <strong>{taka(price.min)}</strong> – <strong>{taka(price.max)}</strong>
          </label>
          <div className="price-slider">
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={price.min}
              onChange={setPriceMin}
              aria-label="Minimum rent"
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={price.max}
              onChange={setPriceMax}
              aria-label="Maximum rent"
            />
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
                <input
                  type="checkbox"
                  checked={Boolean(amenities[a.key])}
                  onChange={toggle(a.key)}
                />
                {a.label}
              </label>
            ))}
          </div>

          <button type="button" className="btn btn-ghost sm" onClick={reset}>
            Clear all
          </button>
        </div>
      )}
    </form>
  );
}
