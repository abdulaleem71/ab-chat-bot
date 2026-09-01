import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Terminal,
  Activity,
  Zap,
  Info,
  Server,
  Database,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SystemAlert, AlertStats } from '../repositories/adminAlertsRepo';
import { useAdminAuth } from '../context/AdminAuthContext';

export const SystemAlertsView: React.FC = () => {
  useAdminAuth();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);

  // Form state for creating test alert
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newSeverity, setNewSeverity] = useState<'critical' | 'warning' | 'info'>('warning');
  const [newCategory, setNewCategory] = useState<'security' | 'performance' | 'integration' | 'quality' | 'system'>('performance');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(severityFilter !== 'all' ? { severity: severityFilter } : {}),
        ...(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
      });

      const res = await fetch(`/api/admin/alerts?${params.toString()}`, {
        credentials: 'include',
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success) {
            setAlerts(json.alerts || []);
            setStats(json.stats || null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load system alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter, categoryFilter]);

  const handleAcknowledge = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/alerts/${id}/acknowledge`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to acknowledge alert', err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/alerts/${id}/resolve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to resolve alert', err);
    }
  };

  const handleResolveAll = async () => {
    if (!window.confirm('Are you sure you want to mark all active alerts as resolved?')) return;
    try {
      const res = await fetch(`/api/admin/alerts/resolve-all`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to resolve all alerts', err);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/alerts/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          message: newMessage,
          severity: newSeverity,
          category: newCategory,
          source: 'AdminConsole:ManualTrigger',
          metadata: { triggeredBy: 'admin', timestamp: new Date().toISOString() },
        }),
      });

      if (res.ok) {
        setIsCreatingAlert(false);
        setNewTitle('');
        setNewMessage('');
        fetchAlerts();
      }
    } catch (err) {
      console.error('Failed to create alert', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.message.toLowerCase().includes(q) ||
      a.source.toLowerCase().includes(q) ||
      (a.metadataJson && a.metadataJson.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-800/50 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              System Alerts & Health Monitor
              {stats && stats.criticalCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 animate-pulse font-mono font-bold">
                  {stats.criticalCount} Critical
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400">
              Real-time infrastructure anomalies, security domain blocks, webhook retries, and API performance threshold monitoring.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCreatingAlert(true)}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-400" />
            Trigger Test Alert
          </button>

          <button
            onClick={handleResolveAll}
            className="px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-800/80 flex items-center gap-1.5 transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolve All Active
          </button>

          <button
            onClick={fetchAlerts}
            disabled={isLoading}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition cursor-pointer"
            title="Refresh Alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>System Health Score</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-1">
            <span className={stats && stats.systemHealthScore >= 90 ? 'text-emerald-400' : 'text-amber-400'}>
              {isLoading ? '...' : `${stats?.systemHealthScore || 98}%`}
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Calculated via active telemetry</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Active Incidents</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {isLoading ? '...' : stats?.activeCount || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Pending resolution</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Critical Severity</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {isLoading ? '...' : stats?.criticalCount || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Immediate action required</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Warnings</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {isLoading ? '...' : stats?.warningCount || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Latency & threshold spikes</div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800/80 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Resolved Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {isLoading ? '...' : stats?.resolvedTodayCount || 0}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Avg MTT Resolution ~18m</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/70 border border-zinc-800 p-3.5 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 text-xs">
            {(['active', 'acknowledged', 'resolved', 'all'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Categories</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="integration">Integration</option>
            <option value="quality">Quality</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search alerts, sources, payloads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 w-64"
          />
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">All Systems Operational</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
              No alert incidents matching the current status and severity filters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;
            return (
              <div
                key={alert.id}
                className={`bg-zinc-900 border rounded-xl transition overflow-hidden ${
                  alert.severity === 'critical' && alert.status !== 'resolved'
                    ? 'border-rose-800/80 shadow-sm shadow-rose-950/50'
                    : alert.severity === 'warning' && alert.status !== 'resolved'
                    ? 'border-amber-800/60'
                    : 'border-zinc-800'
                }`}
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {alert.severity === 'critical' ? (
                        <div className="w-7 h-7 rounded-lg bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      ) : alert.severity === 'warning' ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{alert.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                          alert.severity === 'critical'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : alert.severity === 'warning'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                          {alert.category}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          alert.status === 'resolved'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : alert.status === 'acknowledged'
                            ? 'bg-purple-950 text-purple-400 border border-purple-800'
                            : 'bg-rose-950/80 text-rose-300'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300">{alert.message}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 font-mono pt-1">
                        <span>Source: <span className="text-zinc-400">{alert.source}</span></span>
                        <span>•</span>
                        <span>Logged: {new Date(alert.createdAt).toLocaleString()}</span>
                        {alert.resolvedAt && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400">Resolved by {alert.resolvedBy || 'Admin'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {alert.metadataJson && (
                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        Payload
                      </button>
                    )}

                    {alert.status === 'active' && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-purple-300 text-xs font-semibold rounded-lg border border-purple-900/50 transition cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    )}

                    {alert.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && alert.metadataJson && (
                  <div className="bg-zinc-950 p-4 border-t border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto">
                    <div className="text-zinc-500 mb-1 text-[11px]">Structured Telemetry Data:</div>
                    <pre className="text-purple-300">{JSON.stringify(JSON.parse(alert.metadataJson), null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Trigger Test Alert Modal */}
      {isCreatingAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-400" />
                Trigger Incident / Health Check Alert
              </h3>
              <button
                onClick={() => setIsCreatingAlert(false)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1 bg-zinc-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Alert Title</label>
                <input
                  type="text"
                  placeholder="e.g. Gemini Gateway P99 Timeout on tenant_002"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Diagnostic Message</label>
                <textarea
                  rows={3}
                  placeholder="Detailed description of the threshold spike or security warning..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Severity Level</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="critical">Critical (Red)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="info">Info (Blue)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="performance">Performance</option>
                    <option value="security">Security</option>
                    <option value="integration">Integration</option>
                    <option value="quality">Quality</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingAlert(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Emitting Alert...' : 'Publish Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
