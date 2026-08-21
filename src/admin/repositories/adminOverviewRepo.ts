import { getDb } from '../../db/index';

export interface OverviewMetrics {
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    active: number;
    inactive: number;
  };
  chatbots: {
    total: number;
    active: number;
    inactive: number;
  };
  websites: {
    total: number;
    verified: number;
    unverified: number;
  };
  conversations: {
    total: number;
    today: number;
    active: number;
  };
  messages: {
    total: number;
    userSent: number;
    botSent: number;
  };
  leads: {
    total: number;
    today: number;
  };
  planDistribution: Array<{ plan: string; count: number }>;
  activityTrend: Array<{
    date: string;
    signups: number;
    chatbots: number;
    conversations: number;
    messages: number;
  }>;
  recentEvents: Array<{
    id: string;
    type: 'USER_SIGNUP' | 'CHATBOT_CREATED' | 'CONVERSATION_STARTED' | 'LEAD_CAPTURED' | 'ADMIN_ACTION';
    title: string;
    description: string;
    actor: string;
    timestamp: string;
    badgeColor: string;
  }>;
  system: {
    databaseStatus: 'healthy' | 'degraded';
    serverUptimeSeconds: number;
    lastAggregatedAt: string;
    dbQueryLatencyMs: number;
  };
}

export class AdminOverviewRepo {
  static async getOverviewMetrics(): Promise<OverviewMetrics> {
    const startTime = Date.now();
    const db = getDb();

    // 1. Users Aggregations
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      totalUsersRes,
      usersTodayRes,
      usersWeekRes,
      usersMonthRes,
      activeUsersRes,
    ] = await Promise.all([
      db.execute(`SELECT COUNT(*) as count FROM users;`),
      db.execute({ sql: `SELECT COUNT(*) as count FROM users WHERE created_at >= ?;`, args: [todayStart] }),
      db.execute({ sql: `SELECT COUNT(*) as count FROM users WHERE created_at >= ?;`, args: [weekStart] }),
      db.execute({ sql: `SELECT COUNT(*) as count FROM users WHERE created_at >= ?;`, args: [monthStart] }),
      db.execute(`SELECT COUNT(DISTINCT user_id) as count FROM chatbots;`),
    ]);

    const totalUsers = Number(totalUsersRes.rows[0]?.count || 0);
    const usersToday = Number(usersTodayRes.rows[0]?.count || 0);
    const usersWeek = Number(usersWeekRes.rows[0]?.count || 0);
    const usersMonth = Number(usersMonthRes.rows[0]?.count || 0);
    const activeUsers = Number(activeUsersRes.rows[0]?.count || 0);
    const inactiveUsers = Math.max(0, totalUsers - activeUsers);

    // 2. Chatbots Aggregations
    const [totalBotsRes, activeBotsRes] = await Promise.all([
      db.execute(`SELECT COUNT(*) as count FROM chatbots;`),
      db.execute(`SELECT COUNT(*) as count FROM chatbots WHERE status = 'active';`),
    ]);
    const totalChatbots = Number(totalBotsRes.rows[0]?.count || 0);
    const activeChatbots = Number(activeBotsRes.rows[0]?.count || 0);
    const inactiveChatbots = Math.max(0, totalChatbots - activeChatbots);

    // 3. Websites & Domains from real chatbots data
    const botWebsitesRes = await db.execute(`
      SELECT id, website_url, allowed_domains_json, domain_lock_enabled FROM chatbots;
    `);

    const domainsSet = new Set<string>();
    let verifiedCount = 0;
    let unverifiedCount = 0;

    for (const row of botWebsitesRes.rows) {
      const url = String(row.website_url || '').trim();
      const domainLock = Number(row.domain_lock_enabled || 0);
      let allowedDomains: string[] = [];
      try {
        if (row.allowed_domains_json) {
          allowedDomains = JSON.parse(String(row.allowed_domains_json));
        }
      } catch {
        allowedDomains = [];
      }

      if (url) {
        try {
          const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
          domainsSet.add(parsed.hostname.toLowerCase());
        } catch {
          domainsSet.add(url.toLowerCase());
        }
      }
      for (const d of allowedDomains) {
        if (d && typeof d === 'string' && d.trim()) {
          domainsSet.add(d.trim().toLowerCase());
        }
      }

      if (domainLock === 1 && (allowedDomains.length > 0 || url)) {
        verifiedCount++;
      } else if (url || allowedDomains.length > 0) {
        unverifiedCount++;
      }
    }

    const totalWebsites = Math.max(domainsSet.size, verifiedCount + unverifiedCount);

    // 4. Conversations Aggregations
    const [totalConvRes, convTodayRes, activeConvRes] = await Promise.all([
      db.execute(`SELECT COUNT(*) as count FROM conversations;`),
      db.execute({ sql: `SELECT COUNT(*) as count FROM conversations WHERE created_at >= ?;`, args: [todayStart] }),
      db.execute(`SELECT COUNT(*) as count FROM conversations WHERE status = 'active';`),
    ]);
    const totalConversations = Number(totalConvRes.rows[0]?.count || 0);
    const convToday = Number(convTodayRes.rows[0]?.count || 0);
    const activeConversations = Number(activeConvRes.rows[0]?.count || 0);

    // 5. Messages Aggregations
    const [totalMsgRes, userMsgRes, botMsgRes] = await Promise.all([
      db.execute(`SELECT COUNT(*) as count FROM messages;`),
      db.execute(`SELECT COUNT(*) as count FROM messages WHERE sender = 'user';`),
      db.execute(`SELECT COUNT(*) as count FROM messages WHERE sender != 'user';`),
    ]);
    const totalMessages = Number(totalMsgRes.rows[0]?.count || 0);
    const userMessages = Number(userMsgRes.rows[0]?.count || 0);
    const botMessages = Number(botMsgRes.rows[0]?.count || 0);

    // 6. Leads Aggregations
    const [totalLeadsRes, leadsTodayRes] = await Promise.all([
      db.execute(`SELECT COUNT(*) as count FROM leads;`),
      db.execute({ sql: `SELECT COUNT(*) as count FROM leads WHERE captured_at >= ?;`, args: [todayStart] }),
    ]);
    const totalLeads = Number(totalLeadsRes.rows[0]?.count || 0);
    const leadsToday = Number(leadsTodayRes.rows[0]?.count || 0);

    // 7. Plan Distribution
    const planRes = await db.execute(`
      SELECT plan, COUNT(*) as count FROM tenants GROUP BY plan;
    `);
    const planDistribution = planRes.rows.map((r: any) => ({
      plan: String(r.plan || 'Standard'),
      count: Number(r.count || 0),
    }));

    // 8. 14-Day Activity Trend from Real Timestamps
    const days: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
    }

    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [recentUsersRes, recentBotsRes, recentConvsRes, recentMsgsRes] = await Promise.all([
      db.execute({ sql: `SELECT created_at FROM users WHERE created_at >= ?;`, args: [fourteenDaysAgo] }),
      db.execute({ sql: `SELECT created_at FROM chatbots WHERE created_at >= ?;`, args: [fourteenDaysAgo] }),
      db.execute({ sql: `SELECT created_at FROM conversations WHERE created_at >= ?;`, args: [fourteenDaysAgo] }),
      db.execute({ sql: `SELECT created_at FROM messages WHERE created_at >= ?;`, args: [fourteenDaysAgo] }),
    ]);

    const activityTrend = days.map((day) => {
      const signups = recentUsersRes.rows.filter((r: any) => String(r.created_at || '').startsWith(day)).length;
      const chatbots = recentBotsRes.rows.filter((r: any) => String(r.created_at || '').startsWith(day)).length;
      const conversations = recentConvsRes.rows.filter((r: any) => String(r.created_at || '').startsWith(day)).length;
      const messages = recentMsgsRes.rows.filter((r: any) => String(r.created_at || '').startsWith(day)).length;

      return {
        date: day,
        signups,
        chatbots,
        conversations,
        messages,
      };
    });

    // 9. Real Live Activity Feed from real database entries
    const [latestUsers, latestBots, latestConvs, latestLeads, latestAudits] = await Promise.all([
      db.execute(`SELECT id, email, name, created_at FROM users ORDER BY created_at DESC LIMIT 5;`),
      db.execute(`SELECT id, name, created_at, user_id FROM chatbots ORDER BY created_at DESC LIMIT 5;`),
      db.execute(`SELECT id, chatbot_id, visitor_name, visitor_email, created_at FROM conversations ORDER BY created_at DESC LIMIT 5;`),
      db.execute(`SELECT id, name, email, captured_at FROM leads ORDER BY captured_at DESC LIMIT 5;`),
      db.execute(`SELECT id, admin_email, action, status, created_at FROM admin_audit_logs ORDER BY created_at DESC LIMIT 5;`),
    ]);

    const realEvents: Array<{
      id: string;
      type: 'USER_SIGNUP' | 'CHATBOT_CREATED' | 'CONVERSATION_STARTED' | 'LEAD_CAPTURED' | 'ADMIN_ACTION';
      title: string;
      description: string;
      actor: string;
      timestamp: string;
      badgeColor: string;
    }> = [];

    for (const u of latestUsers.rows) {
      realEvents.push({
        id: `usr_${u.id}`,
        type: 'USER_SIGNUP',
        title: 'New User Registered',
        description: `Account created for ${u.name} (${u.email})`,
        actor: String(u.email),
        timestamp: String(u.created_at),
        badgeColor: 'emerald',
      });
    }

    for (const b of latestBots.rows) {
      realEvents.push({
        id: `bot_${b.id}`,
        type: 'CHATBOT_CREATED',
        title: 'Chatbot Provisioned',
        description: `Chatbot "${b.name}" deployed to workspace`,
        actor: String(b.name),
        timestamp: String(b.created_at),
        badgeColor: 'indigo',
      });
    }

    for (const c of latestConvs.rows) {
      realEvents.push({
        id: `conv_${c.id}`,
        type: 'CONVERSATION_STARTED',
        title: 'Visitor Conversation Initiated',
        description: `Session opened with ${c.visitor_name || c.visitor_email || 'Website Visitor'}`,
        actor: String(c.visitor_email || c.visitor_name || 'Anonymous Visitor'),
        timestamp: String(c.created_at),
        badgeColor: 'amber',
      });
    }

    for (const l of latestLeads.rows) {
      realEvents.push({
        id: `lead_${l.id}`,
        type: 'LEAD_CAPTURED',
        title: 'New Lead Captured',
        description: `Lead info recorded: ${l.name} (${l.email})`,
        actor: String(l.email),
        timestamp: String(l.captured_at),
        badgeColor: 'violet',
      });
    }

    for (const a of latestAudits.rows) {
      realEvents.push({
        id: `audit_${a.id}`,
        type: 'ADMIN_ACTION',
        title: `Admin Action: ${a.action}`,
        description: `Status: ${a.status} by ${a.admin_email}`,
        actor: String(a.admin_email),
        timestamp: String(a.created_at),
        badgeColor: 'rose',
      });
    }

    // Sort chronologically descending
    realEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const latency = Date.now() - startTime;

    return {
      users: {
        total: totalUsers,
        newToday: usersToday,
        newThisWeek: usersWeek,
        newThisMonth: usersMonth,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      chatbots: {
        total: totalChatbots,
        active: activeChatbots,
        inactive: inactiveChatbots,
      },
      websites: {
        total: totalWebsites,
        verified: verifiedCount,
        unverified: unverifiedCount,
      },
      conversations: {
        total: totalConversations,
        today: convToday,
        active: activeConversations,
      },
      messages: {
        total: totalMessages,
        userSent: userMessages,
        botSent: botMessages,
      },
      leads: {
        total: totalLeads,
        today: leadsToday,
      },
      planDistribution,
      activityTrend,
      recentEvents: realEvents.slice(0, 15),
      system: {
        databaseStatus: 'healthy',
        serverUptimeSeconds: Math.floor(process.uptime()),
        lastAggregatedAt: new Date().toISOString(),
        dbQueryLatencyMs: latency,
      },
    };
  }
}
