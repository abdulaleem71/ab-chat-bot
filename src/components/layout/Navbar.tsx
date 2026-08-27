import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { NomadsLogo } from '../common/NomadsLogo';
import { MotionButton } from '../common/MotionButton';
import { Bot, Sparkles, Building2, ChevronDown, Bell, Code, LogIn, LogOut, UserPlus, CreditCard, ShieldCheck, Menu, Settings } from 'lucide-react';

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

  // Sync auth/session condition across sidebar and header
  const hasActiveSession = Boolean(isAuthenticated || (tenant && tenant.name && tenant.id));
  const orgName = tenant?.name || user?.displayName || 'Workspace';
  const orgPlan = tenant?.plan || 'Pro';

  return (
    <header className="h-16 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between shadow-xs transition-all duration-200">
      {/* Left: Mobile Toggle, Brand & Organization Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
        {/* Mobile Hamburger Button (for in-app sidebar navigation) */}
        {hasActiveSession && onToggleMobileMenu && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleMobileMenu}
            className="p-2 text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-xl lg:hidden transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </motion.button>
        )}

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setActiveTab(hasActiveSession ? 'overview' : 'features')}
        >
          <NomadsLogo className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 transition-transform duration-300 group-hover:rotate-6" />
          <div>
            <span className="font-extrabold text-black text-base sm:text-lg tracking-tight group-hover:text-zinc-700 transition-colors font-heading">
              Nomads<span className="text-zinc-500 font-bold">Chat</span>
            </span>
            <p className="hidden md:block text-[11px] text-zinc-500 font-medium font-body">NomadsArc AI Platform</p>
          </div>
        </motion.div>

        {/* Tenant Organization Switcher (In-App Only) */}
        {hasActiveSession && tenant?.name && (
          <div className="relative hidden sm:block" ref={orgDropdownRef}>
            <motion.button
              whileHover={{ y: -1, scale: 1.01 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center gap-2 text-xs font-semibold bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 text-black px-2.5 sm:px-3 py-1.5 rounded-xl transition duration-150 cursor-pointer shadow-2xs font-heading"
            >
              <Building2 className="w-3.5 h-3.5 text-black shrink-0" />
              <span className="max-w-[90px] sm:max-w-[120px] truncate">{tenant.name}</span>
              <span className="bg-black text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                {orgPlan}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${showOrgDropdown ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {showOrgDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-60 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50"
                >
                  <div className="px-3 py-2 border-b border-zinc-100">
                    <p className="text-xs font-bold text-black font-heading">{tenant.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate font-body">{tenant.ownerEmail}</p>
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
                          tenant.plan === plan ? 'bg-black text-white font-bold shadow-xs' : 'text-zinc-700 hover:bg-zinc-100 font-medium'
                        }`}
                      >
                        <span>{plan === 'Ultra' ? 'Enterprise Ultra' : `${plan} Tier`}</span>
                        {tenant.plan === plan && <span className="w-2 h-2 rounded-full bg-white"></span>}
                      </motion.button>
                    ))}
                  </div>
                  <div className="pt-1 border-t border-zinc-100 space-y-0.5">
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
                      <span>Billing &amp; Usage Dashboard</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Right: Marketing Links (logged-out only) & Auth / Account Menu */}
      <div className="flex items-center gap-3">
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
        <div className={`relative ${hasActiveSession ? 'pl-2' : 'pl-2 border-l border-zinc-200'}`} ref={userDropdownRef}>
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
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-black leading-tight font-heading truncate max-w-[130px]">{orgName}</p>
                  <p className="text-[10px] text-zinc-500 font-medium capitalize font-body truncate max-w-[130px]">
                    {user?.displayName ? `${user.displayName} • ${orgPlan}` : `${orgPlan} Tier`}
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
                      {/* Settings Option */}
                      <motion.button
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowUserDropdown(false);
                          setActiveTab('embed');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 rounded-xl flex items-center gap-2 transition cursor-pointer font-heading"
                      >
                        <Settings className="w-3.5 h-3.5 text-black" />
                        <span>Settings &amp; Configuration</span>
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

