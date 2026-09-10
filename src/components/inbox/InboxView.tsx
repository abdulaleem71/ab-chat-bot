import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Conversation, Message, Chatbot, ChannelType, TeamMember, SupportTicket, VisitorLead } from '../../types';
import { MarkdownContent } from '../../lib/markdown';
import { GroundingSourceAccordion } from '../common/GroundingSourceAccordion';
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
  ShieldAlert,
  PanelRightClose,
  PanelRightOpen,
  Volume2,
  VolumeX,
  Bell,
  Download,
  ExternalLink,
  Building2,
  Phone,
  Laptop,
  Compass,
  Copy,
  Check,
  Zap,
  Lock
} from 'lucide-react';

const CANNED_MACROS = [
  {
    shortcut: '/refund',
    label: 'Refund Policy & Process',
    description: 'Explain 30-day money-back guarantee & initiate process',
    text: 'We offer a full 30-day money-back guarantee on all our plans. I can process your refund right away if you would like.',
  },
  {
    shortcut: '/greeting',
    label: 'Warm Greeting',
    description: 'Welcome visitor and offer live assistance',
    text: 'Hello! Thanks for reaching out. How can I assist you today?',
  },
  {
    shortcut: '/booking',
    label: 'Schedule Demo / Call',
    description: 'Share calendar scheduling link for a live call',
    text: 'I would be happy to schedule a 15-minute live demo call with our specialist team! Please choose a time that works best for you at https://cal.com/demo.',
  },
  {
    shortcut: '/hours',
    label: 'Business Hours',
    description: 'Support team availability schedule',
    text: 'Our human support team is online Monday to Friday, 8am – 8pm EST. Outside these hours, our AI assistant handles immediate requests.',
  },
  {
    shortcut: '/escalate',
    label: 'Escalate to Tier 2',
    description: 'Notify technical engineering support team',
    text: 'I am escalating your ticket to our Senior Engineering team for deeper investigation. You will receive an update via email shortly.',
  },
  {
    shortcut: '/resolved',
    label: 'Issue Resolution',
    description: 'Confirm issue is resolved and close conversation',
    text: 'Glad we could get this resolved for you! Please let us know if there is anything else we can help with. Have a fantastic day!',
  },
];
import { MotionButton } from '../common/MotionButton';
import { EmptyState, InboxEmptyState } from '../common/EmptyState';
import { ConversationListSkeleton, ThreadChatSkeleton, SkeletonLoader, TableRowsSkeleton } from '../common/SkeletonLoader';
import { useAuth } from '../../context/AuthContext';

interface InboxViewProps {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  chatbots: Chatbot[];
  tickets: SupportTicket[];
  leads?: VisitorLead[];
  isLoading?: boolean;
  onSendMessage: (conversationId: string, content: string, sender: 'agent' | 'visitor') => void;
  onToggleTakeover: (conversationId: string, isTakeover: boolean) => void;
  onResolveConversation: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onAssignConversation?: (conversationId: string, teamMemberId: string, teamMemberName: string) => void;
  onUpdateTicket: (ticketId: string, data: { status?: string; priority?: string; assigneeId?: string | null; note?: string }) => void;
  onOpenEmbedModal?: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({
  conversations,
  messages,
  chatbots,
  tickets,
  leads = [],
  isLoading = false,
  onSendMessage,
  onToggleTakeover,
  onResolveConversation,
  onDeleteConversation,
  onAssignConversation,
  onUpdateTicket,
  onOpenEmbedModal,
}) => {
  const { user } = useAuth();
  const [selectedConvId, setSelectedConvId] = useState<string>(conversations[0]?.id || '');
  const [replyInput, setReplyInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'needs_attention' | 'active' | 'resolved'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | ChannelType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Ergonomic Right Drawer & Triage States
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [crmExportSuccessMsg, setCrmExportSuccessMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Canned Responses / Macros States
  const [showMacroMenu, setShowMacroMenu] = useState(false);
  const [selectedMacroIndex, setSelectedMacroIndex] = useState(0);

  // Sound alert synthesizer for Needs Attention triage
  const playAmberAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // Browser audio policy catch
    }
  };

  // Keyboard shortcut listener: Esc to return to queue search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('inbox-queue-search');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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

  const getCountryFlagAndDetails = (locationStr?: string) => {
    if (!locationStr || locationStr.trim() === '') {
      return { flag: '🇺🇸', fullLocation: 'San Francisco, CA, USA' };
    }
    const loc = locationStr.trim();
    const lower = loc.toLowerCase();

    let flag = '🌐';
    if (lower.includes('united states') || lower.includes('usa') || lower.includes('us') || lower.includes('california') || lower.includes('york') || lower.includes('san francisco')) {
      flag = '🇺🇸';
    } else if (lower.includes('united kingdom') || lower.includes('uk') || lower.includes('london') || lower.includes('england')) {
      flag = '🇬🇧';
    } else if (lower.includes('canada') || lower.includes('toronto') || lower.includes('vancouver') || lower.includes('montreal')) {
      flag = '🇨🇦';
    } else if (lower.includes('germany') || lower.includes('berlin') || lower.includes('munich')) {
      flag = '🇩🇪';
    } else if (lower.includes('france') || lower.includes('paris')) {
      flag = '🇫🇷';
    } else if (lower.includes('japan') || lower.includes('tokyo')) {
      flag = '🇯🇵';
    } else if (lower.includes('australia') || lower.includes('sydney') || lower.includes('melbourne')) {
      flag = '🇦🇺';
    } else if (lower.includes('singapore')) {
      flag = '🇸🇬';
    } else if (lower.includes('india') || lower.includes('mumbai') || lower.includes('bangalore')) {
      flag = '🇮🇳';
    }

    return { flag, fullLocation: loc };
  };

  const getDeviceAndBrowserMeta = (browserStr?: string) => {
    const b = browserStr || 'Chrome 122.0 / macOS (Desktop)';
    const lower = b.toLowerCase();
    let deviceCategory = 'Desktop';
    if (lower.includes('mobile') || lower.includes('iphone') || lower.includes('android')) {
      deviceCategory = 'Mobile';
    } else if (lower.includes('tablet') || lower.includes('ipad')) {
      deviceCategory = 'Tablet';
    }

    return {
      browser: b,
      deviceCategory,
    };
  };

  const handleExportToCRM = (lead: { name: string; email: string; phone?: string; company?: string; location?: string; pageUrl?: string }) => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Location', 'Page URL', 'Exported At'];
    const row = [
      `"${lead.name || 'Anonymous Visitor'}"`,
      `"${lead.email || ''}"`,
      `"${lead.phone || ''}"`,
      `"${lead.company || ''}"`,
      `"${lead.location || ''}"`,
      `"${lead.pageUrl || ''}"`,
      `"${new Date().toISOString()}"`,
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crm_lead_${(lead.name || 'visitor').replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setCrmExportSuccessMsg(`Exported lead profile for ${lead.name || 'Visitor'} to CRM (HubSpot/Salesforce CSV format)!`);
    setTimeout(() => setCrmExportSuccessMsg(null), 4000);
  };

  const queueCounts = {
    all: conversations.length,
    needs_attention: conversations.filter(c => c.status === 'human_takeover' || c.unreadByAgent || (c as any).unread).length,
    active: conversations.filter(c => c.status === 'active' && !c.unreadByAgent && !(c as any).unread).length,
    resolved: conversations.filter(c => c.status === 'resolved' || c.status === 'closed').length,
  };

  const handleToggleTakeoverWithAssign = (isTakeover: boolean) => {
    if (!activeConv) return;
    onToggleTakeover(activeConv.id, isTakeover);
    if (isTakeover && !activeConv.assignedTo && user) {
      handleAssign(user.id);
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (filterStatus === 'needs_attention' && !(c.status === 'human_takeover' || c.unreadByAgent || (c as any).unread)) return false;
    if (filterStatus === 'active' && (c.status !== 'active' || c.unreadByAgent || (c as any).unread)) return false;
    if (filterStatus === 'resolved' && c.status !== 'resolved' && c.status !== 'closed') return false;
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

  // Macro Filter Logic
  const macroQuery = replyInput.includes('/')
    ? replyInput.slice(replyInput.lastIndexOf('/')).toLowerCase()
    : '';

  const filteredMacros = CANNED_MACROS.filter(m =>
    m.shortcut.toLowerCase().includes(macroQuery) ||
    m.label.toLowerCase().includes(macroQuery) ||
    m.description.toLowerCase().includes(macroQuery)
  );

  const handleSelectMacro = (macroText: string) => {
    setReplyInput(macroText);
    setShowMacroMenu(false);
    if (activeConv && activeConv.status !== 'human_takeover') {
      handleToggleTakeoverWithAssign(true);
    }
  };

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyInput.trim() || !activeConv) return;
    onSendMessage(activeConv.id, replyInput.trim(), 'agent');
    setReplyInput('');
    setShowMacroMenu(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReplyInput(val);
    if (val.includes('/')) {
      setShowMacroMenu(true);
      setSelectedMacroIndex(0);
    } else if (showMacroMenu) {
      setShowMacroMenu(false);
    }
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMacroMenu && filteredMacros.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMacroIndex(prev => (prev + 1) % filteredMacros.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMacroIndex(prev => (prev - 1 + filteredMacros.length) % filteredMacros.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const macro = filteredMacros[selectedMacroIndex] || filteredMacros[0];
        if (macro) {
          handleSelectMacro(macro.text);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMacroMenu(false);
        return;
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (activeConv?.status === 'human_takeover') {
        handleSendReply();
      } else {
        handleToggleTakeoverWithAssign(true);
        handleSendReply();
      }
    }
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="p-4">
                        <div className="divide-y divide-zinc-100">
                          {Array.from({ length: 4 }).map((_, idx) => (
                            <SkeletonLoader key={idx} variant="table-row" />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8">
                        <InboxEmptyState compact type="no-tickets" />
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
        isLoading ? (
          <div className="bg-white border border-zinc-200/90 rounded-3xl shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
            {/* Column 1: Conversation List Skeleton (4 Cols) */}
            <div className="lg:col-span-4 border-r border-zinc-200 flex flex-col bg-zinc-50/50">
              <div className="p-3.5 border-b border-zinc-200 space-y-2.5 bg-white">
                <SkeletonLoader height={32} rounded="xl" />
                <div className="flex gap-2">
                  <SkeletonLoader width={50} height={24} rounded="lg" />
                  <SkeletonLoader width={90} height={24} rounded="lg" />
                  <SkeletonLoader width={70} height={24} rounded="lg" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ConversationListSkeleton count={6} />
              </div>
            </div>

            {/* Column 2: Chat Thread Skeleton (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col bg-white border-r border-zinc-200">
              <ThreadChatSkeleton />
            </div>

            {/* Column 3: Context Panel Skeleton (3 Cols) */}
            <div className="lg:col-span-3 p-5 bg-zinc-50/80 space-y-4">
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
                <SkeletonLoader width={120} height={16} rounded="md" />
                <SkeletonLoader width="100%" height={36} rounded="xl" />
              </div>
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 space-y-2.5 shadow-xs">
                <SkeletonLoader width={140} height={16} rounded="md" />
                <SkeletonLoader width="100%" height={12} rounded="md" />
                <SkeletonLoader width="70%" height={12} rounded="md" />
              </div>
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-10 shadow-xs">
            <InboxEmptyState
              type="no-conversations"
              onOpenEmbed={onOpenEmbedModal}
            />
          </div>
        ) : (
          <div className="bg-white border border-zinc-200/90 rounded-3xl shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
          {/* Column 1: Conversation List (4 Cols) */}
        <div className="lg:col-span-4 border-r border-zinc-200 flex flex-col bg-zinc-50/50">
          {/* Search & Filters */}
          <div className="p-3.5 border-b border-zinc-200 space-y-2.5 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="inbox-queue-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, agent, or message (Press Esc to focus)..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:border-zinc-900 focus:bg-white transition font-medium"
              />
            </div>

            {/* Status Filter Pills / Triage Tabs: Needs Attention (Handover Requested), AI Active, Resolved / Closed */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 font-mono">Queue Triage</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !soundEnabled;
                    setSoundEnabled(next);
                    if (next) playAmberAlertSound();
                  }}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg transition cursor-pointer ${
                    soundEnabled ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-zinc-100 text-zinc-500'
                  }`}
                  title="Toggle escalation alert audio"
                >
                  {soundEnabled ? <Volume2 className="w-3 h-3 text-amber-700" /> : <VolumeX className="w-3 h-3 text-zinc-400" />}
                  <span>{soundEnabled ? 'Alerts On' : 'Alerts Muted'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {[
                  {
                    id: 'needs_attention' as const,
                    label: 'Needs Attention',
                    count: queueCounts.needs_attention,
                    activeClass: 'bg-amber-500 text-zinc-950 font-extrabold shadow-xs',
                    inactiveClass: queueCounts.needs_attention > 0
                      ? 'bg-amber-50 text-amber-950 border border-amber-300 hover:bg-amber-100 font-bold'
                      : 'bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200/80 font-medium',
                  },
                  {
                    id: 'active' as const,
                    label: 'AI Active',
                    count: queueCounts.active,
                    activeClass: 'bg-emerald-600 text-white font-extrabold shadow-xs',
                    inactiveClass: 'bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200/80 font-medium',
                  },
                  {
                    id: 'resolved' as const,
                    label: 'Resolved',
                    count: queueCounts.resolved,
                    activeClass: 'bg-zinc-950 text-white font-extrabold shadow-xs',
                    inactiveClass: 'bg-zinc-100/80 text-zinc-700 hover:bg-zinc-200/80 font-medium',
                  },
                ].map(tab => {
                  const isActive = filterStatus === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setFilterStatus(tab.id);
                        if (tab.id === 'needs_attention' && soundEnabled) {
                          playAmberAlertSound();
                        }
                      }}
                      className={`w-full p-2 rounded-xl transition flex items-center justify-between text-xs cursor-pointer ${
                        isActive ? tab.activeClass : tab.inactiveClass
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {tab.id === 'needs_attention' && (
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-zinc-950' : 'bg-amber-500 animate-pulse'}`} />
                        )}
                        {tab.id === 'active' && (
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-emerald-500'}`} />
                        )}
                        {tab.id === 'resolved' && (
                          <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                        )}
                        <span className="font-heading truncate text-[11px]">{tab.label}</span>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-800'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setFilterStatus('all')}
                  className={`w-full p-1.5 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-zinc-900 text-white font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <span>All Conversations</span>
                  <span className="font-mono text-[10px] font-bold">{queueCounts.all}</span>
                </button>
              </div>
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
              <div className="p-6">
                <InboxEmptyState
                  compact
                  type="no-matches"
                  onResetFilters={() => {
                    setFilterStatus('all');
                    setChannelFilter('all');
                    setSearchQuery('');
                  }}
                />
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = conv.id === activeConv?.id;
                const isHuman = conv.status === 'human_takeover';
                const isUnread = conv.unreadByAgent || (conv as any).unread || (isHuman && !conv.assignedTo);
                const locInfo = getCountryFlagAndDetails(conv.visitorLocation || (conv as any).location);
                const deviceMeta = getDeviceAndBrowserMeta(conv.visitorBrowser || (conv as any).browser);

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3.5 transition flex items-start justify-between gap-2.5 cursor-pointer ${
                      isSelected ? 'bg-zinc-100/90 border-l-4 border-zinc-950' : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* Avatar with unread indicator dot */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white font-bold text-xs flex items-center justify-center font-heading">
                          {conv.visitorName ? conv.visitorName[0].toUpperCase() : 'V'}
                        </div>
                        {isUnread && (
                          <span
                            className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-pulse"
                            title="Unread / Needs Attention"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-extrabold text-zinc-900 truncate font-heading">
                            {conv.visitorName || `Visitor #${conv.id.slice(-4)}`}
                          </h4>
                          <span className="text-[10px] text-zinc-400 font-medium font-mono shrink-0">
                            {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Location & Browser Metadata */}
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-zinc-500 font-medium">
                          <span className="inline-flex items-center gap-1 text-zinc-700 truncate" title={locInfo.fullLocation}>
                            <span>{locInfo.flag}</span>
                            <span className="truncate max-w-[75px]">{locInfo.fullLocation.split(',')[0]}</span>
                          </span>
                          <span className="text-zinc-300">•</span>
                          <span className="inline-flex items-center gap-1 text-zinc-500" title={deviceMeta.browser}>
                            <Laptop className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                            <span className="truncate max-w-[65px]">{deviceMeta.deviceCategory}</span>
                          </span>
                          {isHuman && (
                            <span className="bg-amber-100 text-amber-900 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase font-mono shrink-0 ml-auto">
                              Takeover
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-zinc-800 font-medium truncate font-body">"{conv.lastMessage}"</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Chat Thread (5 Cols when drawer is open, 8 Cols when collapsed) */}
        {activeConv ? (
          <div className={`${isRightSidebarOpen ? 'lg:col-span-5' : 'lg:col-span-8'} flex flex-col justify-between bg-white border-r border-zinc-200 transition-all duration-200`}>
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

              {/* Header Quick Actions */}
              <div className="flex items-center gap-2">
                {reportSuccessMsg && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    {reportSuccessMsg}
                  </span>
                )}
                {crmExportSuccessMsg && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 animate-in fade-in">
                    {crmExportSuccessMsg}
                  </span>
                )}
                <button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer font-heading border border-rose-200"
                  title="Report suspicious visitor message or conversation to moderation queue"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Report</span>
                </button>

                <MotionButton
                  variant={activeConv.status === 'human_takeover' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleToggleTakeoverWithAssign(activeConv.status !== 'human_takeover')}
                  leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                >
                  {activeConv.status === 'human_takeover' ? 'Operator Mode' : 'Take Over'}
                </MotionButton>

                {/* Collapsible Right Drawer Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isRightSidebarOpen
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                  title={isRightSidebarOpen ? "Collapse Visitor Drawer" : "Expand Visitor Context Drawer"}
                >
                  {isRightSidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Explicit Status Toggle Header with Visual Banners */}
            {activeConv.status !== 'human_takeover' ? (
              <div className="bg-emerald-50/90 border-b border-emerald-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h4 className="text-xs font-extrabold text-emerald-950 font-heading">
                        AI is handling this conversation
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md font-mono">
                        Autonomous
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Automated responses powered by {activeBot?.name || 'AI'}. Take over to respond directly.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleTakeoverWithAssign(true)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold font-heading shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Take Over as Human</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/95 border-b border-amber-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      <h4 className="text-xs font-extrabold text-amber-950 font-heading">
                        Human Takeover Active — Agent: {activeConv.assignedToName || user?.displayName || 'You'}
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-mono">
                        Manual
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Automated AI generation is paused. Responses are sent directly from your operator console.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleTakeoverWithAssign(false)}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold font-heading shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-amber-700" />
                    <span>Hand Back to AI</span>
                  </button>
                  <button
                    onClick={() => onResolveConversation(activeConv.id)}
                    className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold font-heading shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Resolve</span>
                  </button>
                </div>
              </div>
            )}

            {/* Agent Collision Notice */}
            {activeConv.assignedTo &&
              activeConv.assignedTo !== user?.id &&
              activeConv.assignedToName !== user?.displayName && (
                <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-900 font-medium">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>
                      <strong className="font-bold font-heading">Collision Notice:</strong> Teammate{' '}
                      <strong>{activeConv.assignedToName}</strong> is assigned to this conversation.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssign(user?.id || 'agent_me')}
                    className="text-[11px] font-bold text-rose-950 underline hover:text-rose-800 cursor-pointer font-heading shrink-0"
                  >
                    Reassign to Me
                  </button>
                </div>
              )}

            {/* Report Conversation Modal */}
            {showReportModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div role="dialog" aria-modal="true" aria-labelledby="report-modal-title" className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-600">
                      <ShieldAlert className="w-5 h-5" />
                      <h3 id="report-modal-title" className="text-sm font-extrabold text-zinc-950 font-heading">Report Suspicious Conversation</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      aria-label="Close report dialog"
                      className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg cursor-pointer"
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
            <div
              role="log"
              aria-live="polite"
              aria-relevant="additions text"
              aria-label="Conversation message stream"
              className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-50/30"
            >
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

                    {/* Grounding Citations */}
                    {msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                      <GroundingSourceAccordion
                        sources={msg.sourcesUsed}
                        variant="inline"
                        className={msg.sender === 'bot' ? 'text-zinc-200 border-white/15' : ''}
                      />
                    )}

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

            {/* Persistent Live Takeover Status Banner & Safety Lock */}
            {activeConv.status !== 'human_takeover' ? (
              <div className="bg-zinc-950 text-white border-t border-b border-zinc-800 px-4 py-3 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="font-heading font-extrabold text-white text-xs">
                        🤖 AI Assistant is currently replying to this visitor.
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      Bot automated replies are active. Click Take Over to pause the bot and respond directly.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleTakeoverWithAssign(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer font-heading shrink-0"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Take Over Conversation</span>
                </button>
              </div>
            ) : (
              <div className="bg-amber-400 text-zinc-950 border-t border-b border-amber-500 px-4 py-3 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping"></span>
                      <span className="font-heading font-extrabold text-zinc-950 text-xs">
                        👤 You have taken over. Bot replies are paused.
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-900 font-medium">
                      Operator mode active — safety lock engaged. Bot cannot interrupt your replies.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleTakeoverWithAssign(false)}
                    className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer font-heading"
                  >
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Return to AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onResolveConversation(activeConv.id)}
                    className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer font-heading"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mark as Resolved</span>
                  </button>
                </div>
              </div>
            )}

            {/* Reply Input Form, Canned Responses Popover & Shortcuts Bar */}
            <div className="border-t border-zinc-200 bg-white relative">
              {/* Canned Responses / Macros Dropdown Popover */}
              {showMacroMenu && filteredMacros.length > 0 && (
                <div className="absolute bottom-full mb-2 left-3.5 right-3.5 bg-white border border-zinc-300 rounded-2xl shadow-xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-sans">
                  <div className="bg-zinc-950 text-white px-3.5 py-2 flex items-center justify-between text-xs border-b border-zinc-800">
                    <div className="flex items-center gap-1.5 font-bold font-heading">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Canned Macros & Saved Replies</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">Use ↑↓ & Enter or click to insert</span>
                  </div>

                  <div className="max-h-52 overflow-y-auto divide-y divide-zinc-100">
                    {filteredMacros.map((macro, idx) => {
                      const isHighlighted = idx === selectedMacroIndex;
                      return (
                        <button
                          key={macro.shortcut}
                          type="button"
                          onClick={() => handleSelectMacro(macro.text)}
                          onMouseEnter={() => setSelectedMacroIndex(idx)}
                          className={`w-full text-left p-2.5 transition flex items-start justify-between gap-3 cursor-pointer ${
                            isHighlighted ? 'bg-amber-50/90 text-zinc-950 font-medium' : 'hover:bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          <div className="space-y-0.5 truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-300">
                                {macro.shortcut}
                              </span>
                              <span className="font-extrabold text-xs text-zinc-900 font-heading">{macro.label}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">{macro.text}</p>
                          </div>
                          <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0 self-center font-bold">
                            Insert
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <form onSubmit={handleSendReply} className="p-3.5 flex items-center gap-2">
                <input
                  type="text"
                  value={replyInput}
                  onChange={handleInputChange}
                  onKeyDown={handleReplyKeyDown}
                  placeholder={
                    activeConv.status === 'human_takeover'
                      ? 'Type reply or / for macros (Ctrl/Cmd + Enter to send)...'
                      : 'Type reply or / for macros (Auto-takes over on send)...'
                  }
                  className="flex-1 px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-hidden focus:border-zinc-900 font-medium font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowMacroMenu(!showMacroMenu)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold font-heading transition flex items-center gap-1 cursor-pointer ${
                    showMacroMenu
                      ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-xs'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                  }`}
                  title="Toggle Canned Reply Macros (or type / in message field)"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">/ Macro</span>
                </button>

                <MotionButton
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!replyInput.trim()}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </MotionButton>
              </form>

              {/* Quick Canned Responses & Shortcuts Bar */}
              <div className="px-3.5 py-2 bg-zinc-50 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Quick:</span>
                  {[
                    "Hello! How can I assist you today?",
                    "Looking into this for you right now.",
                    "We have updated your configuration.",
                    "Issue has been resolved! Let us know if you need anything else.",
                  ].map((cannedText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setReplyInput(cannedText);
                        if (activeConv.status !== 'human_takeover') {
                          handleToggleTakeoverWithAssign(true);
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:text-zinc-950 text-[10px] truncate max-w-[140px] cursor-pointer font-medium transition"
                      title={cannedText}
                    >
                      {cannedText}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 font-mono">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-zinc-200/90 border border-zinc-300 rounded-md text-zinc-700 text-[9px] font-bold">⌘/Ctrl+Enter</kbd>
                    <span>Send</span>
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-zinc-200/90 border border-zinc-300 rounded-md text-zinc-700 text-[9px] font-bold">Esc</kbd>
                    <span>Queue search</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-8 bg-zinc-50/40">
            <InboxEmptyState
              type="no-selection"
            />
          </div>
        )}

        {/* Column 3: Visitor Context Card (Right Sidebar Drawer - 3 Cols) */}
        {activeConv && isRightSidebarOpen && (
          <div className="lg:col-span-3 p-5 bg-zinc-50/90 space-y-5 overflow-y-auto font-body border-l border-zinc-200 animate-in fade-in duration-150">
            {/* Drawer Header & Collapse Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-extrabold text-zinc-950 font-heading">Visitor Context & Profile</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsRightSidebarOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg cursor-pointer transition"
                title="Collapse drawer"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Captured Lead Profile Card */}
            {(() => {
              const matchedLead = leads.find(l => l.conversationId === activeConv.id);
              const leadName = matchedLead?.name || activeConv.visitorName || 'Anonymous Visitor';
              const leadEmail = matchedLead?.email || activeConv.visitorEmail || 'No email captured';
              const leadPhone = matchedLead?.phone || activeConv.visitorPhone || 'No phone captured';
              const leadCompany = matchedLead?.company || activeConv.visitorCompany || 'No company captured';

              return (
                <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-xs space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full pointer-events-none -mr-4 -mt-4" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-mono">
                      Captured Lead Profile
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {matchedLead ? 'Verified Lead' : 'Live Session'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs relative z-10">
                    <div className="flex items-center gap-2.5 text-zinc-800">
                      <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-extrabold text-zinc-950 font-heading">{leadName}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-zinc-700">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-mono text-zinc-900 select-all">{leadEmail}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-zinc-700">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-mono text-zinc-800">{leadPhone}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-zinc-700">
                      <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-medium text-zinc-800">{leadCompany}</span>
                    </div>
                  </div>

                  {/* Export to CRM Primary Action */}
                  <div className="pt-2 border-t border-zinc-100">
                    <MotionButton
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => handleExportToCRM({
                        name: leadName,
                        email: leadEmail,
                        phone: leadPhone,
                        company: leadCompany,
                        location: activeConv.visitorLocation,
                        pageUrl: activeConv.pageUrl
                      })}
                      leftIcon={<Download className="w-3.5 h-3.5 text-amber-300" />}
                    >
                      Export to CRM
                    </MotionButton>
                  </div>
                </div>
              );
            })()}

            {/* 2. Visitor Location Card (City & Country Flag) */}
            {(() => {
              const locInfo = getCountryFlagAndDetails(activeConv.visitorLocation);
              return (
                <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">
                    Visitor Geo-Location
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{locInfo.flag}</span>
                    <div>
                      <h5 className="text-xs font-extrabold text-zinc-950 font-heading">{locInfo.fullLocation}</h5>
                      <span className="text-[10px] text-zinc-500 font-medium">Verified IP Regional Lookup</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Device & Browser Metadata Card */}
            {(() => {
              const deviceMeta = getDeviceAndBrowserMeta(activeConv.visitorBrowser);
              return (
                <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">
                    Device & Browser Metadata
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-700">
                        <Laptop className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="font-bold text-zinc-900">{deviceMeta.deviceCategory}</span>
                      </div>
                      <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-700 font-mono">
                        {deviceMeta.deviceCategory === 'Mobile' ? 'iOS/Android' : 'Desktop OS'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-600 text-[11px] pt-1 border-t border-zinc-100">
                      <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-mono text-zinc-800 truncate">{deviceMeta.browser}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 4. Current Browsing Page URL */}
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono block">
                Current Browsing Page URL
              </span>
              <div className="space-y-2">
                <p className="text-[11px] font-mono text-zinc-800 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 break-all select-all">
                  {activeConv.pageUrl || 'https://example.com/pricing'}
                </p>
                <div className="flex items-center gap-2">
                  <a
                    href={activeConv.pageUrl || 'https://example.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 font-heading"
                  >
                    <ExternalLink className="w-3 h-3 text-zinc-600" />
                    <span>Open Page</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeConv.pageUrl || 'https://example.com/pricing');
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer font-heading"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-zinc-600" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

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

            {/* Conversation Actions */}
            <div className="space-y-2 pt-2 border-t border-zinc-200">
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
      ))}

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
