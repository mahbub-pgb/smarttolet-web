'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/AuthContext';
import { errMsg } from '@/lib/apiClient';

function ChangePasswordForm() {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    if (form.next !== form.confirm) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await changePassword(form.current, form.next);
      setMsg('Password changed successfully.');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <div className="card">
        <h2>Change password</h2>
        {error && <div className="alert error">{error}</div>}
        {msg && <div className="alert info">{msg}</div>}
        <form onSubmit={submit}>
          <label>Current password</label>
          <input type="password" value={form.current} onChange={set('current')} autoComplete="current-password" />

          <label>New password</label>
          <input type="password" value={form.next} onChange={set('next')} required minLength={8} autoComplete="new-password" />
          <small className="muted">At least 8 characters with an uppercase letter, a lowercase letter, and a number.</small>

          <label>Confirm new password</label>
          <input type="password" value={form.confirm} onChange={set('confirm')} required autoComplete="new-password" />

          <button className="btn btn-primary block" disabled={busy}>
            {busy ? 'Saving…' : 'Change password'}
          </button>
        </form>
        <p className="muted center">
          <Link href="/dashboard">← Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <ProtectedRoute>
      <ChangePasswordForm />
    </ProtectedRoute>
  );
}
