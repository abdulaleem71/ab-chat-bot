import React, { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminChatbotDetail } from '../repositories/adminChatbotRepo';
import { GEMINI_CONFIG } from '../../config/models';
import {
  X,
  Bot,
  Globe,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Key,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  BookOpen,
  Users,
  MessageSquare,
  History,
  ExternalLink,
  Code2,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Star,
  Plus,
  Trash2,
  Save,
  Clock,
  Laptop,
  Compass,
} from 'lucide-react';

interface ChatbotDetailModalProps {
  chatbotId: string | null;
  onClose: () => void;
  onRefreshList?: () => void;
}

type TabType = 'overview' | 'domains' | 'config' | 'knowledge' | 'leads' | 'conversations' | 'audit';

export const ChatbotDetailModal: React.FC<ChatbotDetailModalProps> = ({
  chatbotId,
  onClose,
  onRefreshList,
}) => {
  useAdminAuth();
  const [data, setData] = useState<AdminChatbotDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Copy states
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Form states for editable sections
  const [domainLockEnabled, setDomainLockEnabled] = useState<boolean>(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomainInput, setNewDomainInput] = useState<string>('');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [isSavingDomains, setIsSavingDomains] = useState<boolean>(false);

  // Config states
  const [botName, setBotName] = useState<string>('');
  const [botModel, setBotModel] = useState<string>(GEMINI_CONFIG.flash.id);
  const [botTone, setBotTone] = useState<string>('Friendly');
  const [systemInstruction, setSystemInstruction] = useState<string>('');
  const [greetingMessage, setGreetingMessage] = useState<string>('');
  const [fallbackMessage, setFallbackMessage] = useState<string>('');
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Status & Key regeneration
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState<boolean>(false);
  const [confirmRotateKey, setConfirmRotateKey] = useState<boolean>(false);

  const fetchDetail = useCallback(async () => {
    if (!chatbotId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/chatbots/${chatbotId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch chatbot details (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        const bot = json.data.chatbot;
        setDomainLockEnabled(bot.domainLockEnabled);
        setAllowedDomains(bot.allowedDomains || []);
        setWebsiteUrl(bot.websiteUrl || '');
        setBotName(bot.name || '');
        setBotModel(bot.model || GEMINI_CONFIG.flash.id);
        setBotTone(bot.tone || 'Friendly');
        setSystemInstruction(bot.systemInstruction || '');
        setGreetingMessage(bot.greetingMessage || '');
        setFallbackMessage(bot.fallbackMessage || '');
      } else {
        throw new Error(json.error || 'Chatbot not found');
      }
    } catch (err: any) {
      console.error('[Admin] Error inspecting chatbot:', err);
      setError(err.message || 'Error fetching chatbot details');
    } finally {
      setIsLoading(false);
    }
  }, [chatbotId]);

  useEffect(() => {
    if (chatbotId) {
      fetchDetail();
    }
  }, [chatbotId, fetchDetail]);

  const showSuccessFeedback = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => {
      setActionSuccess(null);
    }, 4000);
  };

  const handleCopy = (text: string, type: 'id' | 'key' | 'snippet') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === 'snippet') {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  const handleToggleStatus = async (newStatus: 'active' | 'draft' | 'archived') => {
    if (!chatbotId) return;
    try {
      setIsUpdatingStatus(true);
      const res = await fetch(`/api/admin/chatbots/${chatbotId}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update chatbot status');
      }
      showSuccessFeedback(`Chatbot status changed to '${newStatus}'.`);
      await fetchDetail();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!chatbotId) return;
    if (!confirmRotateKey) {
      setConfirmRotateKey(true);
      return;
    }
    setConfirmRotateKey(false);
    try {
      setIsRegeneratingKey(true);
      const res = await fetch(`/api/admin/chatbots/${chatbotId}/regenerate-key`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to rotate secret key');
      }
      showSuccessFeedback('Embed secret key regenerated successfully.');
      await fetchDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to rotate secret key');
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  const handleAddDomain = () => {
    const raw = newDomainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!raw) return;
    if (allowedDomains.includes(raw)) {
      setNewDomainInput('');
      return;
    }
    setAllowedDomains([...allowedDomains, raw]);
    setNewDomainInput('');
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setAllowedDomains(allowedDomains.filter(d => d !== domainToRemove));
  };

  const handleSaveDomainSettings = async () => {
    if (!chatbotId) return;
    try {
      setIsSavingDomains(true);
      setError(null);
      const res = await fetch(`/api/admin/chatbots/${chatbotId}/domain-lock`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domainLockEnabled,
          allowedDomains,
          websiteUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update domain lock settings');
      }
      showSuccessFeedback('Domain lock and allowed domains updated successfully.');
      await fetchDetail();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setError(err.message || 'Failed to update domain lock settings');
    } finally {
      setIsSavingDomains(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!chatbotId) return;
    try {
      setIsSavingConfig(true);
      setError(null);
      const res = await fetch(`/api/admin/chatbots/${chatbotId}/config`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: botName,
          model: botModel,
          tone: botTone,
          systemInstruction,
          greetingMessage,
          fallbackMessage,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update chatbot configuration');
      }
      showSuccessFeedback('AI Prompt and model configuration saved.');
      await fetchDetail();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setError(err.message || 'Failed to update chatbot configuration');
    } finally {
      setIsSavingConfig(false);
    }
  };

  if (!chatbotId) return null;

  const bot = data?.chatbot;
  const embedSnippet = bot
    ? `<script src="https://cdn.nomadschat.com/widget.js" data-chatbot-id="${bot.id}" data-secret-key="${bot.embedSecretKey || ''}" defer></script>`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100 font-sans">
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/10 shrink-0"
              style={{ backgroundColor: bot?.primaryColor || '#4F46E5' }}
            >
              {bot?.avatar || '🤖'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white tracking-tight">{bot?.name || 'Inspecting Chatbot'}</h2>
                {bot && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      bot.status === 'active'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                    {bot.status}
                  </span>
                )}
                {bot && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                      bot.domainLockEnabled
                        ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/80'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                    }`}
                  >
                    {bot.domainLockEnabled ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {bot.domainLockEnabled ? 'Domain Locked' : 'Domain Open'}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                <span>Workspace: <strong className="text-zinc-300">{bot?.tenantName || 'Acme Corp'}</strong></span>
                <span>•</span>
                <span>Owner: <strong className="text-zinc-300">{bot?.ownerEmail || 'user@example.com'}</strong></span>
                <span>•</span>
                <span>ID: <code className="font-mono text-zinc-400">{bot?.id}</code></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDetail}
              title="Refresh data"
              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-zinc-800 bg-zinc-950/40 flex gap-2 shrink-0 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Overview & Embed
          </button>

          <button
            onClick={() => setActiveTab('domains')}
            className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'domains'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Domain Security ({allowedDomains.length})
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'config'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Model & Instructions
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Knowledge Base ({data?.knowledgeSources.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'leads'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Captured Leads ({data?.leads.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'conversations'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Conversations ({data?.recentConversations.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Security Trail ({data?.auditLogs.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-zinc-900/50">
          {isLoading && !data ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-xs font-mono">Loading chatbot configuration & telemetry...</p>
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-zinc-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
              <p className="text-sm">Chatbot record not found.</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & EMBED */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Real-time Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Conversations</span>
                      <div className="text-2xl font-bold text-white mt-1">{data.stats.totalConversations}</div>
                      <span className="text-[10px] text-zinc-500">{data.stats.totalMessages} visitor messages</span>
                    </div>

                    <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Leads Captured</span>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">{data.stats.totalLeads}</div>
                      <span className="text-[10px] text-zinc-500">{bot?.collectLeadEmail ? 'Email capture enabled' : 'Capture disabled'}</span>
                    </div>

                    <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Knowledge Sources</span>
                      <div className="text-2xl font-bold text-indigo-400 mt-1">{data.stats.totalKnowledgeSources}</div>
                      <span className="text-[10px] text-zinc-500">RAG indexed documents</span>
                    </div>

                    <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Customer CSAT</span>
                      <div className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-1">
                        <Star className="w-5 h-5 fill-amber-400" />
                        {data.stats.avgCsat > 0 ? `${data.stats.avgCsat} / 5.0` : <span className="text-sm font-semibold text-zinc-400">No data yet</span>}
                      </div>
                      <span className="text-[10px] text-zinc-500">Average visitor rating</span>
                    </div>
                  </div>

                  {/* Embed Snippet Generator */}
                  <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-sm font-bold text-white">Embed Script Snippet</h4>
                      </div>
                      <button
                        onClick={() => handleCopy(embedSnippet, 'snippet')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSnippet ? 'Copied Snippet' : 'Copy HTML Snippet'}
                      </button>
                    </div>

                    <p className="text-xs text-zinc-400">
                      Copy and paste this HTML snippet into your website before the closing <code>&lt;/body&gt;</code> tag to embed this AI concierge.
                    </p>

                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-xs text-indigo-300 break-all select-all">
                      {embedSnippet}
                    </div>

                    {/* Embed Key Security Section */}
                    <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-zinc-300">Embed Secret Key:</span>
                          <code className="ml-2 font-mono text-xs text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                            {bot?.embedSecretKey || 'None configured'}
                          </code>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(bot?.embedSecretKey || '', 'key')}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          Copy Key
                        </button>
                        {confirmRotateKey ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleRegenerateKey}
                              disabled={isRegeneratingKey}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition cursor-pointer"
                            >
                              Confirm Rotate
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmRotateKey(false)}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRegenerateKey}
                            disabled={isRegeneratingKey}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-amber-950/80 text-amber-300 border border-amber-800/40 rounded text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRegeneratingKey ? 'animate-spin' : ''}`} />
                            Rotate Key
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Administrative Operational Status Controls */}
                  <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Administrative Operational Controls
                    </h4>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleToggleStatus('active')}
                        disabled={isUpdatingStatus || bot?.status === 'active'}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          bot?.status === 'active'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 opacity-80 cursor-default'
                            : 'bg-zinc-800 hover:bg-emerald-900 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        Set as Active
                      </button>

                      <button
                        onClick={() => handleToggleStatus('draft')}
                        disabled={isUpdatingStatus || bot?.status === 'draft'}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          bot?.status === 'draft'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700 opacity-80 cursor-default'
                            : 'bg-zinc-800 hover:bg-amber-900 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        Set as Draft / Pause Bot
                      </button>

                      <button
                        onClick={() => handleToggleStatus('archived')}
                        disabled={isUpdatingStatus || bot?.status === 'archived'}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-rose-900/80 text-rose-300 border border-zinc-700 transition cursor-pointer"
                      >
                        Archive Chatbot
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DOMAIN SECURITY & ALLOWED DOMAINS */}
              {activeTab === 'domains' && (
                <div className="space-y-6">
                  <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-indigo-400" />
                        <div>
                          <h4 className="text-sm font-bold text-white">Domain Lock & Origin Security</h4>
                          <p className="text-xs text-zinc-400">
                            Prevent unauthorized third-party websites from hijacking or embedding this chatbot.
                          </p>
                        </div>
                      </div>

                      {/* Domain Lock Toggle */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={domainLockEnabled}
                          onChange={(e) => setDomainLockEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-xs font-semibold text-zinc-200">
                          {domainLockEnabled ? 'Lock Enabled' : 'Lock Disabled'}
                        </span>
                      </label>
                    </div>

                    {/* Primary Website URL */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-medium text-zinc-300">Target Website URL</label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition font-mono"
                      />
                    </div>

                    {/* Allowed Domains Manager */}
                    <div className="space-y-3 pt-3 border-t border-zinc-800">
                      <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                        <span>Authorized Domains ({allowedDomains.length})</span>
                        <span className="text-[11px] text-zinc-500 font-normal">e.g. app.example.com, localhost:3000</span>
                      </label>

                      {/* Domain Input Field */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newDomainInput}
                          onChange={(e) => setNewDomainInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddDomain();
                            }
                          }}
                          placeholder="Enter domain (e.g. staging.mysite.com)"
                          className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleAddDomain}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Domain
                        </button>
                      </div>

                      {/* Domain Badges */}
                      <div className="flex flex-wrap gap-2 pt-2 min-h-[50px] p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl">
                        {allowedDomains.length === 0 ? (
                          <span className="text-xs text-zinc-500 italic flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            No specific domains restricted. If lock is enabled, embedding might be restricted.
                          </span>
                        ) : (
                          allowedDomains.map((domain) => (
                            <span
                              key={domain}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-xs font-mono rounded-lg"
                            >
                              <Globe className="w-3 h-3 text-indigo-400" />
                              {domain}
                              <button
                                onClick={() => handleRemoveDomain(domain)}
                                className="text-indigo-400 hover:text-rose-400 transition cursor-pointer ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveDomainSettings}
                        disabled={isSavingDomains}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow"
                      >
                        <Save className={`w-3.5 h-3.5 ${isSavingDomains ? 'animate-spin' : ''}`} />
                        {isSavingDomains ? 'Saving Rules...' : 'Save Domain Security Rules'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AI CONFIG & PROMPT */}
              {activeTab === 'config' && (
                <div className="space-y-6">
                  <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      AI Model & System Instructions
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-300">Chatbot Display Name</label>
                        <input
                          type="text"
                          value={botName}
                          onChange={(e) => setBotName(e.target.value)}
                          className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-300">Gemini LLM Model</label>
                        <select
                          value={botModel}
                          onChange={(e) => setBotModel(e.target.value)}
                          className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition font-mono cursor-pointer"
                        >
                          <option value={GEMINI_CONFIG.flash.id}>{GEMINI_CONFIG.flash.id} ({GEMINI_CONFIG.flash.name} - {GEMINI_CONFIG.flash.description})</option>
                          <option value={GEMINI_CONFIG.pro.id}>{GEMINI_CONFIG.pro.id} ({GEMINI_CONFIG.pro.name} - {GEMINI_CONFIG.pro.description})</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-300">Persona Tone</label>
                        <select
                          value={botTone}
                          onChange={(e) => setBotTone(e.target.value)}
                          className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                        >
                          <option value="Friendly">Friendly & Helpful</option>
                          <option value="Professional">Professional & Formal</option>
                          <option value="Concise">Concise & Direct</option>
                          <option value="Empathetic">Empathetic & Supportive</option>
                          <option value="Playful">Playful & Humorous</option>
                        </select>
                      </div>
                    </div>

                    {/* System Instruction / Prompt */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                        <span>System Instruction (Master Prompt)</span>
                        <span className="text-[11px] text-zinc-500 font-mono">{systemInstruction.length} characters</span>
                      </label>
                      <textarea
                        rows={6}
                        value={systemInstruction}
                        onChange={(e) => setSystemInstruction(e.target.value)}
                        placeholder="Define how the AI should behave, knowledge constraints, rules..."
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition font-mono leading-relaxed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-300">Greeting Message</label>
                        <input
                          type="text"
                          value={greetingMessage}
                          onChange={(e) => setGreetingMessage(e.target.value)}
                          className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-300">Fallback Message</label>
                        <input
                          type="text"
                          value={fallbackMessage}
                          onChange={(e) => setFallbackMessage(e.target.value)}
                          className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveConfig}
                        disabled={isSavingConfig}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 shadow"
                      >
                        <Save className={`w-3.5 h-3.5 ${isSavingConfig ? 'animate-spin' : ''}`} />
                        {isSavingConfig ? 'Saving AI Config...' : 'Save AI Configuration'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: KNOWLEDGE BASE (RAG) */}
              {activeTab === 'knowledge' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Indexed Knowledge Base Sources</h4>
                    <span className="text-xs text-zinc-400">{data.knowledgeSources.length} sources registered</span>
                  </div>

                  {data.knowledgeSources.length === 0 ? (
                    <div className="p-8 bg-zinc-950/60 border border-zinc-800 rounded-xl text-center text-zinc-500">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                      <p className="text-xs">No knowledge documents or URLs attached to this chatbot.</p>
                    </div>
                  ) : (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="py-3 px-4 font-medium">Type</th>
                            <th className="py-3 px-4 font-medium">Title / URL</th>
                            <th className="py-3 px-4 font-medium">Status</th>
                            <th className="py-3 px-4 font-medium">Indexed Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {data.knowledgeSources.map((kb) => (
                            <tr key={kb.id} className="hover:bg-zinc-900/40">
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[11px] font-mono uppercase">
                                  {kb.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-zinc-200 font-medium">{kb.title}</td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {kb.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                                {new Date(kb.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: LEADS CAPTURED */}
              {activeTab === 'leads' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Visitor Leads Captured via Bot</h4>
                    <span className="text-xs text-zinc-400">{data.leads.length} leads on record</span>
                  </div>

                  {data.leads.length === 0 ? (
                    <div className="p-8 bg-zinc-950/60 border border-zinc-800 rounded-xl text-center text-zinc-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                      <p className="text-xs">No customer leads collected yet by this chatbot.</p>
                    </div>
                  ) : (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="py-3 px-4 font-medium">Lead Contact</th>
                            <th className="py-3 px-4 font-medium">Company</th>
                            <th className="py-3 px-4 font-medium">First Inquiry</th>
                            <th className="py-3 px-4 font-medium">Captured At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {data.leads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-zinc-900/40">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-zinc-200">{lead.name || 'Anonymous Visitor'}</div>
                                <div className="text-zinc-400 text-[11px] font-mono">{lead.email || lead.phone || 'No email provided'}</div>
                              </td>
                              <td className="py-3 px-4 text-zinc-300">{lead.company || '—'}</td>
                              <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">{lead.firstQuestion || 'Direct inquiry'}</td>
                              <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                                {new Date(lead.capturedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: CONVERSATIONS */}
              {activeTab === 'conversations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Recent Customer Sessions</h4>
                    <span className="text-xs text-zinc-400">{data.recentConversations.length} sessions</span>
                  </div>

                  {data.recentConversations.length === 0 ? (
                    <div className="p-8 bg-zinc-950/60 border border-zinc-800 rounded-xl text-center text-zinc-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                      <p className="text-xs">No active conversation sessions recorded yet.</p>
                    </div>
                  ) : (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="py-3 px-4 font-medium">Visitor</th>
                            <th className="py-3 px-4 font-medium">Environment</th>
                            <th className="py-3 px-4 font-medium">Status</th>
                            <th className="py-3 px-4 font-medium">CSAT</th>
                            <th className="py-3 px-4 font-medium">Last Activity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {data.recentConversations.map((conv) => (
                            <tr key={conv.id} className="hover:bg-zinc-900/40">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-zinc-200">{conv.visitorName || 'Anonymous Visitor'}</div>
                                <div className="text-zinc-500 text-[11px] font-mono">{conv.visitorEmail || conv.id}</div>
                              </td>
                              <td className="py-3 px-4 text-zinc-400 text-[11px]">
                                <div>{conv.visitorLocation || 'Unknown Region'}</div>
                                <div className="text-zinc-500">{conv.visitorBrowser || 'Web Browser'}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  conv.status === 'open' ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {conv.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {conv.csatRating ? (
                                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                                    {conv.csatRating}/5
                                  </span>
                                ) : (
                                  <span className="text-zinc-600">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                                {new Date(conv.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">Administrative Actions on this Chatbot</h4>
                    <span className="text-xs text-zinc-400">{data.auditLogs.length} events logged</span>
                  </div>

                  {data.auditLogs.length === 0 ? (
                    <div className="p-8 bg-zinc-950/60 border border-zinc-800 rounded-xl text-center text-zinc-500">
                      <History className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                      <p className="text-xs">No admin modifications recorded on this chatbot yet.</p>
                    </div>
                  ) : (
                    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800">
                          <tr>
                            <th className="py-3 px-4 font-medium">Action</th>
                            <th className="py-3 px-4 font-medium">Admin</th>
                            <th className="py-3 px-4 font-medium">Status</th>
                            <th className="py-3 px-4 font-medium">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {data.auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-zinc-900/40">
                              <td className="py-3 px-4 font-mono font-semibold text-indigo-400">{log.action}</td>
                              <td className="py-3 px-4 text-zinc-300">{log.adminEmail}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  log.status === 'success' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-zinc-500">
            System Chatbot ID: <code className="font-mono text-zinc-400">{bot?.id}</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
