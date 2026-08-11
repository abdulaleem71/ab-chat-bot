import React from 'react';
import { LayoutDashboard, Bot, BookOpen, MessageSquare, Inbox, Code, BarChart3, Sparkles, CreditCard, HelpCircle, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, unreadCount = 2 }) => {
  const mainNavItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'chatbots', label: 'AI Chatbots', icon: Bot },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'playground', label: 'Live Test Playground', icon: MessageSquare },
    { id: 'inbox', label: 'Inbox & Live Chat', icon: Inbox, badge: unreadCount },
    { id: 'embed', label: 'Widget & Embed Code', icon: Code },
    { id: 'analytics', label: 'Analytics & CSAT', icon: BarChart3 },
  ];

  const productNavItems = [
    { id: 'features', label: 'Features & Capabilities', icon: Sparkles },
    { id: 'pricing', label: 'Pricing & Plans', icon: CreditCard },
    { id: 'faq', label: 'FAQ & Help Hub', icon: HelpCircle },
  ];

  return (
    <aside className="w-64 border-r border-zinc-200/80 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 transition-all duration-200">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-2">Main Menu</p>
          <div className="space-y-1">
            {mainNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-98 ${
                    isActive
                      ? 'bg-black text-white shadow-md'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-black font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                      isActive ? 'bg-white text-black' : 'bg-black text-white'
                    }`}>
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-2">SaaS & Pricing</p>
          <div className="space-y-1">
            {productNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-98 ${
                    isActive
                      ? 'bg-black text-white shadow-md'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-black font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="pt-4 border-t border-zinc-100">
        <div className="bg-black rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-800/40 rounded-full blur-xl group-hover:scale-125 transition-transform duration-300" />
          <div className="flex items-center gap-2 mb-1.5 relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-zinc-200">Gemini 3.6 Active</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed relative z-10">
            Server-side RAG grounding enabled for instant chatbot replies.
          </p>
        </div>
      </div>
    </aside>
  );
};
