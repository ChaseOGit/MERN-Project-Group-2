import axios from 'axios';


const api = axios.create({
  // In development, Vite runs on 5173 and proxies to 5000. 
  // In production (DigitalOcean), Nginx handles the /api routing.
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach JWT to each request so protected endpoints work transparently.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Small auth client keeps auth-related endpoints in one place for UI components.
export const authApi = {
  register: (payload) => api.post('/users/register', payload),
  login: (payload) => api.post('/users/login', payload),
  verifyEmail: (token) => api.post('/users/verify-email', { token }),
  resendVerification: (email) => api.post('/users/resend-verification', { email }),
  me: () => api.get('/users/me'),
  beginGoogleOAuth: () => api.get('/users/oauth/google'),
};

export default api;