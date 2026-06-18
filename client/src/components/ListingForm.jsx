import { useState } from 'react';
import { errMsg } from '../api/client';

const TYPES = [
  'apartment', 'flat', 'family_house', 'bachelor_room', 'sublet',
  'hostel', 'mess', 'office', 'shop', 'commercial_space',
];
const FURNISHED = ['furnished', 'semi_furnished', 'unfurnished'];

// Map an existing listing (or nothing) onto the flat form state.
function toForm(listing) {
  const l = listing || {};
  return {
    type: l.type || 'apartment',
    title: l.title || '',
    description: l.description || '',
    monthlyRent: l.monthlyRent ?? '',
    advanceAmount: l.advanceAmount ?? '',
    division: l.location?.division || '',
    district: l.location?.district || '',
    upazila: l.location?.upazila || '',
    area: l.location?.area || '',
    road: l.location?.road || '',
    houseNumber: l.location?.houseNumber || '',
    bedrooms: l.details?.bedrooms ?? '',
    bathrooms: l.details?.bathrooms ?? '',
    areaSqft: l.details?.areaSqft ?? '',
    furnishedStatus: l.details?.furnishedStatus || '',
    status: l.status === 'draft' ? 'draft' : 'pending',
  };
}

/**
 * Shared create/edit listing form. `onSubmit` receives a ready FormData and
 * should perform the POST/PUT (and navigate). Errors thrown by it are shown.
 */
export default function ListingForm({ initial, existingImages = [], submitLabel = 'Save', onSubmit }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('monthlyRent', form.monthlyRent);
      if (form.advanceAmount) fd.append('advanceAmount', form.advanceAmount);
      fd.append('status', form.status);

      // Nested objects are sent as JSON strings (backend parses them back).
      fd.append(
        'location',
        JSON.stringify({
          division: form.division,
          district: form.district,
          upazila: form.upazila || undefined,
          area: form.area || undefined,
          road: form.road || undefined,
          houseNumber: form.houseNumber || undefined,
        }),
      );
      const details = {};
      if (form.bedrooms !== '') details.bedrooms = Number(form.bedrooms);
      if (form.bathrooms !== '') details.bathrooms = Number(form.bathrooms);
      if (form.areaSqft !== '') details.areaSqft = Number(form.areaSqft);
      if (form.furnishedStatus) details.furnishedStatus = form.furnishedStatus;
      if (Object.keys(details).length) fd.append('details', JSON.stringify(details));

      images.forEach((file) => fd.append('images', file));

      await onSubmit(fd);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="alert error">{error}</div>}

      <label>Property type</label>
      <select value={form.type} onChange={set('type')}>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t.replace(/_/g, ' ')}
          </option>
        ))}
      </select>

      <label>Title</label>
      <input value={form.title} onChange={set('title')} required minLength={5} maxLength={150} />

      <label>Description</label>
      <textarea value={form.description} onChange={set('description')} required minLength={20} rows={4} />

      <div className="row">
        <div>
          <label>Monthly rent (৳)</label>
          <input type="number" value={form.monthlyRent} onChange={set('monthlyRent')} required min={0} />
        </div>
        <div>
          <label>Advance (৳)</label>
          <input type="number" value={form.advanceAmount} onChange={set('advanceAmount')} min={0} />
        </div>
      </div>

      <h4>Location</h4>
      <div className="row">
        <div>
          <label>Division</label>
          <input value={form.division} onChange={set('division')} required />
        </div>
        <div>
          <label>District</label>
          <input value={form.district} onChange={set('district')} required />
        </div>
      </div>
      <div className="row">
        <div>
          <label>Upazila</label>
          <input value={form.upazila} onChange={set('upazila')} />
        </div>
        <div>
          <label>Area</label>
          <input value={form.area} onChange={set('area')} />
        </div>
      </div>
      <div className="row">
        <div>
          <label>Road</label>
          <input value={form.road} onChange={set('road')} />
        </div>
        <div>
          <label>House number</label>
          <input value={form.houseNumber} onChange={set('houseNumber')} />
        </div>
      </div>

      <h4>Details</h4>
      <div className="row">
        <div>
          <label>Bedrooms</label>
          <input type="number" value={form.bedrooms} onChange={set('bedrooms')} min={0} />
        </div>
        <div>
          <label>Bathrooms</label>
          <input type="number" value={form.bathrooms} onChange={set('bathrooms')} min={0} />
        </div>
      </div>
      <div className="row">
        <div>
          <label>Area (sqft)</label>
          <input type="number" value={form.areaSqft} onChange={set('areaSqft')} min={0} />
        </div>
        <div>
          <label>Furnishing</label>
          <select value={form.furnishedStatus} onChange={set('furnishedStatus')}>
            <option value="">—</option>
            {FURNISHED.map((f) => (
              <option key={f} value={f}>
                {f.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {existingImages.length > 0 && (
        <>
          <h4>Current images</h4>
          <div className="thumb-row">
            {existingImages.map((img, i) => (
              <img key={i} src={img.url} alt={`current ${i}`} className="thumb" />
            ))}
          </div>
          <small className="muted">New images you add below are appended to these (max 10 total).</small>
        </>
      )}

      <label>{existingImages.length ? 'Add more images' : 'Images (up to 10)'}</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setImages(Array.from(e.target.files).slice(0, 10))}
      />
      {images.length > 0 && <small className="muted">{images.length} new image(s) selected</small>}

      <label>Visibility</label>
      <select value={form.status} onChange={set('status')}>
        <option value="pending">Submit for review</option>
        <option value="draft">Save as draft</option>
      </select>

      <button className="btn btn-primary block" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
