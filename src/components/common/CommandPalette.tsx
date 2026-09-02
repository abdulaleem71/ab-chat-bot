import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search,
  Bot,
  BookOpen,
  PlaySquare,
  Inbox,
  Code,
  CreditCard,
  Settings,
  Users,
  Plug,
  Sparkles,
  ArrowRight,
  Plus,
  HelpCircle,
  BarChart3,
  User,
  ShieldCheck,
  Zap,
  X
} from 'lucide-react';
import { Chatbot } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  chatbots: Chatbot[];
  onOpenCreateBot: () => void;
  onOpenEmbedModal: () => void;
  onSelectBotForTest: (bot: Chatbot) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  chatbots,
  onOpenCreateBot,
  onOpenEmbedModal,
  onSelectBotForTest,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global keyboard listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled externally or trigger
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Command items definitions
  const staticNavigation = [
    { id: 'overview', title: 'Dashboard Overview', category: 'Navigation', icon: BarChart3, tab: 'overview' },
    { id: 'chatbots', title: 'AI Chatbots', category: 'Navigation', icon: Bot, tab: 'chatbots' },
    { id: 'knowledge', title: 'Knowledge Base & RAG Documents', category: 'Navigation', icon: BookOpen, tab: 'knowledge' },
    { id: 'playground', title: 'Interactive Simulator Playground', category: 'Navigation', icon: PlaySquare, tab: 'playground' },
    { id: 'inbox', title: 'Inbox & Live Chat Support', category: 'Navigation', icon: Inbox, tab: 'inbox' },
    { id: 'embed', title: 'Widget & Embed Generator', category: 'Navigation', icon: Code, tab: 'embed' },
    { id: 'analytics', title: 'Analytics & CSAT Reports', category: 'Navigation', icon: BarChart3, tab: 'analytics' },
    { id: 'integrations', title: 'Integrations (Slack, WhatsApp, Zapier)', category: 'Navigation', icon: Plug, tab: 'integrations' },
    { id: 'team', title: 'Team Collaboration & Members', category: 'Navigation', icon: Users, tab: 'team' },
    { id: 'billing', title: 'Billing, Usage & Plans', category: 'Account', icon: CreditCard, tab: 'billing' },
    { id: 'account', title: 'My Account & Security Profile', category: 'Account', icon: User, tab: 'account' },
    { id: 'settings', title: 'Settings & Workspace Preferences', category: 'Account', icon: Settings, tab: 'settings' },
    { id: 'faq', title: 'Documentation & Help FAQs', category: 'Help', icon: HelpCircle, tab: 'faq' },
  ];

  const quickActions = [
    {
      id: 'action-create-bot',
      title: 'Create New AI Chatbot',
      category: 'Quick Actions',
      icon: Plus,
      action: () => {
        onClose();
        onOpenCreateBot();
      },
    },
    {
      id: 'action-add-knowledge',
      title: 'Add New Knowledge Source or Crawl URL',
      category: 'Quick Actions',
      icon: BookOpen,
      action: () => {
        onClose();
        onNavigate('knowledge');
      },
    },
    {
      id: 'action-embed',
      title: 'Get 1-Line Embed Script Tag',
      category: 'Quick Actions',
      icon: Code,
      action: () => {
        onClose();
        onOpenEmbedModal();
      },
    },
    {
      id: 'action-upgrade',
      title: 'Upgrade to Growth Pro Tier (3-Day Free Trial)',
      category: 'Quick Actions',
      icon: Zap,
      action: () => {
        onClose();
        onNavigate('billing');
      },
    },
  ];

  // Dynamically include chatbots
  const botItems = chatbots.map(bot => ({
    id: `bot-${bot.id}`,
    title: `Test "${bot.name}" in Playground`,
    category: 'My Chatbots',
    icon: Bot,
    action: () => {
      onClose();
      onSelectBotForTest(bot);
      onNavigate('playground');
    },
  }));

  // Combine and filter
  const allItems = [
    ...quickActions,
    ...botItems,
    ...staticNavigation.map(nav => ({
      id: nav.id,
      title: nav.title,
      category: nav.category,
      icon: nav.icon,
      action: () => {
        onClose();
        onNavigate(nav.tab);
      },
    })),
  ];

  const filteredItems = allItems.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9990] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl bg-white border border-zinc-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
              <Search className="w-5 h-5 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command, page, or search chatbot..."
                className="w-full bg-transparent text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none font-body"
              />
              <button
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-zinc-50">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 space-y-2">
                  <Search className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs font-medium font-body">No matching actions or pages found</p>
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={item.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`px-3.5 py-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition ${
                        isSelected
                          ? 'bg-zinc-950 text-white shadow-xs'
                          : 'text-zinc-700 hover:bg-zinc-100/80 hover:text-zinc-950'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold font-heading truncate">{item.title}</p>
                          <p
                            className={`text-[10px] font-mono uppercase tracking-wider ${
                              isSelected ? 'text-zinc-400' : 'text-zinc-400'
                            }`}
                          >
                            {item.category}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                          isSelected ? 'text-white translate-x-0.5' : 'text-zinc-300'
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer keyboard hints */}
            <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <div className="flex items-center gap-2">
                <span>Use <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-zinc-700 font-bold">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-zinc-700 font-bold">↓</kbd> to navigate</span>
                <span>•</span>
                <span><kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-zinc-700 font-bold">Enter</kbd> to select</span>
              </div>
              <div>
                <span><kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-zinc-700 font-bold">Esc</kbd> to close</span>
              </div>
            </div>
          </motion.div>
          <div className="fixed inset-0 -z-10" onClick={onClose} />
        </div>
      )}
    </AnimatePresence>
  );
};
