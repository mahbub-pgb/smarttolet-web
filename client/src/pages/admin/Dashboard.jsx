import { useEffect, useState } from 'react';
import { api, errMsg } from '../../api/client';

const LABELS = {
  totalUsers: 'Total Users',
  totalLandlords: 'Verified Landlords',
  totalModerators: 'Moderators',
  totalListings: 'Total Listings',
  pendingListings: 'Pending Review',
  approvedListings: 'Approved',
  rejectedListings: 'Rejected',
  activeSubscriptions: 'Active Subscriptions',
  monthlyRevenue: 'Revenue (this month)',
};

export default function Dashboard() {
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data }) => setCards(data.data.cards))
      .catch((err) => setError(errMsg(err)));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {error && <div className="alert error">{error}</div>}
      {!cards ? (
        <p>Loading…</p>
      ) : (
        <div className="cards">
          {Object.entries(LABELS).map(([key, label]) => (
            <div className="stat-card" key={key}>
              <div className="stat-label">{label}</div>
              <div className="stat-value">
                {key === 'monthlyRevenue'
                  ? `৳ ${Number(cards[key] || 0).toLocaleString()}`
                  : cards[key] ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
