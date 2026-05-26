import axios from 'axios';
import { getAuthToken, notifyUnauthorized } from './authAdapter';

export const api = axios.create({
  baseURL: '/api',
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Soft logout — keeps the UI navigable when the token expires.
      notifyUnauthorized();
    }
    return Promise.reject(error);
  },
);
