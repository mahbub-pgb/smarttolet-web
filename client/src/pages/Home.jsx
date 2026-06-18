import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api/client';

const TYPES = [
  'apartment', 'flat', 'family_house', 'bachelor_room', 'sublet',
  'hostel', 'mess', 'office', 'shop', 'commercial_space',
];

function ListingCard({ listing }) {
  const img = listing.images?.[0]?.url;
  return (
    <Link to={`/listings/${listing._id}`} className="listing-card">
      <div className="listing-thumb">
        {img ? <img src={img} alt={listing.title} /> : <div className="no-img">No image</div>}
      </div>
      <div className="listing-body">
        <span className="badge">{listing.type?.replace(/_/g, ' ')}</span>
        <h3>{listing.title}</h3>
        <p className="muted">
          {listing.location?.area ? `${listing.location.area}, ` : ''}
          {listing.location?.district}
        </p>
        <div className="rent">৳ {Number(listing.monthlyRent).toLocaleString()}/mo</div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ keyword: '', type: '', district: '' });

  const load = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/listings', { params });
      setListings(data.data.listings || []);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    load(params);
  };

  return (
    <div className="container">
      <section className="hero">
        <h1>Find your next home in Bangladesh</h1>
        <p className="muted">Browse verified rental listings across the country.</p>
      </section>

      <form className="filters" onSubmit={onSearch}>
        <input
          placeholder="Search keyword…"
          value={filters.keyword}
          onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
        />
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <input
          placeholder="District"
          value={filters.district}
          onChange={(e) => setFilters({ ...filters, district: e.target.value })}
        />
        <button className="btn btn-primary">Search</button>
      </form>

      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <p>Loading listings…</p>
      ) : listings.length === 0 ? (
        <p className="muted">No listings found. Be the first to post one!</p>
      ) : (
        <div className="grid">
          {listings.map((l) => (
            <ListingCard key={l._id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
