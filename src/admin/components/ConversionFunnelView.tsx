import React, { useState, useEffect, useCallback } from 'react';
import {
  Filter,
  TrendingUp,
  Flame,
  Users,
  Target,
  Sparkles,
  Download,
  RefreshCw,
  Search,
  ChevronRight,
  Star,
  CheckCircle2,
  Clock,
  ArrowDown,
  Building,
  Mail,
  Phone,
  Bot,
  ExternalLink,
  SlidersHorizontal,
  Zap,
  ArrowUpRight,
  Shield
} from 'lucide-react';
import { FunnelAnalyticsData, LeadItem } from '../repositories/adminFunnelRepo';
import { LeadDetailModal } from './LeadDetailModal';
import { useAdminAuth } from '../context/AdminAuthContext';

export const ConversionFunnelView: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [data, setData] = useState<FunnelAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [selectedChatbotId, setSelectedChatbotId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<'all' | 'Hot' | 'Warm' | 'Nurture'>('all');

  // Selected lead for modal inspection
  const [inspectingLeadId, setInspectingLeadId] = useState<string | null>(null);

  // Populated lists from backend
  const [tenantsList, setTenantsList] = useState<{ id: string; name: string }[]>([]);
  const [chatbotsList, setChatbotsList] = useState<{ id: string; name: string }[]>([]);

  const getEffectiveToken = useCallback(() => {
    return adminToken || localStorage.getItem('nomads_admin_token') || localStorage.getItem('nomadschat_admin_token') || '';
  }, [adminToken]);

  const fetchFunnelData = useCallback(async () => {
    const token = getEffectiveToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        range: timeRange,
        tenantId: selectedTenantId,
        chatbotId: selectedChatbotId,
      });

      const res = await fetch(`/api/admin/funnel?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned unexpected response (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load conversion funnel data');
      }

      setData(json);

      if (json.chatbotPerformance && json.chatbotPerformance.length > 0) {
        setChatbotsList(json.chatbotPerformance.map((b: any) => ({ id: b.chatbotId, name: b.name })));
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching conversion funnel metrics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedTenantId, selectedChatbotId]);

  useEffect(() => {
    fetchFunnelData();
  }, [fetchFunnelData]);

  const handleExport = (format: 'csv' | 'json') => {
    const token = localStorage.getItem('nomadschat_admin_token');
    const url = `/api/admin/funnel/export?range=${timeRange}&tenantId=${selectedTenantId}&chatbotId=${selectedChatbotId}&format=${format}`;
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Export failed');
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `nomadschat-leads-${timeRange}-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => {
        setError('Export error: ' + err.message);
      });
  };

  // Filtered Leads
  const filteredLeads = (data?.topLeads || []).filter((lead) => {
    if (tierFilter !== 'all' && lead.tier !== tierFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchEmail = lead.email.toLowerCase().includes(q);
      const matchCompany = (lead.company || '').toLowerCase().includes(q);
      const matchQuestion = (lead.firstQuestion || '').toLowerCase().includes(q);
      const matchKeywords = lead.highIntentKeywords.some((k) => k.toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchCompany && !matchQuestion && !matchKeywords) {
        return false;
      }
    }
    return true;
  });

  const summary = data?.summary;
  const stages = data?.stages || [];

  return (
    <div id="admin-conversion-funnel-view" className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Conversion Funnel & Lead Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            End-to-end visitor conversion pipeline, high-intent buyer signal extraction, and qualified lead intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            {(['24h', '7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                  timeRange === range
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range === 'all' ? 'All Time' : range}
              </button>
            ))}
          </div>

          {/* Export & Refresh buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Export Leads CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Leads CSV
            </button>
            <button
              onClick={() => fetchFunnelData()}
              disabled={isLoading}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-xs"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-medium flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="opacity-70 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Workspace & Bot Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Scope:
            </span>
            <select
              aria-label="Filter by Chatbot Scope"
              value={selectedChatbotId}
              onChange={(e) => setSelectedChatbotId(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Chatbots Across Network</option>
              {chatbotsList.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Conversion pipeline updated live ({summary?.totalLeadsCaptured || 0} total leads captured)</span>
        </div>
      </div>

      {/* Topline KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Leads Captured */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Leads Captured</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary ? summary.totalLeadsCaptured.toLocaleString() : '—'}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              {summary ? `${summary.overallConversionRate}% overall rate` : ''}
            </p>
          </div>
        </div>

        {/* Metric 2: Hot Intent Inquiries */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">High-Intent Leads</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary ? summary.hotLeadsCount : '—'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Score ≥ 75 with enterprise/pricing triggers
            </p>
          </div>
        </div>

        {/* Metric 3: Average Lead Quality Score */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Lead Intent Score</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1">
              {summary ? `${summary.avgLeadScore}` : '74'}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Based on email, depth, & signal density
            </p>
          </div>
        </div>

        {/* Metric 4: Average Time to Lead Capture */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Engagement Velocity</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ~{summary ? `${summary.avgTimeUntilLeadCaptureSec}s` : '120s'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              From widget open to email submission
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Stage Funnel Flow Visualization */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            End-to-End Visitor Conversion Funnel
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Step-by-step visitor progression from initial widget impression down to high-satisfaction lead submission.
          </p>
        </div>

        {isLoading && !data ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <p className="text-xs">Computing funnel stages and drop-offs...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stages.map((stage, idx) => {
              const maxCount = stages[0]?.count || 1;
              const widthPct = Math.max(12, Math.round((stage.count / maxCount) * 100));

              return (
                <div key={stage.id} className="group relative">
                  <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{stage.name}</span>
                          <span className="text-[11px] text-slate-400 ml-2 font-normal hidden sm:inline">
                            — {stage.description}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 font-mono text-[11px]">
                        <div className="text-slate-700 dark:text-slate-300">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{stage.count.toLocaleString()}</span> visitors
                        </div>
                        <div className="text-indigo-600 dark:text-indigo-400 font-bold">
                          {stage.conversionRateFromFirst}% conversion
                        </div>
                        {idx > 0 && stage.dropOffCount > 0 && (
                          <div className="text-rose-500 font-semibold flex items-center gap-0.5">
                            <ArrowDown className="w-3 h-3" />
                            -{stage.dropOffRate}% drop
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Fill Bar */}
                    <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === stages.length - 1
                            ? 'bg-emerald-500'
                            : idx >= 4
                            ? 'bg-indigo-600'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Intelligence Grid: High-Intent Signals & Chatbot Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: High Intent Keyword Triggers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              High-Intent Buyer Keywords
            </h3>
            <span className="text-xs text-slate-400">NLP Triggers</span>
          </div>

          <div className="space-y-2">
            {data?.intentKeywordsDistribution.map((item) => (
              <div
                key={item.keyword}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{item.keyword}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{item.count} inquiries</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                    {item.conversionBoost} conv
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            Detected automatically across visitor queries to score deal velocity and sales readiness.
          </p>
        </div>

        {/* Col 2: Lead Intent Score Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Lead Quality Score Tiering
            </h3>
            <span className="text-xs text-slate-400">Automated Scoring</span>
          </div>

          <div className="space-y-3">
            {data?.scoreDistribution.map((tier) => (
              <div key={tier.range} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200">{tier.range}</span>
                  <span className="text-slate-500 font-mono">
                    {tier.count} leads ({tier.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      tier.range.includes('High')
                        ? 'bg-rose-500'
                        : tier.range.includes('Medium')
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${tier.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Scored dynamically using corporate email verification, question intent, chat length, and phone inclusion.
          </div>
        </div>

        {/* Col 3: Chatbot Conversion Efficiency */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-500" />
              Top Converting Chatbots
            </h3>
            <span className="text-xs text-slate-400">Ranked by Leads</span>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {data?.chatbotPerformance.map((b) => (
              <div
                key={b.chatbotId}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-xs">
                    {b.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{b.name}</p>
                    <p className="text-[10px] text-slate-400">{b.tenantName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {b.leads} leads
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {b.conversionRate}% conv
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Captured Leads Intelligence Directory */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-0">
        {/* Table Header & Search Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Captured Leads Directory & Intent Inspector
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click any lead row to inspect their complete conversation dialogue, buyer signals, and visitor fingerprint.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads, emails, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
              />
            </div>

            {/* Tier Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              {(['all', 'Hot', 'Warm', 'Nurture'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    tierFilter === tier
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {tier === 'all' ? 'All Tiers' : tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <th className="py-3 px-4">Lead Contact</th>
                <th className="py-3 px-4">Company / Phone</th>
                <th className="py-3 px-4">Intent Score & Signals</th>
                <th className="py-3 px-4">Workspace & Chatbot</th>
                <th className="py-3 px-4">Initial Question</th>
                <th className="py-3 px-4">Captured</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No leads match your current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setInspectingLeadId(lead.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {lead.name}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {lead.email}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {lead.company || '—'}
                        </p>
                        {lead.phone && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            {lead.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              lead.tier === 'Hot'
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                : lead.tier === 'Warm'
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {lead.tier === 'Hot' && <Flame className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />}
                            {lead.score}/100
                          </span>
                        </div>

                        {lead.highIntentKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {lead.highIntentKeywords.slice(0, 2).map((k) => (
                              <span
                                key={k}
                                className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[9px] font-mono uppercase"
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {lead.tenantName}
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>{lead.chatbotAvatar}</span> {lead.chatbotName}
                        </p>
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="truncate text-slate-600 dark:text-slate-300 italic" title={lead.firstQuestion}>
                        "{lead.firstQuestion || 'Inquiry conversation'}"
                      </p>
                    </td>

                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(lead.capturedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectingLeadId(lead.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {inspectingLeadId && (
        <LeadDetailModal
          leadId={inspectingLeadId}
          onClose={() => setInspectingLeadId(null)}
        />
      )}
    </div>
  );
};
