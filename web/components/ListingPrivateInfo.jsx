'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import MapView from '@/components/map/MapView';
import DirectionsButton from '@/components/DirectionsButton';

/**
 * Map location and owner contact details are visible to signed-in users only.
 * Guests see a sign-in prompt in place of this section (the section the user
 * scrolls to in order to sign in).
 */
export default function ListingPrivateInfo({ lat, lng, owner }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const hasCoords = typeof lat === 'number' && typeof lng === 'number';

  if (loading) return null;

  if (!user) {
    return (
      <div className="signin-gate">
        <h3>Location &amp; contact</h3>
        <div className="gate-card">
          <p>🔒 Sign in to see the exact location on the map and the owner&apos;s contact details.</p>
          <Link href={`/signin?from=${encodeURIComponent(pathname)}`} className="btn btn-primary">
            Sign in to view
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {hasCoords && (
        <>
          <h3>Location</h3>
          <MapView lat={lat} lng={lng} />
          <DirectionsButton lat={lat} lng={lng} />
        </>
      )}
      {owner && (
        <div className="owner-box">
          <h4>Posted by</h4>
          <p>
            {owner.fullName || 'Owner'}
            {owner.isLandlordVerified && <span className="badge verified">Verified</span>}
          </p>
          {owner.mobile && <p className="muted">📞 {owner.mobile}</p>}
        </div>
      )}
    </>
  );
}
