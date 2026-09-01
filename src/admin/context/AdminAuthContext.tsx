import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  adminToken: string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getStoredToken = () => {
    return (
      localStorage.getItem('nomads_admin_token') ||
      localStorage.getItem('nomadschat_admin_token') ||
      localStorage.getItem('token') ||
      ''
    );
  };

  const fetchCurrentAdmin = async () => {
    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      let res = await fetch('/api/admin/auth/me', {
        credentials: 'include',
        headers,
      });

      if (res.status === 401 || res.status === 403) {
        const refreshRes = await fetch('/api/admin/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers,
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.token) {
            localStorage.setItem('nomads_admin_token', refreshData.token);
            headers['Authorization'] = `Bearer ${refreshData.token}`;
          }
          res = await fetch('/api/admin/auth/me', {
            credentials: 'include',
            headers,
          });
        }
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.admin) {
          setAdmin(data.admin);
          return true;
        }
      }
      setAdmin(null);
      return false;
    } catch (err) {
      console.error('Error verifying admin session:', err);
      setAdmin(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentAdmin();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Authentication server returned invalid response');
      }

      const data = await res.json();
      if (data.success && data.admin) {
        if (data.token) {
          localStorage.setItem('nomads_admin_token', data.token);
        }
        setAdmin(data.admin);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Authentication failed' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error connecting to admin service' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const storedToken = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers,
      });
    } catch {
      // Ignore logout request failure
    }
    localStorage.removeItem('nomads_admin_token');
    localStorage.removeItem('nomadschat_admin_token');
    setAdmin(null);
  };

  const refreshAdmin = async () => {
    await fetchCurrentAdmin();
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: Boolean(admin),
        adminToken: getStoredToken() || 'cookie_session',
        login,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
