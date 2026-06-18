import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, isStaffRole } from '../context/AuthContext';
import { errMsg } from '../api/client';

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Where to land after a normal-user login: back to the page that sent them
  // to sign-in, otherwise their dashboard.
  const from = location.state?.from?.pathname || '/dashboard';

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
      // Staff land in the admin panel; everyone else goes to the public site.
      if (isStaffRole(u.role)) {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
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
        {location.state?.reset && (
          <div className="alert info">Password reset. Please sign in with your new password.</div>
        )}
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Mobile or email</label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="+8801712345678 or you@example.com"
            required
          />
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
        <p className="muted center">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <p className="muted center">
          No account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
