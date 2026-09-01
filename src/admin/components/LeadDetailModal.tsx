import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Building,
  Phone,
  Calendar,
  Sparkles,
  MessageSquare,
  Bot,
  Globe,
  ExternalLink,
  Flame,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Star,
  Copy,
  Check
} from 'lucide-react';
import { LeadItem } from '../repositories/adminFunnelRepo';
import { useAdminAuth } from '../context/AdminAuthContext';

interface LeadDetailModalProps {
  leadId: string | null;
  onClose: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ leadId, onClose }) => {
  useAdminAuth();
  const [data, setData] = useState<{ lead: LeadItem; messages: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);

  useEffect(() => {
    if (!leadId) return;
    setIsLoading(true);
    setError(null);

    fetch(`/api/admin/funnel/leads/${leadId}`, {
      credentials: 'include',
    })
      .then(async (res) => {
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response from server');
        }
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load lead profile');
        setData(json);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [leadId]);

  if (!leadId) return null;

  const lead = data?.lead;
  const messages = data?.messages || [];

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="lead-detail-modal"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              {lead?.name?.charAt(0).toUpperCase() || 'L'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lead ? lead.name : 'Loading Lead Profile...'}
                </h2>
                {lead && (
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      lead.tier === 'Hot'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        : lead.tier === 'Warm'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {lead.tier === 'Hot' && <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />}
                    {lead.tier} Lead ({lead.score}/100)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Captured from workspace: <span className="font-semibold text-slate-700 dark:text-slate-200">{lead?.tenantName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Analyzing lead profile and transcript...</p>
          </div>
        ) : error || !lead ? (
          <div className="p-8 text-center text-rose-500 text-sm">
            {error || 'Failed to load lead details'}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Details Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contact Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Contact Details
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Email:</span>
                    <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white font-mono">
                      <span>{lead.email}</span>
                      <button
                        onClick={() => handleCopyEmail(lead.email)}
                        className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                        title="Copy Email"
                      >
                        {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-mono text-slate-900 dark:text-white">{lead.phone}</span>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Company:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{lead.company}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Chatbot & Origin Context */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" /> Interaction Origin
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Chatbot:</span>
                    <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                      <span>{lead.chatbotAvatar}</span> {lead.chatbotName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-700 dark:text-slate-300">{lead.visitorLocation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Captured At:</span>
                    <span className="font-mono text-slate-500">{new Date(lead.capturedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Intent Scoring Indicators */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Intent Intelligence
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Quality Score:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      {lead.score} / 100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Signals Detected:</span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[160px]">
                      {lead.highIntentKeywords.length > 0 ? (
                        lead.highIntentKeywords.map((kw) => (
                          <span
                            key={kw}
                            className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-bold uppercase"
                          >
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">General inquiry</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* First Question Callout */}
            {lead.firstQuestion && (
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-1">
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Initial Question / Trigger Inquiry
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic">
                  "{lead.firstQuestion}"
                </p>
              </div>
            )}

            {/* Conversation Transcript */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  Full Conversation Dialogue ({messages.length} messages)
                </h3>
                {lead.csatRating && (
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> CSAT: {lead.csatRating}/5
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-3 max-h-80 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No message logs found for this session.</p>
                ) : (
                  messages.map((m) => {
                    const isUser = m.sender === 'user';
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 text-xs ${isUser ? 'justify-start' : 'justify-start'}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                            isUser
                              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {isUser ? 'U' : 'AI'}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {isUser ? lead.name : lead.chatbotName}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {new Date(m.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed shadow-2xs">
                            {m.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <span className="text-xs text-slate-400 font-mono">ID: {lead?.id}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
