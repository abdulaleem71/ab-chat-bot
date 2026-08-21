import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chatbot } from '../../types';
import { Bot, Plus, Settings, MessageSquare, Code, ShieldCheck, Trash2, Globe, AlertTriangle, Search, BookOpen } from 'lucide-react';
import { MotionButton } from '../common/MotionButton';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: 'easeOut' },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight font-heading">Deployed AI Chatbots</h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5 font-body">Configure bots, test live grounding, or copy embed scripts.</p>
        </div>
        <MotionButton
          variant="primary"
          size="md"
          shimmer
          leftIcon={<Plus className="w-4 h-4 text-white" />}
          onClick={onOpenCreateModal}
          className="shrink-0"
        >
          Create AI Bot
        </MotionButton>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200/90 p-3 rounded-2xl shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chatbots by name, prompt, or domain..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-50/70 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white transition font-body"
          />
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl shrink-0">
          {(['all', 'active', 'draft'] as const).map(filter => (
            <motion.button
              key={filter}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition cursor-pointer font-heading ${
                statusFilter === filter
                  ? 'bg-white text-zinc-900 shadow-2xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {filter}
            </motion.button>
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
            <h3 className="text-base font-bold text-zinc-900 font-heading">No Chatbots Found</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 font-body">
              {searchQuery ? 'No chatbots match your current search criteria.' : 'Create your first custom AI Assistant to get started.'}
            </p>
          </div>
          <MotionButton
            variant="primary"
            size="md"
            shimmer
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onOpenCreateModal}
          >
            Create New Chatbot
          </MotionButton>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredBots.map(bot => (
            <motion.div
              key={bot.id}
              variants={cardVariants}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200/90 hover:border-zinc-900 rounded-2xl md:rounded-3xl p-5 shadow-2xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: bot.primaryColor || '#09090b' }}
                      className="w-11 h-11 rounded-xl text-xl flex items-center justify-center text-white shadow-2xs shrink-0 font-bold"
                    >
                      {bot.avatar || '🤖'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-extrabold text-zinc-900 group-hover:text-black transition truncate max-w-[140px] font-heading">
                          {bot.name}
                        </h3>
                        <span className="bg-zinc-100 text-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {bot.status}
                        </span>
                      </div>
                      {bot.websiteUrl && (
                        <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1 mt-0.5 font-mono">
                          <Globe className="w-3 h-3 shrink-0" />
                          <span>{bot.websiteUrl.replace(/^https?:\/\//, '')}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEditBot(bot)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
                    title="Bot Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </motion.button>
                </div>

                <p className="text-xs text-zinc-600 font-normal line-clamp-2 leading-relaxed font-body">
                  {bot.description || 'Handles customer inquiries grounded on your knowledge base documentation.'}
                </p>

                {/* Specs Box */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-50/80 p-3 rounded-xl border border-zinc-200/80">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold font-heading">Engine</span>
                    <span className="text-zinc-800 font-semibold font-body">{bot.model}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold font-heading">Tone</span>
                    <span className="text-zinc-800 font-semibold font-body">{bot.tone}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
                <MotionButton
                  variant="primary"
                  size="xs"
                  shimmer
                  leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                  onClick={() => onTestBot(bot)}
                  className="flex-1"
                >
                  Test Bot
                </MotionButton>

                <MotionButton
                  variant="outline"
                  size="xs"
                  shimmer
                  leftIcon={<Code className="w-3.5 h-3.5 text-zinc-700" />}
                  onClick={() => onOpenEmbedModal(bot)}
                  title="Get Embed Code"
                >
                  Embed
                </MotionButton>

                <motion.button
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onTrainBot(bot)}
                  className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition cursor-pointer"
                  title="Knowledge Base Documents"
                >
                  <BookOpen className="w-4 h-4" />
                </motion.button>

                {onDeleteBot && (
                  <motion.button
                    whileHover={{ scale: 1.08, y: -1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setDeletingBot(bot)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 rounded-xl transition cursor-pointer"
                    title="Delete Chatbot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Grounded KB Active Banner */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-5 shadow-2xs flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-zinc-900 mb-0.5 font-heading">Grounded Knowledge Base Active</h4>
          <p className="text-xs text-zinc-500 leading-relaxed font-normal font-body">
            Queries are automatically cross-checked with scraped pages and uploaded documents to prevent hallucinations.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingBot && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-zinc-900 font-heading">Delete {deletingBot.name}?</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-body">
                  This will permanently delete this AI chatbot and unlink all associated conversations and embeddings. This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <MotionButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingBot(null)}
                >
                  Cancel
                </MotionButton>
                <MotionButton
                  variant="danger"
                  size="sm"
                  shimmer
                  onClick={() => {
                    if (onDeleteBot) onDeleteBot(deletingBot);
                    setDeletingBot(null);
                  }}
                >
                  Delete Chatbot
                </MotionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


