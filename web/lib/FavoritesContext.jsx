'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './apiClient';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

/**
 * Loads the signed-in user's favorites once and keeps a Set of favorited
 * listing ids so any FavoriteButton can render the correct state. Toggling is
 * optimistic and persisted via the backend (/me/favorites).
 */
export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]); // populated { listing } docs
  const [ids, setIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/me/favorites', { params: { limit: 100 } });
      const favs = data.data.favorites || [];
      setFavorites(favs);
      setIds(new Set(favs.map((f) => f.listing?._id).filter(Boolean)));
    } catch {
      /* ignore — favorites are non-critical */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const isFavorite = useCallback((id) => ids.has(id), [ids]);

  const toggle = useCallback(
    async (listingId) => {
      if (!user) return false;
      const has = ids.has(listingId);
      // Optimistic update.
      setIds((prev) => {
        const next = new Set(prev);
        if (has) next.delete(listingId);
        else next.add(listingId);
        return next;
      });
      try {
        if (has) {
          await api.delete(`/me/favorites/${listingId}`);
          setFavorites((prev) => prev.filter((f) => f.listing?._id !== listingId));
        } else {
          await api.post(`/me/favorites/${listingId}`);
          await load(); // refresh to pull the populated listing for the list view
        }
        return !has;
      } catch (e) {
        // Revert on failure.
        setIds((prev) => {
          const next = new Set(prev);
          if (has) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
        throw e;
      }
    },
    [user, ids, load],
  );

  return (
    <FavoritesContext.Provider value={{ favorites, ids, isFavorite, toggle, loading, reload: load }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoritesContext);
