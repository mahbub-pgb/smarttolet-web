import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/client';

export default function ForgotPassword() {
  const { requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = enter mobile, 2 = code + new password
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const requestCode = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await requestPasswordReset(mobile);
      setStep(2);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const doReset = async (e) => {
    e.preventDefault();
    setError('');
    if (next !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await resetPassword(mobile, code, next);
      navigate('/signin', { replace: true, state: { reset: true } });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <div className="card">
        <h2>Reset password</h2>
        {error && <div className="alert error">{error}</div>}

        {step === 1 ? (
          <form onSubmit={requestCode}>
            <label>Registered mobile</label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="01712345678"
              required
            />
            <button className="btn btn-primary block" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={doReset}>
            <label>Verification code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              required
            />

            <label>New password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <small className="muted">
              At least 8 characters with an uppercase letter, a lowercase letter, and a number.
            </small>

            <label>Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />

            <button className="btn btn-primary block" disabled={busy}>
              {busy ? 'Resetting…' : 'Reset password'}
            </button>
            <p className="muted center">
              <button type="button" className="linklike" onClick={() => setStep(1)}>
                ← Use a different mobile
              </button>
            </p>
          </form>
        )}

        <p className="muted center">
          Remembered it? <Link to="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
