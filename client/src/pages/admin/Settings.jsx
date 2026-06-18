import { useEffect, useState } from 'react';
import { api, errMsg } from '../../api/client';

export default function Settings() {
  const [form, setForm] = useState({
    siteName: '',
    supportEmail: '',
    supportPhone: '',
    googleMapsApiKey: '',
    maintenanceMode: false,
    maintenanceMessage: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

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
      const payload = { maintenanceMode: form.maintenanceMode };
      ['siteName', 'supportEmail', 'supportPhone', 'googleMapsApiKey', 'maintenanceMessage'].forEach(
        (k) => {
          if (form[k]) payload[k] = form[k];
        },
      );
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
      <form className="card" onSubmit={save} style={{ maxWidth: 560 }}>
        <label>Site name</label>
        <input value={form.siteName} onChange={set('siteName')} />

        <label>Support email</label>
        <input type="email" value={form.supportEmail} onChange={set('supportEmail')} />

        <label>Support phone</label>
        <input value={form.supportPhone} onChange={set('supportPhone')} />

        <label>Google Maps API key</label>
        <input value={form.googleMapsApiKey} onChange={set('googleMapsApiKey')} />

        <label className="checkbox">
          <input type="checkbox" checked={form.maintenanceMode} onChange={set('maintenanceMode')} />
          Maintenance mode
        </label>

        <label>Maintenance message</label>
        <textarea rows={3} value={form.maintenanceMessage} onChange={set('maintenanceMessage')} />

        <button className="btn btn-primary block" disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
