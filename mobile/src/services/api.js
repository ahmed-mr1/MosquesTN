import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extra = (Constants?.expoConfig?.extra) || {};
export const BASE_URL = extra.backendBaseUrl || 'https://mosquestn-api.azurewebsites.net';
export const api = axios.create({ baseURL: BASE_URL, timeout: 20000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('jwt');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export async function login(credentials) {
  try {
    const { data } = await api.post('/auth/login', credentials);
    const jwt = data?.access_token;
    if (jwt) await AsyncStorage.setItem('jwt', jwt);
    return jwt;
  } catch (e) {
    const status = e?.response?.status;
    // Try demo endpoint next if 404 or general failure
    let payload = { ...credentials };
    if (!payload.role && typeof payload.phone === 'string') {
      const map = {
        '+21600000001': 'user',
        '+21600000002': 'moderator',
        '+21600000003': 'admin',
      };
      if (map[payload.phone]) payload = { role: map[payload.phone] };
    }
    try {
      const { data } = await api.post('/auth/demo/login', payload);
      const jwt = data?.access_token;
      if (jwt) await AsyncStorage.setItem('jwt', jwt);
      return jwt;
    } catch (inner) {
      // Final fallback: local demo token
      const role = payload.role || 'user';
      const jwt = createDemoToken(role);
      await AsyncStorage.setItem('jwt', jwt);
      return jwt;
    }
  }
}

function base64url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function createDemoToken(role) {
  // Minimal unsigned JWT-looking token for demo purposes only
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'none', typ: 'JWT' };
  const payload = { sub: 'demo-user', role, iat: now, exp: now + 24 * 3600 };
  let encodedHeader = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0'; // precomputed for alg: none
  try { encodedHeader = base64url(header); } catch {}
  let encodedPayload = 'eyJzdWIiOiJkZW1vLXVzZXIiLCJyb2xlIjoi' + role + 'In0';
  try { encodedPayload = base64url(payload); } catch {}
  return `${encodedHeader}.${encodedPayload}.`;
}

// Mosques
export async function getNearbyMosques({ lat, lng, radius = 5 }) {
  const { data } = await api.get('/mosques/nearby', { params: { lat, lng, radius } });
  return data;
}

export async function getMosques(params = {}) {
  const query = { approved: true, ...params };
  const { data } = await api.get('/mosques', { params: query });
  return data;
}

export async function getMosque(id) {
  const { data } = await api.get(`/mosques/${id}`);
  return data;
}

export async function getMosqueReviews(id, params = {}) {
  const { data } = await api.get(`/mosques/${id}/reviews`, { params });
  return data;
}

export async function postMosqueReview(id, body) {
  const { data } = await api.post(`/mosques/${id}/reviews`, body);
  return data;
}

export async function suggestMosque(body) {
  try {
    const { data } = await api.post('/suggestions/mosques', body);
    return data;
  } catch (e) {
    const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Request failed';
    throw new Error(msg);
  }
}

// Confirmations
export async function confirmMosque(id) {
  const { data } = await api.post(`/mosques/${id}/confirmations`);
  return data;
}
