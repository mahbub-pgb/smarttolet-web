import { useEffect, useState } from 'react';
import { api } from '../../api/client';

// Fetch the public settings (maps key + default zoom) once and share the
// promise across mounts.
let cached;
function fetchSettings() {
  if (!cached) {
    cached = api
      .get('/public/settings')
      .then((r) => r.data.data.settings || {})
      .catch(() => ({}));
  }
  return cached;
}

export default function useMapsKey() {
  const [state, setState] = useState({ key: null, zoom: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchSettings().then((s) => {
      if (mounted) {
        setState({ key: s.googleMapsApiKey || null, zoom: s.mapDefaultZoom ?? null });
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { key: state.key, zoom: state.zoom, loading };
}
