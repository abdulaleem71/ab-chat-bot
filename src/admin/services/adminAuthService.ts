import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserRepo } from '../../repositories/userRepo';
import { AdminAuditRepo } from '../repositories/adminAuditRepo';
import { AdminUser } from '../types';
import { getJwtSecret } from '../../config/secrets';

const DEFAULT_ADMIN_EMAILS = [
  'hfzali39@gmail.com',
  'admin@nomadschat.com',
  'security@nomadschat.com',
];

export class AdminAuthService {
  static getAuthorizedAdminEmails(): string[] {
    const raw = process.env.ADMIN_EMAILS;
    if (raw && raw.trim().length > 0) {
      const parsed = raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
      if (parsed.length > 0) return parsed;
    }
    return DEFAULT_ADMIN_EMAILS.map(e => e.toLowerCase());
  }

  static isAuthorizedAdminEmail(email?: string | null): boolean {
    if (!email || typeof email !== 'string') return false;
    const clean = email.trim().toLowerCase();
    const authorized = this.getAuthorizedAdminEmails();
    return authorized.includes(clean);
  }

  /**
   * Provisions initial authorized admin accounts if missing, using ADMIN_INITIAL_PASSWORD
   * (or generating a secure random one-time password logged strictly at initial creation if unset).
   */
  static async ensureAdminAccountsExist(): Promise<void> {
    try {
      const admins = this.getAuthorizedAdminEmails();
      const configuredPass = process.env.ADMIN_INITIAL_PASSWORD?.trim() || process.env.ADMIN_DEFAULT_PASSWORD?.trim();

      for (const email of admins) {
        const existing = await UserRepo.findUserByEmail(email);
        if (!existing) {
          const initialPassword = configuredPass || crypto.randomBytes(18).toString('base64url');
          const passwordHash = await bcrypt.hash(initialPassword, 12);
          const userId = 'usr_admin_' + email.replace(/[^a-zA-Z0-9]/g, '_');
          const tenantId = 'tenant_admin_ops';

          const existingTenant = await UserRepo.findTenantById(tenantId);
          if (!existingTenant) {
            await UserRepo.createTenant({
              id: tenantId,
              name: 'NomadsChat Global Administration',
              owner_email: email,
              plan: 'Enterprise',
              subscription_status: 'active',
              created_at: new Date().toISOString(),
            });
          }

          let name = 'System Administrator';
          if (email.includes('hfzali')) name = 'Lead Administrator';
          if (email.includes('security')) name = 'Security & SecOps Officer';

          await UserRepo.createUser({
            id: userId,
            email,
            password_hash: passwordHash,
            name,
            tenant_id: tenantId,
            role: 'admin',
            created_at: new Date().toISOString(),
          });

          if (!configuredPass) {
            console.warn(`🛡️ [ADMIN AUTH] Provisioned admin account ${email}. Set ADMIN_INITIAL_PASSWORD or use password reset to access.`);
          } else {
            console.log(`🛡️ [ADMIN AUTH] Provisioned authorized admin account: ${email}`);
          }
        }
      }
    } catch (err) {
      console.error('[ADMIN AUTH ERROR] Failed to ensure admin accounts:', err);
    }
  }

  static generateAdminToken(admin: AdminUser, jwtSecret?: string, expiresIn: string = '12h'): string {
    return jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        isAdmin: true,
      },
      jwtSecret || getJwtSecret(),
      { expiresIn: expiresIn as any }
    );
  }

  static verifyAdminToken(token?: string | null, jwtSecret?: string): AdminUser | null {
    if (!token || typeof token !== 'string') return null;
    try {
      const secret = jwtSecret || getJwtSecret();
      const decoded = jwt.verify(token, secret) as any;
      if (!decoded || !decoded.email || decoded.isAdmin !== true) {
        return null;
      }

      if (!this.isAuthorizedAdminEmail(decoded.email)) {
        console.warn(`[SECURITY ALERT] Denied admin access: ${decoded.email} is not in admin whitelist`);
        return null;
      }

      let role: 'super_admin' | 'security_admin' | 'ops_admin' = decoded.role || 'super_admin';
      if (decoded.email.toLowerCase().includes('security')) role = 'security_admin';
      else if (decoded.email.toLowerCase().includes('ops')) role = 'ops_admin';

      return {
        id: decoded.id || ('usr_admin_' + decoded.email.replace(/[^a-zA-Z0-9]/g, '_')),
        email: decoded.email.toLowerCase(),
        name: decoded.name || 'Administrator',
        role,
        createdAt: decoded.createdAt || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  static async authenticateAdmin(
    email: string,
    password: string,
    jwtSecret: string,
    meta?: { ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; token?: string; admin?: AdminUser; error?: string }> {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!this.isAuthorizedAdminEmail(cleanEmail)) {
      await AdminAuditRepo.logAction({
        adminId: 'unknown',
        adminEmail: cleanEmail,
        action: 'ADMIN_LOGIN_ATTEMPT',
        status: 'denied',
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        detailsJson: JSON.stringify({ reason: 'Email is not in authorized administrator whitelist' }),
      });
      return { success: false, error: 'Unauthorized: Account does not have administrator privileges.' };
    }

    let adminUserRecord = await UserRepo.findUserByEmail(cleanEmail);
    if (!adminUserRecord) {
      await this.ensureAdminAccountsExist();
      adminUserRecord = await UserRepo.findUserByEmail(cleanEmail);
    }

    if (!adminUserRecord) {
      await AdminAuditRepo.logAction({
        adminId: 'unknown',
        adminEmail: cleanEmail,
        action: 'ADMIN_LOGIN_ATTEMPT',
        status: 'failed',
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        detailsJson: JSON.stringify({ reason: 'Admin user record not found' }),
      });
      return { success: false, error: 'Invalid administrator credentials.' };
    }

    // Strict bcrypt verification (zero hardcoded fallback backdoors)
    let isValidPassword = false;
    if (adminUserRecord.password_hash.startsWith('$2')) {
      isValidPassword = await bcrypt.compare(password, adminUserRecord.password_hash);
    }

    // Optional break-glass check only when explicitly provided via env var in initial setup
    const envInitialPass = process.env.ADMIN_INITIAL_PASSWORD?.trim();
    if (!isValidPassword && envInitialPass && password === envInitialPass && !adminUserRecord.password_hash.startsWith('$2')) {
      isValidPassword = true;
      const upgradedHash = await bcrypt.hash(password, 12);
      await UserRepo.updateUserPassword(adminUserRecord.id, upgradedHash).catch(() => {});
    }

    if (!isValidPassword) {
      await AdminAuditRepo.logAction({
        adminId: adminUserRecord.id,
        adminEmail: cleanEmail,
        action: 'ADMIN_LOGIN_ATTEMPT',
        status: 'failed',
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
        detailsJson: JSON.stringify({ reason: 'Incorrect password' }),
      });
      return { success: false, error: 'Invalid administrator credentials.' };
    }

    let role: 'super_admin' | 'security_admin' | 'ops_admin' = 'super_admin';
    if (cleanEmail.includes('security')) role = 'security_admin';
    else if (cleanEmail.includes('ops')) role = 'ops_admin';

    const admin: AdminUser = {
      id: adminUserRecord.id,
      email: adminUserRecord.email,
      name: adminUserRecord.name,
      role,
      lastLoginAt: new Date().toISOString(),
      createdAt: adminUserRecord.created_at,
    };

    const token = this.generateAdminToken(admin, jwtSecret);

    await AdminAuditRepo.logAction({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ADMIN_LOGIN_SUCCESS',
      status: 'success',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
      detailsJson: JSON.stringify({ role: admin.role, loginTime: new Date().toISOString() }),
    });

    return {
      success: true,
      token,
      admin,
    };
  }
}
