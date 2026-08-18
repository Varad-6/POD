/**
 * Auth Context V3 — wraps real JWT API auth under /api/v3
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, setToken, clearToken, UserV3 } from '../lib/api_v3';

interface AuthContextV3Value {
  user: UserV3 | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContextV3 = createContext<AuthContextV3Value | null>(null);

export function AuthProviderV3({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserV3 | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('podzo_token_v3');
    if (token) {
      authApi.me()
        .then(u => {
          setUser(u);
          localStorage.setItem('podzo_user_v3', JSON.stringify(u));
        })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    setToken(data.token);
    localStorage.setItem('podzo_user_v3', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    clearToken();
    setUser(null);
  };

  return (
    <AuthContextV3.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContextV3.Provider>
  );
}

export function useAuthV3(): AuthContextV3Value {
  const ctx = useContext(AuthContextV3);
  if (!ctx) throw new Error('useAuthV3 must be used inside AuthProviderV3');
  return ctx;
}
