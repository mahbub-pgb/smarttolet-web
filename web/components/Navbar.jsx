"use client";

import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, isStaff, logout } = useAuth();
  const router = useRouter();

  const doLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="nav">
      <Link href="/" className="brand">
        🏠 Smart To-Let
      </Link>
      <nav className="nav-links">
        <Link href="/">All Tolet</Link>
        <Link href="/map">MapView </Link>
        {user ? (
          <>
            <Link href="/create">+ Post Listing</Link>
            <Link href="/my-listings">My Listings</Link>
            <Link href="/dashboard">Dashboard</Link>
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
