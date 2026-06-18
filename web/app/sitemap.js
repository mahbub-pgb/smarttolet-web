import { apiGet } from '@/lib/apiServer';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 3600; // rebuild sitemap hourly

export default async function sitemap() {
  const staticEntries = [
    { url: `${SITE_URL}/`, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/map`, changeFrequency: 'daily', priority: 0.5 },
  ];

  const data = await apiGet('/listings/sitemap', { revalidate: 3600 });
  const listings = (data?.listings || []).map((l) => ({
    url: `${SITE_URL}/listings/${l.slug}`,
    lastModified: l.updatedAt ? new Date(l.updatedAt) : undefined,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticEntries, ...listings];
}
