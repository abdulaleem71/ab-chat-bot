import { getDb } from '../db/index';
import { AnalyticsSummary } from '../types';

const TOPIC_KEYWORDS: { topic: string; keywords: string[] }[] = [
  { topic: 'SSO & SAML Setup', keywords: ['sso', 'saml', 'okta', 'azure ad', 'oidc', 'single sign'] },
  { topic: 'API & Rate Limits', keywords: ['api', 'rate limit', 'rate-limit', 'endpoint'] },
  { topic: 'Team & Invites', keywords: ['invite', 'team', 'member', 'permission', 'roles', 'add user'] },
  { topic: 'Billing & Pricing', keywords: ['price', 'pricing', 'plan', 'billing', 'invoice', 'cost', 'upgrade', 'cancel', 'trial'] },
  { topic: 'Security & Accounts', keywords: ['security', 'privacy', 'password', 'reset', 'login', '2fa', 'encrypt', 'data'] },
  { topic: 'Integrations', keywords: ['integration', 'slack', 'zapier', 'webhook', 'embed', 'widget', 'chatbot'] },
];

export class AnalyticsRepo {
  static async getSummaryForTenant(tenantId: string, chatbotId?: string): Promise<AnalyticsSummary> {
    const db = getDb();

    let convWhere = `WHERE tenant_id = ?`;
    let msgWhere = `WHERE tenant_id = ?`;
    let leadWhere = `WHERE tenant_id = ?`;
    const params: any[] = [tenantId];

    if (chatbotId) {
      convWhere += ` AND chatbot_id = ?`;
      msgWhere += ` AND chatbot_id = ?`;
      leadWhere += ` AND chatbot_id = ?`;
      params.push(chatbotId);
    }

    // Total Conversations
    const convRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM conversations ${convWhere};`,
      args: params,
    });
    const totalConversations = Number(convRes.rows[0]?.total || 0);

    // Total Messages
    const msgRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM messages ${msgWhere};`,
      args: params,
    });
    const totalMessages = Number(msgRes.rows[0]?.total || 0);

    // Leads Captured
    const leadRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM leads ${leadWhere};`,
      args: params,
    });
    const leadsCaptured = Number(leadRes.rows[0]?.total || 0);

    // CSAT Score Avg
    const csatRes = await db.execute({
      sql: `SELECT AVG(csat_rating) as avg_csat FROM conversations ${convWhere} AND csat_rating IS NOT NULL;`,
      args: params,
    });
    const avgCsat = csatRes.rows[0]?.avg_csat != null ? Number(csatRes.rows[0].avg_csat) : 0;

    // Human Takeovers
    const takeoverRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM conversations ${convWhere} AND status = 'human_takeover';`,
      args: params,
    });
    const humanTakeovers = Number(takeoverRes.rows[0]?.total || 0);

    const aiResolutionRate = totalConversations > 0
      ? Math.round(((totalConversations - humanTakeovers) / totalConversations) * 1000) / 10
      : 0;

    // Average AI response time: time between a visitor message and the next bot/agent reply
    let avgResponseTimeSec = 0;
    const msgRows = await db.execute({
      sql: `SELECT conversation_id, sender, created_at FROM messages ${msgWhere} ORDER BY conversation_id ASC, created_at ASC;`,
      args: params,
    });
    const byConv = new Map<string, { sender: string; ts: number }[]>();
    for (const row of msgRows.rows) {
      const cid = String(row.conversation_id);
      const sender = String(row.sender);
      const ts = Date.parse(String(row.created_at));
      if (!byConv.has(cid)) byConv.set(cid, []);
      byConv.get(cid)!.push({ sender, ts });
    }
    let totalResponseMs = 0;
    let responseCount = 0;
    for (const msgs of byConv.values()) {
      for (let i = 0; i < msgs.length - 1; i++) {
        const cur = msgs[i];
        const next = msgs[i + 1];
        if (cur.sender === 'visitor' && next.sender !== 'visitor' && isFinite(cur.ts) && isFinite(next.ts)) {
          const delta = next.ts - cur.ts;
          if (delta > 0) {
            totalResponseMs += delta;
            responseCount++;
          }
        }
      }
    }
    if (responseCount > 0) {
      avgResponseTimeSec = Math.round(totalResponseMs / responseCount / 100) / 10;
    }

    // Top topics derived from actual visitor message content
    const topTopics: { topic: string; count: number }[] = [];
    const visitorRows = await db.execute({
      sql: `SELECT content FROM messages ${msgWhere} AND sender = 'visitor';`,
      args: params,
    });
    if (visitorRows.rows.length > 0) {
      const topicCounts = new Map<string, number>();
      for (const row of visitorRows.rows) {
        const content = String(row.content || '').toLowerCase();
        for (const { topic, keywords } of TOPIC_KEYWORDS) {
          if (keywords.some(kw => content.includes(kw))) {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
          }
        }
      }
      topTopics.push(...Array.from(topicCounts.entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5));
    }

    // Generate Daily Trends for past 7 days based on real timestamps
    const dailyTrends: { date: string; conversations: number; leads: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Daily conv count
      const dConvRes = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM conversations ${convWhere} AND created_at LIKE ?;`,
        args: [...params, `${dateStr}%`],
      });

      // Daily lead count
      const dLeadRes = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM leads ${leadWhere} AND captured_at LIKE ?;`,
        args: [...params, `${dateStr}%`],
      });

      dailyTrends.push({
        date: displayLabel,
        conversations: Number(dConvRes.rows[0]?.cnt || 0),
        leads: Number(dLeadRes.rows[0]?.cnt || 0),
      });
    }

    return {
      totalConversations,
      leadsCaptured,
      aiResolutionRate,
      avgResponseTimeSec,
      csatScore: Math.round(avgCsat * 10) / 10,
      totalMessages,
      humanTakeovers,
      topTopics,
      dailyTrends,
    };
  }
}
