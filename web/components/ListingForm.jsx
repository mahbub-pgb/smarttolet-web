'use client';

import { useCallback, useState } from "react";
import { errMsg } from "@/lib/apiClient";
import MapPicker from "./map/MapPicker";

const TYPES = [
  "apartment",
  "flat",
  "family_house",
  "bachelor_room",
  "sublet",
  "hostel",
  "mess",
  "office",
  "shop",
  "commercial_space",
];

// Amenity checkboxes shown for every listing. `group` is the nested object the
// flag lives under on the backend (details vs utilities); `key` is the field.
const AMENITIES = [
  { group: "details", key: "parkingAvailable", label: "Parking" },
  { group: "details", key: "liftAvailable", label: "Lift/Elevator" },
  { group: "details", key: "generatorAvailable", label: "Generator backup" },
  { group: "utilities", key: "internet", label: "WiFi" },
  { group: "utilities", key: "gas", label: "Gas connection" },
  { group: "details", key: "airConditioning", label: "Air conditioning" },
  { group: "utilities", key: "securityGuard", label: "Security guard" },
  { group: "utilities", key: "cctv", label: "CCTV" },
  { group: "details", key: "gym", label: "Gym" },
  { group: "details", key: "swimmingPool", label: "Swimming pool" },
  { group: "details", key: "petFriendly", label: "Pet friendly" },
];

// Occupancy / tenant-preference checkboxes, shown for all listing types.
const OCCUPANCY = [
  { key: "familyOnly", label: "Family only" },
  { key: "bachelorAllowed", label: "Bachelor allowed" },
  { key: "femaleOnly", label: "Female only" },
  { key: "maleOnly", label: "Male only" },
  { key: "smokingAllowed", label: "Smoking allowed" },
  { key: "petsAllowed", label: "Pets allowed" },
];

// Map an existing listing (or nothing) onto the flat form state. Booleans are
// flattened with prefixed keys (e.g. `amenity_parkingAvailable`) so the single
// `set`/checkbox handlers can manage them; submit() regroups them.
function toForm(listing) {
  const l = listing || {};
  const form = {
    type: l.type || "apartment",
    title: l.title || "",
    description: l.description || "",
    monthlyRent: l.monthlyRent ?? "",
    advanceAmount: l.advanceAmount ?? "",
    availableFrom: l.availableFrom ? String(l.availableFrom).slice(0, 10) : "",
    bedrooms: l.details?.bedrooms ?? "",
    bathrooms: l.details?.bathrooms ?? "",
    balconies: l.details?.balconies ?? "",
    floorNumber: l.details?.floorNumber ?? "",
    buildingFloors: l.details?.buildingFloors ?? "",
    areaSqft: l.details?.areaSqft ?? "",
    status: l.status === "draft" ? "draft" : "pending",
  };
  AMENITIES.forEach((a) => {
    form[`amenity_${a.key}`] = Boolean(l[a.group]?.[a.key]);
  });
  OCCUPANCY.forEach((o) => {
    form[`occupancy_${o.key}`] = Boolean(l.occupancy?.[o.key]);
  });
  return form;
}

// GeoJSON stores [lng, lat]; the map works in { lat, lng }.
function initialCoords(listing) {
  const c = listing?.geo?.coordinates;
  return Array.isArray(c) && c.length === 2 ? { lng: c[0], lat: c[1] } : null;
}

export default function ListingForm({
  initial,
  existingImages = [],
  submitLabel = "Save",
  onSubmit,
}) {
  const [form, setForm] = useState(() => toForm(initial));
  const [images, setImages] = useState([]);
  const [coords, setCoords] = useState(() => initialCoords(initial));
  const [location, setLocation] = useState(() => initial?.location || {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setBool = (k) => (e) => setForm({ ...form, [k]: e.target.checked });

  // Stable callback so the map isn't re-rendered/reset on every keystroke.
  const handleMapChange = useCallback(({ lat, lng, location: loc }) => {
    setCoords({ lat, lng });
    setLocation(loc || {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!coords) {
      setError("Please pin the listing location on the map.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("type", form.type);
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("monthlyRent", form.monthlyRent);
      if (form.advanceAmount) fd.append("advanceAmount", form.advanceAmount);
      if (form.availableFrom) fd.append("availableFrom", form.availableFrom);
      fd.append("status", form.status);

      // Pin coordinates + reverse-geocoded location (sent as JSON; backend parses).
      fd.append("latitude", coords.lat);
      fd.append("longitude", coords.lng);
      fd.append("location", JSON.stringify(location || {}));

      const details = {};
      if (form.bedrooms !== "") details.bedrooms = Number(form.bedrooms);
      if (form.bathrooms !== "") details.bathrooms = Number(form.bathrooms);
      if (form.balconies !== "") details.balconies = Number(form.balconies);
      if (form.floorNumber !== "") details.floorNumber = Number(form.floorNumber);
      if (form.buildingFloors !== "") details.buildingFloors = Number(form.buildingFloors);
      if (form.areaSqft !== "") details.areaSqft = Number(form.areaSqft);

      // Regroup the flattened amenity checkboxes back into details/utilities.
      const utilities = {};
      AMENITIES.forEach((a) => {
        const target = a.group === "utilities" ? utilities : details;
        target[a.key] = Boolean(form[`amenity_${a.key}`]);
      });
      if (Object.keys(details).length)
        fd.append("details", JSON.stringify(details));
      if (Object.keys(utilities).length)
        fd.append("utilities", JSON.stringify(utilities));

      // Occupancy / tenant preferences (shown for all listing types).
      const occupancy = {};
      OCCUPANCY.forEach((o) => {
        occupancy[o.key] = Boolean(form[`occupancy_${o.key}`]);
      });
      fd.append("occupancy", JSON.stringify(occupancy));

      images.forEach((file) => fd.append("images", file));

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
      <select value={form.type} onChange={set("type")}>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {t.replace(/_/g, " ")}
          </option>
        ))}
      </select>

      <label>Title</label>
      <input
        value={form.title}
        onChange={set("title")}
        required
        minLength={5}
        maxLength={150}
      />

      <label>Description</label>
      <textarea
        value={form.description}
        onChange={set("description")}
        required
        minLength={20}
        rows={4}
      />

      <div className="row">
        <div>
          <label>Monthly rent (৳)</label>
          <input
            type="number"
            value={form.monthlyRent}
            onChange={set("monthlyRent")}
            required
            min={0}
          />
        </div>
        <div>
          <label>Advance (৳)</label>
          <input
            type="number"
            value={form.advanceAmount}
            onChange={set("advanceAmount")}
            min={0}
          />
        </div>
      </div>

      <label>Available from</label>
      <input type="date" value={form.availableFrom} onChange={set("availableFrom")} />

      <h4>Location</h4>
      <MapPicker value={coords} onChange={handleMapChange} />
      {location?.formattedAddress ? (
        <p className="muted picked-address">📍 {location.formattedAddress}</p>
      ) : coords ? (
        <p className="muted picked-address">
          📍 Pinned at {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>
      ) : null}

      <h4>Details</h4>
      <div className="row">
        <div>
          <label>Bedrooms</label>
          <input
            type="number"
            value={form.bedrooms}
            onChange={set("bedrooms")}
            min={0}
          />
        </div>
        <div>
          <label>Bathrooms</label>
          <input
            type="number"
            value={form.bathrooms}
            onChange={set("bathrooms")}
            min={0}
          />
        </div>
      </div>
      <div className="row">
        <div>
          <label>Area (sqft)</label>
          <input
            type="number"
            value={form.areaSqft}
            onChange={set("areaSqft")}
            min={0}
          />
        </div>
        <div>
          <label>Balconies</label>
          <input
            type="number"
            value={form.balconies}
            onChange={set("balconies")}
            min={0}
          />
        </div>
      </div>
      <div className="row">
        <div>
          <label>Floor number</label>
          <input
            type="number"
            value={form.floorNumber}
            onChange={set("floorNumber")}
            min={0}
            placeholder="Which floor is it on?"
          />
        </div>
        <div>
          <label>Total floors in building</label>
          <input
            type="number"
            value={form.buildingFloors}
            onChange={set("buildingFloors")}
            min={0}
          />
        </div>
      </div>

      <h4>Amenities</h4>
      <div className="checkbox-grid">
        {AMENITIES.map((a) => (
          <label key={a.key} className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(form[`amenity_${a.key}`])}
              onChange={setBool(`amenity_${a.key}`)}
            />
            {a.label}
          </label>
        ))}
      </div>

      <h4>Occupancy &amp; rules</h4>
      <div className="checkbox-grid">
        {OCCUPANCY.map((o) => (
          <label key={o.key} className="checkbox">
            <input
              type="checkbox"
              checked={Boolean(form[`occupancy_${o.key}`])}
              onChange={setBool(`occupancy_${o.key}`)}
            />
            {o.label}
          </label>
        ))}
      </div>

      {existingImages.length > 0 && (
        <>
          <h4>Current images</h4>
          <div className="thumb-row">
            {existingImages.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={`current ${i}`}
                className="thumb"
              />
            ))}
          </div>
          <small className="muted">
            New images you add below are appended to these (max 10 total).
          </small>
        </>
      )}

      <label>
        {existingImages.length ? "Add more images" : "Images (up to 10)"}
      </label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => setImages(Array.from(e.target.files).slice(0, 10))}
      />
      {images.length > 0 && (
        <small className="muted">{images.length} new image(s) selected</small>
      )}

      <label>Visibility</label>
      <select value={form.status} onChange={set("status")}>
        <option value="pending">Submit for review</option>
        <option value="draft">Save as draft</option>
      </select>

      <button className="btn btn-primary block" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
