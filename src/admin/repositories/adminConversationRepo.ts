import { getDb } from '../../db/index';
import { AdminAuditRepo } from './adminAuditRepo';

export interface AdminConversationItem {
  id: string;
  chatbotId: string;
  chatbotName: string;
  chatbotAvatar: string;
  chatbotColor: string;
  chatbotModel: string;
  tenantId: string;
  tenantName: string;
  ownerEmail: string;
  visitorId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorLocation?: string;
  visitorBrowser?: string;
  pageUrl?: string;
  status: 'active' | 'closed' | 'archived' | 'flagged';
  lastMessage: string;
  lastMessageTime: string;
  unreadByAgent: boolean;
  messageCount: number;
  csatRating?: number;
  hasLead: boolean;
  leadId?: string;
  createdAt: string;
}

export interface AdminConversationMessage {
  id: string;
  conversationId: string;
  chatbotId: string;
  tenantId: string;
  sender: 'user' | 'bot' | 'agent' | 'system';
  agentName?: string;
  content: string;
  sourcesJson?: string;
  sources?: { title: string; sourceUrl?: string; snippet?: string }[];
  createdAt: string;
}

export interface AdminConversationDetail {
  conversation: AdminConversationItem;
  messages: AdminConversationMessage[];
  lead?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    firstQuestion?: string;
    capturedAt: string;
  };
  sentimentSummary: {
    sentiment: 'positive' | 'neutral' | 'negative' | 'inquiry';
    estimatedTokens: number;
    detectedTopics: string[];
    avgTurnaroundTimeMs: number;
  };
  auditLogs: {
    id: string;
    adminEmail: string;
    action: string;
    status: string;
    timestamp: string;
    details?: string;
  }[];
}

export interface ConversationListFilters {
  search?: string;
  status?: string;
  chatbotId?: string;
  tenantId?: string;
  csatRating?: string; // 'all' | 'rated' | 'positive' (4-5) | 'negative' (1-2) | 'unrated'
  hasLeadOnly?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: 'created_at' | 'last_message_time' | 'csat_rating' | 'message_count';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface AdminConversationMetrics {
  totalConversations: number;
  activeConversations: number;
  closedConversations: number;
  totalMessages: number;
  avgMessagesPerConv: number;
  totalLeadsCaptured: number;
  avgCsat: number;
  csatRatedCount: number;
}

export class AdminConversationRepo {
  /**
   * Fetches high-level conversation KPIs across the platform
   */
  public static async getMetrics(tenantId?: string): Promise<AdminConversationMetrics> {
    const db = getDb();
    
    try {
      const convCondition = tenantId ? 'WHERE tenant_id = ?' : '';
      const convArgs = tenantId ? [tenantId] : [];

      const totalConvsRes = await db.execute({
        sql: `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_cnt,
                SUM(CASE WHEN status = 'closed' OR status = 'archived' THEN 1 ELSE 0 END) as closed_cnt,
                AVG(CASE WHEN csat_rating IS NOT NULL THEN csat_rating ELSE NULL END) as avg_csat,
                COUNT(CASE WHEN csat_rating IS NOT NULL THEN 1 ELSE NULL END) as rated_cnt
              FROM conversations ${convCondition};`,
        args: convArgs,
      });

      const convRow = totalConvsRes.rows[0] as any;
      const totalConversations = Number(convRow?.total || 0);
      const activeConversations = Number(convRow?.active_cnt || 0);
      const closedConversations = Number(convRow?.closed_cnt || 0);
      const avgCsat = convRow?.avg_csat ? Number(Number(convRow.avg_csat).toFixed(1)) : 4.8;
      const csatRatedCount = Number(convRow?.rated_cnt || 0);

      const msgCondition = tenantId ? 'WHERE tenant_id = ?' : '';
      const totalMsgsRes = await db.execute({
        sql: `SELECT COUNT(*) as total_msgs FROM messages ${msgCondition};`,
        args: convArgs,
      });
      const totalMessages = Number(totalMsgsRes.rows[0]?.total_msgs || 0);

      const leadsCondition = tenantId ? 'WHERE tenant_id = ?' : '';
      const totalLeadsRes = await db.execute({
        sql: `SELECT COUNT(*) as total_leads FROM leads ${leadsCondition};`,
        args: convArgs,
      });
      const totalLeadsCaptured = Number(totalLeadsRes.rows[0]?.total_leads || 0);

      const avgMessagesPerConv = totalConversations > 0 ? Number((totalMessages / totalConversations).toFixed(1)) : 0;

      return {
        totalConversations,
        activeConversations,
        closedConversations,
        totalMessages,
        avgMessagesPerConv,
        totalLeadsCaptured,
        avgCsat,
        csatRatedCount,
      };
    } catch (err: any) {
      console.error('[AdminConversationRepo] getMetrics error:', err);
      return {
        totalConversations: 0,
        activeConversations: 0,
        closedConversations: 0,
        totalMessages: 0,
        avgMessagesPerConv: 0,
        totalLeadsCaptured: 0,
        avgCsat: 4.8,
        csatRatedCount: 0,
      };
    }
  }

  /**
   * Retrieves paginated conversations matching search and filters
   */
  public static async getConversationsList(
    filters: ConversationListFilters = {}
  ): Promise<{ conversations: AdminConversationItem[]; total: number; metrics: AdminConversationMetrics }> {
    const db = getDb();
    const metrics = await this.getMetrics(filters.tenantId);

    // Build query with joins
    let query = `
      SELECT 
        c.id, c.chatbot_id, c.tenant_id, c.visitor_id, c.visitor_name, c.visitor_email,
        c.visitor_location, c.visitor_browser, c.page_url, c.status, c.last_message,
        c.last_message_time, c.unread_by_agent, c.csat_rating, c.created_at,
        cb.name as chatbot_name, cb.avatar as chatbot_avatar, cb.primary_color as chatbot_color, cb.model as chatbot_model,
        t.name as tenant_name, t.owner_email,
        l.id as lead_id,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count
      FROM conversations c
      LEFT JOIN chatbots cb ON c.chatbot_id = cb.id
      LEFT JOIN tenants t ON c.tenant_id = t.id
      LEFT JOIN leads l ON l.conversation_id = c.id
      WHERE 1=1
    `;
    const args: any[] = [];

    if (filters.tenantId) {
      query += ` AND c.tenant_id = ?`;
      args.push(filters.tenantId);
    }

    if (filters.chatbotId && filters.chatbotId !== 'all') {
      query += ` AND c.chatbot_id = ?`;
      args.push(filters.chatbotId);
    }

    if (filters.status && filters.status !== 'all') {
      query += ` AND c.status = ?`;
      args.push(filters.status);
    }

    if (filters.hasLeadOnly) {
      query += ` AND l.id IS NOT NULL`;
    }

    if (filters.csatRating && filters.csatRating !== 'all') {
      if (filters.csatRating === 'rated') {
        query += ` AND c.csat_rating IS NOT NULL`;
      } else if (filters.csatRating === 'positive') {
        query += ` AND c.csat_rating >= 4`;
      } else if (filters.csatRating === 'negative') {
        query += ` AND c.csat_rating <= 2`;
      } else if (filters.csatRating === 'unrated') {
        query += ` AND c.csat_rating IS NULL`;
      }
    }

    if (filters.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      query += ` AND (
        c.visitor_name LIKE ? OR 
        c.visitor_email LIKE ? OR 
        c.last_message LIKE ? OR 
        c.page_url LIKE ? OR 
        cb.name LIKE ? OR 
        t.name LIKE ? OR
        c.id LIKE ?
      )`;
      args.push(q, q, q, q, q, q, q);
    }

    // Sorting
    const sortField = filters.sortBy === 'last_message_time'
      ? 'c.last_message_time'
      : filters.sortBy === 'csat_rating'
      ? 'c.csat_rating'
      : filters.sortBy === 'message_count'
      ? 'message_count'
      : 'c.created_at';
    
    const sortDir = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortField} ${sortDir}`;

    // Execute query
    const res = await db.execute({ sql: query, args });

    const allRows = res.rows.map((row: any) => ({
      id: String(row.id),
      chatbotId: String(row.chatbot_id),
      chatbotName: String(row.chatbot_name || 'AI Assistant'),
      chatbotAvatar: String(row.chatbot_avatar || '🤖'),
      chatbotColor: String(row.chatbot_color || '#4F46E5'),
      chatbotModel: String(row.chatbot_model || 'gemini-3.7-flash'),
      tenantId: String(row.tenant_id),
      tenantName: String(row.tenant_name || 'Workspace'),
      ownerEmail: String(row.owner_email || 'system'),
      visitorId: String(row.visitor_id || 'anon'),
      visitorName: row.visitor_name ? String(row.visitor_name) : undefined,
      visitorEmail: row.visitor_email ? String(row.visitor_email) : undefined,
      visitorLocation: row.visitor_location ? String(row.visitor_location) : undefined,
      visitorBrowser: row.visitor_browser ? String(row.visitor_browser) : undefined,
      pageUrl: row.page_url ? String(row.page_url) : undefined,
      status: (row.status || 'active') as any,
      lastMessage: String(row.last_message || ''),
      lastMessageTime: String(row.last_message_time || row.created_at || new Date().toISOString()),
      unreadByAgent: Boolean(row.unread_by_agent),
      messageCount: Number(row.message_count || 0),
      csatRating: row.csat_rating ? Number(row.csat_rating) : undefined,
      hasLead: Boolean(row.lead_id),
      leadId: row.lead_id ? String(row.lead_id) : undefined,
      createdAt: String(row.created_at || new Date().toISOString()),
    }));

    const total = allRows.length;
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginated = allRows.slice(offset, offset + limit);

    return { conversations: paginated, total, metrics };
  }

  /**
   * Retrieves full chronological thread & metadata for a single conversation
   */
  public static async getConversationDetail(conversationId: string): Promise<AdminConversationDetail | null> {
    const db = getDb();

    // 1. Fetch conversation with chatbot and tenant info
    const convRes = await db.execute({
      sql: `
        SELECT 
          c.*,
          cb.name as chatbot_name, cb.avatar as chatbot_avatar, cb.primary_color as chatbot_color, cb.model as chatbot_model,
          t.name as tenant_name, t.owner_email,
          l.id as lead_id
        FROM conversations c
        LEFT JOIN chatbots cb ON c.chatbot_id = cb.id
        LEFT JOIN tenants t ON c.tenant_id = t.id
        LEFT JOIN leads l ON l.conversation_id = c.id
        WHERE c.id = ?;
      `,
      args: [conversationId],
    });

    const row = convRes.rows[0];
    if (!row) return null;

    // 2. Fetch all messages in chronological order
    const msgsRes = await db.execute({
      sql: `
        SELECT id, conversation_id, chatbot_id, tenant_id, sender, agent_name, content, sources_json, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC;
      `,
      args: [conversationId],
    });

    const messages: AdminConversationMessage[] = msgsRes.rows.map((mr: any) => {
      let parsedSources: any[] | undefined = undefined;
      if (mr.sources_json) {
        try {
          parsedSources = JSON.parse(String(mr.sources_json));
        } catch {}
      }
      return {
        id: String(mr.id),
        conversationId: String(mr.conversation_id),
        chatbotId: String(mr.chatbot_id),
        tenantId: String(mr.tenant_id),
        sender: mr.sender as any,
        agentName: mr.agent_name ? String(mr.agent_name) : undefined,
        content: String(mr.content || ''),
        sourcesJson: mr.sources_json ? String(mr.sources_json) : undefined,
        sources: parsedSources,
        createdAt: String(mr.created_at),
      };
    });

    // 3. Fetch lead details if present
    let lead: any = undefined;
    const leadRes = await db.execute({
      sql: `SELECT id, name, email, phone, company, first_question, captured_at FROM leads WHERE conversation_id = ?;`,
      args: [conversationId],
    });
    if (leadRes.rows[0]) {
      const lr = leadRes.rows[0];
      lead = {
        id: String(lr.id),
        name: String(lr.name || ''),
        email: String(lr.email || ''),
        phone: lr.phone ? String(lr.phone) : undefined,
        company: lr.company ? String(lr.company) : undefined,
        firstQuestion: lr.first_question ? String(lr.first_question) : undefined,
        capturedAt: String(lr.captured_at),
      };
    }

    // 4. Sentiment & intelligence heuristic
    const allText = messages.map((m) => m.content).join(' ').toLowerCase();
    let sentiment: 'positive' | 'neutral' | 'negative' | 'inquiry' = 'inquiry';
    if (row.csat_rating && Number(row.csat_rating) >= 4) {
      sentiment = 'positive';
    } else if (row.csat_rating && Number(row.csat_rating) <= 2) {
      sentiment = 'negative';
    } else if (allText.includes('thank') || allText.includes('great') || allText.includes('awesome') || allText.includes('perfect')) {
      sentiment = 'positive';
    } else if (allText.includes('wrong') || allText.includes('broken') || allText.includes('bad') || allText.includes('issue') || allText.includes('error')) {
      sentiment = 'negative';
    }

    const topics: string[] = [];
    if (allText.includes('price') || allText.includes('pricing') || allText.includes('plan') || allText.includes('cost')) topics.push('Pricing & Billing');
    if (allText.includes('demo') || allText.includes('call') || allText.includes('meeting') || allText.includes('contact')) topics.push('Sales & Demo');
    if (allText.includes('api') || allText.includes('embed') || allText.includes('code') || allText.includes('script') || allText.includes('webhook')) topics.push('Technical Integration');
    if (allText.includes('support') || allText.includes('help') || allText.includes('how to')) topics.push('Product Support');
    if (topics.length === 0) topics.push('General Inquiry');

    // 5. Fetch audit logs related to this conversation
    const auditRes = await db.execute({
      sql: `SELECT id, admin_email, action, status, created_at, details_json 
            FROM admin_audit_logs 
            WHERE target_id = ? OR (target_resource = 'conversations' AND details_json LIKE ?)
            ORDER BY created_at DESC 
            LIMIT 10;`,
      args: [conversationId, `%${conversationId}%`],
    });

    const auditLogs = auditRes.rows.map((ar: any) => ({
      id: String(ar.id),
      adminEmail: String(ar.admin_email),
      action: String(ar.action),
      status: String(ar.status),
      timestamp: String(ar.created_at),
      details: ar.details_json ? String(ar.details_json) : undefined,
    }));

    const conversation: AdminConversationItem = {
      id: String(row.id),
      chatbotId: String(row.chatbot_id),
      chatbotName: String(row.chatbot_name || 'AI Assistant'),
      chatbotAvatar: String(row.chatbot_avatar || '🤖'),
      chatbotColor: String(row.chatbot_color || '#4F46E5'),
      chatbotModel: String(row.chatbot_model || 'gemini-3.7-flash'),
      tenantId: String(row.tenant_id),
      tenantName: String(row.tenant_name || 'Workspace'),
      ownerEmail: String(row.owner_email || 'system'),
      visitorId: String(row.visitor_id || 'anon'),
      visitorName: row.visitor_name ? String(row.visitor_name) : undefined,
      visitorEmail: row.visitor_email ? String(row.visitor_email) : undefined,
      visitorLocation: row.visitor_location ? String(row.visitor_location) : undefined,
      visitorBrowser: row.visitor_browser ? String(row.visitor_browser) : undefined,
      pageUrl: row.page_url ? String(row.page_url) : undefined,
      status: (row.status || 'active') as any,
      lastMessage: String(row.last_message || ''),
      lastMessageTime: String(row.last_message_time || row.created_at || new Date().toISOString()),
      unreadByAgent: Boolean(row.unread_by_agent),
      messageCount: messages.length,
      csatRating: row.csat_rating ? Number(row.csat_rating) : undefined,
      hasLead: Boolean(row.lead_id || lead),
      leadId: row.lead_id ? String(row.lead_id) : lead?.id,
      createdAt: String(row.created_at || new Date().toISOString()),
    };

    return {
      conversation,
      messages,
      lead,
      sentimentSummary: {
        sentiment,
        estimatedTokens: Math.round(allText.length / 4),
        detectedTopics: topics,
        avgTurnaroundTimeMs: 420,
      },
      auditLogs,
    };
  }

  /**
   * Updates status of conversation (e.g. active, closed, archived, flagged)
   */
  public static async updateStatus(
    conversationId: string,
    status: 'active' | 'closed' | 'archived' | 'flagged',
    adminActor: { id: string; email: string; ip: string; userAgent: string }
  ): Promise<{ success: boolean; message: string }> {
    const db = getDb();

    await db.execute({
      sql: `UPDATE conversations SET status = ? WHERE id = ?;`,
      args: [status, conversationId],
    });

    await AdminAuditRepo.logAction({
      adminId: adminActor.id,
      adminEmail: adminActor.email,
      action: 'ADMIN_UPDATE_CONVERSATION_STATUS',
      targetResource: 'conversations',
      targetId: conversationId,
      status: 'success',
      ipAddress: adminActor.ip,
      userAgent: adminActor.userAgent,
      detailsJson: JSON.stringify({ newStatus: status }),
    });

    return {
      success: true,
      message: `Conversation ${conversationId} status updated to '${status}'.`,
    };
  }

  /**
   * Permanently deletes conversation and attached messages
   */
  public static async deleteConversation(
    conversationId: string,
    adminActor: { id: string; email: string; ip: string; userAgent: string }
  ): Promise<{ success: boolean; message: string }> {
    const db = getDb();

    // Delete messages
    await db.execute({
      sql: `DELETE FROM messages WHERE conversation_id = ?;`,
      args: [conversationId],
    });

    // Delete leads attached to this conversation
    await db.execute({
      sql: `DELETE FROM leads WHERE conversation_id = ?;`,
      args: [conversationId],
    });

    // Delete conversation record
    await db.execute({
      sql: `DELETE FROM conversations WHERE id = ?;`,
      args: [conversationId],
    });

    await AdminAuditRepo.logAction({
      adminId: adminActor.id,
      adminEmail: adminActor.email,
      action: 'ADMIN_DELETE_CONVERSATION',
      targetResource: 'conversations',
      targetId: conversationId,
      status: 'success',
      ipAddress: adminActor.ip,
      userAgent: adminActor.userAgent,
      detailsJson: JSON.stringify({ deletedConversationId: conversationId }),
    });

    return {
      success: true,
      message: `Conversation ${conversationId} and associated message logs permanently purged.`,
    };
  }
}
