'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import ConfirmModal from '@/components/ConfirmModal';
import { api, errMsg } from '@/lib/apiClient';

const STATUS_COLORS = {
  draft: 'gray',
  pending: 'orange',
  approved: 'green',
  rejected: 'red',
  rented: 'blue',
  expired: 'gray',
};

function MyListingsInner() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // The listing pending single-delete confirmation (null when closed).
  const [toDelete, setToDelete] = useState(null);
  // Whether the bulk-delete confirmation is open.
  const [bulkOpen, setBulkOpen] = useState(false);
  // Set of selected listing ids for bulk actions.
  const [selected, setSelected] = useState(() => new Set());
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/listings/me/list');
      setListings(data.data.listings || []);
      setSelected(new Set());
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = listings.length > 0 && selected.size === listings.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(listings.map((l) => l._id)));

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/listings/${toDelete._id}`);
      const id = toDelete._id;
      setListings((prev) => prev.filter((l) => l._id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setToDelete(null);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length) return;
    setDeleting(true);
    setError('');
    try {
      await api.post('/listings/me/bulk-delete', { ids });
      const removed = new Set(ids);
      setListings((prev) => prev.filter((l) => !removed.has(l._id)));
      setSelected(new Set());
      setBulkOpen(false);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setDeleting(false);
    }
  };

  const renew = async (id) => {
    try {
      const { data } = await api.post(`/listings/${id}/renew`);
      const updated = data.data.listing;
      setListings((prev) => prev.map((l) => (l._id === id ? { ...l, ...updated } : l)));
    } catch (err) {
      alert(errMsg(err));
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h2>My Listings</h2>
        <div className="actions">
          {selected.size > 0 && (
            <button className="btn btn-danger" onClick={() => setBulkOpen(true)}>
              Delete selected ({selected.size})
            </button>
          )}
          <Link href="/create" className="btn btn-primary">+ New listing</Link>
        </div>
      </div>
      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : listings.length === 0 ? (
        <p className="muted">You haven&apos;t posted any listings yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all listings"
                />
              </th>
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
                  <input
                    type="checkbox"
                    checked={selected.has(l._id)}
                    onChange={() => toggle(l._id)}
                    aria-label={`Select ${l.title}`}
                  />
                </td>
                <td>
                  <Link href={`/listings/${l.slug || l._id}`}>{l.title}</Link>
                  {l.status === 'rejected' && l.rejectionReason && (
                    <div className="reject-note">⚠ Rejected: {l.rejectionReason}</div>
                  )}
                </td>
                <td>{l.type?.replace(/_/g, ' ')}</td>
                <td>৳ {Number(l.monthlyRent).toLocaleString()}</td>
                <td>
                  <span className={`status ${STATUS_COLORS[l.status] || 'gray'}`}>{l.status}</span>
                </td>
                <td className="actions">
                  <Link href={`/listings/${l._id}/edit`} className="btn btn-ghost sm">Edit</Link>
                  {(l.status === 'expired' || l.status === 'approved') && (
                    <button className="btn btn-ghost sm" onClick={() => renew(l._id)}>
                      {l.status === 'expired' ? 'Reactivate' : 'Renew'}
                    </button>
                  )}
                  <button className="btn btn-ghost sm" onClick={() => setToDelete(l)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmModal
        open={!!toDelete}
        title="Delete listing?"
        message={
          toDelete
            ? `"${toDelete.title}" will be permanently removed along with its images. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />

      <ConfirmModal
        open={bulkOpen}
        title={`Delete ${selected.size} listing(s)?`}
        message="The selected listings will be permanently removed along with their images. This can't be undone."
        confirmLabel={`Delete ${selected.size}`}
        danger
        busy={deleting}
        onConfirm={confirmBulkDelete}
        onCancel={() => !deleting && setBulkOpen(false)}
      />
    </div>
  );
}

export default function MyListingsPage() {
  return (
    <ProtectedRoute>
      <MyListingsInner />
    </ProtectedRoute>
  );
}
