'use client';

import { useEffect, useState } from 'react';
import { api, errMsg } from '@/lib/apiClient';

export default function Settings() {
  const [form, setForm] = useState({
    siteName: '',
    supportEmail: '',
    supportPhone: '',
    googleMapsApiKey: '',
    mapDefaultZoom: 7,
    smsProvider: 'mock',
    smsSenderId: '',
    smsApiKey: '',
    smsApiKeyConfigured: false,
    maintenanceMode: false,
    maintenanceMessage: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  // Remember the last-opened tab across reloads.
  const [tab, setTabState] = useState(() => localStorage.getItem('admin_settings_tab') || 'general');
  const setTab = (t) => {
    localStorage.setItem('admin_settings_tab', t);
    setTabState(t);
  };

  useEffect(() => {
    api
      .get('/admin/settings')
      .then(({ data }) => {
        const s = data.data.settings || {};
        setForm((f) => ({
          ...f,
          siteName: s.siteName || '',
          supportEmail: s.supportEmail || '',
          supportPhone: s.supportPhone || '',
          googleMapsApiKey: s.googleMapsApiKey || '',
          mapDefaultZoom: s.mapDefaultZoom ?? 7,
          smsProvider: s.sms?.provider || 'mock',
          smsSenderId: s.sms?.senderId || '',
          smsApiKey: '',
          // Admin endpoint masks the key as '***configured***' when one is set.
          smsApiKeyConfigured: !!s.sms?.apiKey,
          maintenanceMode: !!s.maintenanceMode,
          maintenanceMessage: s.maintenanceMessage || '',
        }));
      })
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    setBusy(true);
    try {
      const payload = {
        maintenanceMode: form.maintenanceMode,
        mapDefaultZoom: Number(form.mapDefaultZoom) || 7,
      };
      ['siteName', 'supportEmail', 'supportPhone', 'googleMapsApiKey', 'maintenanceMessage'].forEach(
        (k) => {
          if (form[k]) payload[k] = form[k];
        },
      );

      // SMS gateway config. Only send the API key if the admin typed a new one,
      // so the stored key isn't wiped when left blank.
      payload.sms = { provider: form.smsProvider, senderId: form.smsSenderId };
      if (form.smsApiKey) payload.sms.apiKey = form.smsApiKey;

      await api.put('/admin/settings', payload);
      setMsg('Settings saved.');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <h1>Settings</h1>
      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert info">{msg}</div>}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === 'general' ? 'active' : ''}`}
          onClick={() => setTab('general')}
        >
          General
        </button>
        <button
          type="button"
          className={`tab ${tab === 'api' ? 'active' : ''}`}
          onClick={() => setTab('api')}
        >
          API & Integrations
        </button>
      </div>

      <form className="card" onSubmit={save} style={{ maxWidth: 560 }}>
        {tab === 'general' && (
          <>
            <label>Site name</label>
            <input value={form.siteName} onChange={set('siteName')} />

            <label>Support email</label>
            <input type="email" value={form.supportEmail} onChange={set('supportEmail')} />

            <label>Support phone</label>
            <input value={form.supportPhone} onChange={set('supportPhone')} />

            <label>Map default zoom (1 = country, 20 = building)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.mapDefaultZoom}
              onChange={set('mapDefaultZoom')}
            />

            <label className="checkbox">
              <input type="checkbox" checked={form.maintenanceMode} onChange={set('maintenanceMode')} />
              Maintenance mode
            </label>

            <label>Maintenance message</label>
            <textarea rows={3} value={form.maintenanceMessage} onChange={set('maintenanceMessage')} />
          </>
        )}

        {tab === 'api' && (
          <>
            <label>Google Maps API key</label>
            <input value={form.googleMapsApiKey} onChange={set('googleMapsApiKey')} />

            <h3>SMS gateway</h3>
            <label>Provider</label>
            <select value={form.smsProvider} onChange={set('smsProvider')}>
              <option value="mock">Mock (logs only — development)</option>
              <option value="bulksmsbd">BulkSMSBD (bulksmsbd.net)</option>
            </select>

            <label>Sender ID</label>
            <input value={form.smsSenderId} onChange={set('smsSenderId')} placeholder="e.g. SmartToLet" />

            <label>API key</label>
            <input
              type="password"
              value={form.smsApiKey}
              onChange={set('smsApiKey')}
              placeholder={form.smsApiKeyConfigured ? '•••••••• (leave blank to keep current)' : 'Enter API key'}
              autoComplete="new-password"
            />
            <small className="muted">
              {form.smsApiKeyConfigured ? 'A key is configured. ' : 'No key set yet. '}
              Used when the provider is BulkSMSBD.
            </small>
          </>
        )}

        <button className="btn btn-primary block" disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
