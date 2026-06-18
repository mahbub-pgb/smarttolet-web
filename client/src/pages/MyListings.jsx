import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api/client';

const STATUS_COLORS = {
  draft: 'gray',
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  rented: 'blue',
  expired: 'gray',
};

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/listings/me/list');
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

  const remove = async (id) => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      alert(errMsg(err));
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h2>My Listings</h2>
        <Link to="/create" className="btn btn-primary">
          + New listing
        </Link>
      </div>
      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : listings.length === 0 ? (
        <p className="muted">You haven't posted any listings yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Rent</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l._id}>
                <td>
                  <Link to={`/listings/${l.slug || l._id}`}>{l.title}</Link>
                </td>
                <td>{l.type?.replace(/_/g, ' ')}</td>
                <td>৳ {Number(l.monthlyRent).toLocaleString()}</td>
                <td>
                  <span className={`status ${STATUS_COLORS[l.status] || 'gray'}`}>{l.status}</span>
                </td>
                <td className="actions">
                  <Link to={`/listings/${l._id}/edit`} className="btn btn-ghost sm">
                    Edit
                  </Link>
                  <button className="btn btn-ghost sm" onClick={() => remove(l._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
