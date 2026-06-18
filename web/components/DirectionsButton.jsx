'use client';

import { useState } from 'react';

// Opens Google Maps directions to the listing. On click we try to read the
// visitor's current position so the route starts from where they are; if
// geolocation is unavailable or denied, Google Maps falls back to the device's
// own location (origin omitted).
export default function DirectionsButton({ lat, lng }) {
  const [busy, setBusy] = useState(false);

  const open = (origin) => {
    const base = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const url = origin ? `${base}&origin=${origin}` : base;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleClick = () => {
    if (!navigator.geolocation) {
      open();
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        open(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      () => {
        setBusy(false);
        open();
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <button
      type="button"
      className="btn btn-primary directions-btn"
      onClick={handleClick}
      disabled={busy}
    >
      {busy ? '📍 Getting your location…' : '🧭 Get directions'}
    </button>
  );
}
