import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import useMapsKey from './useMapsKey';
import { extractLocation } from './geocode';
import { MAPS_LIBRARIES, MAPS_LOADER_ID, DEFAULT_CENTER } from './mapsConfig';

const containerStyle = { width: '100%', height: '320px', borderRadius: '10px' };

function PickerInner({ apiKey, value, onChange }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: MAPS_LOADER_ID,
    googleMapsApiKey: apiKey,
    libraries: MAPS_LIBRARIES,
  });

  const [marker, setMarker] = useState(value?.lat ? value : null);
  const [locating, setLocating] = useState(false);
  // Stable initial center/zoom so unrelated parent re-renders don't reset the map.
  const [initialCenter] = useState(value?.lat ? value : DEFAULT_CENTER);
  const mapRef = useRef(null);
  const autoRef = useRef(null);
  const didAutoLocate = useRef(false);

  const reverseGeocode = useCallback(
    (lat, lng) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        const location = status === 'OK' && results[0] ? extractLocation(results[0]) : {};
        onChange({ lat, lng, location });
      });
    },
    [onChange],
  );

  const place = useCallback(
    (lat, lng, pan = false) => {
      setMarker({ lat, lng });
      if (pan && mapRef.current) mapRef.current.panTo({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode],
  );

  // Ask the browser for the device's current location and pin it. When
  // `fallbackToDefault` is set, drop a pin at the default center if geolocation
  // is unavailable/denied so a draggable pin is always visible.
  const locateMe = useCallback(
    (fallbackToDefault = false) => {
      const dropDefault = () => {
        if (fallbackToDefault && !marker) place(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng, true);
      };
      if (!navigator.geolocation) {
        dropDefault();
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          place(pos.coords.latitude, pos.coords.longitude, true);
        },
        () => {
          setLocating(false);
          dropDefault();
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    },
    [place, marker],
  );

  // On first load with no existing pin, auto-locate the user (default pin on fail).
  useEffect(() => {
    if (isLoaded && !marker && !didAutoLocate.current) {
      didAutoLocate.current = true;
      locateMe(true);
    }
  }, [isLoaded, marker, locateMe]);

  if (loadError) return <div className="alert error">Failed to load Google Maps.</div>;
  if (!isLoaded) return <div className="map-placeholder">Loading map…</div>;

  return (
    <div className="map-picker">
      <Autocomplete
        onLoad={(a) => {
          autoRef.current = a;
        }}
        onPlaceChanged={() => {
          const p = autoRef.current?.getPlace();
          const loc = p?.geometry?.location;
          if (loc) place(loc.lat(), loc.lng(), true);
        }}
      >
        <input className="map-search" placeholder="Search a place or address…" />
      </Autocomplete>

      <button
        type="button"
        className="btn btn-ghost sm map-locate"
        onClick={locateMe}
        disabled={locating}
      >
        {locating ? 'Locating…' : '📍 Use my current location'}
      </button>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={marker ? 16 : 12}
        onLoad={(m) => {
          mapRef.current = m;
        }}
        onClick={(e) => place(e.latLng.lat(), e.latLng.lng())}
        options={{ streetViewControl: false, mapTypeControl: false }}
      >
        {marker && (
          <Marker
            position={marker}
            draggable
            onDragEnd={(e) => place(e.latLng.lat(), e.latLng.lng())}
          />
        )}
      </GoogleMap>
      <small className="muted">Click the map or drag the pin to set the exact location.</small>
    </div>
  );
}

function MapPicker({ value, onChange }) {
  const { key, loading } = useMapsKey();
  if (loading) return <div className="map-placeholder">Loading map…</div>;
  if (!key) {
    return (
      <div className="alert info">
        Map unavailable — add a Google Maps API key in admin Settings to pick a location.
      </div>
    );
  }
  return <PickerInner apiKey={key} value={value} onChange={onChange} />;
}

// Memoized so typing in other form fields doesn't re-render / reset the map.
export default memo(MapPicker);
