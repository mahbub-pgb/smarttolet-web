import Link from 'next/link';
import { apiGetWithMeta } from '@/lib/apiServer';
import ListingCard from '@/components/ListingCard';
import ListingFilters from '@/components/ListingFilters';
import PageJump from '@/components/PageJump';
import SmoothPageScroll from '@/components/SmoothPageScroll';

export const revalidate = 60;

const PAGE_SIZE = 12;

// Build a windowed list of page numbers around the current page.
function pageWindow(page, totalPages) {
  const span = 2;
  const pages = [];
  const start = Math.max(1, page - span);
  const end = Math.min(totalPages, page + span);
  if (start > 1) pages.push(1, start > 2 ? '…' : null);
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < totalPages) pages.push(end < totalPages - 1 ? '…' : null, totalPages);
  return pages.filter((p) => p !== null);
}

// Preserve current filters when linking to another page.
function hrefForPage(searchParams, page) {
  const params = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([k, v]) => {
    if (k !== 'page' && v != null && v !== '') params.set(k, Array.isArray(v) ? v[0] : v);
  });
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/?${qs}` : '/';
}

export default async function HomePage({ searchParams }) {
  const page = Number(searchParams?.page) || 1;
  const { data, meta } = await apiGetWithMeta('/listings', {
    params: { ...searchParams, page, limit: PAGE_SIZE },
    revalidate: 60,
  });
  const listings = data?.listings || [];

  return (
    <div className="container">
      <SmoothPageScroll />
      <section className="hero">
        <h1>Find your next home in Bangladesh</h1>
        <p className="muted">Browse verified rental listings across the country.</p>
      </section>

      <ListingFilters showSort />

      <div className="browse-bar">
        {meta && (
          <p className="muted results-line">
            {meta.total.toLocaleString()} listing{meta.total === 1 ? '' : 's'} found · page{' '}
            {meta.page} of {meta.totalPages}
          </p>
        )}
        <Link href="/map" className="btn btn-ghost sm">
          🗺 Map view
        </Link>
      </div>

      {listings.length === 0 ? (
        <p className="muted">No listings found.</p>
      ) : (
        <>
          <div className="grid">
            {listings.map((l) => (
              <ListingCard key={l._id} listing={l} />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <nav className="pagination">
              {meta.hasPrevPage ? (
                <Link className="btn btn-ghost sm" scroll={false} href={hrefForPage(searchParams, page - 1)}>
                  ← Prev
                </Link>
              ) : (
                <span className="btn btn-ghost sm" aria-disabled>← Prev</span>
              )}
              {pageWindow(meta.page, meta.totalPages).map((p, i) =>
                p === '…' ? (
                  <span key={`gap-${i}`} className="page-gap">…</span>
                ) : (
                  <Link
                    key={p}
                    className={`btn sm ${p === meta.page ? 'btn-primary' : 'btn-ghost'}`}
                    scroll={false}
                    href={hrefForPage(searchParams, p)}
                  >
                    {p}
                  </Link>
                ),
              )}
              {meta.hasNextPage ? (
                <Link className="btn btn-ghost sm" scroll={false} href={hrefForPage(searchParams, page + 1)}>
                  Next →
                </Link>
              ) : (
                <span className="btn btn-ghost sm" aria-disabled>Next →</span>
              )}
              {meta.totalPages > 5 && (
                <PageJump totalPages={meta.totalPages} currentPage={meta.page} />
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
