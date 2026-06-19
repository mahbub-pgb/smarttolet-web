'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const CompareContext = createContext(null);
const STORAGE_KEY = 'st_compare';
const MAX = 3;

// Keep only the fields the compare bar needs; the compare page refetches full
// listings by id/slug.
function slim(l) {
  return {
    _id: l._id,
    slug: l.slug,
    title: l.title,
    type: l.type,
    monthlyRent: l.monthlyRent,
    image: l.images?.[0]?.url || null,
  };
}

/** Holds up to 3 listings to compare, persisted in localStorage. */
export function CompareProvider({ children }) {
  const [items, setItems] = useState([]);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const persist = useCallback((next) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, []);

  const isComparing = useCallback((id) => items.some((i) => i._id === id), [items]);

  // Returns false if the list is already full and the item isn't in it.
  const toggle = useCallback(
    (listing) => {
      const exists = items.some((i) => i._id === listing._id);
      if (exists) {
        persist(items.filter((i) => i._id !== listing._id));
        return true;
      }
      if (items.length >= MAX) return false;
      persist([...items, slim(listing)]);
      return true;
    },
    [items, persist],
  );

  const remove = useCallback((id) => persist(items.filter((i) => i._id !== id)), [items, persist]);
  const clear = useCallback(() => persist([]), [persist]);

  return (
    <CompareContext.Provider
      value={{ items, isComparing, toggle, remove, clear, max: MAX, full: items.length >= MAX }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);
