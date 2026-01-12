import Constants from 'expo-constants';

const extra = (Constants?.expoConfig?.extra) || {};
export const BACKEND_BASE_URL = extra.backendBaseUrl || 'http://127.0.0.1:5000';
