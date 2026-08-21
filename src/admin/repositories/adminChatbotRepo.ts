import crypto from 'crypto';
import { getDb } from '../../db/index';
import { AdminAuditRepo } from './adminAuditRepo';
import { Chatbot } from '../../types';

export interface AdminChatbotListItem {
  id: string;
  name: string;
  description?: string;
  websiteUrl?: string;
  allowedDomains: string[];
  domainLockEnabled: boolean;
  embedSecretKey?: string;
  model: string;
  tone: string;
  status: 'active' | 'inactive' | 'archived';
  primaryColor: string;
  avatar: string;
  greetingMessage?: string;
  collectLeadEmail: boolean;
  tenantId: string;
  tenantName: string;
  ownerEmail: string;
  userId?: string;
  userName?: string;
  conversationsCount: number;
  messagesCount: number;
  leadsCount: number;
  knowledgeSourcesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminChatbotDetail {
  chatbot: Chatbot & {
    tenantName: string;
    ownerEmail: string;
    userName?: string;
  };
  tenant: {
    id: string;
    name: string;
    ownerEmail: string;
    plan: string;
  };
  stats: {
    totalConversations: number;
    totalMessages: number;
    totalLeads: number;
    totalKnowledgeSources: number;
    avgCsat: number;
  };
  knowledgeSources: Array<{
    id: string;
    type: string;
    title: string;
    status: string;
    tokenCount?: number;
    createdAt: string;
  }>;
  leads: Array<{
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    firstQuestion?: string;
    capturedAt: string;
    conversationId?: string;
  }>;
  recentConversations: Array<{
    id: string;
    visitorName?: string;
    visitorEmail?: string;
    visitorLocation?: string;
    visitorBrowser?: string;
    status: string;
    lastMessage?: string;
    lastMessageTime?: string;
    csatRating?: number;
    createdAt: string;
    messageCount?: number;
  }>;
  auditLogs: Array<{
    id: string;
    adminEmail: string;
    action: string;
    status: string;
    detailsJson?: string;
    createdAt: string;
  }>;
}

export interface ChatbotsFilterOptions {
  search?: string;
  status?: string;
  model?: string;
  domainLock?: 'locked' | 'unlocked' | 'all';
  tenantId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'conversations_count';
  sortOrder?: 'ASC' | 'DESC';
}

export class AdminChatbotRepo {
  /**
   * Query all chatbots across tenants with aggregation of conversations, leads, and knowledge base stats.
   */
  static async getChatbotsList(options: ChatbotsFilterOptions = {}): Promise<{ chatbots: AdminChatbotListItem[]; total: number }> {
    const db = getDb();
    const limit = Math.min(options.limit || 50, 100);
    const offset = options.offset || 0;
    const sortCol = options.sortBy === 'name' ? 'c.name' : options.sortBy === 'updated_at' ? 'c.updated_at' : 'c.created_at';
    const sortOrder = options.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const conditions: string[] = ["c.status != 'archived'"];
    const args: any[] = [];

    if (options.status && options.status !== 'all') {
      conditions.push('c.status = ?');
      args.push(options.status);
    }

    if (options.model && options.model !== 'all') {
      conditions.push('c.model = ?');
      args.push(options.model);
    }

    if (options.domainLock === 'locked') {
      conditions.push('c.domain_lock_enabled = 1');
    } else if (options.domainLock === 'unlocked') {
      conditions.push('c.domain_lock_enabled = 0');
    }

    if (options.tenantId) {
      conditions.push('c.tenant_id = ?');
      args.push(options.tenantId);
    }

    if (options.search && options.search.trim()) {
      const searchTerm = `%${options.search.trim().toLowerCase()}%`;
      conditions.push(
        '(LOWER(c.name) LIKE ? OR LOWER(c.description) LIKE ? OR LOWER(c.website_url) LIKE ? OR LOWER(c.id) LIKE ? OR LOWER(t.name) LIKE ? OR LOWER(t.owner_email) LIKE ?)'
      );
      args.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Total count
    const countRes = await db.execute({
      sql: `SELECT COUNT(*) as count FROM chatbots c LEFT JOIN tenants t ON c.tenant_id = t.id ${whereClause};`,
      args: [...args],
    });
    const total = Number(countRes.rows[0]?.count || 0);

    // 2. Fetch chatbots list with owner info
    const querySql = `
      SELECT 
        c.*,
        t.name as tenant_name,
        t.owner_email,
        u.name as user_name,
        u.email as user_email
      FROM chatbots c
      LEFT JOIN tenants t ON c.tenant_id = t.id
      LEFT JOIN users u ON c.user_id = u.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?;
    `;
    const rowsRes = await db.execute({
      sql: querySql,
      args: [...args, limit, offset],
    });

    const chatbotIds = rowsRes.rows.map((r: any) => String(r.id));

    // Aggregate stats for each bot in batch if there are bots
    const convCountMap: Record<string, number> = {};
    const leadCountMap: Record<string, number> = {};
    const kbCountMap: Record<string, number> = {};
    const msgCountMap: Record<string, number> = {};

    if (chatbotIds.length > 0) {
      const placeholders = chatbotIds.map(() => '?').join(',');

      try {
        const [convRes, leadRes, kbRes, msgRes] = await Promise.all([
          db.execute({
            sql: `SELECT chatbot_id, COUNT(*) as count FROM conversations WHERE chatbot_id IN (${placeholders}) GROUP BY chatbot_id;`,
            args: [...chatbotIds],
          }),
          db.execute({
            sql: `SELECT chatbot_id, COUNT(*) as count FROM leads WHERE chatbot_id IN (${placeholders}) GROUP BY chatbot_id;`,
            args: [...chatbotIds],
          }),
          db.execute({
            sql: `SELECT chatbot_id, COUNT(*) as count FROM knowledge_sources WHERE chatbot_id IN (${placeholders}) GROUP BY chatbot_id;`,
            args: [...chatbotIds],
          }),
          db.execute({
            sql: `SELECT c.chatbot_id, COUNT(m.id) as count 
                  FROM messages m 
                  JOIN conversations c ON m.conversation_id = c.id 
                  WHERE c.chatbot_id IN (${placeholders}) 
                  GROUP BY c.chatbot_id;`,
            args: [...chatbotIds],
          }),
        ]);

        convRes.rows.forEach((r: any) => {
          convCountMap[String(r.chatbot_id)] = Number(r.count || 0);
        });
        leadRes.rows.forEach((r: any) => {
          leadCountMap[String(r.chatbot_id)] = Number(r.count || 0);
        });
        kbRes.rows.forEach((r: any) => {
          kbCountMap[String(r.chatbot_id)] = Number(r.count || 0);
        });
        msgRes.rows.forEach((r: any) => {
          msgCountMap[String(r.chatbot_id)] = Number(r.count || 0);
        });
      } catch (err) {
        console.warn('[AdminChatbotRepo] Warning: error querying aggregated stats:', err);
      }
    }

    const chatbots: AdminChatbotListItem[] = rowsRes.rows.map((r: any) => {
      let allowedDomains: string[] = [];
      try {
        if (r.allowed_domains_json) {
          allowedDomains = JSON.parse(r.allowed_domains_json);
        }
      } catch {
        allowedDomains = [];
      }

      return {
        id: String(r.id),
        name: String(r.name || 'Untitled Bot'),
        description: r.description ? String(r.description) : undefined,
        websiteUrl: r.website_url ? String(r.website_url) : undefined,
        allowedDomains: Array.isArray(allowedDomains) ? allowedDomains : [],
        domainLockEnabled: r.domain_lock_enabled === 1 || r.domain_lock_enabled === true,
        embedSecretKey: r.embed_secret_key ? String(r.embed_secret_key) : undefined,
        model: String(r.model || 'gemini-3.7-flash'),
        tone: String(r.tone || 'Friendly'),
        status: (r.status as any) || 'active',
        primaryColor: String(r.primary_color || '#4F46E5'),
        avatar: String(r.avatar || '🤖'),
        greetingMessage: r.greeting_message ? String(r.greeting_message) : undefined,
        collectLeadEmail: r.collect_lead_email === 1 || r.collect_lead_email === true,
        tenantId: String(r.tenant_id),
        tenantName: String(r.tenant_name || 'Workspace'),
        ownerEmail: String(r.owner_email || r.user_email || 'unknown@example.com'),
        userId: r.user_id ? String(r.user_id) : undefined,
        userName: r.user_name ? String(r.user_name) : undefined,
        conversationsCount: convCountMap[String(r.id)] || 0,
        messagesCount: msgCountMap[String(r.id)] || 0,
        leadsCount: leadCountMap[String(r.id)] || 0,
        knowledgeSourcesCount: kbCountMap[String(r.id)] || 0,
        createdAt: String(r.created_at || new Date().toISOString()),
        updatedAt: String(r.updated_at || new Date().toISOString()),
      };
    });

    return { chatbots, total };
  }

  /**
   * Deep Chatbot Inspection: Profile, Embed keys, Domain Locks, Knowledge Base Sources, Visitor Leads, Conversations, Audit Trail.
   */
  static async getChatbotDetail(chatbotId: string): Promise<AdminChatbotDetail | null> {
    const db = getDb();

    // 1. Fetch Chatbot row with Tenant & User info
    const botRes = await db.execute({
      sql: `
        SELECT 
          c.*,
          t.name as tenant_name,
          t.owner_email,
          t.plan as tenant_plan,
          u.name as user_name,
          u.email as user_email
        FROM chatbots c
        LEFT JOIN tenants t ON c.tenant_id = t.id
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ? LIMIT 1;
      `,
      args: [chatbotId],
    });

    if (botRes.rows.length === 0) return null;
    const r: any = botRes.rows[0];

    let suggestedQuestions: string[] = [];
    try {
      if (r.suggested_questions_json) {
        suggestedQuestions = JSON.parse(r.suggested_questions_json);
      }
    } catch {
      suggestedQuestions = [];
    }

    let allowedDomains: string[] = [];
    try {
      if (r.allowed_domains_json) {
        allowedDomains = JSON.parse(r.allowed_domains_json);
      }
    } catch {
      allowedDomains = [];
    }

    const chatbotData: any = {
      id: String(r.id),
      tenantId: String(r.tenant_id),
      userId: r.user_id ? String(r.user_id) : undefined,
      name: String(r.name || 'Untitled Bot'),
      description: r.description ? String(r.description) : '',
      websiteUrl: r.website_url ? String(r.website_url) : '',
      allowedDomains: Array.isArray(allowedDomains) ? allowedDomains : [],
      domainLockEnabled: r.domain_lock_enabled === 1 || r.domain_lock_enabled === true,
      embedSecretKey: r.embed_secret_key ? String(r.embed_secret_key) : '',
      systemInstruction: r.system_instruction ? String(r.system_instruction) : '',
      tone: String(r.tone || 'Friendly'),
      primaryColor: String(r.primary_color || '#4F46E5'),
      textColor: String(r.text_color || '#FFFFFF'),
      avatar: String(r.avatar || '🤖'),
      greetingMessage: String(r.greeting_message || 'Hello! How can I help you today?'),
      suggestedQuestions: Array.isArray(suggestedQuestions) ? suggestedQuestions : [],
      model: String(r.model || 'gemini-3.7-flash'),
      fallbackMessage: String(r.fallback_message || 'Connecting to human representative...'),
      collectLeadEmail: r.collect_lead_email === 1 || r.collect_lead_email === true,
      leadTitle: String(r.lead_title || 'Leave your email'),
      humanOperatorOnline: r.human_operator_online === 1 || r.human_operator_online === true,
      status: (r.status as any) || 'active',
      createdAt: String(r.created_at || new Date().toISOString()),
      updatedAt: String(r.updated_at || new Date().toISOString()),
      tenantName: String(r.tenant_name || 'Workspace'),
      ownerEmail: String(r.owner_email || r.user_email || 'unknown@example.com'),
      userName: r.user_name ? String(r.user_name) : undefined,
    };

    // 2. Fetch Knowledge Sources
    const kbRes = await db.execute({
      sql: `SELECT id, type, title, status, chunk_count, updated_at FROM knowledge_sources WHERE chatbot_id = ? ORDER BY updated_at DESC;`,
      args: [chatbotId],
    });
    const knowledgeSources = kbRes.rows.map((kr: any) => ({
      id: String(kr.id),
      type: String(kr.type || 'text'),
      title: String(kr.title || 'Untitled Source'),
      status: String(kr.status || 'ready'),
      tokenCount: kr.chunk_count ? Number(kr.chunk_count) : undefined,
      createdAt: String(kr.updated_at || new Date().toISOString()),
    }));

    // 3. Fetch Leads
    const leadsRes = await db.execute({
      sql: `SELECT id, name, email, phone, company, first_question, captured_at, conversation_id FROM leads WHERE chatbot_id = ? ORDER BY captured_at DESC LIMIT 50;`,
      args: [chatbotId],
    });
    const leads = leadsRes.rows.map((lr: any) => ({
      id: String(lr.id),
      name: lr.name ? String(lr.name) : undefined,
      email: lr.email ? String(lr.email) : undefined,
      phone: lr.phone ? String(lr.phone) : undefined,
      company: lr.company ? String(lr.company) : undefined,
      firstQuestion: lr.first_question ? String(lr.first_question) : undefined,
      capturedAt: String(lr.captured_at || new Date().toISOString()),
      conversationId: lr.conversation_id ? String(lr.conversation_id) : undefined,
    }));

    // 4. Fetch Recent Conversations
    const convRes = await db.execute({
      sql: `SELECT * FROM conversations WHERE chatbot_id = ? ORDER BY created_at DESC LIMIT 30;`,
      args: [chatbotId],
    });
    const recentConversations = convRes.rows.map((cr: any) => ({
      id: String(cr.id),
      visitorName: cr.visitor_name ? String(cr.visitor_name) : undefined,
      visitorEmail: cr.visitor_email ? String(cr.visitor_email) : undefined,
      visitorLocation: cr.visitor_location ? String(cr.visitor_location) : undefined,
      visitorBrowser: cr.visitor_browser ? String(cr.visitor_browser) : undefined,
      status: String(cr.status || 'open'),
      lastMessage: cr.last_message ? String(cr.last_message) : undefined,
      lastMessageTime: cr.last_message_time ? String(cr.last_message_time) : undefined,
      csatRating: cr.csat_rating ? Number(cr.csat_rating) : undefined,
      createdAt: String(cr.created_at || new Date().toISOString()),
    }));

    // 5. Total message count & CSAT
    const msgCountRes = await db.execute({
      sql: `SELECT COUNT(m.id) as count FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE c.chatbot_id = ?;`,
      args: [chatbotId],
    });
    const totalMessages = Number(msgCountRes.rows[0]?.count || 0);

    const csatRes = await db.execute({
      sql: `SELECT AVG(csat_rating) as avg_rating FROM conversations WHERE chatbot_id = ? AND csat_rating IS NOT NULL;`,
      args: [chatbotId],
    });
    const avgCsat = csatRes.rows[0]?.avg_rating ? Math.round(Number(csatRes.rows[0].avg_rating) * 10) / 10 : 5.0;

    // 6. Audit logs related to this bot
    const auditRes = await db.execute({
      sql: `SELECT * FROM admin_audit_logs WHERE target_id = ? OR details_json LIKE ? ORDER BY created_at DESC LIMIT 20;`,
      args: [chatbotId, `%${chatbotId}%`],
    });
    const auditLogs = auditRes.rows.map((ar: any) => ({
      id: String(ar.id),
      adminEmail: String(ar.admin_email),
      action: String(ar.action),
      status: String(ar.status),
      detailsJson: ar.details_json ? String(ar.details_json) : undefined,
      createdAt: String(ar.created_at),
    }));

    return {
      chatbot: chatbotData,
      tenant: {
        id: String(r.tenant_id),
        name: String(r.tenant_name || 'Workspace'),
        ownerEmail: String(r.owner_email || 'unknown@example.com'),
        plan: String(r.tenant_plan || 'Pro'),
      },
      stats: {
        totalConversations: recentConversations.length,
        totalMessages,
        totalLeads: leads.length,
        totalKnowledgeSources: knowledgeSources.length,
        avgCsat,
      },
      knowledgeSources,
      leads,
      recentConversations,
      auditLogs,
    };
  }

  /**
   * Update Chatbot operational status (active/inactive/archived).
   */
  static async updateStatus(
    chatbotId: string,
    newStatus: 'active' | 'inactive' | 'archived',
    adminInfo: { id: string; email: string; ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const db = getDb();
    const existing = await this.getChatbotDetail(chatbotId);
    if (!existing) {
      return { success: false, error: 'Chatbot not found.' };
    }

    const previousStatus = existing.chatbot.status;
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE chatbots SET status = ?, updated_at = ? WHERE id = ?;`,
      args: [newStatus, now, chatbotId],
    });

    await AdminAuditRepo.logAction({
      adminId: adminInfo.id,
      adminEmail: adminInfo.email,
      action: 'UPDATE_CHATBOT_STATUS',
      targetResource: 'chatbots',
      targetId: chatbotId,
      status: 'success',
      ipAddress: adminInfo.ip,
      userAgent: adminInfo.userAgent,
      detailsJson: JSON.stringify({
        chatbotName: existing.chatbot.name,
        previousStatus,
        newStatus,
        tenantId: existing.tenant.id,
      }),
    });

    return { success: true, message: `Chatbot status updated to ${newStatus}.` };
  }

  /**
   * Update Domain Lock and Allowed Domains configuration.
   */
  static async updateDomainLockSettings(
    chatbotId: string,
    params: { domainLockEnabled: boolean; allowedDomains: string[]; websiteUrl?: string },
    adminInfo: { id: string; email: string; ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const db = getDb();
    const existing = await this.getChatbotDetail(chatbotId);
    if (!existing) {
      return { success: false, error: 'Chatbot not found.' };
    }

    // Clean domains: strip http/https and trailing slashes
    const cleanDomains = (params.allowedDomains || [])
      .map(d => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
      .filter(d => d.length > 0);

    const allowedDomainsJson = JSON.stringify(cleanDomains);
    const domainLockVal = params.domainLockEnabled ? 1 : 0;
    const websiteUrlVal = params.websiteUrl !== undefined ? params.websiteUrl.trim() : existing.chatbot.websiteUrl || '';
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE chatbots SET domain_lock_enabled = ?, allowed_domains_json = ?, website_url = ?, updated_at = ? WHERE id = ?;`,
      args: [domainLockVal, allowedDomainsJson, websiteUrlVal, now, chatbotId],
    });

    await AdminAuditRepo.logAction({
      adminId: adminInfo.id,
      adminEmail: adminInfo.email,
      action: 'UPDATE_CHATBOT_DOMAIN_LOCK',
      targetResource: 'chatbots',
      targetId: chatbotId,
      status: 'success',
      ipAddress: adminInfo.ip,
      userAgent: adminInfo.userAgent,
      detailsJson: JSON.stringify({
        chatbotName: existing.chatbot.name,
        domainLockEnabled: params.domainLockEnabled,
        allowedDomains: cleanDomains,
        websiteUrl: websiteUrlVal,
      }),
    });

    return {
      success: true,
      message: `Domain security rules updated successfully (${cleanDomains.length} allowed domains configured).`,
    };
  }

  /**
   * Regenerate Embed Secret Key (Rotates security token).
   */
  static async regenerateEmbedSecretKey(
    chatbotId: string,
    adminInfo: { id: string; email: string; ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; newSecretKey?: string; message?: string; error?: string }> {
    const db = getDb();
    const existing = await this.getChatbotDetail(chatbotId);
    if (!existing) {
      return { success: false, error: 'Chatbot not found.' };
    }

    const newSecretKey = 'bot_sec_' + crypto.randomBytes(20).toString('hex');
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE chatbots SET embed_secret_key = ?, updated_at = ? WHERE id = ?;`,
      args: [newSecretKey, now, chatbotId],
    });

    await AdminAuditRepo.logAction({
      adminId: adminInfo.id,
      adminEmail: adminInfo.email,
      action: 'REGENERATE_CHATBOT_EMBED_KEY',
      targetResource: 'chatbots',
      targetId: chatbotId,
      status: 'success',
      ipAddress: adminInfo.ip,
      userAgent: adminInfo.userAgent,
      detailsJson: JSON.stringify({
        chatbotName: existing.chatbot.name,
        previousKeyMasked: existing.chatbot.embedSecretKey ? existing.chatbot.embedSecretKey.substring(0, 8) + '...' : 'none',
      }),
    });

    return {
      success: true,
      newSecretKey,
      message: 'Embed secret key rotated and applied successfully.',
    };
  }

  /**
   * Direct Administrative Update of System Prompt, Model, Tone or Colors.
   */
  static async updateChatbotConfig(
    chatbotId: string,
    updates: {
      name?: string;
      model?: string;
      tone?: string;
      systemInstruction?: string;
      primaryColor?: string;
      greetingMessage?: string;
      fallbackMessage?: string;
    },
    adminInfo: { id: string; email: string; ip?: string; userAgent?: string }
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const db = getDb();
    const existing = await this.getChatbotDetail(chatbotId);
    if (!existing) {
      return { success: false, error: 'Chatbot not found.' };
    }

    const fields: string[] = ['updated_at = ?'];
    const args: any[] = [new Date().toISOString()];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      args.push(updates.name.trim());
    }
    if (updates.model !== undefined) {
      fields.push('model = ?');
      args.push(updates.model.trim());
    }
    if (updates.tone !== undefined) {
      fields.push('tone = ?');
      args.push(updates.tone.trim());
    }
    if (updates.systemInstruction !== undefined) {
      fields.push('system_instruction = ?');
      args.push(updates.systemInstruction.trim());
    }
    if (updates.primaryColor !== undefined) {
      fields.push('primary_color = ?');
      args.push(updates.primaryColor.trim());
    }
    if (updates.greetingMessage !== undefined) {
      fields.push('greeting_message = ?');
      args.push(updates.greetingMessage.trim());
    }
    if (updates.fallbackMessage !== undefined) {
      fields.push('fallback_message = ?');
      args.push(updates.fallbackMessage.trim());
    }

    args.push(chatbotId);

    await db.execute({
      sql: `UPDATE chatbots SET ${fields.join(', ')} WHERE id = ?;`,
      args,
    });

    await AdminAuditRepo.logAction({
      adminId: adminInfo.id,
      adminEmail: adminInfo.email,
      action: 'ADMIN_UPDATE_CHATBOT_CONFIG',
      targetResource: 'chatbots',
      targetId: chatbotId,
      status: 'success',
      ipAddress: adminInfo.ip,
      userAgent: adminInfo.userAgent,
      detailsJson: JSON.stringify({
        chatbotName: updates.name || existing.chatbot.name,
        modifiedFields: Object.keys(updates),
      }),
    });

    return { success: true, message: 'Chatbot configuration updated successfully.' };
  }
}
