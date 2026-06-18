import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from '../api/client';

const AuthContext = createContext(null);

const STAFF_ROLES = ['moderator', 'admin', 'super_admin'];
export const isStaffRole = (role) => STAFF_ROLES.includes(role);

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
    return data.data; // { expiresIn }
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

  // Account: change password while logged in.
  const changePassword = async (currentPassword, newPassword) => {
    await api.post('/auth/password/change', { currentPassword, newPassword });
  };

  // Forgot-password flow (logged out): request a reset OTP, then reset.
  const requestPasswordReset = async (mobile) => {
    const { data } = await api.post('/auth/password/forgot', { mobile });
    return data.data; // { expiresIn }
  };

  const resetPassword = async (mobile, code, newPassword) => {
    await api.post('/auth/password/reset', { mobile, code, newPassword });
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

  const isStaff = !!user && isStaffRole(user.role);

  return (
    <AuthContext.Provider
      value={{
        user, loading, isStaff, login, requestOtp, verifyOtp, completeProfile,
        changePassword, requestPasswordReset, resetPassword, logout, setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
