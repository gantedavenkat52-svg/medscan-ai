import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Profile } from '../types.js';
import { api, setAuthToken, removeAuthToken, getAuthToken } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemo: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!getAuthToken()) {
        setIsLoading(false);
        return;
      }
      const data = await api.getCurrentUser();
      setUser(data.user);
      setProfile(data.profile);
    } catch (err) {
      console.warn('Authentication token expired or invalid:', err);
      removeAuthToken();
      setToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    await fetchCurrentUser();
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await api.register({ name, email, password: pass });
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    await fetchCurrentUser();
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
    await fetchCurrentUser();
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const p = await api.getProfile();
      setProfile(p);
    } catch (e) {
      console.error('Failed to refresh profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isAuthenticated: !!user,
        isLoading,
        isDemo: !!user?.isDemo,
        login,
        register,
        demoLogin,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
