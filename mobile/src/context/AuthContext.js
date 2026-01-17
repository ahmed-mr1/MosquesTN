import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [jwt, setJwt] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedJwt = await AsyncStorage.getItem('jwt');
      const storedRole = await AsyncStorage.getItem('role');
      setJwt(storedJwt);
      setRole(storedRole);
      setLoading(false);
    })();
  }, []);

  const login = async (credentials) => {
    try {
        const { jwt: newJwt, role: newRole } = await apiLogin(credentials);
        setJwt(newJwt);
        setRole(newRole);
        return newJwt;
    } catch (e) {
        console.error("Login failed", e);
        throw e;
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('jwt');
    await AsyncStorage.removeItem('role');
    setJwt(null);
    setRole(null);
  };

  const value = useMemo(() => ({ jwt, role, loading, login, signOut }), [jwt, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
