'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, isStaffRole } from '@/lib/AuthContext';

/**
 * Client-side route guard. `staff` requires a staff role (admin area). Redirects
 * to sign-in (preserving the target) while auth is resolving / when unauthorized.
 * Protected pages are not SEO-relevant, so a client guard is sufficient.
 */
export default function ProtectedRoute({ children, staff = false }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/signin?from=${encodeURIComponent(pathname)}`);
    } else if (staff && !isStaffRole(user.role)) {
      router.replace('/');
    }
  }, [loading, user, staff, pathname, router]);

  if (loading) return <div className="container">Loading…</div>;
  if (!user || (staff && !isStaffRole(user.role))) return null;
  return children;
}
