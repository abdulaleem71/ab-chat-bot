import { getDb } from '../db/index';
import { DiscountCodePolicy, TenantAuditLog } from '../types';

export class PolicyRepo {
  static async getPolicy(tenantId: string): Promise<DiscountCodePolicy> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM discount_code_policies WHERE tenant_id = ? LIMIT 1;`,
      args: [tenantId],
    });

    if (res.rows.length === 0) {
      await db.execute({
        sql: `
          INSERT INTO discount_code_policies (tenant_id, max_percent, max_per_conversation, requires_approval_above)
          VALUES (?, 20.0, 1, 15.0);
        `,
        args: [tenantId],
      });
      return {
        tenantId,
        maxPercent: 20,
        maxPerConversation: 1,
        requiresApprovalAbove: 15,
      };
    }

    const row = res.rows[0];
    return {
      tenantId: String(row.tenant_id),
      maxPercent: Number(row.max_percent),
      maxPerConversation: Number(row.max_per_conversation),
      requiresApprovalAbove: Number(row.requires_approval_above),
    };
  }

  static async updatePolicy(
    tenantId: string,
    data: {
      maxPercent?: number;
      maxPerConversation?: number;
      requiresApprovalAbove?: number;
    }
  ): Promise<DiscountCodePolicy> {
    const current = await this.getPolicy(tenantId);
    const maxPercent = data.maxPercent !== undefined ? Number(data.maxPercent) : current.maxPercent;
    const maxPerConversation = data.maxPerConversation !== undefined ? Number(data.maxPerConversation) : current.maxPerConversation;
    const requiresApprovalAbove = data.requiresApprovalAbove !== undefined ? Number(data.requiresApprovalAbove) : current.requiresApprovalAbove;

    const db = getDb();
    await db.execute({
      sql: `
        INSERT INTO discount_code_policies (tenant_id, max_percent, max_per_conversation, requires_approval_above)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(tenant_id) DO UPDATE SET
          max_percent = excluded.max_percent,
          max_per_conversation = excluded.max_per_conversation,
          requires_approval_above = excluded.requires_approval_above;
      `,
      args: [tenantId, maxPercent, maxPerConversation, requiresApprovalAbove],
    });

    return {
      tenantId,
      maxPercent,
      maxPerConversation,
      requiresApprovalAbove,
    };
  }
}

export class TenantAuditRepo {
  static async log(data: {
    tenantId: string;
    action: string;
    targetResource?: string;
    targetId?: string;
    details?: any;
    status?: 'success' | 'blocked' | 'pending';
  }): Promise<void> {
    const db = getDb();
    const id = 'taud_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const now = new Date().toISOString();

    await db.execute({
      sql: `
        INSERT INTO tenant_audit_logs (id, tenant_id, action, target_resource, target_id, details_json, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [
        id,
        data.tenantId,
        data.action,
        data.targetResource || 'DISCOUNT_CODE_POLICY',
        data.targetId || null,
        data.details ? JSON.stringify(data.details) : null,
        data.status || 'success',
        now,
      ],
    });
  }

  static async getLogs(tenantId: string, limit = 50): Promise<TenantAuditLog[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `
        SELECT * FROM tenant_audit_logs
        WHERE tenant_id = ?
        ORDER BY created_at DESC
        LIMIT ?;
      `,
      args: [tenantId, limit],
    });

    return res.rows.map(row => {
      let details = null;
      try {
        if (row.details_json) details = JSON.parse(String(row.details_json));
      } catch {
        details = row.details_json;
      }

      return {
        id: String(row.id),
        tenantId: String(row.tenant_id),
        action: String(row.action),
        targetResource: row.target_resource ? String(row.target_resource) : undefined,
        targetId: row.target_id ? String(row.target_id) : undefined,
        details,
        status: (row.status || 'success') as any,
        createdAt: String(row.created_at),
      };
    });
  }
}
