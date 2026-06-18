'use client';

import { useEffect, useState } from 'react';
import { api, errMsg } from '@/lib/apiClient';

const PAGE_SIZE = 20;

export default function Promotions() {
  const [tab, setTab] = useState('send');

  // ---- Send tab state ----
  const [numbers, setNumbers] = useState(['']);
  const [message, setMessage] = useState('');
  const [balance, setBalance] = useState(null);
  const [provider, setProvider] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [promos, setPromos] = useState([]);
  const [selected, setSelected] = useState('new');

  // ---- Report tab state ----
  const [rows, setRows] = useState([]);
  const [reportMeta, setReportMeta] = useState(null);
  const [reportPage, setReportPage] = useState(1);
  const [reportLoading, setReportLoading] = useState(false);

  // ---- Messages tab state (predefined messages + cooldown) ----
  const [pmsgs, setPmsgs] = useState([]);
  const [cooldown, setCooldown] = useState(30);
  const [savingMsgs, setSavingMsgs] = useState(false);
  const [msgsMsg, setMsgsMsg] = useState('');
  const [msgsErr, setMsgsErr] = useState('');

  const loadBalance = async () => {
    try {
      const { data } = await api.get('/admin/sms/balance');
      setBalance(data.data.balance);
      setProvider(data.data.provider);
    } catch {
      /* balance is best-effort */
    }
  };

  const loadPromos = async () => {
    try {
      const { data } = await api.get('/admin/settings');
      const s = data.data.settings || {};
      const list = (s.promoMessages || []).map((m) => ({ title: m.title || '', message: m.message || '' }));
      setPromos(list);
      if (list.length) setSelected('0');
      setPmsgs(list);
      setCooldown(s.promoCooldownDays ?? 30);
    } catch {
      /* fall back to a custom message */
    }
  };

  // Predefined-message editor handlers.
  const setPmsg = (i, key) => (e) =>
    setPmsgs((prev) => prev.map((m, idx) => (idx === i ? { ...m, [key]: e.target.value } : m)));
  const addPmsg = () => setPmsgs((prev) => [...prev, { title: '', message: '' }]);
  const removePmsg = (i) => setPmsgs((prev) => prev.filter((_, idx) => idx !== i));

  const saveMessages = async (e) => {
    e.preventDefault();
    setMsgsErr('');
    setMsgsMsg('');
    setSavingMsgs(true);
    try {
      const cleaned = pmsgs
        .map((m) => ({ title: m.title.trim(), message: m.message.trim() }))
        .filter((m) => m.title && m.message);
      await api.put('/admin/settings', {
        promoMessages: cleaned,
        promoCooldownDays: Math.max(0, Number(cooldown) || 0),
      });
      setPromos(cleaned); // refresh the Send-tab dropdown
      setMsgsMsg('Saved.');
    } catch (err) {
      setMsgsErr(errMsg(err));
    } finally {
      setSavingMsgs(false);
    }
  };

  const loadReport = async () => {
    setReportLoading(true);
    try {
      const { data } = await api.get('/admin/sms/promotions', {
        params: { page: reportPage, limit: PAGE_SIZE },
      });
      setRows(data.data.items || []);
      setReportMeta(data.meta || null);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
    loadPromos();
  }, []);

  useEffect(() => {
    if (tab === 'report') loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, reportPage]);

  const effectiveMessage = selected === 'new' ? message : promos[Number(selected)]?.message || '';

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
    const text = effectiveMessage.trim();
    if (!text) {
      setError(selected === 'new' ? 'Enter a message.' : 'The selected message is empty.');
      return;
    }
    const title = selected === 'new' ? undefined : promos[Number(selected)]?.title;
    setBusy(true);
    try {
      const { data } = await api.post('/admin/sms/promotion', { numbers: cleaned, message: text, title });
      const r = data.data;
      setBalance(r.balance);
      setProvider(r.provider);
      const skippedNote = r.skipped ? ` ${r.skipped} skipped (messaged recently).` : '';
      if (r.recipients > 0 && r.delivered) {
        setMsg(`Sent to ${r.recipients} number${r.recipients === 1 ? '' : 's'}.${skippedNote}`);
      } else if (r.recipients === 0) {
        setError(r.reason || 'Nothing to send.');
      } else {
        setError(`Gateway rejected the SMS: ${r.reason || 'unknown error'}.${skippedNote}`);
      }
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

  const fmtDate = (d) => new Date(d).toLocaleString();

  return (
    <div>
      <div className="page-head">
        <h1>Promotions</h1>
        <div className="balance-pill">
          SMS balance: <strong>{balanceLabel}</strong>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === 'send' ? 'active' : ''}`}
          onClick={() => setTab('send')}
        >
          Send SMS
        </button>
        <button
          type="button"
          className={`tab ${tab === 'report' ? 'active' : ''}`}
          onClick={() => setTab('report')}
        >
          Report
        </button>
        <button
          type="button"
          className={`tab ${tab === 'messages' ? 'active' : ''}`}
          onClick={() => setTab('messages')}
        >
          Messages &amp; settings
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert info">{msg}</div>}

      {tab === 'send' && (
        <form className="card" onSubmit={send} style={{ maxWidth: 560 }}>
          <label>Recipient numbers</label>
          {numbers.map((n, i) => (
            <div className="inline-add" key={i}>
              <input value={n} onChange={setNumber(i)} placeholder="01XXXXXXXXX" inputMode="tel" />
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
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            {promos.map((m, i) => (
              <option key={i} value={String(i)}>
                {m.title}
              </option>
            ))}
            <option value="new">✏️ New message…</option>
          </select>
          {promos.length === 0 && (
            <small className="muted">Tip: save reusable messages in Settings → Notifications.</small>
          )}

          {selected === 'new' ? (
            <>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                placeholder="Write your promotional message…"
              />
              <small className="muted">{message.length}/1000 characters</small>
            </>
          ) : (
            <textarea rows={4} value={effectiveMessage} readOnly />
          )}

          <button className="btn btn-primary block" disabled={busy}>
            {busy ? 'Sending…' : 'Send SMS'}
          </button>
        </form>
      )}

      {tab === 'report' && (
        <>
          {reportLoading ? (
            <p>Loading…</p>
          ) : rows.length === 0 ? (
            <p className="muted">No promotional SMS has been sent yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Number</th>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Sent by</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id}>
                    <td>{fmtDate(r.createdAt)}</td>
                    <td>{r.mobile}</td>
                    <td>{r.title || '—'}</td>
                    <td title={r.message}>
                      {r.message?.length > 50 ? `${r.message.slice(0, 50)}…` : r.message}
                    </td>
                    <td>
                      <span className={`status ${r.status === 'sent' ? 'green' : 'red'}`}>{r.status}</span>
                    </td>
                    <td>{r.sentBy?.fullName || r.sentBy?.mobile || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportMeta && reportMeta.totalPages > 1 && (
            <nav className="pagination">
              <button
                className="btn btn-ghost sm"
                disabled={!reportMeta.hasPrevPage}
                onClick={() => setReportPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className="page-gap">
                Page {reportMeta.page} of {reportMeta.totalPages}
              </span>
              <button
                className="btn btn-ghost sm"
                disabled={!reportMeta.hasNextPage}
                onClick={() => setReportPage((p) => p + 1)}
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}

      {tab === 'messages' && (
        <form className="card" onSubmit={saveMessages} style={{ maxWidth: 560 }}>
          {msgsErr && <div className="alert error">{msgsErr}</div>}
          {msgsMsg && <div className="alert info">{msgsMsg}</div>}

          <label>Cooldown before re-sending to the same number (days)</label>
          <input type="number" min={0} value={cooldown} onChange={(e) => setCooldown(e.target.value)} />
          <small className="muted">
            A number that already received a promo within this many days is skipped. 0 disables the
            cooldown.
          </small>

          <h3 style={{ marginTop: 24 }}>Predefined messages</h3>
          <small className="muted">These appear in the dropdown on the Send SMS tab.</small>
          {pmsgs.map((m, i) => (
            <div className="promo-item" key={i}>
              <div className="inline-add">
                <input
                  value={m.title}
                  onChange={setPmsg(i, 'title')}
                  maxLength={120}
                  placeholder="Title (e.g. Eid offer)"
                />
                <button
                  type="button"
                  className="btn btn-ghost sm"
                  onClick={() => removePmsg(i)}
                  aria-label="Remove message"
                >
                  ✕
                </button>
              </div>
              <textarea
                rows={2}
                value={m.message}
                onChange={setPmsg(i, 'message')}
                maxLength={1000}
                placeholder="Message (e.g. New flats available in Dhanmondi! Call us today.)"
              />
            </div>
          ))}
          <button type="button" className="btn btn-ghost sm" onClick={addPmsg}>
            + Add message
          </button>

          <button className="btn btn-primary block" disabled={savingMsgs}>
            {savingMsgs ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
    </div>
  );
}
