import './index.css';
import './admin.css';
import Providers from './providers';
import Chrome from '@/components/Chrome';
import { SITE_URL, SITE_NAME } from '@/lib/constants';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Rental listings across Bangladesh`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    'Browse verified rental listings — apartments, flats, mess, hostels and more — across Bangladesh on Smart To-Let.',
  openGraph: {
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Chrome>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
