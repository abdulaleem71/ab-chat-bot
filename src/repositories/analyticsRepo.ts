import { getDb } from '../db/index';
import { AnalyticsSummary } from '../types';

const TOPIC_KEYWORDS: { topic: string; category: string; keywords: string[] }[] = [
  { topic: 'SSO & SAML Setup', category: 'Security & SSO', keywords: ['sso', 'saml', 'okta', 'azure ad', 'oidc', 'single sign'] },
  { topic: 'API & Rate Limits', category: 'Developer API', keywords: ['api', 'rate limit', 'rate-limit', 'endpoint', 'token'] },
  { topic: 'Team & Invites', category: 'Team & Access', keywords: ['invite', 'team', 'member', 'permission', 'roles', 'add user'] },
  { topic: 'Billing & Pricing', category: 'Billing & Subscriptions', keywords: ['price', 'pricing', 'plan', 'billing', 'invoice', 'cost', 'upgrade', 'cancel', 'trial'] },
  { topic: 'Security & Accounts', category: 'Account Security', keywords: ['security', 'privacy', 'password', 'reset', 'login', '2fa', 'encrypt', 'data'] },
  { topic: 'Integrations & Embed', category: 'Integrations', keywords: ['integration', 'slack', 'zapier', 'webhook', 'embed', 'widget', 'chatbot'] },
];

export type AnalyticsRange = 'today' | '7d' | '30d' | 'all';

export class AnalyticsRepo {
  static async getSummaryForTenant(
    tenantId: string,
    chatbotId?: string,
    range: AnalyticsRange = '7d'
  ): Promise<AnalyticsSummary> {
    const db = getDb();

    let rangeSinceIso: string | null = null;
    if (range === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      rangeSinceIso = start.toISOString();
    } else if (range === '7d') {
      rangeSinceIso = new Date(Date.now() - 7 * 86400000).toISOString();
    } else if (range === '30d') {
      rangeSinceIso = new Date(Date.now() - 30 * 86400000).toISOString();
    }

    let convWhere = `WHERE tenant_id = ? AND (is_test = 0 OR is_test IS NULL)`;
    let leadWhere = `WHERE tenant_id = ?`;
    const params: any[] = [tenantId];
    const leadParams: any[] = [tenantId];

    if (chatbotId) {
      convWhere += ` AND chatbot_id = ?`;
      leadWhere += ` AND chatbot_id = ?`;
      params.push(chatbotId);
      leadParams.push(chatbotId);
    }

    if (rangeSinceIso) {
      convWhere += ` AND created_at >= ?`;
      leadWhere += ` AND captured_at >= ?`;
      params.push(rangeSinceIso);
      leadParams.push(rangeSinceIso);
    }

    const msgWhere = `WHERE tenant_id = ? AND conversation_id IN (SELECT id FROM conversations ${convWhere})`;
    const msgParams: any[] = [tenantId, ...params];

    // Total Conversations
    const convRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM conversations ${convWhere};`,
      args: params,
    });
    const totalConversations = Number(convRes.rows[0]?.total || 0);

    // Total Messages
    const msgRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM messages ${msgWhere};`,
      args: msgParams,
    });
    const totalMessages = Number(msgRes.rows[0]?.total || 0);

    // Leads Captured
    const leadRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM leads ${leadWhere};`,
      args: leadParams,
    });
    const leadsCaptured = Number(leadRes.rows[0]?.total || 0);

    // Real CSAT Score Avg (0 when no ratings exist)
    const csatRes = await db.execute({
      sql: `SELECT AVG(csat_rating) as avg_csat FROM conversations ${convWhere} AND csat_rating IS NOT NULL;`,
      args: params,
    });
    const avgCsat = csatRes.rows[0]?.avg_csat != null ? Number(csatRes.rows[0].avg_csat) : 0;

    // Real CSAT Distribution
    const csatDistRes = await db.execute({
      sql: `SELECT csat_rating, COUNT(*) as cnt FROM conversations ${convWhere} AND csat_rating IS NOT NULL GROUP BY csat_rating;`,
      args: params,
    });
    const starCounts = new Map<number, number>([[5, 0], [4, 0], [3, 0], [2, 0], [1, 0]]);
    let totalRatings = 0;
    for (const r of csatDistRes.rows) {
      const stars = Math.round(Number(r.csat_rating));
      const cnt = Number(r.cnt || 0);
      if (starCounts.has(stars)) {
        starCounts.set(stars, (starCounts.get(stars) || 0) + cnt);
        totalRatings += cnt;
      }
    }
    const csatDistribution = [5, 4, 3, 2, 1].map((stars) => {
      const count = starCounts.get(stars) || 0;
      const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
      return { stars, count, percentage };
    });

    // Human Takeovers / Escalations
    const takeoverRes = await db.execute({
      sql: `SELECT COUNT(*) as total FROM conversations ${convWhere} AND (status = 'human_takeover' OR resolved_by = 'human');`,
      args: params,
    });
    const humanTakeovers = Number(takeoverRes.rows[0]?.total || 0);

    const aiResolutionRate = totalConversations > 0
      ? Math.round(((totalConversations - humanTakeovers) / totalConversations) * 1000) / 10
      : 0;

    const humanTakeoverRate = totalConversations > 0
      ? Math.round((humanTakeovers / totalConversations) * 1000) / 10
      : 0;

    // Average AI response time
    let avgResponseTimeSec = 0;
    const msgRows = await db.execute({
      sql: `SELECT conversation_id, sender, created_at FROM messages ${msgWhere} ORDER BY conversation_id ASC, created_at ASC;`,
      args: msgParams,
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
      avgResponseTimeSec = Math.round((totalResponseMs / responseCount) / 100) / 10;
    }

    // Top topics & real frequent questions derived from visitor messages
    const topTopics: { topic: string; count: number }[] = [];
    const visitorRows = await db.execute({
      sql: `
        SELECT m.content, c.status, c.resolved_by
        FROM messages m
        INNER JOIN conversations c ON m.conversation_id = c.id
        WHERE m.tenant_id = ?
          AND (c.is_test = 0 OR c.is_test IS NULL)
          ${chatbotId ? 'AND m.chatbot_id = ?' : ''}
          ${rangeSinceIso ? 'AND c.created_at >= ?' : ''}
          AND m.sender = 'visitor'
        ORDER BY m.created_at DESC
        LIMIT 500;
      `,
      args: params,
    });

    const questionClusterMap = new Map<string, {
      question: string;
      category: string;
      count: number;
      aiResolvedCount: number;
    }>();

    if (visitorRows.rows.length > 0) {
      const topicCounts = new Map<string, number>();
      for (const row of visitorRows.rows) {
        const rawContent = String(row.content || '').trim();
        if (!rawContent) continue;
        const content = rawContent.toLowerCase();
        let matchedCat = 'General Inquiry';

        for (const { topic, category, keywords } of TOPIC_KEYWORDS) {
          if (keywords.some(kw => content.includes(kw))) {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
            matchedCat = category;
          }
        }

        // Cluster normalized questions
        const normalizedKey = content.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').slice(0, 65);
        if (normalizedKey.length >= 6) {
          const existing = questionClusterMap.get(normalizedKey);
          const isAiHandled = String(row.status) !== 'human_takeover' && String(row.resolved_by) !== 'human';
          if (existing) {
            existing.count += 1;
            if (isAiHandled) existing.aiResolvedCount += 1;
          } else {
            questionClusterMap.set(normalizedKey, {
              question: rawContent.length > 90 ? rawContent.slice(0, 87) + '...' : rawContent,
              category: matchedCat,
              count: 1,
              aiResolvedCount: isAiHandled ? 1 : 0,
            });
          }
        }
      }

      topTopics.push(
        ...Array.from(topicCounts.entries())
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );
    }

    const topQuestions = Array.from(questionClusterMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item, index) => {
        const resolutionRate = Math.round((item.aiResolvedCount / item.count) * 100);
        return {
          rank: index + 1,
          question: item.question,
          category: item.category,
          count: item.count,
          aiHandled: resolutionRate >= 50,
          status: (resolutionRate >= 50 ? 'grounded' : 'fallback_escalated') as 'grounded' | 'fallback_escalated',
          resolutionRate,
        };
      });

    // Generate Daily Trends based on actual timestamps (7d for today/7d/all, 14d for 30d)
    const numDays = range === '30d' ? 14 : 7;
    const dailyTrends: { date: string; conversations: number; leads: number }[] = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const dConvRes = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM conversations WHERE tenant_id = ? AND (is_test = 0 OR is_test IS NULL) ${chatbotId ? 'AND chatbot_id = ?' : ''} AND created_at LIKE ?;`,
        args: chatbotId ? [tenantId, chatbotId, `${dateStr}%`] : [tenantId, `${dateStr}%`],
      });

      const dLeadRes = await db.execute({
        sql: `SELECT COUNT(*) as cnt FROM leads WHERE tenant_id = ? ${chatbotId ? 'AND chatbot_id = ?' : ''} AND captured_at LIKE ?;`,
        args: chatbotId ? [tenantId, chatbotId, `${dateStr}%`] : [tenantId, `${dateStr}%`],
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
      humanTakeoverRate,
      avgResponseTimeSec,
      csatScore: Math.round(avgCsat * 10) / 10,
      csatDistribution,
      totalMessages,
      humanTakeovers,
      topTopics,
      topQuestions,
      dailyTrends,
    };
  }
}
