'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ConfirmModal from '@/components/ConfirmModal';
import { api, errMsg } from '@/lib/apiClient';

const STATUSES = ['all', 'pending', 'approved', 'rejected', 'draft', 'rented', 'expired'];
const TYPES = [
  'apartment', 'flat', 'family_house', 'bachelor_room', 'sublet',
  'hostel', 'mess', 'office', 'shop', 'commercial_space',
];
const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'rent_desc', label: 'Rent: high → low' },
  { value: 'rent_asc', label: 'Rent: low → high' },
  { value: 'most_viewed', label: 'Most viewed' },
  { value: 'most_reported', label: 'Most reported' },
];
const STATUS_COLOR = {
  approved: 'green',
  pending: 'orange',
  rejected: 'red',
  draft: 'gray',
  rented: 'blue',
  expired: 'gray',
};
const PAGE_SIZE = 20;

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

export default function Moderation() {
  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filters, setFilters] = useState({ status: 'all', type: '', sort: 'newest', keyword: '' });
  const [page, setPage] = useState(1);
  // Listing currently being rejected (drives the rejection-reason modal).
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  // Delete confirmation: a single listing, or the bulk flag for the selection.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: PAGE_SIZE, sort: filters.sort, status: filters.status };
      if (filters.type) params.type = filters.type;
      if (filters.keyword) params.keyword = filters.keyword;
      const { data } = await api.get('/admin/listings/queue', { params });
      setListings(data.data.listings || []);
      setMeta(data.meta || null);
      setSelected(new Set());
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.type, filters.sort, page]);

  const setFilter = (k, v) => {
    setPage(1);
    setFilters((f) => ({ ...f, [k]: v }));
  };

  const applyModeration = async (listing, approve, reason) => {
    setBusyId(listing._id);
    try {
      await api.patch(`/admin/listings/${listing._id}/moderate`, { approve, reason });
      // Reflect the new status (and reason) in place.
      setListings((prev) =>
        prev.map((l) =>
          l._id === listing._id
            ? { ...l, status: approve ? 'approved' : 'rejected', rejectionReason: approve ? undefined : reason }
            : l,
        ),
      );
    } catch (err) {
      alert(errMsg(err));
    } finally {
      setBusyId(null);
    }
  };

  // Rejecting opens a modal to capture the reason; approving applies directly.
  const reject = (listing) => {
    setRejectReason('');
    setRejectTarget(listing);
  };

  const confirmReject = async () => {
    const target = rejectTarget;
    const reason = rejectReason.trim();
    if (!reason) return; // a reason is required
    setRejectTarget(null);
    await applyModeration(target, false, reason);
    setRejectReason('');
  };

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
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/listings/${deleteTarget._id}`);
      setDeleteTarget(null);
      await load();
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
    try {
      await api.post('/admin/listings/bulk-delete', { ids });
      setBulkOpen(false);
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setDeleting(false);
    }
  };

  const goTo = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <h1>Listings</h1>
      <p className="muted">Review and moderate every listing on the platform.</p>

      <div className="toolbar wrap">
        <label className="inline">
          Status
          <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : s}
              </option>
            ))}
          </select>
        </label>
        <label className="inline">
          Type
          <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)}>
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="inline">
          Sort
          <select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <form
          className="inline grow"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            load();
          }}
        >
          <input
            placeholder="Search title / description…"
            value={filters.keyword}
            onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
          />
          <button className="btn btn-primary">Search</button>
        </form>
        {selected.size > 0 && (
          <button className="btn btn-danger" onClick={() => setBulkOpen(true)}>
            Delete selected ({selected.size})
          </button>
        )}
      </div>

      {error && <div className="alert error">{error}</div>}
      {meta && (
        <p className="muted results-line">
          {meta.total.toLocaleString()} listing{meta.total === 1 ? '' : 's'} · page {meta.page} of{' '}
          {meta.totalPages}
        </p>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : listings.length === 0 ? (
        <p className="muted">No listings match these filters.</p>
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
              <th>Location</th>
              <th>Rent</th>
              <th>Views</th>
              <th>Reports</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Actions</th>
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
                  <Link href={`/listings/${l.slug || l._id}`} target="_blank" rel="noreferrer">
                    {l.title}
                  </Link>
                  {l.status === 'rejected' && l.rejectionReason && (
                    <div className="reject-note">⚠ {l.rejectionReason}</div>
                  )}
                </td>
                <td>{l.type?.replace(/_/g, ' ')}</td>
                <td>{[l.location?.area, l.location?.district].filter(Boolean).join(', ')}</td>
                <td>৳ {Number(l.monthlyRent).toLocaleString()}</td>
                <td>{l.viewsCount ?? 0}</td>
                <td>{l.reportsCount ?? 0}</td>
                <td>
                  <span className={`status ${STATUS_COLOR[l.status] || 'gray'}`}>{l.status}</span>
                </td>
                <td>{l.owner?.fullName || l.owner?.mobile || '—'}</td>
                <td className="actions">
                  <button
                    className="btn btn-primary sm"
                    disabled={busyId === l._id || l.status === 'approved'}
                    onClick={() => applyModeration(l, true)}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger sm"
                    disabled={busyId === l._id || l.status === 'rejected'}
                    onClick={() => reject(l)}
                  >
                    Reject
                  </button>
                  <button
                    className="btn btn-ghost sm"
                    disabled={busyId === l._id}
                    onClick={() => setDeleteTarget(l)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {meta && meta.totalPages > 1 && (
        <nav className="pagination">
          <button className="btn btn-ghost sm" disabled={!meta.hasPrevPage} onClick={() => goTo(page - 1)}>
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
          <button className="btn btn-ghost sm" disabled={!meta.hasNextPage} onClick={() => goTo(page + 1)}>
            Next →
          </button>
        </nav>
      )}

      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Reject listing</h3>
            <p className="muted">
              “{rejectTarget.title}” — the reason below is sent to the owner and shown on their listing.
            </p>
            <label>Rejection reason</label>
            <textarea
              rows={4}
              value={rejectReason}
              autoFocus
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Images are unclear / rent looks inaccurate / duplicate listing"
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setRejectTarget(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                disabled={!rejectReason.trim() || busyId === rejectTarget._id}
                onClick={confirmReject}
              >
                Reject listing
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete listing?"
        message={
          deleteTarget
            ? `"${deleteTarget.title}" will be permanently removed along with its images, and the owner will be notified. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      <ConfirmModal
        open={bulkOpen}
        title={`Delete ${selected.size} listing(s)?`}
        message="The selected listings will be permanently removed along with their images, and their owners will be notified. This can't be undone."
        confirmLabel={`Delete ${selected.size}`}
        danger
        busy={deleting}
        onConfirm={confirmBulkDelete}
        onCancel={() => !deleting && setBulkOpen(false)}
      />
    </div>
  );
}
