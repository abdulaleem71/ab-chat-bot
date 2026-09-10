import React, { useState, useRef } from 'react';
import {
  Code,
  Menu,
  ChevronRight,
  Search,
  Plus,
  User,
  Settings,
  CreditCard,
  LogOut,
  Building2,
  Sparkles,
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
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  onToggleMobileMenu: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  chatbots,
  selectedBot,
  onSelectBot,
  onCreateBot,
  onOpenEmbedModal,
  onOpenAuthModal,
  activeTab,
  setActiveTab,
  onToggleMobileMenu,
  onOpenCommandPalette,
}) => {
  const { tenant, user, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(userMenuRef, () => setShowUserMenu(false));

  const orgName = tenant?.name || user?.displayName || 'Acme Inc';
  const botName = selectedBot?.name || 'Support Bot';

  return (
    <header
      id="global-sticky-topbar"
      className="sticky top-0 z-30 h-14 border-b border-zinc-200/90 bg-white/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between shadow-2xs select-none transition-all duration-150"
    >
      {/* Left: Mobile Toggle, Brand Icon & Breadcrumbs (Workspace > Acme Inc > Support Bot) */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          id="topbar-mobile-menu-btn"
          onClick={onToggleMobileMenu}
          className="p-1.5 text-zinc-600 hover:text-zinc-950 lg:hidden rounded-lg hover:bg-zinc-100 transition cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Icon */}
        <div
          onClick={() => setActiveTab?.('overview')}
          className="flex items-center gap-2 cursor-pointer shrink-0 group"
          title="NomadsChat Workspace"
        >
          <NomadsLogo className="w-6 h-6 shrink-0 transition-transform duration-200 group-hover:scale-105" />
        </div>

        <div className="h-4 w-px bg-zinc-200 shrink-0 hidden sm:block mx-0.5" />

        {/* Breadcrumbs: Workspace > Acme Inc > Support Bot */}
        <nav
          aria-label="Global Workspace Breadcrumbs"
          className="flex items-center gap-1.5 text-xs min-w-0"
        >
          {/* Workspace Root */}
          <button
            type="button"
            id="breadcrumb-workspace"
            onClick={() => setActiveTab?.('overview')}
            className="text-zinc-500 hover:text-zinc-900 transition font-medium hover:underline shrink-0 cursor-pointer hidden sm:inline-block"
          >
            Workspace
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0 hidden sm:inline-block" />

          {/* Tenant Org */}
          <button
            type="button"
            id="breadcrumb-tenant"
            onClick={() => setActiveTab?.('settings')}
            className="text-zinc-600 hover:text-zinc-900 transition font-semibold hover:underline shrink-0 max-w-[90px] sm:max-w-[120px] truncate cursor-pointer"
            title={`Tenant Organization: ${orgName}`}
          >
            {orgName}
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />

          {/* Active Bot Name Leaf */}
          <span
            id="breadcrumb-active-bot"
            className="font-bold text-zinc-900 truncate max-w-[90px] sm:max-w-[150px] md:max-w-[200px]"
            title={`Active Chatbot: ${botName}`}
          >
            {botName}
          </span>
        </nav>
      </div>

      {/* Right: Active Bot Switcher, Quick Actions & User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Active Bot Switcher with Avatar, Name, Status Pill, Dropdown & "+ New Bot" CTA */}
        <BotSwitcher
          chatbots={chatbots}
          selectedBot={selectedBot}
          onSelectBot={onSelectBot}
          onCreateNewBot={onCreateBot}
        />

        {/* Quick Action: Search / Command Palette (⌘K) */}
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

        {/* Quick Action: Embed Code Modal */}
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

        {/* Quick Action: Direct + New Bot CTA on desktop */}
        <button
          type="button"
          id="topbar-quick-create-bot-btn"
          onClick={onCreateBot}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
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
              className="absolute right-0 mt-1.5 w-60 rounded-2xl border border-zinc-200 bg-white shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-2 border-b border-zinc-100">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {user?.displayName || orgName}
                </p>
                <p className="text-[11px] text-zinc-500 truncate">
                  {user?.email || tenant?.ownerEmail || 'tenant@nomadschat.com'}
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
                  <span>Billing & Subscription</span>
                </button>
              </div>

              <div className="border-t border-zinc-100 pt-1">
                {isAuthenticated ? (
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
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-zinc-900 hover:bg-zinc-100 flex items-center gap-2 transition cursor-pointer font-semibold"
                  >
                    <User className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
