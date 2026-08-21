import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Radio, CheckCircle2, ShieldCheck, Clock, Zap } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastUpdated?: string;
  autoRefreshInterval: number;
  onSetAutoRefreshInterval: (interval: number) => void;
  queryLatencyMs?: number;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  isRefreshing,
  onRefresh,
  lastUpdated,
  autoRefreshInterval,
  onSetAutoRefreshInterval,
  queryLatencyMs,
}) => {
  const { admin } = useAdminAuth();

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-all duration-200">
      <div>
        <h1 className="text-base sm:text-lg font-extrabold text-zinc-950 tracking-tight flex items-center gap-2 font-heading">
          <span>{title}</span>
        </h1>
        {subtitle && <p className="text-xs text-zinc-500 font-body">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Real-time Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] bg-zinc-100 border border-zinc-200 px-2.5 py-1.5 rounded-xl font-mono text-zinc-700 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold">Live SQLite Engine</span>
          {typeof queryLatencyMs === 'number' && (
            <span className="text-emerald-700 font-bold border-l border-zinc-300 pl-2">
              {queryLatencyMs}ms
            </span>
          )}
        </div>

        {/* Auto Refresh Selector */}
        <div className="flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200/60 border border-zinc-200 p-1 rounded-xl text-xs transition">
          <Clock className="w-3.5 h-3.5 text-zinc-500 ml-1.5" />
          <select
            value={autoRefreshInterval}
            onChange={(e) => onSetAutoRefreshInterval(Number(e.target.value))}
            className="bg-transparent text-zinc-800 text-xs font-mono font-medium border-0 focus:outline-hidden pr-2 cursor-pointer"
          >
            <option value={0} className="bg-white text-zinc-900">Manual</option>
            <option value={10} className="bg-white text-zinc-900">Every 10s</option>
            <option value={30} className="bg-white text-zinc-900">Every 30s</option>
            <option value={60} className="bg-white text-zinc-900">Every 1m</option>
          </select>
        </div>

        {/* Manual Refresh Button */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50 font-heading shadow-xs"
          title="Force refresh database aggregations"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-zinc-400' : 'text-zinc-300'}`} />
          <span className="hidden md:inline">{isRefreshing ? 'Querying...' : 'Refresh'}</span>
        </motion.button>
      </div>
    </header>
  );
};
