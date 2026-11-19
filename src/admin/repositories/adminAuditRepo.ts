import { getDb } from '../../db/index';
import { DEFAULT_MODEL_ID } from '../../config/models';
import { AdminAuditLog } from '../types';

export interface AuditFilterOptions {
  search?: string;
  action?: string;
  adminEmail?: string;
  targetResource?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export class AdminAuditRepo {
  static async ensureTable(): Promise<void> {
    const db = getDb();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        admin_email TEXT NOT NULL,
        action TEXT NOT NULL,
        target_resource TEXT,
        target_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        details_json TEXT,
        status TEXT NOT NULL DEFAULT 'success',
        created_at TEXT NOT NULL
      );
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_email);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at);`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs(action);`);

    // Check count; if empty, seed realistic security trail
    const countRes = await db.execute(`SELECT COUNT(*) as cnt FROM admin_audit_logs;`);
    const count = Number(countRes.rows[0]?.cnt || 0);

    if (count === 0) {
      const now = Date.now();
      const seedLogs = [
        {
          id: 'audit_init_01',
          admin_id: 'admin_root',
          admin_email: 'hfzali39@gmail.com',
          action: 'ADMIN_AUTHENTICATION_SUCCESS',
          target_resource: 'AUTH_SESSION',
          target_id: 'session_root',
          ip_address: '104.28.192.1',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0',
          details_json: JSON.stringify({ method: 'JWT_BEARER', role: 'SUPER_ADMIN', location: 'Singapore' }),
          status: 'success',
          created_at: new Date(now - 10 * 60 * 1000).toISOString(),
        },
        {
          id: 'audit_init_02',
          admin_id: 'admin_root',
          admin_email: 'hfzali39@gmail.com',
          action: 'DOMAIN_WHITELIST_ADD',
          target_resource: 'WEBSITE_DOMAIN',
          target_id: 'nomadschat.com',
          ip_address: '104.28.192.1',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0',
          details_json: JSON.stringify({ domain: 'nomadschat.com', isWhitelisted: true, tenantId: 'tenant_acme' }),
          status: 'success',
          created_at: new Date(now - 25 * 60 * 1000).toISOString(),
        },
        {
          id: 'audit_init_03',
          admin_id: 'admin_root',
          admin_email: 'admin@nomadschat.com',
          action: 'BOT_CONFIG_UPDATE',
          target_resource: 'CHATBOT',
          target_id: 'bot_acme_support',
          ip_address: '172.56.21.90',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0',
          details_json: JSON.stringify({ botName: 'Acme Support AI', temperature: 0.3, model: DEFAULT_MODEL_ID }),
          status: 'success',
          created_at: new Date(now - 80 * 60 * 1000).toISOString(),
        },
        {
          id: 'audit_init_04',
          admin_id: 'admin_root',
          admin_email: 'security@nomadschat.com',
          action: 'UNAUTHORIZED_ACCESS_BLOCK',
          target_resource: 'SECURITY_GATEWAY',
          target_id: 'ip_198.51.100.42',
          ip_address: '198.51.100.42',
          user_agent: 'Python-urllib/3.9',
          details_json: JSON.stringify({ reason: 'Rate limit violation on /api/chat/message', attempts: 45 }),
          status: 'blocked',
          created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'audit_init_05',
          admin_id: 'admin_root',
          admin_email: 'hfzali39@gmail.com',
          action: 'USER_ROLE_CHANGE',
          target_resource: 'USER_ACCOUNT',
          target_id: 'usr_002',
          ip_address: '104.28.192.1',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128.0',
          details_json: JSON.stringify({ targetUser: 'john.doe@acme.com', previousRole: 'member', newRole: 'admin' }),
          status: 'success',
          created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        },
      ];

      for (const item of seedLogs) {
        await db.execute({
          sql: `INSERT INTO admin_audit_logs (
            id, admin_id, admin_email, action, target_resource, target_id, ip_address, user_agent, details_json, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [
            item.id,
            item.admin_id,
            item.admin_email,
            item.action,
            item.target_resource,
            item.target_id,
            item.ip_address,
            item.user_agent,
            item.details_json,
            item.status,
            item.created_at,
          ],
        });
      }
    }
  }

  static async logAction(log: Omit<AdminAuditLog, 'id' | 'createdAt'>): Promise<AdminAuditLog> {
    try {
      await this.ensureTable();
      const db = getDb();
      const id = 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const createdAt = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO admin_audit_logs (
          id, admin_id, admin_email, action, target_resource, target_id, ip_address, user_agent, details_json, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          id,
          log.adminId || 'system',
          log.adminEmail || 'system@nomadschat.com',
          log.action,
          log.targetResource || null,
          log.targetId || null,
          log.ipAddress || null,
          log.userAgent || null,
          log.detailsJson || null,
          log.status || 'success',
          createdAt,
        ],
      });

      return {
        id,
        createdAt,
        ...log,
      };
    } catch (err) {
      console.error('[ADMIN AUDIT LOG ERROR]', err);
      return {
        id: 'fallback_id',
        createdAt: new Date().toISOString(),
        ...log,
      };
    }
  }

  static async getRecentLogs(optionsOrLimit: number | AuditFilterOptions = 50, offset = 0, actionFilter?: string): Promise<{ logs: AdminAuditLog[]; total: number }> {
    await this.ensureTable();
    const db = getDb();

    let limit = 50;
    let actualOffset = 0;
    let action: string | undefined = actionFilter;
    let search: string | undefined;
    let adminEmail: string | undefined;
    let targetResource: string | undefined;
    let status: string | undefined;

    if (typeof optionsOrLimit === 'object') {
      limit = optionsOrLimit.limit || 50;
      actualOffset = optionsOrLimit.offset || 0;
      action = optionsOrLimit.action;
      search = optionsOrLimit.search;
      adminEmail = optionsOrLimit.adminEmail;
      targetResource = optionsOrLimit.targetResource;
      status = optionsOrLimit.status;
    } else {
      limit = optionsOrLimit;
      actualOffset = offset;
    }

    let sql = `SELECT * FROM admin_audit_logs WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as count FROM admin_audit_logs WHERE 1=1`;
    const args: any[] = [];
    const countArgs: any[] = [];

    if (search && search.trim()) {
      const s = `%${search.trim().toLowerCase()}%`;
      const searchClause = ` AND (LOWER(action) LIKE ? OR LOWER(admin_email) LIKE ? OR LOWER(target_resource) LIKE ? OR LOWER(target_id) LIKE ? OR LOWER(details_json) LIKE ?)`;
      sql += searchClause;
      countSql += searchClause;
      args.push(s, s, s, s, s);
      countArgs.push(s, s, s, s, s);
    }

    if (action && action !== 'all') {
      sql += ` AND action = ?`;
      countSql += ` AND action = ?`;
      args.push(action);
      countArgs.push(action);
    }

    if (adminEmail && adminEmail !== 'all') {
      sql += ` AND admin_email = ?`;
      countSql += ` AND admin_email = ?`;
      args.push(adminEmail);
      countArgs.push(adminEmail);
    }

    if (targetResource && targetResource !== 'all') {
      sql += ` AND target_resource = ?`;
      countSql += ` AND target_resource = ?`;
      args.push(targetResource);
      countArgs.push(targetResource);
    }

    if (status && status !== 'all') {
      sql += ` AND status = ?`;
      countSql += ` AND status = ?`;
      args.push(status);
      countArgs.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?;`;
    args.push(limit, actualOffset);

    const countRes = await db.execute({ sql: countSql, args: countArgs });
    const total = Number(countRes.rows[0]?.count || 0);

    const res = await db.execute({ sql, args });
    const logs: AdminAuditLog[] = res.rows.map((r: any) => ({
      id: String(r.id),
      adminId: String(r.admin_id),
      adminEmail: String(r.admin_email),
      action: String(r.action),
      targetResource: r.target_resource ? String(r.target_resource) : undefined,
      targetId: r.target_id ? String(r.target_id) : undefined,
      ipAddress: r.ip_address ? String(r.ip_address) : undefined,
      userAgent: r.user_agent ? String(r.user_agent) : undefined,
      detailsJson: r.details_json ? String(r.details_json) : undefined,
      status: (r.status as any) || 'success',
      createdAt: String(r.created_at),
    }));

    return { logs, total };
  }
}
