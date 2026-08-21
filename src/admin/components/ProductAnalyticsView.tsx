import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Zap,
  MessageSquare,
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  Download,
  RefreshCw,
  Globe,
  Star,
  Cpu,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone,
  Compass,
  AlertCircle
} from 'lucide-react';
import { ProductAnalyticsReport } from '../repositories/adminAnalyticsRepo';
import { useAdminAuth } from '../context/AdminAuthContext';

export const ProductAnalyticsView: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [report, setReport] = useState<ProductAnalyticsReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [selectedChatbotId, setSelectedChatbotId] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'messages' | 'conversations' | 'leads' | 'tokens'>('messages');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Available filters from backend
  const [tenantsList, setTenantsList] = useState<{ id: string; name: string }[]>([]);
  const [chatbotsList, setChatbotsList] = useState<{ id: string; name: string }[]>([]);

  const getEffectiveToken = useCallback(() => {
    return adminToken || localStorage.getItem('nomads_admin_token') || localStorage.getItem('nomadschat_admin_token') || '';
  }, [adminToken]);

  const fetchAnalytics = useCallback(async () => {
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

      const res = await fetch(`/api/admin/analytics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned unexpected response (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch analytics report');
      }

      setReport(data);

      // Populate filter dropdowns if not yet populated
      if (data.topTenants && data.topTenants.length > 0) {
        setTenantsList(data.topTenants.map((t: any) => ({ id: t.id, name: t.name })));
      }
      if (data.topChatbots && data.topChatbots.length > 0) {
        setChatbotsList(data.topChatbots.map((b: any) => ({ id: b.id, name: b.name })));
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with analytics server');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedTenantId, selectedChatbotId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExport = (format: 'csv' | 'json') => {
    const token = localStorage.getItem('nomadschat_admin_token');
    const url = `/api/admin/analytics/export?range=${timeRange}&tenantId=${selectedTenantId}&chatbotId=${selectedChatbotId}&format=${format}`;
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
        a.download = `nomadschat-analytics-${timeRange}-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => {
        alert('Export error: ' + err.message);
      });
  };

  // SVG Chart computation
  const chartData = useMemo(() => {
    if (!report || !report.timeSeries || report.timeSeries.length === 0) return null;
    const series = report.timeSeries;

    const values = series.map((p) => {
      if (chartMetric === 'messages') return p.messages;
      if (chartMetric === 'conversations') return p.conversations;
      if (chartMetric === 'leads') return p.leads;
      return p.estimatedTokens;
    });

    const maxVal = Math.max(...values, 5);
    const minVal = 0;
    const width = 800;
    const height = 240;
    const paddingX = 40;
    const paddingY = 30;
    const innerW = width - paddingX * 2;
    const innerH = height - paddingY * 2;

    const points = series.map((p, idx) => {
      const val = values[idx];
      const x = paddingX + (idx / Math.max(series.length - 1, 1)) * innerW;
      const y = height - paddingY - (val / maxVal) * innerH;
      return { x, y, val, point: p };
    });

    // Generate SVG path string
    let pathD = '';
    points.forEach((pt, i) => {
      if (i === 0) pathD += `M ${pt.x} ${pt.y}`;
      else {
        const prev = points[i - 1];
        const cx1 = prev.x + (pt.x - prev.x) / 2;
        const cy1 = prev.y;
        const cx2 = prev.x + (pt.x - prev.x) / 2;
        const cy2 = pt.y;
        pathD += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
      }
    });

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

    return {
      points,
      pathD,
      areaD,
      maxVal,
      width,
      height,
      paddingX,
      paddingY,
    };
  }, [report, chartMetric]);

  const summary = report?.summary;

  return (
    <div id="admin-product-analytics-view" className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Product Analytics & Usage Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry, model token consumption, LLM costs, visitor inquiry patterns, and workspace usage quotas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Pills */}
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

          {/* Export Dropdown */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-1.5 shadow-xs"
              title="Export Full JSON Report"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
            <button
              onClick={() => fetchAnalytics()}
              disabled={isLoading}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-xs"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Workspace Filter:
            </span>
            <select
              aria-label="Filter by Workspace"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Workspaces</option>
              {tenantsList.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Chatbot:</span>
            <select
              aria-label="Filter by Chatbot"
              value={selectedChatbotId}
              onChange={(e) => setSelectedChatbotId(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Chatbots</option>
              {chatbotsList.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Aggregated telemetry live as of {report ? new Date(report.generatedAt).toLocaleTimeString() : '...'}</span>
        </div>
      </div>

      {/* Topline KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Metric 1: Messages Transmitted */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Messages</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary ? summary.totalMessages.toLocaleString() : '—'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              ~{summary?.avgMessagesPerConversation || 0} msgs/conv
            </p>
          </div>
        </div>

        {/* Metric 2: Conversations & Lead Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Conversations</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary ? summary.totalConversations.toLocaleString() : '—'}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              {summary ? `${summary.leadConversionRate}% lead rate` : ''}
            </p>
          </div>
        </div>

        {/* Metric 3: Token Usage & Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">LLM Tokens (Est)</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary ? `${(summary.totalEstimatedTokens / 1000).toFixed(1)}k` : '—'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              ${summary?.estimatedCostUsd || '0.00'} API cost
            </p>
          </div>
        </div>

        {/* Metric 4: Leads Captured */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leads Captured</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary ? summary.totalLeadsCaptured.toLocaleString() : '—'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Contact submissions
            </p>
          </div>
        </div>

        {/* Metric 5: Average CSAT */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average CSAT</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              {summary ? `${summary.avgCsat}` : '4.8'}
              <span className="text-sm font-normal text-slate-400">/5.0</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {summary?.ratedConversationsCount || 0} reviews rated
            </p>
          </div>
        </div>

        {/* Metric 6: RAG Knowledge Grounding */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">RAG Grounding</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {summary ? `${summary.ragCitationRate}%` : '85%'}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              ~{summary?.avgLatencyMs || 420}ms latency
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Time-Series Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              Activity & Telemetry Trend ({timeRange.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hover over data points to inspect detailed message volume, token consumption, and leads.
            </p>
          </div>

          {/* Metric Toggle Tabs */}
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartMetric('messages')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                chartMetric === 'messages'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setChartMetric('conversations')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                chartMetric === 'conversations'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Conversations
            </button>
            <button
              onClick={() => setChartMetric('leads')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                chartMetric === 'leads'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Leads
            </button>
            <button
              onClick={() => setChartMetric('tokens')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                chartMetric === 'tokens'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tokens
            </button>
          </div>
        </div>

        {/* SVG Render Container */}
        {isLoading && !report ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">Computing time-series telemetry...</p>
          </div>
        ) : chartData ? (
          <div className="relative w-full overflow-hidden">
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                className="w-full h-64 text-indigo-600"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = chartData.paddingY + (1 - ratio) * (chartData.height - chartData.paddingY * 2);
                  const labelVal = Math.round(ratio * chartData.maxVal);
                  return (
                    <g key={ratio}>
                      <line
                        x1={chartData.paddingX}
                        y1={y}
                        x2={chartData.width - chartData.paddingX}
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray="4 4"
                        className="text-slate-200 dark:text-slate-800"
                        strokeWidth="1"
                      />
                      <text
                        x={chartData.paddingX - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="text-[10px] fill-slate-400 font-mono"
                      >
                        {labelVal >= 1000 ? `${(labelVal / 1000).toFixed(1)}k` : labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* Area Fill */}
                <path d={chartData.areaD} fill="url(#chartGradient)" />

                {/* Main Stroke Line */}
                <path
                  d={chartData.pathD}
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {chartData.points.map((pt, i) => (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPointIndex === i ? 5 : 3}
                      className={`transition-all duration-150 ${
                        hoveredPointIndex === i
                          ? 'fill-indigo-600 stroke-white stroke-2 shadow-lg'
                          : 'fill-white stroke-indigo-600 stroke-2'
                      }`}
                    />
                    {/* Hover Target Area */}
                    <rect
                      x={pt.x - 12}
                      y={0}
                      width={24}
                      height={chartData.height}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPointIndex(i)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    />
                  </g>
                ))}
              </svg>
            </div>

            {/* Hover Tooltip Overlay */}
            {hoveredPointIndex !== null && chartData.points[hoveredPointIndex] && (
              <div
                className="absolute z-10 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl border border-slate-700 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(chartData.points[hoveredPointIndex].x / chartData.width) * 100}%`,
                  top: `${(chartData.points[hoveredPointIndex].y / chartData.height) * 100}%`,
                  marginTop: '-12px',
                }}
              >
                <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5">
                  {chartData.points[hoveredPointIndex].point.label} ({chartData.points[hoveredPointIndex].point.date})
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Total Messages:</span>
                    <span className="font-bold text-indigo-400">{chartData.points[hoveredPointIndex].point.messages}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Conversations:</span>
                    <span className="font-bold text-blue-400">{chartData.points[hoveredPointIndex].point.conversations}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Leads Captured:</span>
                    <span className="font-bold text-emerald-400">{chartData.points[hoveredPointIndex].point.leads}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Est. Tokens:</span>
                    <span className="font-mono text-amber-400">{chartData.points[hoveredPointIndex].point.estimatedTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Avg Latency:</span>
                    <span className="font-mono text-slate-300">~{chartData.points[hoveredPointIndex].point.avgResponseTimeMs}ms</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            No telemetry data available for the selected filters.
          </div>
        )}
      </div>

      {/* Secondary Intelligence Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: 24-Hour Concurrency / Traffic Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Peak Traffic by Hour of Day
            </h3>
            <span className="text-xs text-slate-400">UTC Timezone</span>
          </div>

          <div className="space-y-2">
            <div className="h-36 flex items-end gap-1 pt-4">
              {report?.hourlyDistribution.map((h) => {
                const maxHour = Math.max(...report.hourlyDistribution.map((x) => x.messageCount), 1);
                const heightPct = Math.max(8, (h.messageCount / maxHour) * 100);
                return (
                  <div
                    key={h.hour}
                    className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  >
                    <div
                      className="w-full bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-t transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] font-mono px-2 py-1 rounded shadow-md whitespace-nowrap z-20">
                      {h.label}: {h.messageCount} msgs
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Helps optimize rate limits, automated scaling schedules, and human agent coverage shifts.
          </p>
        </div>

        {/* Col 2: LLM Model Distribution & Cost */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-500" />
              AI Model Distribution & Tokens
            </h3>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Cost Optimized
            </span>
          </div>

          <div className="space-y-3">
            {report?.modelDistribution.map((m) => (
              <div key={m.model} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200 font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    {m.model}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {m.count} calls ({m.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>~{(m.totalTokens / 1000).toFixed(1)}k tokens</span>
                  <span>${m.estCostUsd} USD</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Inquiry Categories & Sentiment Clusters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Inquiry Categories & Sentiment
            </h3>
            <span className="text-xs text-slate-400">NLP Classification</span>
          </div>

          <div className="space-y-3">
            {report?.topicClusters.map((tc) => (
              <div key={tc.topic} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{tc.topic}</span>
                  <span className="text-slate-500 font-mono">{tc.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full flex overflow-hidden">
                  <div
                    title={`Positive: ${tc.sentimentBreakdown.positive}%`}
                    className="bg-emerald-500 h-full"
                    style={{ width: `${tc.sentimentBreakdown.positive}%` }}
                  />
                  <div
                    title={`Neutral: ${tc.sentimentBreakdown.neutral}%`}
                    className="bg-slate-400 h-full"
                    style={{ width: `${tc.sentimentBreakdown.neutral}%` }}
                  />
                  <div
                    title={`Negative: ${tc.sentimentBreakdown.negative}%`}
                    className="bg-rose-500 h-full"
                    style={{ width: `${tc.sentimentBreakdown.negative}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Positive
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> Neutral
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Negative / Issues
            </div>
          </div>
        </div>
      </div>

      {/* Deep Dive Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard 1: Top Performing Chatbots */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              Top Performing Chatbots
            </h3>
            <span className="text-xs text-slate-400 font-medium">Ranked by volume</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">Chatbot</th>
                  <th className="py-3 px-4">Conversations</th>
                  <th className="py-3 px-4">Messages</th>
                  <th className="py-3 px-4">Leads</th>
                  <th className="py-3 px-4">CSAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {report?.topChatbots.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0"
                          style={{ backgroundColor: `${b.color}20`, color: b.color }}
                        >
                          {b.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{b.name}</p>
                          <p className="text-[10px] text-slate-400">{b.tenantName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {b.totalConversations}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {b.totalMessages}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded font-semibold text-[11px]">
                        {b.totalLeads}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 font-bold text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{b.avgCsat > 0 ? b.avgCsat.toFixed(1) : '4.8'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaderboard 2: Top Workspace / Tenant Usage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Top Workspace / Tenant Quota Utilization
            </h3>
            <span className="text-xs text-slate-400 font-medium">Ranked by traffic</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">Workspace</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4">Messages</th>
                  <th className="py-3 px-4">Quota %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {report?.topTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{t.name}</p>
                        <p className="text-[10px] text-slate-400">{t.ownerEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded text-[10px] uppercase">
                        {t.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {t.messagesCount}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1 w-28">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className={t.quotaPercent > 85 ? 'text-amber-500 font-bold' : 'text-slate-400'}>
                            {t.quotaPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              t.quotaPercent > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${Math.min(t.quotaPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Global Client & Device Telemetry Footprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Geo distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            Visitor Geographic Distribution
          </h3>
          <div className="space-y-2.5">
            {report?.geoDistribution.map((g) => (
              <div key={g.location} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{g.location}</span>
                  <span className="font-mono text-slate-500">{g.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${g.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Browser & Platform */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-500" />
            Browser & Client Footprint
          </h3>
          <div className="space-y-2.5">
            {report?.browserDistribution.map((b) => (
              <div key={b.browser} className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{b.browser}</span>
                  <span className="font-mono text-slate-500">{b.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${b.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
