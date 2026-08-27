import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Bot, BookOpen, PlaySquare, Inbox, Code, BarChart3, Sparkles, CreditCard, HelpCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GEMINI_CONFIG } from '../../config/models';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, unreadCount = 1 }) => {
  const { tenant, isAuthenticated } = useAuth();
  const hasActiveSession = Boolean(isAuthenticated || (tenant && tenant.name && tenant.id));
  const workspaceName = hasActiveSession && tenant?.name ? tenant.name : 'Nomads Workspace';
  const workspacePlan = tenant?.plan || 'Free';

  const productNavItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chatbots', label: 'AI Chatbots', icon: Bot },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'playground', label: 'Live Test Playground', icon: PlaySquare },
    { id: 'inbox', label: 'Inbox & Live Chat', icon: Inbox, badge: unreadCount },
    { id: 'embed', label: 'Widget & Embed Code', icon: Code },
    { id: 'analytics', label: 'Analytics & CSAT', icon: BarChart3 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200/90 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 transition-all duration-200">
      <div className="space-y-5">
        {/* Workspace Selector Pill */}
        <div className="px-1">
          <div
            onClick={() => setActiveTab('billing')}
            className="flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-200/90 bg-zinc-50/80 hover:bg-zinc-100/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-zinc-900 text-white text-[10px] font-bold flex items-center justify-center font-heading">
                {workspaceName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-zinc-900 truncate max-w-[90px] font-heading">{workspaceName}</span>
              {hasActiveSession && (
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-950 text-white leading-none">
                  {workspacePlan}
                </span>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </div>
        </div>

        {/* Product Navigation */}
        <div>
          <p className="px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-2 font-heading">Product Surfaces</p>
          <div className="space-y-1">
            {productNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'help' && activeTab === 'faq');
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: isActive ? 0 : 3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer font-heading ${
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
                  <div className="flex items-center gap-3 relative z-10">
                    <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-white scale-110' : 'text-zinc-500 group-hover:scale-110'}`} />
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
      </div>

      {/* Footer Info Box */}
      <div className="pt-4 border-t border-zinc-100">
        <div className="bg-zinc-950 rounded-2xl p-3.5 text-white shadow-xs relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-1.5 relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-zinc-100">{GEMINI_CONFIG.activeStatusText}</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed relative z-10">
            Server-side RAG grounding enabled for instant chatbot replies.
          </p>
        </div>
      </div>
    </aside>
  );
};

