import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, getStoredUser, setStoredAuth, clearStoredAuth } from '../services/api';
import { clearStoredGmailToken } from '../services/gmailClient';

const EXPLICIT_LOGOUT_KEY = 'jobtracker_explicit_logout';
const DEMO_SESSION_ACTIVE_KEY = 'jobtracker_demo_session_active';

export const isDemoUser = (u: any): boolean => {
  if (!u) return false;
  return (
    u.id === 'demo-student-id-101' ||
    u.email === 'shaurya@campus.edu' ||
    u.name === 'Shaurya Vardhan'
  );
};

export const isDemoToken = (token: string | null): boolean => {
  if (!token) return false;
  return token === 'demo-token' || token.includes('demo-student-id-101');
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; college?: string; graduationYear?: string; branch?: string }) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    if (localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true') {
      return null;
    }
    const stored = getStoredUser();
    if (!stored) return null;
    // Do not show demo profile on initial link opening unless explicitly activated in this session
    if (isDemoUser(stored)) {
      const isDemoActive = sessionStorage.getItem(DEMO_SESSION_ACTIVE_KEY) === 'true';
      return isDemoActive ? stored : null;
    }
    return stored;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const isExplicitlyLoggedOut = localStorage.getItem(EXPLICIT_LOGOUT_KEY) === 'true';
      const token = getStoredToken();
      const stored = getStoredUser();

      if (isExplicitlyLoggedOut) {
        clearStoredAuth();
        sessionStorage.removeItem(DEMO_SESSION_ACTIVE_KEY);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // If stored user or token belongs to demo account (Shaurya Vardhan):
      // Do NOT auto-login unless user clicked "Load sample data / demo account" in this browser session
      if ((stored && isDemoUser(stored)) || isDemoToken(token)) {
        const isDemoActive = sessionStorage.getItem(DEMO_SESSION_ACTIVE_KEY) === 'true';
        if (!isDemoActive) {
          clearStoredAuth();
          setUser(null);
          setIsLoading(false);
          return;
        }
      }

      // Real user token verification
      if (token) {
        try {
          const res = await api.getMe();
          if (isDemoUser(res.user) && sessionStorage.getItem(DEMO_SESSION_ACTIVE_KEY) !== 'true') {
            clearStoredAuth();
            setUser(null);
          } else {
            setUser(res.user);
          }
        } catch {
          clearStoredAuth();
          setUser(null);
        }
      } else {
        // Fresh visit without login: start signed out
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      sessionStorage.removeItem(DEMO_SESSION_ACTIVE_KEY);
      localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      const res = await api.login({ email, password });
      setStoredAuth(res.token, res.user);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; college?: string; graduationYear?: string; branch?: string }) => {
    setIsLoading(true);
    try {
      sessionStorage.removeItem(DEMO_SESSION_ACTIVE_KEY);
      localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      const res = await api.register(data);
      setStoredAuth(res.token, res.user);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async () => {
    setIsLoading(true);
    try {
      sessionStorage.setItem(DEMO_SESSION_ACTIVE_KEY, 'true');
      localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
      const res = await api.demoLogin();
      setStoredAuth(res.token, res.user);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<User>): Promise<User> => {
    const res = await api.updateProfile(profileData);
    setUser(res.user);
    const token = getStoredToken();
    if (token) {
      setStoredAuth(token, res.user);
    }
    return res.user;
  };

  const logout = () => {
    sessionStorage.removeItem(DEMO_SESSION_ACTIVE_KEY);
    localStorage.setItem(EXPLICIT_LOGOUT_KEY, 'true');
    clearStoredAuth();
    clearStoredGmailToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginAsDemo,
        updateProfile,
        logout,
        refreshUser,
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
