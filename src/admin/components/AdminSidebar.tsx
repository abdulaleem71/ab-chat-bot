import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Activity,
  Users,
  Bot,
  Globe,
  MessageSquare,
  BarChart3,
  Filter,
  UserCheck,
  AlertTriangle,
  FileText,
  Shield,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { NomadsLogo } from '../../components/common/NomadsLogo';
import { MotionButton } from '../../components/common/MotionButton';

export type AdminTab =
  | 'overview'
  | 'activity'
  | 'users'
  | 'chatbots'
  | 'websites'
  | 'conversations'
  | 'analytics'
  | 'funnel'
  | 'intelligence'
  | 'alerts'
  | 'audit';

interface AdminSidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onReturnToUserApp: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  onReturnToUserApp,
}) => {
  const { admin, logout } = useAdminAuth();

  const navigationGroups = [
    {
      group: 'Core Operations',
      items: [
        { id: 'overview', label: 'Command Center', icon: LayoutDashboard, badge: 'Live' },
        { id: 'activity', label: 'Live Activity Feed', icon: Activity },
      ],
    },
    {
      group: 'Entities & Management',
      items: [
        { id: 'users', label: 'User Directory', icon: Users },
        { id: 'chatbots', label: 'Chatbots', icon: Bot },
        { id: 'websites', label: 'Websites & Domains', icon: Globe },
        { id: 'conversations', label: 'Conversations & Logs', icon: MessageSquare },
      ],
    },
    {
      group: 'Analytics & Intelligence',
      items: [
        { id: 'analytics', label: 'Product Analytics', icon: BarChart3 },
        { id: 'funnel', label: 'Conversion Funnel', icon: Filter },
        { id: 'intelligence', label: 'User Intelligence', icon: UserCheck },
      ],
    },
    {
      group: 'Security & Governance',
      items: [
        { id: 'alerts', label: 'System Alerts', icon: AlertTriangle },
        { id: 'audit', label: 'Audit Logs', icon: FileText },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-zinc-200/90 flex flex-col h-screen shrink-0 select-none transition-all duration-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <NomadsLogo className="w-8 h-8 shrink-0" />
          <div>
            <div className="text-sm font-extrabold text-zinc-950 tracking-tight flex items-center gap-1.5 font-heading">
              <span>Nomads<span className="text-zinc-500 font-bold">Chat</span></span>
            </div>
            <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
              Control Center
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">Live</span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200">
        {navigationGroups.map((group) => (
          <div key={group.group}>
            <div className="px-3 text-[10px] font-extrabold font-mono tracking-wider text-zinc-400 uppercase mb-1.5">
              {group.group}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectTab(item.id as AdminTab)}
                    className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/80 font-medium'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeAdminSidebarPill"
                        className="absolute inset-0 bg-zinc-950 rounded-xl shadow-xs"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                      <span className="font-heading">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`relative z-10 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white text-zinc-950'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Admin User Footer Card */}
      <div className="p-3 border-t border-zinc-200/80 bg-zinc-50/60 space-y-2">
        <div className="p-2.5 rounded-xl bg-white border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {admin?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-zinc-900 truncate font-heading">{admin?.email}</div>
                <div className="text-[10px] text-zinc-500 font-mono capitalize">{admin?.role?.replace('_', ' ') || 'Super Admin'}</div>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
              title="Logout from Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        <MotionButton
          variant="secondary"
          size="sm"
          fullWidth
          onClick={onReturnToUserApp}
          leftIcon={<ExternalLink className="w-3.5 h-3.5 text-zinc-500" />}
        >
          Exit to Customer App
        </MotionButton>
      </div>
    </aside>
  );
};
