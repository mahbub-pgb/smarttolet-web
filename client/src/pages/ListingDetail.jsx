import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, errMsg } from '../api/client';
import MapView from '../components/map/MapView';

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
  const coords = listing.geo?.coordinates; // [lng, lat]
  const addressText =
    listing.location?.formattedAddress ||
    [listing.location?.area, listing.location?.upazila, listing.location?.district, listing.location?.division]
      .filter(Boolean)
      .join(', ');
  return (
    <div className="container">
      <Link to="/" className="muted">
        ← Back to listings
      </Link>
      <div className="detail">
        <div className="gallery">
          {listing.images?.length ? (
            listing.images.map((img, i) => <img key={i} src={img.url} alt={`${listing.title} ${i}`} />)
          ) : (
            <div className="no-img big">No images</div>
          )}
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
          {Array.isArray(coords) && coords.length === 2 && (
            <>
              <h3>Location</h3>
              <MapView lat={coords[1]} lng={coords[0]} />
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
