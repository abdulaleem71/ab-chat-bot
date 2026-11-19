import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  CheckCircle2,
  Ban,
  AlertTriangle,
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Bot,
  MessageSquare,
  Lock,
  Check,
  X
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

interface ModerationItem {
  id: string;
  item_type: 'chatbot_instructions' | 'knowledge_base' | 'flagged_conversation';
  tenant_id: string;
  resource_id: string;
  resource_title: string;
  content_snippet: string;
  reason: string;
  status: 'pending_review' | 'reviewed_ok' | 'action_taken' | 'dismissed';
  flagged_source: 'automatic_keyword_scan' | 'agent_report';
  flagged_by: string;
  created_at: string;
  reviewed_by_admin_email?: string;
  reviewed_at?: string;
  action_details?: string;
}

interface BlocklistPattern {
  id: string;
  pattern: string;
  category: string;
  created_at: string;
  admin_email: string;
}

export const ContentModerationView: React.FC = () => {
  const { admin } = useAdminAuth();
  const isSuperAdmin = admin?.role === 'super_admin';

  const [items, setItems] = useState<ModerationItem[]>([]);
  const [blocklist, setBlocklist] = useState<BlocklistPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters & Tabs
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'reviewed_ok' | 'action_taken' | 'dismissed'>('pending_review');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'blocklist'>('queue');

  // New Blocklist Pattern Form
  const [newPattern, setNewPattern] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [isAddingPattern, setIsAddingPattern] = useState(false);
  const [confirmDeletePatternId, setConfirmDeletePatternId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/moderation', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setBlocklist(data.blocklist || []);
      } else {
        throw new Error(data.error || 'Failed to fetch moderation data');
      }
    } catch (err: any) {
      console.error('Error fetching moderation queue:', err);
      setError(err.message || 'Error communicating with administration backend');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReviewItem = async (id: string, status: 'reviewed_ok' | 'action_taken' | 'dismissed', action?: 'disable_chatbot' | 'dismiss') => {
    setError(null);
    if (!isSuperAdmin) {
      setError('Only SuperAdministrators can perform content moderation interventions.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/moderation/${id}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, action }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message || 'Item updated successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchData();
      } else {
        setError(data.error || 'Failed to update moderation item.');
      }
    } catch (err: any) {
      setError('Error updating moderation item: ' + err.message);
    }
  };

  const handleAddBlocklistPattern = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isSuperAdmin) {
      setError('Only SuperAdministrators can modify the blocklist.');
      return;
    }
    if (!newPattern.trim()) return;

    try {
      const res = await fetch('/api/admin/moderation/blocklist', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', pattern: newPattern.trim(), category: newCategory }),
      });
      const data = await res.json();
      if (data.success) {
        setNewPattern('');
        setIsAddingPattern(false);
        setSuccessMessage('Blocklist pattern added successfully.');
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchData();
      } else {
        setError(data.error || 'Failed to add pattern.');
      }
    } catch (err: any) {
      setError('Error adding pattern: ' + err.message);
    }
  };

  const handleDeleteBlocklistPattern = async (id: string) => {
    setError(null);
    if (!isSuperAdmin) {
      setError('Only SuperAdministrators can modify the blocklist.');
      return;
    }
    setConfirmDeletePatternId(null);

    try {
      const res = await fetch('/api/admin/moderation/blocklist', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Blocklist pattern deleted.');
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchData();
      } else {
        setError(data.error || 'Failed to delete pattern.');
      }
    } catch (err: any) {
      setError('Error deleting pattern: ' + err.message);
    }
  };

  const filteredItems = items.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (typeFilter !== 'all' && item.item_type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (item.resource_title + ' ' + item.reason + ' ' + item.content_snippet + ' ' + item.tenant_id).toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const pendingCount = items.filter(i => i.status === 'pending_review').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-zinc-950 font-heading">Content & Safety Moderation</h1>
              <p className="text-xs text-zinc-500">Monitor flagged chatbot instructions, knowledge base documents, and reported visitor conversations.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer font-heading ${
                activeTab === 'queue' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Moderation Queue ({pendingCount} pending)
            </button>
            <button
              onClick={() => setActiveTab('blocklist')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer font-heading ${
                activeTab === 'blocklist' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Keyword Blocklist ({blocklist.length})
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer font-heading disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'queue' ? (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {(['all', 'pending_review', 'reviewed_ok', 'action_taken', 'dismissed'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer font-heading whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  }`}
                >
                  {st.replace('_', ' ')} {st === 'pending_review' && pendingCount > 0 ? `(${pendingCount})` : ''}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 font-medium focus:outline-hidden focus:border-zinc-900"
              >
                <option value="all">All Item Types</option>
                <option value="chatbot_instructions">Chatbot System Instructions</option>
                <option value="knowledge_base">Knowledge Base Content</option>
                <option value="flagged_conversation">Flagged Conversations</option>
              </select>

              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search flagged items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Queue List */}
          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center">
                <ShieldAlert className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-800 font-heading">No moderation items found</h3>
                <p className="text-xs text-zinc-500 mt-1">No items match the current status filter or blocklist rules.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200/80">
                {filteredItems.map(item => {
                  const isPending = item.status === 'pending_review';
                  return (
                    <div key={item.id} className={`p-5 transition hover:bg-zinc-50/50 ${isPending ? 'bg-amber-50/20' : ''}`}>
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.item_type === 'chatbot_instructions'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : item.item_type === 'knowledge_base'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {item.item_type.replace('_', ' ')}
                            </span>

                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              item.status === 'pending_review'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : item.status === 'reviewed_ok'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : item.status === 'action_taken'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                            }`}>
                              {item.status.replace('_', ' ')}
                            </span>

                            <span className="text-[10px] font-mono text-zinc-500">
                              Source: {item.flagged_source === 'automatic_keyword_scan' ? 'Auto Keyword Scan' : `Agent (${item.flagged_by})`}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              Tenant: {item.tenant_id}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-zinc-950 font-heading flex items-center gap-2">
                            {item.item_type === 'chatbot_instructions' && <Bot className="w-4 h-4 text-indigo-600" />}
                            {item.item_type === 'knowledge_base' && <FileText className="w-4 h-4 text-blue-600" />}
                            {item.item_type === 'flagged_conversation' && <MessageSquare className="w-4 h-4 text-purple-600" />}
                            <span>{item.resource_title || item.resource_id}</span>
                          </h3>

                          <div className="p-3 bg-zinc-100/80 rounded-xl border border-zinc-200 text-xs text-zinc-800 font-mono">
                            <span className="font-bold text-rose-600 block mb-1">Flag Reason: {item.reason}</span>
                            <p className="text-zinc-600 line-clamp-3">{item.content_snippet}</p>
                          </div>

                          {item.reviewed_at && (
                            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                              <span className="font-semibold">Reviewed by {item.reviewed_by_admin_email}</span>
                              <span>•</span>
                              <span>{new Date(item.reviewed_at).toLocaleString()}</span>
                              {item.action_details && (
                                <>
                                  <span>•</span>
                                  <span className="text-zinc-700 font-medium">{item.action_details}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-start">
                          {isSuperAdmin ? (
                            <>
                              <button
                                onClick={() => handleReviewItem(item.id, 'reviewed_ok')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer font-heading flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark OK</span>
                              </button>

                              {(item.item_type === 'chatbot_instructions' || item.item_type === 'knowledge_base') && (
                                <button
                                  onClick={() => handleReviewItem(item.id, 'action_taken', 'disable_chatbot')}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer font-heading flex items-center gap-1"
                                  title="Disable the associated chatbot via kill-switch"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Disable Chatbot</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleReviewItem(item.id, 'dismissed', 'dismiss')}
                                className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer font-heading"
                              >
                                Dismiss
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">SuperAdmin required for action</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Blocklist Management */
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 font-heading">Keyword & Pattern Blocklist</h3>
              <p className="text-xs text-zinc-500">System instructions and knowledge base documents are automatically scanned against these patterns.</p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => setIsAddingPattern(!isAddingPattern)}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer font-heading"
              >
                <Plus className="w-4 h-4" />
                <span>Add Blocklist Pattern</span>
              </button>
            )}
          </div>

          {isAddingPattern && (
            <form onSubmit={handleAddBlocklistPattern} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-heading">Add New Blocklist Pattern</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Keyword or Regex Pattern</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. credit card, exploit"
                    value={newPattern}
                    onChange={e => setNewPattern(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-hidden focus:border-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-hidden focus:border-zinc-900"
                  >
                    <option value="general">General</option>
                    <option value="financial">Financial / PII</option>
                    <option value="security">Security & Malware</option>
                    <option value="safety">Safety & Jailbreak</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition cursor-pointer font-heading"
                  >
                    Save Pattern
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingPattern(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition cursor-pointer font-heading"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 font-bold text-xs text-zinc-700 font-heading grid grid-cols-12 gap-4">
              <div className="col-span-5">Pattern</div>
              <div className="col-span-3">Category</div>
              <div className="col-span-3">Added By</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y divide-zinc-200/80">
              {blocklist.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">No blocklist patterns configured.</div>
              ) : (
                blocklist.map(b => (
                  <div key={b.id} className="p-4 grid grid-cols-12 gap-4 items-center text-xs">
                    <div className="col-span-5 font-mono font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg w-fit">
                      {b.pattern}
                    </div>
                    <div className="col-span-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {b.category}
                      </span>
                    </div>
                    <div className="col-span-3 text-zinc-500 font-mono text-[11px]">
                      {b.admin_email}
                    </div>
                    <div className="col-span-1 text-right">
                      {isSuperAdmin && (
                        confirmDeletePatternId === b.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteBlocklistPattern(b.id)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeletePatternId(null)}
                              className="px-1.5 py-1 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded text-[10px] font-bold cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePatternId(b.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                            title="Delete pattern"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
