'use client';

import { useEffect, useState } from 'react';
import { api, errMsg } from '@/lib/apiClient';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data.users || []);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patch = (id, next) =>
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, ...next } : u)));

  const toggleStatus = async (u) => {
    const status = u.status === 'suspended' ? 'active' : 'suspended';
    try {
      await api.patch(`/admin/users/${u._id}/status`, { status });
      patch(u._id, { status });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const toggleLandlord = async (u) => {
    const verified = !u.isLandlordVerified;
    try {
      await api.patch(`/admin/users/${u._id}/verify-landlord`, { verified });
      patch(u._id, { isLandlordVerified: verified });
    } catch (err) {
      alert(errMsg(err));
    }
  };

  return (
    <div>
      <h1>Users</h1>
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          load(search ? { search } : {});
        }}
      >
        <input
          placeholder="Search name, mobile, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary">Search</button>
      </form>
      {error && <div className="alert error">{error}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Role</th>
              <th>Status</th>
              <th>Landlord</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.fullName || '—'}</td>
                <td>{u.mobile}</td>
                <td>
                  <span className="role">{u.role}</span>
                </td>
                <td>
                  <span className={`status ${u.status === 'suspended' ? 'red' : 'green'}`}>
                    {u.status}
                  </span>
                </td>
                <td>{u.isLandlordVerified ? '✅' : '—'}</td>
                <td className="actions">
                  <button className="btn btn-ghost sm" onClick={() => toggleStatus(u)}>
                    {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>
                  <button className="btn btn-ghost sm" onClick={() => toggleLandlord(u)}>
                    {u.isLandlordVerified ? 'Unverify' : 'Verify landlord'}
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
