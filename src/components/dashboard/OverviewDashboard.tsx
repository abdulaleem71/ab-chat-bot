import React from 'react';
import { AnalyticsSummary, Chatbot, VisitorLead } from '../../types';
import { MessageSquare, Users, CheckCircle2, Clock, Star, TrendingUp, Plus, ArrowUpRight, Sparkles, Code, BookOpen, Bot, ExternalLink, ShieldCheck } from 'lucide-react';

interface OverviewDashboardProps {
  analytics: AnalyticsSummary;
  chatbots: Chatbot[];
  leads: VisitorLead[];
  onNavigate: (tab: string) => void;
  onOpenCreateBotModal: () => void;
  onOpenEmbedModal?: (bot?: Chatbot) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  analytics,
  chatbots,
  leads,
  onNavigate,
  onOpenCreateBotModal,
  onOpenEmbedModal,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Welcome */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 via-zinc-800/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Grounded RAG Customer Concierge Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">AI Workspace Control Center</h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl font-normal leading-relaxed">
              Deploy custom AI chatbots grounded on your site documentation, monitor visitor inquiries in real-time, capture qualified leads, and take over live conversations seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={onOpenCreateBotModal}
              className="bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-zinc-950" />
              <span>Create AI Bot</span>
            </button>
            <button
              onClick={() => onOpenEmbedModal ? onOpenEmbedModal() : onNavigate('embed')}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Code className="w-4 h-4 text-zinc-300" />
              <span>Embed Widget</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Chats</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-zinc-900 tracking-tight">{analytics.totalConversations.toLocaleString()}</p>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">Across {chatbots.length} active bot{chatbots.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Leads Captured</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-zinc-900 tracking-tight">{analytics.leadsCaptured}</p>
            <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Live Visitor Sync
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">AI Resolution</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-zinc-900 tracking-tight">{analytics.aiResolutionRate}%</p>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">{analytics.humanTakeovers} human handoff{analytics.humanTakeovers === 1 ? '' : 's'}</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Avg Latency</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-zinc-900 tracking-tight">{analytics.avgResponseTimeSec}s</p>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">Gemini 3.6 Flash Engine</p>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">CSAT Rating</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-zinc-900 tracking-tight">{analytics.csatScore} <span className="text-xs text-zinc-400 font-normal">/ 5.0</span></p>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">Customer satisfaction</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Topics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Conversations Trend */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900">Weekly Conversation Activity</h3>
              <p className="text-xs text-zinc-500 font-medium">Visitor inquiries and lead conversions over the last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-zinc-700">
                <span className="w-3 h-3 rounded bg-zinc-950"></span> Total Chats
              </span>
              <span className="flex items-center gap-1.5 text-zinc-700">
                <span className="w-3 h-3 rounded bg-emerald-500"></span> Leads
              </span>
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="h-52 flex items-end justify-between gap-3 pt-6 border-b border-zinc-100">
            {analytics.dailyTrends.map((item, idx) => {
              const maxVal = Math.max(...analytics.dailyTrends.map(t => t.conversations), 10);
              const chatHeight = Math.max(12, Math.round((item.conversations / maxVal) * 100));
              const leadHeight = Math.max(8, Math.round((item.leads / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Chat bar */}
                    <div
                      style={{ height: `${chatHeight}%` }}
                      className="w-1/2 bg-zinc-950 hover:bg-zinc-800 rounded-t-md transition-all relative group"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-md shadow-md pointer-events-none whitespace-nowrap z-20 font-bold">
                        {item.conversations} chats
                      </div>
                    </div>
                    {/* Lead bar */}
                    <div
                      style={{ height: `${leadHeight}%` }}
                      className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all relative group"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-md shadow-md pointer-events-none whitespace-nowrap z-20 font-bold">
                        {item.leads} leads
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-zinc-500">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Inquiry Topics */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-zinc-900">Frequent Inquiry Topics</h3>
              <button
                onClick={() => onNavigate('knowledge')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Manage RAG
              </button>
            </div>
            <p className="text-xs text-zinc-500 font-medium mb-4">Common queries analyzed and grounded in your knowledge base</p>

            <div className="space-y-3">
              {analytics.topTopics.map((topic, idx) => {
                const maxTopicCount = Math.max(...analytics.topTopics.map(t => t.count), 1);
                const percent = Math.min(100, Math.round((topic.count / maxTopicCount) * 100));

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-800 font-semibold truncate max-w-[180px]">{topic.topic}</span>
                      <span className="text-zinc-500 font-bold">{topic.count} queries</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-zinc-900 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
            <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Grounded Knowledge Base Active</span>
            </div>
            <p className="text-[11px] text-zinc-600 font-normal leading-relaxed">
              Queries are automatically cross-checked with scraped pages and uploaded documents to prevent hallucinations.
            </p>
          </div>
        </div>
      </div>

      {/* Active AI Chatbots Quick Hub */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900">Deployed AI Chatbots</h3>
            <p className="text-xs text-zinc-500 font-medium">Configure bots, test live grounding, or copy embed scripts</p>
          </div>
          <button
            onClick={() => onNavigate('chatbots')}
            className="text-xs font-bold text-zinc-900 hover:text-zinc-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({chatbots.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatbots.map(bot => (
            <div
              key={bot.id}
              className="border border-zinc-200 rounded-2xl p-4.5 bg-zinc-50/50 hover:bg-white hover:border-zinc-900 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: bot.primaryColor || '#09090b' }}
                      className="w-10 h-10 rounded-xl text-lg flex items-center justify-center text-white font-bold shadow-xs shrink-0"
                    >
                      {bot.avatar || '🤖'}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-zinc-900 group-hover:text-black">{bot.name}</h4>
                      <p className="text-[11px] text-zinc-500 line-clamp-1">{bot.description}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {bot.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-zinc-200/80 mb-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Engine</span>
                    <span className="text-zinc-800 font-semibold">{bot.model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">Tone</span>
                    <span className="text-zinc-800 font-semibold">{bot.tone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/60">
                <button
                  onClick={() => onNavigate('playground')}
                  className="flex-1 text-center text-xs font-bold bg-zinc-950 hover:bg-zinc-800 text-white py-1.5 px-3 rounded-lg transition cursor-pointer"
                >
                  Test Bot
                </button>
                <button
                  onClick={() => onOpenEmbedModal ? onOpenEmbedModal(bot) : onNavigate('embed')}
                  className="text-xs font-bold text-zinc-700 hover:text-black bg-white hover:bg-zinc-100 border border-zinc-200 py-1.5 px-3 rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  <Code className="w-3 h-3" />
                  <span>Embed</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Visitors & Leads Captured Table */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900">Recent Captured Leads</h3>
            <p className="text-xs text-zinc-500 font-medium">Contact information captured automatically from live chatbot sessions</p>
          </div>
          <button
            onClick={() => onNavigate('inbox')}
            className="text-xs font-bold text-zinc-900 hover:text-zinc-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Support Inbox</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-xs font-medium">
            No leads captured yet. Enable lead capture in your Chatbot Settings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-3">Visitor Name</th>
                  <th className="pb-3 px-3">Email Address</th>
                  <th className="pb-3 px-3">Organization</th>
                  <th className="pb-3 px-3">Initial Inquiry</th>
                  <th className="pb-3 px-3">Captured At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {leads.slice(0, 5).map(lead => (
                  <tr key={lead.id} className="hover:bg-zinc-50/80 transition">
                    <td className="py-3 px-3 font-bold text-zinc-900">{lead.name}</td>
                    <td className="py-3 px-3 text-zinc-900 font-medium font-mono text-[11px]">{lead.email}</td>
                    <td className="py-3 px-3 text-zinc-600">{lead.company || 'Direct Web Visitor'}</td>
                    <td className="py-3 px-3 text-zinc-600 max-w-xs truncate">{lead.firstQuestion || 'General Product Question'}</td>
                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                      {new Date(lead.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
