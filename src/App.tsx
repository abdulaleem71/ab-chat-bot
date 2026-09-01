import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { BotList } from './components/chatbots/BotList';
import { BotEditorModal } from './components/chatbots/BotEditorModal';
import { KnowledgeManager } from './components/chatbots/KnowledgeManager';
import { PlaygroundView } from './components/chatbots/PlaygroundView';
import { WidgetEmbedModal } from './components/embed/WidgetEmbedModal';
import { InboxView } from './components/inbox/InboxView';
import { EmbedChatWidget } from './components/embed/EmbedChatWidget';
import { AuthModal } from './components/auth/AuthModal';
import { PricingView } from './components/pricing/PricingView';
import { BillingDashboardView } from './components/pricing/BillingDashboardView';
import { FeaturesView } from './components/features/FeaturesView';
import { FaqView } from './components/faq/FaqView';
import { IntegrationsView } from './components/integrations/IntegrationsView';
import { TeamView } from './components/team/TeamView';
import { SettingsView } from './components/settings/SettingsView';
import { AccountView } from './components/account/AccountView';
import { VerificationBanner } from './components/layout/VerificationBanner';
import { MfaRecommendationBanner } from './components/layout/MfaRecommendationBanner';
import { StatusPage } from './components/public/StatusPage';
import { SecurityPage } from './components/public/SecurityPage';
import { Footer } from './components/layout/Footer';
import { TrialBanner } from './components/layout/TrialBanner';
import { ExpiredTrialModal } from './components/pricing/ExpiredTrialModal';
import { CheckoutModal } from './components/pricing/CheckoutModal';
import { AdminApp } from './admin/AdminApp';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Chatbot, KnowledgeSource, Conversation, Message, SupportTicket, VisitorLead, GroundingSource, AnalyticsSummary, TenantPlan } from './types';
import { MessageSquare, X, AlertCircle, Loader2 } from 'lucide-react';

function DashboardContent() {
  const { isAuthenticated, tenant, switchPlan } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [leads, setLeads] = useState<VisitorLead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Effective current bot for preview and views
  const activeBot = selectedBot || (chatbots.length > 0 ? chatbots[0] : null);

  // Modals & Floating preview & Mobile Menu
  const [isBotEditorOpen, setIsBotEditorOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Partial<Chatbot> | null>(null);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [embedModalBot, setEmbedModalBot] = useState<Chatbot | null>(null);
  const [isFloatingWidgetOpen, setIsFloatingWidgetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExpiredTrialModalOpen, setIsExpiredTrialModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutTargetPlan, setCheckoutTargetPlan] = useState<{
    id: TenantPlan;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
  }>({
    id: 'Pro',
    name: 'Growth Pro',
    monthlyPrice: 49,
    annualPrice: 39,
  });

  // Check for expired trial on mount / tenant update
  useEffect(() => {
    if (!isAuthenticated || !tenant) return;
    const now = new Date();
    const trialEnds = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
    const isExpired = Boolean(
      trialEnds &&
      trialEnds <= now &&
      !tenant.hasPaymentMethod
    );
    if (isExpired && !sessionStorage.getItem('dismissed_expired_trial_' + tenant.id)) {
      setIsExpiredTrialModalOpen(true);
    }
  }, [isAuthenticated, tenant?.id, tenant?.trialEndsAt, tenant?.hasPaymentMethod]);

  const fetchApi = (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  };

  // 1. Fetch Chatbots on Auth / Mount
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchApi('/api/chatbots')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.chatbots) {
          setChatbots(data.chatbots);
          if (data.chatbots.length > 0) {
            setSelectedBot(prev => prev ? prev : data.chatbots[0]);
          }
        }
      })
      .catch(err => console.log('Error fetching chatbots:', err));
  }, [isAuthenticated]);

  // 2. Fetch Tenant Knowledge Sources
  const fetchKnowledgeSources = () => {
    if (!isAuthenticated) return;
    fetchApi('/api/knowledge')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.knowledgeSources) {
          setKnowledgeSources(data.knowledgeSources);
        }
      })
      .catch(err => console.log('Error fetching knowledge sources:', err));
  };

  useEffect(() => {
    fetchKnowledgeSources();
  }, [isAuthenticated]);

  // Poll for pending knowledge sources
  useEffect(() => {
    const hasPending = knowledgeSources.some(s => s.status === 'pending' || s.status === 'processing');
    if (!hasPending || !isAuthenticated) return;
    
    const intervalId = setInterval(fetchKnowledgeSources, 3000);
    return () => clearInterval(intervalId);
  }, [knowledgeSources, isAuthenticated]);

  // 3. Fetch Conversations & Inbox Data
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchApi('/api/conversations')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.conversations) {
          setConversations(data.conversations);
          // Fetch messages for each conversation
          data.conversations.forEach((c: Conversation) => {
            fetchApi(`/api/conversations/${c.id}/messages`)
              .then(mRes => mRes.json())
              .then(mData => {
                if (mData.success && mData.messages) {
                  setMessages(prev => ({ ...prev, [c.id]: mData.messages }));
                }
              });
          });
        }
      })
      .catch(err => console.log('Error fetching conversations:', err));
  }, [isAuthenticated, activeTab]);

  // 4. Fetch Leads
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchApi('/api/leads')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.leads) {
          setLeads(data.leads);
        }
      })
      .catch(err => console.log('Error fetching leads:', err));
  }, [isAuthenticated, activeTab]);

  // Fetch Support Tickets
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchApi('/api/tickets')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.tickets) {
          setTickets(data.tickets);
        }
      })
      .catch(err => console.log('Error fetching support tickets:', err));
  }, [isAuthenticated, activeTab]);

  const handleUpdateTicket = async (ticketId: string, data: { status?: string; priority?: string; assigneeId?: string | null; note?: string }) => {
    try {
      const res = await fetchApi(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (resData.success && resData.ticket) {
        setTickets(prev => prev.map(t => t.id === ticketId ? resData.ticket : t));
      }
    } catch (err) {
      console.log('Error updating ticket:', err);
    }
  };

  // 5. Fetch Analytics
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchApi('/api/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
        }
      })
      .catch(err => console.log('Error fetching analytics:', err));
  }, [isAuthenticated, activeTab]);

  // Close open protected drawers/modals on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setIsFloatingWidgetOpen(false);
      setIsWidgetModalOpen(false);
      setIsBotEditorOpen(false);
    }
  }, [isAuthenticated]);

  // Bot Handlers
  const handleCreateBot = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setEditingBot(null);
    setIsBotEditorOpen(true);
  };

  const handleEditBot = (bot: Chatbot) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setEditingBot(bot);
    setIsBotEditorOpen(true);
  };

  const handleSaveBot = async (formData: Partial<Chatbot>) => {
    if (editingBot && editingBot.id) {
      try {
        const res = await fetch(`/api/chatbots/${editingBot.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        const updated = data.chatbot;
        if (updated) {
          setChatbots(prev => prev.map(b => (b.id === updated.id ? updated : b)));
          if (selectedBot?.id === updated.id) setSelectedBot(updated);
        }
      } catch (e) {
        console.log('Error updating chatbot:', e);
      }
    } else {
      try {
        const res = await fetch('/api/chatbots', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        const newBot = data.chatbot;
        if (newBot) {
          setChatbots(prev => [newBot, ...prev]);
          setSelectedBot(newBot);
        }
      } catch (e) {
        console.log('Error creating chatbot:', e);
      }
    }
  };

  const handleTestBot = (bot: Chatbot) => {
    setSelectedBot(bot);
    setActiveTab('playground');
  };

  const handleTrainBot = (bot: Chatbot) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setSelectedBot(bot);
    setActiveTab('knowledge');
  };

  const handleDeleteBot = async (bot: Chatbot) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!bot || !bot.id) return;
    try {
      const res = await fetch(`/api/chatbots/${bot.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setChatbots(prev => {
          const remaining = prev.filter(b => b.id !== bot.id);
          if (selectedBot?.id === bot.id) {
            setSelectedBot(remaining.length > 0 ? remaining[0] : null);
          }
          return remaining;
        });
      }
    } catch (e) {
      console.log('Error deleting chatbot:', e);
    }
  };

  const handleOpenEmbedModal = (bot?: Chatbot) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const target = bot || selectedBot || (chatbots.length > 0 ? chatbots[0] : activeBot);
    setEmbedModalBot(target);
    if (target) {
      setSelectedBot(target);
    }
    setIsWidgetModalOpen(true);
  };

  // Knowledge Handlers
  const handleAddKnowledgeSource = async (sourceData: Partial<KnowledgeSource> & { chatbotIds: string[] }) => {
    try {
      const res = await fetch(`/api/knowledge`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData),
      });
      const data = await res.json();
      if (data.success && data.knowledgeSource) {
        setKnowledgeSources(prev => [data.knowledgeSource, ...prev.filter(k => k.id !== data.knowledgeSource.id)]);
      }
    } catch (err) {
      console.log('Error adding knowledge source:', err);
    }
  };

  const handleScrapeUrl = async (url: string, chatbotIds: string[]) => {
    const res = await fetch(`/api/knowledge/scrape-url`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, chatbotIds }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to scrape URL');
    if (data.knowledgeSource) {
      setKnowledgeSources(prev => [data.knowledgeSource, ...prev.filter(k => k.id !== data.knowledgeSource.id)]);
    }
  };

  const handleIngestHtml = async (html: string, url?: string, title?: string, chatbotIds: string[] = []) => {
    const res = await fetch(`/api/knowledge/ingest-raw-html`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, url, title, chatbotIds }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to ingest HTML');
    if (data.knowledgeSource) {
      setKnowledgeSources(prev => [data.knowledgeSource, ...prev.filter(k => k.id !== data.knowledgeSource.id)]);
    }
  };

  const handleUpdateSourceLinks = async (sourceId: string, chatbotIds: string[]) => {
    try {
      const res = await fetch(`/api/knowledge/${sourceId}/links`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatbotIds }),
      });
      const data = await res.json();
      if (data.success && data.knowledgeSource) {
        setKnowledgeSources(prev => prev.map(k => k.id === sourceId ? data.knowledgeSource : k));
      }
    } catch (e) {
      console.log('Error updating source links:', e);
    }
  };

  const handleDeleteKnowledgeSource = async (sourceId: string) => {
    try {
      await fetch(`/api/knowledge/${sourceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (e) {
      console.log('Error deleting source from server:', e);
    }
    setKnowledgeSources(prev => prev.filter(k => k.id !== sourceId));
  };

  // Playground query handler
  const handleSendPlaygroundQuery = async (
    botId: string,
    message: string,
    history: Message[]
  ): Promise<{ reply: string; sourcesUsed: GroundingSource[] }> => {
    const res = await fetch(`/api/chatbots/${botId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory: history,
        isPlayground: true,
      }),
    });
    const data = await res.json();
    return {
      reply: data.reply || selectedBot?.fallbackMessage || 'I am currently unable to assist.',
      sourcesUsed: data.sourcesUsed || [],
    };
  };

  // Inbox Handlers
  const handleInboxSendMessage = (conversationId: string, content: string, sender: 'agent' | 'visitor') => {
    const newMsg: Message = {
      id: 'm_' + Date.now(),
      conversationId,
      chatbotId: selectedBot?.id || '',
      sender,
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg],
    }));

    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? {
            ...c,
            lastMessage: content,
            lastMessageTime: new Date().toISOString(),
          }
          : c
      )
    );
  };

  const handleToggleTakeover = (conversationId: string, isTakeover: boolean) => {
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? { ...c, status: isTakeover ? 'human_takeover' : 'active' }
          : c
      )
    );
  };

  const handleResolveConversation = (conversationId: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === conversationId ? { ...c, status: 'resolved' } : c))
    );
  };

  const unreadCount = conversations.filter(c => c.unreadByAgent).length;

  const defaultAnalytics: AnalyticsSummary = analytics || {
    totalConversations: conversations.length > 0 ? conversations.length : 8,
    leadsCaptured: leads.length > 0 ? leads.length : 4,
    aiResolutionRate: 100,
    avgResponseTimeSec: 3.3,
    csatScore: 0.0,
    totalMessages: Object.values(messages).flat().length,
    humanTakeovers: conversations.filter(c => c.status === 'human_takeover').length,
    topTopics: [],
    dailyTrends: [
      { date: 'Aug 15', conversations: 4, leads: 2 },
      { date: 'Aug 16', conversations: 6, leads: 3 },
      { date: 'Aug 17', conversations: 8, leads: 4 },
      { date: 'Aug 18', conversations: 5, leads: 2 },
      { date: 'Aug 19', conversations: 9, leads: 5 },
      { date: 'Aug 20', conversations: 7, leads: 3 },
      { date: 'Aug 21', conversations: 8, leads: 4 },
    ],
  };

  return (
    <div className="min-h-screen bg-dot-grid text-zinc-900 font-sans flex flex-col antialiased selection:bg-zinc-900 selection:text-white">
      {/* Persistent 3-Day Growth Pro Trial Banner */}
      <TrialBanner
        onOpenUpgrade={() => {
          setCheckoutTargetPlan({
            id: 'Pro',
            name: 'Growth Pro',
            monthlyPrice: 49,
            annualPrice: 39,
          });
          setIsCheckoutModalOpen(true);
        }}
      />

      {/* Top Navigation */}
      <Navbar
        onOpenWidgetModal={() => handleOpenEmbedModal()}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <VerificationBanner />
      <MfaRecommendationBanner onNavigateToAccount={() => setActiveTab('account')} />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Slide-over Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-200">
            <div className="w-72 bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-950 text-white shrink-0">
                <span className="font-extrabold text-sm tracking-tight">Main Workspace Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  activeTab={activeTab}
                  setActiveTab={(tab) => {
                    setActiveTab(tab);
                    setIsMobileMenuOpen(false);
                  }}
                  unreadCount={unreadCount}
                />
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* Desktop Sidebar (Only for authenticated tenant session) */}
        {isAuthenticated && (
          <div className="hidden lg:block shrink-0">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />
          </div>
        )}

        {/* Dynamic Main Workspace Container */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto max-w-7xl mx-auto w-full ${!isAuthenticated ? 'min-h-[calc(100vh-14rem)]' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <ErrorBoundary fallbackTitle="View Unavailable" fallbackMessage="This section encountered an issue rendering. You can switch to other views or reload.">
                {activeTab === 'overview' && (
                  <OverviewDashboard
                    analytics={defaultAnalytics}
                    chatbots={chatbots}
                    leads={leads}
                    knowledgeCount={knowledgeSources.length}
                    onNavigate={setActiveTab}
                    onOpenCreateBotModal={handleCreateBot}
                    onOpenEmbedModal={handleOpenEmbedModal}
                  />
                )}

                {activeTab === 'chatbots' && (
                  <BotList
                    chatbots={chatbots}
                    onOpenCreateModal={handleCreateBot}
                    onEditBot={handleEditBot}
                    onTestBot={handleTestBot}
                    onOpenEmbedModal={handleOpenEmbedModal}
                    onTrainBot={handleTrainBot}
                    onDeleteBot={handleDeleteBot}
                  />
                )}

                {activeTab === 'knowledge' && (
                  <KnowledgeManager
                    chatbots={chatbots}
                    knowledgeSources={knowledgeSources}
                    onAddSource={handleAddKnowledgeSource}
                    onScrapeUrl={handleScrapeUrl}
                    onIngestHtml={handleIngestHtml}
                    onUpdateSourceLinks={handleUpdateSourceLinks}
                    onDeleteSource={handleDeleteKnowledgeSource}
                  />
                )}

                {activeTab === 'playground' && (
                  <PlaygroundView
                    chatbots={chatbots}
                    selectedBot={activeBot}
                    onSelectBot={setSelectedBot}
                    onCreateBot={handleCreateBot}
                    onSendQuery={handleSendPlaygroundQuery}
                    onOpenEmbedModal={handleOpenEmbedModal}
                  />
                )}

                {activeTab === 'inbox' && (
                  <InboxView
                    conversations={conversations}
                    messages={messages}
                    chatbots={chatbots}
                    tickets={tickets}
                    onSendMessage={handleInboxSendMessage}
                    onToggleTakeover={handleToggleTakeover}
                    onResolveConversation={handleResolveConversation}
                    onUpdateTicket={handleUpdateTicket}
                    onAssignConversation={(id, memberId, memberName) => {
                      setConversations(prev =>
                        prev.map(c =>
                          c.id === id
                            ? { ...c, assignedTo: memberId, assignedToName: memberName }
                            : c
                        )
                      );
                    }}
                  />
                )}

                {activeTab === 'integrations' && (
                  <IntegrationsView
                    onNavigateToInbox={() => setActiveTab('inbox')}
                    onNavigateToKnowledge={() => setActiveTab('knowledge')}
                  />
                )}

                {activeTab === 'team' && (
                  <TeamView
                    onNavigateToBilling={() => setActiveTab('billing')}
                    onNavigateToInbox={() => setActiveTab('inbox')}
                  />
                )}

                {activeTab === 'account' && (
                  <AccountView />
                )}

                {activeTab === 'settings' && (
                  <SettingsView />
                )}

                {activeTab === 'status' && (
                  <StatusPage onReturnToApp={() => setActiveTab('overview')} />
                )}

                {activeTab === 'security' && (
                  <SecurityPage onReturnToApp={() => setActiveTab('overview')} />
                )}

                {activeTab === 'embed' && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                    <h2 className="text-lg font-bold text-slate-900 mb-2">Embed Code Generator</h2>
                    <p className="text-xs text-slate-500 mb-6">Select a bot to retrieve script snippets and platform guides.</p>
                    <BotList
                      chatbots={chatbots}
                      onOpenCreateModal={handleCreateBot}
                      onEditBot={handleEditBot}
                      onTestBot={handleTestBot}
                      onOpenEmbedModal={handleOpenEmbedModal}
                      onTrainBot={handleTrainBot}
                      onDeleteBot={handleDeleteBot}
                    />
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <OverviewDashboard
                    analytics={defaultAnalytics}
                    chatbots={chatbots}
                    leads={leads}
                    knowledgeCount={knowledgeSources.length}
                    onNavigate={setActiveTab}
                    onOpenCreateBotModal={handleCreateBot}
                    onOpenEmbedModal={handleOpenEmbedModal}
                  />
                )}

                {activeTab === 'features' && (
                  <FeaturesView onNavigateToTab={setActiveTab} />
                )}

                {activeTab === 'billing' && (
                  <BillingDashboardView
                    onNavigateToPublicPricing={() => setActiveTab('pricing')}
                    onNavigateToFaq={() => setActiveTab('faq')}
                    chatbotsCount={chatbots.length}
                  />
                )}

                {activeTab === 'pricing' && (
                  <PricingView
                    onOpenAuthModal={() => setIsAuthModalOpen(true)}
                    onNavigateToFaq={() => setActiveTab('faq')}
                  />
                )}

                {(activeTab === 'faq' || activeTab === 'help') && (
                  <FaqView onOpenTestChat={() => {
                    if (!isAuthenticated) {
                      setIsAuthModalOpen(true);
                      return;
                    }
                    setIsFloatingWidgetOpen(true);
                  }} />
                )}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <Footer onNavigateTab={setActiveTab} onOpenCreateBot={handleCreateBot} />

      {/* Floating Live Widget Test Launcher */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence mode="wait">
          {!isFloatingWidgetOpen ? (
            <motion.button
              key="floating-btn"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => {
                if (!isAuthenticated) {
                  setIsAuthModalOpen(true);
                  return;
                }
                if (activeBot) {
                  setIsFloatingWidgetOpen(true);
                } else {
                  handleCreateBot();
                }
              }}
              style={{ backgroundColor: activeBot?.primaryColor || '#09090b' }}
              className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl cursor-pointer ring-4 ring-white/80"
              title={activeBot ? 'Test Floating AI Widget' : 'Create a Chatbot to Test Live Widget'}
            >
              <MessageSquare className="w-6 h-6" />
            </motion.button>
          ) : (
            activeBot && isAuthenticated && (
              <motion.div
                key="floating-widget"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              >
                <EmbedChatWidget
                  bot={activeBot}
                  isFloating={true}
                  onClose={() => setIsFloatingWidgetOpen(false)}
                />
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <BotEditorModal
        bot={editingBot}
        isOpen={isBotEditorOpen}
        onClose={() => setIsBotEditorOpen(false)}
        onSave={handleSaveBot}
        onDelete={(botId) => {
          const b = chatbots.find(x => x.id === botId);
          if (b) handleDeleteBot(b);
        }}
      />

      <WidgetEmbedModal
        bot={embedModalBot || selectedBot || activeBot}
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        onTriggerFloatingWidget={() => {
          if (!isAuthenticated) {
            setIsWidgetModalOpen(false);
            setIsAuthModalOpen(true);
            return;
          }
          setIsFloatingWidgetOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ExpiredTrialModal
        isOpen={isExpiredTrialModalOpen}
        onClose={() => {
          if (tenant?.id) {
            sessionStorage.setItem('dismissed_expired_trial_' + tenant.id, 'true');
          }
          setIsExpiredTrialModalOpen(false);
        }}
        onStayOnFree={async () => {
          if (tenant?.id) {
            sessionStorage.setItem('dismissed_expired_trial_' + tenant.id, 'true');
          }
          await switchPlan('Free');
          setIsExpiredTrialModalOpen(false);
        }}
        onSelectUpgradeToPro={() => {
          if (tenant?.id) {
            sessionStorage.setItem('dismissed_expired_trial_' + tenant.id, 'true');
          }
          setIsExpiredTrialModalOpen(false);
          setCheckoutTargetPlan({
            id: 'Pro',
            name: 'Growth Pro',
            monthlyPrice: 49,
            annualPrice: 39,
          });
          setIsCheckoutModalOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        planId={checkoutTargetPlan.id}
        planName={checkoutTargetPlan.name}
        monthlyPrice={checkoutTargetPlan.monthlyPrice}
        annualPrice={checkoutTargetPlan.annualPrice}
      />
    </div>
  );
}

function StandaloneEmbedView({ botId }: { botId: string }) {
  const [bot, setBot] = useState<Chatbot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string; isSecurity?: boolean } | null>(null);

  useEffect(() => {
    // Preserve query parameters (host, domain, token) when fetching
    const search = window.location.search;
    fetch(`/api/chatbots/${botId}${search ? search + '&embed=true' : '?embed=true'}`)
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403 || data.code === 'UNAUTHORIZED_DOMAIN') {
          throw {
            isSecurity: true,
            title: '403 Unauthorized Domain',
            message: data.error || 'This chatbot widget is securely locked and cannot be loaded on this domain.',
          };
        }
        if (!res.ok) {
          throw {
            isSecurity: false,
            title: 'Chatbot Not Found (404)',
            message: data.error || 'The requested AI Chatbot does not exist or has been removed.',
          };
        }
        return data;
      })
      .then(data => {
        if (data.success && data.chatbot) {
          setBot(data.chatbot);
        } else {
          setError({
            isSecurity: false,
            title: 'Chatbot Not Found',
            message: 'Unable to load chatbot configuration.',
          });
        }
      })
      .catch(err => {
        if (err && err.isSecurity) {
          setError({
            isSecurity: true,
            title: err.title,
            message: err.message,
          });
        } else {
          setError({
            isSecurity: false,
            title: err.title || 'Error Loading Widget',
            message: err.message || 'Failed to load chatbot widget.',
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, [botId]);

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-indigo-600 font-medium text-xs">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading AI Assistant...</span>
        </div>
      </div>
    );
  }

  if (error || !bot) {
    const isSec = error?.isSecurity;
    return (
      <div className="w-full h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className={`bg-white border rounded-2xl p-6 max-w-md w-full text-center shadow-xl ${isSec ? 'border-amber-300' : 'border-red-200'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${isSec ? 'bg-amber-100 text-amber-700' : 'bg-red-50 text-red-600'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-2">
            {error?.title || 'Chatbot Unavailable'}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            {error?.message || 'The requested AI Chatbot cannot be loaded.'}
          </p>
          {isSec && (
            <div className="bg-amber-50 rounded-xl p-3 text-left border border-amber-200/60">
              <p className="text-[11px] text-amber-900 font-medium leading-normal">
                🛡️ <strong>Domain Locking Active:</strong> If you are the website owner, log in to your dashboard to add this website's domain to your authorized whitelist.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-transparent p-2">
      <EmbedChatWidget bot={bot} isFloating={false} />
    </div>
  );
}

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/admin') || window.location.hash === '#admin';
  });
  const [isStatusMode, setIsStatusMode] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/status') || window.location.hash === '#status';
  });
  const [isSecurityMode, setIsSecurityMode] = useState<boolean>(() => {
    return window.location.pathname.startsWith('/security') || window.location.hash === '#security';
  });

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminMode(window.location.pathname.startsWith('/admin') || window.location.hash === '#admin');
      setIsStatusMode(window.location.pathname.startsWith('/status') || window.location.hash === '#status');
      setIsSecurityMode(window.location.pathname.startsWith('/security') || window.location.hash === '#security');
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const path = window.location.pathname;
  if (path.startsWith('/embed/')) {
    const botId = path.split('/embed/')[1];
    return <StandaloneEmbedView botId={botId} />;
  }

  if (isStatusMode) {
    return (
      <StatusPage
        onReturnToApp={() => {
          if (window.location.pathname.startsWith('/status')) {
            window.history.pushState({}, '', '/');
          }
          if (window.location.hash === '#status') {
            window.location.hash = '';
          }
          setIsStatusMode(false);
        }}
      />
    );
  }

  if (isSecurityMode) {
    return (
      <SecurityPage
        onReturnToApp={() => {
          if (window.location.pathname.startsWith('/security')) {
            window.history.pushState({}, '', '/');
          }
          if (window.location.hash === '#security') {
            window.location.hash = '';
          }
          setIsSecurityMode(false);
        }}
      />
    );
  }

  if (isAdminMode) {
    return (
      <AdminApp
        onReturnToUserApp={() => {
          if (window.location.pathname.startsWith('/admin')) {
            window.history.pushState({}, '', '/');
          }
          if (window.location.hash === '#admin') {
            window.location.hash = '';
          }
          setIsAdminMode(false);
        }}
      />
    );
  }

  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

