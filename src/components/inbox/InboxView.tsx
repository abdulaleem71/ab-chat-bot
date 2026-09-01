import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Conversation, Message, Chatbot, ChannelType, TeamMember, SupportTicket } from '../../types';
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
  ChevronDown,
  Wrench,
  Star,
  ShieldAlert
} from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import { useAuth } from '../../context/AuthContext';

interface InboxViewProps {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  chatbots: Chatbot[];
  tickets: SupportTicket[];
  onSendMessage: (conversationId: string, content: string, sender: 'agent' | 'visitor') => void;
  onToggleTakeover: (conversationId: string, isTakeover: boolean) => void;
  onResolveConversation: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onAssignConversation?: (conversationId: string, teamMemberId: string, teamMemberName: string) => void;
  onUpdateTicket: (ticketId: string, data: { status?: string; priority?: string; assigneeId?: string | null; note?: string }) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  conversations,
  messages,
  chatbots,
  tickets,
  onSendMessage,
  onToggleTakeover,
  onResolveConversation,
  onDeleteConversation,
  onAssignConversation,
  onUpdateTicket,
}) => {
  const { user } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const [replyInput, setReplyInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'human_takeover' | 'resolved'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | ChannelType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Sub-tabs: 'chat' | 'tickets'
  const [activeInboxTab, setActiveInboxTab] = useState<'chat' | 'tickets'>('chat');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'open' | 'pending' | 'resolved' | 'closed'>('all');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [ticketAssigneeFilter, setTicketAssigneeFilter] = useState<string>('all');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [inspectingTicket, setInspectingTicket] = useState<SupportTicket | null>(null);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);

  const handleReportConversation = async () => {
    if (!activeConv || !reportReason.trim()) return;
    setIsReporting(true);
    try {
      const res = await fetch(`/api/conversations/${activeConv.id}/report`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReportSuccessMsg('Conversation successfully reported for moderation review.');
        setReportReason('');
        setShowReportModal(false);
        setTimeout(() => setReportSuccessMsg(null), 4000);
      } else {
        alert(data.error || 'Failed to report conversation.');
      }
    } catch (err: any) {
      alert('Error reporting conversation: ' + err.message);
    } finally {
      setIsReporting(false);
    }
  };

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
        const res = await fetch('/api/team/members', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
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
  }, []);

  const activeConv = conversations.find(c => c.id === selectedConvId) || conversations[0];
  const activeBot = chatbots.find(b => b.id === activeConv?.chatbotId) || chatbots[0];
  const activeThread = activeConv ? messages[activeConv.id] || [] : [];

  const handleAssign = async (memberId: string) => {
    if (!activeConv) return;
    const selectedMember = teamMembers.find(m => m.id === memberId);
    const memberName = selectedMember ? selectedMember.name : (memberId ? 'Agent' : '');

    setAssigning(true);
    try {
      const res = await fetch(`/api/conversations/${activeConv.id}/assign`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
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
        (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredTickets = (tickets || []).filter(t => {
    if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
    if (ticketPriorityFilter !== 'all' && t.priority !== ticketPriorityFilter) return false;
    if (ticketAssigneeFilter === 'unassigned' && t.assigneeId) return false;
    if (ticketAssigneeFilter !== 'all' && ticketAssigneeFilter !== 'unassigned' && t.assigneeId !== ticketAssigneeFilter) return false;
    if (ticketSearchQuery) {
      const q = ticketSearchQuery.toLowerCase();
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.customerEmail && t.customerEmail.toLowerCase().includes(q))
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
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-zinc-950 font-heading">Support Operations & Inbox</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              {conversations.length} Chats | {tickets.length} Tickets
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            Manage real-time customer conversations and support ticketing queues from a single unified workspace.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-zinc-100 p-1 rounded-2xl flex items-center gap-1 border border-zinc-200">
            <button
              onClick={() => setActiveInboxTab('chat')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeInboxTab === 'chat'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat</span>
            </button>
            <button
              onClick={() => setActiveInboxTab('tickets')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeInboxTab === 'tickets'
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Tickets ({tickets.filter(t => t.status === 'open' || t.status === 'pending').length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Tab Content */}
      {activeInboxTab === 'tickets' && (
        <div className="bg-white border border-zinc-200/90 rounded-3xl shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search tickets by subject, #TKT, or customer email..."
                value={ticketSearchQuery}
                onChange={e => setTicketSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 bg-zinc-50/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={ticketStatusFilter}
                onChange={e => setTicketStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-700 bg-white font-medium focus:outline-none"
              >
                <option value="all">Status: All</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={ticketPriorityFilter}
                onChange={e => setTicketPriorityFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-700 bg-white font-medium focus:outline-none"
              >
                <option value="all">Priority: All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <select
                value={ticketAssigneeFilter}
                onChange={e => setTicketAssigneeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-700 bg-white font-medium focus:outline-none"
              >
                <option value="all">Assignee: All</option>
                <option value="unassigned">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border border-zinc-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Ticket #</th>
                    <th className="p-3.5">Subject & Description</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Assignee</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-zinc-400 font-medium">
                        No support tickets found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map(t => (
                      <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-zinc-900 whitespace-nowrap">
                          {t.ticketNumber}
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <div className="font-bold text-zinc-900 truncate">{t.subject}</div>
                          <div className="text-zinc-500 text-[11px] truncate">{t.description}</div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <select
                            value={t.priority}
                            onChange={e => onUpdateTicket(t.id, { priority: e.target.value as any })}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                              t.priority === 'high'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : t.priority === 'medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <select
                            value={t.status}
                            onChange={e => onUpdateTicket(t.id, { status: e.target.value as any })}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                              t.status === 'open'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : t.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : t.status === 'resolved'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                            }`}
                          >
                            <option value="open">Open</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <select
                            value={t.assigneeId || ''}
                            onChange={e => onUpdateTicket(t.id, { assigneeId: e.target.value || null })}
                            className="text-xs py-1 px-2 rounded-xl border border-zinc-200 text-zinc-800 bg-white font-medium"
                          >
                            <option value="">Unassigned</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3.5 text-zinc-600 font-medium whitespace-nowrap">
                          {t.customerEmail || 'Anonymous'}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <MotionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setInspectingTicket(t)}
                          >
                            View & Notes
                          </MotionButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeInboxTab === 'chat' && (
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

              {/* Human Takeover Toggle & Report */}
              <div className="flex items-center gap-2">
                {reportSuccessMsg && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    {reportSuccessMsg}
                  </span>
                )}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer font-heading border border-rose-200"
                  title="Report suspicious visitor message or conversation to moderation queue"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>

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

            {/* Report Conversation Modal */}
            {showReportModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-600">
                      <ShieldAlert className="w-5 h-5" />
                      <h3 className="text-sm font-extrabold text-zinc-950 font-heading">Report Suspicious Conversation</h3>
                    </div>
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-zinc-600">
                    This will flag the conversation with <span className="font-bold text-zinc-900">{activeConv.visitorName || 'Anonymous Visitor'}</span> for platform moderation review.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700">Reason for Reporting *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Suspicious prompt injection, abuse, or policy violation..."
                      value={reportReason}
                      onChange={e => setReportReason(e.target.value)}
                      className="w-full p-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:border-zinc-900"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition cursor-pointer font-heading"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isReporting || !reportReason.trim()}
                      onClick={handleReportConversation}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer font-heading disabled:opacity-50"
                    >
                      {isReporting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </div>
              </div>
            )}

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

                    {/* Screenshot attachment thumbnail */}
                    {msg.screenshotUrl && msg.screenshotUrl.startsWith('data:image') && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-zinc-200 max-w-[200px]">
                        <img src={msg.screenshotUrl} alt="Attached screenshot" className="w-full h-auto object-cover max-h-36" />
                      </div>
                    )}

                    <div className={msg.sender === 'visitor' ? 'text-zinc-900 font-body' : 'text-white font-body'}>
                      <MarkdownContent content={msg.content} />
                    </div>

                    {/* Tools Invoked Badges */}
                    {msg.toolsInvoked && msg.toolsInvoked.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                        {msg.toolsInvoked.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="inline-flex items-center gap-1 bg-white/10 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                          >
                            <Wrench className="w-2.5 h-2.5 opacity-70" />
                            <span>{t.replace(/_/g, ' ')}</span>
                          </span>
                        ))}
                      </div>
                    )}
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

            {/* Conversation Outcome & AI Telemetry */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs space-y-2.5">
              <h4 className="text-xs font-extrabold text-zinc-900 font-heading">
                Outcome & Telemetry
              </h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Resolved By:</span>
                  <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                    activeConv.resolvedBy === 'human'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}>
                    {activeConv.resolvedBy === 'human' ? '👤 Human Specialist' : '🤖 AI Automated'}
                  </span>
                </div>

                {activeConv.toolsInvoked && activeConv.toolsInvoked.length > 0 && (
                  <div className="pt-1.5 border-t border-zinc-100">
                    <span className="text-[10px] text-zinc-400 block mb-1">Tools Executed:</span>
                    <div className="flex flex-wrap gap-1">
                      {activeConv.toolsInvoked.map((t, idx) => (
                        <span key={idx} className="bg-zinc-100 text-zinc-700 text-[10px] font-mono px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeConv.csatRating && (
                  <div className="pt-1.5 border-t border-zinc-100">
                    <span className="text-[10px] text-zinc-400 block mb-1">CSAT Rating:</span>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{activeConv.csatRating} / 5.0</span>
                    </div>
                    {activeConv.csatFeedback && (
                      <p className="text-[10px] text-zinc-600 italic mt-0.5">"{activeConv.csatFeedback}"</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Metadata */}
            <div className="pt-3 border-t border-zinc-200 space-y-2.5 text-[11px] text-zinc-600">
              <span className="font-bold text-zinc-900 uppercase text-[10px] block font-heading">Referral URL</span>
              <p className="text-zinc-800 font-mono text-[10px] bg-white p-2 rounded-xl border border-zinc-200 truncate select-all">
                {activeConv.pageUrl || 'Direct / Embedded Session'}
              </p>
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
      )}

      {/* Ticket Details & Notes Modal */}
      {inspectingTicket && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {inspectingTicket.ticketNumber}
                </span>
                <h3 className="text-base font-extrabold text-zinc-950 mt-1">{inspectingTicket.subject}</h3>
              </div>
              <button
                onClick={() => setInspectingTicket(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-zinc-500 block mb-1">Description:</span>
                <p className="text-zinc-800 bg-zinc-50 p-3 rounded-2xl border border-zinc-200 leading-relaxed">
                  {inspectingTicket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-bold text-zinc-500 block mb-1">Customer Email:</span>
                  <span className="text-zinc-900 font-medium">{inspectingTicket.customerEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-bold text-zinc-500 block mb-1">Created At:</span>
                  <span className="text-zinc-900 font-medium">{new Date(inspectingTicket.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-zinc-500 block mb-1">Internal Notes & History:</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                  {inspectingTicket.notes && inspectingTicket.notes.length > 0 ? (
                    inspectingTicket.notes.map((note, idx) => (
                      <div key={idx} className="text-[11px] text-zinc-700 bg-white p-2 rounded-xl border border-zinc-200">
                        • {note}
                      </div>
                    ))
                  ) : (
                    <span className="text-zinc-400 italic">No notes added yet.</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="font-bold text-zinc-700 block text-xs">Add Internal Note:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type note or update details..."
                    value={newNoteInput}
                    onChange={e => setNewNoteInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-950/20"
                  />
                  <MotionButton
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      if (!newNoteInput.trim()) return;
                      onUpdateTicket(inspectingTicket.id, { note: newNoteInput.trim() });
                      setInspectingTicket({
                        ...inspectingTicket,
                        notes: [...(inspectingTicket.notes || []), newNoteInput.trim()],
                      });
                      setNewNoteInput('');
                    }}
                  >
                    Add Note
                  </MotionButton>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-200">
              <MotionButton
                variant="secondary"
                size="sm"
                onClick={() => setInspectingTicket(null)}
              >
                Close
              </MotionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
