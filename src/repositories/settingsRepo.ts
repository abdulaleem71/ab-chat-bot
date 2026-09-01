import { getDb } from '../db/index';
import { encryptConfig, decryptConfig } from '../services/encryptionService';
import { TenantAuditRepo } from './policyRepo';

export interface WorkspaceProfile {
  tenantId: string;
  name: string;
  ownerEmail: string;
  plan: string;
  logoUrl?: string;
  timezone: string;
}

export interface TenantNotifications {
  tenantId: string;
  newTicketAlert: boolean;
  integrationDisconnectedAlert: boolean;
  usageNearLimitAlert: boolean;
  emailNotificationsEnabled: boolean;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface WebhookItem {
  id: string;
  name: string;
  url: string;
  secretMasked?: string;
  isActive: boolean;
  createdAt: string;
}

export class SettingsRepo {
  static async getWorkspaceProfile(tenantId: string): Promise<WorkspaceProfile> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM tenants WHERE id = ? LIMIT 1;`,
      args: [tenantId],
    });
    if (res.rows.length === 0) {
      return {
        tenantId,
        name: 'Nomads Workspace',
        ownerEmail: 'admin@nomadschat.com',
        plan: 'Pro',
        timezone: 'UTC',
      };
    }
    const r = res.rows[0];
    return {
      tenantId: String(r.id),
      name: String(r.name),
      ownerEmail: String(r.owner_email || ''),
      plan: String(r.plan || 'Pro'),
      logoUrl: r.logo_url ? String(r.logo_url) : undefined,
      timezone: r.timezone ? String(r.timezone) : 'UTC',
    };
  }

  static async updateWorkspaceProfile(
    tenantId: string,
    data: { name?: string; logoUrl?: string; timezone?: string }
  ): Promise<WorkspaceProfile> {
    const current = await this.getWorkspaceProfile(tenantId);
    const name = data.name !== undefined ? data.name : current.name;
    const logoUrl = data.logoUrl !== undefined ? data.logoUrl : current.logoUrl;
    const timezone = data.timezone !== undefined ? data.timezone : current.timezone;

    const db = getDb();
    await db.execute({
      sql: `
        UPDATE tenants
        SET name = ?, logo_url = ?, timezone = ?
        WHERE id = ?;
      `,
      args: [name, logoUrl || null, timezone, tenantId],
    });

    await TenantAuditRepo.log({
      tenantId,
      action: 'UPDATE_WORKSPACE_PROFILE',
      targetResource: 'TENANT',
      targetId: tenantId,
      details: { name, logoUrl, timezone },
      status: 'success',
    });

    return {
      ...current,
      name,
      logoUrl,
      timezone,
    };
  }

  static async getNotifications(tenantId: string): Promise<TenantNotifications> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM tenant_notifications WHERE tenant_id = ? LIMIT 1;`,
      args: [tenantId],
    });

    if (res.rows.length === 0) {
      await db.execute({
        sql: `
          INSERT INTO tenant_notifications (tenant_id, new_ticket_alert, integration_disconnected_alert, usage_near_limit_alert, email_notifications_enabled)
          VALUES (?, 1, 1, 1, 1);
        `,
        args: [tenantId],
      });
      return {
        tenantId,
        newTicketAlert: true,
        integrationDisconnectedAlert: true,
        usageNearLimitAlert: true,
        emailNotificationsEnabled: true,
      };
    }

    const r = res.rows[0];
    return {
      tenantId,
      newTicketAlert: Number(r.new_ticket_alert) === 1,
      integrationDisconnectedAlert: Number(r.integration_disconnected_alert) === 1,
      usageNearLimitAlert: Number(r.usage_near_limit_alert) === 1,
      emailNotificationsEnabled: Number(r.email_notifications_enabled) === 1,
    };
  }

  static async updateNotifications(
    tenantId: string,
    data: {
      newTicketAlert?: boolean;
      integrationDisconnectedAlert?: boolean;
      usageNearLimitAlert?: boolean;
      emailNotificationsEnabled?: boolean;
    }
  ): Promise<TenantNotifications> {
    const current = await this.getNotifications(tenantId);
    const newTicketAlert = data.newTicketAlert !== undefined ? data.newTicketAlert : current.newTicketAlert;
    const integrationDisconnectedAlert =
      data.integrationDisconnectedAlert !== undefined ? data.integrationDisconnectedAlert : current.integrationDisconnectedAlert;
    const usageNearLimitAlert = data.usageNearLimitAlert !== undefined ? data.usageNearLimitAlert : current.usageNearLimitAlert;
    const emailNotificationsEnabled =
      data.emailNotificationsEnabled !== undefined ? data.emailNotificationsEnabled : current.emailNotificationsEnabled;

    const db = getDb();
    await db.execute({
      sql: `
        INSERT INTO tenant_notifications (tenant_id, new_ticket_alert, integration_disconnected_alert, usage_near_limit_alert, email_notifications_enabled)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(tenant_id) DO UPDATE SET
          new_ticket_alert = excluded.new_ticket_alert,
          integration_disconnected_alert = excluded.integration_disconnected_alert,
          usage_near_limit_alert = excluded.usage_near_limit_alert,
          email_notifications_enabled = excluded.email_notifications_enabled;
      `,
      args: [
        tenantId,
        newTicketAlert ? 1 : 0,
        integrationDisconnectedAlert ? 1 : 0,
        usageNearLimitAlert ? 1 : 0,
        emailNotificationsEnabled ? 1 : 0,
      ],
    });

    await TenantAuditRepo.log({
      tenantId,
      action: 'UPDATE_NOTIFICATIONS',
      targetResource: 'TENANT_NOTIFICATIONS',
      targetId: tenantId,
      details: { newTicketAlert, integrationDisconnectedAlert, usageNearLimitAlert, emailNotificationsEnabled },
      status: 'success',
    });

    return {
      tenantId,
      newTicketAlert,
      integrationDisconnectedAlert,
      usageNearLimitAlert,
      emailNotificationsEnabled,
    };
  }

  // API Keys
  static async getApiKeys(tenantId: string): Promise<ApiKeyItem[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT id, name, key_prefix, created_at, last_used_at FROM tenant_api_keys WHERE tenant_id = ? ORDER BY created_at DESC;`,
      args: [tenantId],
    });
    return res.rows.map(r => ({
      id: String(r.id),
      name: String(r.name),
      keyPrefix: String(r.key_prefix),
      createdAt: String(r.created_at),
      lastUsedAt: r.last_used_at ? String(r.last_used_at) : undefined,
    }));
  }

  static async createApiKey(tenantId: string, name: string): Promise<{ apiKeyItem: ApiKeyItem; rawKey: string }> {
    const db = getDb();
    const id = 'key_' + Math.random().toString(36).slice(2, 9);
    const rawKey = 'nc_live_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    const keyPrefix = rawKey.slice(0, 10) + '...';
    // Simple hash simulation or storing prefix
    const keyHash = Buffer.from(rawKey).toString('base64');
    const now = new Date().toISOString();

    await db.execute({
      sql: `
        INSERT INTO tenant_api_keys (id, tenant_id, name, key_prefix, key_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?);
      `,
      args: [id, tenantId, name || 'Production API Key', keyPrefix, keyHash, now],
    });

    await TenantAuditRepo.log({
      tenantId,
      action: 'CREATE_API_KEY',
      targetResource: 'TENANT_API_KEY',
      targetId: id,
      details: { name, keyPrefix },
      status: 'success',
    });

    return {
      apiKeyItem: {
        id,
        name: name || 'Production API Key',
        keyPrefix,
        createdAt: now,
      },
      rawKey,
    };
  }

  static async revokeApiKey(tenantId: string, keyId: string): Promise<boolean> {
    const db = getDb();
    await db.execute({
      sql: `DELETE FROM tenant_api_keys WHERE id = ? AND tenant_id = ?;`,
      args: [keyId, tenantId],
    });

    await TenantAuditRepo.log({
      tenantId,
      action: 'REVOKE_API_KEY',
      targetResource: 'TENANT_API_KEY',
      targetId: keyId,
      status: 'success',
    });

    return true;
  }

  // Webhooks (reusing encrypted-storage pattern)
  static async getWebhooks(tenantId: string): Promise<WebhookItem[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT id, name, url, secret_encrypted, is_active, created_at FROM tenant_webhooks WHERE tenant_id = ? ORDER BY created_at DESC;`,
      args: [tenantId],
    });

    return res.rows.map(r => {
      let hasSecret = Boolean(r.secret_encrypted);
      return {
        id: String(r.id),
        name: String(r.name),
        url: String(r.url),
        secretMasked: hasSecret ? '••••••••••••' : undefined,
        isActive: Number(r.is_active) === 1,
        createdAt: String(r.created_at),
      };
    });
  }

  static async createWebhook(
    tenantId: string,
    data: { name: string; url: string; secret?: string }
  ): Promise<WebhookItem> {
    const db = getDb();
    const id = 'wh_' + Math.random().toString(36).slice(2, 9);
    const now = new Date().toISOString();

    let encryptedSecret = null;
    if (data.secret) {
      const encrypted = encryptConfig({ secret: data.secret });
      encryptedSecret = encrypted ? JSON.stringify(encrypted) : null;
    }

    await db.execute({
      sql: `
        INSERT INTO tenant_webhooks (id, tenant_id, name, url, secret_encrypted, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?);
      `,
      args: [id, tenantId, data.name || 'Workflow Webhook', data.url, encryptedSecret, now],
    });

    await TenantAuditRepo.log({
      tenantId,
      action: 'CREATE_WEBHOOK',
      targetResource: 'TENANT_WEBHOOK',
      targetId: id,
      details: { name: data.name, url: data.url },
      status: 'success',
    });

    return {
      id,
      name: data.name || 'Workflow Webhook',
      url: data.url,
      secretMasked: data.secret ? '••••••••••••' : undefined,
      isActive: true,
      createdAt: now,
    };
  }

  static async revokeWebhook(tenantId: string, webhookId: string): Promise<boolean> {
    const db = getDb();
    await db.execute({
      sql: `DELETE FROM tenant_webhooks WHERE id = ? AND tenant_id = ?;`,
      args: [webhookId, tenantId],
    });

    await TenantAuditRepo.log({
      tenantId,
      action: 'REVOKE_WEBHOOK',
      targetResource: 'TENANT_WEBHOOK',
      targetId: webhookId,
      status: 'success',
    });

    return true;
  }
}
