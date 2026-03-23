// services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
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

// Response interceptor - DO NOT auto-redirect for export requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if this is an export request (blob response type)
    const isExportRequest = error.config?.responseType === 'blob';
    
    if (error.response?.status === 401) {
      console.error('401 Unauthorized - Token may be expired');
      
      // Clear token
      localStorage.removeItem('token');
      
      // Only redirect for non-export requests
      if (!isExportRequest && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;