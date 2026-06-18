import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(identifier, password);
      navigate('/');
    } catch (err) {
      setError(err.message?.includes('admin access') ? err.message : errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="center-screen">
      <div className="card login-card">
        <h2>🏠 Smart To-Let Admin</h2>
        <p className="muted">Sign in to the control panel</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <label>Mobile or email</label>
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn btn-primary block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
