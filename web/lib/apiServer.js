// Server-side fetch helper for Server Components (public, unauthenticated data).
// Uses the internal API base so prod can route server->API traffic privately.
const API_BASE_URL =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * GET a public API path and return the parsed JSON `data` object (or null on
 * failure / 404). `revalidate` enables ISR caching (seconds).
 */
export async function apiGet(path, { revalidate = 60, params } = {}) {
  const qs = params
    ? `?${new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null && v !== ''),
      ).toString()}`
    : '';
  try {
    const res = await fetch(`${API_BASE_URL}${path}${qs}`, {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? null;
  } catch {
    return null;
  }
}

/** Same as apiGet but also returns pagination meta: { data, meta }. */
export async function apiGetWithMeta(path, opts = {}) {
  const qs = opts.params
    ? `?${new URLSearchParams(
        Object.entries(opts.params).filter(([, v]) => v != null && v !== ''),
      ).toString()}`
    : '';
  try {
    const res = await fetch(`${API_BASE_URL}${path}${qs}`, {
      next: { revalidate: opts.revalidate ?? 60 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { data: null, meta: null };
    const body = await res.json();
    return { data: body?.data ?? null, meta: body?.meta ?? null };
  } catch {
    return { data: null, meta: null };
  }
}

export { API_BASE_URL };
