import { getDb } from '../db/index';
import { Chatbot } from '../types';

export class ChatbotRepo {
  static async findByTenant(tenantId: string): Promise<Chatbot[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM chatbots WHERE tenant_id = ? AND status != 'archived' ORDER BY created_at DESC;`,
      args: [tenantId],
    });

    return res.rows.map(r => this.mapRowToChatbot(r));
  }

  static async findById(id: string, tenantId?: string): Promise<Chatbot | null> {
    const db = getDb();
    let sql = `SELECT * FROM chatbots WHERE id = ? AND status != 'archived'`;
    const args: any[] = [id];

    if (tenantId) {
      sql += ` AND tenant_id = ?`;
      args.push(tenantId);
    }
    sql += ` LIMIT 1;`;

    const res = await db.execute({ sql, args });
    if (res.rows.length === 0) return null;
    return this.mapRowToChatbot(res.rows[0]);
  }

  static async create(bot: Chatbot): Promise<Chatbot> {
    const db = getDb();
    const suggestedQuestionsJson = JSON.stringify(bot.suggestedQuestions || []);

    await db.execute({
      sql: `INSERT INTO chatbots (
        id, tenant_id, user_id, name, description, system_instruction, tone, primary_color, text_color, avatar,
        greeting_message, suggested_questions_json, model, fallback_message, collect_lead_email, lead_title,
        human_operator_online, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        bot.id,
        bot.tenantId,
        (bot as any).userId || 'usr_acme_admin',
        bot.name,
        bot.description || '',
        bot.systemInstruction || '',
        bot.tone || 'Friendly',
        bot.primaryColor || '#4F46E5',
        bot.textColor || '#FFFFFF',
        bot.avatar || '🤖',
        bot.greetingMessage || 'Hello! How can I help you today?',
        suggestedQuestionsJson,
        bot.model || 'gemini-3.6-flash',
        bot.fallbackMessage || 'Connecting to human representative...',
        bot.collectLeadEmail ? 1 : 0,
        bot.leadTitle || 'Leave your email',
        bot.humanOperatorOnline ? 1 : 0,
        bot.status || 'active',
        bot.createdAt,
        bot.updatedAt,
      ],
    });

    return bot;
  }

  static async update(id: string, tenantId: string, updates: Partial<Chatbot>): Promise<Chatbot | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    const db = getDb();
    const updated: Chatbot = {
      ...existing,
      ...updates,
      id: existing.id,
      tenantId: existing.tenantId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const suggestedQuestionsJson = JSON.stringify(updated.suggestedQuestions || []);

    await db.execute({
      sql: `UPDATE chatbots SET
        name = ?, description = ?, system_instruction = ?, tone = ?, primary_color = ?,
        text_color = ?, avatar = ?, greeting_message = ?, suggested_questions_json = ?,
        model = ?, fallback_message = ?, collect_lead_email = ?, lead_title = ?,
        human_operator_online = ?, status = ?, updated_at = ?
      WHERE id = ? AND tenant_id = ?;`,
      args: [
        updated.name,
        updated.description,
        updated.systemInstruction,
        updated.tone,
        updated.primaryColor,
        updated.textColor,
        updated.avatar,
        updated.greetingMessage,
        suggestedQuestionsJson,
        updated.model,
        updated.fallbackMessage,
        updated.collectLeadEmail ? 1 : 0,
        updated.leadTitle || '',
        updated.humanOperatorOnline ? 1 : 0,
        updated.status,
        updated.updatedAt,
        id,
        tenantId,
      ],
    });

    return updated;
  }

  static async delete(id: string, tenantId: string): Promise<boolean> {
    const db = getDb();
    const res = await db.execute({
      sql: `DELETE FROM chatbots WHERE id = ? AND tenant_id = ?;`,
      args: [id, tenantId],
    });
    return (res.rowsAffected || 0) > 0;
  }

  private static mapRowToChatbot(r: any): Chatbot {
    let questions: string[] = [];
    try {
      questions = JSON.parse(String(r.suggested_questions_json || '[]'));
    } catch {
      questions = [];
    }

    return {
      id: String(r.id),
      tenantId: String(r.tenant_id),
      name: String(r.name),
      description: String(r.description || ''),
      systemInstruction: String(r.system_instruction || ''),
      tone: (r.tone || 'Friendly') as any,
      primaryColor: String(r.primary_color || '#4F46E5'),
      textColor: String(r.text_color || '#FFFFFF'),
      avatar: String(r.avatar || '🤖'),
      greetingMessage: String(r.greeting_message || 'Hello!'),
      suggestedQuestions: questions,
      model: (r.model || 'gemini-3.6-flash') as any,
      fallbackMessage: String(r.fallback_message || ''),
      collectLeadEmail: Number(r.collect_lead_email) === 1,
      leadTitle: String(r.lead_title || ''),
      humanOperatorOnline: Number(r.human_operator_online) === 1,
      status: (r.status || 'active') as any,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }
}
