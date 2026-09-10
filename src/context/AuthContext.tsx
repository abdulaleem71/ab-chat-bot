import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, UserProfile, TenantPlan } from '../types';
import { INITIAL_TENANT, INITIAL_USER } from '../lib/demoData';

interface AuthContextType {
  tenant: Tenant;
  user: UserProfile;
  setTenant: React.Dispatch<React.SetStateAction<Tenant>>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  switchPlan: (plan: TenantPlan) => Promise<void> | void;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  login: (email: string, password?: string) => Promise<any>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<any>;
  register: (email: string, password?: string, name?: string, companyName?: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (email: string, newPassword: string, resetToken?: string) => Promise<any>;
  refreshTenant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant>(INITIAL_TENANT);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getStoredToken = () => {
    return localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
  };

  const verifySession = async () => {
    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      let res = await fetch('/api/auth/me', { credentials: 'include', headers });
      if (res.status === 401) {
        // Clean up stale local tokens if server rejected session
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');

        // If this visitor has no active session and did not explicitly sign out in this session,
        // automatically authenticate with the seeded demo account for an instant, fully-functional preview.
        const hasManuallySignedOut = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('nomads_manual_signout');
        if (!storedToken && !hasManuallySignedOut) {
          try {
            const demoRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'alex@acmesaas.io', password: 'password' }),
            });
            if (demoRes.ok) {
              const demoData = await demoRes.json();
              if (demoData.success && demoData.token) {
                localStorage.setItem('auth_token', demoData.token);
                // Immediately verify session with the freshly acquired token
                const demoHeaders = {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${demoData.token}`,
                };
                const recheck = await fetch('/api/auth/me', { credentials: 'include', headers: demoHeaders });
                if (recheck.ok) {
                  const recheckData = await recheck.json();
                  if (recheckData.success && recheckData.user) {
                    setUser({
                      uid: recheckData.user.id || recheckData.user.uid,
                      id: recheckData.user.id || recheckData.user.uid,
                      displayName: recheckData.user.name || recheckData.user.email.split('@')[0],
                      email: recheckData.user.email,
                      role: recheckData.user.role || 'Admin',
                      tenantId: recheckData.user.tenantId,
                      emailVerified: recheckData.user.emailVerified ?? true,
                      mfaEnabled: recheckData.user.mfaEnabled ?? false,
                      avatarUrl: recheckData.user.avatarUrl,
                    });
                    if (recheckData.tenant) {
                      setTenant(prev => ({
                        ...prev,
                        id: recheckData.tenant.id,
                        name: recheckData.tenant.name,
                        ownerEmail: recheckData.tenant.ownerEmail,
                        plan: recheckData.tenant.plan || prev.plan,
                        byokConfig: recheckData.tenant.byokConfig,
                      }));
                    }
                    setIsAuthenticated(true);
                    return;
                  }
                }
              }
            }
          } catch (autoErr) {
            console.warn('[NomadsChat Auth] Auto demo sign-in fallback bypassed:', autoErr);
          }
        }

        setIsAuthenticated(false);
        setUser({
          uid: '',
          id: '',
          displayName: '',
          email: '',
          role: 'member',
          tenantId: '',
          createdAt: '',
        } as any);
      } else if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser({
            uid: data.user.id || data.user.uid,
            id: data.user.id || data.user.uid,
            displayName: data.user.name || data.user.email.split('@')[0],
            email: data.user.email,
            role: data.user.role || 'Admin',
            tenantId: data.user.tenantId,
            emailVerified: data.user.emailVerified ?? true,
            mfaEnabled: data.user.mfaEnabled ?? false,
            avatarUrl: data.user.avatarUrl,
          });
          if (data.tenant) {
            setTenant(prev => ({
              ...prev,
              id: data.tenant.id,
              name: data.tenant.name,
              ownerEmail: data.tenant.ownerEmail,
              plan: data.tenant.plan || prev.plan,
              byokConfig: data.tenant.byokConfig,
            }));
          }
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, []);

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
        if (data.success && data.tenant) {
          setTenant(prev => ({
            ...prev,
            id: data.tenant.id,
            name: data.tenant.name,
            ownerEmail: data.tenant.ownerEmail,
            plan: data.tenant.plan || prev.plan,
            byokConfig: data.tenant.byokConfig,
          }));
        }
      }
    } catch {
      // ignore
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
      // ignore
    }

    // Completely purge local and session storage auth tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('nomads_admin_token');
    localStorage.removeItem('nomadschat_admin_token');
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('nomads_manual_signout', 'true');
    }

    setIsAuthenticated(false);
    setTenant({
      id: '',
      name: '',
      ownerEmail: '',
      plan: 'Free',
      createdAt: '',
      websiteUrl: '',
    });
    setUser({
      uid: '',
      id: '',
      email: '',
      displayName: '',
      tenantId: '',
      role: 'member',
      createdAt: '',
    } as any);
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
          `${provider === 'google' ? 'Google' : 'GitHub'} OAuth is not configured.`
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
      throw new Error(`Popup window was blocked by your browser.`);
    }

    return new Promise((resolve, reject) => {
      let isCompleted = false;

      const messageListener = (event: MessageEvent) => {
        if (!event.data || typeof event.data !== 'object') return;

        if (event.data.type === 'OAUTH_AUTH_SUCCESS') {
          isCompleted = true;
          cleanup();
          if (event.data.token) {
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
      body: JSON.stringify({ email, password: password || 'password' }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Authentication failed');
    }
    if (data.token) {
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
      body: JSON.stringify({ email, password: password || 'password', name, companyName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Registration failed');
    }
    if (data.token) {
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
        loginWithOAuth,
        register,
        requestPasswordReset,
        resetPassword,
        refreshTenant,
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
