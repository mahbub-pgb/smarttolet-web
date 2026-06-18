'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, isStaffRole } from '@/lib/AuthContext';
import { errMsg } from '@/lib/apiClient';

function SignInForm() {
  const { login } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get('from') || '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(identifier, password);
      router.replace(isStaffRole(u.role) ? '/admin' : from);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <div className="card">
        <h2>Welcome back</h2>
        {sp.get('reset') && (
          <div className="alert info">Password reset. Please sign in with your new password.</div>
        )}
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Mobile or email</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="01712345678 or you@example.com"
            required
          />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn btn-primary block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="muted center">
          <Link href="/forgot-password">Forgot password?</Link>
        </p>
        <p className="muted center">
          No account? <Link href="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="container narrow"><div className="card">Loading…</div></div>}>
      <SignInForm />
    </Suspense>
  );
}
