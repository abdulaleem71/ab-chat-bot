import { getDb } from '../db';
import { DEFAULT_MODEL_ID } from '../config/models';
import { Chatbot, ChatbotVersion, ChatbotVersionSnapshot } from '../types';
import { ChatbotRepo } from './chatbotRepo';

export class ChatbotVersionRepo {
  static extractSnapshot(bot: Partial<Chatbot>): ChatbotVersionSnapshot {
    return {
      name: bot.name || 'Chatbot',
      description: bot.description || '',
      botType: bot.botType || 'support',
      websiteUrl: bot.websiteUrl || '',
      allowedDomains: Array.isArray(bot.allowedDomains) ? bot.allowedDomains : [],
      domainLockEnabled: bot.domainLockEnabled !== false,
      channel: bot.channel || 'website_widget',
      systemInstruction: bot.systemInstruction || '',
      tone: bot.tone || 'Friendly',
      primaryColor: bot.primaryColor || '#4F46E5',
      textColor: bot.textColor || '#FFFFFF',
      avatar: bot.avatar || '🤖',
      greetingMessage: bot.greetingMessage || '',
      suggestedQuestions: Array.isArray(bot.suggestedQuestions) ? bot.suggestedQuestions : [],
      model: bot.model || DEFAULT_MODEL_ID,
      fallbackMessage: bot.fallbackMessage || '',
      collectLeadEmail: bot.collectLeadEmail !== false,
      leadTitle: bot.leadTitle || '',
      humanOperatorOnline: bot.humanOperatorOnline !== false,
      status: bot.status || 'active',
    };
  }

  static async createVersion(
    chatbotId: string,
    snapshotSource: Partial<Chatbot>,
    createdBy: string
  ): Promise<ChatbotVersion> {
    const db = getDb();
    const id = `cbv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const snapshot = this.extractSnapshot(snapshotSource);
    const snapshotJson = JSON.stringify(snapshot);
    const createdAt = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO chatbot_versions (id, chatbot_id, snapshot, created_by, created_at)
            VALUES (?, ?, ?, ?, ?);`,
      args: [id, chatbotId, snapshotJson, createdBy || 'System', createdAt],
    });

    // Prune older versions to keep only the last 20 versions per chatbot
    try {
      await db.execute({
        sql: `DELETE FROM chatbot_versions 
              WHERE chatbot_id = ? 
                AND id NOT IN (
                  SELECT id FROM chatbot_versions 
                  WHERE chatbot_id = ? 
                  ORDER BY created_at DESC 
                  LIMIT 20
                );`,
        args: [chatbotId, chatbotId],
      });
    } catch (err) {
      console.warn('[WARN] Failed to prune chatbot versions:', err);
    }

    return {
      id,
      chatbotId,
      snapshot,
      createdBy: createdBy || 'System',
      createdAt,
    };
  }

  static async listByChatbot(chatbotId: string): Promise<ChatbotVersion[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT id, chatbot_id, snapshot, created_by, created_at 
            FROM chatbot_versions 
            WHERE chatbot_id = ? 
            ORDER BY created_at DESC 
            LIMIT 20;`,
      args: [chatbotId],
    });

    return res.rows.map((r: any) => {
      let snapshot: ChatbotVersionSnapshot;
      try {
        snapshot = JSON.parse(String(r.snapshot || '{}'));
      } catch {
        snapshot = { name: 'Unknown' };
      }
      return {
        id: String(r.id),
        chatbotId: String(r.chatbot_id),
        snapshot,
        createdBy: String(r.created_by || 'System'),
        createdAt: String(r.created_at),
      };
    });
  }

  static async findById(versionId: string, chatbotId: string): Promise<ChatbotVersion | null> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT id, chatbot_id, snapshot, created_by, created_at 
            FROM chatbot_versions 
            WHERE id = ? AND chatbot_id = ? 
            LIMIT 1;`,
      args: [versionId, chatbotId],
    });

    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    let snapshot: ChatbotVersionSnapshot;
    try {
      snapshot = JSON.parse(String(r.snapshot || '{}'));
    } catch {
      snapshot = { name: 'Unknown' };
    }
    return {
      id: String(r.id),
      chatbotId: String(r.chatbot_id),
      snapshot,
      createdBy: String(r.created_by || 'System'),
      createdAt: String(r.created_at),
    };
  }

  static async restoreVersion(
    chatbotId: string,
    tenantId: string,
    versionId: string,
    restoredBy: string
  ): Promise<Chatbot | null> {
    const targetVersion = await this.findById(versionId, chatbotId);
    if (!targetVersion) return null;

    const currentBot = await ChatbotRepo.findById(chatbotId, tenantId);
    if (!currentBot) return null;

    // Snapshot the current state before restoring so we don't lose the pre-restore state
    await this.createVersion(chatbotId, currentBot, restoredBy);

    // Apply the snapshot to the bot
    const snapshot = targetVersion.snapshot;
    const updated = await ChatbotRepo.update(chatbotId, tenantId, {
      name: snapshot.name,
      description: snapshot.description,
      botType: snapshot.botType,
      websiteUrl: snapshot.websiteUrl,
      allowedDomains: snapshot.allowedDomains,
      domainLockEnabled: snapshot.domainLockEnabled,
      channel: snapshot.channel,
      systemInstruction: snapshot.systemInstruction,
      tone: snapshot.tone,
      primaryColor: snapshot.primaryColor,
      textColor: snapshot.textColor,
      avatar: snapshot.avatar,
      greetingMessage: snapshot.greetingMessage,
      suggestedQuestions: snapshot.suggestedQuestions,
      model: snapshot.model,
      fallbackMessage: snapshot.fallbackMessage,
      collectLeadEmail: snapshot.collectLeadEmail,
      leadTitle: snapshot.leadTitle,
      humanOperatorOnline: snapshot.humanOperatorOnline,
      status: snapshot.status,
    });

    return updated;
  }
}
