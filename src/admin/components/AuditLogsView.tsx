import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Download,
  RefreshCw,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  Globe,
  Terminal,
  Calendar,
} from 'lucide-react';
import { AdminAuditLog } from '../types';
import { AuditDetailModal } from './AuditDetailModal';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AuditLogsView: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 30;

  const getEffectiveToken = () => {
    return adminToken || localStorage.getItem('nomads_admin_token') || localStorage.getItem('nomadschat_admin_token') || '';
  };

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const token = getEffectiveToken();
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
        ...(selectedAction !== 'all' ? { action: selectedAction } : {}),
        ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
      });

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await res.json();
          if (json.success) {
            setLogs(json.logs || []);
            setTotal(json.total || 0);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, selectedAction, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchAuditLogs();
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('nomads_admin_token') || 'local-admin-token';
      const params = new URLSearchParams({
        format,
        ...(selectedAction !== 'all' ? { action: selectedAction } : {}),
        ...(selectedStatus !== 'all' ? { status: selectedStatus } : {}),
      });

      const res = await fetch(`/api/admin/audit-logs/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (format === 'csv') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const json = await res.json();
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              System Audit Logs & Security Trail
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
                {total} Records
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Immutable ledger of administrative interventions, domain approvals, configuration updates, and security events.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={fetchAuditLogs}
            disabled={isLoading}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition cursor-pointer"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/70 border border-zinc-800 p-3.5 rounded-xl">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search action, actor email, target resource, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setPage(0);
            }}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Actions</option>
            <option value="ADMIN_AUTHENTICATION_SUCCESS">ADMIN_AUTHENTICATION_SUCCESS</option>
            <option value="DOMAIN_WHITELIST_ADD">DOMAIN_WHITELIST_ADD</option>
            <option value="DOMAIN_STATUS_UPDATE">DOMAIN_STATUS_UPDATE</option>
            <option value="BOT_CONFIG_UPDATE">BOT_CONFIG_UPDATE</option>
            <option value="BOT_KEY_REGENERATE">BOT_KEY_REGENERATE</option>
            <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
            <option value="SYSTEM_ALERT_RESOLVE">SYSTEM_ALERT_RESOLVE</option>
            <option value="UNAUTHORIZED_ACCESS_BLOCK">UNAUTHORIZED_ACCESS_BLOCK</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(0);
            }}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="blocked">Blocked</option>
            <option value="failure">Failure</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Origin IP</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No audit records found matching the active filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-indigo-400 font-medium">
                      {log.adminEmail}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.targetResource ? (
                        <div className="font-mono text-zinc-200">
                          <span className="text-zinc-500">{log.targetResource}:</span> {log.targetId || 'all'}
                        </div>
                      ) : (
                        <span className="text-zinc-500 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        log.status === 'success'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : log.status === 'blocked'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs flex items-center gap-1 ml-auto transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-zinc-400" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <div>
              Showing page <span className="font-bold text-white">{page + 1}</span> of{' '}
              <span className="font-bold text-white">{totalPages}</span> ({total} records)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-lg transition cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-white rounded-lg transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedLog && (
        <AuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
};
