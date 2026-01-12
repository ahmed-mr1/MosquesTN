import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getMosques } from '../services/api';

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
      const PAGE_LIMIT = 100; // server caps at 100
      let offset = 0;
      const all = [];
      while (true) {
        const chunk = await getMosques({ limit: PAGE_LIMIT, offset, ...filters });
        if (Array.isArray(chunk) && chunk.length) {
          all.push(...chunk);
          // stream updates so Map/List show gradually
          setMosques([...all]);
        }
        if (!Array.isArray(chunk) || chunk.length < PAGE_LIMIT) break;
        offset += PAGE_LIMIT;
        if (offset > 5000) break; // safety guard
      }
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
