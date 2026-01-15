import Constants from 'expo-constants';
import axios from 'axios';

export const governorates = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte','Béja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia','Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Medenine','Tataouine','Gafsa','Tozeur','Kebili'
];

function cfg() {
  const extra = (Constants?.expoConfig?.extra) || {};
  return {
    base: extra.locationsApiBase || '',
    geonamesUser: extra.geonamesUsername || 'demo',
    debug: !!extra.locationsDebug,
  };
}

const TTL_MS = 24 * 60 * 60 * 1000;
const cacheDelegations = new Map();
const cacheCities = new Map();
const cacheGovIds = new Map(); // Cache governorate IDs for faster lookups

function getCache(map, key) {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) { map.delete(key); return null; }
  return entry.data;
}
function setCache(map, key, data) { map.set(key, { ts: Date.now(), data }); }

/**
 * Get Governorate ID (ADM1) from GeoNames
 */
async function getGovernorateId(governorate, geonamesUser) {
  const key = String(governorate || '').toLowerCase();
  
  // Check cache (no TTL needed for IDs)
  if (cacheGovIds.has(key)) return cacheGovIds.get(key);
  
  try {
    const { data } = await axios.get('https://secure.geonames.org/searchJSON', {
      params: { 
        name_equals: governorate, 
        country: 'TN', 
        featureCode: 'ADM1', 
        maxRows: 1, 
        username: geonamesUser 
      },
    });
    const id = data?.geonames?.[0]?.geonameId || null;
    if (id) cacheGovIds.set(key, id);
    return id;
  } catch (e) {
    return null;
  }
}

/**
 * FETCH DELEGATIONS (ADM2)
 */
export async function fetchDelegations(governorate) {
  const k = String(governorate || '').toLowerCase();
  const cached = getCache(cacheDelegations, k);
  if (cached) return cached;

  const { base, geonamesUser, debug } = cfg();

  // 1. Try Base API first
  if (base) {
    try {
      const { data } = await axios.get(`${base}/governorates/${encodeURIComponent(governorate)}/delegations`);
      const out = Array.isArray(data) ? data : (data?.items || []);
      if (out.length) { setCache(cacheDelegations, k, out); return out; }
    } catch (e) { if (debug) console.warn('[locations] Base API Delegations failed'); }
  }

  // 2. Fallback: GeoNames strict hierarchy by ID
  try {
    // Get the Governorate ID (ADM1)
    const govId = await getGovernorateId(governorate, geonamesUser);
    if (!govId) return [];

    // Get children of ADM1 (These are ADM2 / Delegations)
    const { data } = await axios.get('https://secure.geonames.org/childrenJSON', { 
      params: { geonameId: govId, username: geonamesUser } 
    });

    const list = (data?.geonames || [])
      .filter(x => x.fcode === 'ADM2') // Strictly ADM2 only
      .map(x => x.name)
      .filter(Boolean);

    if (list.length) setCache(cacheDelegations, k, list);
    return list;
  } catch (e) {
    if (cfg().debug) console.error('[locations] GeoNames delegations error:', e?.message);
    return [];
  }
}

/**
 * FETCH CITIES/LOCALITIES (ADM3 Sectors or Populated Places under ADM2)
 */
export async function fetchCities(governorate, delegation) {
  const key = `${String(governorate||'').toLowerCase()}|${String(delegation||'').toLowerCase()}`;
  const cached = getCache(cacheCities, key);
  if (cached) return cached;

  const { base, geonamesUser, debug } = cfg();

  if (base) {
    try {
      const { data } = await axios.get(`${base}/governorates/${encodeURIComponent(governorate)}/delegations/${encodeURIComponent(delegation)}/cities`);
      const out = Array.isArray(data) ? data : (data?.items || []);
      if (out.length) { setCache(cacheCities, key, out); return out; }
    } catch (e) { if (debug) console.warn('[locations] Base API cities failed'); }
  }

  try {
    // 1. Find the ADM2 ID (Delegation) within the Governorate context
    const { data: delSearch } = await axios.get('https://secure.geonames.org/searchJSON', {
      params: { 
        name_equals: delegation, 
        adminName1: governorate, 
        country: 'TN', 
        featureCode: 'ADM2', 
        maxRows: 1, 
        username: geonamesUser 
      },
    });

    const adm2Id = delSearch?.geonames?.[0]?.geonameId;
    if (!adm2Id) return [];

    // 2. Get children of ADM2
    const { data: children } = await axios.get('https://secure.geonames.org/childrenJSON', { 
      params: { geonameId: adm2Id, username: geonamesUser } 
    });

    const allChildren = children?.geonames || [];

    // Priority 1: ADM3 (Sectors/Imada) - Most accurate for Tunisia
    let places = allChildren
      .filter(x => x.fcode === 'ADM3')
      .map(x => x.name)
      .filter(Boolean);

    // Priority 2: PPL (Populated Places) - Use if no sectors found
    if (places.length === 0) {
      places = allChildren
        .filter(x => x.fclass === 'P' || x.fcode.startsWith('PPL'))
        .map(x => x.name)
        .filter(Boolean);
    }

    // 3. Deduplicate and clean
    const uniquePlaces = [...new Set(places)];

    if (uniquePlaces.length) setCache(cacheCities, key, uniquePlaces);
    return uniquePlaces;

  } catch (e) {
    if (cfg().debug) console.error('[locations] GeoNames cities error:', e?.message);
    return [];
  }
}