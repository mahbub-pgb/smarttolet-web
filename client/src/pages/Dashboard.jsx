import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STAT_CARDS = [
  { key: 'total', label: 'Total listings' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending review' },
  { key: 'draft', label: 'Drafts' },
  { key: 'rented', label: 'Rented' },
  { key: 'rejected', label: 'Rejected' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/listings/me/stats')
      .then(({ data }) => setStats(data.data.stats))
      .catch((err) => setError(errMsg(err)));
  }, []);

  // Flatten { total, byStatus:{...} } into a lookup the cards can read.
  const value = (key) =>
    key === 'total' ? stats?.total ?? 0 : stats?.byStatus?.[key] ?? 0;

  return (
    <div className="container">
      <div className="page-head">
        <h2>My Dashboard</h2>
        <Link to="/create" className="btn btn-primary">
          + New listing
        </Link>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="card profile-summary">
        <div>
          <h3>{user?.fullName || 'Welcome'}</h3>
          <p className="muted">📞 {user?.mobile}</p>
          {user?.email && <p className="muted">✉ {user.email}</p>}
          {user?.isLandlordVerified && <span className="badge verified">Verified landlord</span>}
        </div>
      </div>

      <div className="stat-grid">
        {STAT_CARDS.map((c) => (
          <div key={c.key} className="stat-card">
            <div className="stat-value">{stats ? value(c.key) : '—'}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-actions">
        <Link to="/my-listings" className="btn btn-ghost">
          📋 View all my listings
        </Link>
        <Link to="/change-password" className="btn btn-ghost">
          🔒 Change password
        </Link>
      </div>
    </div>
  );
}
