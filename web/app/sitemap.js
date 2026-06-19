import { apiGet } from '@/lib/apiServer';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 3600; // rebuild sitemap hourly

export default async function sitemap() {
  const staticEntries = [
    { url: `${SITE_URL}/`, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/map`, changeFrequency: 'daily', priority: 0.5 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.6 },
  ];

  const [data, blogData] = await Promise.all([
    apiGet('/listings/sitemap', { revalidate: 3600 }),
    apiGet('/blog', { revalidate: 3600, params: { limit: 50 } }),
  ]);
  const listings = (data?.listings || []).map((l) => ({
    url: `${SITE_URL}/listings/${l.slug}`,
    lastModified: l.updatedAt ? new Date(l.updatedAt) : undefined,
    changeFrequency: 'daily',
    priority: 0.8,
  }));
  const posts = (blogData?.posts || []).map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...listings, ...posts];
}
