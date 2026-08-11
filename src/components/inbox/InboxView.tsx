import React, { useState } from 'react';
import { Conversation, Message, Chatbot } from '../../types';
import { Inbox, User, Bot, Send, ShieldAlert, CheckCircle2, Search, Filter, Phone, Mail, MapPin, Globe, Clock, UserCheck, Sparkles, MessageSquare } from 'lucide-react';

interface InboxViewProps {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  chatbots: Chatbot[];
  onSendMessage: (conversationId: string, content: string, sender: 'agent' | 'visitor') => void;
  onToggleTakeover: (conversationId: string, isTakeover: boolean) => void;
  onResolveConversation: (conversationId: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  conversations,
  messages,
  chatbots,
  onSendMessage,
  onToggleTakeover,
  onResolveConversation,
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
    onSendMessage(activeConv.id, replyInput, 'agent');
    setReplyInput('');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Support Inbox & Real-Time Live Chat</h1>
          <p className="text-xs text-slate-500">Manage incoming visitor queries, view captured lead info, and perform live human agent takeover</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-Time Firestore Sync</span>
          </span>
        </div>
      </div>

      {/* Main Inbox 3-Column Layout */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Column 1: Conversation List (4 Cols) */}
        <div className="lg:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50">
          {/* Search & Filters */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search visitor email or query..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-medium">
              {(['all', 'active', 'human_takeover', 'resolved'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition whitespace-nowrap ${
                    filterStatus === st ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Inbox className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <span>No conversations found matching filters</span>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.id === activeConv?.id;
                const isHuman = conv.status === 'human_takeover';

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3.5 transition flex items-start justify-between gap-2 ${
                      isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {conv.visitorName ? conv.visitorName[0] : 'V'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{conv.visitorName || 'Anonymous Visitor'}</h4>
                          {isHuman && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                              Agent Mode
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{conv.visitorEmail || 'No email captured'}</p>
                        <p className="text-[11px] text-slate-700 font-medium truncate mt-1">"{conv.lastMessage}"</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Chat Thread (5 Cols) */}
        {activeConv ? (
          <div className="lg:col-span-5 flex flex-col justify-between bg-white border-r border-slate-200">
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {activeConv.visitorName ? activeConv.visitorName[0] : 'V'}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{activeConv.visitorName || 'Visitor Thread'}</h3>
                  <p className="text-[10px] text-slate-500">Bot: {activeBot?.name}</p>
                </div>
              </div>

              {/* Human Takeover Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleTakeover(activeConv.id, activeConv.status !== 'human_takeover')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 ${
                    activeConv.status === 'human_takeover'
                      ? 'bg-amber-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{activeConv.status === 'human_takeover' ? 'Human Agent Replying' : 'Take Over (Pause AI)'}</span>
                </button>
              </div>
            </div>

            {/* Chat Thread Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
              {activeThread.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'visitor' ? 'justify-start' : 'justify-end'}`}
                >
                  {msg.sender === 'visitor' && (
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      V
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs ${
                      msg.sender === 'visitor'
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                        : msg.sender === 'agent'
                        ? 'bg-emerald-600 text-white font-medium rounded-tr-xs'
                        : 'bg-indigo-600 text-white rounded-tr-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1 text-[10px] opacity-80 font-bold">
                      <span>{msg.sender === 'agent' ? 'Human Agent' : msg.sender === 'bot' ? activeBot?.name : 'Visitor'}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {(msg.sender === 'bot' || msg.sender === 'agent') && (
                    <div
                      style={{ backgroundColor: activeBot?.primaryColor }}
                      className="w-7 h-7 rounded-full text-white text-xs flex items-center justify-center shrink-0"
                    >
                      {msg.sender === 'agent' ? '👤' : activeBot?.avatar || '🤖'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={replyInput}
                onChange={e => setReplyInput(e.target.value)}
                placeholder={
                  activeConv.status === 'human_takeover'
                    ? 'Type reply as human support operator...'
                    : 'Click "Take Over" above to reply as human agent...'
                }
                disabled={activeConv.status !== 'human_takeover'}
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={activeConv.status !== 'human_takeover' || !replyInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-5 flex items-center justify-center text-slate-400 text-xs p-8">
            Select a conversation thread to inspect
          </div>
        )}

        {/* Column 3: Visitor Context & Lead Info (3 Cols) */}
        {activeConv && (
          <div className="lg:col-span-3 p-4 bg-slate-50/80 space-y-4 overflow-y-auto">
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-3 pb-1 border-b border-slate-200">
                Visitor Lead Profile
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{activeConv.visitorName || 'Unknown Name'}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-indigo-600">{activeConv.visitorEmail || 'No email given'}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeConv.visitorLocation || 'San Francisco, CA, USA'}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeConv.visitorBrowser || 'Chrome on macOS'}</span>
                </div>
              </div>
            </div>

            {/* Conversation Metadata */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-[11px] text-slate-600">
              <span className="font-bold text-slate-800 uppercase text-[10px] block">Current Web Page</span>
              <a
                href={activeConv.pageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline block truncate"
              >
                {activeConv.pageUrl || 'https://acmesaas.io'}
              </a>

              {activeConv.csatRating && (
                <div className="pt-2">
                  <span className="font-bold text-slate-800 uppercase text-[10px] block mb-1">CSAT Feedback</span>
                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                    ⭐ {activeConv.csatRating} / 5 Stars
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => onResolveConversation(activeConv.id)}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mark as Resolved</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
