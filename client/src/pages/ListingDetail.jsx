import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, errMsg } from '../api/client';
import MapView from '../components/map/MapView';
import Gallery from '../components/Gallery';

// Amenity flags live under details/utilities; list the ones that are enabled.
const AMENITIES = [
  { group: 'details', key: 'parkingAvailable', label: 'Parking' },
  { group: 'details', key: 'liftAvailable', label: 'Lift/Elevator' },
  { group: 'details', key: 'generatorAvailable', label: 'Generator backup' },
  { group: 'utilities', key: 'internet', label: 'WiFi' },
  { group: 'utilities', key: 'gas', label: 'Gas connection' },
  { group: 'details', key: 'airConditioning', label: 'Air conditioning' },
  { group: 'utilities', key: 'securityGuard', label: 'Security guard' },
  { group: 'utilities', key: 'cctv', label: 'CCTV' },
  { group: 'details', key: 'gym', label: 'Gym' },
  { group: 'details', key: 'swimmingPool', label: 'Swimming pool' },
  { group: 'details', key: 'petFriendly', label: 'Pet friendly' },
];

const OCCUPANCY = [
  { key: 'familyOnly', label: 'Family only' },
  { key: 'bachelorAllowed', label: 'Bachelor allowed' },
  { key: 'femaleOnly', label: 'Female only' },
  { key: 'maleOnly', label: 'Male only' },
  { key: 'smokingAllowed', label: 'Smoking allowed' },
  { key: 'petsAllowed', label: 'Pets allowed' },
];

export default function ListingDetail() {
  const { slug } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // The backend resolves either a slug or a raw id.
    api
      .get(`/listings/${slug}`)
      .then(({ data }) => setListing(data.data.listing))
      .catch((err) => setError(errMsg(err)));
  }, [slug]);

  if (error) return <div className="container"><div className="alert error">{error}</div></div>;
  if (!listing) return <div className="container">Loading…</div>;

  const d = listing.details || {};
  const u = listing.utilities || {};
  const occ = listing.occupancy || {};
  const groups = { details: d, utilities: u };
  const coords = listing.geo?.coordinates; // [lng, lat]
  const addressText =
    listing.location?.formattedAddress ||
    [listing.location?.area, listing.location?.upazila, listing.location?.district, listing.location?.division]
      .filter(Boolean)
      .join(', ');

  const amenities = AMENITIES.filter((a) => groups[a.group]?.[a.key]);
  const occupancy = OCCUPANCY.filter((o) => occ[o.key]);
  const fmtDate = (v) => new Date(v).toLocaleDateString();
  return (
    <div className="container">
      <Link to="/" className="muted">
        ← Back to listings
      </Link>
      <div className="detail">
        <div className="gallery">
          <Gallery images={listing.images || []} title={listing.title} />
        </div>
        <div className="detail-body">
          <span className="badge">{listing.type?.replace(/_/g, ' ')}</span>
          <h1>{listing.title}</h1>
          <div className="rent big">৳ {Number(listing.monthlyRent).toLocaleString()}/mo</div>
          {addressText && <p className="muted">📍 {addressText}</p>}
          <div className="spec-row">
            {d.bedrooms != null && <span>🛏 {d.bedrooms} bed</span>}
            {d.bathrooms != null && <span>🛁 {d.bathrooms} bath</span>}
            {d.areaSqft != null && <span>📐 {d.areaSqft} sqft</span>}
            {d.furnishedStatus && <span>🪑 {d.furnishedStatus.replace(/_/g, ' ')}</span>}
          </div>
          <h3>Description</h3>
          <p>{listing.description}</p>

          <h3>Pricing &amp; availability</h3>
          <ul className="fact-list">
            <li><span>Monthly rent</span><strong>৳ {Number(listing.monthlyRent).toLocaleString()}</strong></li>
            {listing.advanceAmount != null && (
              <li><span>Advance</span><strong>৳ {Number(listing.advanceAmount).toLocaleString()}</strong></li>
            )}
            {listing.serviceCharge ? (
              <li><span>Service charge</span><strong>৳ {Number(listing.serviceCharge).toLocaleString()}</strong></li>
            ) : null}
            {listing.availableFrom && (
              <li><span>Available from</span><strong>{fmtDate(listing.availableFrom)}</strong></li>
            )}
          </ul>

          {(d.bedrooms != null || d.bathrooms != null || d.balconies != null ||
            d.floorNumber != null || d.buildingFloors != null || d.areaSqft != null ||
            d.furnishedStatus) && (
            <>
              <h3>Property details</h3>
              <ul className="fact-list">
                {d.bedrooms != null && <li><span>Bedrooms</span><strong>{d.bedrooms}</strong></li>}
                {d.bathrooms != null && <li><span>Bathrooms</span><strong>{d.bathrooms}</strong></li>}
                {d.balconies != null && <li><span>Balconies</span><strong>{d.balconies}</strong></li>}
                {d.floorNumber != null && <li><span>Floor</span><strong>{d.floorNumber}</strong></li>}
                {d.buildingFloors != null && <li><span>Building floors</span><strong>{d.buildingFloors}</strong></li>}
                {d.areaSqft != null && <li><span>Area</span><strong>{d.areaSqft} sqft</strong></li>}
                {d.furnishedStatus && (
                  <li><span>Furnishing</span><strong>{d.furnishedStatus.replace(/_/g, ' ')}</strong></li>
                )}
              </ul>
            </>
          )}

          {amenities.length > 0 && (
            <>
              <h3>Amenities</h3>
              <div className="tag-row">
                {amenities.map((a) => (
                  <span key={a.key} className="tag">✓ {a.label}</span>
                ))}
              </div>
            </>
          )}

          {occupancy.length > 0 && (
            <>
              <h3>Occupancy &amp; rules</h3>
              <div className="tag-row">
                {occupancy.map((o) => (
                  <span key={o.key} className="tag">✓ {o.label}</span>
                ))}
              </div>
            </>
          )}

          {Array.isArray(coords) && coords.length === 2 && (
            <>
              <h3>Location</h3>
              <MapView lat={coords[1]} lng={coords[0]} />
              <a
                className="btn btn-primary directions-btn"
                href={`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`}
                target="_blank"
                rel="noreferrer"
              >
                🧭 Get directions
              </a>
            </>
          )}
          {listing.owner && (
            <div className="owner-box">
              <h4>Posted by</h4>
              <p>
                {listing.owner.fullName || 'Owner'}
                {listing.owner.isLandlordVerified && <span className="badge verified">Verified</span>}
              </p>
              {listing.owner.mobile && <p className="muted">📞 {listing.owner.mobile}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
