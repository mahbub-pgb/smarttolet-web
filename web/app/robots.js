import { SITE_URL } from '@/lib/constants';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/dashboard',
        '/my-listings',
        '/create',
        '/signin',
        '/signup',
        '/forgot-password',
        '/change-password',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
