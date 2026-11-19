import React, { useState, useRef } from 'react';
import {
  Code,
  Menu,
  X,
  ChevronRight,
  Search,
  Plus,
  User,
  Settings,
  CreditCard,
  LogOut,
  Sparkles,
  Tag,
  Globe,
  Play,
} from 'lucide-react';
import { Chatbot } from '../../types';
import { BotSwitcher } from './BotSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { NomadsLogo } from '../common/NomadsLogo';

export interface HeaderProps {
  chatbots: Chatbot[];
  selectedBot: Chatbot | null;
  onSelectBot: (bot: Chatbot) => void;
  onCreateBot: () => void;
  onOpenEmbedModal: () => void;
  onOpenAuthModal: () => void;
  onOpenSignupModal?: () => void;
  onStartDemo?: () => void;
  isStartingDemo?: boolean;
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  onToggleMobileMenu: () => void;
  onOpenCommandPalette?: () => void;
}

const PUBLIC_NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
  { id: 'security', label: 'Security' },
  { id: 'status', label: 'Status' },
];

export const Header: React.FC<HeaderProps> = ({
  chatbots,
  selectedBot,
  onSelectBot,
  onCreateBot,
  onOpenEmbedModal,
  onOpenAuthModal,
  onOpenSignupModal,
  onStartDemo,
  isStartingDemo = false,
  activeTab,
  setActiveTab,
  onToggleMobileMenu,
  onOpenCommandPalette,
}) => {
  const { tenant, user, logout, isAuthenticated, isDemoMode } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobilePublicMenuOpen, setMobilePublicMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(userMenuRef, () => setShowUserMenu(false));

  // Public Top Bar for unauthenticated visitors
  if (!isAuthenticated) {
    return (
      <header
        id="public-sticky-topbar"
        className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md select-none"
      >
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Brand Lockup */}
          <button
            type="button"
            onClick={() => {
              setMobilePublicMenuOpen(false);
              setActiveTab?.('landing');
            }}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
          >
            <NomadsLogo
              showText
              className="w-7 h-7 shrink-0 transition-transform duration-200 group-hover:scale-105"
              textClassName="text-base font-extrabold text-zinc-950 tracking-tight font-heading"
            />
          </button>

          {/* Center: Single-line Public Navigation Links */}
          <nav aria-label="Public Navigation" className="hidden md:flex items-center gap-6">
            {PUBLIC_NAV_LINKS.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => setActiveTab?.(link.id)}
                  className={`text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer py-1 ${
                    isActive
                      ? 'text-zinc-950 border-b-2 border-zinc-950'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Action Buttons & Mobile Menu Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            {onStartDemo && (
              <button
                type="button"
                onClick={onStartDemo}
                disabled={isStartingDemo}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer disabled:opacity-60"
              >
                <Play className="w-3 h-3 text-zinc-700" />
                <span>{isStartingDemo ? 'Loading Demo...' : 'Try Live Demo'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenAuthModal}
              className="hidden sm:inline-flex items-center px-3 py-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 text-xs font-semibold whitespace-nowrap shrink-0 transition cursor-pointer"
            >
              Sign In
            </button>

            <button
              type="button"
              onClick={onOpenSignupModal || onOpenAuthModal}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold whitespace-nowrap shrink-0 shadow-xs transition cursor-pointer"
            >
              Start Free Trial
            </button>

            <button
              type="button"
              id="public-mobile-menu-btn"
              onClick={() => setMobilePublicMenuOpen(prev => !prev)}
              className="md:hidden p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobilePublicMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Public Navigation Drawer */}
        {mobilePublicMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-2 shadow-lg">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setMobilePublicMenuOpen(false);
                  setActiveTab?.('landing');
                }}
                className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'landing' ? 'bg-zinc-950 text-white' : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                Home
              </button>
              {PUBLIC_NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    setMobilePublicMenuOpen(false);
                    setActiveTab?.(link.id);
                  }}
                  className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === link.id ? 'bg-zinc-950 text-white' : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 flex flex-wrap gap-2">
              {onStartDemo && (
                <button
                  type="button"
                  onClick={() => {
                    setMobilePublicMenuOpen(false);
                    onStartDemo();
                  }}
                  disabled={isStartingDemo}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-300 bg-white text-zinc-900 text-xs font-bold text-center cursor-pointer"
                >
                  Try Live Demo
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobilePublicMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-100 text-zinc-900 text-xs font-bold text-center cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }

  // Authenticated Workspace Top Bar
  const orgName = tenant?.name || user?.displayName || 'Workspace';
  const botName = selectedBot?.name || 'No Bot Selected';

  return (
    <header
      id="global-sticky-topbar"
      className="sticky top-0 z-30 h-14 border-b border-zinc-200 bg-white/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between shadow-xs select-none transition-all duration-150"
    >
      {/* Left: Mobile Toggle, Brand Icon & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          id="topbar-mobile-menu-btn"
          onClick={onToggleMobileMenu}
          className="p-1.5 text-zinc-600 hover:text-zinc-950 lg:hidden rounded-lg hover:bg-zinc-100 transition cursor-pointer shrink-0"
          aria-label="Toggle workspace navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab?.('overview')}
          className="flex items-center gap-2 cursor-pointer shrink-0 group"
          title="NomadsChat Workspace"
        >
          <NomadsLogo className="w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-105" />
        </button>

        <div className="h-4 w-px bg-zinc-200 shrink-0 hidden sm:block mx-0.5" />

        <nav aria-label="Global Workspace Breadcrumbs" className="flex items-center gap-1.5 text-xs min-w-0">
          <button
            type="button"
            id="breadcrumb-workspace"
            onClick={() => setActiveTab?.('overview')}
            className="text-zinc-500 hover:text-zinc-900 transition font-medium hover:underline shrink-0 cursor-pointer hidden sm:inline-block"
          >
            Workspace
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0 hidden sm:inline-block" />

          <button
            type="button"
            id="breadcrumb-tenant"
            onClick={() => setActiveTab?.('settings')}
            className="text-zinc-600 hover:text-zinc-900 transition font-semibold hover:underline shrink-0 max-w-[90px] sm:max-w-[130px] truncate cursor-pointer"
            title={`Tenant Organization: ${orgName}`}
          >
            {orgName}
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />

          <span
            id="breadcrumb-active-bot"
            className="font-bold text-zinc-900 truncate max-w-[90px] sm:max-w-[150px] md:max-w-[200px]"
            title={`Active Chatbot: ${botName}`}
          >
            {botName}
          </span>
        </nav>
      </div>

      {/* Right: Sandbox CTA, Bot Switcher, Quick Actions & User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {isDemoMode && (
          <button
            type="button"
            onClick={onOpenSignupModal || onOpenAuthModal}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer"
            title="You are exploring the interactive demo workspace. Create your own free account anytime."
          >
            <span>Sandbox Demo</span>
            <span className="underline">Create Account</span>
          </button>
        )}

        <BotSwitcher
          chatbots={chatbots}
          selectedBot={selectedBot}
          onSelectBot={onSelectBot}
          onCreateNewBot={onCreateBot}
        />

        {onOpenCommandPalette && (
          <button
            type="button"
            id="topbar-search-btn"
            onClick={onOpenCommandPalette}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100/80 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-500 hover:text-zinc-900 transition cursor-pointer shadow-2xs"
            title="Open Command Palette (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium">Search...</span>
            <kbd className="text-[10px] font-mono bg-white border border-zinc-200 px-1 py-0.2 rounded text-zinc-500 font-bold">
              ⌘K
            </kbd>
          </button>
        )}

        {selectedBot && (
          <button
            type="button"
            id="topbar-embed-btn"
            onClick={onOpenEmbedModal}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
            title="View & copy widget embed code"
          >
            <Code className="w-3.5 h-3.5 text-zinc-500" />
            <span>Embed</span>
          </button>
        )}

        <button
          type="button"
          id="topbar-quick-create-bot-btn"
          onClick={onCreateBot}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer whitespace-nowrap"
          title="Create a new chatbot assistant"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">New Bot</span>
        </button>

        {/* User / Account Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            id="topbar-user-menu-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="p-1.5 rounded-xl border border-zinc-200/80 bg-white hover:bg-zinc-100 text-zinc-700 transition cursor-pointer shadow-2xs flex items-center gap-1"
            aria-label="User Account Menu"
          >
            <div className="w-5 h-5 rounded-md bg-zinc-900 text-white flex items-center justify-center text-[10px] font-bold uppercase">
              {user?.email ? user.email.charAt(0) : 'U'}
            </div>
          </button>

          {showUserMenu && (
            <div
              id="topbar-user-dropdown"
              className="absolute right-0 mt-1.5 w-60 rounded-xl border border-zinc-200 bg-white shadow-lg p-1.5 z-50 text-xs"
            >
              <div className="px-3 py-2 border-b border-zinc-100">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {user?.displayName || orgName}
                </p>
                <p className="text-[11px] text-zinc-500 truncate">
                  {user?.email || tenant?.ownerEmail}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>{tenant?.plan || 'Pro'} Plan</span>
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setActiveTab?.('account');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 flex items-center gap-2 transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-zinc-500" />
                  <span>My Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setActiveTab?.('settings');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 flex items-center gap-2 transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Workspace Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setActiveTab?.('billing');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 flex items-center gap-2 transition cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Billing &amp; Subscription</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setActiveTab?.('pricing');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 flex items-center gap-2 transition cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Plans &amp; Pricing</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setActiveTab?.('features');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 flex items-center gap-2 transition cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Features &amp; Capabilities</span>
                </button>
              </div>

              <div className="border-t border-zinc-100 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
