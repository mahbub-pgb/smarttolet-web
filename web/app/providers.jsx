'use client';

import { AuthProvider } from '@/lib/AuthContext';
import { FavoritesProvider } from '@/lib/FavoritesContext';
import { CompareProvider } from '@/lib/CompareContext';
import CompareBar from '@/components/CompareBar';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <CompareProvider>
          {children}
          <CompareBar />
        </CompareProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
