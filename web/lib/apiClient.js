'use client';

import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// ---- Token storage (browser only) ----
const ACCESS_KEY = 'st_access';
const REFRESH_KEY = 'st_refresh';
const hasWindow = () => typeof window !== 'undefined';

export const tokenStore = {
  get access() {
    return hasWindow() ? localStorage.getItem(ACCESS_KEY) : null;
  },
  get refresh() {
    return hasWindow() ? localStorage.getItem(REFRESH_KEY) : null;
  },
  set({ accessToken, refreshToken }) {
    if (!hasWindow()) return;
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    if (!hasWindow()) return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try a single refresh then replay the original request.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status === 401 && !original._retry && tokenStore.refresh) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: tokenStore.refresh });
        const { data } = await refreshing;
        refreshing = null;
        tokenStore.set(data.data.tokens);
        original.headers.Authorization = `Bearer ${tokenStore.access}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        tokenStore.clear();
      }
    }
    return Promise.reject(error);
  },
);

// Pull a human-friendly message out of an axios error.
export function errMsg(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  if (data?.details?.length) return data.details.map((d) => d.message).join(', ');
  return data?.message || error?.message || fallback;
}
