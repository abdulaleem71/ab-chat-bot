import { getDb } from '../db';

export class AuditEventsRepo {
  static async logEvent(data: {
    tenantId: string;
    actorId?: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | null;
    metadata?: any;
  }): Promise<void> {
    if (!data.tenantId || !data.action) return;
    const db = getDb();
    const id = 'evt_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    const createdAt = new Date().toISOString();
    const metadataStr = data.metadata ? (typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata)) : null;

    try {
      await db.execute({
        sql: `INSERT INTO audit_events (id, tenant_id, actor_id, action, target_type, target_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          id,
          data.tenantId,
          data.actorId || null,
          data.action,
          data.targetType || null,
          data.targetId || null,
          metadataStr,
          createdAt,
        ],
      });
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  }

  static async getEvents(tenantId: string, filters?: { action?: string; actorId?: string; limit?: number }): Promise<any[]> {
    if (!tenantId) return [];
    const db = getDb();
    let sql = `
      SELECT ae.*, u.name as actor_name, u.email as actor_email
      FROM audit_events ae
      LEFT JOIN users u ON ae.actor_id = u.id
      WHERE ae.tenant_id = ?
    `;
    const args: any[] = [tenantId];

    if (filters?.action) {
      sql += ` AND ae.action = ?`;
      args.push(filters.action);
    }
    if (filters?.actorId) {
      sql += ` AND ae.actor_id = ?`;
      args.push(filters.actorId);
    }

    sql += ` ORDER BY ae.created_at DESC LIMIT ?`;
    args.push(filters?.limit || 200);

    const res = await db.execute({ sql, args });
    return res.rows;
  }
}
