import React, { useState } from 'react';
import { Chatbot } from '../../types';
import { Bot, Plus, Settings, MessageSquare, Code, ExternalLink, Sparkles, CheckCircle2, ShieldCheck, UserCheck, Trash2, Globe, AlertTriangle } from 'lucide-react';

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
  const [deletingBot, setDeletingBot] = useState<Chatbot | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-black tracking-tight">AI Chatbots Manager</h1>
          <p className="text-xs text-zinc-500 font-medium">Configure chatbot personas, customize brand colors, upload RAG knowledge, and retrieve embed scripts.</p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Create New AI Chatbot</span>
        </button>
      </div>

      {/* Guidance Banner: How to Manage Chatbot */}
      <div className="bg-zinc-900 text-white border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <span className="inline-flex items-center gap-1.5 bg-black border border-zinc-700 text-white px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-white" />
              <span>Management Guide</span>
            </span>
            <h3 className="text-lg font-extrabold text-white">How to manage your AI Chatbot & Brand Theme:</h3>
            <p className="text-xs text-zinc-300 font-medium leading-relaxed">
              1. Click <strong>Settings (⚙️)</strong> to change chatbot primary color, welcome greeting, and lead gate.<br />
              2. Click <strong>Train (✨)</strong> to scrape company pages, FAQs, or support articles.<br />
              3. Click <strong>Test Live (💬)</strong> to verify grounding answers in the Interactive Playground.<br />
              4. Click <strong>Embed Code (&lt;/&gt;)</strong> to copy the 1-line JS widget script for your website.
            </p>
          </div>
          <div className="bg-black/80 border border-zinc-800 p-4 rounded-2xl shrink-0 text-xs space-y-2">
            <div className="font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Grounded AI Guarantee</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium max-w-xs">
              Every query is checked against your uploaded knowledge sources to prevent hallucinations and cite sources accurately.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Chatbots */}
      {chatbots.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-300 rounded-3xl p-8 text-center space-y-4 my-6">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto text-zinc-500">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">No Custom AI Chatbots Found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
              Create your first chatbot or click below to retrieve the instant widget embed code for the default Acme AI Assistant.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenCreateModal}
              className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New AI Chatbot</span>
            </button>
            <button
              onClick={() => onOpenEmbedModal(undefined as unknown as Chatbot)}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer border border-zinc-300"
            >
              <Code className="w-4 h-4" />
              <span>Get Sample Embed Code</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map(bot => (
            <div
              key={bot.id}
              className="bg-white border border-zinc-200 hover:border-black rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Bot Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: bot.primaryColor || '#000000' }}
                      className="w-12 h-12 rounded-2xl text-2xl flex items-center justify-center text-white shadow-md shrink-0"
                    >
                      {bot.avatar || '🤖'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-black group-hover:text-zinc-700 transition">{bot.name}</h3>
                        <span className="bg-zinc-100 text-black text-[10px] font-bold px-1.5 py-0.5 rounded border border-zinc-300 uppercase">
                          {bot.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-1">{bot.description}</p>
                    </div>
                  </div>
                </div>

                {/* Specs Badges */}
                <div className="grid grid-cols-2 gap-2 my-4 text-[11px] font-medium bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Model Engine</span>
                    <span className="text-zinc-800 font-semibold">{bot.model}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Persona Tone</span>
                    <span className="text-zinc-800 font-semibold">{bot.tone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Lead Capture</span>
                    <span className={`font-semibold ${bot.collectLeadEmail ? 'text-black' : 'text-zinc-400'}`}>
                      {bot.collectLeadEmail ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold">Data Source</span>
                    <span className="text-black font-semibold flex items-center gap-1 truncate" title={bot.websiteUrl}>
                      <Globe className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="truncate">{bot.websiteUrl ? bot.websiteUrl.replace(/^https?:\/\//, '') : 'Indexed'}</span>
                    </span>
                  </div>
                </div>

                {/* Greeting Sample */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 mb-4">
                  <span className="text-[10px] font-bold text-black uppercase tracking-wider block mb-1">Greeting Preview</span>
                  <p className="text-xs text-zinc-700 italic">"{bot.greetingMessage}"</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => onTrainBot(bot)}
                  className="flex-1 text-xs font-semibold text-black bg-zinc-100 hover:bg-black hover:text-white py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Train</span>
                </button>

                <button
                  onClick={() => onTestBot(bot)}
                  className="flex-1 text-xs font-semibold text-white bg-black hover:bg-zinc-800 py-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Test</span>
                </button>

                <button
                  onClick={() => onOpenEmbedModal(bot)}
                  className="p-2 text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-xl transition cursor-pointer"
                  title="Get Embed Code"
                >
                  <Code className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onEditBot(bot)}
                  className="p-2 text-zinc-600 hover:text-black bg-zinc-100 hover:bg-zinc-200 rounded-xl transition cursor-pointer"
                  title="Edit Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {onDeleteBot && (
                  <button
                    onClick={() => setDeletingBot(bot)}
                    className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-zinc-200 shadow-2xl space-y-4 relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Delete AI Chatbot?</h3>
                <p className="text-xs text-zinc-500 font-medium">Permanent removal request</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed font-medium bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
              Are you sure you want to permanently delete <strong className="text-black font-extrabold">{deletingBot.name}</strong>? All trained knowledge base pages, grounding embeddings, lead records, and widget configurations associated with this bot will be erased.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingBot(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteBot && deletingBot) {
                    onDeleteBot(deletingBot);
                  }
                  setDeletingBot(null);
                }}
                className="px-4 py-2.5 text-xs font-extrabold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
                <span>Yes, Delete Chatbot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
