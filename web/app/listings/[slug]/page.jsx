import Gallery from "@/components/Gallery";
import ListingPrivateInfo from "@/components/ListingPrivateInfo";
import { apiGet } from "@/lib/apiServer";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 300; // ISR: refresh listing pages every 5 min

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

const OCCUPANCY = [
  { key: "familyOnly", label: "Family only" },
  { key: "bachelorAllowed", label: "Bachelor allowed" },
  { key: "femaleOnly", label: "Female only" },
  { key: "maleOnly", label: "Male only" },
  { key: "smokingAllowed", label: "Smoking allowed" },
  { key: "petsAllowed", label: "Pets allowed" },
];

async function getListing(slug) {
  const data = await apiGet(`/listings/${slug}`, { revalidate: 300 });
  return data?.listing || null;
}

// Extract an 11-char YouTube video id from the common URL shapes.
function youtubeId(url) {
  if (!url) return null;
  const m = String(url).match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

function addressText(listing) {
  return (
    listing.location?.formattedAddress ||
    [
      listing.location?.area,
      listing.location?.upazila,
      listing.location?.district,
      listing.location?.division,
    ]
      .filter(Boolean)
      .join(", ")
  );
}

export async function generateMetadata({ params }) {
  const listing = await getListing(params.slug);
  if (!listing) return { title: "Listing not found" };

  const where =
    listing.location?.area || listing.location?.district || "Bangladesh";
  const rent = Number(listing.monthlyRent).toLocaleString();
  const title = `${listing.title} · ৳${rent}/mo in ${where}`;
  const description = (listing.description || "")
    .replace(/\s+/g, " ")
    .slice(0, 160);
  const url = `${SITE_URL}/listings/${listing.slug || listing._id}`;
  const image = listing.images?.[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ListingDetailPage({ params }) {
  const listing = await getListing(params.slug);
  if (!listing) notFound();

  const d = listing.details || {};
  const u = listing.utilities || {};
  const occ = listing.occupancy || {};
  const groups = { details: d, utilities: u };
  const coords = listing.geo?.coordinates; // [lng, lat]
  const address = addressText(listing);
  const amenities = AMENITIES.filter((a) => groups[a.group]?.[a.key]);
  const occupancy = OCCUPANCY.filter((o) => occ[o.key]);
  // e.g. "1 June 2026"
  const fmtDate = (v) =>
    new Date(v).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const url = `${SITE_URL}/listings/${listing.slug || listing._id}`;

  // schema.org structured data for rich results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: (listing.description || "").slice(0, 300),
    image: (listing.images || []).map((i) => i.url),
    category: listing.type?.replace(/_/g, " "),
    offers: {
      "@type": "Offer",
      price: listing.monthlyRent,
      priceCurrency: "BDT",
      availability: "https://schema.org/InStock",
      url,
    },
    ...(address && {
      areaServed: { "@type": "Place", name: address },
    }),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Listings", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: listing.title, item: url },
    ],
  };

  return (
    <div className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <Link href="/" className="muted">
        ← Back to listings
      </Link>
      <div className="detail">
        <div className="gallery">
          <Gallery images={listing.images || []} title={listing.title} />
        </div>
        <div className="detail-body">
          <span className="badge">{listing.type?.replace(/_/g, " ")}</span>
          <h1>{listing.title}</h1>
          <div className="rent big">
            ৳ {Number(listing.monthlyRent).toLocaleString()}/mo
          </div>
          <div className="spec-row">
            {d.bedrooms != null && <span>🛏 {d.bedrooms} bed</span>}
            {d.bathrooms != null && <span>🛁 {d.bathrooms} bath</span>}
            {d.areaSqft != null && <span>📐 {d.areaSqft} sqft</span>}
          </div>

          <h3>Description</h3>
          <p>{listing.description}</p>

          {youtubeId(listing.videoTourUrl) && (
            <>
              <h3>Video tour</h3>
              <div className="video-embed">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId(listing.videoTourUrl)}`}
                  title="Video tour"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </>
          )}

          <h3>Pricing &amp; availability</h3>
          <ul className="fact-list">
            <li>
              <span>Monthly rent</span>
              <strong>৳ {Number(listing.monthlyRent).toLocaleString()}</strong>
            </li>
            {listing.advanceAmount != null && (
              <li>
                <span>Advance</span>
                <strong>
                  ৳ {Number(listing.advanceAmount).toLocaleString()}
                </strong>
              </li>
            )}
            {listing.serviceCharge ? (
              <li>
                <span>Service charge</span>
                <strong>
                  ৳ {Number(listing.serviceCharge).toLocaleString()}
                </strong>
              </li>
            ) : null}
            {listing.availableFrom && (
              <li>
                <span>Available from</span>
                <strong>{fmtDate(listing.availableFrom)}</strong>
              </li>
            )}
          </ul>

          {(d.bedrooms != null ||
            d.bathrooms != null ||
            d.balconies != null ||
            d.floorNumber != null ||
            d.buildingFloors != null ||
            d.areaSqft != null) && (
            <>
              <h3>Property details</h3>
              <ul className="fact-list">
                {d.bedrooms != null && (
                  <li>
                    <span>Bedrooms</span>
                    <strong>{d.bedrooms}</strong>
                  </li>
                )}
                {d.bathrooms != null && (
                  <li>
                    <span>Bathrooms</span>
                    <strong>{d.bathrooms}</strong>
                  </li>
                )}
                {d.balconies != null && (
                  <li>
                    <span>Balconies</span>
                    <strong>{d.balconies}</strong>
                  </li>
                )}
                {d.floorNumber != null && (
                  <li>
                    <span>Floor</span>
                    <strong>{d.floorNumber}</strong>
                  </li>
                )}
                {d.buildingFloors != null && (
                  <li>
                    <span>Building floors</span>
                    <strong>{d.buildingFloors}</strong>
                  </li>
                )}
                {d.areaSqft != null && (
                  <li>
                    <span>Area</span>
                    <strong>{d.areaSqft} sqft</strong>
                  </li>
                )}
              </ul>
            </>
          )}

          {amenities.length > 0 && (
            <>
              <h3>Amenities</h3>
              <div className="tag-row">
                {amenities.map((a) => (
                  <span key={a.key} className="tag">
                    ✓ {a.label}
                  </span>
                ))}
              </div>
            </>
          )}

          {occupancy.length > 0 && (
            <>
              <h3>Occupancy &amp; rules</h3>
              <div className="tag-row">
                {occupancy.map((o) => (
                  <span key={o.key} className="tag">
                    ✓ {o.label}
                  </span>
                ))}
              </div>
            </>
          )}

          <ListingPrivateInfo
            lat={
              Array.isArray(coords) && coords.length === 2
                ? coords[1]
                : undefined
            }
            lng={
              Array.isArray(coords) && coords.length === 2
                ? coords[0]
                : undefined
            }
            owner={listing.owner}
          />
        </div>
      </div>
    </div>
  );
}
