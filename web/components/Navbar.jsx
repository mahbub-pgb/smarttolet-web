'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const { user, isStaff, logout } = useAuth();
  const router = useRouter();

  const doLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="nav">
      <Link href="/" className="brand">
        🏠 Smart To-Let
      </Link>
      <nav className="nav-links">
        <Link href="/">Browse</Link>
        <Link href="/map">Map</Link>
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/create">+ Post Listing</Link>
            <Link href="/my-listings">My Listings</Link>
            {isStaff && (
              <Link href="/admin" className="btn btn-ghost">
                Admin Panel
              </Link>
            )}
            <button className="btn btn-ghost" onClick={doLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/signin">Sign In</Link>
            <Link href="/signup" className="btn btn-primary">
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
