import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminUserDetail } from '../repositories/adminUserRepo';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  X,
  User,
  Shield,
  Bot,
  Globe,
  MessageSquare,
  Sparkles,
  Key,
  Layers,
  Lock,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Edit3,
} from 'lucide-react';

interface UserDetailModalProps {
  userId: string;
  onClose: () => void;
  onUserUpdated?: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  userId,
  onClose,
  onUserUpdated,
}) => {
  const { adminToken } = useAdminAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chatbots' | 'leads' | 'conversations' | 'actions' | 'audit'>('chatbots');

  // Action states
  const [newRole, setNewRole] = useState<string>('user');
  const [newPlan, setNewPlan] = useState<string>('Pro');
  const [newPassword, setNewPassword] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);

  const fetchDetail = useCallback(async () => {
    if (!adminToken || !userId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDetail(json.data);
        setNewRole(json.data.user.role || 'user');
        if (json.data.tenant) {
          setNewPlan(json.data.tenant.plan || 'Pro');
        }
      } else {
        throw new Error(json.error || 'Failed to load user details');
      }
    } catch (err: any) {
      console.error('[Admin] Error loading user detail:', err);
      setError(err.message || 'Network error retrieving user record');
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, userId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleUpdateRole = async () => {
    if (!adminToken || !detail) return;
    setIsSubmittingAction(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/update-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ newRole }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ type: 'success', text: json.message || 'Role updated successfully.' });
        fetchDetail();
        onUserUpdated?.();
      } else {
        throw new Error(json.error || 'Failed to update role');
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!adminToken || !detail || !detail.tenant) return;
    setIsSubmittingAction(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/update-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ tenantId: detail.tenant.id, newPlan }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ type: 'success', text: json.message || 'Plan updated successfully.' });
        fetchDetail();
        onUserUpdated?.();
      } else {
        throw new Error(json.error || 'Failed to update plan');
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleResetPassword = async () => {
    if (!adminToken || !detail) return;
    if (!newPassword || newPassword.length < 6) {
      setActionMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setIsSubmittingAction(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ type: 'success', text: json.message || 'Password reset successfully.' });
        setNewPassword('');
        fetchDetail();
        onUserUpdated?.();
      } else {
        throw new Error(json.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight font-heading">
                  {detail?.user.name || 'User Inspection'}
                </h2>
                {detail && (
                  <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-700">
                    {detail.user.id}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-body">{detail?.user.email || 'Loading details from SQLite database...'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={fetchDetail}
              disabled={isLoading}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
              title="Refresh User Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-rose-400 rounded-xl hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && !detail ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-500">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-mono">Querying deep user record & associated entities...</span>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-950/40 border border-rose-800 rounded-xl text-center">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-rose-300">Error Loading User</div>
              <p className="text-xs text-rose-400/80 mt-1">{error}</p>
            </div>
          ) : detail ? (
            <>
              {/* User Overview Top Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl">
                  <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Chatbots Created</div>
                  <div className="text-2xl font-bold text-white mt-1">{detail.stats.totalChatbots}</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{detail.stats.totalKnowledgeSources} Knowledge files</div>
                </div>
                <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl">
                  <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Total Conversations</div>
                  <div className="text-2xl font-bold text-white mt-1">{detail.stats.totalConversations}</div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{detail.stats.totalMessages} Messages exchanged</div>
                </div>
                <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl">
                  <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Visitor Leads</div>
                  <div className="text-2xl font-bold text-white mt-1">{detail.stats.totalLeads}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5">High Intent</div>
                </div>
                <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl">
                  <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Workspace Tier</div>
                  <div className="text-base font-bold text-indigo-400 mt-1 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>{detail.tenant?.plan || 'Standard'}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Role: {detail.user.role}</div>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="border-b border-zinc-800 flex items-center gap-1 overflow-x-auto pb-1">
                {[
                  { id: 'chatbots', label: `Chatbots (${detail.chatbots.length})`, icon: Bot },
                  { id: 'leads', label: `Leads (${detail.leads.length})`, icon: Sparkles },
                  { id: 'conversations', label: `Conversations (${detail.recentConversations.length})`, icon: MessageSquare },
                  { id: 'actions', label: 'Admin Actions & Tier', icon: Edit3 },
                  { id: 'audit', label: `Security Logs (${detail.auditLogs.length})`, icon: Shield },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-zinc-800 text-white border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: Chatbots */}
              {activeTab === 'chatbots' && (
                <div className="space-y-3">
                  {detail.chatbots.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
                      No chatbots provisioned by this user.
                    </div>
                  ) : (
                    detail.chatbots.map((bot) => (
                      <div key={bot.id} className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Bot className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-bold text-white">{bot.name}</span>
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-md font-bold ${
                                bot.status === 'active'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {bot.status}
                            </span>
                            {bot.domainLockEnabled && (
                              <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Domain Lock</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400">
                            Created {new Date(bot.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {bot.websiteUrl && (
                          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="font-mono text-zinc-300">{bot.websiteUrl}</span>
                          </div>
                        )}

                        {bot.allowedDomains.length > 0 && (
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 flex-wrap">
                            <span className="text-zinc-400">Allowed Domains:</span>
                            {bot.allowedDomains.map((d) => (
                              <span key={d} className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[10px] px-1.5 py-0.5 rounded-md">
                                {d}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-4 text-xs font-mono text-zinc-400">
                          <span>Convs: <strong className="text-zinc-200">{bot.conversationsCount}</strong></span>
                          <span>Msgs: <strong className="text-zinc-200">{bot.messagesCount}</strong></span>
                          <span>Leads: <strong className="text-emerald-400">{bot.leadsCount}</strong></span>
                          <span>Knowledge Sources: <strong className="text-indigo-400">{bot.knowledgeSourcesCount}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: Leads */}
              {activeTab === 'leads' && (
                <div className="space-y-3">
                  {detail.leads.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
                      No visitor leads captured yet for this user's chatbots.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border border-zinc-800 rounded-xl overflow-hidden">
                        <thead className="bg-zinc-950 text-zinc-400 font-mono uppercase text-[10px] border-b border-zinc-800">
                          <tr>
                            <th className="p-3">Lead</th>
                            <th className="p-3">Contact</th>
                            <th className="p-3">Chatbot</th>
                            <th className="p-3">Captured At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
                          {detail.leads.map((l) => (
                            <tr key={l.id} className="hover:bg-zinc-900/60">
                              <td className="p-3 font-semibold text-white">{l.name}</td>
                              <td className="p-3 font-mono text-zinc-300">
                                <div>{l.email}</div>
                                {l.phone && <div className="text-[10px] text-zinc-500">{l.phone}</div>}
                              </td>
                              <td className="p-3 text-zinc-400">{l.chatbotName}</td>
                              <td className="p-3 font-mono text-zinc-500 text-[11px]">
                                {new Date(l.capturedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Conversations */}
              {activeTab === 'conversations' && (
                <div className="space-y-3">
                  {detail.recentConversations.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
                      No conversation logs recorded for this user's chatbots.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl bg-zinc-950/40 overflow-hidden">
                      {detail.recentConversations.map((c) => (
                        <div key={c.id} className="p-3 flex items-center justify-between text-xs hover:bg-zinc-900/60">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                            <div>
                              <div className="font-semibold text-white">
                                {c.visitorName || c.visitorEmail || 'Website Visitor'}
                              </div>
                              <div className="text-[11px] text-zinc-500 font-mono">
                                Bot: {c.chatbotName} ({c.id})
                              </div>
                            </div>
                          </div>
                          <div className="text-right font-mono text-zinc-400 text-[11px]">
                            <div>Status: <span className="text-emerald-400 capitalize">{c.status}</span></div>
                            <div className="text-[10px] text-zinc-500">{new Date(c.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Admin Actions & Tier */}
              {activeTab === 'actions' && (
                <div className="space-y-6 bg-zinc-950/60 border border-zinc-800 rounded-xl p-5">
                  {actionMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        actionMessage.type === 'success'
                          ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                      }`}
                    >
                      {actionMessage.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      )}
                      <span>{actionMessage.text}</span>
                    </div>
                  )}

                  {/* 1. Update User Role */}
                  <div className="space-y-2 pb-5 border-b border-zinc-800">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      1. Change User Privilege Role
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Promote or configure account privilege level.
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-hidden focus:border-indigo-500 font-mono cursor-pointer"
                      >
                        <option value="user">user (Standard Customer)</option>
                        <option value="member">member (Team Member)</option>
                        <option value="admin">admin (Workspace Administrator)</option>
                      </select>
                      <button
                        onClick={handleUpdateRole}
                        disabled={isSubmittingAction || newRole === detail.user.role}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        Save Role
                      </button>
                    </div>
                  </div>

                  {/* 2. Update Tenant Workspace Plan */}
                  {detail.tenant && (
                    <div className="space-y-2 pb-5 border-b border-zinc-800">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        2. Modify Workspace Tier / Plan
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Adjust tier limits and feature flags for tenant: <strong className="text-zinc-200">{detail.tenant.name}</strong>
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <select
                          value={newPlan}
                          onChange={(e) => setNewPlan(e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-hidden focus:border-indigo-500 font-mono cursor-pointer"
                        >
                          <option value="Standard">Standard Tier</option>
                          <option value="Pro">Pro Tier</option>
                          <option value="Enterprise">Enterprise Tier</option>
                        </select>
                        <button
                          onClick={handleUpdatePlan}
                          disabled={isSubmittingAction || newPlan === detail.tenant.plan}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                        >
                          Update Tier
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Administrative Password Reset */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      3. Administrative Password Reset
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Directly re-hash and update the user's password in the database.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                      <input
                        type="password"
                        placeholder="Enter new temporary password (min 6 chars)..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500 font-mono flex-1"
                      />
                      <button
                        onClick={handleResetPassword}
                        disabled={isSubmittingAction || newPassword.length < 6}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                      >
                        Reset Password
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Audit Logs */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  {detail.auditLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-zinc-800">
                      No administrative actions recorded specifically for this user yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800 border border-zinc-800 rounded-xl bg-zinc-950/40 overflow-hidden">
                      {detail.auditLogs.map((a) => (
                        <div key={a.id} className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-zinc-200">{a.action}</div>
                            <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                              By {a.adminEmail} • Status: <span className="text-emerald-400">{a.status}</span>
                            </div>
                          </div>
                          <div className="text-right font-mono text-[10px] text-zinc-500">
                            {new Date(a.createdAt).toLocaleString()}
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
          <div className="text-[11px] font-mono text-zinc-500">
            NomadsChat Security & User Directory v2.6
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition cursor-pointer font-heading"
          >
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
