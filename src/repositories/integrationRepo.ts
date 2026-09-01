import { getDb } from '../db/index';
import { IntegrationId, IntegrationItem } from '../types';
import { encryptConfig, decryptConfig, maskConfig } from '../services/encryptionService';

export const MARKETPLACE_CATALOG: Omit<IntegrationItem, 'isConnected' | 'connectedAt' | 'lastSyncAt' | 'config'>[] = [
  {
    id: 'slack',
    name: 'Slack',
    category: 'Team Collaboration',
    description: 'Stream incoming live customer conversations into dedicated Slack channels and allow agents to reply seamlessly.',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg',
    features: ['Real-time channel alerts', 'Direct agent handoff', 'Transcript streaming'],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'Omnichannel Messaging',
    description: 'Connect your official Meta WhatsApp Business account (WABA) to automate customer support and lead qualification.',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg',
    features: ['Official Cloud API', 'Template messages', '24/7 autonomous support'],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automation & Workflows',
    description: 'Trigger multi-step automations and sync visitor inquiries, captured leads, and chat transcripts to 5,000+ cloud apps.',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/zapier.svg',
    features: ['Catch-hook triggers', 'Multi-app workflows', 'Auto CRM export'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    category: 'CRM & Sales',
    description: 'Instantly create or update CRM contact records and attach chat transcripts when qualified leads are captured by your bot.',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/hubspot.svg',
    features: ['Bi-directional contact sync', 'Deal pipeline creation', 'Chat timeline logging'],
  },
];

export class IntegrationRepo {
  static async getIntegrations(tenantId: string): Promise<IntegrationItem[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM integrations WHERE tenant_id = ?;`,
      args: [tenantId],
    });

    const dbMap = new Map<string, any>();
    for (const row of res.rows) {
      dbMap.set(String(row.integration_id), row);
    }

    return MARKETPLACE_CATALOG.map(item => {
      const dbRow = dbMap.get(item.id);
      let config: Record<string, any> = {};
      if (dbRow?.config_json) {
        try {
          const parsed = JSON.parse(String(dbRow.config_json));
          config = decryptConfig(parsed) || {};
        } catch {
          config = {};
        }
      }

      const isConnected = dbRow ? Number(dbRow.is_connected) === 1 : false;

      return {
        ...item,
        isConnected,
        connectedAt: dbRow?.connected_at ? String(dbRow.connected_at) : undefined,
        lastSyncAt: dbRow?.updated_at ? String(dbRow.updated_at) : undefined,
        config: isConnected ? maskConfig(config) : undefined,
      };
    });
  }

  static async getConfigDecrypted(tenantId: string, integrationId: IntegrationId): Promise<Record<string, any>> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT config_json FROM integrations WHERE tenant_id = ? AND integration_id = ? AND is_connected = 1;`,
      args: [tenantId, integrationId],
    });
    if (res.rows.length === 0 || !res.rows[0].config_json) return {};
    try {
      const parsed = JSON.parse(String(res.rows[0].config_json));
      return decryptConfig(parsed) || {};
    } catch {
      return {};
    }
  }

  static async setConnection(
    tenantId: string,
    integrationId: IntegrationId,
    isConnected: boolean,
    config?: Record<string, any>
  ): Promise<IntegrationItem> {
    const db = getDb();
    const now = new Date().toISOString();

    // Fetch existing integration config to preserve secrets if masked values (e.g. ****) are submitted
    const existingRes = await db.execute({
      sql: `SELECT config_json, connected_at FROM integrations WHERE tenant_id = ? AND integration_id = ?;`,
      args: [tenantId, integrationId],
    });

    let existingConfig: Record<string, any> = {};
    if (existingRes.rows.length > 0 && existingRes.rows[0].config_json) {
      try {
        const parsed = JSON.parse(String(existingRes.rows[0].config_json));
        existingConfig = decryptConfig(parsed) || {};
      } catch {}
    }

    const mergedConfig = { ...existingConfig };
    if (config) {
      for (const [k, v] of Object.entries(config)) {
        if (typeof v === 'string' && v.includes('****')) {
          mergedConfig[k] = existingConfig[k] || v;
        } else {
          mergedConfig[k] = v;
        }
      }
    }

    const encryptedConfig = encryptConfig(mergedConfig);
    const configJson = encryptedConfig ? JSON.stringify(encryptedConfig) : null;
    const id = `int_${integrationId}_${tenantId}`;

    await db.execute({
      sql: `
        INSERT INTO integrations (id, tenant_id, integration_id, is_connected, config_json, connected_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(tenant_id, integration_id) DO UPDATE SET
          is_connected = excluded.is_connected,
          config_json = CASE WHEN excluded.config_json IS NOT NULL THEN excluded.config_json ELSE integrations.config_json END,
          connected_at = CASE WHEN excluded.is_connected = 1 AND integrations.connected_at IS NULL THEN excluded.connected_at ELSE integrations.connected_at END,
          updated_at = excluded.updated_at;
      `,
      args: [id, tenantId, integrationId, isConnected ? 1 : 0, configJson, now, now],
    });

    const catalogItem = MARKETPLACE_CATALOG.find(x => x.id === integrationId)!;
    const existingConnectedAt = existingRes.rows[0]?.connected_at ? String(existingRes.rows[0].connected_at) : undefined;
    return {
      ...catalogItem,
      isConnected,
      connectedAt: isConnected ? (existingConnectedAt || now) : undefined,
      lastSyncAt: now,
      config: isConnected ? maskConfig(mergedConfig) || {} : undefined,
    };
  }

  static async disconnect(tenantId: string, integrationId: IntegrationId): Promise<boolean> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.execute({
      sql: `UPDATE integrations SET is_connected = 0, updated_at = ? WHERE tenant_id = ? AND integration_id = ?;`,
      args: [now, tenantId, integrationId],
    });
    return true;
  }
}
