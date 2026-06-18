'use client';

import dynamic from 'next/dynamic';

// Google Maps is browser-only — load the map UI client-side without SSR.
const ListingsMap = dynamic(() => import('@/components/ListingsMap'), {
  ssr: false,
  loading: () => <div className="container"><div className="map-placeholder">Loading map…</div></div>,
});

export default function MapPage() {
  return <ListingsMap />;
}
