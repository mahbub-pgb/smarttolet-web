'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, tokenStore } from './apiClient';

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

  const login = async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    tokenStore.set(data.data.tokens);
    setUser(data.data.user);
    return data.data.user;
  };

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

  const uploadAvatar = async (file) => {
    const fd = new FormData();
    fd.append('profileImage', file);
    const { data } = await api.post('/auth/avatar', fd);
    setUser(data.data.user);
    return data.data.user;
  };

  const changePassword = async (currentPassword, newPassword) => {
    await api.post('/auth/password/change', { currentPassword, newPassword });
  };

  const requestPasswordReset = async (mobile) => {
    const { data } = await api.post('/auth/password/forgot', { mobile });
    return data.data;
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
        uploadAvatar, changePassword, requestPasswordReset, resetPassword, logout, setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
