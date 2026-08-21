import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Conversation, Message, Chatbot } from '../../types';
import { MarkdownContent } from '../../lib/markdown';
import { Inbox, User, Bot, Send, CheckCircle2, Search, Trash2, Mail, MapPin, Globe, Clock, UserCheck, ShieldCheck, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { MotionButton } from '../common/MotionButton';

interface InboxViewProps {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  chatbots: Chatbot[];
  onSendMessage: (conversationId: string, content: string, sender: 'agent' | 'visitor') => void;
  onToggleTakeover: (conversationId: string, isTakeover: boolean) => void;
  onResolveConversation: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  conversations,
  messages,
  chatbots,
  onSendMessage,
  onToggleTakeover,
  onResolveConversation,
  onDeleteConversation,
}) => {
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const [replyInput, setReplyInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'human_takeover' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeConv = conversations.find(c => c.id === selectedConvId) || conversations[0];
  const activeBot = chatbots.find(b => b.id === activeConv?.chatbotId) || chatbots[0];
  const activeThread = activeConv ? messages[activeConv.id] || [] : [];

  const filteredConversations = conversations.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (c.visitorName && c.visitorName.toLowerCase().includes(q)) ||
        (c.visitorEmail && c.visitorEmail.toLowerCase().includes(q)) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeConv) return;
    onSendMessage(activeConv.id, replyInput.trim(), 'agent');
    setReplyInput('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">Customer Support Inbox</h1>
          <p className="text-xs text-zinc-500 font-medium">Monitor live visitor conversations, inspect captured leads, and takeover in human operator mode.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live SQLite Database Sync</span>
          </span>
        </div>
      </div>

      {/* Main Inbox 3-Column Layout */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Column 1: Conversation List (4 Cols) */}
        <div className="lg:col-span-4 border-r border-zinc-200 flex flex-col bg-zinc-50/50">
          {/* Search & Filters */}
          <div className="p-3.5 border-b border-zinc-200 space-y-2.5 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by visitor name, email, or query..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold font-heading">
              {(['all', 'active', 'human_takeover', 'resolved'] as const).map(st => (
                <motion.button
                  key={st}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition whitespace-nowrap cursor-pointer ${
                    filterStatus === st ? 'bg-zinc-950 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  {st === 'human_takeover' ? 'Operator' : st}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {filteredConversations.length === 0 ? (
              <div className="p-10 text-center text-zinc-400 text-xs font-medium space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-zinc-300" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.id === activeConv?.id;
                const isHuman = conv.status === 'human_takeover';

                return (
                  <motion.button
                    key={conv.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-4 transition flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected ? 'bg-zinc-100/90 border-l-4 border-zinc-950' : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {conv.visitorName ? conv.visitorName[0].toUpperCase() : 'V'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold text-zinc-900 truncate font-heading">{conv.visitorName || 'Anonymous Visitor'}</h4>
                          {isHuman && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase font-mono">
                              Operator
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate font-body">{conv.visitorEmail || 'Direct Visitor'}</p>
                        <p className="text-[11px] text-zinc-800 font-medium truncate mt-1 font-body">"{conv.lastMessage}"</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-zinc-400 shrink-0 font-medium font-mono">
                      {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Chat Thread (5 Cols) */}
        {activeConv ? (
          <div className="lg:col-span-5 flex flex-col justify-between bg-white border-r border-zinc-200">
            {/* Thread Header */}
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white font-bold text-xs flex items-center justify-center font-heading">
                  {activeConv.visitorName ? activeConv.visitorName[0].toUpperCase() : 'V'}
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-zinc-900 font-heading">{activeConv.visitorName || 'Visitor Thread'}</h3>
                  <p className="text-[10px] text-zinc-500 font-medium font-body">Assigned Bot: {activeBot?.name}</p>
                </div>
              </div>

              {/* Human Takeover Toggle */}
              <div className="flex items-center gap-2">
                <MotionButton
                  variant={activeConv.status === 'human_takeover' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => onToggleTakeover(activeConv.id, activeConv.status !== 'human_takeover')}
                  leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                >
                  {activeConv.status === 'human_takeover' ? 'Operator Mode' : 'Take Over'}
                </MotionButton>
              </div>
            </div>

            {/* Chat Thread Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-50/30">
              {activeThread.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'visitor' ? 'justify-start' : 'justify-end'}`}
                >
                  {msg.sender === 'visitor' && (
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 font-heading">
                      V
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs ${
                      msg.sender === 'visitor'
                        ? 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-xs'
                        : msg.sender === 'agent'
                        ? 'bg-emerald-600 text-white rounded-tr-xs'
                        : 'bg-zinc-950 text-white rounded-tr-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 text-[10px] opacity-75 font-bold font-heading">
                      <span>{msg.sender === 'agent' ? 'Human Agent' : msg.sender === 'bot' ? activeBot?.name : 'Visitor'}</span>
                      <span className="font-normal font-mono text-[9px]">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={msg.sender === 'visitor' ? 'text-zinc-900 font-body' : 'text-white font-body'}>
                      <MarkdownContent content={msg.content} />
                    </div>
                  </div>

                  {(msg.sender === 'bot' || msg.sender === 'agent') && (
                    <div
                      style={{ backgroundColor: activeBot?.primaryColor || '#09090b' }}
                      className="w-7 h-7 rounded-lg text-white text-xs flex items-center justify-center shrink-0 font-bold"
                    >
                      {msg.sender === 'agent' ? '👤' : activeBot?.avatar || '🤖'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="p-3.5 border-t border-zinc-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={replyInput}
                onChange={e => setReplyInput(e.target.value)}
                placeholder={
                  activeConv.status === 'human_takeover'
                    ? 'Type reply as human support operator...'
                    : 'Click "Take Over" above to respond directly...'
                }
                disabled={activeConv.status !== 'human_takeover'}
                className="flex-1 px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400 font-medium font-body"
              />
              <MotionButton
                type="submit"
                variant="primary"
                size="md"
                disabled={activeConv.status !== 'human_takeover' || !replyInput.trim()}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send
              </MotionButton>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-5 flex items-center justify-center text-zinc-400 text-xs p-8 font-body">
            Select a conversation thread to inspect
          </div>
        )}

        {/* Column 3: Visitor Context & Lead Info (3 Cols) */}
        {activeConv && (
          <div className="lg:col-span-3 p-5 bg-zinc-50/80 space-y-5 overflow-y-auto font-body">
            <div>
              <h4 className="text-xs font-extrabold text-zinc-900 mb-3 pb-1 border-b border-zinc-200 font-heading">
                Visitor Lead Profile
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2.5 text-zinc-700">
                  <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="font-bold text-zinc-900">{activeConv.visitorName || 'Anonymous Visitor'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-zinc-700">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="font-mono text-zinc-900">{activeConv.visitorEmail || 'No email provided'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-zinc-700">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{activeConv.visitorLocation || 'Direct Web Session'}</span>
                </div>

                <div className="flex items-center gap-2.5 text-zinc-700">
                  <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{activeConv.visitorBrowser || 'Chrome Web Browser'}</span>
                </div>
              </div>
            </div>

            {/* Conversation Metadata */}
            <div className="pt-3 border-t border-zinc-200 space-y-2.5 text-[11px] text-zinc-600">
              <span className="font-bold text-zinc-900 uppercase text-[10px] block font-heading">Referral URL</span>
              <p className="text-zinc-800 font-mono text-[10px] bg-white p-2 rounded-xl border border-zinc-200 truncate select-all">
                {activeConv.pageUrl || 'Direct / Embedded Session'}
              </p>

              {activeConv.csatRating && (
                <div className="pt-2">
                  <span className="font-bold text-zinc-900 uppercase text-[10px] block mb-1 font-heading">Customer CSAT Feedback</span>
                  <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md inline-block font-mono">
                    ⭐ {activeConv.csatRating} / 5.0 Rating
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-zinc-200">
              <MotionButton
                variant="primary"
                size="md"
                fullWidth
                onClick={() => onResolveConversation(activeConv.id)}
                leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              >
                Mark as Resolved
              </MotionButton>

              {onDeleteConversation && (
                <MotionButton
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={() => onDeleteConversation(activeConv.id)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete Thread
                </MotionButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
