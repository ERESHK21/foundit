import axios from 'axios';

// In development this is empty, so requests go to /api and Vite proxies them to
// localhost:8080. In a deployed build set VITE_API_URL to the backend's origin.
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const api = axios.create({ baseURL: `${API_ORIGIN}/api` });

// Backend returns upload paths like /uploads/x.jpg; prefix them when hosted apart.
export function assetUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('foundit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('foundit_token')) {
      localStorage.removeItem('foundit_token');
      localStorage.removeItem('foundit_user');
      window.dispatchEvent(new Event('foundit:logout'));
    }
    return Promise.reject(error);
  },
);

export function apiError(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  if (data?.details && typeof data.details === 'object') {
    const first = Object.values(data.details)[0];
    if (first) return first;
  }
  return data?.message || error?.message || fallback;
}
