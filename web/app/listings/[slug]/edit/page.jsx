'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import ListingForm from '@/components/ListingForm';
import { api, errMsg } from '@/lib/apiClient';

function EditInner() {
  const { slug } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/listings/${slug}`)
      .then(({ data }) => setListing(data.data.listing))
      .catch((err) => setError(errMsg(err)));
  }, [slug]);

  const onSubmit = async (formData) => {
    await api.put(`/listings/${listing._id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    router.push('/my-listings');
  };

  if (error) {
    return (
      <div className="container narrow">
        <div className="alert error">{error}</div>
        <Link href="/my-listings">← Back to my listings</Link>
      </div>
    );
  }
  if (!listing) return <div className="container">Loading…</div>;

  return (
    <div className="container narrow">
      <div className="card">
        <h2>Edit listing</h2>
        <p className="muted">Editing an approved listing sends it back to review before it goes live again.</p>
        <ListingForm
          initial={listing}
          existingImages={listing.images || []}
          submitLabel="Save changes"
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

export default function EditListingPage() {
  return (
    <ProtectedRoute>
      <EditInner />
    </ProtectedRoute>
  );
}
