'use client';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ListingForm from '@/components/ListingForm';
import { api } from '@/lib/apiClient';

function CreateInner() {
  const router = useRouter();

  const onSubmit = async (formData) => {
    await api.post('/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    router.push('/my-listings');
  };

  return (
    <div className="container narrow">
      <div className="card">
        <h2>Post a listing</h2>
        <ListingForm submitLabel="Publish listing" onSubmit={onSubmit} />
      </div>
    </div>
  );
}

export default function CreateListingPage() {
  return (
    <ProtectedRoute>
      <CreateInner />
    </ProtectedRoute>
  );
}
