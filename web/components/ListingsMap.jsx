'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { api, errMsg } from '@/lib/apiClient';
import ListingFilters from '@/components/ListingFilters';
import useMapsKey from '@/components/map/useMapsKey';
import { MAPS_LIBRARIES, MAPS_LOADER_ID, DEFAULT_CENTER } from '@/components/map/mapsConfig';

const containerStyle = { width: '100%', height: 'calc(100vh - 220px)', minHeight: '420px', borderRadius: '10px' };

function MapInner({ apiKey, listings, zoom }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: MAPS_LOADER_ID,
    googleMapsApiKey: apiKey,
    libraries: MAPS_LIBRARIES,
  });
  const [active, setActive] = useState(null);

  const onLoad = useCallback(
    (map) => {
      if (!listings.length) return;
      const bounds = new window.google.maps.LatLngBounds();
      listings.forEach((l) => bounds.extend({ lat: l.geo.coordinates[1], lng: l.geo.coordinates[0] }));
      map.setCenter(bounds.getCenter());
      map.setZoom(zoom);
    },
    [listings, zoom],
  );

  if (loadError) return <div className="alert error">Failed to load Google Maps.</div>;
  if (!isLoaded) return <div className="map-placeholder">Loading map…</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={DEFAULT_CENTER}
      zoom={zoom}
      onLoad={onLoad}
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      {listings.map((l) => (
        <Marker
          key={l._id}
          position={{ lat: l.geo.coordinates[1], lng: l.geo.coordinates[0] }}
          onClick={() => setActive(l)}
        />
      ))}

      {active && (
        <InfoWindow
          position={{ lat: active.geo.coordinates[1], lng: active.geo.coordinates[0] }}
          onCloseClick={() => setActive(null)}
        >
          <div className="map-info">
            {active.images?.[0]?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={active.images[0].url} alt={active.title} className="map-info-img" />
            )}
            <strong className="map-info-title">{active.title}</strong>
            <div className="map-info-rent">৳ {Number(active.monthlyRent).toLocaleString()}/mo</div>
            <div className="map-info-meta">
              {active.type?.replace(/_/g, ' ')}
              {active.location?.area || active.location?.district
                ? ` · ${active.location?.area || active.location?.district}`
                : ''}
            </div>
            <Link href={`/listings/${active.slug || active._id}`} className="map-info-link">
              View full details →
            </Link>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

export default function ListingsMap() {
  const { key, zoom, loading } = useMapsKey();
  const sp = useSearchParams();
  const [listings, setListings] = useState([]);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  // Turn the URL query into the params object the map endpoint expects.
  const params = useMemo(() => Object.fromEntries(sp.entries()), [sp]);

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    setError('');
    api
      .get('/listings/map', { params })
      .then(({ data }) => {
        if (!cancelled) setListings(data.data.listings || []);
      })
      .catch((err) => {
        if (!cancelled) setError(errMsg(err));
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params]);

  return (
    <div className="container">
      <div className="page-head">
        <h2>Listings map</h2>
        <Link href="/" className="btn btn-ghost">
          ☰ List view
        </Link>
      </div>

      <ListingFilters basePath="/map" />

      {error && <div className="alert error">{error}</div>}

      {loading || fetching ? (
        <div className="map-placeholder">Loading map…</div>
      ) : !key ? (
        <div className="alert info">Map unavailable — add a Google Maps API key in admin Settings.</div>
      ) : listings.length === 0 ? (
        <p className="muted">No map-located listings found.</p>
      ) : (
        <>
          <p className="muted results-line">
            {listings.length} listing{listings.length === 1 ? '' : 's'} on the map · click a pin for details.
          </p>
          <MapInner apiKey={key} listings={listings} zoom={zoom || 7} />
        </>
      )}
    </div>
  );
}
