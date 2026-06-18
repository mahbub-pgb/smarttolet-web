import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import ListingForm from '../components/ListingForm';

export default function CreateListing() {
  const navigate = useNavigate();

  const onSubmit = async (formData) => {
    await api.post('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    navigate('/my-listings');
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
