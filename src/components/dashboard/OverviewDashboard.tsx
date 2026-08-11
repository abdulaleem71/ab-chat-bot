import React from 'react';
import { AnalyticsSummary, Chatbot, VisitorLead } from '../../types';
import { TestimonialsCarousel } from '../common/TestimonialsCarousel';
import { MessageSquare, Users, CheckCircle2, Clock, Star, TrendingUp, Plus, ArrowUpRight, Sparkles, Code, BookOpen } from 'lucide-react';

interface OverviewDashboardProps {
  analytics: AnalyticsSummary;
  chatbots: Chatbot[];
  leads: VisitorLead[];
  onNavigate: (tab: string) => void;
  onOpenCreateBotModal: () => void;
  onOpenEmbedModal?: () => void;
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
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-extrabold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Tenant AI Support Platform</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">AI Concierge Control Center</h1>
            <p className="text-sm text-zinc-300 mt-1 max-w-2xl font-medium">
              Monitor live customer conversations, view grounded AI responses, train knowledge bases with website URLs, and embed widget scripts.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenCreateBotModal}
              className="bg-white hover:bg-zinc-100 text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>New AI Chatbot</span>
            </button>
            <button
              onClick={() => onOpenEmbedModal ? onOpenEmbedModal() : onNavigate('embed')}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-zinc-700 transition flex items-center gap-2 cursor-pointer active:scale-95"
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
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Total Chats</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-black flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900">{analytics.totalConversations.toLocaleString()}</p>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Across {chatbots.length} active bots</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Leads Captured</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900">{analytics.leadsCaptured}</p>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +22%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Lead gate conversion: 23%</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">AI Resolution</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-100 text-black flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900">{analytics.aiResolutionRate}%</p>
            <span className="text-xs font-bold text-slate-500">No agent needed</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Human handoffs: {analytics.humanTakeovers}</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Avg Response Time</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900">{analytics.avgResponseTimeSec}s</p>
            <span className="text-xs font-bold text-emerald-600">Sub-second</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Gemini 2.5 Flash latency</p>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">CSAT Score</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900">{analytics.csatScore}</p>
            <span className="text-xs font-bold text-slate-500">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Based on 320 ratings</p>
        </div>
      </div>

      {/* Main Charts & Topics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Conversations Trend */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Daily Conversation Volume & Lead Captures</h3>
              <p className="text-xs text-slate-500 font-medium">Visitor activity over the last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded bg-black"></span> Total Chats
              </span>
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-3 h-3 rounded bg-emerald-500"></span> Leads
              </span>
            </div>
          </div>

          {/* Bar Chart Visual */}
          <div className="h-52 flex items-end justify-between gap-3 pt-6 border-b border-slate-100">
            {analytics.dailyTrends.map((item, idx) => {
              const maxVal = 300;
              const chatHeight = Math.round((item.conversations / maxVal) * 100);
              const leadHeight = Math.round((item.leads / maxVal) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Chat bar */}
                    <div
                      style={{ height: `${chatHeight}%` }}
                      className="w-1/2 bg-black hover:bg-zinc-800 rounded-t-md transition-all relative group"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded shadow-md pointer-events-none whitespace-nowrap z-20 font-bold">
                        {item.conversations} chats
                      </div>
                    </div>
                    {/* Lead bar */}
                    <div
                      style={{ height: `${leadHeight}%` }}
                      className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all relative group"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded shadow-md pointer-events-none whitespace-nowrap z-20 font-bold">
                        {item.leads} leads
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{item.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Inquiry Topics */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Top Question Topics</h3>
              <button onClick={() => onNavigate('analytics')} className="text-xs font-bold text-black hover:underline cursor-pointer">
                View All
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">Most frequent customer queries grounded in knowledge base</p>

            <div className="space-y-3">
              {analytics.topTopics.map((topic, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-800 font-semibold truncate max-w-[200px]">{topic.topic}</span>
                    <span className="text-slate-500 font-bold">{topic.count} queries</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-black h-full rounded-full"
                      style={{ width: `${Math.min(100, (topic.count / 450) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
            <div className="flex items-center gap-2 text-black font-extrabold text-xs mb-1">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Knowledge Gap Tip</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              Users frequently ask about SAML mapping. Consider indexing your SAML setup documentation page.
            </p>
          </div>
        </div>
      </div>

      {/* Success Testimonials Carousel */}
      <TestimonialsCarousel />

      {/* Recent Visitors & Leads Captured Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Captured Visitor Leads</h3>
            <p className="text-xs text-slate-500">Contact details collected automatically by AI chatbots before support handoff</p>
          </div>
          <button
            onClick={() => onNavigate('inbox')}
            className="text-xs font-bold text-black hover:text-zinc-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Customer Inbox</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-black" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-2">Visitor Name</th>
                <th className="pb-3 px-2">Email Address</th>
                <th className="pb-3 px-2">Company / Org</th>
                <th className="pb-3 px-2">Initial Inquiry</th>
                <th className="pb-3 px-2">Captured At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-2 font-extrabold text-slate-900">{lead.name}</td>
                  <td className="py-3 px-2 text-zinc-900 font-bold">{lead.email}</td>
                  <td className="py-3 px-2 text-slate-600">{lead.company || 'N/A'}</td>
                  <td className="py-3 px-2 text-slate-600 max-w-xs truncate">{lead.firstQuestion || 'General Support Inquiry'}</td>
                  <td className="py-3 px-2 text-slate-400">{new Date(lead.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
