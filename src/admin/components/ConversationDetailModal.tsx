import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Bot,
  User,
  Shield,
  Clock,
  Globe,
  Star,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Mail,
  Smartphone,
  Building,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Bookmark
} from 'lucide-react';
import { AdminConversationDetail, AdminConversationItem } from '../repositories/adminConversationRepo';
import { useAdminAuth } from '../context/AdminAuthContext';

interface ConversationDetailModalProps {
  conversationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export const ConversationDetailModal: React.FC<ConversationDetailModalProps> = ({
  conversationId,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const { } = useAdminAuth();
  const [detail, setDetail] = useState<AdminConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transcript' | 'telemetry' | 'lead' | 'audit'>('transcript');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && conversationId) {
      loadDetail(conversationId);
    } else {
      setDetail(null);
      setError(null);
      setStatusMessage(null);
      setShowDeleteConfirm(false);
      setSearchQuery('');
    }
  }, [isOpen, conversationId]);

  const loadDetail = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/conversations/${id}`, {
        credentials: 'include',
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load conversation details');
      }
      setDetail(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching conversation thread');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'closed' | 'archived' | 'flagged') => {
    if (!conversationId) return;
    setIsUpdatingStatus(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update conversation status');
      }
      setStatusMessage({ type: 'success', text: `Status updated to ${newStatus}` });
      if (detail) {
        setDetail({
          ...detail,
          conversation: { ...detail.conversation, status: newStatus },
        });
      }
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error updating status' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete conversation');
      }
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting conversation' });
      setShowDeleteConfirm(false);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const exportTranscript = (format: 'txt' | 'json' | 'md') => {
    if (!detail) return;
    const { conversation, messages, lead } = detail;
    let output = '';
    let filename = `transcript-${conversation.id}.${format}`;
    let mimeType = 'text/plain';

    if (format === 'json') {
      output = JSON.stringify(detail, null, 2);
      mimeType = 'application/json';
    } else if (format === 'md') {
      output = `# Conversation Transcript: ${conversation.id}\n`;
      output += `**Chatbot:** ${conversation.chatbotName} (${conversation.chatbotModel})\n`;
      output += `**Tenant:** ${conversation.tenantName}\n`;
      output += `**Visitor:** ${conversation.visitorName || 'Anonymous'} (${conversation.visitorEmail || 'N/A'})\n`;
      output += `**Date:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
      output += `**Status:** ${conversation.status}\n\n`;
      output += `---\n\n`;
      messages.forEach((m) => {
        const senderLabel = m.sender === 'user' ? 'Visitor' : m.sender === 'bot' ? conversation.chatbotName : m.agentName || 'Agent';
        output += `### [${new Date(m.createdAt).toLocaleTimeString()}] ${senderLabel}:\n${m.content}\n\n`;
      });
    } else {
      output = `CONVERSATION TRANSCRIPT: ${conversation.id}\n`;
      output += `Chatbot: ${conversation.chatbotName} | Workspace: ${conversation.tenantName}\n`;
      output += `Visitor: ${conversation.visitorName || 'Anonymous'} (${conversation.visitorEmail || 'No Email'})\n`;
      output += `Created: ${conversation.createdAt}\n`;
      output += `======================================================\n\n`;
      messages.forEach((m) => {
        const sender = m.sender === 'user' ? 'VISITOR' : m.sender === 'bot' ? 'AI BOT' : 'AGENT';
        output += `[${new Date(m.createdAt).toLocaleTimeString()}] ${sender}: ${m.content}\n\n`;
      });
    }

    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const conv = detail?.conversation;
  const filteredMessages = detail?.messages.filter((m) =>
    searchQuery ? m.content.toLowerCase().includes(searchQuery.toLowerCase()) : true
  ) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="admin-conversation-detail-modal"
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-xs font-semibold"
              style={{ backgroundColor: conv?.chatbotColor ? `${conv.chatbotColor}20` : '#4F46E520', color: conv?.chatbotColor || '#4F46E5' }}
            >
              {conv?.chatbotAvatar || '🤖'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {conv ? conv.chatbotName : 'Conversation Details'}
                </h3>
                {conv && (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
                    conv.status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : conv.status === 'closed'
                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      : conv.status === 'flagged'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                  }`}>
                    {conv.status}
                  </span>
                )}
                {conv?.csatRating && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-200 dark:border-amber-800/40">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {conv.csatRating}/5
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Thread ID: <code className="font-mono text-[11px]">{conversationId}</code></span>
                <span>•</span>
                <span>Workspace: <strong className="font-medium text-slate-700 dark:text-slate-300">{conv?.tenantName}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick status dropdown */}
            {conv && (
              <select
                aria-label="Update status"
                value={conv.status}
                disabled={isUpdatingStatus}
                onChange={(e) => handleUpdateStatus(e.target.value as any)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="active">🟢 Active</option>
                <option value="closed">⚪ Closed</option>
                <option value="flagged">⚠️ Flagged</option>
                <option value="archived">📦 Archived</option>
              </select>
            )}

            {/* Export menu */}
            <button
              onClick={() => exportTranscript('md')}
              title="Export as Markdown"
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'transcript'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat Transcript ({detail?.messages.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'telemetry'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              Visitor Telemetry
            </button>
            <button
              onClick={() => setActiveTab('lead')}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'lead'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4" />
              Captured Lead {detail?.lead ? '✓' : ''}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'audit'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              Audit Log ({detail?.auditLogs.length || 0})
            </button>
          </div>

          {activeTab === 'transcript' && (
            <div className="py-2 flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 text-xs pl-7 pr-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
              </div>
            </div>
          )}
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
          }`}>
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[380px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-medium">Loading conversation messages & telemetry...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl p-6 text-center text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
              <h4 className="font-semibold text-base">Unable to Load Conversation</h4>
              <p className="text-xs mt-1 text-rose-600 dark:text-rose-400">{error}</p>
              <button
                onClick={() => conversationId && loadDetail(conversationId)}
                className="mt-4 px-4 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : !detail ? (
            <div className="text-center py-16 text-slate-400">No conversation found</div>
          ) : (
            <>
              {/* TAB: TRANSCRIPT */}
              {activeTab === 'transcript' && (
                <div className="space-y-4">
                  {/* AI Metadata pill banner */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                        Model: <strong>{conv?.chatbotModel}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Sentiment: <strong className="capitalize">{detail.sentimentSummary.sentiment}</strong>
                      </span>
                      <span>•</span>
                      <span>Topics: <strong>{detail.sentimentSummary.detectedTopics.join(', ')}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportTranscript('txt')}
                        className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-[11px] font-medium"
                      >
                        TXT
                      </button>
                      <button
                        onClick={() => exportTranscript('json')}
                        className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-[11px] font-medium"
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => exportTranscript('md')}
                        className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-[11px] font-medium"
                      >
                        Markdown
                      </button>
                    </div>
                  </div>

                  {/* Message Stream */}
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      {searchQuery ? 'No messages match your filter.' : 'No messages in this conversation yet.'}
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {filteredMessages.map((msg, index) => {
                        const isUser = msg.sender === 'user';
                        const isAgent = msg.sender === 'agent';
                        const isBot = msg.sender === 'bot';

                        return (
                          <div
                            key={msg.id || index}
                            className={`flex gap-3 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}
                          >
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs shadow-xs font-semibold ${
                              isUser
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                                : isAgent
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-600 text-white'
                            }`}>
                              {isUser ? <User className="w-4 h-4" /> : isAgent ? <Shield className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>

                            {/* Bubble Container */}
                            <div className={`max-w-[75%] space-y-1 ${isUser ? 'items-start' : 'items-end'}`}>
                              <div className={`flex items-center gap-2 text-[11px] ${isUser ? 'justify-start' : 'justify-end'} text-slate-400`}>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">
                                  {isUser
                                    ? conv?.visitorName || 'Visitor'
                                    : isAgent
                                    ? `Support Agent (${msg.agentName || 'Agent'})`
                                    : `${conv?.chatbotName || 'Assistant'} (AI)`}
                                </span>
                                <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                              </div>

                              <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                isUser
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs'
                                  : isAgent
                                  ? 'bg-emerald-600 text-white rounded-tr-xs'
                                  : 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                              }`}>
                                {msg.content}

                                {/* Source citations if present */}
                                {msg.sources && msg.sources.length > 0 && (
                                  <div className="mt-3 pt-2.5 border-t border-indigo-400/30 text-xs">
                                    <div className="text-indigo-200 font-semibold mb-1 flex items-center gap-1">
                                      <Bookmark className="w-3 h-3" /> Cited Knowledge Sources:
                                    </div>
                                    <div className="space-y-1">
                                      {msg.sources.map((src, sIdx) => (
                                        <div key={sIdx} className="bg-indigo-700/40 rounded px-2 py-1 text-indigo-100 flex items-center justify-between text-[11px]">
                                          <span className="truncate">{src.title}</span>
                                          {src.sourceUrl && (
                                            <a href={src.sourceUrl} target="_blank" rel="noreferrer" className="text-indigo-200 hover:text-white ml-2 flex items-center gap-0.5">
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: VISITOR TELEMETRY */}
              {activeTab === 'telemetry' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visitor Profile */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      Visitor Identity & Session
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400">Visitor ID</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{conv?.visitorId}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400">Name</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{conv?.visitorName || 'Anonymous Visitor'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400">Email</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{conv?.visitorEmail || 'Not Provided'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400">Location / Geo</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{conv?.visitorLocation || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400">User Agent / Browser</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={conv?.visitorBrowser}>
                          {conv?.visitorBrowser || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Page Context URL</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={conv?.pageUrl}>
                          {conv?.pageUrl || 'Direct Embed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback & Satisfaction */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      CSAT Rating & Sentiment
                    </h4>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400">Satisfaction Score</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          {conv?.csatRating ? (
                            <>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${star <= (conv.csatRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                                />
                              ))}
                              <span className="ml-1 text-slate-800 dark:text-slate-200">({conv.csatRating}/5)</span>
                            </>
                          ) : (
                            <span className="text-slate-400 italic">No CSAT rating submitted</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400">AI Sentiment Analysis</span>
                        <span className="font-semibold capitalize text-indigo-600 dark:text-indigo-400">
                          {detail.sentimentSummary.sentiment}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-700/60">
                        <span className="text-slate-500 dark:text-slate-400">Estimated Tokens</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{detail.sentimentSummary.estimatedTokens} tokens</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500 dark:text-slate-400">Average Turnaround</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">~{detail.sentimentSummary.avgTurnaroundTimeMs}ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CAPTURED LEAD */}
              {activeTab === 'lead' && (
                <div>
                  {detail.lead ? (
                    <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-xl mx-auto space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">Lead Successfully Captured</h4>
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(detail.lead.capturedAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-xs text-slate-500 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Full Name:</span>
                          <strong className="text-slate-800 dark:text-slate-200">{detail.lead.name}</strong>
                        </div>
                        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                          <span className="text-xs text-slate-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address:</span>
                          <div className="flex items-center gap-2">
                            <a href={`mailto:${detail.lead.email}`} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                              {detail.lead.email}
                            </a>
                            <button
                              onClick={() => copyToClipboard(detail.lead!.email, 'email')}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            >
                              {copiedText === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        {detail.lead.phone && (
                          <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-xs text-slate-500 flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Phone Number:</span>
                            <strong className="text-slate-800 dark:text-slate-200">{detail.lead.phone}</strong>
                          </div>
                        )}
                        {detail.lead.company && (
                          <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-xs text-slate-500 flex items-center gap-1.5"><Building className="w-3.5 h-3.5" /> Company:</span>
                            <strong className="text-slate-800 dark:text-slate-200">{detail.lead.company}</strong>
                          </div>
                        )}
                        {detail.lead.firstQuestion && (
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                            <span className="text-slate-500 font-semibold block mb-1">Initial Inquiry:</span>
                            <p className="text-slate-700 dark:text-slate-300 italic">"{detail.lead.firstQuestion}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400 space-y-2">
                      <Mail className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">No lead was captured in this conversation session.</p>
                      <p className="text-xs text-slate-500">The visitor did not submit their email address or contact form.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: AUDIT LOG */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  {detail.auditLogs.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-sm">
                      <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      No administrative actions recorded for this conversation.
                    </div>
                  ) : (
                    detail.auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{log.action}</span>
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded font-semibold text-[10px]">
                              {log.status}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400">
                            By admin <strong className="text-slate-700 dark:text-slate-300">{log.adminEmail}</strong>
                          </p>
                          {log.details && (
                            <p className="text-slate-400 text-[11px] font-mono mt-1">{log.details}</p>
                          )}
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
          <div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-medium hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purge Conversation Record
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-rose-600 font-semibold">Permanently delete?</span>
                <button
                  type="button"
                  onClick={handleDeleteConversation}
                  disabled={isUpdatingStatus}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
