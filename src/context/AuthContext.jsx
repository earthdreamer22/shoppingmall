import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/apiClient.js';

const AuthContext = createContext({
  user: null,
  loading: true,
  cartCount: 0,
  setCartCount: () => {},
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await apiRequest('/auth/me');
      setUser(data.user);
      setCartCount(0);
    } catch (_error) {
      setUser(null);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = useCallback(async ({ email, password }) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    setCartCount(0);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await apiRequest('/auth/logout', { method: 'POST' });
    setUser(null);
    setCartCount(0);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      cartCount,
      setCartCount,
      login,
      logout,
      refresh: fetchCurrentUser,
    }),
    [user, loading, cartCount, login, logout, fetchCurrentUser, setCartCount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
