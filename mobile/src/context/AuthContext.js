import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [jwt, setJwt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedJwt = await AsyncStorage.getItem('jwt');
      setJwt(storedJwt);
      setLoading(false);
    })();
  }, []);

  const login = async (credentials) => {
    const newJwt = await apiLogin(credentials);
    setJwt(newJwt);
    return newJwt;
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('jwt');
    setJwt(null);
  };

  const value = useMemo(() => ({ jwt, loading, login, signOut }), [jwt, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
