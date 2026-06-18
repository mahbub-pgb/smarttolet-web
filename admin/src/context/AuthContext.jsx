import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

const STAFF_ROLES = ['moderator', 'admin', 'super_admin'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!tokenStore.access) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
    } catch {
      tokenStore.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    const u = data.data.user;
    if (!STAFF_ROLES.includes(u.role)) {
      throw new Error('This account does not have admin access.');
    }
    tokenStore.set(data.data.tokens);
    setUser(u);
    return u;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    tokenStore.clear();
    setUser(null);
  };

  const isStaff = !!user && STAFF_ROLES.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
