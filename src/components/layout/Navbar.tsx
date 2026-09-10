import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { NomadsLogo } from '../common/NomadsLogo';
import { MotionButton } from '../common/MotionButton';
import { Chatbot } from '../../types';
import { getModelDisplayName } from '../../config/models';
import {
  Bot,
  Sparkles,
  Building2,
  ChevronDown,
  ChevronRight,
  Code,
  LogIn,
  LogOut,
  UserPlus,
  CreditCard,
  ShieldCheck,
  Menu,
  Settings,
  Search,
  Plus,
  Check,
} from 'lucide-react';

const TAB_LABELS: Record<string, string> = {
  overview: 'Dashboard',
  chatbots: 'AI Chatbots',
  knowledge: 'Knowledge Base',
  playground: 'Interactive Playground',
  inbox: 'Inbox & Live Chat',
  embed: 'Widget & Embed',
  integrations: 'Integrations',
  analytics: 'Analytics & CSAT',
  team: 'Team Members',
  billing: 'Billing & Usage',
  account: 'My Account',
  settings: 'Tenant Settings',
  help: 'Help & Docs',
  faq: 'FAQ & Docs',
  status: 'System Status',
  security: 'Security & Compliance',
  features: 'Features',
  pricing: 'Pricing & Plans',
};

interface NavbarProps {
  onOpenWidgetModal: () => void;
  onOpenAuthModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleMobileMenu?: () => void;
  onOpenCommandPalette?: () => void;
  chatbots?: Chatbot[];
  activeBot?: Chatbot | null;
  onSelectBot?: (bot: Chatbot) => void;
  onCreateBot?: () => void;
  isLoadingBots?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenWidgetModal,
  onOpenAuthModal,
  activeTab,
  setActiveTab,
  onToggleMobileMenu,
  onOpenCommandPalette,
  chatbots = [],
  activeBot,
  onSelectBot,
  onCreateBot,
  isLoadingBots = false,
}) => {
  const { tenant, user, switchPlan, isAuthenticated, logout } = useAuth();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showBotDropdown, setShowBotDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [botSearchFilter, setBotSearchFilter] = useState('');

  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const botDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(orgDropdownRef, () => setShowOrgDropdown(false));
  useClickOutside(botDropdownRef, () => {
    setShowBotDropdown(false);
    setBotSearchFilter('');
  });
  useClickOutside(userDropdownRef, () => setShowUserDropdown(false));

  // Sync auth/session condition across sidebar and header
  const hasActiveSession = Boolean(isAuthenticated || (tenant && tenant.name && tenant.id));
  const orgName = tenant?.name || user?.displayName || 'Workspace';
  const orgPlan = tenant?.plan || 'Pro';

  const filteredBots = chatbots.filter(b =>
    b.name.toLowerCase().includes(botSearchFilter.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(botSearchFilter.toLowerCase()))
  );

  return (
    <header className="h-16 border-b border-zinc-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-5 lg:px-6 flex items-center justify-between shadow-xs transition-all duration-200">
      {/* Left: Hamburger, Brand & Unified Breadcrumb Navigation with Bot Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0">
        {/* Mobile Hamburger Button */}
        {hasActiveSession && onToggleMobileMenu && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleMobileMenu}
            className="p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-xl lg:hidden transition cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        )}

        {/* Brand Logo */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          onClick={() => setActiveTab(hasActiveSession ? 'overview' : 'features')}
        >
          <NomadsLogo className="w-8 h-8 sm:w-8.5 sm:h-8.5 shrink-0 transition-transform duration-300 group-hover:rotate-6" />
          <div className="hidden xs:block">
            <span className="font-extrabold text-black text-base sm:text-lg tracking-tight group-hover:text-zinc-700 transition-colors font-heading">
              Nomads<span className="text-zinc-500 font-bold">Chat</span>
            </span>
          </div>
        </motion.div>

        {/* Persistent Breadcrumb Navigation & Context Switchers (Authenticated Session) */}
        {hasActiveSession && (
          <>
            <div className="h-5 w-px bg-zinc-200/80 hidden sm:block shrink-0 mx-0.5" />

            <nav aria-label="Workspace Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
              {/* Breadcrumb Root: Workspace */}
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="hidden sm:inline-block text-zinc-500 hover:text-zinc-900 transition font-medium font-body shrink-0 cursor-pointer"
                title="Return to Workspace Overview"
              >
                Workspace
              </button>

              <ChevronRight className="w-3 h-3 text-zinc-300 shrink-0 hidden sm:inline-block" />

              {/* Breadcrumb Segment: Tenant Organization Dropdown */}
              <div className="relative shrink-0" ref={orgDropdownRef}>
                <motion.button
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-100/90 hover:bg-zinc-200/80 border border-zinc-200 text-black px-2 sm:px-2.5 py-1.5 rounded-xl transition duration-150 cursor-pointer shadow-2xs font-heading"
                  title={`Tenant Organization: ${orgName}`}
                >
                  <Building2 className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
                  <span className="max-w-[85px] sm:max-w-[110px] truncate">{orgName}</span>
                  <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform duration-200 ${showOrgDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showOrgDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-zinc-100">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-bold text-black font-heading truncate">{orgName}</p>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-950 text-white shrink-0">
                            {orgPlan}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate font-body">{tenant?.ownerEmail || user?.email}</p>
                      </div>

                      <div className="py-2">
                        <p className="px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1 font-heading">Switch SaaS Plan</p>
                        {(['Free', 'Pro', 'Ultra', 'Enterprise'] as const).map((plan) => (
                          <motion.button
                            key={plan}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              switchPlan(plan);
                              setShowOrgDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition cursor-pointer font-heading ${
                              tenant?.plan === plan ? 'bg-black text-white font-bold shadow-xs' : 'text-zinc-700 hover:bg-zinc-100 font-medium'
                            }`}
                          >
                            <span>{plan === 'Ultra' ? 'Enterprise Ultra' : `${plan} Tier`}</span>
                            {tenant?.plan === plan && <span className="w-2 h-2 rounded-full bg-white"></span>}
                          </motion.button>
                        ))}
                      </div>

                      <div className="pt-1 border-t border-zinc-100 space-y-0.5">
                        <motion.button
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setShowOrgDropdown(false);
                            setActiveTab('settings');
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 rounded-xl flex items-center gap-2 transition cursor-pointer font-heading"
                        >
                          <Settings className="w-3.5 h-3.5 text-black" />
                          <span>Tenant Settings</span>
                        </motion.button>
                        <motion.button
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setShowOrgDropdown(false);
                            setActiveTab('billing');
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs font-bold text-black hover:bg-zinc-100 rounded-xl flex items-center gap-2 transition cursor-pointer font-heading"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-black" />
                          <span>Billing &amp; Plans</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <ChevronRight className="w-3 h-3 text-zinc-300 shrink-0 hidden sm:inline-block" />

              {/* Breadcrumb Segment & Global Persistent Bot Switcher */}
              <div className="relative shrink-0" ref={botDropdownRef}>
                <motion.button
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowBotDropdown(!showBotDropdown)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition cursor-pointer font-heading ${
                    activeBot
                      ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-900'
                      : 'bg-indigo-50/80 hover:bg-indigo-100/80 border-indigo-200 text-indigo-900'
                  }`}
                  title={activeBot ? `Active Bot: ${activeBot.name} (${activeBot.status})` : 'Select or create a chatbot'}
                >
                  {activeBot ? (
                    <>
                      <span className="text-sm shrink-0 leading-none">{activeBot.avatar || '🤖'}</span>
                      <span className="max-w-[75px] sm:max-w-[120px] md:max-w-[140px] truncate font-bold text-zinc-900 font-heading">
                        {activeBot.name}
                      </span>
                      {activeBot.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 leading-none shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 leading-none shrink-0">
                          Draft
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-bold text-indigo-900">Choose Bot</span>
                    </>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 shrink-0 ${showBotDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                {/* Bot Switcher Dropdown Menu */}
                <AnimatePresence>
                  {showBotDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 font-heading">
                          AI Chatbots ({chatbots.length})
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">Switch Context</span>
                      </div>

                      {/* Quick filter if more than 3 chatbots */}
                      {chatbots.length > 3 && (
                        <div className="p-1.5 border-b border-zinc-100">
                          <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 pointer-events-none" />
                            <input
                              type="text"
                              value={botSearchFilter}
                              onChange={(e) => setBotSearchFilter(e.target.value)}
                              placeholder="Filter bots..."
                              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-black font-body text-zinc-900 placeholder:text-zinc-400"
                            />
                          </div>
                        </div>
                      )}

                      {/* Chatbots List */}
                      <div className="max-h-60 overflow-y-auto py-1 divide-y divide-zinc-50">
                        {filteredBots.length === 0 ? (
                          <div className="p-4 text-center text-xs text-zinc-500 font-body">
                            {chatbots.length === 0 ? 'No chatbots created yet' : 'No bots match your search'}
                          </div>
                        ) : (
                          filteredBots.map((bot) => {
                            const isSelected = activeBot?.id === bot.id;
                            return (
                              <motion.button
                                key={bot.id}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  if (onSelectBot) onSelectBot(bot);
                                  setShowBotDropdown(false);
                                  setBotSearchFilter('');
                                }}
                                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-2.5 transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-zinc-100/90 text-zinc-950 font-bold'
                                    : 'text-zinc-700 hover:bg-zinc-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-lg shrink-0 leading-none">{bot.avatar || '🤖'}</span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-zinc-900 font-heading truncate">{bot.name}</p>
                                    <p className="text-[10px] text-zinc-400 font-medium truncate font-body">
                                      {bot.tone || 'Friendly'} • {getModelDisplayName(bot.model)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {bot.status === 'active' ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 leading-none">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 leading-none">
                                      Draft
                                    </span>
                                  )}
                                  {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                                </div>
                              </motion.button>
                            );
                          })
                        )}
                      </div>

                      {/* Quick "Create New Bot" action in dropdown */}
                      <div className="pt-1.5 mt-1 border-t border-zinc-100">
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setShowBotDropdown(false);
                            setBotSearchFilter('');
                            if (onCreateBot) onCreateBot();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 p-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 rounded-xl transition cursor-pointer font-heading"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create New Bot</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Breadcrumb Leaf: Current Active Tab Title */}
              <ChevronRight className="w-3 h-3 text-zinc-300 shrink-0 hidden md:inline-block" />
              <span className="hidden md:inline-block font-bold text-zinc-950 font-heading text-xs truncate max-w-[140px] lg:max-w-[180px]">
                {TAB_LABELS[activeTab] || activeTab}
              </span>
            </nav>
          </>
        )}
      </div>

      {/* Right: Search, Plan Tier Badge, Settings Shortcut & Account Menu */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Search / Command Palette button for logged in user */}
        {hasActiveSession && onOpenCommandPalette && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCommandPalette}
            className="hidden lg:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-zinc-100/90 hover:bg-zinc-200/80 border border-zinc-200/80 rounded-xl text-xs text-zinc-500 hover:text-zinc-900 transition cursor-pointer shadow-2xs font-body"
            title="Search or jump to command (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium">Quick search...</span>
            <kbd className="text-[10px] font-mono bg-white border border-zinc-300 px-1.5 py-0.5 rounded-md text-zinc-600 font-bold shadow-2xs">
              ⌘K
            </kbd>
          </motion.button>
        )}

        {/* Current Plan Tier Badge with click to manage subscription */}
        {hasActiveSession && (
          <motion.button
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('billing')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold font-heading border transition cursor-pointer shadow-2xs ${
              orgPlan === 'Free'
                ? 'bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200'
                : orgPlan === 'Pro'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : 'bg-zinc-950 text-white border-zinc-900 hover:bg-black'
            }`}
            title={`Current Plan: ${orgPlan} • Click to manage subscription & limits`}
          >
            <Sparkles className={`w-3.5 h-3.5 shrink-0 ${orgPlan === 'Free' ? 'text-zinc-500' : orgPlan === 'Pro' ? 'text-indigo-600' : 'text-amber-400'}`} />
            <span>{orgPlan} Plan</span>
          </motion.button>
        )}

        {/* Tenant Settings Shortcut Button */}
        {hasActiveSession && (
          <motion.button
            whileHover={{ y: -1, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('settings')}
            className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition cursor-pointer border border-zinc-200/80 shadow-2xs"
            title="Tenant & Workspace Settings"
            aria-label="Tenant Settings"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        )}

        {/* Marketing shell links (only appear on logged-out pages) */}
        {!hasActiveSession && (
          <>
            <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-zinc-600 mr-2">
              {['features', 'pricing', 'faq'].map((tab) => (
                <motion.button
                  key={tab}
                  whileHover={{ y: -1.5, scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl transition-all duration-150 capitalize cursor-pointer font-heading ${
                    activeTab === tab
                      ? 'text-black bg-zinc-100 font-bold border border-black/10 shadow-2xs'
                      : 'hover:bg-zinc-100 hover:text-black font-medium'
                  }`}
                >
                  {tab}
                </motion.button>
              ))}
            </div>

            {/* Get Embed Code button on marketing page */}
            <MotionButton
              variant="primary"
              size="sm"
              shimmer
              leftIcon={<Code className="w-3.5 h-3.5 text-white" />}
              onClick={onOpenWidgetModal}
              className="shrink-0 hidden xs:flex"
            >
              Get Embed Code
            </MotionButton>
          </>
        )}

        {/* Auth / Account Profile Dropdown */}
        <div className={`relative ${hasActiveSession ? 'pl-1' : 'pl-2 border-l border-zinc-200'}`} ref={userDropdownRef}>
          {hasActiveSession ? (
            <div>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 hover:bg-zinc-100 p-1.5 rounded-xl transition duration-150 border border-transparent hover:border-zinc-200 cursor-pointer"
                title={`${orgName} (${orgPlan})`}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={orgName}
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    className="w-8 h-8 rounded-full ring-2 ring-black/10 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-extrabold text-xs flex items-center justify-center ring-2 ring-black/10 shrink-0 select-none font-heading shadow-xs">
                    {orgName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold text-black leading-tight font-heading truncate max-w-[110px]">{orgName}</p>
                  <p className="text-[10px] text-zinc-500 font-medium capitalize font-body truncate max-w-[110px]">
                    {user?.displayName ? `${user.displayName}` : `${orgPlan} Tier`}
                  </p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-60 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50"
                  >
                    {/* Organization / Account Info */}
                    <div className="px-3 py-2 border-b border-zinc-100">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-xs font-bold text-black font-heading truncate">{orgName}</p>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-zinc-950 text-white shrink-0 leading-none">
                          {orgPlan}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate font-body">
                        {tenant?.ownerEmail || user?.email || 'Active session'}
                      </p>
                    </div>

                    <div className="py-1">
                      {/* Tenant Settings Option */}
                      <motion.button
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('settings');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl flex items-center gap-2 transition cursor-pointer font-heading"
                      >
                        <Settings className="w-3.5 h-3.5 text-black" />
                        <span>Tenant Settings</span>
                      </motion.button>

                      {/* Manage Subscription / Billing */}
                      <motion.button
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('billing');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl flex items-center gap-2 transition cursor-pointer font-heading"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-black" />
                        <span>Billing &amp; Plans ({orgPlan})</span>
                      </motion.button>

                      {/* Embed Code generator */}
                      <motion.button
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('embed');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl flex items-center gap-2 transition cursor-pointer font-heading"
                      >
                        <Code className="w-3.5 h-3.5 text-black" />
                        <span>Widget &amp; Embed Snippets</span>
                      </motion.button>

                      {/* Switch Account */}
                      <motion.button
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAuthModal();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl flex items-center gap-2 transition cursor-pointer font-heading"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-black" />
                        <span>Switch Account / Sign In</span>
                      </motion.button>

                      <div className="my-1 border-t border-zinc-100" />

                      {/* Logout */}
                      <motion.button
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition cursor-pointer font-heading"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Logout</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <MotionButton
              variant="glow"
              size="sm"
              shimmer
              leftIcon={<LogIn className="w-4 h-4 text-white" />}
              onClick={onOpenAuthModal}
            >
              Sign In / Register
            </MotionButton>
          )}
        </div>
      </div>
    </header>
  );
};

