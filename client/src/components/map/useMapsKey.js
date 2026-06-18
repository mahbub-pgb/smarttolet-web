import { useEffect, useState } from 'react';
import { api } from '../../api/client';

// Fetch the public Google Maps key once and share the promise across mounts.
let cached;
function fetchKey() {
  if (!cached) {
    cached = api
      .get('/public/settings')
      .then((r) => r.data.data.settings?.googleMapsApiKey || null)
      .catch(() => null);
  }
  return cached;
}

export default function useMapsKey() {
  const [key, setKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchKey().then((k) => {
      if (mounted) {
        setKey(k);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { key, loading };
}
