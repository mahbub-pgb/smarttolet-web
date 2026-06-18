import { useEffect, useState } from 'react';
import { api, errMsg } from '../../api/client';

export default function Moderation() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/listings/queue');
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

  const moderate = async (id, approve) => {
    let reason;
    if (!approve) {
      reason = window.prompt('Rejection reason (optional):') || undefined;
    }
    setBusyId(id);
    try {
      await api.patch(`/admin/listings/${id}/moderate`, { approve, reason });
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1>Moderation Queue</h1>
      <p className="muted">Listings awaiting review.</p>
      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : listings.length === 0 ? (
        <p className="muted">Nothing pending. All caught up! 🎉</p>
      ) : (
        <div className="mod-list">
          {listings.map((l) => (
            <div className="mod-card" key={l._id}>
              <div className="mod-thumb">
                {l.images?.[0]?.url ? (
                  <img src={l.images[0].url} alt={l.title} />
                ) : (
                  <div className="no-img">No image</div>
                )}
              </div>
              <div className="mod-info">
                <span className="badge">{l.type?.replace(/_/g, ' ')}</span>
                <h3>{l.title}</h3>
                <p className="muted">
                  ৳ {Number(l.monthlyRent).toLocaleString()}/mo ·{' '}
                  {[l.location?.area, l.location?.district].filter(Boolean).join(', ')}
                </p>
                <p className="desc">{l.description}</p>
                <p className="muted small">
                  By {l.owner?.fullName || l.owner?.mobile || 'Unknown'}
                </p>
              </div>
              <div className="mod-actions">
                <button
                  className="btn btn-primary"
                  disabled={busyId === l._id}
                  onClick={() => moderate(l._id, true)}
                >
                  Approve
                </button>
                <button
                  className="btn btn-danger"
                  disabled={busyId === l._id}
                  onClick={() => moderate(l._id, false)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
