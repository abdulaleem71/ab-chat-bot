import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chatbot } from '../../types';
import { Bot, Plus, Settings, MessageSquare, Code, ShieldCheck, Trash2, Globe, AlertTriangle, Search, BookOpen } from 'lucide-react';
import { Button, MotionButton, Badge, EmptyState, ConfirmDialog, BotListSkeleton } from '../common';
import { getModelDisplayName } from '../../config/models';

interface BotListProps {
  chatbots: Chatbot[];
  isLoading?: boolean;
  onOpenCreateModal: () => void;
  onEditBot: (bot: Chatbot) => void;
  onTestBot: (bot: Chatbot) => void;
  onOpenEmbedModal: (bot: Chatbot) => void;
  onTrainBot: (bot: Chatbot) => void;
  onDeleteBot?: (bot: Chatbot) => void;
}

export const BotList: React.FC<BotListProps> = ({
  chatbots,
  isLoading = false,
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
      transition: { duration: 0.25 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">Deployed AI Chatbots</h1>
          <p className="text-xs text-zinc-500 font-normal mt-0.5 font-body">Configure bots, test live grounding, or copy embed scripts.</p>
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-zinc-200 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chatbots by name, prompt, or domain..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition font-body"
          />
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg shrink-0">
          {(['all', 'active', 'draft'] as const).map(filter => (
            <motion.button
              type="button"
              key={filter}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition cursor-pointer font-heading ${
                statusFilter === filter
                  ? 'bg-white text-zinc-900 shadow-xs font-bold'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {filter}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Grid of Chatbots */}
      {isLoading ? (
        <BotListSkeleton count={6} />
      ) : filteredBots.length === 0 ? (
        <EmptyState
          icon={<Bot className="w-6 h-6 text-zinc-700" />}
          badge={searchQuery || statusFilter !== 'all' ? 'Filtered Search' : 'Getting Started'}
          title={chatbots.length === 0 ? 'No Chatbots Created Yet' : 'No Chatbots Found'}
          description={
            chatbots.length === 0
              ? 'Create your first custom AI Assistant to ground documentation and deploy live.'
              : `No chatbots match your search criteria. Try a different keyword or reset filters.`
          }
          actionLabel={chatbots.length === 0 ? 'Create New Chatbot' : 'Reset Filters'}
          onAction={
            chatbots.length === 0
              ? onOpenCreateModal
              : () => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }
          }
        />
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
              className="bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-5 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: bot.primaryColor || '#09090b' }}
                      className="w-11 h-11 rounded-lg text-xl flex items-center justify-center text-white shadow-xs shrink-0 font-bold"
                    >
                      {bot.avatar || '🤖'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-black transition truncate max-w-[140px] font-heading">
                          {bot.name}
                        </h3>
                        <Badge
                          variant={bot.status === 'active' ? 'success' : 'secondary'}
                          size="sm"
                          dot
                          pulse={bot.status === 'active'}
                        >
                          {bot.status}
                        </Badge>
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
                    type="button"
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onEditBot(bot)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                    title="Bot Settings"
                    aria-label={`Configure settings for ${bot.name}`}
                  >
                    <Settings className="w-4 h-4" />
                  </motion.button>
                </div>

                <p className="text-xs text-zinc-600 font-normal line-clamp-2 leading-relaxed font-body">
                  {bot.description || 'Handles customer inquiries grounded on your knowledge base documentation.'}
                </p>

                {/* Specs Box */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase font-bold font-heading">Engine</span>
                    <span className="text-zinc-800 font-semibold font-body">{getModelDisplayName(bot.model)}</span>
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
                  type="button"
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onTrainBot(bot)}
                  className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition cursor-pointer"
                  title="Knowledge Base Documents"
                  aria-label={`Knowledge base documents for ${bot.name}`}
                >
                  <BookOpen className="w-4 h-4" />
                </motion.button>

                {onDeleteBot && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08, y: -1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setDeletingBot(bot)}
                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200 hover:border-rose-200 rounded-lg transition cursor-pointer"
                    title="Delete Chatbot"
                    aria-label={`Delete chatbot ${bot.name}`}
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
      <ConfirmDialog
        isOpen={!!deletingBot}
        title={`Delete "${deletingBot?.name || 'Chatbot'}"?`}
        description="This will permanently delete this AI chatbot and unlink all associated conversations, messages, analytics, and knowledge embeddings. This action cannot be undone."
        itemName={deletingBot?.name || ''}
        confirmButtonText="Delete Chatbot"
        onConfirm={() => {
          if (onDeleteBot && deletingBot) {
            onDeleteBot(deletingBot);
          }
          setDeletingBot(null);
        }}
        onClose={() => setDeletingBot(null)}
      />
    </div>
  );
};


