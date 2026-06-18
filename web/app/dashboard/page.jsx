'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api, errMsg } from '@/lib/apiClient';
import { useAuth } from '@/lib/AuthContext';

// Circular profile image with a "?" initial fallback when no image is set.
function Avatar({ user, size = 64 }) {
  const initial = (user?.fullName || user?.mobile || '?').trim().charAt(0).toUpperCase();
  const style = { width: size, height: size, fontSize: size * 0.4 };
  return user?.profileImage ? (
    <img src={user.profileImage} alt="Profile" className="avatar" style={style} />
  ) : (
    <div className="avatar avatar-fallback" style={style}>{initial}</div>
  );
}

const STAT_CARDS = [
  { key: 'total', label: 'Total listings' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending review' },
  { key: 'draft', label: 'Drafts' },
  { key: 'rented', label: 'Rented' },
  { key: 'rejected', label: 'Rejected' },
];

const GENDERS = ['male', 'female', 'other'];

function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/listings/me/stats')
      .then(({ data }) => setStats(data.data.stats))
      .catch((err) => setError(errMsg(err)));
  }, []);

  const value = (key) => (key === 'total' ? stats?.total ?? 0 : stats?.byStatus?.[key] ?? 0);

  return (
    <>
      {error && <div className="alert error">{error}</div>}

      <div className="card profile-summary">
        <Avatar user={user} size={72} />
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
        <Link href="/my-listings" className="btn btn-ghost">📋 View all my listings</Link>
        <Link href="/change-password" className="btn btn-ghost">🔒 Change password</Link>
      </div>
    </>
  );
}

function toProfileForm(user) {
  return {
    fullName: user?.fullName || '',
    email: user?.email || '',
    occupation: user?.occupation || '',
    address: user?.address || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
  };
}

function AvatarUploader() {
  const { user, uploadAvatar } = useAuth();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      await uploadAvatar(file);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="avatar-edit">
      <Avatar user={user} size={88} />
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onPick}
        />
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? 'Uploading…' : user?.profileImage ? 'Change photo' : 'Upload photo'}
        </button>
        <small className="muted block">JPEG, PNG, WEBP or GIF, up to 5MB.</small>
        {error && <div className="alert error">{error}</div>}
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user, completeProfile } = useAuth();
  const [form, setForm] = useState(() => toProfileForm(user));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const payload = { fullName: form.fullName };
      ['email', 'occupation', 'address', 'gender', 'dateOfBirth'].forEach((k) => {
        if (form[k]) payload[k] = form[k];
      });
      await completeProfile(payload);
      setMsg('Profile updated.');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 560 }}>
      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert info">{msg}</div>}

      <AvatarUploader />

      <label>Full name</label>
      <input value={form.fullName} onChange={set('fullName')} required minLength={2} maxLength={120} />

      <label>Email</label>
      <input type="email" value={form.email} onChange={set('email')} />

      <label>Mobile</label>
      <input value={user?.mobile || ''} disabled />
      <small className="muted">Mobile is your login and can't be changed here.</small>

      <div className="row">
        <div>
          <label>Gender</label>
          <select value={form.gender} onChange={set('gender')}>
            <option value="">—</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Date of birth</label>
          <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
        </div>
      </div>

      <label>Occupation</label>
      <input value={form.occupation} onChange={set('occupation')} maxLength={100} />

      <label>Address</label>
      <textarea rows={2} value={form.address} onChange={set('address')} maxLength={300} />

      <button className="btn btn-primary block" disabled={busy}>
        {busy ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}

function DashboardInner() {
  const [tab, setTab] = useState('overview');
  return (
    <div className="container">
      <div className="page-head">
        <h2>My Dashboard</h2>
        <Link href="/create" className="btn btn-primary">+ New listing</Link>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
          Overview
        </button>
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
          Edit Profile
        </button>
      </div>

      {tab === 'overview' ? <Overview /> : <ProfileTab />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}
