import Link from 'next/link';
import { cldThumb } from '@/lib/img';

// Server-rendered listing card (markup appears in initial HTML for SEO).
export default function ListingCard({ listing }) {
  // Card is ~250px wide; ship a small variant, not the full-res upload.
  const img = cldThumb(listing.images?.[0]?.url, 400);
  return (
    <Link href={`/listings/${listing.slug || listing._id}`} className="listing-card">
      <div className="listing-thumb">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={listing.title} loading="lazy" />
        ) : (
          <div className="no-img">No image</div>
        )}
      </div>
      <div className="listing-body">
        <span className="badge">{listing.type?.replace(/_/g, ' ')}</span>
        <h3>{listing.title}</h3>
        <p className="muted">
          {listing.location?.area ? `${listing.location.area}, ` : ''}
          {listing.location?.district}
        </p>
        <div className="rent">৳ {Number(listing.monthlyRent).toLocaleString()}/mo</div>
      </div>
    </Link>
  );
}
