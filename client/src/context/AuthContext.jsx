import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

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

  // Sign in with mobile/email + password.
  const login = async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    tokenStore.set(data.data.tokens);
    setUser(data.data.user);
    return data.data.user;
  };

  // OTP signup helpers.
  const requestOtp = async (mobile) => {
    const { data } = await api.post('/auth/otp/request', { mobile });
    return data.data; // { expiresIn, devOtp }
  };

  const verifyOtp = async (mobile, code) => {
    const { data } = await api.post('/auth/otp/verify', { mobile, code });
    tokenStore.set(data.data.tokens);
    setUser(data.data.user);
    return data.data; // { user, tokens, profileComplete }
  };

  const completeProfile = async (payload) => {
    const { data } = await api.put('/auth/profile', payload);
    setUser(data.data.user);
    return data.data.user;
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

  return (
    <AuthContext.Provider
      value={{ user, loading, login, requestOtp, verifyOtp, completeProfile, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
