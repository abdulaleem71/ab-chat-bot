import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Tenant, UserProfile, TenantPlan } from '../types';
import { EMPTY_TENANT, EMPTY_USER } from '../lib/demoData';

interface AuthContextType {
  tenant: Tenant;
  user: UserProfile;
  setTenant: React.Dispatch<React.SetStateAction<Tenant>>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  switchPlan: (plan: TenantPlan) => Promise<void> | void;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  login: (email: string, password?: string) => Promise<any>;
  startDemoSession: () => Promise<any>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<any>;
  register: (email: string, password?: string, name?: string, companyName?: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (email: string, newPassword: string, resetToken?: string) => Promise<any>;
  refreshTenant: () => Promise<void>;
  verifySession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant>(EMPTY_TENANT);
  const [user, setUser] = useState<UserProfile>(EMPTY_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getStoredToken = () => {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
  };

  const applySessionPayload = (data: any) => {
    setUser({
      uid: data.user.id || data.user.uid,
      id: data.user.id || data.user.uid,
      displayName: data.user.name || data.user.displayName || data.user.email.split('@')[0],
      email: data.user.email,
      role: data.user.role || 'Owner',
      tenantId: data.user.tenantId,
      emailVerified: data.user.emailVerified ?? true,
      mfaEnabled: data.user.mfaEnabled ?? false,
      avatarUrl: data.user.avatarUrl || '',
      createdAt: data.user.createdAt || '',
    });
    if (data.tenant) {
      setTenant({
        id: data.tenant.id,
        name: data.tenant.name,
        ownerEmail: data.tenant.ownerEmail,
        plan: data.tenant.plan || 'Pro',
        createdAt: data.tenant.createdAt || '',
        subscriptionStatus: data.tenant.subscriptionStatus || 'trialing',
        trialStartedAt: data.tenant.trialStartedAt || null,
        trialEndsAt: data.tenant.trialEndsAt || null,
        hasPaymentMethod: Boolean(data.tenant.hasPaymentMethod),
        paymentMethodBrand: data.tenant.paymentMethodBrand || null,
        paymentMethodLast4: data.tenant.paymentMethodLast4 || null,
        paymentMethodExp: data.tenant.paymentMethodExp || null,
        websiteUrl: data.tenant.websiteUrl || '',
        logoUrl: data.tenant.logoUrl || '',
        byokConfig: data.tenant.byokConfig,
      });
    }
    setIsAuthenticated(true);
  };

  const verifySession = useCallback(async () => {
    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const res = await fetch('/api/auth/me', { credentials: 'include', headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          applySessionPayload(data);
          return;
        }
      }

      if (res.status === 401 && typeof localStorage !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
      }

      setIsAuthenticated(false);
      setTenant(EMPTY_TENANT);
      setUser(EMPTY_USER);
    } catch {
      setIsAuthenticated(false);
      setTenant(EMPTY_TENANT);
      setUser(EMPTY_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const refreshTenant = async () => {
    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      const res = await fetch('/api/auth/me', { credentials: 'include', headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          applySessionPayload(data);
        }
      }
    } catch {
      // Ignore transient refresh failures
    }
  };

  const switchPlan = async (plan: TenantPlan) => {
    setTenant(prev => ({ ...prev, plan }));
    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      await fetch('/api/tenant/plan', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ plan }),
      });
    } catch (err) {
      console.warn('Failed to sync plan switch to backend:', err);
    }
  };

  const logout = async () => {
    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers,
      });
    } catch {
      // Ignore network errors on sign out
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('nomads_admin_token');
      localStorage.removeItem('nomadschat_admin_token');
    }

    setIsAuthenticated(false);
    setTenant(EMPTY_TENANT);
    setUser(EMPTY_USER);
  };

  const loginWithOAuth = async (provider: 'google' | 'github'): Promise<any> => {
    const callbackPath = `/api/auth/${provider}/callback`;
    const redirectUri = `${window.location.origin}${callbackPath}`;

    let urlData: any;
    try {
      const res = await fetch(`/api/auth/${provider}/url?redirect_uri=${encodeURIComponent(redirectUri)}`);
      urlData = await res.json();
      if (!res.ok || !urlData.success || !urlData.url) {
        throw new Error(
          urlData.error ||
          `${provider === 'google' ? 'Google' : 'GitHub'} OAuth is not configured on this server.`
        );
      }
    } catch (fetchErr: any) {
      throw new Error(fetchErr.message || `Failed to initiate ${provider} login.`);
    }

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      urlData.url,
      `oauth_${provider}_window`,
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      throw new Error('Popup window was blocked by your browser.');
    }

    return new Promise((resolve, reject) => {
      let isCompleted = false;

      const messageListener = (event: MessageEvent) => {
        if (!event.data || typeof event.data !== 'object') return;

        if (event.data.type === 'OAUTH_AUTH_SUCCESS') {
          isCompleted = true;
          cleanup();
          if (event.data.token && typeof localStorage !== 'undefined') {
            localStorage.setItem('auth_token', event.data.token);
            localStorage.setItem('token', event.data.token);
          }
          verifySession().then(() => {
            resolve(event.data);
          });
        } else if (event.data.type === 'OAUTH_AUTH_ERROR') {
          isCompleted = true;
          cleanup();
          reject(new Error(event.data.error || `${provider} authentication failed`));
        }
      };

      window.addEventListener('message', messageListener);

      const checkPopupInterval = setInterval(() => {
        if (popup.closed) {
          setTimeout(() => {
            if (!isCompleted) {
              isCompleted = true;
              cleanup();
              reject(new Error('Sign-in window was closed before authorization was completed.'));
            }
          }, 600);
        }
      }, 500);

      const cleanup = () => {
        window.removeEventListener('message', messageListener);
        clearInterval(checkPopupInterval);
      };
    });
  };

  const login = async (email: string, password?: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password: password || '' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Authentication failed');
    }
    if (data.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('token', data.token);
    }
    if (!data.requireMfa) {
      await verifySession();
    }
    return data;
  };

  const startDemoSession = async () => {
    const res = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to launch live demo workspace');
    }
    if (data.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('token', data.token);
    }
    await verifySession();
    return data;
  };

  const register = async (email: string, password?: string, name?: string, companyName?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password: password || '', name, companyName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Registration failed');
    }
    if (data.token && typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('token', data.token);
    }
    await verifySession();
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

  const isDemoMode = Boolean(
    isAuthenticated && (user.email === 'alex@acmesaas.io' || tenant.id === 'tenant_acme' || tenant.id === 'tnt_demo_01')
  );

  return (
    <AuthContext.Provider
      value={{
        tenant,
        user,
        setTenant,
        setUser,
        switchPlan,
        isAuthenticated,
        isDemoMode,
        isLoading,
        logout,
        login,
        startDemoSession,
        loginWithOAuth,
        register,
        requestPasswordReset,
        resetPassword,
        refreshTenant,
        verifySession,
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
