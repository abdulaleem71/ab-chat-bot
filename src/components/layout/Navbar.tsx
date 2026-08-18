import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { NomadsLogo } from '../common/NomadsLogo';
import { Bot, Sparkles, Building2, ChevronDown, Bell, Code, LogIn, LogOut, UserPlus, CreditCard, ShieldCheck, Menu } from 'lucide-react';

interface NavbarProps {
  onOpenWidgetModal: () => void;
  onOpenAuthModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenWidgetModal, onOpenAuthModal, activeTab, setActiveTab, onToggleMobileMenu }) => {
  const { tenant, user, switchPlan, isAuthenticated, logout } = useAuth();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const orgDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(orgDropdownRef, () => setShowOrgDropdown(false));
  useClickOutside(userDropdownRef, () => setShowUserDropdown(false));

  return (
    <header className="h-16 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between shadow-xs transition-all duration-200">
      {/* Left: Mobile Toggle, Brand & Organization Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
        {/* Mobile Hamburger Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-xl lg:hidden transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setActiveTab('overview')}
        >
          <NomadsLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
          <div>
            <span className="font-extrabold text-black text-base sm:text-lg tracking-tight group-hover:text-zinc-700 transition-colors">
              Nomads<span className="text-zinc-500 font-bold">Chat</span>
            </span>
            <p className="hidden md:block text-[11px] text-zinc-500 font-medium">NomadsArc AI Platform</p>
          </div>
        </div>

        {/* Tenant Organization Switcher */}
        <div className="relative hidden sm:block" ref={orgDropdownRef}>
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 text-black px-2.5 sm:px-3 py-1.5 rounded-xl transition duration-150 active:scale-95"
          >
            <Building2 className="w-3.5 h-3.5 text-black shrink-0" />
            <span className="max-w-[90px] sm:max-w-[120px] truncate">{tenant.name}</span>
            <span className="bg-black text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
              {tenant.plan}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${showOrgDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showOrgDropdown && (
            <div className="absolute top-full left-0 mt-2 w-60 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-zinc-100">
                <p className="text-xs font-bold text-black">{tenant.name}</p>
                <p className="text-[11px] text-zinc-500 truncate">{tenant.ownerEmail}</p>
              </div>
              <div className="py-2">
                <p className="px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1">Switch SaaS Plan</p>
                {(['Free', 'Pro', 'Enterprise'] as const).map(plan => (
                  <button
                    key={plan}
                    onClick={() => {
                      switchPlan(plan);
                      setShowOrgDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition ${
                      tenant.plan === plan ? 'bg-black text-white font-bold shadow-xs' : 'text-zinc-700 hover:bg-zinc-100 font-medium'
                    }`}
                  >
                    <span>{plan} Tier</span>
                    {tenant.plan === plan && <span className="w-2 h-2 rounded-full bg-white"></span>}
                  </button>
                ))}
              </div>
              <div className="pt-1 border-t border-zinc-100">
                <button
                  onClick={() => {
                    setShowOrgDropdown(false);
                    setActiveTab('pricing');
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-black hover:bg-zinc-100 rounded-xl flex items-center gap-2 transition"
                >
                  <CreditCard className="w-3.5 h-3.5 text-black" />
                  <span>View All Pricing Plans</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Embed Code & Auth / User Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Navigation links in header */}
        <div className="hidden lg:flex items-center gap-1 text-xs font-semibold text-zinc-600 mr-2">
          <button
            onClick={() => setActiveTab('features')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-150 ${
              activeTab === 'features' ? 'text-black bg-zinc-100 font-bold border border-black/10' : 'hover:bg-zinc-100 hover:text-black'
            }`}
          >
            Features
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-150 ${
              activeTab === 'pricing' ? 'text-black bg-zinc-100 font-bold border border-black/10' : 'hover:bg-zinc-100 hover:text-black'
            }`}
          >
            Pricing
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-1.5 rounded-xl transition-all duration-150 ${
              activeTab === 'faq' ? 'text-black bg-zinc-100 font-bold border border-black/10' : 'hover:bg-zinc-100 hover:text-black'
            }`}
          >
            FAQ
          </button>
        </div>

        {/* Live Embed Code Button */}
        <button
          onClick={onOpenWidgetModal}
          className="flex items-center gap-1.5 text-xs font-bold bg-black hover:bg-zinc-800 text-white px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 shrink-0"
        >
          <Code className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Get Embed Code</span>
        </button>

        {/* Auth / User Profile Dropdown */}
        <div className="relative pl-2 border-l border-zinc-200" ref={userDropdownRef}>
          {isAuthenticated ? (
            <div>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 hover:bg-zinc-100 p-1.5 rounded-xl transition duration-150 border border-transparent hover:border-zinc-200 active:scale-95"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    className="w-8 h-8 rounded-full ring-2 ring-black/10 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-900 text-white font-extrabold text-xs flex items-center justify-center ring-2 ring-black/10 shrink-0 select-none">
                    {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-black leading-tight">{user.displayName}</p>
                  <p className="text-[10px] text-zinc-500 font-medium capitalize">{user.role}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showUserDropdown && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <p className="text-xs font-bold text-black">{user.displayName}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAuthModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl flex items-center gap-2 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-black" />
                      <span>Switch Account / Sign Up</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                        onOpenAuthModal();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 text-xs font-bold bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-xl transition shadow-md active:scale-95"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
