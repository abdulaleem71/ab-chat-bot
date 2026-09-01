import { getDb } from '../db';

export class ModerationService {
  static async checkAndFlagContent(
    tenantId: string, 
    resourceId: string, 
    resourceTitle: string, 
    itemType: 'chatbot_instructions' | 'knowledge_base', 
    content: string
  ) {
    if (!content || typeof content !== 'string') return;
    const db = getDb();
    try {
      const blRes = await db.execute(`SELECT pattern FROM moderation_blocklist;`);
      const patterns = blRes.rows.map((r: any) => String(r.pattern || '').toLowerCase()).filter(Boolean);
      if (patterns.length === 0) return;

      const lowerContent = content.toLowerCase();
      for (const pattern of patterns) {
        if (lowerContent.includes(pattern)) {
          const existing = await db.execute({
            sql: `SELECT id FROM moderation_queue WHERE resource_id = ? AND reason LIKE ? AND status = 'pending_review' LIMIT 1;`,
            args: [resourceId, `%\${pattern}%`],
          });
          if (existing.rows.length === 0) {
            const modId = 'mod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
            const now = new Date().toISOString();
            const snippet = content.slice(0, 300);
            await db.execute({
              sql: `INSERT INTO moderation_queue (id, item_type, tenant_id, resource_id, resource_title, content_snippet, reason, status, flagged_source, flagged_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_review', 'automatic_keyword_scan', 'system', ?);`,
              args: [modId, itemType, tenantId, resourceId, resourceTitle || 'Resource', snippet, `Matched blocklist pattern: "\${pattern}"`, now],
            });
          }
        }
      }
    } catch (err) {
      console.error('Error in checkAndFlagContent:', err);
    }
  }
}
