import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/apiClient.js';
import { getGuestCartCount, GUEST_CART_EVENT } from '../lib/guestCart.js';

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
      setCartCount(getGuestCartCount());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // 비회원 장바구니 변경 시 배지 수량 동기화
  useEffect(() => {
    const handler = () => setCartCount(getGuestCartCount());
    window.addEventListener(GUEST_CART_EVENT, handler);
    return () => window.removeEventListener(GUEST_CART_EVENT, handler);
  }, []);

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
