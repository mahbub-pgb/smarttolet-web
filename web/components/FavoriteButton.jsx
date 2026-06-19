'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useFavorites } from '@/lib/FavoritesContext';

/**
 * Heart toggle. Stops propagation so it can sit on top of a card link without
 * triggering navigation. Sends guests to sign-in (preserving the return path).
 */
export default function FavoriteButton({ listingId, className = '' }) {
  const { user } = useAuth();
  const { isFavorite, toggle } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const fav = isFavorite(listingId);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/signin?from=${encodeURIComponent(pathname || '/')}`);
      return;
    }
    setBusy(true);
    try {
      await toggle(listingId);
    } catch {
      /* error surfaced elsewhere; keep button responsive */
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`fav-btn ${fav ? 'active' : ''} ${className}`}
      onClick={onClick}
      disabled={busy}
      aria-pressed={fav}
      aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
      title={fav ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span className="fav-heart">{fav ? '❤' : '♡'}</span>
    </button>
  );
}
