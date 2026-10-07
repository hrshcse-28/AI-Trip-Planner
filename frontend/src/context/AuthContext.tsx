import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setAccessToken } from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await api.auth.me();
      if (data.user) {
        setUser(data.user);
      }
    } catch {
      // not logged in
    }
  };

  // Try to restore session on mount (via refresh token cookie)
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const data = await api.auth.refresh();
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        // Not logged in — that's fine
      } finally {
        setIsLoading(false);
      }
    };
    tryRefresh();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.auth.register({ name, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
