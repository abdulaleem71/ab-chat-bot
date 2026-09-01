import { getDb } from '../../db/index';
import bcrypt from 'bcryptjs';
import { AdminAuditRepo } from './adminAuditRepo';

export interface AdminUserListItem {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName: string;
  tenantPlan: string;
  createdAt: string;
  chatbotsCount: number;
  conversationsCount: number;
  messagesCount: number;
  leadsCount: number;
  lastActiveAt?: string;
}

export interface AdminUserDetail {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    createdAt: string;
  };
  tenant: {
    id: string;
    name: string;
    ownerEmail: string;
    plan: string;
    creditBalance: number;
    paymentStatus: string;
    failedPaymentsCount: number;
    retryAttempts: number;
    lastPaymentError?: string | null;
    dunningSince?: string | null;
    paymentMethodBrand?: string | null;
    paymentMethodLast4?: string | null;
    paymentMethodExp?: string | null;
    isDisabled?: boolean;
    disabledReason?: string | null;
    createdAt: string;
  } | null;
  chatbots: Array<{
    id: string;
    name: string;
    status: string;
    websiteUrl: string;
    domainLockEnabled: boolean;
    allowedDomains: string[];
    createdAt: string;
    conversationsCount: number;
    messagesCount: number;
    leadsCount: number;
    knowledgeSourcesCount: number;
  }>;
  leads: Array<{
    id: string;
    chatbotId: string;
    chatbotName?: string;
    name: string;
    email: string;
    phone?: string;
    customFields?: Record<string, any>;
    capturedAt: string;
  }>;
  recentConversations: Array<{
    id: string;
    chatbotId: string;
    chatbotName?: string;
    visitorName?: string;
    visitorEmail?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  stats: {
    totalChatbots: number;
    totalConversations: number;
    totalMessages: number;
    totalLeads: number;
    totalKnowledgeSources: number;
  };
  auditLogs: Array<{
    id: string;
    adminEmail: string;
    action: string;
    status: string;
    detailsJson: string;
    createdAt: string;
  }>;
}

export class AdminUserRepo {
  static async getUsersList(params: {
    search?: string;
    role?: string;
    plan?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'email' | 'name' | 'chatbotsCount';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ users: AdminUserListItem[]; total: number }> {
    const db = getDb();
    const limit = Math.min(params.limit || 50, 100);
    const offset = params.offset || 0;
    const sortOrder = params.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Base query joining users and tenants
    const conditions: string[] = [];
    const args: any[] = [];

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim().toLowerCase()}%`;
      conditions.push(`(LOWER(u.email) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(u.id) LIKE ?)`);
      args.push(q, q, q);
    }

    if (params.role && params.role !== 'ALL') {
      conditions.push(`u.role = ?`);
      args.push(params.role);
    }

    if (params.plan && params.plan !== 'ALL') {
      conditions.push(`t.plan = ?`);
      args.push(params.plan);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching
    const countSql = `
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      ${whereClause};
    `;
    const countRes = await db.execute({ sql: countSql, args });
    const total = Number(countRes.rows[0]?.count || 0);

    // Fetch user rows
    const listSql = `
      SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.tenant_id,
        u.created_at,
        t.name as tenant_name,
        t.plan as tenant_plan
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      ${whereClause}
      ORDER BY u.created_at ${sortOrder}
      LIMIT ? OFFSET ?;
    `;
    const listArgs = [...args, limit, offset];
    const listRes = await db.execute({ sql: listSql, args: listArgs });

    // For each user, enrich with counts from database
    const users: AdminUserListItem[] = [];
    for (const r of listRes.rows) {
      const userId = String(r.id);
      const tenantId = String(r.tenant_id || '');

      // Get counts for chatbots
      const [botCountRes, convCountRes, leadCountRes] = await Promise.all([
        db.execute({
          sql: `SELECT COUNT(*) as count FROM chatbots WHERE user_id = ? OR tenant_id = ?;`,
          args: [userId, tenantId],
        }),
        db.execute({
          sql: `SELECT COUNT(*) as count FROM conversations WHERE chatbot_id IN (SELECT id FROM chatbots WHERE user_id = ? OR tenant_id = ?);`,
          args: [userId, tenantId],
        }),
        db.execute({
          sql: `SELECT COUNT(*) as count FROM leads WHERE tenant_id = ? OR chatbot_id IN (SELECT id FROM chatbots WHERE user_id = ? OR tenant_id = ?);`,
          args: [tenantId, userId, tenantId],
        }),
      ]);

      const chatbotsCount = Number(botCountRes.rows[0]?.count || 0);
      const conversationsCount = Number(convCountRes.rows[0]?.count || 0);
      const leadsCount = Number(leadCountRes.rows[0]?.count || 0);

      // Estimate messages
      const msgCountRes = await db.execute({
        sql: `SELECT COUNT(*) as count FROM messages WHERE conversation_id IN (
          SELECT id FROM conversations WHERE chatbot_id IN (SELECT id FROM chatbots WHERE user_id = ? OR tenant_id = ?)
        );`,
        args: [userId, tenantId],
      });
      const messagesCount = Number(msgCountRes.rows[0]?.count || 0);

      users.push({
        id: userId,
        email: String(r.email),
        name: String(r.name || 'Anonymous'),
        role: String(r.role || 'user'),
        tenantId,
        tenantName: String(r.tenant_name || 'Personal Workspace'),
        tenantPlan: String(r.tenant_plan || 'Standard'),
        createdAt: String(r.created_at),
        chatbotsCount,
        conversationsCount,
        messagesCount,
        leadsCount,
      });
    }

    return { users, total };
  }

  static async getUserDetail(userId: string): Promise<AdminUserDetail | null> {
    const db = getDb();

    // 1. Fetch User Record
    const userRes = await db.execute({
      sql: `SELECT id, email, name, role, tenant_id, created_at FROM users WHERE id = ? LIMIT 1;`,
      args: [userId],
    });
    if (userRes.rows.length === 0) return null;
    const u = userRes.rows[0];

    const tenantId = String(u.tenant_id || '');

    // 2. Fetch Tenant Record
    let tenant: AdminUserDetail['tenant'] = null;
    if (tenantId) {
      const tRes = await db.execute({
        sql: `SELECT id, name, owner_email, plan, credit_balance, payment_status, failed_payments_count, retry_attempts, last_payment_error, dunning_since, payment_method_brand, payment_method_last4, payment_method_exp, is_disabled, disabled_reason, created_at FROM tenants WHERE id = ? LIMIT 1;`,
        args: [tenantId],
      });
      if (tRes.rows.length > 0) {
        const tr = tRes.rows[0];
        tenant = {
          id: String(tr.id),
          name: String(tr.name),
          ownerEmail: String(tr.owner_email),
          plan: String(tr.plan || 'Pro'),
          creditBalance: Number(tr.credit_balance || 0),
          paymentStatus: String(tr.payment_status || 'active'),
          failedPaymentsCount: Number(tr.failed_payments_count || 0),
          retryAttempts: Number(tr.retry_attempts || 0),
          lastPaymentError: tr.last_payment_error ? String(tr.last_payment_error) : null,
          dunningSince: tr.dunning_since ? String(tr.dunning_since) : null,
          paymentMethodBrand: tr.payment_method_brand ? String(tr.payment_method_brand) : 'Visa',
          paymentMethodLast4: tr.payment_method_last4 ? String(tr.payment_method_last4) : '4242',
          paymentMethodExp: tr.payment_method_exp ? String(tr.payment_method_exp) : '12/28',
          isDisabled: Number(tr.is_disabled) === 1,
          disabledReason: tr.disabled_reason ? String(tr.disabled_reason) : null,
          createdAt: String(tr.created_at),
        };
      }
    }

    // 3. Fetch User's Chatbots
    const botsRes = await db.execute({
      sql: `SELECT * FROM chatbots WHERE user_id = ? OR tenant_id = ? ORDER BY created_at DESC;`,
      args: [userId, tenantId],
    });

    const chatbots: AdminUserDetail['chatbots'] = [];
    let totalMessages = 0;
    let totalConversations = 0;
    let totalLeads = 0;
    let totalKnowledgeSources = 0;

    const botMap = new Map<string, string>();

    for (const b of botsRes.rows) {
      const botId = String(b.id);
      botMap.set(botId, String(b.name));

      let allowedDomains: string[] = [];
      try {
        if (b.allowed_domains_json) {
          allowedDomains = JSON.parse(String(b.allowed_domains_json));
        }
      } catch {
        allowedDomains = [];
      }

      const [cRes, mRes, lRes, kRes] = await Promise.all([
        db.execute({ sql: `SELECT COUNT(*) as count FROM conversations WHERE chatbot_id = ?;`, args: [botId] }),
        db.execute({ sql: `SELECT COUNT(*) as count FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE chatbot_id = ?);`, args: [botId] }),
        db.execute({ sql: `SELECT COUNT(*) as count FROM leads WHERE chatbot_id = ?;`, args: [botId] }),
        db.execute({ sql: `SELECT COUNT(DISTINCT ks.id) as count FROM knowledge_sources ks JOIN chatbot_knowledge_sources cks ON ks.id = cks.knowledge_source_id WHERE cks.chatbot_id = ?;`, args: [botId] }),
      ]);

      const cCount = Number(cRes.rows[0]?.count || 0);
      const mCount = Number(mRes.rows[0]?.count || 0);
      const lCount = Number(lRes.rows[0]?.count || 0);
      const kCount = Number(kRes.rows[0]?.count || 0);

      totalConversations += cCount;
      totalMessages += mCount;
      totalLeads += lCount;
      totalKnowledgeSources += kCount;

      chatbots.push({
        id: botId,
        name: String(b.name),
        status: String(b.status || 'active'),
        websiteUrl: String(b.website_url || ''),
        domainLockEnabled: Boolean(Number(b.domain_lock_enabled || 0)),
        allowedDomains,
        createdAt: String(b.created_at),
        conversationsCount: cCount,
        messagesCount: mCount,
        leadsCount: lCount,
        knowledgeSourcesCount: kCount,
      });
    }

    // 4. Fetch User Leads
    const leadsRes = await db.execute({
      sql: `SELECT * FROM leads WHERE tenant_id = ? OR chatbot_id IN (SELECT id FROM chatbots WHERE user_id = ? OR tenant_id = ?) ORDER BY captured_at DESC LIMIT 50;`,
      args: [tenantId, userId, tenantId],
    });
    const leads = leadsRes.rows.map((lr: any) => {
      let customFields: Record<string, any> = {};
      try {
        if (lr.custom_fields_json) customFields = JSON.parse(String(lr.custom_fields_json));
      } catch {}

      return {
        id: String(lr.id),
        chatbotId: String(lr.chatbot_id || ''),
        chatbotName: botMap.get(String(lr.chatbot_id)) || 'Chatbot',
        name: String(lr.name || ''),
        email: String(lr.email || ''),
        phone: lr.phone ? String(lr.phone) : undefined,
        customFields,
        capturedAt: String(lr.captured_at || lr.created_at),
      };
    });

    // 5. Fetch Recent Conversations
    const convsRes = await db.execute({
      sql: `SELECT * FROM conversations WHERE chatbot_id IN (SELECT id FROM chatbots WHERE user_id = ? OR tenant_id = ?) ORDER BY created_at DESC LIMIT 20;`,
      args: [userId, tenantId],
    });
    const recentConversations = convsRes.rows.map((cr: any) => ({
      id: String(cr.id),
      chatbotId: String(cr.chatbot_id),
      chatbotName: botMap.get(String(cr.chatbot_id)) || 'Chatbot',
      visitorName: cr.visitor_name ? String(cr.visitor_name) : undefined,
      visitorEmail: cr.visitor_email ? String(cr.visitor_email) : undefined,
      status: String(cr.status || 'active'),
      createdAt: String(cr.created_at),
      updatedAt: String(cr.updated_at || cr.created_at),
    }));

    // 6. Fetch Admin Audit Logs regarding this user
    const auditRes = await db.execute({
      sql: `SELECT * FROM admin_audit_logs WHERE target_id = ? OR details_json LIKE ? ORDER BY created_at DESC LIMIT 20;`,
      args: [userId, `%${userId}%`],
    });
    const auditLogs = auditRes.rows.map((ar: any) => ({
      id: String(ar.id),
      adminEmail: String(ar.admin_email),
      action: String(ar.action),
      status: String(ar.status),
      detailsJson: String(ar.details_json || '{}'),
      createdAt: String(ar.created_at),
    }));

    return {
      user: {
        id: String(u.id),
        email: String(u.email),
        name: String(u.name),
        role: String(u.role || 'user'),
        tenantId,
        createdAt: String(u.created_at),
      },
      tenant,
      chatbots,
      leads,
      recentConversations,
      stats: {
        totalChatbots: chatbots.length,
        totalConversations,
        totalMessages,
        totalLeads,
        totalKnowledgeSources,
      },
      auditLogs,
    };
  }

  static async updateUserRole(
    userId: string,
    newRole: string,
    adminInfo: { id: string; email: string; ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const db = getDb();
    const existing = await db.execute({ sql: `SELECT * FROM users WHERE id = ? LIMIT 1;`, args: [userId] });
    if (existing.rows.length === 0) {
      return { success: false, error: 'User not found.' };
    }
    const oldRole = String(existing.rows[0].role);

    await db.execute({
      sql: `UPDATE users SET role = ? WHERE id = ?;`,
      args: [newRole, userId],
    });

    await AdminAuditRepo.logAction({
      adminId: adminInfo.id,
      adminEmail: adminInfo.email,
      action: 'ADMIN_UPDATE_USER_ROLE',
      status: 'success',
      targetId: userId,
      targetResource: `user:${userId}`,
      detailsJson: JSON.stringify({ oldRole, newRole }),
      ipAddress: adminInfo.ip,
      userAgent: adminInfo.userAgent,
    });

    return { success: true };
  }

  static async updateTenantPlan(
    userId: string,
    tenantId: string,
    newPlan: string,
    adminInfo: { id: string; email: string; ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const db = getDb();
    const existing = await db.execute({ sql: `SELECT * FROM tenants WHERE id = ? LIMIT 1;`, args: [tenantId] });
    if (existing.rows.length === 0) {
      return { success: false, error: 'Tenant workspace not found.' };
    }
    const oldPlan = String(existing.rows[0].plan);

    await db.execute({
      sql: `UPDATE tenants SET plan = ? WHERE id = ?;`,
      args: [newPlan, tenantId],
    });

    await AdminAuditRepo.logAction({
      adminId: adminInfo.id,
      adminEmail: adminInfo.email,
      action: 'ADMIN_UPDATE_TENANT_PLAN',
      status: 'success',
      targetId: userId,
      targetResource: `tenant:${tenantId}`,
      detailsJson: JSON.stringify({ oldPlan, newPlan }),
      ipAddress: adminInfo.ip,
      userAgent: adminInfo.userAgent,
    });

    return { success: true };
  }

  static async resetUserPassword(
    userId: string,
    newPasswordPlain: string,
    adminInfo: { id: string; email: string; ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const db = getDb();
    const existing = await db.execute({ sql: `SELECT * FROM users WHERE id = ? LIMIT 1;`, args: [userId] });
    if (existing.rows.length === 0) {
      return { success: false, error: 'User not found.' };
    }

    if (!newPasswordPlain || newPasswordPlain.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const newHash = await bcrypt.hash(newPasswordPlain, 10);

    await db.execute({
      sql: `UPDATE users SET password_hash = ? WHERE id = ?;`,
      args: [newHash, userId],
    });

    await AdminAuditRepo.logAction({
      adminId: adminInfo.id,
      adminEmail: adminInfo.email,
      action: 'ADMIN_RESET_USER_PASSWORD',
      status: 'success',
      targetId: userId,
      targetResource: `user:${userId}`,
      detailsJson: JSON.stringify({ message: 'Password hash reset by administrator' }),
      ipAddress: adminInfo.ip,
      userAgent: adminInfo.userAgent,
    });

    return { success: true };
  }
}
