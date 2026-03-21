import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Important for CORS with credentials
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔑 Token from localStorage:', token ? 'Present' : 'Not found');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token attached to request');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`❌ ${error.response.status} ${error.config?.url}`, error.response.data);
      
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.error('🔒 Authentication failed - redirecting to login');
        // Clear invalid token
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // Handle CORS errors
      if (error.message === 'Network Error') {
        console.error('🌐 CORS Error: Check if backend is running and CORS is properly configured');
      }
      
    } else if (error.request) {
      // The request was made but no response was received
      console.error('❌ No response received:', error.request);
      console.error('🌐 Make sure backend server is running at:', API_URL);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('❌ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;