// Shared across the picker and the read-only view so the Google Maps script is
// loaded exactly once with identical options (the loader warns otherwise).
export const MAPS_LIBRARIES = ['places'];
export const MAPS_LOADER_ID = 'smart-tolet-gmaps';

// Dhaka — used as a sensible default map center.
export const DEFAULT_CENTER = { lat: 23.8103, lng: 90.4125 };
