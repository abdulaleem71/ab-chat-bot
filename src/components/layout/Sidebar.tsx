import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Bot,
  BookOpen,
  PlaySquare,
  Inbox,
  Code,
  BarChart3,
  CreditCard,
  HelpCircle,
  ChevronDown,
  Plug,
  Users,
  Settings,
  Webhook,
  PanelLeftClose,
  PanelLeft,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GEMINI_CONFIG } from '../../config/models';

export interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
  onOpenCommandPalette?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unreadCount = 1,
  onOpenCommandPalette,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggleCollapse,
}) => {
  const { tenant, isAuthenticated } = useAuth();
  
  // Internal collapsed state with localStorage persistence if not controlled from parent
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nomads_sidebar_collapsed');
        return saved === 'true';
      } catch (e) {}
    }
    return false;
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (controlledToggleCollapse) {
      controlledToggleCollapse();
    } else {
      const nextState = !internalCollapsed;
      setInternalCollapsed(nextState);
      try {
        localStorage.setItem('nomads_sidebar_collapsed', String(nextState));
      } catch (e) {}
    }
  };

  const hasActiveSession = Boolean(isAuthenticated || (tenant && tenant.name && tenant.id));
  const workspaceName = hasActiveSession && tenant?.name ? tenant.name : 'Nomads Workspace';
  const workspacePlan = tenant?.plan || 'Free';

  const navSections = [
    {
      title: 'Workspace',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'chatbots', label: 'Chatbots', icon: Bot },
        { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
        { id: 'inbox', label: 'Live Inbox', icon: Inbox, badge: unreadCount },
        { id: 'playground', label: 'Playground', icon: PlaySquare },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'Deployment',
      items: [
        { id: 'embed', label: 'Embed & Widget', icon: Code },
        { id: 'integrations', label: 'API Keys & Apps', icon: Plug },
        { id: 'webhooks', label: 'Webhooks', icon: Webhook },
      ],
    },
    {
      title: 'Account & Billing',
      items: [
        { id: 'billing', label: 'Subscription Plan', icon: CreditCard },
        { id: 'team', label: 'Team Members', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      id="main-workspace-sidebar"
      className={`border-r border-zinc-200/90 bg-white min-h-[calc(100vh-3.5rem)] flex flex-col justify-between shrink-0 transition-all duration-200 select-none ${
        isCollapsed ? 'w-18 p-2.5' : 'w-64 p-4'
      }`}
    >
      <div className="space-y-3">
        {/* Workspace Selector Pill or Icon */}
        {!isCollapsed ? (
          <div className="px-1">
            <div
              onClick={() => setActiveTab('billing')}
              className="flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-200/90 bg-zinc-50/80 hover:bg-zinc-100/80 transition cursor-pointer group"
              title={`Switch workspace: ${workspaceName} (${workspacePlan} Plan)`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center font-heading shrink-0">
                  {workspaceName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-zinc-900 truncate max-w-[95px] font-heading">
                  {workspaceName}
                </span>
                {hasActiveSession && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-950 text-white leading-none shrink-0">
                    {workspacePlan}
                  </span>
                )}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition shrink-0" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className="w-10 h-10 rounded-xl bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shadow-xs hover:scale-105 transition cursor-pointer"
              title={`Workspace: ${workspaceName} (${workspacePlan} Plan)`}
            >
              {workspaceName.charAt(0).toUpperCase()}
            </button>
          </div>
        )}

        {/* Quick Search / Command Bar Trigger Button */}
        {onOpenCommandPalette && (
          <div>
            {!isCollapsed ? (
              <div className="px-1">
                <button
                  type="button"
                  id="sidebar-search-btn"
                  onClick={onOpenCommandPalette}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition text-xs font-medium cursor-pointer shadow-xs font-body"
                  title="Search commands and navigate (⌘K)"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-zinc-500">Quick actions...</span>
                  </div>
                  <kbd className="text-[10px] font-semibold font-mono bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-500 shadow-xs">
                    ⌘K
                  </kbd>
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="w-10 h-9 rounded-xl border border-zinc-200/70 bg-zinc-50/60 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition cursor-pointer shadow-2xs"
                  title="Quick actions (⌘K)"
                >
                  <Search className="w-4 h-4 text-zinc-600" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Grouped Operational Sections (WORKSPACE, DEPLOYMENT, ACCOUNT/BILLING) */}
        <div className="space-y-4 pt-1">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed ? (
                <p className="px-3 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider font-heading">
                  {section.title}
                </p>
              ) : (
                <div className="h-px bg-zinc-100 my-1 mx-2" />
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'integrations' && activeTab === 'webhooks');

                  return (
                    <motion.button
                      type="button"
                      key={item.id}
                      whileHover={{ x: isCollapsed ? 0 : isActive ? 0 : 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (item.id === 'webhooks') {
                          setActiveTab('integrations');
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      title={`${item.label}${item.badge ? ` (${item.badge} unread)` : ''}`}
                      className={`w-full relative flex items-center rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer font-heading group ${
                        isCollapsed
                          ? 'justify-center p-2.5 h-10'
                          : 'justify-between px-3 py-2'
                      } ${
                        isActive
                          ? 'text-white'
                          : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 font-medium'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabSidebar"
                          className="absolute inset-0 bg-zinc-950 rounded-xl shadow-xs"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}

                      <div
                        className={`flex items-center gap-2.5 relative z-10 ${
                          isCollapsed ? 'justify-center' : ''
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                            isActive
                              ? 'text-white scale-105'
                              : 'text-zinc-500 group-hover:scale-105 group-hover:text-zinc-900'
                          }`}
                        />
                        {!isCollapsed && <span>{item.label}</span>}
                      </div>

                      {/* Unread badge / Notification pill */}
                      {item.badge && item.badge > 0 ? (
                        !isCollapsed ? (
                          <span
                            className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                              isActive
                                ? 'bg-white text-zinc-950 shadow-xs'
                                : 'bg-zinc-950 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : (
                          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-indigo-600 rounded-full ring-2 ring-white z-20" />
                        )
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Area: AI Engine Status + Help + Collapse Toggle */}
      <div className="pt-2 border-t border-zinc-100 space-y-2">
        {/* Grounded RAG Status Box */}
        {!isCollapsed ? (
          <div className="bg-zinc-950 rounded-xl p-3 text-white shadow-xs relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-1 relative z-10">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-zinc-100 font-heading">
                {GEMINI_CONFIG.activeStatusText}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-relaxed relative z-10 font-body">
              Grounded RAG active for fast, accurate chatbot responses.
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title={`${GEMINI_CONFIG.activeStatusText} - Grounded RAG Active`}>
            <div className="w-8 h-8 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-400 shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Secondary Help & Docs Link */}
        {!isCollapsed ? (
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer ${
              activeTab === 'faq' ? 'bg-zinc-100 text-zinc-950 font-bold' : ''
            }`}
            title="Help Center & Documentation"
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>Help &amp; Documentation</span>
          </button>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className="w-10 h-8 rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
              title="Help &amp; Documentation"
            >
              <HelpCircle className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        )}

        {/* Collapse / Expand Toggle Button */}
        <div className="pt-1">
          <button
            type="button"
            id="sidebar-collapse-toggle-btn"
            onClick={handleToggle}
            className={`w-full flex items-center rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer ${
              isCollapsed ? 'justify-center p-2 h-9' : 'justify-between px-3 py-2'
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar (give more space to workspace)'}
          >
            {!isCollapsed ? (
              <>
                <span className="text-[11px] font-medium text-zinc-500">Collapse sidebar</span>
                <PanelLeftClose className="w-4 h-4 text-zinc-500 shrink-0" />
              </>
            ) : (
              <PanelLeft className="w-4 h-4 text-zinc-700" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
