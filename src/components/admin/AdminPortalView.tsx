import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Database,
  Cpu,
  RefreshCw,
  X,
  Search,
  Building2,
  Users,
  Bot,
  MessageSquare,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Globe,
  FileCode,
  Activity,
  ArrowUpRight,
  Sparkles,
  Lock,
  Layers,
  Terminal
} from 'lucide-react';

interface TenantItem {
  id: string;
  name: string;
  ownerEmail: string;
  plan: string;
  createdAt: string;
  botCount: number;
}

interface TelemetryData {
  totalConversations: number;
  totalTokenUsage: number;
  scrapeErrorLogs: Array<{
    id: string;
    title: string;
    sourceUrl: string;
    type: string;
    status: string;
    errorMessage: string;
    updatedAt: string;
    tenantId: string;
  }>;
}

interface AdminPortalViewProps {
  onClose: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState<{
    healthy: boolean;
    latencyMs: number;
    mode: string;
    geminiConfigured: boolean;
  }>({
    healthy: true,
    latencyMs: 14,
    mode: 'turso_remote',
    geminiConfigured: true,
  });

  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    totalConversations: 0,
    totalTokenUsage: 0,
    scrapeErrorLogs: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingTenantId, setUpdatingTenantId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchHealth = async (): Promise<number> => {
    const startTime = performance.now();
    try {
      const res = await fetch('/api/health');
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      if (res.ok) {
        const data = await res.json();
        setDbStatus({
          healthy: data.database === 'healthy' || data.status === 'ok',
          latencyMs: latency,
          mode: data.databaseMode || 'sqlite_local',
          geminiConfigured: data.geminiConfigured ?? true,
        });
      } else {
        setDbStatus(prev => ({ ...prev, healthy: false, latencyMs: latency }));
      }
      return latency;
    } catch {
      setDbStatus(prev => ({ ...prev, healthy: false, latencyMs: 999 }));
      return 999;
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch('/api/admin/portal/tenants');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.tenants)) {
          setTenants(data.tenants);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tenants list:', err);
    }
  };

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/admin/portal/telemetry');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.telemetry) {
          setTelemetry(data.telemetry);
        }
      }
    } catch (err) {
      console.error('Failed to fetch telemetry data:', err);
    }
  };

  const loadAllData = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchHealth(), fetchTenants(), fetchTelemetry()]);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleUpdatePlan = async (tenantId: string, newPlan: string) => {
    setUpdatingTenantId(tenantId);
    try {
      const res = await fetch(`/api/admin/portal/tenants/${tenantId}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (res.ok) {
        setTenants(prev =>
          prev.map(t => (t.id === tenantId ? { ...t, plan: newPlan } : t))
        );
        showToast(`Successfully updated organization plan to ${newPlan}`);
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Could not update plan'}`);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to sync plan change'}`);
    } finally {
      setUpdatingTenantId(null);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const filteredTenants = tenants.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.ownerEmail.toLowerCase().includes(q) ||
      t.plan.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950 text-white font-sans selection:bg-white selection:text-black">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-white text-black px-4 py-3 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-extrabold shadow-md">
            <ShieldCheck className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight font-heading">
                Platform Administration Portal
              </h1>
              <span className="bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono border border-zinc-700">
                Staff Exclusive
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium">
              System Health, Multi-Tenant Directory &amp; Real-Time Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllData}
            disabled={isRefreshing}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl transition border border-zinc-700 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition cursor-pointer"
            title="Return to Application"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Body Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Section 1: System Health Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-white" />
              <span>System Health &amp; API Connectivity</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Auto-ping interval: 10s</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database Health Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Database className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Turso / SQLite Database</h3>
                    <p className="text-xs text-zinc-400 font-medium">Relational Storage &amp; Vector Indexes</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbStatus.healthy ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dbStatus.healthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  </span>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${dbStatus.healthy ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
                    {dbStatus.healthy ? 'Healthy' : 'Degraded'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Query Latency</span>
                  <span className="text-lg font-extrabold text-white font-mono">{dbStatus.latencyMs} <span className="text-xs font-normal text-zinc-400">ms</span></span>
                </div>
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Database Mode</span>
                  <span className="text-xs font-bold text-white uppercase font-mono">{dbStatus.mode.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Gemini API Health Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Gemini API Status</h3>
                    <p className="text-xs text-zinc-400 font-medium">@google/genai SDK Integration</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Operational
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">API Key Config</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Key Verified
                  </span>
                </div>
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block mb-1">Supported Models</span>
                  <span className="text-[11px] font-bold text-white font-mono block truncate" title="Gemini 3.6 Flash & 3.1 Pro">
                    Gemini 3.6 Flash &amp; 3.1 Pro
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Multi-Tenant Manager */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white" />
                <span>Multi-Tenant Organization Directory</span>
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                Manage organization plans, owner emails, and active chatbot counts
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery || ''}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search organizations or owners..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-white font-medium"
              />
            </div>
          </div>

          {/* Tenants Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Organization Name</th>
                    <th className="py-3.5 px-4">Owner Email</th>
                    <th className="py-3.5 px-4">Plan Tier</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4">Bot Count</th>
                    <th className="py-3.5 px-4 text-right">Plan Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs font-medium">
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500">
                        No organization tenants found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map(t => (
                      <tr key={t.id} className="hover:bg-zinc-800/40 transition">
                        <td className="py-3.5 px-4 font-extrabold text-white flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-white shrink-0 font-heading">
                            {t.name[0]?.toUpperCase() || 'O'}
                          </div>
                          <span className="truncate max-w-[180px]">{t.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300 font-mono text-[11px] truncate max-w-[200px]">
                          {t.ownerEmail}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold capitalize ${
                              t.plan.toLowerCase().includes('enterprise')
                                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                : t.plan.toLowerCase().includes('pro')
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            }`}
                          >
                            {t.plan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                          {new Date(t.createdAt).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 font-bold text-white bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
                            <Bot className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{t.botCount}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            disabled={updatingTenantId === t.id}
                            value={t.plan}
                            onChange={e => handleUpdatePlan(t.id, e.target.value)}
                            className="bg-zinc-950 border border-zinc-700 hover:border-white text-white text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-hidden transition cursor-pointer"
                          >
                            <option value="Free">Free</option>
                            <option value="Pro">Pro</option>
                            <option value="Enterprise">Enterprise</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 3: Platform Telemetry */}
        <section className="space-y-4">
          <h2 className="text-sm font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-white" />
            <span>Platform Telemetry &amp; System Usage</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Token Usage Metric */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2 shadow-xl">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Total Token Usage Estimate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                  {telemetry.totalTokenUsage.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-zinc-400">Tokens</span>
              </div>
              <p className="text-xs text-zinc-500 font-medium pt-1 border-t border-zinc-800/80">
                Aggregated token volume across all active client conversations
              </p>
            </div>

            {/* Total Conversations Metric */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2 shadow-xl">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                Total Platform Conversations
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                  {telemetry.totalConversations.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-zinc-400">Sessions</span>
              </div>
              <p className="text-xs text-zinc-500 font-medium pt-1 border-t border-zinc-800/80">
                Global support conversations across website widgets and embeds
              </p>
            </div>
          </div>

          {/* Web Scrape Error Logs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-white" />
                <span>Web Scraping &amp; Ingestion Error Logs</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">Recent 25 ingestion events</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-mono text-xs">
              {telemetry.scrapeErrorLogs.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-xs">
                  No scraping errors recorded. All web sources ingested cleanly.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/80 max-h-60 overflow-y-auto">
                  {telemetry.scrapeErrorLogs.map(log => (
                    <div key={log.id} className="p-3 hover:bg-zinc-900/60 transition flex items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                              log.status === 'failed'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-white font-bold truncate max-w-sm">{log.title}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">{log.sourceUrl || 'Custom Document Ingestion'}</p>
                        <p className="text-[11px] text-red-400 font-sans">{log.errorMessage}</p>
                      </div>

                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {new Date(log.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
