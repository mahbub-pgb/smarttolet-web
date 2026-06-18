'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/AuthContext';

const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/moderation', label: 'Moderation' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/promotions', label: 'Promotions' },
];

function AdminShell({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const doLogout = async () => {
    await logout();
    router.push('/');
  };

  const isActive = (item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <div className="admin-area">
      <div className="shell">
        <aside className="sidebar">
          <div className="logo">🏠 Admin</div>
          <nav>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={isActive(item) ? 'active' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-foot">
            <Link href="/" className="view-site">← View public site</Link>
            <div className="who">
              <strong>{user?.fullName || user?.mobile}</strong>
              <span className="role">{user?.role}</span>
            </div>
            <button className="btn btn-ghost block" onClick={doLogout}>Logout</button>
          </div>
        </aside>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute staff>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
