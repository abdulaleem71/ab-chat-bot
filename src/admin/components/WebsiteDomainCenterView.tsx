import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminDomainItem } from '../repositories/adminDomainRepo';
import { DomainDetailModal } from './DomainDetailModal';
import {
  Globe,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  Unlock,
  Bot,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ExternalLink,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Server,
  Zap,
  Check,
  Ban,
  X,
} from 'lucide-react';
import { MotionButton } from '../../components/common/MotionButton';

export const WebsiteDomainCenterView: React.FC = () => {
  const { adminToken } = useAdminAuth();
  const [domains, setDomains] = useState<AdminDomainItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sslFilter, setSslFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const limit = 15;

  // Selected domain for deep inspector modal
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Register domain dialog state
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);
  const [newDomainName, setNewDomainName] = useState<string>('');
  const [newDomainNotes, setNewDomainNotes] = useState<string>('');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Fast diagnostic state per domain
  const [runningDiagDomain, setRunningDiagDomain] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    if (!adminToken) return;
    try {
      setIsLoading(true);
      setError(null);

      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        sortBy: 'last_checked_at',
        sortOrder: 'DESC',
      });

      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (statusFilter !== 'all') params.set('verificationStatus', statusFilter);
      if (sslFilter !== 'all') params.set('sslStatus', sslFilter);

      const res = await fetch(`/api/admin/domains?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch domains (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success) {
        setDomains(json.domains || []);
        setTotal(json.total || 0);
      } else {
        throw new Error(json.error || 'Failed to parse domains directory');
      }
    } catch (err: any) {
      console.error('[Admin] Failed to fetch domains:', err);
      setError(err.message || 'Error communicating with administration backend');
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, page, searchTerm, statusFilter, sslFilter]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleFastDiagnostic = async (domain: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!adminToken || runningDiagDomain) return;
    try {
      setRunningDiagDomain(domain);
      const res = await fetch('/api/admin/domains/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ domain }),
      });

      const json = await res.json();
      if (json.success) {
        fetchDomains();
      }
    } catch (err: any) {
      console.error('[Admin] Fast diagnostic failed:', err);
    } finally {
      setRunningDiagDomain(null);
    }
  };

  const handleRegisterDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !newDomainName.trim() || isRegistering) return;
    try {
      setIsRegistering(true);
      setRegisterError(null);

      const res = await fetch('/api/admin/domains/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          domain: newDomainName.trim(),
          notes: newDomainNotes.trim(),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsRegisterOpen(false);
        setNewDomainName('');
        setNewDomainNotes('');
        fetchDomains();
      } else {
        throw new Error(json.error || 'Failed to register domain');
      }
    } catch (err: any) {
      setRegisterError(err.message || 'Failed to register domain');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleToggleBlock = async (domain: string, currentBlocked: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!adminToken) return;
    const isBlocked = !currentBlocked;
    const confirmMsg = isBlocked
      ? `Are you sure you want to BLOCK '${domain}'? Chatbots will cease rendering on this origin.`
      : `Unblock '${domain}'?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/domains/${encodeURIComponent(domain)}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isBlocked }),
      });
      const json = await res.json();
      if (json.success) {
        fetchDomains();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  // KPI Calculations
  const verifiedCount = domains.filter((d) => d.verificationStatus === 'verified' || d.verificationStatus === 'whitelisted').length;
  const sslValidCount = domains.filter((d) => d.sslStatus === 'valid').length;
  const blockedCount = domains.filter((d) => d.isBlocked).length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Stat KPI Summary Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Monitored Domains</span>
            <div className="text-xl font-extrabold text-zinc-950 font-heading mt-0.5">{total}</div>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Verified Origins</span>
            <div className="text-xl font-extrabold text-emerald-600 font-heading mt-0.5">{verifiedCount}</div>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold font-mono text-zinc-500 uppercase tracking-wider">SSL Enforced</span>
            <div className="text-xl font-extrabold text-zinc-950 font-heading mt-0.5">
              {domains.length > 0 ? `${Math.round((sslValidCount / domains.length) * 100)}%` : '100%'}
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
            <ShieldX className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold font-mono text-zinc-500 uppercase tracking-wider">Blocked Domains</span>
            <div className="text-xl font-extrabold text-rose-600 font-heading mt-0.5">{blockedCount}</div>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-2xs"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search domains, workspace, owner, or notes..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:bg-white font-mono transition"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-hidden focus:border-zinc-900 cursor-pointer font-mono"
          >
            <option value="all">All Verification Statuses</option>
            <option value="verified">Verified</option>
            <option value="whitelisted">Global Whitelisted</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* SSL Filter */}
          <select
            value={sslFilter}
            onChange={(e) => {
              setSslFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:outline-hidden focus:border-zinc-900 cursor-pointer font-mono"
          >
            <option value="all">All SSL States</option>
            <option value="valid">SSL Valid (HTTPS)</option>
            <option value="expired">Expired / Insecure</option>
          </select>

          <MotionButton
            variant="secondary"
            size="sm"
            onClick={fetchDomains}
            title="Refresh domains directory"
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-zinc-500' : ''}`} />}
          >
            Refresh
          </MotionButton>

          <MotionButton
            variant="primary"
            size="sm"
            shimmer
            onClick={() => setIsRegisterOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Register Domain
          </MotionButton>
        </div>
      </motion.div>

      {/* Main Domains Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xs"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-zinc-50/80 text-zinc-500 font-mono uppercase text-[10px] border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-4">Domain & Protocol</th>
                <th className="py-3.5 px-4">Primary Workspace</th>
                <th className="py-3.5 px-4">Attached Chatbots</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Latency & Health</th>
                <th className="py-3.5 px-4">Last Checked</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-sans">
              {isLoading && domains.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500 font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-900" />
                    <span>Analyzing domains & SSL certificates...</span>
                  </td>
                </tr>
              ) : domains.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-500 font-mono">
                    <Globe className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
                    <span>No customer domains found matching current criteria.</span>
                  </td>
                </tr>
              ) : (
                domains.map((dom) => (
                  <tr
                    key={dom.id}
                    onClick={() => setSelectedDomain(dom.domain)}
                    className="hover:bg-zinc-50/80 transition cursor-pointer group"
                  >
                    {/* Domain & Protocol */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 shrink-0">
                          {dom.sslStatus === 'valid' ? (
                            <Lock className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Unlock className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-zinc-950 font-mono group-hover:text-black transition flex items-center gap-1.5 font-heading">
                            <span>{dom.domain}</span>
                            <a
                              href={`https://${dom.domain}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-zinc-400 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {dom.verificationToken.substring(0, 18)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Workspace & Owner */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 font-heading">{dom.tenantName}</div>
                      <div className="text-zinc-500 text-[11px] font-mono">{dom.ownerEmail || 'System'}</div>
                    </td>

                    {/* Attached Chatbots */}
                    <td className="py-3.5 px-4">
                      {dom.associatedChatbots.length === 0 ? (
                        <span className="text-zinc-400 font-mono text-[11px]">0 bots deployed</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-2 overflow-hidden">
                            {dom.associatedChatbots.slice(0, 3).map((b) => (
                              <div
                                key={b.id}
                                className="inline-block h-6 w-6 rounded-full ring-2 ring-white flex items-center justify-center text-xs shadow-xs"
                                style={{ backgroundColor: b.primaryColor || '#18181b', color: '#fff' }}
                                title={`${b.name} (${b.status})`}
                              >
                                {b.avatar}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs font-semibold text-zinc-800 font-heading">
                            {dom.associatedChatbots.length} {dom.associatedChatbots.length === 1 ? 'bot' : 'bots'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Verification Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                          dom.verificationStatus === 'verified' || dom.verificationStatus === 'whitelisted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : dom.verificationStatus === 'blocked'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {dom.verificationStatus === 'verified' && <ShieldCheck className="w-3 h-3" />}
                        {dom.verificationStatus === 'whitelisted' && <Shield className="w-3 h-3" />}
                        {dom.verificationStatus === 'blocked' && <ShieldX className="w-3 h-3" />}
                        {dom.verificationStatus === 'pending' && <AlertTriangle className="w-3 h-3" />}
                        {dom.verificationStatus}
                      </span>
                    </td>

                    {/* Latency & Response */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-mono text-[11px] font-bold">
                          {dom.httpStatus} OK
                        </span>
                        <span className="text-zinc-400 font-mono text-[11px]">
                          • {dom.responseTimeMs}ms
                        </span>
                      </div>
                    </td>

                    {/* Last Checked */}
                    <td className="py-3.5 px-4 text-zinc-500 text-[11px] font-mono">
                      {new Date(dom.lastCheckedAt).toLocaleTimeString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={(e) => handleFastDiagnostic(dom.domain, e)}
                          disabled={runningDiagDomain === dom.domain}
                          title="Run Live Health Diagnostic"
                          className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950 border border-zinc-200 rounded-lg transition cursor-pointer"
                        >
                          <Activity className={`w-4 h-4 ${runningDiagDomain === dom.domain ? 'animate-spin text-zinc-950' : ''}`} />
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={(e) => handleToggleBlock(dom.domain, dom.isBlocked, e)}
                          title={dom.isBlocked ? 'Unblock domain' : 'Block domain from embedding'}
                          className={`p-1.5 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition cursor-pointer ${
                            dom.isBlocked ? 'text-rose-600 hover:text-emerald-600' : 'text-zinc-500 hover:text-rose-600'
                          }`}
                        >
                          {dom.isBlocked ? <ShieldX className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </motion.button>

                        <MotionButton
                          variant="secondary"
                          size="xs"
                          onClick={() => setSelectedDomain(dom.domain)}
                          leftIcon={<Eye className="w-3 h-3" />}
                        >
                          Inspect
                        </MotionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <div className="text-xs text-zinc-500 font-body">
            Showing <strong className="text-zinc-900">{domains.length}</strong> of <strong className="text-zinc-900">{total}</strong> domains
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="p-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 rounded-lg transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <span className="text-xs font-mono text-zinc-600 px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="p-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 rounded-lg transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Register Custom Domain Dialog */}
      <AnimatePresence>
        {isRegisterOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-zinc-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2 font-heading">
                  <Globe className="w-4 h-4 text-zinc-950" />
                  Register New Customer Domain
                </h3>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsRegisterOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {registerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                  {registerError}
                </div>
              )}

              <form onSubmit={handleRegisterDomain} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1 font-heading">Domain Hostname</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. app.customerbrand.com"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono focus:outline-hidden focus:border-zinc-900 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1 font-heading">Administrative Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Optional registration notes, enterprise account info..."
                    value={newDomainNotes}
                    onChange={(e) => setNewDomainNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-900 focus:bg-white transition font-body"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <MotionButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsRegisterOpen(false)}
                  >
                    Cancel
                  </MotionButton>
                  <MotionButton
                    type="submit"
                    variant="primary"
                    size="sm"
                    shimmer
                    disabled={isRegistering || !newDomainName.trim()}
                  >
                    {isRegistering ? 'Registering...' : 'Register Domain'}
                  </MotionButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deep Domain Inspector Modal */}
      {selectedDomain && (
        <DomainDetailModal
          domain={selectedDomain}
          onClose={() => setSelectedDomain(null)}
          onRefreshList={fetchDomains}
        />
      )}
    </div>
  );
};
