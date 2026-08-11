import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, UserProfile } from '../types';
import { INITIAL_TENANT, INITIAL_USER } from '../lib/demoData';

interface AuthContextType {
  tenant: Tenant;
  user: UserProfile;
  setTenant: React.Dispatch<React.SetStateAction<Tenant>>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  switchPlan: (plan: 'Free' | 'Pro' | 'Enterprise') => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  login: (email: string, password?: string) => Promise<any>;
  register: (email: string, password?: string, name?: string, companyName?: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (email: string, newPassword: string, resetToken?: string) => Promise<any>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant>(INITIAL_TENANT);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore user session on mount if token exists
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Invalid token');
        })
        .then(data => {
          if (data.success && data.user) {
            setUser({
              id: data.user.id,
              displayName: data.user.name || data.user.email.split('@')[0],
              email: data.user.email,
              role: data.user.role || 'Admin',
              tenantId: data.user.tenantId,
            });
            if (data.tenant) {
              setTenant(prev => ({
                ...prev,
                id: data.tenant.id,
                name: data.tenant.name,
                ownerEmail: data.tenant.ownerEmail,
                plan: data.tenant.plan || prev.plan,
              }));
            }
            setToken(savedToken);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('auth_token');
            setToken(null);
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          setToken(null);
          setIsAuthenticated(false);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const switchPlan = (plan: 'Free' | 'Pro' | 'Enterprise') => {
    setTenant(prev => ({ ...prev, plan }));
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setIsAuthenticated(false);
  };

  const login = async (email: string, password?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: password || 'password' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Authentication failed');
    }
    localStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser({
      id: data.user.id,
      displayName: data.user.name || data.user.email.split('@')[0],
      email: data.user.email,
      role: data.user.role || 'Admin',
      tenantId: data.user.tenantId,
    });
    if (data.tenant) {
      setTenant(prev => ({
        ...prev,
        id: data.tenant.id,
        name: data.tenant.name,
        ownerEmail: data.tenant.ownerEmail,
        plan: data.tenant.plan || prev.plan,
      }));
    }
    setIsAuthenticated(true);
    return data;
  };

  const register = async (email: string, password?: string, name?: string, companyName?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: password || 'password', name, companyName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Registration failed');
    }
    localStorage.setItem('auth_token', data.token);
    setToken(data.token);
    setUser({
      id: data.user.id,
      displayName: data.user.name || data.user.email.split('@')[0],
      email: data.user.email,
      role: data.user.role || 'Admin',
      tenantId: data.user.tenantId,
    });
    if (data.tenant) {
      setTenant(prev => ({
        ...prev,
        id: data.tenant.id,
        name: data.tenant.name,
        ownerEmail: data.tenant.ownerEmail,
        plan: data.tenant.plan || prev.plan,
      }));
    }
    setIsAuthenticated(true);
    return data;
  };

  const requestPasswordReset = async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to request password reset');
    }
    return data;
  };

  const resetPassword = async (email: string, newPassword: string, resetToken?: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, newPassword, resetToken }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to reset password');
    }
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        tenant,
        user,
        setTenant,
        setUser,
        switchPlan,
        isAuthenticated,
        isLoading,
        logout,
        login,
        register,
        requestPasswordReset,
        resetPassword,
        token,
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

