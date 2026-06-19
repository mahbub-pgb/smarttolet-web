'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cldThumb } from '@/lib/img';
import {
  GoogleMap,
  Marker,
  Circle,
  Rectangle,
  InfoWindow,
  useJsApiLoader,
} from '@react-google-maps/api';
import { api, errMsg } from '@/lib/apiClient';
import ListingFilters from '@/components/ListingFilters';
import useMapsKey from '@/components/map/useMapsKey';
import { MAPS_LIBRARIES, MAPS_LOADER_ID, DEFAULT_CENTER } from '@/components/map/mapsConfig';

const containerStyle = { width: '100%', height: 'calc(100vh - 220px)', minHeight: '420px', borderRadius: '10px' };

// Radius choices (km). 'all' shows every listing, centred on the viewer.
const RADIUS_OPTIONS = ['all', 2, 5, 10, 25];

// localStorage key for the viewer's last known location.
const LOCATION_CACHE_KEY = 'map_user_pos';

// Pick a zoom so the chosen radius roughly fills the viewport. With no radius
// ("All near me") we keep the admin-configured default zoom.
const zoomForRadius = (km, defaultZoom) => {
  if (km === 'all' || !km) return defaultZoom;
  if (km <= 2) return 14;
  if (km <= 5) return 13;
  if (km <= 10) return 12;
  return 11;
};

function MapInner({ apiKey, listings, zoom, center, radiusKm, drawMode, area, onAreaDrawn }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: MAPS_LOADER_ID,
    googleMapsApiKey: apiKey,
    libraries: MAPS_LIBRARIES,
  });
  const [active, setActive] = useState(null);
  const [map, setMap] = useState(null);
  // Manual rectangle drawing (the Maps DrawingManager was removed in API v3.65):
  // the user clicks two opposite corners; the second click finalises the area.
  const [firstCorner, setFirstCorner] = useState(null);
  const [preview, setPreview] = useState(null);

  // Reset any in-progress drawing whenever draw mode is turned off.
  useEffect(() => {
    if (!drawMode) {
      setFirstCorner(null);
      setPreview(null);
    }
  }, [drawMode]);

  // Position the map: drawn area > viewer's location > frame all listings.
  useEffect(() => {
    if (!map) return;
    if (area) {
      const b = new window.google.maps.LatLngBounds(
        { lat: area.south, lng: area.west },
        { lat: area.north, lng: area.east },
      );
      map.fitBounds(b);
      return;
    }
    if (center) {
      map.panTo(center);
      map.setZoom(zoomForRadius(radiusKm, zoom));
      return;
    }
    if (!listings.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    listings.forEach((l) => bounds.extend({ lat: l.geo.coordinates[1], lng: l.geo.coordinates[0] }));
    map.setCenter(bounds.getCenter());
    map.setZoom(zoom);
  }, [map, area, center, radiusKm, listings, zoom]);

  // Build a bounds literal from two corner points.
  const boundsFrom = (a, b) => ({
    north: Math.max(a.lat, b.lat),
    south: Math.min(a.lat, b.lat),
    east: Math.max(a.lng, b.lng),
    west: Math.min(a.lng, b.lng),
  });

  const onMapClick = useCallback(
    (e) => {
      if (!drawMode) return;
      const point = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      if (!firstCorner) {
        setFirstCorner(point);
        return;
      }
      onAreaDrawn(boundsFrom(firstCorner, point));
      setFirstCorner(null);
      setPreview(null);
    },
    [drawMode, firstCorner, onAreaDrawn],
  );

  const onMapMouseMove = useCallback(
    (e) => {
      if (!drawMode || !firstCorner) return;
      setPreview(boundsFrom(firstCorner, { lat: e.latLng.lat(), lng: e.latLng.lng() }));
    },
    [drawMode, firstCorner],
  );

  if (loadError) return <div className="alert error">Failed to load Google Maps.</div>;
  if (!isLoaded) return <div className="map-placeholder">Loading map…</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center || DEFAULT_CENTER}
      zoom={center ? zoomForRadius(radiusKm, zoom) : zoom}
      onLoad={(m) => setMap(m)}
      onClick={onMapClick}
      onMouseMove={onMapMouseMove}
      options={{ streetViewControl: false, mapTypeControl: false, draggableCursor: drawMode ? 'crosshair' : undefined }}
    >
      {/* Live outline while the user is placing the second corner. */}
      {drawMode && preview && (
        <Rectangle
          bounds={preview}
          options={{ fillColor: '#1f7a5a', fillOpacity: 0.05, strokeColor: '#1f7a5a', strokeOpacity: 0.6, strokeWeight: 1.5, clickable: false }}
        />
      )}

      {area && (
        <Rectangle
          bounds={{ north: area.north, south: area.south, east: area.east, west: area.west }}
          options={{ fillColor: '#1f7a5a', fillOpacity: 0.07, strokeColor: '#1f7a5a', strokeOpacity: 0.5, strokeWeight: 1.5, clickable: false }}
        />
      )}

      {!area && center && (
        <>
          <Marker
            position={center}
            title="Your location"
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: '#1d5fad',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
          />
          {radiusKm !== 'all' && (
            <Circle
              center={center}
              radius={radiusKm * 1000}
              options={{ fillColor: '#1f7a5a', fillOpacity: 0.07, strokeColor: '#1f7a5a', strokeOpacity: 0.4, strokeWeight: 1, clickable: false }}
            />
          )}
        </>
      )}

      {listings.map((l) => (
        <Marker
          key={l._id}
          position={{ lat: l.geo.coordinates[1], lng: l.geo.coordinates[0] }}
          clickable={!drawMode}
          onClick={() => !drawMode && setActive(l)}
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
              <img src={cldThumb(active.images[0].url, 240)} alt={active.title} className="map-info-img" />
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

  // The viewer's current location (null until granted / on denial).
  const [userPos, setUserPos] = useState(null);
  const [radiusKm, setRadiusKm] = useState('all'); // default: all listings near them
  const [locating, setLocating] = useState(true);
  const [geoNote, setGeoNote] = useState('');

  // Draw-an-area state: drawMode toggles the rectangle tool; area is the result.
  const [drawMode, setDrawMode] = useState(false);
  const [area, setArea] = useState(null);

  // Ask the browser for the viewer's location so we can centre on them. When
  // `silent` we don't show the "finding location" spinner — used to refresh a
  // cached location in the background.
  const locate = useCallback((silent = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocating(false);
      setGeoNote('Your browser can’t share location — showing all listings.');
      return;
    }
    if (!silent) setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        try {
          localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(p));
        } catch {
          /* localStorage unavailable — fine, we just won't cache */
        }
        setGeoNote('');
        setLocating(false);
      },
      () => {
        setLocating(false);
        setGeoNote('Location access denied — showing all listings. Enable it to centre on where you are.');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // On first load, reuse a previously cached location for an instant centred
  // view, then refresh it quietly in the background. No cache → locate normally.
  useEffect(() => {
    let cached = null;
    try {
      const raw = localStorage.getItem(LOCATION_CACHE_KEY);
      if (raw) cached = JSON.parse(raw);
    } catch {
      /* ignore */
    }
    if (cached && Number.isFinite(cached.lat) && Number.isFinite(cached.lng)) {
      setUserPos(cached);
      setLocating(false);
      locate(true); // silent background refresh
    } else {
      locate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAreaDrawn = useCallback((box) => {
    setArea(box);
    setDrawMode(false);
  }, []);

  const clearArea = useCallback(() => {
    setArea(null);
    setDrawMode(false);
  }, []);

  // URL filters + the active geo scope (drawn area takes priority over centre).
  const params = useMemo(() => {
    const base = Object.fromEntries(sp.entries());
    if (area) {
      base.bbox = `${area.west},${area.south},${area.east},${area.north}`;
    } else if (userPos) {
      base.lat = userPos.lat;
      base.lng = userPos.lng;
      if (radiusKm !== 'all') base.radiusKm = radiusKm;
    }
    return base;
  }, [sp, userPos, radiusKm, area]);

  useEffect(() => {
    // Wait until geolocation resolves so the first fetch already includes the
    // viewer's position (avoids loading everything then refetching).
    if (locating) return undefined;
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
  }, [params, locating]);

  // Human description of what the map is currently scoped to.
  const scopeLabel = area
    ? 'in your drawn area'
    : userPos
      ? radiusKm === 'all'
        ? 'near your location'
        : `within ${radiusKm} km of your location`
      : 'on the map';

  return (
    <div className="container">
      <div className="page-head">
        <h2>Listings map</h2>
        <Link href="/" className="btn btn-ghost">
          ☰ List view
        </Link>
      </div>

      <ListingFilters
        basePath="/map"
        onReset={() => {
          setArea(null);
          setDrawMode(false);
          setRadiusKm('all');
        }}
      />

      <div className="map-controls">
        {!area && userPos && (
          <label className="inline">
            Show
            <select value={radiusKm} onChange={(e) => setRadiusKm(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r === 'all' ? 'All near me' : `Within ${r} km`}
                </option>
              ))}
            </select>
          </label>
        )}

        {!userPos && !area && (
          <button type="button" className="btn btn-ghost sm" onClick={() => locate(false)} disabled={locating}>
            {locating ? 'Locating…' : '📍 Use my location'}
          </button>
        )}

        {area ? (
          <button type="button" className="btn btn-ghost sm" onClick={clearArea}>
            ✕ Clear drawn area
          </button>
        ) : (
          <button
            type="button"
            className={`btn sm ${drawMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDrawMode((v) => !v)}
          >
            {drawMode ? 'Cancel drawing' : '✏️ Draw area'}
          </button>
        )}
      </div>

      {drawMode && <div className="alert info">Click two points on the map to set opposite corners of the area you want to search.</div>}
      {geoNote && !area && !userPos && <div className="alert info">{geoNote}</div>}
      {error && <div className="alert error">{error}</div>}

      {loading || fetching ? (
        <div className="map-placeholder">{locating ? 'Finding your location…' : 'Loading map…'}</div>
      ) : !key ? (
        <div className="alert info">Map unavailable — add a Google Maps API key in admin Settings.</div>
      ) : listings.length === 0 ? (
        <p className="muted">
          {area
            ? 'No listings inside the drawn area. Try a larger area.'
            : userPos && radiusKm !== 'all'
              ? `No listings within ${radiusKm} km of your location. Try a larger radius.`
              : 'No map-located listings found.'}
        </p>
      ) : (
        <>
          <p className="muted results-line">
            {listings.length} listing{listings.length === 1 ? '' : 's'} {scopeLabel} · click a pin for details.
          </p>
          <MapInner
            apiKey={key}
            listings={listings}
            zoom={zoom || 7}
            center={userPos}
            radiusKm={radiusKm}
            drawMode={drawMode}
            area={area}
            onAreaDrawn={onAreaDrawn}
          />
        </>
      )}
    </div>
  );
}
