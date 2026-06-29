import axios from 'axios';


const api = axios.create({
  // In development, Vite runs on 5173 and proxies to 5000. 
  // In production (DigitalOcean), Nginx handles the /api routing.
  baseURL: '/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

//  Automatically attach the user's token to every request (for when Auth is ready)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;