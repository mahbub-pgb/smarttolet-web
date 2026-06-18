'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

// Renders the public Navbar everywhere except the admin area, then the page.
export default function Chrome({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  return (
    <>
      {!isAdmin && <Navbar />}
      <main>{children}</main>
    </>
  );
}
