import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, errMsg } from '../api/client';
import ListingForm from '../components/ListingForm';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/listings/${id}`)
      .then(({ data }) => setListing(data.data.listing))
      .catch((err) => setError(errMsg(err)));
  }, [id]);

  const onSubmit = async (formData) => {
    await api.put(`/listings/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    navigate('/my-listings');
  };

  if (error) {
    return (
      <div className="container narrow">
        <div className="alert error">{error}</div>
        <Link to="/my-listings">← Back to my listings</Link>
      </div>
    );
  }
  if (!listing) return <div className="container">Loading…</div>;

  return (
    <div className="container narrow">
      <div className="card">
        <h2>Edit listing</h2>
        <p className="muted">
          Editing an approved listing sends it back to review before it goes live again.
        </p>
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
