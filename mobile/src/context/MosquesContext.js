import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getMosques, getPublicSuggestions } from '../services/api';

const MosquesContext = createContext(null);

export function MosquesProvider({ children }) {
  const [mosques, setMosques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMosques = useCallback(async (filters = {}) => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Approved Mosques (paginated)
      const PAGE_LIMIT = 100;
      let offset = 0;
      const approvedList = [];
      // Safety limit: only fetch up to 500 mosques to not kill backend/client
      while (true) {
        // Only fetching approved ones
        const chunk = await getMosques({ limit: PAGE_LIMIT, offset, ...filters });
        if (Array.isArray(chunk) && chunk.length) {
          approvedList.push(...chunk);
        }
        // If we got less than limit, we are done
        if (!Array.isArray(chunk) || chunk.length < PAGE_LIMIT) break;
        offset += PAGE_LIMIT;
        if (offset > 1000) break; 
      }

      // 2. Fetch Pending/Suggested Mosques
      let pendingList = [];
      try {
        const p = await getPublicSuggestions();
        if (Array.isArray(p)) {
          pendingList = p.map(x => ({ ...x, approved: false, isSuggestion: true }));
        }
      } catch (err) {
        console.log('Failed to fetch pending suggestions', err);
      }

      // 3. Merge
      setMosques([...approvedList, ...pendingList]);
      
      setLastUpdated(new Date());
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMosques();
  }, [fetchMosques]);

  const value = useMemo(() => ({ mosques, loading, error, lastUpdated, refresh: fetchMosques }), [mosques, loading, error, lastUpdated, fetchMosques]);
  return <MosquesContext.Provider value={value}>{children}</MosquesContext.Provider>;
}

export function useMosques() {
  return useContext(MosquesContext);
}
