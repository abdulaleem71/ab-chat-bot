import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminChatbotListItem } from '../repositories/adminChatbotRepo';
import { ChatbotDetailModal } from './ChatbotDetailModal';
import {
  Bot,
  Search,
  Filter,
  Globe,
  Shield,
  Lock,
  Unlock,
  Sparkles,
  MessageSquare,
  Users,
  BookOpen,
  Eye,
  RefreshCw,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { MotionButton } from '../../components/common/MotionButton';

export const ChatbotDirectoryView: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [chatbots, setChatbots] = useState<AdminChatbotListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [domainLockFilter, setDomainLockFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Inspector modal
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [copiedBotId, setCopiedBotId] = useState<string | null>(null);

  const fetchChatbots = useCallback(async () => {
    if (!adminToken) return;
    try {
      setIsLoading(true);
      setError(null);

      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });

      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (modelFilter !== 'all') params.set('model', modelFilter);
      if (domainLockFilter !== 'all') params.set('domainLock', domainLockFilter);

      const res = await fetch(`/api/admin/chatbots?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch chatbots (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success) {
        setChatbots(json.chatbots || []);
        setTotal(json.total || 0);
      } else {
        throw new Error(json.error || 'Failed to parse chatbot directory');
      }
    } catch (err: any) {
      console.error('[Admin] Failed to fetch chatbots:', err);
      setError(err.message || 'Error communicating with administration backend');
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, page, searchTerm, statusFilter, modelFilter, domainLockFilter]);

  useEffect(() => {
    fetchChatbots();
  }, [fetchChatbots]);

  const handleCopySnippet = (bot: AdminChatbotListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const snippet = `<script src="https://cdn.nomadschat.com/widget.js" data-chatbot-id="${bot.id}" data-secret-key="${bot.embedSecretKey || ''}" defer></script>`;
    navigator.clipboard.writeText(snippet);
    setCopiedBotId(bot.id);
    setTimeout(() => setCopiedBotId(null), 2000);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // Aggregated KPI numbers
  const activeCount = chatbots.filter(b => b.status === 'active').length;
  const lockedCount = chatbots.filter(b => b.domainLockEnabled).length;
  const totalLeads = chatbots.reduce((acc, b) => acc + b.leadsCount, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Stat Summary Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Total Chatbots</span>
            <div className="text-xl font-extrabold text-zinc-950 font-heading mt-0.5">{total}</div>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Active Bots</span>
            <div className="text-xl font-extrabold text-emerald-600 font-heading mt-0.5">{activeCount}</div>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Domain Locked</span>
            <div className="text-xl font-extrabold text-zinc-950 font-heading mt-0.5">{lockedCount}</div>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Visitor Leads</span>
            <div className="text-xl font-extrabold text-amber-600 font-heading mt-0.5">{totalLeads}</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-2xs"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by chatbot name, website, ID, or owner email..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white font-mono transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-hidden focus:border-zinc-900 cursor-pointer font-mono"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Model Filter */}
          <select
            value={modelFilter}
            onChange={(e) => {
              setModelFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-hidden focus:border-zinc-900 cursor-pointer font-mono"
          >
            <option value="all">All Models</option>
            <option value="gemini-3.7-flash">gemini-3.7-flash</option>
            <option value="gemini-2.5-flash">gemini-2.5-flash</option>
            <option value="gemini-2.5-pro">gemini-2.5-pro</option>
          </select>

          {/* Domain Lock Filter */}
          <select
            value={domainLockFilter}
            onChange={(e) => {
              setDomainLockFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-hidden focus:border-zinc-900 cursor-pointer font-mono"
          >
            <option value="all">All Domain Locks</option>
            <option value="locked">Domain Locked (Secure)</option>
            <option value="unlocked">Domain Open</option>
          </select>

          <MotionButton
            variant="secondary"
            size="sm"
            onClick={fetchChatbots}
            title="Refresh list"
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-zinc-500' : ''}`} />}
          >
            Refresh
          </MotionButton>
        </div>
      </motion.div>

      {/* Main Chatbot Directory Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xs"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-zinc-50/80 text-zinc-500 font-mono uppercase text-[10px] border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-4">Chatbot & Identity</th>
                <th className="py-3.5 px-4">Owner & Workspace</th>
                <th className="py-3.5 px-4">Model & Tone</th>
                <th className="py-3.5 px-4">Website & Security</th>
                <th className="py-3.5 px-4">Telemetry</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-sans">
              {isLoading && chatbots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500 font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-900" />
                    <span>Querying chatbots database...</span>
                  </td>
                </tr>
              ) : chatbots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500 font-mono">
                    <Bot className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                    <span>No chatbots found matching current criteria.</span>
                  </td>
                </tr>
              ) : (
                chatbots.map((bot) => (
                  <tr
                    key={bot.id}
                    onClick={() => setSelectedBotId(bot.id)}
                    className="hover:bg-zinc-50/80 transition cursor-pointer group"
                  >
                    {/* Bot Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-xs border border-zinc-200"
                          style={{ backgroundColor: bot.primaryColor || '#18181b', color: '#fff' }}
                        >
                          {bot.avatar || '🤖'}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-950 group-hover:text-black transition font-heading">
                            {bot.name}
                          </div>
                          <div className="font-mono text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                            <span>{bot.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner & Workspace */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 font-heading">{bot.tenantName}</div>
                      <div className="text-zinc-500 text-[11px] font-mono">{bot.ownerEmail}</div>
                    </td>

                    {/* Model & Tone */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-zinc-800 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md w-max font-medium">
                        {bot.model}
                      </div>
                      <div className="text-zinc-500 text-[11px] mt-1">{bot.tone}</div>
                    </td>

                    {/* Website & Domain Security */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-zinc-700 truncate max-w-[160px]">
                        <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{bot.websiteUrl || 'No domain linked'}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono ${
                            bot.domainLockEnabled
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {bot.domainLockEnabled ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                          {bot.domainLockEnabled ? 'Locked' : 'Open'}
                        </span>
                        {bot.allowedDomains.length > 0 && (
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {bot.allowedDomains.length} rules
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Telemetry */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 text-zinc-500 text-[11px] font-mono">
                        <span className="flex items-center gap-1" title="Conversations">
                          <MessageSquare className="w-3 h-3 text-zinc-700" />
                          <strong className="text-zinc-900">{bot.conversationsCount}</strong>
                        </span>
                        <span className="flex items-center gap-1" title="Visitor Leads">
                          <Users className="w-3 h-3 text-emerald-600" />
                          <strong className="text-zinc-900">{bot.leadsCount}</strong>
                        </span>
                        <span className="flex items-center gap-1" title="Knowledge Base Sources">
                          <BookOpen className="w-3 h-3 text-amber-600" />
                          <strong className="text-zinc-900">{bot.knowledgeSourcesCount}</strong>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                          bot.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                        {bot.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={(e) => handleCopySnippet(bot, e)}
                          title="Copy Embed Snippet"
                          className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950 border border-zinc-200 rounded-lg transition cursor-pointer"
                        >
                          {copiedBotId === bot.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Code2 className="w-4 h-4" />
                          )}
                        </motion.button>

                        <MotionButton
                          variant="secondary"
                          size="xs"
                          onClick={() => setSelectedBotId(bot.id)}
                          leftIcon={<Eye className="w-3 h-3" />}
                        >
                          Inspect
                        </MotionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <div className="text-xs text-zinc-500 font-body">
            Showing <strong className="text-zinc-900">{chatbots.length}</strong> of <strong className="text-zinc-900">{total}</strong> chatbots
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 rounded-lg transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <span className="text-xs font-mono text-zinc-600 px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 rounded-lg transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Deep Chatbot Inspector Modal */}
      {selectedBotId && (
        <ChatbotDetailModal
          chatbotId={selectedBotId}
          onClose={() => setSelectedBotId(null)}
          onRefreshList={fetchChatbots}
        />
      )}
    </div>
  );
};
