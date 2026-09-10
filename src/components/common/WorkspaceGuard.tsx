import React from 'react';
import { Bot, Plus, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Chatbot } from '../../types';

export interface WorkspaceGuardProps {
  selectedBot: Chatbot | null;
  featureTitle: string;
  featureDescription: string;
  onCreateBot: () => void;
  children: React.ReactNode;
  chatbots?: Chatbot[];
  onSelectBot?: (bot: Chatbot) => void;
}

export const WorkspaceGuard: React.FC<WorkspaceGuardProps> = ({
  selectedBot,
  featureTitle,
  featureDescription,
  onCreateBot,
  children,
  chatbots,
  onSelectBot,
}) => {
  if (selectedBot) {
    return <>{children}</>;
  }

  const availableBots = chatbots && chatbots.length > 0 ? chatbots : [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full min-h-[380px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-zinc-200 shadow-xs max-w-lg mx-auto my-12"
    >
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
        <Bot className="w-7 h-7 text-zinc-700" />
      </div>
      <h3 className="text-base font-bold text-zinc-900 mb-1.5 font-heading">
        Select or Create a Bot for {featureTitle}
      </h3>
      <p className="text-xs text-zinc-500 max-w-sm mb-6 leading-relaxed font-body">
        {featureDescription}
      </p>

      {availableBots.length > 0 && onSelectBot ? (
        <div className="w-full space-y-3 mb-4">
          <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Quick Select Existing Bot
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {availableBots.slice(0, 4).map((bot) => (
              <button
                key={bot.id}
                onClick={() => onSelectBot(bot)}
                type="button"
                className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 transition text-left cursor-pointer group"
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 text-white"
                  style={{ backgroundColor: bot.primaryColor || '#4F46E5' }}
                >
                  {bot.avatar || '🤖'}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-zinc-900 truncate block group-hover:text-black">
                    {bot.name}
                  </span>
                </div>
                <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 shrink-0" />
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-zinc-100 flex items-center justify-center">
            <button
              onClick={onCreateBot}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Or create a new bot</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onCreateBot}
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Your First Chatbot</span>
        </button>
      )}
    </motion.div>
  );
};
