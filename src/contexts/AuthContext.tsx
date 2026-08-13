/**
 * Auth Context — wraps real JWT API auth
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, setToken, clearToken, User } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ikwezi_token');
    if (token) {
      authApi.me()
        .then(u => setUser(u))
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    setToken(data.token);
    localStorage.setItem('ikwezi_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
