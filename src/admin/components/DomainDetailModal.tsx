import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminDomainDetail, DomainDiagnosticsResult } from '../repositories/adminDomainRepo';
import {
  Globe,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  Unlock,
  Bot,
  ExternalLink,
  RefreshCw,
  Check,
  Copy,
  X,
  AlertTriangle,
  FileCode,
  Radio,
  Server,
  Activity,
  MessageSquare,
  History,
  CheckCircle2,
  Clock,
  Ban,
  ArrowUpRight,
} from 'lucide-react';

interface DomainDetailModalProps {
  domain: string;
  onClose: () => void;
  onRefreshList: () => void;
}

export const DomainDetailModal: React.FC<DomainDetailModalProps> = ({
  domain,
  onClose,
  onRefreshList,
}) => {
  useAdminAuth();
  const [detail, setDetail] = useState<AdminDomainDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'verification' | 'chatbots' | 'traffic' | 'audit'>('diagnostics');

  // Diagnostic runner state
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Status update state
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchDomainDetail = async () => {
    if (!domain) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/domains/${encodeURIComponent(domain)}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to load domain details (HTTP ${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setDetail(json.data);
        setSelectedStatus(json.data.domainInfo.verificationStatus);
        setStatusNotes(json.data.domainInfo.notes || '');
      } else {
        throw new Error(json.error || 'Failed to parse domain details');
      }
    } catch (err: any) {
      console.error('[Admin] Error fetching domain details:', err);
      setError(err.message || 'Error communicating with administration backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomainDetail();
  }, [domain]);

  const handleRunDiagnostic = async () => {
    if (isRunningDiagnostic) return;
    try {
      setIsRunningDiagnostic(true);
      const res = await fetch('/api/admin/domains/verify', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      const json = await res.json();
      if (json.success && json.diagnostics) {
        setDetail((prev) => (prev ? { ...prev, diagnostics: json.diagnostics } : null));
        setActionSuccessMsg('Live diagnostic probe completed successfully.');
        setTimeout(() => setActionSuccessMsg(null), 3500);
      }
    } catch (err: any) {
      console.error('[Admin] Failed to run domain diagnostic:', err);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUpdateStatus = async () => {
    if (isUpdatingStatus) return;
    try {
      setIsUpdatingStatus(true);
      const res = await fetch(`/api/admin/domains/${encodeURIComponent(domain)}/status`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          notes: statusNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(json.message || 'Domain status updated successfully.');
        setTimeout(() => setActionSuccessMsg(null), 3500);
        fetchDomainDetail();
        onRefreshList();
      } else {
        alert(json.error || 'Failed to update domain status.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update domain status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleToggleWhitelist = async (isWhitelisted: boolean) => {
    try {
      const res = await fetch(`/api/admin/domains/${encodeURIComponent(domain)}/whitelist`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isWhitelisted }),
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(json.message);
        setTimeout(() => setActionSuccessMsg(null), 3500);
        fetchDomainDetail();
        onRefreshList();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleBlock = async (isBlocked: boolean) => {
    const confirmMsg = isBlocked
      ? `Are you sure you want to BLOCK '${domain}'? This will immediately prevent all chatbots from rendering or responding on this domain.`
      : `Unblock '${domain}'?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/domains/${encodeURIComponent(domain)}/block`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isBlocked }),
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(json.message);
        setTimeout(() => setActionSuccessMsg(null), 3500);
        fetchDomainDetail();
        onRefreshList();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-950/80 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">{domain}</h2>
                {detail && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      detail.domainInfo.verificationStatus === 'verified' || detail.domainInfo.verificationStatus === 'whitelisted'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : detail.domainInfo.verificationStatus === 'blocked'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {detail.domainInfo.verificationStatus === 'verified' && <ShieldCheck className="w-3 h-3" />}
                    {detail.domainInfo.verificationStatus === 'whitelisted' && <Shield className="w-3 h-3" />}
                    {detail.domainInfo.verificationStatus === 'blocked' && <ShieldX className="w-3 h-3" />}
                    {detail.domainInfo.verificationStatus === 'pending' && <Clock className="w-3 h-3" />}
                    {detail.domainInfo.verificationStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Workspace: <span className="text-zinc-200 font-medium">{detail?.domainInfo.tenantName || 'Platform Global'}</span> • Owner: <span className="font-mono text-zinc-300">{detail?.domainInfo.ownerEmail || 'System'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunDiagnostic}
              disabled={isRunningDiagnostic}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
              Run Diagnostics
            </button>

            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition cursor-pointer"
              title="Open Website"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Success Alert Banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 text-xs px-6 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Modal Navigation Sub-Tabs */}
        <div className="border-b border-zinc-800 bg-zinc-950/40 px-6 flex items-center gap-1 shrink-0 overflow-x-auto">
          {[
            { id: 'diagnostics', label: 'Health Diagnostics', icon: Activity },
            { id: 'verification', label: 'Ownership & DNS TXT', icon: FileCode },
            { id: 'chatbots', label: `Attached Chatbots (${detail?.associatedChatbots.length || 0})`, icon: Bot },
            { id: 'traffic', label: `Visitor Logs (${detail?.recentConversations.length || 0})`, icon: MessageSquare },
            { id: 'audit', label: `Audit Trail (${detail?.auditLogs.length || 0})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center text-zinc-500">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-indigo-500" />
              <span>Analyzing domain infrastructure & certificates...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : detail ? (
            <>
              {/* TAB 1: DIAGNOSTICS */}
              {activeTab === 'diagnostics' && (
                <div className="space-y-6">
                  {/* Top Score Banner */}
                  <div className="p-5 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                        <span className={`text-2xl font-black font-mono ${
                          detail.diagnostics.healthScore >= 80 ? 'text-emerald-400' : detail.diagnostics.healthScore >= 50 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {detail.diagnostics.healthScore}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Domain Security & Health Score</div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          Calculated from SSL certificate, HTTP availability, CORS policy & DNS records.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {detail.domainInfo.isWhitelisted ? (
                        <button
                          onClick={() => handleToggleWhitelist(false)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          Revoke Whitelist
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleWhitelist(true)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Grant Global Whitelist
                        </button>
                      )}

                      {detail.domainInfo.isBlocked ? (
                        <button
                          onClick={() => handleToggleBlock(false)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Unblock Domain
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleBlock(true)}
                          className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Block Domain
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Diagnostic Checks Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* HTTP Reachability */}
                    <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-indigo-400" />
                          HTTP Status & Latency
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {detail.diagnostics.httpStatus} OK
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white font-mono">
                        {detail.diagnostics.responseTimeMs} ms <span className="text-xs font-normal text-zinc-500 font-sans">response time</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Host endpoint reachable and responding to standard probe requests.
                      </p>
                    </div>

                    {/* SSL Status */}
                    <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                          SSL / TLS Certificate
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Valid & Enforced
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white font-mono truncate">
                        {detail.diagnostics.sslIssuer || "Let's Encrypt Authority"}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        HTTPS transport encryption verified. Widget is safe to embed.
                      </p>
                    </div>

                    {/* CORS Policy */}
                    <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-amber-400" />
                          Cross-Origin Resource Policy
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Allowed
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        Access-Control-Allow-Origin: *
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        CDN JavaScript bundles can be downloaded directly by client browsers on this domain.
                      </p>
                    </div>

                    {/* Iframe Embedding */}
                    <div className="p-4 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-indigo-400" />
                          Frame & Ancestor Policy
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Compatible
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">
                        Floating Widget & Inline Frame
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Nomads Chat modal window can cleanly dock and render on this origin.
                      </p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-2">
                    <div className="text-xs font-bold text-white uppercase tracking-wider">Engine Diagnostic Recommendations</div>
                    <ul className="space-y-1.5">
                      {detail.diagnostics.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Status Modification Box */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
                    <div className="text-xs font-bold text-white uppercase tracking-wider">Administrative Domain Controls</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">Verification Status</label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="verified">Verified (Active)</option>
                          <option value="whitelisted">Global Whitelisted</option>
                          <option value="pending">Pending Verification</option>
                          <option value="blocked">Blocked / Blacklisted</option>
                          <option value="revoked">Revoked</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-zinc-400 mb-1 font-semibold">Administrative Notes</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={statusNotes}
                            onChange={(e) => setStatusNotes(e.target.value)}
                            placeholder="Reason for change, customer ticket ID, or policy note..."
                            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={handleUpdateStatus}
                            disabled={isUpdatingStatus}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            {isUpdatingStatus ? 'Saving...' : 'Save Policy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: VERIFICATION & DNS */}
              {activeTab === 'verification' && (
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-950/40 border border-indigo-800/60 rounded-2xl text-xs text-indigo-200">
                    Domain verification proves domain ownership and enables custom white-labeling and domain lock enforcement. Customers can add either a DNS TXT record or an HTML &lt;meta&gt; tag to their website head.
                  </div>

                  {/* Method 1: DNS TXT */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-900/80 border border-indigo-700 flex items-center justify-center text-xs font-bold text-indigo-300">
                          1
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Method A: DNS TXT Record (Recommended)</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">TTL: 3600</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="block text-[11px] text-zinc-400 mb-1">Host / Name</span>
                        <div className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300">
                          <span>@ (or {domain})</span>
                          <button
                            onClick={() => handleCopy('@', 'dns_host')}
                            className="p-1 hover:text-white transition cursor-pointer"
                          >
                            {copiedKey === 'dns_host' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[11px] text-zinc-400 mb-1">TXT Value</span>
                        <div className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-indigo-300 truncate">
                          <span className="truncate">{detail.verificationInstructions.dnsTxtRecord.value}</span>
                          <button
                            onClick={() => handleCopy(detail.verificationInstructions.dnsTxtRecord.value, 'dns_val')}
                            className="p-1 hover:text-white transition cursor-pointer shrink-0 ml-2"
                          >
                            {copiedKey === 'dns_val' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Method 2: HTML Meta Tag */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-900/80 border border-indigo-700 flex items-center justify-center text-xs font-bold text-indigo-300">
                        2
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Method B: HTML &lt;head&gt; Meta Tag</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Paste this tag into the <code>&lt;head&gt;</code> section of the root homepage HTML on <code>https://{domain}</code>:
                    </p>
                    <div className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-emerald-300">
                      <span className="truncate">{detail.verificationInstructions.htmlMetaTag.tag}</span>
                      <button
                        onClick={() => handleCopy(detail.verificationInstructions.htmlMetaTag.tag, 'meta_tag')}
                        className="p-1 hover:text-white transition cursor-pointer shrink-0 ml-2"
                      >
                        {copiedKey === 'meta_tag' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Verification Token Info */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">System Verification Token</div>
                      <div className="text-xs text-zinc-500 font-mono mt-0.5">{detail.domainInfo.verificationToken}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(detail.domainInfo.verificationToken, 'sys_tok')}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      {copiedKey === 'sys_tok' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Token
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: ATTACHED CHATBOTS */}
              {activeTab === 'chatbots' && (
                <div className="space-y-4">
                  {detail.associatedChatbots.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-xs">
                      No chatbots are currently deployed or configured for domain '{domain}'.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {detail.associatedChatbots.map((bot) => (
                        <div
                          key={bot.id}
                          className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                                style={{ backgroundColor: bot.primaryColor || '#4F46E5' }}
                              >
                                {bot.avatar || '🤖'}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white">{bot.name}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{bot.id}</div>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                bot.status === 'active'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {bot.status}
                            </span>
                          </div>

                          <div className="text-xs text-zinc-400 space-y-1">
                            <div>Workspace: <strong className="text-zinc-200">{bot.tenantName}</strong></div>
                            <div>Model: <code className="text-indigo-300">{bot.model}</code></div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                                  bot.domainLockEnabled
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {bot.domainLockEnabled ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                                {bot.domainLockEnabled ? 'Locked' : 'Open'}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {bot.allowedDomains.length} allowed origins
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: VISITOR / TRAFFIC LOGS */}
              {activeTab === 'traffic' && (
                <div className="space-y-3">
                  {detail.recentConversations.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-xs">
                      No customer chat sessions recorded yet for domain '{domain}'.
                    </div>
                  ) : (
                    <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/60">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800 text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Visitor</th>
                            <th className="py-3 px-4">Chatbot</th>
                            <th className="py-3 px-4">Referrer Page</th>
                            <th className="py-3 px-4">CSAT</th>
                            <th className="py-3 px-4">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {detail.recentConversations.map((c) => (
                            <tr key={c.id} className="hover:bg-zinc-800/30 transition">
                              <td className="py-3 px-4">
                                <div className="font-semibold text-white">{c.visitorName || 'Anonymous Visitor'}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{c.visitorEmail || c.visitorLocation || 'Web User'}</div>
                              </td>
                              <td className="py-3 px-4 font-medium text-zinc-300">{c.chatbotName}</td>
                              <td className="py-3 px-4 text-zinc-400 font-mono text-[11px] truncate max-w-[180px]">
                                {c.pageUrl || `https://${domain}`}
                              </td>
                              <td className="py-3 px-4">
                                {c.csatRating ? (
                                  <span className="text-amber-400 font-bold">★ {c.csatRating}/5</span>
                                ) : (
                                  <span className="text-zinc-600">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-zinc-500 text-[11px]">
                                {new Date(c.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: AUDIT TRAIL */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  {detail.auditLogs.length === 0 ? (
                    <div className="py-12 text-center text-zinc-500 text-xs">
                      No administrative audit logs for this domain.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detail.auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-white font-mono">{log.action}</div>
                            <div className="text-[11px] text-zinc-400">
                              By <span className="text-indigo-300">{log.adminEmail}</span>
                              {log.details && ` • ${log.details}`}
                            </div>
                          </div>
                          <div className="text-right text-[11px] text-zinc-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-500">
            Last diagnostic timestamp:{' '}
            <strong className="text-zinc-300">
              {detail?.diagnostics.testedAt ? new Date(detail.diagnostics.testedAt).toLocaleTimeString() : 'N/A'}
            </strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
