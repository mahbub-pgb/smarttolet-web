import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import useMapsKey from './useMapsKey';
import { MAPS_LIBRARIES, MAPS_LOADER_ID } from './mapsConfig';

const containerStyle = { width: '100%', height: '280px', borderRadius: '10px' };

function ViewInner({ apiKey, center }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: MAPS_LOADER_ID,
    googleMapsApiKey: apiKey,
    libraries: MAPS_LIBRARIES,
  });
  if (loadError) return <div className="alert error">Failed to load map.</div>;
  if (!isLoaded) return <div className="map-placeholder">Loading map…</div>;
  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={16}
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      <Marker position={center} />
    </GoogleMap>
  );
}

// Read-only map with a single marker. `lat`/`lng` required.
export default function MapView({ lat, lng }) {
  const { key, loading } = useMapsKey();
  if (lat == null || lng == null) return null;
  if (loading) return <div className="map-placeholder">Loading map…</div>;
  if (!key) return null;
  return <ViewInner apiKey={key} center={{ lat, lng }} />;
}
