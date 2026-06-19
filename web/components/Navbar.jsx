"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, isStaff, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const doLogout = async () => {
    close();
    await logout();
    router.push("/");
  };

  return (
    <header className="nav">
      <Link href="/" className="brand" onClick={close}>
        🏠 Smart To-Let
      </Link>

      <button
        type="button"
        className={`nav-toggle ${open ? "open" : ""}`}
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`nav-links ${open ? "open" : ""}`}>
        <Link href="/" onClick={close}>All Tolet</Link>
        <Link href="/map" onClick={close}>MapView</Link>
        <Link href="/blog" onClick={close}>Blog</Link>
        {user ? (
          <>
            <Link href="/create" onClick={close}>+ Post Listing</Link>
            <Link href="/my-listings" onClick={close}>My Listings</Link>
            <Link href="/dashboard" onClick={close}>Dashboard</Link>
            {isStaff && (
              <Link href="/admin" className="btn btn-ghost" onClick={close}>
                Admin Panel
              </Link>
            )}
            <button className="btn btn-ghost" onClick={doLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/signin" onClick={close}>Sign In</Link>
            <Link href="/signup" className="btn btn-primary" onClick={close}>
              Sign Up
            </Link>
          </>
        )}
      </nav>

      {/* Click-away overlay (mobile only) closes the menu. */}
      {open && <div className="nav-backdrop" onClick={close} />}
    </header>
  );
}
