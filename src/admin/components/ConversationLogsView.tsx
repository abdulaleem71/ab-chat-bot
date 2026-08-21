import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Download,
  Star,
  CheckCircle,
  AlertTriangle,
  Clock,
  Globe,
  User,
  Bot,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  Check,
  Shield,
  Layers,
  Sparkles,
  Zap,
  TrendingUp,
  Inbox,
  Eye
} from 'lucide-react';
import { AdminConversationItem, AdminConversationMetrics } from '../repositories/adminConversationRepo';
import { ConversationDetailModal } from './ConversationDetailModal';
import { useAdminAuth } from '../context/AdminAuthContext';

export const ConversationLogsView: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [conversations, setConversations] = useState<AdminConversationItem[]>([]);
  const [metrics, setMetrics] = useState<AdminConversationMetrics | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [csatFilter, setCsatFilter] = useState<string>('all');
  const [hasLeadOnly, setHasLeadOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'created_at' | 'last_message_time' | 'csat_rating' | 'message_count'>('last_message_time');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Modals & Active inspection
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Quick Action feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const getEffectiveToken = useCallback(() => {
    return adminToken || localStorage.getItem('nomads_admin_token') || localStorage.getItem('nomadschat_admin_token') || '';
  }, [adminToken]);

  const fetchConversations = useCallback(async () => {
    const token = getEffectiveToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        csatRating: csatFilter,
        hasLeadOnly: String(hasLeadOnly),
        sortBy,
        sortOrder,
        limit: String(pageSize),
        offset: String(offset),
      });

      const res = await fetch(`/api/admin/conversations?${params.toString()}`, {
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
        throw new Error(data.error || 'Failed to fetch conversations');
      }

      setConversations(data.conversations || []);
      setTotalCount(data.total || 0);
      setMetrics(data.metrics || null);
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with conversations server');
    } finally {
      setIsLoading(false);
    }
  }, [getEffectiveToken, search, statusFilter, csatFilter, hasLeadOnly, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleExport = (format: 'csv' | 'json') => {
    const token = getEffectiveToken();
    const url = `/api/admin/conversations/export?format=${format}`;
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
        a.download = `conversations-export-${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => {
        alert('Export error: ' + err.message);
      });
  };

  const handleQuickStatusChange = async (id: string, newStatus: 'active' | 'closed' | 'archived' | 'flagged') => {
    try {
      const token = getEffectiveToken();
      const res = await fetch(`/api/admin/conversations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid response');
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Update failed');
      }
      setActionSuccess(`Conversation marked as ${newStatus}`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchConversations();
    } catch (err: any) {
      alert(err.message || 'Failed to update conversation status');
    }
  };

  const openTranscript = (id: string) => {
    setSelectedConversationId(id);
    setIsModalOpen(true);
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const leadConversionPercent =
    metrics && metrics.totalConversations > 0
      ? ((metrics.totalLeadsCaptured / metrics.totalConversations) * 100).toFixed(1)
      : '0.0';

  return (
    <div id="admin-conversation-logs-view" className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Conversations & Transcript Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time audit log of all chatbot interactions, lead captures, CSAT feedback, and full message threads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchConversations()}
            disabled={isLoading}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: Total Conversations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Conversations</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics ? metrics.totalConversations.toLocaleString() : '—'}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {metrics ? `${metrics.activeConversations} active` : ''}
            </span>
          </div>
        </div>

        {/* Metric 2: Messages Transmitted */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Messages</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics ? metrics.totalMessages.toLocaleString() : '—'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ~{metrics?.avgMessagesPerConv || 0}/conv
            </span>
          </div>
        </div>

        {/* Metric 3: Leads Captured */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leads Captured</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics ? metrics.totalLeadsCaptured.toLocaleString() : '—'}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {leadConversionPercent}% rate
            </span>
          </div>
        </div>

        {/* Metric 4: CSAT Satisfaction */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average CSAT</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics ? `${metrics.avgCsat}/5.0` : '4.8/5.0'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {metrics?.csatRatedCount || 0} reviews
            </span>
          </div>
        </div>

        {/* Metric 5: Active Threads */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Live Active Threads</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              {metrics ? metrics.activeConversations : 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {metrics ? `${metrics.closedConversations} resolved` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search visitor, email, message text, bot, or ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              aria-label="Filter by Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">🟢 Active</option>
              <option value="closed">⚪ Closed</option>
              <option value="flagged">⚠️ Flagged</option>
              <option value="archived">📦 Archived</option>
            </select>

            {/* CSAT Filter */}
            <select
              aria-label="Filter by CSAT Rating"
              value={csatFilter}
              onChange={(e) => {
                setCsatFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All CSAT Ratings</option>
              <option value="positive">⭐ High (4-5 Stars)</option>
              <option value="negative">⚠️ Low (1-2 Stars)</option>
              <option value="rated">Reviewed Only</option>
              <option value="unrated">Unrated</option>
            </select>

            {/* Sort Dropdown */}
            <select
              aria-label="Sort conversations"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="last_message_time">Sort: Latest Message</option>
              <option value="created_at">Sort: Created Date</option>
              <option value="message_count">Sort: Most Messages</option>
              <option value="csat_rating">Sort: CSAT Score</option>
            </select>

            {/* Lead Only Toggle */}
            <label className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasLeadOnly}
                onChange={(e) => {
                  setHasLeadOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
              />
              <span>Leads Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Conversation Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {isLoading && conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-medium">Querying conversation logs & message threads...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => fetchConversations()}
              className="mt-3 px-4 py-1.5 bg-rose-600 text-white text-xs rounded-lg hover:bg-rose-700"
            >
              Try Again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No conversations found</p>
            <p className="text-xs text-slate-500">Try adjusting your search terms or filters above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Chatbot & Workspace</th>
                  <th className="py-3.5 px-4">Visitor & Telemetry</th>
                  <th className="py-3.5 px-4">Latest Message</th>
                  <th className="py-3.5 px-4">Feedback / CSAT</th>
                  <th className="py-3.5 px-4">Status & Lead</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {conversations.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => openTranscript(c.id)}
                  >
                    {/* Column 1: Chatbot & Tenant */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0"
                          style={{ backgroundColor: `${c.chatbotColor}20`, color: c.chatbotColor }}
                        >
                          {c.chatbotAvatar}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {c.chatbotName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{c.tenantName}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px]">{c.chatbotModel}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Visitor & Telemetry */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {c.visitorName || 'Anonymous Visitor'}
                          </span>
                        </div>
                        {c.visitorEmail && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.visitorEmail}</p>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-0.5">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>{c.visitorLocation || 'Global / Unknown'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Latest Message & Snippet */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 dark:text-slate-300 font-medium truncate text-xs">
                        {c.lastMessage || 'Conversation initiated'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-[10px]">
                          {c.messageCount} msg{c.messageCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>

                    {/* Column 4: Feedback / CSAT */}
                    <td className="py-3.5 px-4">
                      {c.csatRating ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{c.csatRating}/5</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Unrated</span>
                      )}
                    </td>

                    {/* Column 5: Status & Lead Badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : c.status === 'closed'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : c.status === 'flagged'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        }`}>
                          {c.status}
                        </span>

                        {c.hasLead && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 rounded text-[10px] font-semibold">
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                            Lead Captured
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 6: Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openTranscript(c.id)}
                          className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Thread
                        </button>

                        <select
                          aria-label="Quick change status"
                          value={c.status}
                          onChange={(e) => handleQuickStatusChange(c.id, e.target.value as any)}
                          className="text-[11px] px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="closed">Closed</option>
                          <option value="flagged">Flagged</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{conversations.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, totalCount)}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> recorded conversations
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conversation Detail & Transcript Modal */}
      <ConversationDetailModal
        conversationId={selectedConversationId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedConversationId(null);
        }}
        onStatusUpdated={fetchConversations}
      />
    </div>
  );
};
