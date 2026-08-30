import { getDb } from '../db/index';
import { newId } from '../lib/ids';
import { IntegrationId, IntegrationItem } from '../types';

export const MARKETPLACE_CATALOG: Omit<IntegrationItem, 'isConnected' | 'connectedAt' | 'lastSyncAt' | 'config'>[] = [
  {
    id: 'slack',
    name: 'Slack',
    category: 'Team Collaboration',
    description: 'Stream incoming live customer conversations into dedicated Slack channels and allow agents to reply seamlessly.',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'Omnichannel Messaging',
    description: 'Connect your official Meta WhatsApp Business account (WABA) to automate customer support and lead qualification.',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    category: 'Automation & Workflows',
    description: 'Trigger multi-step automations and sync visitor inquiries, captured leads, and chat transcripts to 5,000+ cloud apps.',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/zapier.svg',
  },
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    category: 'CRM & Sales',
    description: 'Instantly create or update CRM contact records and attach chat transcripts when qualified leads are captured by your bot.',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/hubspot.svg',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'E-Commerce',
    description: 'Allow your AI chatbot to safely query live order status, inventory levels, tracking links, and catalog details for shoppers.',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/shopify.svg',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'E-Commerce',
    description: 'Sync your WordPress / WooCommerce product catalog, check live inventory, and enable conversational AI commerce recommendations.',
    logo: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/woocommerce.svg',
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
          config = JSON.parse(String(dbRow.config_json));
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
        config: isConnected ? config : undefined,
      };
    });
  }

  static async setConnection(
    tenantId: string,
    integrationId: IntegrationId,
    isConnected: boolean,
    config?: Record<string, any>
  ): Promise<IntegrationItem> {
    const db = getDb();
    const now = new Date().toISOString();
    const configJson = config ? JSON.stringify(config) : null;
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
    return {
      ...catalogItem,
      isConnected,
      connectedAt: isConnected ? now : undefined,
      lastSyncAt: now,
      config: isConnected ? (config || {}) : undefined,
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
