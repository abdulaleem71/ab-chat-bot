import React from 'react';
import { motion } from 'motion/react';
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
  User,
  Search,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GEMINI_CONFIG } from '../../config/models';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
  onOpenCommandPalette?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unreadCount = 1,
  onOpenCommandPalette,
}) => {
  const { tenant, isAuthenticated } = useAuth();
  const hasActiveSession = Boolean(isAuthenticated || (tenant && tenant.name && tenant.id));
  const workspaceName = hasActiveSession && tenant?.name ? tenant.name : 'Nomads Workspace';
  const workspacePlan = tenant?.plan || 'Free';

  const navSections = [
    {
      title: 'Workspace',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'chatbots', label: 'AI Chatbots', icon: Bot },
        { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
        { id: 'playground', label: 'Live Playground', icon: PlaySquare },
        { id: 'inbox', label: 'Inbox & Live Chat', icon: Inbox, badge: unreadCount },
      ],
    },
    {
      title: 'Connect & Channels',
      items: [
        { id: 'embed', label: 'Widget & Embed', icon: Code },
        { id: 'integrations', label: 'Integrations', icon: Plug },
      ],
    },
    {
      title: 'Insights & Team',
      items: [
        { id: 'analytics', label: 'Analytics & CSAT', icon: BarChart3 },
        { id: 'team', label: 'Team Members', icon: Users },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
        { id: 'account', label: 'My Account', icon: User },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'help', label: 'Help & Docs', icon: HelpCircle },
      ],
    },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200/90 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 transition-all duration-200">
      <div className="space-y-4">
        {/* Workspace Selector Pill */}
        <div className="px-1">
          <div
            onClick={() => setActiveTab('billing')}
            className="flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-200/90 bg-zinc-50/80 hover:bg-zinc-100/80 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-md bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center font-heading shrink-0">
                {workspaceName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-zinc-900 truncate max-w-[95px] font-heading">{workspaceName}</span>
              {hasActiveSession && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-950 text-white leading-none shrink-0">
                  {workspacePlan}
                </span>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition shrink-0" />
          </div>
        </div>

        {/* Quick Search / Command Bar Trigger Button */}
        {onOpenCommandPalette && (
          <div className="px-1">
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-zinc-200/70 bg-zinc-50/60 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition text-xs font-medium cursor-pointer shadow-2xs font-body"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-500">Quick actions...</span>
              </div>
              <kbd className="text-[10px] font-bold font-mono bg-white border border-zinc-200 px-1.5 py-0.5 rounded text-zinc-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Grouped Product Navigation */}
        <div className="space-y-4 pt-1">
          {navSections.map(section => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider font-heading">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (item.id === 'help' && activeTab === 'faq');
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ x: isActive ? 0 : 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer font-heading ${
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
                      <div className="flex items-center gap-2.5 relative z-10">
                        <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-white scale-105' : 'text-zinc-500 group-hover:scale-105'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 ? (
                        <span className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                          isActive ? 'bg-white text-zinc-950 shadow-xs' : 'bg-zinc-950 text-white'
                        }`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer AI Status Box */}
      <div className="pt-3 border-t border-zinc-100">
        <div className="bg-zinc-950 rounded-2xl p-3 text-white shadow-xs relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-zinc-100 font-heading">{GEMINI_CONFIG.activeStatusText}</span>
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed relative z-10 font-body">
            Grounded RAG active for fast, accurate chatbot responses.
          </p>
        </div>
      </div>
    </aside>
  );
};
