import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error('Authentication error');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  verify: () => api.post('/auth/verify'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Settings API
export const settingsAPI = {
  getAll: () => api.get('/settings'),
  create: (data) => api.post('/settings', data),
  update: (id, data) => api.put(`/settings/${id}`, data),
  delete: (id) => api.delete(`/settings/${id}`)
};

// Availability API
export const availabilityAPI = {
  get: (params) => api.get('/availability', { params })
};

// Logs API
export const logsAPI = {
  getNotifications: (limit = 50) => api.get('/logs/notifications', { params: { limit } }),
  getScraping: (limit = 50) => api.get('/logs/scraping', { params: { limit } })
};

export default api;
