'use client';

import { useEffect, useState } from 'react';
import { api, errMsg } from '@/lib/apiClient';

export default function Promotions() {
  const [numbers, setNumbers] = useState(['']);
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState(null);
  const [provider, setProvider] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const loadBalance = async () => {
    try {
      const { data } = await api.get('/admin/sms/balance');
      setBalance(data.data.balance);
      setProvider(data.data.provider);
    } catch {
      /* balance is best-effort */
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const setNumber = (i) => (e) =>
    setNumbers((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)));

  const addNumber = () => setNumbers((prev) => [...prev, '']);

  const removeNumber = (i) =>
    setNumbers((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const send = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    const cleaned = numbers.map((n) => n.trim()).filter(Boolean);
    if (!cleaned.length) {
      setError('Add at least one number.');
      return;
    }
    if (!message.trim()) {
      setError('Enter a message.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/admin/sms/promotion', { numbers: cleaned, message });
      const r = data.data;
      setBalance(r.balance);
      setProvider(r.provider);
      setMsg(
        `Sent to ${r.recipients} number${r.recipients === 1 ? '' : 's'}` +
          (r.delivered ? '.' : ' — gateway did not accept the request.'),
      );
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const balanceLabel =
    balance == null
      ? provider === 'mock'
        ? 'N/A (mock provider — set up BulkSMSBD in Settings)'
        : '—'
      : `${balance} credits`;

  return (
    <div>
      <div className="page-head">
        <h1>Promotions</h1>
        <div className="balance-pill">
          SMS balance: <strong>{balanceLabel}</strong>
        </div>
      </div>
      <p className="muted">Send a promotional SMS to one or more numbers.</p>

      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert info">{msg}</div>}

      <form className="card" onSubmit={send} style={{ maxWidth: 560 }}>
        <label>Recipient numbers</label>
        {numbers.map((n, i) => (
          <div className="inline-add" key={i}>
            <input
              value={n}
              onChange={setNumber(i)}
              placeholder="01XXXXXXXXX"
              inputMode="tel"
            />
            <button
              type="button"
              className="btn btn-ghost sm"
              onClick={() => removeNumber(i)}
              disabled={numbers.length === 1}
              aria-label="Remove number"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost sm" onClick={addNumber}>
          + Add number
        </button>

        <label>Message</label>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1000}
          placeholder="Write your promotional message…"
        />
        <small className="muted">{message.length}/1000 characters</small>

        <button className="btn btn-primary block" disabled={busy}>
          {busy ? 'Sending…' : 'Send SMS'}
        </button>
      </form>
    </div>
  );
}
