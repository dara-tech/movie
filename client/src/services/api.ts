import axios from 'axios';
import apiConfig from '../config/api';

// Create axios instance with base configuration
const api = axios.create(apiConfig);

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
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
    // Don't redirect if there's no network (backend is down)
    if (error.message === 'Network Error' || !error.response) {
      console.error('Backend is not running or unreachable');
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      // Only redirect if we're not already on login/register pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/public')) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
