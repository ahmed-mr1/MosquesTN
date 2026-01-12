import Constants from 'expo-constants';
import axios from 'axios';

export const governorates = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Medenine','Tataouine','Gafsa','Tozeur','Kebili'
];

function base() {
  const extra = (Constants?.expoConfig?.extra) || {};
  return extra.locationsApiBase || '';
}

export async function fetchDelegations(governorate) {
  const b = base();
  if (!b) return [];
  try {
    const { data } = await axios.get(`${b}/governorates/${encodeURIComponent(governorate)}/delegations`);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}

export async function fetchCities(governorate, delegation) {
  const b = base();
  if (!b) return [];
  try {
    const { data } = await axios.get(`${b}/governorates/${encodeURIComponent(governorate)}/delegations/${encodeURIComponent(delegation)}/cities`);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    return [];
  } catch {
    return [];
  }
}
