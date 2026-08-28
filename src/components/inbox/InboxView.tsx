import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Conversation, Message, Chatbot, ChannelType, TeamMember } from '../../types';
import { MarkdownContent } from '../../lib/markdown';
import {
  Inbox,
  User,
  Bot,
  Send,
  CheckCircle2,
  Search,
  Trash2,
  Mail,
  MapPin,
  Globe,
  Clock,
  UserCheck,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Smartphone,
  Instagram,
  Layout,
  Users,
  ChevronDown
} from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import { useAuth } from '../../context/AuthContext';

interface InboxViewProps {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  chatbots: Chatbot[];
  onSendMessage: (conversationId: string, content: string, sender: 'agent' | 'visitor') => void;
  onToggleTakeover: (conversationId: string, isTakeover: boolean) => void;
  onResolveConversation: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onAssignConversation?: (conversationId: string, teamMemberId: string, teamMemberName: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  conversations,
  messages,
  chatbots,
  onSendMessage,
  onToggleTakeover,
  onResolveConversation,
  onDeleteConversation,
  onAssignConversation,
}) => {
  const { user, token } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const [replyInput, setReplyInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'human_takeover' | 'resolved'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | ChannelType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Sync selected conversation if list updates
  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  // Fetch team members for assignment
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const currentToken = localStorage.getItem('auth_token') || token;
        const res = await fetch('/api/team/members', {
          headers: {
            'Content-Type': 'application/json',
            ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
          },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.members)) {
          setTeamMembers(data.members);
        }
      } catch (err) {
        console.error('Error loading team members for inbox assignment:', err);
      }
    };
    fetchMembers();
  }, [token]);

  const activeConv = conversations.find(c => c.id === selectedConvId) || conversations[0];
  const activeBot = chatbots.find(b => b.id === activeConv?.chatbotId) || chatbots[0];
  const activeThread = activeConv ? messages[activeConv.id] || [] : [];

  const handleAssign = async (memberId: string) => {
    if (!activeConv) return;
    const selectedMember = teamMembers.find(m => m.id === memberId);
    const memberName = selectedMember ? selectedMember.name : (memberId ? 'Agent' : '');

    setAssigning(true);
    try {
      const currentToken = localStorage.getItem('auth_token') || token;
      const res = await fetch(`/api/conversations/${activeConv.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
        },
        body: JSON.stringify({
          assignedTo: memberId || null,
          assignedToName: memberName || null,
        }),
      });
      const data = await res.json();
      if (data.success && onAssignConversation) {
        onAssignConversation(activeConv.id, memberId, memberName);
      }
      // Update locally
      if (activeConv) {
        activeConv.assignedTo = memberId || undefined;
        activeConv.assignedToName = memberName || undefined;
      }
    } catch (err) {
      console.error('Failed to assign conversation:', err);
    } finally {
      setAssigning(false);
    }
  };

  const getChannelBadge = (ch?: ChannelType | string) => {
    const norm = (ch || '').toLowerCase().replace(/\s+/g, '_');
    switch (norm) {
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.2 rounded-md">
            <Smartphone className="w-2.5 h-2.5" />
            WhatsApp
          </span>
        );
      case 'instagram_dm':
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.2 rounded-md">
            <Instagram className="w-2.5 h-2.5" />
            Instagram
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded-md">
            <Mail className="w-2.5 h-2.5" />
            Email
          </span>
        );
      case 'website_widget':
      case 'website':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded-md">
            <Layout className="w-2.5 h-2.5" />
            Web Widget
          </span>
        );
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (channelFilter !== 'all') {
      const convChannel = (c.channel || 'website_widget').toLowerCase().replace(/\s+/g, '_');
      const targetChannel = channelFilter.toLowerCase().replace(/\s+/g, '_');
      if (convChannel !== targetChannel) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (c.visitorName && c.visitorName.toLowerCase().includes(q)) ||
        (c.visitorEmail && c.visitorEmail.toLowerCase().includes(q)) ||
        (c.assignedToName && c.assignedToName.toLowerCase().includes(q)) ||
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
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-zinc-950 font-heading">Live Support & Multi-Channel Inbox</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              {conversations.length} {conversations.length === 1 ? 'Thread' : 'Threads'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            Monitor real-time visitor queries across Website, WhatsApp, Instagram, and Email with teammate assignment and human operator takeover.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Real-Time Sync Active</span>
          </span>
        </div>
      </div>

      {/* Main Inbox 3-Column Layout */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
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
                placeholder="Search by name, email, agent, or message..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:border-zinc-900 focus:bg-white transition font-medium"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold">
              {(['all', 'active', 'human_takeover', 'resolved'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition whitespace-nowrap cursor-pointer ${
                    filterStatus === st ? 'bg-zinc-950 text-white font-bold' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  {st === 'human_takeover' ? 'Operator' : st}
                </button>
              ))}
            </div>

            {/* Channel Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1 border-t border-zinc-100 text-[10px] font-semibold text-zinc-600">
              {[
                { id: 'all', label: 'All Channels' },
                { id: 'website_widget', label: 'Web' },
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'instagram_dm', label: 'Instagram' },
                { id: 'email', label: 'Email' },
              ].map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setChannelFilter(ch.id as any)}
                  className={`px-2 py-0.5 rounded-md transition whitespace-nowrap cursor-pointer ${
                    channelFilter === ch.id
                      ? 'bg-zinc-200 text-zinc-900 font-extrabold'
                      : 'hover:bg-zinc-100 text-zinc-500'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
            {filteredConversations.length === 0 ? (
              <div className="p-10 text-center text-zinc-400 text-xs font-medium space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-zinc-300" />
                <p>No conversations match the filter</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.id === activeConv?.id;
                const isHuman = conv.status === 'human_takeover';

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-4 transition flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected ? 'bg-zinc-100/90 border-l-4 border-zinc-950' : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white font-bold text-xs flex items-center justify-center shrink-0 font-heading">
                        {conv.visitorName ? conv.visitorName[0].toUpperCase() : 'V'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h4 className="text-xs font-extrabold text-zinc-900 truncate font-heading">{conv.visitorName || 'Anonymous Visitor'}</h4>
                          {isHuman && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase font-mono">
                              Operator
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                          {getChannelBadge(conv.channel)}
                          {conv.assignedToName && (
                            <span className="text-[10px] text-zinc-500 font-medium truncate flex items-center gap-1">
                              <UserCheck className="w-2.5 h-2.5 text-zinc-400" />
                              {conv.assignedToName}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-800 font-medium truncate font-body">"{conv.lastMessage}"</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-zinc-400 shrink-0 font-medium font-mono">
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
          <div className="lg:col-span-5 flex flex-col justify-between bg-white border-r border-zinc-200">
            {/* Thread Header */}
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white font-bold text-xs flex items-center justify-center font-heading">
                  {activeConv.visitorName ? activeConv.visitorName[0].toUpperCase() : 'V'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold text-zinc-900 font-heading">{activeConv.visitorName || 'Visitor Thread'}</h3>
                    {getChannelBadge(activeConv.channel)}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium font-body">Bot: {activeBot?.name}</p>
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
                className="flex-1 px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-hidden focus:border-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400 font-medium font-body"
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

        {/* Column 3: Visitor Context, Teammate Assignment & Lead Info (3 Cols) */}
        {activeConv && (
          <div className="lg:col-span-3 p-5 bg-zinc-50/80 space-y-5 overflow-y-auto font-body">
            {/* Conversation Assignment Widget */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-zinc-700" />
                <h4 className="text-xs font-extrabold text-zinc-900 font-heading">
                  Teammate Assignment
                </h4>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-500 font-medium">
                  Assign this thread to a support agent:
                </label>
                <div className="relative">
                  <select
                    value={activeConv.assignedTo || ''}
                    onChange={e => handleAssign(e.target.value)}
                    disabled={assigning}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-900 font-semibold focus:outline-hidden focus:border-zinc-950 cursor-pointer disabled:opacity-50"
                  >
                    <option value="">-- Unassigned --</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                {activeConv.assignedToName && (
                  <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                    <UserCheck className="w-3 h-3 text-emerald-600" />
                    <span>Assigned to {activeConv.assignedToName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Visitor Lead Profile */}
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
