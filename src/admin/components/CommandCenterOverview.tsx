import React from 'react';
import { motion } from 'motion/react';
import { OverviewMetrics } from '../repositories/adminOverviewRepo';
import {
  Users,
  Bot,
  Globe,
  MessageSquare,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Database,
  Cpu,
  Layers,
} from 'lucide-react';

interface CommandCenterOverviewProps {
  metrics: OverviewMetrics | null;
  isLoading: boolean;
  onNavigateTab: (tab: any) => void;
}

export const CommandCenterOverview: React.FC<CommandCenterOverviewProps> = ({
  metrics,
  isLoading,
  onNavigateTab,
}) => {
  if (isLoading && !metrics) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-zinc-500 font-body">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-mono">Running real-time database aggregation queries...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center text-zinc-500 bg-white border border-zinc-200 rounded-2xl max-w-lg mx-auto my-12 shadow-2xs">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
        <p className="text-sm font-bold text-zinc-900 font-heading">Unable to retrieve real-time metrics</p>
        <p className="text-xs text-zinc-500 mt-1 font-body">Please verify database connectivity and administrator permissions.</p>
      </div>
    );
  }

  const { users, chatbots, websites, conversations, messages, leads, planDistribution, activityTrend, recentEvents, system } = metrics;

  // Max value calculation for trend chart scaling
  const maxTrendVal = Math.max(
    ...activityTrend.map((d) => Math.max(d.signups, d.chatbots, d.conversations, d.messages, 1)),
    5
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto"
    >
      {/* Top Banner with Real System Status */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-5 shadow-2xs transition-all duration-200"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-zinc-950 flex items-center gap-2 font-heading">
              <span>Command Center Live Summary</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                100% Real SQLite Records
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-body">
              Live data aggregation across SQLite users, bots, domains, conversations, and audit logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-600">
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>DB Latency: <strong className="text-zinc-900">{system.dbQueryLatencyMs}ms</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl">
            <Cpu className="w-3.5 h-3.5 text-zinc-700" />
            <span>Server Uptime: <strong className="text-zinc-900">{Math.floor(system.serverUptimeSeconds / 60)}m</strong></span>
          </div>
        </div>
      </motion.div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* 1. USERS KPI */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          onClick={() => onNavigateTab('users')}
          className="bg-white border border-zinc-200/90 hover:border-zinc-900 rounded-2xl md:rounded-3xl p-5 transition cursor-pointer group shadow-2xs hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-mono tracking-wider text-zinc-500 uppercase">Total Users</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 group-hover:bg-zinc-950 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-zinc-950 tracking-tight font-heading">{users.total}</div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-bold font-mono">+{users.newToday} today</span>
            <span className="text-zinc-500 font-mono text-[11px]">{users.active} active</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 font-body">
            <span>This week: <strong className="text-zinc-800">+{users.newThisWeek}</strong></span>
            <span>This month: <strong className="text-zinc-800">+{users.newThisMonth}</strong></span>
          </div>
        </motion.div>

        {/* 2. CHATBOTS KPI */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          onClick={() => onNavigateTab('chatbots')}
          className="bg-white border border-zinc-200/90 hover:border-zinc-900 rounded-2xl md:rounded-3xl p-5 transition cursor-pointer group shadow-2xs hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-mono tracking-wider text-zinc-500 uppercase">Total Chatbots</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 group-hover:bg-zinc-950 group-hover:text-white transition">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-zinc-950 tracking-tight font-heading">{chatbots.total}</div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-bold font-mono">{chatbots.active} active bots</span>
            <span className="text-zinc-500 font-mono text-[11px]">{chatbots.inactive} inactive</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 flex items-center justify-between font-body">
            <span>RAG Knowledge Enabled</span>
            <span className="text-zinc-800 font-mono font-semibold">Live Sync</span>
          </div>
        </motion.div>

        {/* 3. WEBSITES & DOMAINS KPI */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          onClick={() => onNavigateTab('websites')}
          className="bg-white border border-zinc-200/90 hover:border-zinc-900 rounded-2xl md:rounded-3xl p-5 transition cursor-pointer group shadow-2xs hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-mono tracking-wider text-zinc-500 uppercase">Websites & Domains</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 group-hover:bg-zinc-950 group-hover:text-white transition">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-zinc-950 tracking-tight font-heading">{websites.total}</div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-emerald-600 font-bold font-mono">{websites.verified} verified</span>
            <span className="text-amber-600 font-mono text-[11px]">{websites.unverified} unverified</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 flex items-center justify-between font-body">
            <span>Domain security</span>
            <span className="text-zinc-800 font-mono font-semibold">Active</span>
          </div>
        </motion.div>

        {/* 4. CONVERSATIONS & MESSAGES KPI */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3, transition: { duration: 0.15 } }}
          onClick={() => onNavigateTab('conversations')}
          className="bg-white border border-zinc-200/90 hover:border-zinc-900 rounded-2xl md:rounded-3xl p-5 transition cursor-pointer group shadow-2xs hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold font-mono tracking-wider text-zinc-500 uppercase">Conversations</span>
            <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 group-hover:bg-zinc-950 group-hover:text-white transition">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-zinc-950 tracking-tight font-heading">{conversations.total}</div>
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
            <span className="text-zinc-800 font-semibold font-mono">{messages.total} messages</span>
            <span className="text-emerald-600 font-mono text-[11px]">+{conversations.today} today</span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 flex items-center justify-between font-body">
            <span>User: <strong className="text-zinc-800">{messages.userSent}</strong></span>
            <span>Bot: <strong className="text-zinc-800">{messages.botSent}</strong></span>
          </div>
        </motion.div>
      </div>

      {/* Real-time 14-Day Activity Trend & Plan Breakdown */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2 font-heading">
                <TrendingUp className="w-4 h-4 text-zinc-800" />
                <span>14-Day Platform Growth & Activity</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5 font-body">
                Real daily counts from database timestamps (Signups, Bots, Conversations)
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono font-medium">
              <span className="flex items-center gap-1 text-zinc-900"><span className="w-2.5 h-2.5 rounded-xs bg-zinc-950 inline-block" /> Signups</span>
              <span className="flex items-center gap-1 text-zinc-600"><span className="w-2.5 h-2.5 rounded-xs bg-zinc-500 inline-block" /> Chatbots</span>
              <span className="flex items-center gap-1 text-emerald-600"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Convs</span>
            </div>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="h-48 flex items-end gap-1.5 md:gap-2 pt-6 pb-2 px-1 border-b border-zinc-100 bg-zinc-50/50 rounded-xl">
            {activityTrend.map((day, idx) => {
              const signupHeight = Math.round((day.signups / maxTrendVal) * 140);
              const botHeight = Math.round((day.chatbots / maxTrendVal) * 140);
              const convHeight = Math.round((day.conversations / maxTrendVal) * 140);
              const dateLabel = day.date.slice(5); // MM-DD

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-zinc-950 text-white text-[10px] rounded-lg p-2 pointer-events-none z-20 whitespace-nowrap shadow-xl border border-zinc-800">
                    <div className="font-bold text-white mb-1 font-heading">{day.date}</div>
                    <div className="text-zinc-200 font-mono">Signups: {day.signups}</div>
                    <div className="text-zinc-300 font-mono">Chatbots: {day.chatbots}</div>
                    <div className="text-emerald-400 font-mono">Conversations: {day.conversations}</div>
                    <div className="text-amber-400 font-mono">Messages: {day.messages}</div>
                  </div>

                  {/* Stacked Bars with motion growth */}
                  <div className="w-full flex items-end justify-center gap-0.5 h-36">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(signupHeight, 3)}px` }}
                      transition={{ duration: 0.5, delay: idx * 0.02, ease: 'easeOut' }}
                      className="w-1.5 sm:w-2 bg-zinc-950 rounded-t-xs"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(botHeight, 3)}px` }}
                      transition={{ duration: 0.5, delay: idx * 0.02 + 0.05, ease: 'easeOut' }}
                      className="w-1.5 sm:w-2 bg-zinc-500 rounded-t-xs"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(convHeight, 3)}px` }}
                      transition={{ duration: 0.5, delay: idx * 0.02 + 0.1, ease: 'easeOut' }}
                      className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-xs"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500 truncate w-full text-center">
                    {dateLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 font-body">
            <span>Scale: 0 to {maxTrendVal} actions / day</span>
            <span className="text-zinc-500 font-mono">Aggregated from SQLite tables</span>
          </div>
        </div>

        {/* Plan Distribution & Lead Capture */}
        <div className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 flex flex-col justify-between shadow-2xs">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2 mb-1 font-heading">
              <Layers className="w-4 h-4 text-zinc-800" />
              <span>Workspace Tiers & Leads</span>
            </h2>
            <p className="text-xs text-zinc-500 mb-4 font-body">
              Real tenant plan distribution and visitor leads captured.
            </p>

            {/* Plan Rows */}
            <div className="space-y-2.5">
              {planDistribution.map((p) => {
                const totalTenants = planDistribution.reduce((acc, curr) => acc + curr.count, 0) || 1;
                const pct = Math.round((p.count / totalTenants) * 100);
                return (
                  <div key={p.plan} className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-zinc-900 font-heading">{p.plan} Tier</span>
                      <span className="font-mono text-zinc-600 font-medium">{p.count} tenants ({pct}%)</span>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, 5)}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="bg-zinc-950 h-full rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leads Card */}
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-heading">Visitor Leads</span>
                <div className="text-xl font-extrabold text-zinc-950 mt-0.5 font-heading">{leads.total} captured</div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-600 font-mono">+{leads.today} today</span>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">High-intent prospects</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Real Live Activity Stream */}
      <motion.div variants={itemVariants} className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2 font-heading">
              <Activity className="w-4 h-4 text-zinc-800" />
              <span>Real-Time Activity Stream</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-body">
              Live stream compiled from verified database records and system audit events
            </p>
          </div>
          <motion.button
            whileHover={{ x: 2 }}
            onClick={() => onNavigateTab('activity')}
            className="text-xs font-bold text-zinc-900 hover:text-black flex items-center gap-1 cursor-pointer font-heading"
          >
            <span>View All Stream</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {recentEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-body">No recent events recorded in database.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {recentEvents.map((evt) => {
              const timeFormatted = new Date(evt.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const dateFormatted = new Date(evt.timestamp).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div key={evt.id} className="py-3 flex items-start justify-between gap-4 hover:bg-zinc-50/80 rounded-xl px-2 -mx-2 transition">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        evt.badgeColor === 'emerald'
                          ? 'bg-emerald-500'
                          : evt.badgeColor === 'indigo'
                          ? 'bg-zinc-950'
                          : evt.badgeColor === 'amber'
                          ? 'bg-amber-500'
                          : evt.badgeColor === 'violet'
                          ? 'bg-purple-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-bold text-zinc-900 font-heading">{evt.title}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 font-body">{evt.description}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-mono font-bold text-zinc-700">{timeFormatted}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{dateFormatted}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
