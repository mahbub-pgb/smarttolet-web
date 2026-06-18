import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

const ACCESS_KEY = 'st_admin_access';
const REFRESH_KEY = 'st_admin_refresh';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && tokenStore.refresh) {
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
      } catch {
        refreshing = null;
        tokenStore.clear();
      }
    }
    return Promise.reject(error);
  },
);

export function errMsg(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  if (data?.details?.length) return data.details.map((d) => d.message).join(', ');
  return data?.message || error?.message || fallback;
}
