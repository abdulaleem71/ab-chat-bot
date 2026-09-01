import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLogin } from './components/AdminLogin';
import { AdminSidebar, AdminTab } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { CommandCenterOverview } from './components/CommandCenterOverview';
import { UserDirectoryView } from './components/UserDirectoryView';
import { ChatbotDirectoryView } from './components/ChatbotDirectoryView';
import { WebsiteDomainCenterView } from './components/WebsiteDomainCenterView';
import { ConversationLogsView } from './components/ConversationLogsView';
import { ProductAnalyticsView } from './components/ProductAnalyticsView';
import { ConversionFunnelView } from './components/ConversionFunnelView';
import { UserIntelligenceView } from './components/UserIntelligenceView';
import { SystemAlertsView } from './components/SystemAlertsView';
import { ContentModerationView } from './components/ContentModerationView';
import { AuditLogsView } from './components/AuditLogsView';
import { OverviewMetrics } from './repositories/adminOverviewRepo';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AdminAppProps {
  onReturnToUserApp: () => void;
}

const AdminShell: React.FC<AdminAppProps> = ({ onReturnToUserApp }) => {
  const { isAuthenticated } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(15);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchOverviewMetrics = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setError(null);
      const token =
        localStorage.getItem('nomads_admin_token') ||
        localStorage.getItem('nomadschat_admin_token') ||
        localStorage.getItem('token');

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/admin/overview', {
        credentials: 'include',
        headers,
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Administrative session expired or unauthorized.');
        }
        throw new Error(`Failed to query metrics (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setMetrics(json.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        throw new Error(json.error || 'Invalid metrics response format');
      }
    } catch (err: any) {
      console.error('[Admin] Failed to fetch overview metrics:', err);
      setError(err.message || 'Error communicating with administration backend');
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    fetchOverviewMetrics();
  }, [fetchOverviewMetrics]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchOverviewMetrics();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchOverviewMetrics]);

  const getTabTitle = (tab: AdminTab) => {
    switch (tab) {
      case 'overview':
        return 'Command Center';
      case 'users':
        return 'User Directory';
      case 'chatbots':
        return 'Chatbots Management';
      case 'websites':
        return 'Websites & Domains';
      case 'conversations':
        return 'Conversations & Logs';
      case 'analytics':
        return 'Product Analytics';
      case 'funnel':
        return 'Conversion Funnel';
      case 'intelligence':
        return 'User Intelligence';
      case 'alerts':
        return 'System Alerts';
      case 'moderation':
        return 'Content Moderation & Safety';
      case 'audit':
        return 'Administrative Audit Logs';
      default:
        return 'Admin Portal';
    }
  };

  const getTabSubtitle = (tab: AdminTab) => {
    switch (tab) {
      case 'overview':
        return 'Real-time performance indicators, platform health, and live telemetry';
      case 'conversations':
        return 'Real-time platform activity stream and historical conversation transcripts';
      default:
        return 'Administrative management interface';
    }
  };

  return (
    <div className="min-h-screen bg-dot-grid text-zinc-900 flex font-sans antialiased selection:bg-zinc-900 selection:text-white">
      {/* Fixed Admin Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onReturnToUserApp={onReturnToUserApp}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <AdminHeader
          title={getTabTitle(currentTab)}
          subtitle={getTabSubtitle(currentTab)}
          isRefreshing={isLoadingMetrics}
          onRefresh={fetchOverviewMetrics}
          lastUpdated={lastUpdated}
          autoRefreshInterval={autoRefreshInterval}
          onSetAutoRefreshInterval={setAutoRefreshInterval}
          queryLatencyMs={metrics?.system.dbQueryLatencyMs}
        />

        {/* Global Error Banner if any */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchOverviewMetrics}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition cursor-pointer font-heading text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content switch */}
        <main className="flex-1 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {currentTab === 'overview' && (
                <CommandCenterOverview
                  metrics={metrics}
                  isLoading={isLoadingMetrics}
                  errorMessage={error}
                  onRefresh={fetchOverviewMetrics}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'users' && (
                <UserDirectoryView />
              )}

              {currentTab === 'chatbots' && (
                <ChatbotDirectoryView />
              )}

              {currentTab === 'websites' && (
                <WebsiteDomainCenterView />
              )}

              {currentTab === 'conversations' && (
                <div className="p-6">
                  <ConversationLogsView
                    metrics={metrics}
                    isLoadingOverview={isLoadingMetrics}
                    onRefreshOverview={fetchOverviewMetrics}
                  />
                </div>
              )}

              {currentTab === 'analytics' && (
                <div className="p-6">
                  <ProductAnalyticsView />
                </div>
              )}

              {currentTab === 'funnel' && (
                <div className="p-6">
                  <ConversionFunnelView />
                </div>
              )}

              {currentTab === 'intelligence' && (
                <div className="p-6">
                  <UserIntelligenceView />
                </div>
              )}

              {currentTab === 'alerts' && (
                <div className="p-6">
                  <SystemAlertsView />
                </div>
              )}

              {currentTab === 'moderation' && (
                <div className="p-6">
                  <ContentModerationView />
                </div>
              )}

              {currentTab === 'audit' && (
                <div className="p-6">
                  <AuditLogsView />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const AdminContent: React.FC<AdminAppProps> = ({ onReturnToUserApp }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Verifying administrative security credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onBackToApp={onReturnToUserApp} />;
  }

  return <AdminShell onReturnToUserApp={onReturnToUserApp} />;
};

export const AdminApp: React.FC<AdminAppProps> = ({ onReturnToUserApp }) => {
  return (
    <AdminAuthProvider>
      <AdminContent onReturnToUserApp={onReturnToUserApp} />
    </AdminAuthProvider>
  );
};
