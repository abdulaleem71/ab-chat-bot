import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  ShieldCheck,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  FileText,
  Check,
  Tag,
  Building,
  Bell,
  Key,
  Webhook,
  Plus,
  Trash2,
  Globe,
  Mail,
  ShieldAlert,
  Copy,
  Download
} from 'lucide-react';
import { DiscountCodePolicy, TenantAuditLog } from '../../types';
import { MotionButton } from '../common/MotionButton';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../config/permissions';

interface WorkspaceProfileData {
  tenantId: string;
  name: string;
  ownerEmail: string;
  plan: string;
  logoUrl?: string;
  timezone: string;
}

interface NotificationData {
  newTicketAlert: boolean;
  integrationDisconnectedAlert: boolean;
  usageNearLimitAlert: boolean;
  emailNotificationsEnabled: boolean;
}

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
}

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  secretMasked?: string;
  isActive: boolean;
  createdAt: string;
}

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const canManage = hasPermission(user?.role || 'Agent', 'manage_settings');

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'apikeys' | 'discount' | 'audit' | 'privacy'>('profile');

  // Data & Privacy state
  const [exportingData, setExportingData] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState('');
  const [deleteWorkspaceNameInput, setDeleteWorkspaceNameInput] = useState('');
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);
  const [deleteWorkspaceError, setDeleteWorkspaceError] = useState('');

  const handleExportData = async () => {
    setExportingData(true);
    setExportSuccessMessage('');
    try {
      const res = await fetch('/api/tenant/export-data', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setExportSuccessMessage(data.message || 'Data export generated successfully.');
        if (data.exportData) {
          const blob = new Blob([JSON.stringify(data.exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `workspace-export-${profile.name || 'tenant'}-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else {
        alert(data.error || 'Failed to export workspace data.');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export workspace data.');
    } finally {
      setExportingData(false);
    }
  };

  const handleDeleteWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteWorkspaceNameInput.trim() !== profile.name.trim()) {
      setDeleteWorkspaceError(`Workspace name does not match "${profile.name}".`);
      return;
    }
    if (!window.confirm('Are you absolutely sure you want to delete this workspace? This will soft-delete your workspace with a 30-day recovery grace period.')) {
      return;
    }

    setDeletingWorkspace(true);
    setDeleteWorkspaceError('');
    try {
      const res = await fetch('/api/tenant/delete-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ workspaceName: deleteWorkspaceNameInput }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Workspace deleted successfully.');
        window.location.href = '/login';
      } else {
        setDeleteWorkspaceError(data.error || 'Failed to delete workspace.');
      }
    } catch (err) {
      console.error('Delete workspace error:', err);
      setDeleteWorkspaceError('Failed to delete workspace.');
    } finally {
      setDeletingWorkspace(false);
    }
  };

  // Profile state
  const [profile, setProfile] = useState<WorkspaceProfileData>({
    tenantId: '',
    name: '',
    ownerEmail: '',
    plan: 'Pro',
    logoUrl: '',
    timezone: 'UTC',
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationData>({
    newTicketAlert: true,
    integrationDisconnectedAlert: true,
    usageNearLimitAlert: true,
    emailNotificationsEnabled: true,
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [newWhName, setNewWhName] = useState('');
  const [newWhUrl, setNewWhUrl] = useState('');
  const [newWhSecret, setNewWhSecret] = useState('');

  // Discount Policy & Audit state
  const [policy, setPolicy] = useState<DiscountCodePolicy>({
    tenantId: '',
    maxPercent: 20,
    maxPerConversation: 1,
    requiresApprovalAbove: 15,
  });
  const [auditLogs, setAuditLogs] = useState<TenantAuditLog[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [auditFilterAction, setAuditFilterAction] = useState<string>('');
  const [auditFilterActor, setAuditFilterActor] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const fetchAllSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const [profRes, notifRes, keysRes, whRes, polRes, auditRes, eventsRes] = await Promise.all([
        fetch('/api/tenant/profile', { credentials: 'include' }),
        fetch('/api/tenant/notifications', { credentials: 'include' }),
        fetch('/api/tenant/api-keys', { credentials: 'include' }),
        fetch('/api/tenant/webhooks', { credentials: 'include' }),
        fetch('/api/tenant/discount-policy', { credentials: 'include' }),
        fetch('/api/tenant/audit-logs', { credentials: 'include' }),
        fetch('/api/tenant/audit-events', { credentials: 'include' }),
      ]);

      const profData = await profRes.json();
      const notifData = await notifRes.json();
      const keysData = await keysRes.json();
      const whData = await whRes.json();
      const polData = await polRes.json();
      const auditData = await auditRes.json();
      const eventsData = await eventsRes.json();

      if (profData.success && profData.profile) setProfile(profData.profile);
      if (notifData.success && notifData.notifications) setNotifications(notifData.notifications);
      if (keysData.success && Array.isArray(keysData.apiKeys)) setApiKeys(keysData.apiKeys);
      if (whData.success && Array.isArray(whData.webhooks)) setWebhooks(whData.webhooks);
      if (polData.success && polData.policy) setPolicy(polData.policy);
      if (auditData.success && Array.isArray(auditData.auditLogs)) setAuditLogs(auditData.auditLogs);
      if (eventsData.success && Array.isArray(eventsData.events)) setAuditEvents(eventsData.events);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load workspace settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/tenant/profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, logoUrl: profile.logoUrl, timezone: profile.timezone }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setSuccessMessage('Workspace profile updated successfully.');
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch {
      setError('Network error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/tenant/notifications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setSuccessMessage('Notification preferences updated successfully.');
      } else {
        setError(data.error || 'Failed to update notifications.');
      }
    } catch {
      setError('Network error saving notifications.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/tenant/api-keys', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName || 'Production API Key' }),
      });
      const data = await res.json();
      if (data.success) {
        setNewlyCreatedKey(data.rawKey);
        setNewKeyName('');
        setSuccessMessage('API key generated successfully.');
        fetchAllSettings();
      } else {
        setError(data.error || 'Failed to generate API key.');
      }
    } catch {
      setError('Network error generating API key.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Any connected service using it will fail.')) return;
    try {
      const res = await fetch(`/api/tenant/api-keys/${keyId}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('API key revoked.');
        fetchAllSettings();
      } else {
        setError(data.error || 'Failed to revoke key.');
      }
    } catch {
      setError('Network error revoking API key.');
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhUrl) {
      setError('Webhook URL is required.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/tenant/webhooks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWhName || 'Workflow Webhook', url: newWhUrl, secret: newWhSecret }),
      });
      const data = await res.json();
      if (data.success) {
        setNewWhName('');
        setNewWhUrl('');
        setNewWhSecret('');
        setSuccessMessage('Workflow webhook created successfully.');
        fetchAllSettings();
      } else {
        setError(data.error || 'Failed to create webhook.');
      }
    } catch {
      setError('Network error creating webhook.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWebhook = async (whId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    try {
      const res = await fetch(`/api/tenant/webhooks/${whId}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Webhook deleted.');
        fetchAllSettings();
      } else {
        setError(data.error || 'Failed to delete webhook.');
      }
    } catch {
      setError('Network error deleting webhook.');
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/tenant/discount-policy', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxPercent: policy.maxPercent,
          maxPerConversation: policy.maxPerConversation,
          requiresApprovalAbove: policy.requiresApprovalAbove,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPolicy(data.policy);
        setSuccessMessage('Discount code guardrail policies updated successfully.');
        fetchAllSettings();
      } else {
        setError(data.error || 'Failed to update policy.');
      }
    } catch {
      setError('Network error saving policy.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Success / Issued
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            Blocked / Limit Reached
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            Pending Approval
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-full">
            {status}
          </span>
        );
    }
  };

  if (!canManage) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-zinc-950 font-heading">Access Restricted</h2>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          Workspace settings require the <strong className="text-zinc-900">manage_settings</strong> permission (Owner or Admin role). Please contact your workspace administrator for access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-zinc-950 font-heading">Workspace Settings & Guardrails</h1>
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            Manage your workspace profile, alert notifications, API keys, webhook integrations, and discount guardrail policies.
          </p>
        </div>
        <button
          onClick={fetchAllSettings}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'profile'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Building className="w-4 h-4" />
          Workspace Profile
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'notifications'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('apikeys')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'apikeys'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Key className="w-4 h-4" />
          API Keys & Webhooks
        </button>
        <button
          onClick={() => setActiveTab('discount')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'discount'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          Discount Code Policy & Audit
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Log
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'privacy'
              ? 'border-zinc-950 text-zinc-950'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Data & Privacy
        </button>
      </div>

      {/* TAB 1: WORKSPACE PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
            <Building className="w-5 h-5 text-zinc-950" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Workspace Profile</h2>
              <p className="text-xs text-zinc-500">Update your workspace name, brand logo, and timezone.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800">Workspace Name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800">Owner Email</label>
              <input
                type="email"
                value={profile.ownerEmail || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-zinc-400">Workspace owner email cannot be changed directly.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800">Logo Image URL</label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={profile.logoUrl || ''}
                onChange={e => setProfile({ ...profile, logoUrl: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-zinc-800">Timezone</label>
              <select
                value={profile.timezone || 'UTC'}
                onChange={e => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 bg-white"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Chicago">Central Time (US & Canada)</option>
                <option value="America/Denver">Mountain Time (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
              </select>
            </div>

            <div className="pt-3">
              <MotionButton
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Profile
              </MotionButton>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
            <Bell className="w-5 h-5 text-zinc-950" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Alerts & Notifications</h2>
              <p className="text-xs text-zinc-500">Configure email and in-app alert triggers for critical events.</p>
            </div>
          </div>

          <form onSubmit={handleSaveNotifications} className="space-y-6 max-w-2xl">
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-900 block">New Support Ticket / Chat Escalation</span>
                  <span className="text-[11px] text-zinc-500 block">Notify agents immediately when a customer escalates or submits a ticket.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.newTicketAlert}
                  onChange={e => setNotifications({ ...notifications, newTicketAlert: e.target.checked })}
                  className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-900 block">Integration Disconnected</span>
                  <span className="text-[11px] text-zinc-500 block">Alert workspace admins if Slack, WhatsApp, or CRM integrations lose authentication.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.integrationDisconnectedAlert}
                  onChange={e => setNotifications({ ...notifications, integrationDisconnectedAlert: e.target.checked })}
                  className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-900 block">Usage Near Limit (90%)</span>
                  <span className="text-[11px] text-zinc-500 block">Receive alerts when conversation message volume approaches monthly plan limits.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.usageNearLimitAlert}
                  onChange={e => setNotifications({ ...notifications, usageNearLimitAlert: e.target.checked })}
                  className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition cursor-pointer">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-900 block">Email Digest Notifications</span>
                  <span className="text-[11px] text-zinc-500 block">Send daily summary digests to workspace owners and administrators.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailNotificationsEnabled}
                  onChange={e => setNotifications({ ...notifications, emailNotificationsEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-zinc-950 focus:ring-zinc-950"
                />
              </label>
            </div>

            <div className="pt-2">
              <MotionButton
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition shadow-xs cursor-pointer flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save Notification Preferences
              </MotionButton>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: API KEYS & WEBHOOKS */}
      {activeTab === 'apikeys' && (
        <div className="space-y-8">
          {/* Newly created key banner */}
          {newlyCreatedKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Save your new API Key! It will never be shown again.
              </div>
              <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-amber-200 font-mono text-xs text-zinc-900 select-all">
                <span className="flex-1 truncate">{newlyCreatedKey}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(newlyCreatedKey)}
                  className="px-3 py-1.5 bg-zinc-950 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-zinc-800 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            </div>
          )}

          {/* API Keys Section */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-zinc-950" />
                <div>
                  <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Workspace API Keys</h2>
                  <p className="text-xs text-zinc-500">Manage production API keys for external integrations and programmatic access.</p>
                </div>
              </div>

              <form onSubmit={handleCreateApiKey} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Key name (e.g. CI/CD Pipeline)"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Generate Key
                </button>
              </form>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs font-medium">
                No active API keys generated yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Prefix</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {apiKeys.map(k => (
                      <tr key={k.id} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3 px-4 font-bold text-zinc-900">{k.name}</td>
                        <td className="py-3 px-4 font-mono text-zinc-600">{k.keyPrefix}</td>
                        <td className="py-3 px-4 text-zinc-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRevokeApiKey(k.id)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Webhooks Section (used by call_webhook with encrypted storage pattern) */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
              <Webhook className="w-5 h-5 text-zinc-950" />
              <div>
                <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Workflow Webhooks (`call_webhook`)</h2>
                <p className="text-xs text-zinc-500">Configure external webhook endpoints and secrets invoked by your AI chatbots via the `call_webhook` tool. Secrets are stored securely using encrypted storage.</p>
              </div>
            </div>

            <form onSubmit={handleCreateWebhook} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-zinc-50/80 p-4 rounded-2xl border border-zinc-200/80">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-800">Webhook Name</label>
                <input
                  type="text"
                  placeholder="e.g. Zapier Order Trigger"
                  value={newWhName}
                  onChange={e => setNewWhName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 bg-white"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="block text-xs font-bold text-zinc-800">Endpoint URL *</label>
                <input
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  value={newWhUrl}
                  onChange={e => setNewWhUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-zinc-800">Signing Secret (Optional)</label>
                <input
                  type="password"
                  placeholder="whsec_..."
                  value={newWhSecret}
                  onChange={e => setNewWhSecret(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 bg-white"
                />
              </div>
              <div className="md:col-span-4 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Webhook Endpoint
                </button>
              </div>
            </form>

            {webhooks.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs font-medium">
                No active workflow webhooks configured yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">URL</th>
                      <th className="py-3 px-4">Secret Status</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {webhooks.map(wh => (
                      <tr key={wh.id} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3 px-4 font-bold text-zinc-900">{wh.name}</td>
                        <td className="py-3 px-4 font-mono text-zinc-600 truncate max-w-xs">{wh.url}</td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{wh.secretMasked || 'No Secret'}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteWebhook(wh.id)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DISCOUNT CODE POLICY & AUDIT */}
      {activeTab === 'discount' && (
        <div className="space-y-8">
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
              <Tag className="w-5 h-5 text-zinc-950" />
              <div>
                <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Discount Code Tool Guardrails & Limits</h2>
                <p className="text-xs text-zinc-500">Configure parameters enforced before the `issue_discount_code` tool is executed by your chatbots.</p>
              </div>
            </div>

            <form onSubmit={handleSavePolicy} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-800">
                  Max Discount Percentage (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={policy.maxPercent ?? 20}
                  onChange={e => setPolicy({ ...policy, maxPercent: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
                <p className="text-[11px] text-zinc-400">Requests above this limit will be automatically clamped.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-800">
                  Max Codes Per Conversation
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={policy.maxPerConversation ?? 1}
                  onChange={e => setPolicy({ ...policy, maxPerConversation: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
                <p className="text-[11px] text-zinc-400">Prevents issuing multiple promo codes in the same thread.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-800">
                  Requires Approval Above (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={policy.requiresApprovalAbove ?? 15}
                  onChange={e => setPolicy({ ...policy, requiresApprovalAbove: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
                <p className="text-[11px] text-zinc-400">Discounts above this threshold create a pending Inbox approval request.</p>
              </div>

              <div className="md:col-span-3 flex justify-end pt-2">
                <MotionButton
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Guardrail Policies
                </MotionButton>
              </div>
            </form>
          </div>

          {/* Audit Trail Section */}
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-zinc-950" />
                <div>
                  <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Discount & Tool Security Audit Trail</h2>
                  <p className="text-xs text-zinc-500">Real-time log of every issued, clamped, blocked, or pending discount code attempt.</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                {auditLogs.length} Events Logged
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 text-xs font-medium">
                No discount code tool invocations or guardrail events recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-zinc-900">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 font-mono text-[11px]">
                          {log.targetResource} {log.targetId ? `(${log.targetId.slice(0, 10)}...)` : ''}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="py-3 px-4 text-zinc-600 font-mono text-[11px] max-w-xs truncate" title={JSON.stringify(log.details, null, 2)}>
                          {log.details ? JSON.stringify(log.details) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-950" />
              <div>
                <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Tenant Audit Trail</h2>
                <p className="text-xs text-zinc-500">Append-only log of security events, configuration changes, team actions, and integrations.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <select
                value={auditFilterAction}
                onChange={e => setAuditFilterAction(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 bg-white"
              >
                <option value="">All Actions</option>
                <option value="chatbot_created">Chatbot Created</option>
                <option value="chatbot_edited">Chatbot Edited</option>
                <option value="chatbot_deleted">Chatbot Deleted</option>
                <option value="knowledge_source_added">Knowledge Added</option>
                <option value="knowledge_source_removed">Knowledge Removed</option>
                <option value="team_member_invited">Team Invited</option>
                <option value="team_member_role_changed">Role Changed</option>
                <option value="team_member_removed">Team Removed</option>
                <option value="integration_connected">Integration Connected</option>
                <option value="integration_disconnected">Integration Disconnected</option>
                <option value="discount_code_issued">Discount Issued</option>
                <option value="settings_changed">Settings Changed</option>
                <option value="billing_plan_changed">Billing Changed</option>
              </select>

              <input
                type="text"
                placeholder="Filter by actor email..."
                value={auditFilterActor}
                onChange={e => setAuditFilterActor(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
              />
            </div>
          </div>

          {auditEvents.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-xs font-medium">
              No audit events recorded yet for this workspace.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {auditEvents
                    .filter(ev => {
                      if (auditFilterAction && ev.action !== auditFilterAction) return false;
                      if (auditFilterActor && !(ev.actor_email || '').toLowerCase().includes(auditFilterActor.toLowerCase()) && !(ev.actor_name || '').toLowerCase().includes(auditFilterActor.toLowerCase())) return false;
                      return true;
                    })
                    .map(ev => (
                      <tr key={ev.id} className="hover:bg-zinc-50/80 transition">
                        <td className="py-3 px-4 text-zinc-500 whitespace-nowrap">{new Date(ev.created_at).toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-zinc-900">
                          {ev.actor_email ? (
                            <div>
                              <div>{ev.actor_name || 'User'}</div>
                              <div className="text-[10px] font-normal text-zinc-400">{ev.actor_email}</div>
                            </div>
                          ) : (
                            <span className="text-zinc-400 font-normal">System / API Key</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-zinc-100 text-zinc-900 rounded-lg text-[11px] font-mono font-bold">
                            {ev.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 font-medium">
                          {ev.target_type ? `${ev.target_type}${ev.target_id ? ` (${ev.target_id})` : ''}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-zinc-500 font-mono text-[11px] max-w-xs truncate" title={ev.metadata}>
                          {ev.metadata ? ev.metadata : '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: DATA & PRIVACY */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-zinc-100">
              <Download className="w-5 h-5 text-zinc-950" />
              <div>
                <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Export Workspace Data</h2>
                <p className="text-xs text-zinc-500">Download a complete JSON package containing your chatbots, knowledge sources, conversations, tickets, and team members.</p>
              </div>
            </div>

            {user?.role?.toLowerCase() !== 'owner' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
                Data export and workspace deletion are restricted to the workspace <strong>Owner</strong> role only.
              </div>
            ) : (
              <div className="space-y-4">
                {exportSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{exportSuccessMessage}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-zinc-600">
                    Generates a full archive of all tenant records. Large datasets are processed asynchronously with an email notification sent upon completion.
                  </div>
                  <MotionButton
                    onClick={handleExportData}
                    disabled={exportingData}
                    className="px-4 py-2 bg-zinc-950 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {exportingData ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Export...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export Data Package
                      </>
                    )}
                  </MotionButton>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-rose-200/80 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-rose-100">
              <Trash2 className="w-5 h-5 text-rose-600" />
              <div>
                <h2 className="text-sm font-extrabold text-rose-950 font-heading">Delete Workspace</h2>
                <p className="text-xs text-rose-600">Soft-deletes your workspace and all associated resources with a 30-day grace period before permanent purge.</p>
              </div>
            </div>

            {user?.role?.toLowerCase() !== 'owner' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
                Workspace deletion is restricted to the workspace <strong>Owner</strong> role only.
              </div>
            ) : (
              <form onSubmit={handleDeleteWorkspace} className="space-y-4">
                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs text-rose-900 leading-relaxed">
                  Warning: This action will soft-delete workspace <strong>{profile.name}</strong>. All live widgets, chatbots, and team memberships will be deactivated immediately. You have a 30-day grace period to restore before permanent deletion.
                </div>

                {deleteWorkspaceError && (
                  <div className="p-3 bg-rose-100 text-rose-900 rounded-xl text-xs font-semibold">
                    {deleteWorkspaceError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    Type workspace name <span className="text-rose-600 font-mono">"{profile.name}"</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteWorkspaceNameInput}
                    onChange={e => setDeleteWorkspaceNameInput(e.target.value)}
                    placeholder={profile.name}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-600"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={deletingWorkspace || deleteWorkspaceNameInput.trim() !== profile.name.trim()}
                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingWorkspace ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Deleting Workspace...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Workspace
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
