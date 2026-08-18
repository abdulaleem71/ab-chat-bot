import React, { useState } from 'react';
import { Chatbot } from '../../types';
import { Bot, Plus, Settings, MessageSquare, Code, ExternalLink, Sparkles, CheckCircle2, ShieldCheck, UserCheck, Trash2, Globe, AlertTriangle, Search, BookOpen } from 'lucide-react';

interface BotListProps {
  chatbots: Chatbot[];
  onOpenCreateModal: () => void;
  onEditBot: (bot: Chatbot) => void;
  onTestBot: (bot: Chatbot) => void;
  onOpenEmbedModal: (bot: Chatbot) => void;
  onTrainBot: (bot: Chatbot) => void;
  onDeleteBot?: (bot: Chatbot) => void;
}

export const BotList: React.FC<BotListProps> = ({
  chatbots,
  onOpenCreateModal,
  onEditBot,
  onTestBot,
  onOpenEmbedModal,
  onTrainBot,
  onDeleteBot,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [deletingBot, setDeletingBot] = useState<Chatbot | null>(null);

  const filteredBots = chatbots.filter(b => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.websiteUrl && b.websiteUrl.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">AI Chatbots Fleet</h1>
          <p className="text-xs text-zinc-500 font-medium">Manage AI personas, custom colors, system prompts, and multi-tenant widget embeds.</p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Create AI Chatbot</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200/80 p-3 rounded-2xl shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chatbots by name, prompt, or domain..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl shrink-0">
          {(['all', 'active', 'draft'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
                statusFilter === filter
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Chatbots */}
      {filteredBots.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-300 rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto text-zinc-500">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">No Chatbots Found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              {searchQuery ? 'No chatbots match your current search criteria.' : 'Create your first custom AI Assistant to get started.'}
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Chatbot</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBots.map(bot => (
            <div
              key={bot.id}
              className="bg-white border border-zinc-200/80 hover:border-zinc-900 rounded-3xl p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: bot.primaryColor || '#09090b' }}
                      className="w-12 h-12 rounded-2xl text-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                    >
                      {bot.avatar || '🤖'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-extrabold text-zinc-900 group-hover:text-black transition truncate max-w-[150px]">
                          {bot.name}
                        </h3>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          bot.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {bot.status}
                        </span>
                      </div>
                      {bot.websiteUrl && (
                        <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                          <Globe className="w-3 h-3 shrink-0" />
                          <span>{bot.websiteUrl.replace(/^https?:\/\//, '')}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onEditBot(bot)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
                    title="Bot Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-zinc-600 font-normal line-clamp-2 leading-relaxed">
                  {bot.description || 'AI Assistant configured to answer inquiries using knowledge base documents.'}
                </p>

                {/* Specs Box */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-50 p-3 rounded-2xl border border-zinc-200/80">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Engine</span>
                    <span className="text-zinc-800 font-semibold">{bot.model}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Persona Tone</span>
                    <span className="text-zinc-800 font-semibold">{bot.tone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Lead Capture</span>
                    <span className={`font-semibold ${bot.collectLeadEmail ? 'text-emerald-600' : 'text-zinc-500'}`}>
                      {bot.collectLeadEmail ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Operator Mode</span>
                    <span className="text-zinc-800 font-semibold">
                      {bot.humanOperatorOnline ? 'Human Handoff' : 'AI Only'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onTestBot(bot)}
                  className="flex-1 text-center text-xs font-bold bg-zinc-950 hover:bg-zinc-800 text-white py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Test Playground</span>
                </button>

                <button
                  onClick={() => onTrainBot(bot)}
                  className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition cursor-pointer"
                  title="Train Knowledge Base"
                >
                  <BookOpen className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onOpenEmbedModal(bot)}
                  className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition cursor-pointer"
                  title="Get Embed Code"
                >
                  <Code className="w-4 h-4" />
                </button>

                {onDeleteBot && (
                  <button
                    onClick={() => setDeletingBot(bot)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-xl transition cursor-pointer"
                    title="Delete Chatbot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900">Delete {deletingBot.name}?</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                This will permanently delete this AI chatbot and unlink all associated conversations and embeddings. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingBot(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteBot) onDeleteBot(deletingBot);
                  setDeletingBot(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                Delete Chatbot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
