import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api/client';
import ListingFilters from '../components/ListingFilters';

const PAGE_SIZE = 12;

function ListingCard({ listing }) {
  const img = listing.images?.[0]?.url;
  return (
    <Link to={`/listings/${listing.slug || listing._id}`} className="listing-card">
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

// Build a compact windowed list of page numbers around the current page.
function pageWindow(page, totalPages) {
  const span = 2;
  const pages = [];
  const start = Math.max(1, page - span);
  const end = Math.min(totalPages, page + span);
  if (start > 1) pages.push(1, start > 2 ? '…' : null);
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < totalPages) pages.push(end < totalPages - 1 ? '…' : null, totalPages);
  return pages.filter((p) => p !== null);
}

export default function Home() {
  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { page, limit: PAGE_SIZE };
        Object.entries(applied).forEach(([k, v]) => {
          if (v) params[k] = v;
        });
        const { data } = await api.get('/listings', { params });
        if (cancelled) return;
        setListings(data.data.listings || []);
        setMeta(data.meta || null);
      } catch (err) {
        if (!cancelled) setError(errMsg(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [applied, page]);

  const onApply = (params) => {
    setPage(1);
    setApplied(params);
  };

  const goTo = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container">
      <section className="hero">
        <h1>Find your next home in Bangladesh</h1>
        <p className="muted">Browse verified rental listings across the country.</p>
      </section>

      <ListingFilters showSort onApply={onApply} />

      <div className="browse-bar">
        {meta && (
          <p className="muted results-line">
            {meta.total.toLocaleString()} listing{meta.total === 1 ? '' : 's'} found · page {meta.page} of{' '}
            {meta.totalPages}
          </p>
        )}
        <Link to="/map" className="btn btn-ghost sm">
          🗺 Map view
        </Link>
      </div>

      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <p>Loading listings…</p>
      ) : listings.length === 0 ? (
        <p className="muted">No listings found.</p>
      ) : (
        <>
          <div className="grid">
            {listings.map((l) => (
              <ListingCard key={l._id} listing={l} />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <nav className="pagination">
              <button
                className="btn btn-ghost sm"
                disabled={!meta.hasPrevPage}
                onClick={() => goTo(page - 1)}
              >
                ← Prev
              </button>
              {pageWindow(meta.page, meta.totalPages).map((p, i) =>
                p === '…' ? (
                  <span key={`gap-${i}`} className="page-gap">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`btn sm ${p === meta.page ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => goTo(p)}
                    disabled={p === meta.page}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                className="btn btn-ghost sm"
                disabled={!meta.hasNextPage}
                onClick={() => goTo(page + 1)}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
