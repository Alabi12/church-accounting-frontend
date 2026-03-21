import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔧 ========== API CONFIGURATION ==========');
console.log('🔧 VITE_API_URL from env:', import.meta.env.VITE_API_URL);
console.log('🔧 Final API_URL:', API_URL);
console.log('🔧 =======================================');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - logs every request
api.interceptors.request.use(
  (config) => {
    console.log('📤 [REQUEST]', config.method.toUpperCase(), config.baseURL + config.url);
    console.log('📤 Headers:', config.headers);
    if (config.data) {
      console.log('📤 Data:', config.data);
    }
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - logs every response
api.interceptors.response.use(
  (response) => {
    console.log('📥 [RESPONSE]', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('📥 Response Error:', error.response?.status, error.config?.url);
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error headers:', error.response.headers);
    }
    return Promise.reject(error);
  }
);

export default api;