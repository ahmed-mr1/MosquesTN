import axios from 'axios';

// Ensure this matches where your backend is running
// When testing locally: 'http://127.0.0.1:5000'
// In production: 'https://mosquestn-api.azurewebsites.net'
const BASE_URL = 'https://mosquestn-api.azurewebsites.net'; 

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
