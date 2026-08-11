import { getDb } from '../db/index';
import { VisitorLead } from '../types';

export class LeadRepo {
  static async findByTenant(tenantId: string, chatbotId?: string): Promise<VisitorLead[]> {
    const db = getDb();
    let sql = `SELECT * FROM leads WHERE tenant_id = ?`;
    const args: any[] = [tenantId];

    if (chatbotId) {
      sql += ` AND chatbot_id = ?`;
      args.push(chatbotId);
    }
    sql += ` ORDER BY captured_at DESC;`;

    const res = await db.execute({ sql, args });
    return res.rows.map(r => ({
      id: String(r.id),
      chatbotId: String(r.chatbot_id),
      tenantId: String(r.tenant_id),
      conversationId: String(r.conversation_id),
      name: String(r.name),
      email: String(r.email),
      phone: r.phone ? String(r.phone) : undefined,
      company: r.company ? String(r.company) : undefined,
      capturedAt: String(r.captured_at),
      firstQuestion: r.first_question ? String(r.first_question) : undefined,
    }));
  }

  static async create(lead: VisitorLead): Promise<VisitorLead> {
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO leads (id, chatbot_id, tenant_id, conversation_id, name, email, phone, company, first_question, captured_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        lead.id,
        lead.chatbotId,
        lead.tenantId,
        lead.conversationId,
        lead.name || 'Anonymous Lead',
        lead.email,
        lead.phone || null,
        lead.company || null,
        lead.firstQuestion || null,
        lead.capturedAt || new Date().toISOString(),
      ],
    });
    return lead;
  }
}
