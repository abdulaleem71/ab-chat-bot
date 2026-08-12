import { getDb } from '../db/index';
import { newId } from '../lib/ids';
import { Conversation, Message, GroundingSource } from '../types';

export class ConversationRepo {
  static async findByTenant(tenantId: string, chatbotId?: string): Promise<Conversation[]> {
    const db = getDb();
    let sql = `SELECT * FROM conversations WHERE tenant_id = ?`;
    const args: any[] = [tenantId];

    if (chatbotId) {
      sql += ` AND chatbot_id = ?`;
      args.push(chatbotId);
    }
    sql += ` ORDER BY last_message_time DESC;`;

    const res = await db.execute({ sql, args });
    return res.rows.map(r => this.mapRowToConversation(r));
  }

  static async findById(id: string, tenantId?: string): Promise<Conversation | null> {
    const db = getDb();
    let sql = `SELECT * FROM conversations WHERE id = ?`;
    const args: any[] = [id];

    if (tenantId) {
      sql += ` AND tenant_id = ?`;
      args.push(tenantId);
    }
    sql += ` LIMIT 1;`;

    const res = await db.execute({ sql, args });
    if (res.rows.length === 0) return null;
    return this.mapRowToConversation(res.rows[0]);
  }

  static async create(conv: Conversation): Promise<Conversation> {
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO conversations (
        id, chatbot_id, tenant_id, visitor_id, visitor_name, visitor_email, visitor_location,
        visitor_browser, page_url, status, last_message, last_message_time, unread_by_agent, csat_rating, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        conv.id,
        conv.chatbotId,
        conv.tenantId,
        conv.visitorId,
        conv.visitorName || '',
        conv.visitorEmail || '',
        conv.visitorLocation || 'Unknown',
        conv.visitorBrowser || 'Web Browser',
        conv.pageUrl || '',
        conv.status || 'active',
        conv.lastMessage || '',
        conv.lastMessageTime || new Date().toISOString(),
        conv.unreadByAgent ? 1 : 0,
        conv.csatRating || null,
        conv.createdAt || new Date().toISOString(),
      ],
    });
    return conv;
  }

  static async updateLastMessage(id: string, lastMessage: string, timestamp: string, unreadByAgent: boolean = true): Promise<void> {
    const db = getDb();
    await db.execute({
      sql: `UPDATE conversations SET last_message = ?, last_message_time = ?, unread_by_agent = ? WHERE id = ?;`,
      args: [lastMessage, timestamp, unreadByAgent ? 1 : 0, id],
    });
  }

  static async findMessagesByConversation(conversationId: string): Promise<Message[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC;`,
      args: [conversationId],
    });

    return res.rows.map(r => {
      let sources: GroundingSource[] = [];
      if (r.sources_json) {
        try {
          sources = JSON.parse(String(r.sources_json));
        } catch {
          sources = [];
        }
      }

      return {
        id: String(r.id),
        conversationId: String(r.conversation_id),
        chatbotId: String(r.chatbot_id),
        sender: String(r.sender) as any,
        agentName: r.agent_name ? String(r.agent_name) : undefined,
        content: String(r.content),
        sourcesUsed: sources.length > 0 ? sources : undefined,
        timestamp: String(r.created_at),
      };
    });
  }

  static async addMessage(msg: Message, tenantId: string): Promise<Message> {
    const db = getDb();
    const sourcesJson = msg.sourcesUsed ? JSON.stringify(msg.sourcesUsed) : null;

    await db.execute({
      sql: `INSERT INTO messages (id, conversation_id, chatbot_id, tenant_id, sender, agent_name, content, sources_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        msg.id,
        msg.conversationId,
        msg.chatbotId,
        tenantId,
        msg.sender,
        msg.agentName || null,
        msg.content,
        sourcesJson,
        msg.timestamp,
      ],
    });

    await this.updateLastMessage(msg.conversationId, msg.content, msg.timestamp);
    return msg;
  }

  static async addAgentMessage(
    conversationId: string,
    chatbotId: string,
    tenantId: string,
    content: string,
    agentName?: string
  ): Promise<Message> {
    const now = new Date().toISOString();
    const msg: Message = {
      id: newId('msg_a'),
      conversationId,
      chatbotId,
      sender: 'agent',
      agentName: agentName || 'Support Agent',
      content,
      timestamp: now,
    };

    await this.addMessage(msg, tenantId);
    // Agent replies mark the conversation as read by the agent.
    await this.updateLastMessage(conversationId, content, now, false);
    return msg;
  }

  static async updateStatus(id: string, tenantId: string, status: Conversation['status']): Promise<Conversation | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const db = getDb();
    await db.execute({
      sql: `UPDATE conversations SET status = ? WHERE id = ? AND tenant_id = ?;`,
      args: [status, id, tenantId],
    });

    return { ...existing, status };
  }

  private static mapRowToConversation(r: any): Conversation {
    return {
      id: String(r.id),
      chatbotId: String(r.chatbot_id),
      tenantId: String(r.tenant_id),
      visitorId: String(r.visitor_id),
      visitorName: r.visitor_name ? String(r.visitor_name) : undefined,
      visitorEmail: r.visitor_email ? String(r.visitor_email) : undefined,
      visitorLocation: r.visitor_location ? String(r.visitor_location) : undefined,
      visitorBrowser: r.visitor_browser ? String(r.visitor_browser) : undefined,
      pageUrl: r.page_url ? String(r.page_url) : undefined,
      status: (r.status || 'active') as any,
      lastMessage: String(r.last_message || ''),
      lastMessageTime: String(r.last_message_time || ''),
      unreadByAgent: Number(r.unread_by_agent) === 1,
      csatRating: r.csat_rating ? Number(r.csat_rating) : undefined,
      createdAt: String(r.created_at),
    };
  }
}
