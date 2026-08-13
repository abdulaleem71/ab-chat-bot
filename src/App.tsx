import React, { useState, useEffect } from 'react';
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
import { FeaturesView } from './components/features/FeaturesView';
import { FaqView } from './components/faq/FaqView';
import { Footer } from './components/layout/Footer';
import { Chatbot, KnowledgeSource, Conversation, Message, VisitorLead, GroundingSource, AnalyticsSummary } from './types';
import { MessageSquare, X, AlertCircle, Loader2 } from 'lucide-react';

const DEFAULT_DEMO_BOT: Chatbot = {
  id: 'usr_acme_bot_1',
  tenantId: 'tenant_acme',
  name: 'Acme Support AI',
  description: 'Grounded AI Customer Support Agent for Acme Inc.',
  systemInstruction: 'You are an intelligent support assistant for Acme Inc.',
  tone: 'Professional',
  primaryColor: '#4F46E5',
  textColor: '#FFFFFF',
  avatar: '🤖',
  greetingMessage: 'Hello! How can I assist you with Acme products today?',
  suggestedQuestions: ['What are your business hours?', 'How do I embed the chat widget?', 'How can I reset my password?'],
  model: 'gemini-3.6-flash',
  fallbackMessage: 'I am not sure about that. Let me connect you with a human agent.',
  collectLeadEmail: true,
  leadTitle: 'Connect with Acme Support',
  humanOperatorOnline: true,
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function DashboardContent() {
  const { token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [leads, setLeads] = useState<VisitorLead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  // Effective current bot fallback for preview and widgets
  const activeBot = selectedBot || (chatbots.length > 0 ? chatbots[0] : DEFAULT_DEMO_BOT);

  // Modals & Floating preview & Mobile Menu
  const [isBotEditorOpen, setIsBotEditorOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Partial<Chatbot> | null>(null);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [isFloatingWidgetOpen, setIsFloatingWidgetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getAuthHeaders = () => {
    const currentToken = localStorage.getItem('auth_token') || token;
    return {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
  };

  // 1. Fetch Chatbots on Auth / Mount
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/chatbots', { headers: getAuthHeaders() })
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
  }, [token, isAuthenticated]);

  // 2. Fetch Knowledge Sources when Selected Bot Changes
  useEffect(() => {
    if (!isAuthenticated || !selectedBot) return;
    fetch(`/api/chatbots/${selectedBot.id}/knowledge`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.knowledgeSources) {
          setKnowledgeSources(data.knowledgeSources);
        }
      })
      .catch(err => console.log('Error fetching knowledge sources:', err));
  }, [selectedBot?.id, isAuthenticated]);

  // 3. Fetch Conversations & Inbox Data
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/conversations', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.conversations) {
          setConversations(data.conversations);
          // Fetch messages for each conversation
          data.conversations.forEach((c: Conversation) => {
            fetch(`/api/conversations/${c.id}/messages`, { headers: getAuthHeaders() })
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
  }, [token, isAuthenticated, activeTab]);

  // 4. Fetch Leads
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/leads', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.leads) {
          setLeads(data.leads);
        }
      })
      .catch(err => console.log('Error fetching leads:', err));
  }, [token, isAuthenticated, activeTab]);

  // 5. Fetch Analytics
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/analytics', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
        }
      })
      .catch(err => console.log('Error fetching analytics:', err));
  }, [token, isAuthenticated, activeTab]);

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
          headers: getAuthHeaders(),
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
          headers: getAuthHeaders(),
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
    setSelectedBot(bot);
    setActiveTab('knowledge');
  };

  const handleDeleteBot = async (bot: Chatbot) => {
    if (!bot || !bot.id) return;
    try {
      const res = await fetch(`/api/chatbots/${bot.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
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
    const target = bot || activeBot;
    setSelectedBot(target);
    setIsWidgetModalOpen(true);
  };

  // Knowledge Handlers
  const handleAddKnowledgeSource = async (sourceData: Partial<KnowledgeSource>) => {
    if (!selectedBot) return;
    try {
      const res = await fetch(`/api/chatbots/${selectedBot.id}/knowledge`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(sourceData),
      });
      const data = await res.json();
      if (data.success && data.knowledgeSource) {
        setKnowledgeSources(prev => [data.knowledgeSource, ...prev]);
      }
    } catch (err) {
      console.log('Error adding knowledge source:', err);
    }
  };

  const handleScrapeUrl = async (url: string) => {
    if (!selectedBot) return;
    const res = await fetch(`/api/chatbots/${selectedBot.id}/scrape-url`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to scrape URL');
    if (data.knowledgeSource) {
      setKnowledgeSources(prev => [data.knowledgeSource, ...prev]);
    }
  };

  const handleDeleteKnowledgeSource = async (sourceId: string) => {
    if (!selectedBot) return;
    try {
      await fetch(`/api/chatbots/${selectedBot.id}/knowledge/${sourceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
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
    totalConversations: conversations.length,
    leadsCaptured: leads.length,
    aiResolutionRate: 95.0,
    avgResponseTimeSec: 1.2,
    csatScore: 4.8,
    totalMessages: Object.values(messages).flat().length,
    humanTakeovers: conversations.filter(c => c.status === 'human_takeover').length,
    topTopics: [
      { topic: 'SSO & SAML Setup', count: 12 },
      { topic: 'API Rate Limits & Pricing', count: 8 },
      { topic: 'Team Workspace Invites', count: 5 },
    ],
    dailyTrends: [
      { date: 'Mon', conversations: 4, leads: 2 },
      { date: 'Tue', conversations: 6, leads: 3 },
      { date: 'Wed', conversations: 8, leads: 4 },
      { date: 'Thu', conversations: 5, leads: 2 },
      { date: 'Fri', conversations: 10, leads: 5 },
      { date: 'Sat', conversations: 7, leads: 3 },
      { date: 'Sun', conversations: 9, leads: 4 },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenWidgetModal={() => handleOpenEmbedModal()}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Slide-over Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-200">
            <div className="w-72 bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
              <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-black text-white shrink-0">
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

        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />
        </div>

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <OverviewDashboard
              analytics={defaultAnalytics}
              chatbots={chatbots}
              leads={leads}
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
              selectedBot={activeBot}
              knowledgeSources={knowledgeSources}
              onAddSource={handleAddKnowledgeSource}
              onScrapeUrl={handleScrapeUrl}
              onDeleteSource={handleDeleteKnowledgeSource}
            />
          )}

          {activeTab === 'playground' && (
            <PlaygroundView
              chatbots={chatbots.length > 0 ? chatbots : [activeBot]}
              selectedBot={activeBot}
              onSelectBot={setSelectedBot}
              onSendQuery={handleSendPlaygroundQuery}
            />
          )}

          {activeTab === 'inbox' && (
            <InboxView
              conversations={conversations}
              messages={messages}
              chatbots={chatbots}
              onSendMessage={handleInboxSendMessage}
              onToggleTakeover={handleToggleTakeover}
              onResolveConversation={handleResolveConversation}
            />
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
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <OverviewDashboard
              analytics={defaultAnalytics}
              chatbots={chatbots}
              leads={leads}
              onNavigate={setActiveTab}
              onOpenCreateBotModal={handleCreateBot}
              onOpenEmbedModal={handleOpenEmbedModal}
            />
          )}

          {activeTab === 'features' && (
            <FeaturesView onNavigateToTab={setActiveTab} />
          )}

          {activeTab === 'pricing' && (
            <PricingView
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onNavigateToFaq={() => setActiveTab('faq')}
            />
          )}

          {activeTab === 'faq' && (
            <FaqView onOpenTestChat={() => setIsFloatingWidgetOpen(true)} />
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer onNavigateTab={setActiveTab} onOpenCreateBot={handleCreateBot} />

      {/* Floating Live Widget Test Launcher */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isFloatingWidgetOpen ? (
          <button
            onClick={() => setIsFloatingWidgetOpen(true)}
            style={{ backgroundColor: activeBot.primaryColor || '#4F46E5' }}
            className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl hover:scale-105 transition duration-200 cursor-pointer"
            title="Test Floating AI Widget"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        ) : (
          <EmbedChatWidget
            bot={activeBot}
            isFloating={true}
            onClose={() => setIsFloatingWidgetOpen(false)}
          />
        )}
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
        bot={activeBot}
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
        onTriggerFloatingWidget={() => setIsFloatingWidgetOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

function StandaloneEmbedView({ botId }: { botId: string }) {
  const [bot, setBot] = useState<Chatbot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/chatbots/${botId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Chatbot not found (404)');
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.chatbot) {
          setBot(data.chatbot);
        } else {
          setError('Chatbot not found');
        }
      })
      .catch(err => setError(err.message || 'Failed to load chatbot'))
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
    return (
      <div className="w-full h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-sm w-full text-center shadow-lg">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1">Chatbot Not Found (404)</h3>
          <p className="text-xs text-slate-500 mb-4">
            The requested AI Chatbot widget does not exist or has been removed.
          </p>
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
  const path = window.location.pathname;
  if (path.startsWith('/embed/')) {
    const botId = path.split('/embed/')[1];
    return <StandaloneEmbedView botId={botId} />;
  }

  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
