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
  // Backend provides /auth/firebase/verify accepting id_token
  const role = credentials?.role || 'authenticated';
  const payload = { id_token: role };
  const { data } = await api.post('/auth/firebase/verify', payload);
  const jwt = data?.access_token;
  if (jwt) await AsyncStorage.setItem('jwt', jwt);
  return jwt;
}

// Removed local demo token fallback to ensure real JWT from backend

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

export async function getPendingSuggestions() {
  const { data } = await api.get('/suggestions/mosques/pending');
  return data;
}

export async function getMosqueSuggestion(id) {
  const { data } = await api.get(`/suggestions/mosques/${id}`);
  return data;
}

export async function mySuggestions() {
  const { data } = await api.get('/suggestions/mosques');
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
    const details = e?.response?.data;
    let msg = details?.message || details?.error || e?.message || 'Request failed';
    if (details && typeof details === 'object') {
      const errs = details.errors || details.field_errors || details.validation_errors;
      if (errs && typeof errs === 'object') {
        const parts = Object.entries(errs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
        if (parts.length) msg = `${msg} — ${parts.join(' | ')}`;
      }
    }
    throw new Error(msg);
  }
}

export async function uploadImage(uri) {
  const formData = new FormData();
  const filename = uri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : `image/jpeg`;

  formData.append('file', { uri, name: filename, type });

  const { data } = await api.post('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}

// Edit Suggestions
export async function suggestMosqueEdit(mosqueId, patch) {
  const { data } = await api.post('/edits', {
    mosque_id: mosqueId,
    patch: patch
  });
  return data;
}

// Confirmations
export async function confirmMosque(id) {
  // This endpoint might not exist if confirmations are only for suggestions
  // But let's keep it if legacy.
  const { data } = await api.post(`/mosques/${id}/confirmations`);
  return data;
}

export async function confirmSuggestion(id) {
  const { data } = await api.post(`/suggestions/${id}/confirmations`);
  return data;
}
