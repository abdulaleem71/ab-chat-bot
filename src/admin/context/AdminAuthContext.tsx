import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';

interface AdminAuthContextType {
  admin: AdminUser | null;
  adminToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('nomads_admin_token') || localStorage.getItem('nomadschat_admin_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentAdmin = async (tokenToUse: string) => {
    try {
      const res = await fetch('/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.admin) {
            setAdmin(data.admin);
            return true;
          }
        }
      }
      // If verification fails, clear token
      localStorage.removeItem('nomads_admin_token');
      localStorage.removeItem('nomadschat_admin_token');
      setAdminToken(null);
      setAdmin(null);
      return false;
    } catch (err) {
      console.error('Error verifying admin token:', err);
      localStorage.removeItem('nomads_admin_token');
      localStorage.removeItem('nomadschat_admin_token');
      setAdminToken(null);
      setAdmin(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchCurrentAdmin(adminToken);
    } else {
      setIsLoading(false);
    }
  }, [adminToken]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
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
      if (data.success && data.token && data.admin) {
        localStorage.setItem('nomads_admin_token', data.token);
        localStorage.setItem('nomadschat_admin_token', data.token);
        setAdminToken(data.token);
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
    if (adminToken) {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch {
        // Ignore logout request failure
      }
    }
    localStorage.removeItem('nomads_admin_token');
    localStorage.removeItem('nomadschat_admin_token');
    setAdminToken(null);
    setAdmin(null);
  };

  const refreshAdmin = async () => {
    if (adminToken) {
      await fetchCurrentAdmin(adminToken);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        adminToken,
        isLoading,
        isAuthenticated: !!admin && !!adminToken,
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
