import crypto from 'crypto';
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
    const allowedDomainsJson = JSON.stringify(bot.allowedDomains || []);
    const secretKey = bot.embedSecretKey || crypto.randomBytes(24).toString('hex');

    await db.execute({
      sql: `INSERT INTO chatbots (
        id, tenant_id, user_id, name, description, bot_type, website_url, allowed_domains_json, domain_lock_enabled, embed_secret_key,
        channel, system_instruction, tone, primary_color, text_color, avatar, greeting_message, suggested_questions_json,
        model, fallback_message, collect_lead_email, lead_title, human_operator_online, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        bot.id,
        bot.tenantId,
        (bot as any).userId || 'usr_acme_admin',
        bot.name,
        bot.description || '',
        bot.botType || 'support',
        bot.websiteUrl || '',
        allowedDomainsJson,
        bot.domainLockEnabled === false ? 0 : 1,
        secretKey,
        bot.channel || 'Website Widget',
        bot.systemInstruction || '',
        bot.tone || 'Friendly',
        bot.primaryColor || '#4F46E5',
        bot.textColor || '#FFFFFF',
        bot.avatar || '🤖',
        bot.greetingMessage || 'Hello! How can I help you today?',
        suggestedQuestionsJson,
        bot.model || 'gemini-3.7-flash',
        bot.fallbackMessage || 'Connecting to human representative...',
        bot.collectLeadEmail ? 1 : 0,
        bot.leadTitle || 'Leave your email',
        bot.humanOperatorOnline ? 1 : 0,
        bot.status || 'active',
        bot.createdAt,
        bot.updatedAt,
      ],
    });

    bot.botType = bot.botType || 'support';
    bot.allowedDomains = bot.allowedDomains || [];
    bot.domainLockEnabled = bot.domainLockEnabled !== false;
    bot.embedSecretKey = secretKey;
    bot.channel = bot.channel || 'Website Widget';

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
    const allowedDomainsJson = JSON.stringify(updated.allowedDomains || []);
    const secretKey = updated.embedSecretKey || existing.embedSecretKey || crypto.randomBytes(24).toString('hex');

    await db.execute({
      sql: `UPDATE chatbots SET
        name = ?, description = ?, bot_type = ?, website_url = ?, allowed_domains_json = ?, domain_lock_enabled = ?, embed_secret_key = ?,
        channel = ?, system_instruction = ?, tone = ?, primary_color = ?, text_color = ?, avatar = ?, greeting_message = ?,
        suggested_questions_json = ?, model = ?, fallback_message = ?, collect_lead_email = ?, lead_title = ?,
        human_operator_online = ?, status = ?, updated_at = ?
      WHERE id = ? AND tenant_id = ?;`,
      args: [
        updated.name,
        updated.description,
        updated.botType || 'support',
        updated.websiteUrl || '',
        allowedDomainsJson,
        updated.domainLockEnabled === false ? 0 : 1,
        secretKey,
        updated.channel || 'Website Widget',
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

    updated.botType = updated.botType || 'support';
    updated.allowedDomains = updated.allowedDomains || [];
    updated.domainLockEnabled = updated.domainLockEnabled !== false;
    updated.embedSecretKey = secretKey;
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

    let allowedDomains: string[] = [];
    try {
      if (r.allowed_domains_json) {
        allowedDomains = JSON.parse(String(r.allowed_domains_json));
      }
    } catch {
      allowedDomains = [];
    }

    return {
      id: String(r.id),
      tenantId: String(r.tenant_id),
      name: String(r.name),
      description: String(r.description || ''),
      botType: (r.bot_type === 'commerce' ? 'commerce' : 'support'),
      websiteUrl: r.website_url ? String(r.website_url) : undefined,
      allowedDomains: Array.isArray(allowedDomains) ? allowedDomains : [],
      domainLockEnabled: r.domain_lock_enabled !== undefined && r.domain_lock_enabled !== null ? Number(r.domain_lock_enabled) === 1 : true,
      embedSecretKey: r.embed_secret_key ? String(r.embed_secret_key) : undefined,
      channel: (r.channel || 'Website Widget') as any,
      systemInstruction: String(r.system_instruction || ''),
      tone: (r.tone || 'Friendly') as any,
      primaryColor: String(r.primary_color || '#4F46E5'),
      textColor: String(r.text_color || '#FFFFFF'),
      avatar: String(r.avatar || '🤖'),
      greetingMessage: String(r.greeting_message || 'Hello!'),
      suggestedQuestions: questions,
      model: (r.model === 'gemini-3.1-pro-preview' ? 'gemini-3.1-pro-preview' : 'gemini-3.7-flash') as any,
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
