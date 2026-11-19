import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PublicLandingView } from './components/public/PublicLandingView';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { BotList } from './components/chatbots/BotList';
import { BotEditorModal } from './components/chatbots/BotEditorModal';
import { KnowledgeManager } from './components/chatbots/KnowledgeManager';
import { PlaygroundView } from './components/playground/PlaygroundView';
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
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { AdminPortalView } from './components/admin/AdminPortalView';
import { ShopifyCheckoutModal } from './components/pricing/ShopifyCheckoutModal';
import { ContactSalesModal } from './components/pricing/ContactSalesModal';
import { AdminApp } from './admin/AdminApp';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastProvider, useToast } from './context/ToastContext';
import { CommandPalette } from './components/common/CommandPalette';
import { EmptyState } from './components/common/EmptyState';
import { WorkspaceGuard } from './components/common/WorkspaceGuard';
import { ThreadChatSkeleton } from './components/common/SkeletonLoader';
import { getAccessibleTextColor } from './lib/colorUtils';
import { Chatbot, KnowledgeSource, Conversation, Message, SupportTicket, VisitorLead, GroundingSource, AnalyticsSummary, TenantPlan } from './types';
import { MessageSquare, X, AlertCircle, Code } from 'lucide-react';

const PUBLIC_VIEWS = new Set(['landing', 'features', 'pricing', 'faq', 'help', 'status', 'security']);

function DashboardContent() {
  const { isAuthenticated, isLoading: isAuthLoading, tenant, startDemoSession } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) return tabParam;
      const hash = window.location.hash.replace(/^#/, '');
      if (hash && PUBLIC_VIEWS.has(hash)) return hash;
    }
    return 'landing';
  });
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);
  const [isLoadingChatbots, setIsLoadingChatbots] = useState<boolean>(true);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [leads, setLeads] = useState<VisitorLead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

  // Effective current bot for preview and views
  const activeBot = selectedBot || (chatbots.length > 0 ? chatbots[0] : null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      if (selectedBot) {
        url.searchParams.set('bot', selectedBot.id);
        url.searchParams.set('botId', selectedBot.id);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleSelectBot = (bot: Chatbot) => {
    setSelectedBot(bot);
    try {
      localStorage.setItem('nomads_active_bot_id', bot.id);
    } catch (e) {}
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('bot', bot.id);
      url.searchParams.set('botId', bot.id);
      window.history.replaceState({}, '', url.toString());
    }
    showToast(`Switched active assistant to "${bot.name}"`, 'info');
  };

  // Browser navigation popstate listener
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const botIdParam = params.get('botId') || params.get('bot');
      if (tabParam) {
        setActiveTab(tabParam);
      }
      if (botIdParam && chatbots.length > 0) {
        const found = chatbots.find(b => b.id === botIdParam);
        if (found) {
          setSelectedBot(found);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [chatbots]);

  // Modals & Floating preview & Mobile Menu & Command Palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBotEditorOpen, setIsBotEditorOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<Partial<Chatbot> | null>(null);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [embedModalBot, setEmbedModalBot] = useState<Chatbot | null>(null);
  const [isFloatingWidgetOpen, setIsFloatingWidgetOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isStartingDemo, setIsStartingDemo] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExpiredTrialModalOpen, setIsExpiredTrialModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLaunchDemo = async () => {
    setIsStartingDemo(true);
    try {
      await startDemoSession();
      handleTabChange('overview');
      showToast('Interactive Demo Workspace ready!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Unable to launch demo workspace.', 'error');
    } finally {
      setIsStartingDemo(false);
    }
  };

  // Redirect between public landing & workspace overview on auth change
  useEffect(() => {
    if (isAuthLoading) return;
    if (isAuthenticated && activeTab === 'landing') {
      handleTabChange('overview');
    } else if (!isAuthenticated && !PUBLIC_VIEWS.has(activeTab)) {
      setActiveTab('landing');
    }
  }, [isAuthenticated, isAuthLoading]);
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

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchApi = (url: string, options: RequestInit = {}) => {
    const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || '') : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, {
      credentials: 'include',
      ...options,
      headers,
    });
  };

  // 1. Fetch Chatbots on Auth / Mount
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingChatbots(false);
      return;
    }
    setIsLoadingChatbots(true);
    fetchApi('/api/chatbots')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.chatbots) {
          setChatbots(data.chatbots);
          if (data.chatbots.length > 0) {
            let matchedBot: Chatbot | undefined;
            // 1) URL query param priority
            if (typeof window !== 'undefined') {
              const params = new URLSearchParams(window.location.search);
              const urlBotId = params.get('botId') || params.get('bot');
              if (urlBotId) {
                matchedBot = data.chatbots.find((b: Chatbot) => b.id === urlBotId);
              }
            }
            // 2) LocalStorage priority
            if (!matchedBot) {
              try {
                const savedBotId = localStorage.getItem('nomads_active_bot_id');
                if (savedBotId) {
                  matchedBot = data.chatbots.find((b: Chatbot) => b.id === savedBotId);
                }
              } catch (e) {}
            }
            // 3) Default to first bot
            const finalBot = matchedBot || data.chatbots[0];
            setSelectedBot(finalBot);
            try {
              localStorage.setItem('nomads_active_bot_id', finalBot.id);
            } catch (e) {}
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.set('botId', finalBot.id);
              window.history.replaceState({}, '', url.toString());
            }
          }
        }
      })
      .catch(err => console.log('Error fetching chatbots:', err))
      .finally(() => setIsLoadingChatbots(false));
  }, [isAuthenticated]);

  // Keep selectedBot in sync if chatbots list changes or is reloaded
  useEffect(() => {
    if (!selectedBot && chatbots.length > 0) {
      let matchedBot: Chatbot | undefined;
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlBotId = params.get('botId') || params.get('bot');
        if (urlBotId) {
          matchedBot = chatbots.find(b => b.id === urlBotId);
        }
      }
      if (!matchedBot) {
        try {
          const savedBotId = localStorage.getItem('nomads_active_bot_id');
          if (savedBotId) {
            matchedBot = chatbots.find(b => b.id === savedBotId);
          }
        } catch (e) {}
      }
      const finalBot = matchedBot || chatbots[0];
      setSelectedBot(finalBot);
    }
  }, [selectedBot, chatbots]);

  // 2. Fetch Tenant Knowledge Sources
  const fetchKnowledgeSources = (silent = false) => {
    if (!isAuthenticated) {
      setIsLoadingKnowledge(false);
      return;
    }
    if (!silent) setIsLoadingKnowledge(true);
    fetchApi('/api/knowledge')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.knowledgeSources) {
          setKnowledgeSources(data.knowledgeSources);
        }
      })
      .catch(err => console.log('Error fetching knowledge sources:', err))
      .finally(() => {
        if (!silent) setIsLoadingKnowledge(false);
      });
  };

  useEffect(() => {
    fetchKnowledgeSources();
  }, [isAuthenticated]);

  // Poll for pending knowledge sources
  useEffect(() => {
    const hasPending = knowledgeSources.some(s => s.status === 'pending' || s.status === 'processing');
    if (!hasPending || !isAuthenticated) return;
    
    const intervalId = setInterval(() => fetchKnowledgeSources(true), 3000);
    return () => clearInterval(intervalId);
  }, [knowledgeSources, isAuthenticated]);

  // 3. Fetch Conversations & Inbox Data
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingConversations(false);
      return;
    }
    setIsLoadingConversations(true);
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
      .catch(err => console.log('Error fetching conversations:', err))
      .finally(() => setIsLoadingConversations(false));
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
    if (!isAuthenticated) {
      setIsLoadingAnalytics(false);
      return;
    }
    setIsLoadingAnalytics(true);
    fetchApi(`/api/analytics?range=${analyticsRange}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
        }
      })
      .catch(err => console.log('Error fetching analytics:', err))
      .finally(() => setIsLoadingAnalytics(false));
  }, [isAuthenticated, activeTab, analyticsRange]);

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
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      throw new Error('Please sign in to create or edit chatbots.');
    }
    if (editingBot && editingBot.id) {
      try {
        const res = await fetchApi(`/api/chatbots/${editingBot.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to update chatbot (HTTP ${res.status})`);
        }
        const updated = data.chatbot;
        if (updated) {
          setChatbots(prev => prev.map(b => (b.id === updated.id ? updated : b)));
          if (selectedBot?.id === updated.id) setSelectedBot(updated);
          setIsBotEditorOpen(false);
          setEditingBot(null);
          showToast(`Successfully updated "${updated.name}" settings!`, 'success');
        }
        return updated;
      } catch (e: any) {
        console.error('Error updating chatbot:', e);
        showToast(e.message || 'Failed to update chatbot.', 'error');
        throw e;
      }
    } else {
      try {
        const res = await fetchApi('/api/chatbots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to create chatbot (HTTP ${res.status})`);
        }
        const newBot = data.chatbot;
        if (newBot) {
          setChatbots(prev => [newBot, ...prev]);
          setSelectedBot(newBot);
          try {
            localStorage.setItem('nomads_active_bot_id', newBot.id);
          } catch (err) {}
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('botId', newBot.id);
            window.history.replaceState({}, '', url.toString());
          }
          setIsBotEditorOpen(false);
          setEditingBot(null);
          showToast(`Created new assistant "${newBot.name}"!`, 'success');
        }
        return newBot;
      } catch (e: any) {
        console.error('Error creating chatbot:', e);
        showToast(e.message || 'Failed to create chatbot.', 'error');
        throw e;
      }
    }
  };

  const handleTestBot = (bot: Chatbot) => {
    handleSelectBot(bot);
    handleTabChange('playground');
  };

  const handleTrainBot = (bot: Chatbot) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    handleSelectBot(bot);
    handleTabChange('knowledge');
  };

  const handleDeleteBot = async (bot: Chatbot) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!bot || !bot.id) return;
    try {
      const res = await fetchApi(`/api/chatbots/${bot.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to delete chatbot (HTTP ${res.status})`);
      }
      setChatbots(prev => {
        const remaining = prev.filter(b => b.id !== bot.id);
        if (selectedBot?.id === bot.id) {
          const nextBot = remaining.length > 0 ? remaining[0] : null;
          setSelectedBot(nextBot);
          if (nextBot) {
            try {
              localStorage.setItem('nomads_active_bot_id', nextBot.id);
            } catch (e) {}
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.set('botId', nextBot.id);
              window.history.replaceState({}, '', url.toString());
            }
          } else {
            try {
              localStorage.removeItem('nomads_active_bot_id');
            } catch (e) {}
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('botId');
              window.history.replaceState({}, '', url.toString());
            }
          }
        }
        return remaining;
      });
      showToast(`Chatbot "${bot.name}" has been deleted.`, 'info');
    } catch (e: any) {
      console.error('Error deleting chatbot:', e);
      showToast(e.message || 'Failed to delete chatbot.', 'error');
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
      handleSelectBot(target);
    }
    setIsWidgetModalOpen(true);
  };

  // Knowledge Handlers
  const handleAddKnowledgeSource = async (sourceData: Partial<KnowledgeSource> & { chatbotIds: string[] }) => {
    try {
      const res = await fetchApi(`/api/knowledge`, {
        method: 'POST',
        body: JSON.stringify(sourceData),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.knowledgeSource) {
        setKnowledgeSources(prev => [data.knowledgeSource, ...prev.filter(k => k.id !== data.knowledgeSource.id)]);
      }
    } catch (err) {
      console.error('Error adding knowledge source:', err);
    }
  };

  const handleScrapeUrl = async (url: string, chatbotIds: string[]) => {
    const res = await fetchApi(`/api/knowledge/scrape-url`, {
      method: 'POST',
      body: JSON.stringify({ url, chatbotIds }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to scrape URL');
    if (data.knowledgeSource) {
      setKnowledgeSources(prev => [data.knowledgeSource, ...prev.filter(k => k.id !== data.knowledgeSource.id)]);
    }
  };

  const handleIngestHtml = async (html: string, url?: string, title?: string, chatbotIds: string[] = []) => {
    const res = await fetchApi(`/api/knowledge/ingest-raw-html`, {
      method: 'POST',
      body: JSON.stringify({ html, url, title, chatbotIds }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to ingest HTML');
    if (data.knowledgeSource) {
      setKnowledgeSources(prev => [data.knowledgeSource, ...prev.filter(k => k.id !== data.knowledgeSource.id)]);
    }
  };

  const handleUpdateSourceLinks = async (sourceId: string, chatbotIds: string[]) => {
    try {
      const res = await fetchApi(`/api/knowledge/${sourceId}/links`, {
        method: 'PUT',
        body: JSON.stringify({ chatbotIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.knowledgeSource) {
        setKnowledgeSources(prev => prev.map(k => k.id === sourceId ? data.knowledgeSource : k));
      }
    } catch (e) {
      console.error('Error updating source links:', e);
    }
  };

  const handleDeleteKnowledgeSource = async (sourceId: string) => {
    try {
      await fetchApi(`/api/knowledge/${sourceId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Error deleting source from server:', e);
    }
    setKnowledgeSources(prev => prev.filter(k => k.id !== sourceId));
  };

  // Playground query handler
  const handleSendPlaygroundQuery = async (
    botId: string,
    message: string,
    history: Message[]
  ): Promise<{ reply: string; sourcesUsed: GroundingSource[] }> => {
    const res = await fetchApi(`/api/chatbots/${botId}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversationHistory: history,
        isPlayground: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      reply: data.reply || selectedBot?.fallbackMessage || 'I am currently unable to assist.',
      sourcesUsed: data.sourcesUsed || [],
    };
  };

  // Inbox Handlers
  const handleInboxSendMessage = async (conversationId: string, content: string, sender: 'agent' | 'visitor') => {
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

    try {
      await fetchApi(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, sender }),
      });
    } catch (err) {
      console.error('Error posting message:', err);
    }
  };

  const handleToggleTakeover = async (conversationId: string, isTakeover: boolean) => {
    const newStatus = isTakeover ? 'human_takeover' : 'active';
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? { ...c, status: newStatus }
          : c
      )
    );
    try {
      await fetchApi(`/api/conversations/${conversationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleResolveConversation = async (conversationId: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === conversationId ? { ...c, status: 'resolved' } : c))
    );
    try {
      await fetchApi(`/api/conversations/${conversationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'resolved' }),
      });
    } catch (err) {
      console.error('Error resolving conversation:', err);
    }
  };

  const unreadCount = conversations.filter(c => c.unreadByAgent).length;

  const defaultAnalytics: AnalyticsSummary = analytics || {
    totalConversations: conversations.length,
    leadsCaptured: leads.length,
    aiResolutionRate: conversations.length > 0 ? 100 : 0,
    avgResponseTimeSec: 0,
    csatScore: 0,
    totalMessages: Object.values(messages).flat().length,
    humanTakeovers: conversations.filter(c => c.status === 'human_takeover').length,
    topTopics: [],
    dailyTrends: [],
  };

  return (
    <div className="min-h-screen bg-dot-grid text-zinc-900 font-sans flex flex-col antialiased selection:bg-zinc-900 selection:text-white">
      {/* Persistent 3-Day Pro Trial Banner (Authenticated workspace only) */}
      {isAuthenticated && (
        <TrialBanner
          onOpenUpgrade={() => {
            setCheckoutTargetPlan({
              id: 'Pro',
              name: 'NomadsChat Pro',
              monthlyPrice: 49,
              annualPrice: 39,
            });
            setIsCheckoutModalOpen(true);
          }}
        />
      )}

      {/* Persistent Sticky Top Bar */}
      <Header
        chatbots={chatbots}
        selectedBot={activeBot}
        onSelectBot={handleSelectBot}
        onCreateBot={handleCreateBot}
        onOpenEmbedModal={() => handleOpenEmbedModal()}
        onOpenAuthModal={() => openAuthModal('signin')}
        onOpenSignupModal={() => openAuthModal('signup')}
        onStartDemo={handleLaunchDemo}
        isStartingDemo={isStartingDemo}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      <VerificationBanner />
      <MfaRecommendationBanner onNavigateToAccount={() => handleTabChange('account')} />

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
                    handleTabChange(tab);
                    setIsMobileMenuOpen(false);
                  }}
                  unreadCount={unreadCount}
                  onOpenCommandPalette={() => {
                    setIsMobileMenuOpen(false);
                    setIsCommandPaletteOpen(true);
                  }}
                />
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* Desktop Sidebar (Only for authenticated tenant session) */}
        {isAuthenticated && (
          <div className="hidden lg:block shrink-0">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={handleTabChange}
              unreadCount={unreadCount}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />
          </div>
        )}

        {/* Dynamic Main Workspace Container */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className={`flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full ${!isAuthenticated ? 'min-h-[calc(100vh-14rem)]' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <ErrorBoundary fallbackTitle="View Unavailable" fallbackMessage="This section encountered an issue rendering. You can switch to other views or reload.">
                {activeTab === 'landing' && !isAuthenticated && (
                  <PublicLandingView
                    onOpenSignup={() => openAuthModal('signup')}
                    onOpenSignIn={() => openAuthModal('signin')}
                    onTryDemo={handleLaunchDemo}
                    onNavigate={handleTabChange}
                    isDemoLoading={isStartingDemo}
                  />
                )}

                {(activeTab === 'overview' || (activeTab === 'landing' && isAuthenticated)) && (
                  <OverviewDashboard
                    analytics={defaultAnalytics}
                    chatbots={chatbots}
                    leads={leads}
                    knowledgeCount={knowledgeSources.length}
                    isLoading={isLoadingAnalytics}
                    dateRange={analyticsRange}
                    onDateRangeChange={setAnalyticsRange}
                    onNavigate={handleTabChange}
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
                  <WorkspaceGuard
                    selectedBot={activeBot}
                    featureTitle="Knowledge Base"
                    featureDescription="Train your AI chatbot on custom documents, PDFs, FAQs, and scraped URLs to ground its responses."
                    onCreateBot={handleCreateBot}
                    chatbots={chatbots}
                    onSelectBot={handleSelectBot}
                  >
                    <KnowledgeManager
                      chatbots={chatbots}
                      selectedBot={activeBot}
                      onSelectBot={handleSelectBot}
                      knowledgeSources={knowledgeSources}
                      isFetchingSources={isLoadingKnowledge}
                      onAddSource={handleAddKnowledgeSource}
                      onScrapeUrl={handleScrapeUrl}
                      onIngestHtml={handleIngestHtml}
                      onUpdateSourceLinks={handleUpdateSourceLinks}
                      onDeleteSource={handleDeleteKnowledgeSource}
                      onCreateBot={handleCreateBot}
                    />
                  </WorkspaceGuard>
                )}

                {activeTab === 'playground' && (
                  <WorkspaceGuard
                    selectedBot={activeBot}
                    featureTitle="Live Test Playground"
                    featureDescription="Test and refine your AI chatbot with live model streaming, tone adjustments, and RAG citation inspection."
                    onCreateBot={handleCreateBot}
                    chatbots={chatbots}
                    onSelectBot={handleSelectBot}
                  >
                    <PlaygroundView
                      chatbots={chatbots}
                      selectedBot={activeBot}
                      onSelectBot={handleSelectBot}
                      onCreateBot={handleCreateBot}
                      onSendQuery={handleSendPlaygroundQuery}
                      onOpenEmbedModal={handleOpenEmbedModal}
                    />
                  </WorkspaceGuard>
                )}

                {activeTab === 'inbox' && (
                  <InboxView
                    conversations={conversations}
                    messages={messages}
                    chatbots={chatbots}
                    tickets={tickets}
                    leads={leads}
                    isLoading={isLoadingConversations}
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
                    onOpenEmbedModal={() => handleOpenEmbedModal()}
                  />
                )}

                {activeTab === 'integrations' && (
                  <IntegrationsView
                    onNavigateToInbox={() => handleTabChange('inbox')}
                    onNavigateToKnowledge={() => handleTabChange('knowledge')}
                  />
                )}

                {activeTab === 'team' && (
                  <TeamView
                    onNavigateToBilling={() => handleTabChange('billing')}
                    onNavigateToInbox={() => handleTabChange('inbox')}
                  />
                )}

                {activeTab === 'account' && (
                  <AccountView />
                )}

                {activeTab === 'settings' && (
                  <SettingsView />
                )}

                {activeTab === 'status' && (
                  <StatusPage onReturnToApp={() => handleTabChange('overview')} />
                )}

                {activeTab === 'security' && (
                  <SecurityPage onReturnToApp={() => handleTabChange('overview')} />
                )}

                {activeTab === 'embed' && (
                  <WorkspaceGuard
                    selectedBot={activeBot}
                    featureTitle="Widget & Embed Code"
                    featureDescription="Select or create an AI chatbot to generate iframe snippets, floating widget scripts, and CMS integration guides."
                    onCreateBot={handleCreateBot}
                    chatbots={chatbots}
                    onSelectBot={handleSelectBot}
                  >
                    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs">
                      <h2 className="text-lg font-bold text-zinc-950 mb-2">Embed Code Generator</h2>
                      <p className="text-xs text-zinc-500 mb-6">Select a bot to retrieve script snippets and platform guides.</p>
                      {chatbots.length === 0 ? (
                        <EmptyState
                          icon={<Code className="w-6 h-6 text-zinc-700" />}
                          title="No Chatbots Available to Embed"
                          description="Create an AI assistant first to generate embed scripts, WordPress plugins, or Shopify snippets for your website."
                          actionLabel="+ Create Your First Bot"
                          onAction={handleCreateBot}
                        />
                      ) : (
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
                    </div>
                  </WorkspaceGuard>
                )}

                {activeTab === 'analytics' && (
                  <OverviewDashboard
                    analytics={defaultAnalytics}
                    chatbots={chatbots}
                    leads={leads}
                    knowledgeCount={knowledgeSources.length}
                    dateRange={analyticsRange}
                    onDateRangeChange={setAnalyticsRange}
                    onNavigate={handleTabChange}
                    onOpenCreateBotModal={handleCreateBot}
                    onOpenEmbedModal={handleOpenEmbedModal}
                  />
                )}

                {activeTab === 'features' && (
                  <FeaturesView onNavigateToTab={(tab) => {
                    if (!isAuthenticated && !PUBLIC_VIEWS.has(tab)) {
                      openAuthModal('signup');
                      return;
                    }
                    handleTabChange(tab);
                  }} />
                )}

                {activeTab === 'billing' && (
                  <BillingDashboardView
                    onNavigateToPublicPricing={() => handleTabChange('pricing')}
                    onNavigateToFaq={() => handleTabChange('faq')}
                    chatbotsCount={chatbots.length}
                  />
                )}

                {activeTab === 'pricing' && (
                  <PricingView
                    onOpenAuthModal={() => openAuthModal('signup')}
                    onNavigateToFaq={() => handleTabChange('faq')}
                  />
                )}

                {(activeTab === 'faq' || activeTab === 'help') && (
                  <FaqView onOpenTestChat={() => {
                    if (!isAuthenticated) {
                      openAuthModal('signin');
                      return;
                    }
                    setIsFloatingWidgetOpen(true);
                  }} />
                )}
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <Footer
          onNavigateTab={handleTabChange}
          onOpenCreateBot={handleCreateBot}
          onOpenAuthModal={() => openAuthModal('signup')}
          onOpenAdminPortal={() => { window.location.hash = 'admin'; }}
          onOpenAdminAuth={() => { window.location.hash = 'admin'; }}
        />
      </div>
    </div>

      {/* Floating Live Widget Test Launcher & Responsive Breakpoint Widget */}
      <AnimatePresence mode="wait">
        {!isFloatingWidgetOpen ? (
          <div key="floating-launcher-wrapper" className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 sm:z-50 pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]">
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
              style={{
                backgroundColor: activeBot?.primaryColor || '#09090b',
                color: getAccessibleTextColor(activeBot?.primaryColor || '#09090b'),
              }}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl cursor-pointer ring-4 ring-white/80"
              title={activeBot ? 'Test Floating AI Widget' : 'Create a Chatbot to Test Live Widget'}
              aria-label="Open AI Assistant Floating Widget"
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          </div>
        ) : (
          activeBot && isAuthenticated && (
            <motion.div
              key="floating-widget-wrapper"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="fixed inset-0 z-50 w-full h-[100dvh] max-h-[100dvh] sm:h-[600px] sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:max-h-[600px] flex flex-col"
            >
              <ErrorBoundary
                compact
                fallbackTitle="Widget Encountered an Error"
                fallbackMessage="Failed to load floating chat widget."
              >
                <EmbedChatWidget
                  bot={activeBot}
                  isFloating={true}
                  onClose={() => setIsFloatingWidgetOpen(false)}
                />
              </ErrorBoundary>
            </motion.div>
          )
        )}
      </AnimatePresence>

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
        initialMode={authModalMode}
      />

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={() => setIsAdminPortalOpen(true)}
      />

      {isAdminPortalOpen && (
        <AdminPortalView onClose={() => setIsAdminPortalOpen(false)} />
      )}

      <ExpiredTrialModal
        isOpen={isExpiredTrialModalOpen}
        onClose={() => {
          if (tenant?.id) {
            sessionStorage.setItem('dismissed_expired_trial_' + tenant.id, 'true');
          }
          setIsExpiredTrialModalOpen(false);
        }}
        onSelectUpgradeToPro={() => {
          if (tenant?.id) {
            sessionStorage.setItem('dismissed_expired_trial_' + tenant.id, 'true');
          }
          setIsExpiredTrialModalOpen(false);
          setCheckoutTargetPlan({
            id: 'Pro',
            name: 'NomadsChat Pro',
            monthlyPrice: 49,
            annualPrice: 39,
          });
          setIsCheckoutModalOpen(true);
        }}
        onContactSales={() => {
          setIsExpiredTrialModalOpen(false);
          setIsContactSalesOpen(true);
        }}
      />

      <ShopifyCheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        planId={checkoutTargetPlan.id}
        planName={checkoutTargetPlan.name}
        monthlyPrice={checkoutTargetPlan.monthlyPrice}
        annualPrice={checkoutTargetPlan.annualPrice}
      />

      <ContactSalesModal
        isOpen={isContactSalesOpen}
        onClose={() => setIsContactSalesOpen(false)}
      />

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsCommandPaletteOpen(false);
        }}
        chatbots={chatbots}
        onSelectBotForTest={(bot) => {
          setSelectedBot(bot);
          setActiveTab('playground');
          setIsCommandPaletteOpen(false);
        }}
        onOpenCreateBot={() => {
          setIsCommandPaletteOpen(false);
          handleCreateBot();
        }}
        onOpenEmbedModal={() => {
          setIsCommandPaletteOpen(false);
          handleOpenEmbedModal();
        }}
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
      <div className="w-full h-screen bg-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden h-[600px] flex flex-col">
          <ThreadChatSkeleton className="h-full" />
        </div>
      </div>
    );
  }

  if (error || !bot) {
    const isSec = error?.isSecurity;
    return (
      <div className="w-full h-screen bg-zinc-100 flex items-center justify-center p-4">
        <div className={`bg-white border rounded-2xl p-6 max-w-md w-full text-center shadow-xl ${isSec ? 'border-amber-300' : 'border-rose-200'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${isSec ? 'bg-amber-100 text-amber-700' : 'bg-rose-50 text-rose-600'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-zinc-950 text-base mb-2">
            {error?.title || 'Chatbot Unavailable'}
          </h3>
          <p className="text-xs text-zinc-600 leading-relaxed mb-4">
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
    <div className="w-full h-[100dvh] bg-transparent p-0 sm:p-2">
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
    <ErrorBoundary
      fallbackTitle="Application Recovery"
      fallbackMessage="An unexpected issue occurred while rendering the workspace. You can reload the page or reset the app state."
    >
      <AuthProvider>
        <ToastProvider>
          <DashboardContent />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

