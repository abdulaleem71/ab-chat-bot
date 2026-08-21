import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OverviewMetrics } from '../repositories/adminOverviewRepo';
import { Activity, Filter, Search, User, Bot, MessageSquare, Shield, Sparkles, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { MotionButton } from '../../components/common/MotionButton';

interface LiveActivityFeedProps {
  metrics: OverviewMetrics | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({
  metrics,
  isLoading,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const events = metrics?.recentEvents || [];

  const filteredEvents = events.filter((evt) => {
    if (filterType !== 'ALL' && evt.type !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        evt.title.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q) ||
        evt.actor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2 font-heading">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>Real-Time Platform Activity Feed</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1 font-body">
              Live audit stream derived strictly from real database transactions and tenant operations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time Stream Active</span>
            </span>
            <MotionButton
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-zinc-500' : ''}`} />}
            >
              Refresh
            </MotionButton>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Events' },
              { id: 'USER_SIGNUP', label: 'User Signups' },
              { id: 'CHATBOT_CREATED', label: 'Chatbots' },
              { id: 'CONVERSATION_STARTED', label: 'Conversations' },
              { id: 'LEAD_CAPTURED', label: 'Leads' },
              { id: 'ADMIN_ACTION', label: 'Admin Actions' },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilterType(tab.id)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer font-heading ${
                  filterType === tab.id
                    ? 'text-white font-bold'
                    : 'bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 border border-zinc-200'
                }`}
              >
                {filterType === tab.id && (
                  <motion.div
                    layoutId="activeFilterTabPill"
                    className="absolute inset-0 bg-zinc-950 rounded-xl shadow-xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search activity events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white font-mono transition"
            />
          </div>
        </div>
      </motion.div>

      {/* Events List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs"
      >
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 font-body">
            No events match the selected criteria in the live database stream.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredEvents.map((evt) => {
              const dateObj = new Date(evt.timestamp);
              const timeStr = dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const dateStr = dateObj.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-4 flex items-start justify-between gap-4 group hover:bg-zinc-50/70 -mx-2 px-2 rounded-xl transition"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        evt.type === 'USER_SIGNUP'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : evt.type === 'CHATBOT_CREATED'
                          ? 'bg-zinc-100 border-zinc-300 text-zinc-900'
                          : evt.type === 'CONVERSATION_STARTED'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : evt.type === 'LEAD_CAPTURED'
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}
                    >
                      {evt.type === 'USER_SIGNUP' && <User className="w-4 h-4" />}
                      {evt.type === 'CHATBOT_CREATED' && <Bot className="w-4 h-4" />}
                      {evt.type === 'CONVERSATION_STARTED' && <MessageSquare className="w-4 h-4" />}
                      {evt.type === 'LEAD_CAPTURED' && <Sparkles className="w-4 h-4" />}
                      {evt.type === 'ADMIN_ACTION' && <Shield className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-950 font-heading">{evt.title}</span>
                        <span className="text-[10px] font-mono bg-zinc-100 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded-md">
                          {evt.type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 font-body">{evt.description}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                        <span>Actor: <strong className="text-zinc-800">{evt.actor}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-semibold text-zinc-800">{timeStr}</div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{dateStr}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};
