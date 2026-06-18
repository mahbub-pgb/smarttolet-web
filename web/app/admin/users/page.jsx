'use client';

import { useEffect, useState } from 'react';
import { api, errMsg } from '@/lib/apiClient';

const ROLE_OPTIONS = ['user', 'moderator', 'admin'];
const STATUS_OPTIONS = ['active', 'suspended', 'pending'];
const GENDER_OPTIONS = ['male', 'female', 'other'];
const EMPTY_FORM = { fullName: '', mobile: '', email: '', password: '', role: 'user' };

const toEditForm = (u) => ({
  fullName: u.fullName || '',
  mobile: u.mobile || '',
  email: u.email || '',
  role: u.role || 'user',
  status: u.status || 'active',
  isLandlordVerified: !!u.isLandlordVerified,
  occupation: u.occupation || '',
  address: u.address || '',
  gender: u.gender || '',
  dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth).slice(0, 10) : '',
  password: '',
});

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // Create-user modal state.
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');
  // Edit-user modal state.
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState('');

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

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreateErr('');
    setShowCreate(true);
  };

  const createUser = async (e) => {
    e.preventDefault();
    setCreateErr('');
    setCreating(true);
    try {
      const payload = {
        fullName: form.fullName,
        mobile: form.mobile,
        password: form.password,
        role: form.role,
      };
      if (form.email) payload.email = form.email;
      await api.post('/admin/users', payload);
      setShowCreate(false);
      await load(search ? { search } : {});
    } catch (err) {
      setCreateErr(errMsg(err));
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm(toEditForm(u));
    setEditErr('');
  };

  const setEditField = (k) => (e) =>
    setEditForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditErr('');
    setSavingEdit(true);
    try {
      const payload = {
        fullName: editForm.fullName,
        mobile: editForm.mobile,
        role: editForm.role,
        status: editForm.status,
        isLandlordVerified: editForm.isLandlordVerified,
        occupation: editForm.occupation,
        address: editForm.address,
        gender: editForm.gender || undefined,
        dateOfBirth: editForm.dateOfBirth || undefined,
      };
      if (editForm.email) payload.email = editForm.email;
      if (editForm.password) payload.password = editForm.password;
      const { data } = await api.patch(`/admin/users/${editUser._id}`, payload);
      patch(editUser._id, data.data.user);
      setEditUser(null);
    } catch (err) {
      setEditErr(errMsg(err));
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h1>Users</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ New user</button>
      </div>
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
                  <button className="btn btn-ghost sm" onClick={() => openEdit(u)}>
                    Edit
                  </button>
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

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={createUser}>
            <h3>Create user</h3>
            {createErr && <div className="alert error">{createErr}</div>}

            <label>Full name</label>
            <input value={form.fullName} onChange={setField('fullName')} required minLength={2} maxLength={120} />

            <label>Mobile</label>
            <input
              value={form.mobile}
              onChange={setField('mobile')}
              required
              placeholder="01XXXXXXXXX"
            />

            <label>Email (optional)</label>
            <input type="email" value={form.email} onChange={setField('email')} />

            <label>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={setField('password')}
              required
              autoComplete="new-password"
              placeholder="Min 8 chars, with upper, lower & number"
            />

            <label>Role</label>
            <select value={form.role} onChange={setField('role')}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating…' : 'Create user'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editUser && editForm && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={saveEdit}>
            <h3>Edit user</h3>
            {editErr && <div className="alert error">{editErr}</div>}

            <label>Full name</label>
            <input value={editForm.fullName} onChange={setEditField('fullName')} minLength={2} maxLength={120} />

            <label>Mobile</label>
            <input value={editForm.mobile} onChange={setEditField('mobile')} placeholder="01XXXXXXXXX" />

            <label>Email</label>
            <input type="email" value={editForm.email} onChange={setEditField('email')} />

            <div className="row">
              <div>
                <label>Role</label>
                <select value={editForm.role} onChange={setEditField('role')}>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Status</label>
                <select value={editForm.status} onChange={setEditField('status')}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="row">
              <div>
                <label>Gender</label>
                <select value={editForm.gender} onChange={setEditField('gender')}>
                  <option value="">—</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Date of birth</label>
                <input type="date" value={editForm.dateOfBirth} onChange={setEditField('dateOfBirth')} />
              </div>
            </div>

            <label>Occupation</label>
            <input value={editForm.occupation} onChange={setEditField('occupation')} maxLength={100} />

            <label>Address</label>
            <textarea rows={2} value={editForm.address} onChange={setEditField('address')} maxLength={300} />

            <label className="checkbox">
              <input
                type="checkbox"
                checked={editForm.isLandlordVerified}
                onChange={setEditField('isLandlordVerified')}
              />
              Verified landlord
            </label>

            <label>New password</label>
            <input
              type="password"
              value={editForm.password}
              onChange={setEditField('password')}
              autoComplete="new-password"
              placeholder="Leave blank to keep current"
            />
            <small className="muted">
              Setting a new password signs the user out of existing sessions.
            </small>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditUser(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
