import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/client';

export default function SignUp() {
  const { requestOtp, verifyOtp, completeProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: mobile, 2: otp, 3: profile
  const [mobile, setMobile] = useState('+8801');
  const [code, setCode] = useState('');
  const [profile, setProfile] = useState({ fullName: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await requestOtp(mobile);
      setStep(2);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await verifyOtp(mobile, code);
      if (res.profileComplete) {
        navigate('/');
      } else {
        setStep(3);
      }
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const handleProfile = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload = { fullName: profile.fullName, password: profile.password };
      if (profile.email) payload.email = profile.email;
      await completeProfile(payload);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <div className="card">
        <h2>Create your account</h2>
        <p className="muted">Step {step} of 3</p>
        {error && <div className="alert error">{error}</div>}

        {step === 1 && (
          <form onSubmit={handleRequest}>
            <label>Mobile number</label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="01712345678"
              required
            />
            <small className="muted">Enter your Bangladesh mobile, e.g. 01712345678</small>
            <button className="btn btn-primary block" disabled={busy}>
              {busy ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify}>
            <label>Enter the OTP sent to {mobile}</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
            />
            <button className="btn btn-primary block" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              className="btn btn-ghost block"
              onClick={() => setStep(1)}
              disabled={busy}
            >
              Change number
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleProfile}>
            <label>Full name</label>
            <input
              value={profile.fullName}
              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
              required
            />
            <label>Email (optional)</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
            <label>Password</label>
            <input
              type="password"
              value={profile.password}
              onChange={(e) => setProfile({ ...profile, password: e.target.value })}
              required
            />
            <small className="muted">
              Min 8 chars, with uppercase, lowercase, and a number.
            </small>
            <button className="btn btn-primary block" disabled={busy}>
              {busy ? 'Saving…' : 'Finish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
