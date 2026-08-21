export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'security_admin' | 'ops_admin';
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetResource?: string;
  targetId?: string;
  ipAddress?: string;
  userAgent?: string;
  detailsJson?: string;
  status: 'success' | 'failed' | 'denied';
  createdAt: string;
}

export interface AdminAuthResponse {
  success: boolean;
  token?: string;
  admin?: AdminUser;
  error?: string;
}
