import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plug,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Settings2,
  RefreshCw,
  Trash2,
  Zap,
  MessageSquare,
  Database,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Radio,
  Sliders,
  Globe,
} from 'lucide-react';
import { IntegrationItem, IntegrationId } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { telemetry } from '../../lib/telemetry';

interface IntegrationsViewProps {
  onNavigateToInbox?: () => void;
  onNavigateToKnowledge?: () => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  onNavigateToInbox,
  onNavigateToKnowledge,
}) => {
  const { token } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeModalItem, setActiveModalItem] = useState<IntegrationItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<{ id: string; loading: boolean; message?: string; success?: boolean } | null>(null);
  const [configInputs, setConfigInputs] = useState<Record<string, string>>({});

  const categories = ['All', 'Messaging', 'Automation', 'CRM'];

  const getAuthHeaders = () => {
    const currentToken = localStorage.getItem('auth_token') || token;
    return {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
  };

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/integrations', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.integrations)) {
        setIntegrations(data.integrations);
      }
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [token]);

  const handleOpenConfig = (item: IntegrationItem) => {
    setActiveModalItem(item);
    setConfigInputs(item.config || {});
    setTestStatus(null);
  };

  const handleCloseConfig = () => {
    setActiveModalItem(null);
    setConfigInputs({});
    setTestStatus(null);
  };

  const handleConnect = async (item: IntegrationItem) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/integrations/${item.id}/connect`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ config: configInputs }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchIntegrations();
        handleCloseConfig();
      } else {
        alert(data.error || 'Failed to connect integration.');
      }
    } catch (err: any) {
      alert('Error connecting integration: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async (item: IntegrationItem) => {
    if (!confirm(`Are you sure you want to disconnect ${item.name}? Data sync will be paused.`)) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/integrations/${item.id}/disconnect`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        await fetchIntegrations();
        handleCloseConfig();
      }
    } catch (err: any) {
      alert('Error disconnecting integration: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (item: IntegrationItem) => {
    setTestStatus({ id: item.id, loading: true });
    try {
      const res = await fetch(`/api/integrations/${item.id}/test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ config: configInputs }),
      });
      const data = await res.json();
      if (!data.success) {
        telemetry.logWebhookFailure(data.message || `Test ping failed for integration ${item.name}`, {
          eventName: `${item.id}_test_ping`,
          url: configInputs.storeUrl || configInputs.webhookUrl,
        });
      }
      setTestStatus({
        id: item.id,
        loading: false,
        success: data.success,
        message: data.message || 'Connection handshake verified successfully.',
      });
    } catch (err: any) {
      telemetry.logWebhookFailure(err, {
        eventName: `${item.id}_test_ping`,
        url: configInputs.storeUrl || configInputs.webhookUrl,
      });
      setTestStatus({
        id: item.id,
        loading: false,
        success: false,
        message: 'Ping failed: ' + (err.message || 'Network error'),
      });
    }
  };

  const filteredIntegrations = integrations.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = integrations.filter(i => i.isConnected).length;

  const getIntegrationIcon = (id: string) => {
    switch (id) {
      case 'slack':
        return <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-base">#</div>;
      case 'whatsapp':
        return <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 border border-green-200 flex items-center justify-center font-bold text-base"><MessageSquare className="w-5 h-5" /></div>;
      case 'zapier':
        return <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center font-bold text-base"><Zap className="w-5 h-5" /></div>;
      case 'hubspot':
        return <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-base"><Database className="w-5 h-5" /></div>;
      default:
        return <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center justify-center font-bold text-base"><Plug className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
              <Plug className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-extrabold text-zinc-950 font-heading">Integrations Marketplace</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              {connectedCount} Connected
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-medium">
            Connect NomadsChat with your favorite messaging apps, CRMs, and automation tools.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            onClick={fetchIntegrations}
            className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-zinc-950 text-white shadow-xs'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-950 font-medium"
          />
        </div>
      </div>

      {/* Marketplace Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5 h-56 animate-pulse" />
          ))}
        </div>
      ) : filteredIntegrations.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center">
          <Plug className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-900 mb-1 font-heading">No integrations found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search query or select another category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIntegrations.map(item => (
            <div
              key={item.id}
              className={`bg-white border transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                item.isConnected ? 'border-zinc-300 ring-1 ring-zinc-200' : 'border-zinc-200'
              }`}
            >
              <div>
                {/* Top Row: Logo & Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3">
                    {getIntegrationIcon(item.id)}
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-950 font-heading flex items-center gap-1.5">
                        {item.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {item.isConnected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                      Not Connected
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-600 font-medium leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Features Pill List */}
                <div className="space-y-1.5 mb-4">
                  {item.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <Check className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                {item.isConnected ? (
                  <>
                    <button
                      onClick={() => handleOpenConfig(item)}
                      className="flex-1 py-2 px-3 text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Configure</span>
                    </button>
                    <button
                      onClick={() => handleDisconnect(item)}
                      title="Disconnect"
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer border border-transparent hover:border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenConfig(item)}
                    className="w-full py-2 px-3 text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Integration Configuration Modal */}
      <AnimatePresence>
        {activeModalItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  {getIntegrationIcon(activeModalItem.id)}
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-950 font-heading">
                      {activeModalItem.isConnected ? `Configure ${activeModalItem.name}` : `Connect ${activeModalItem.name}`}
                    </h2>
                    <p className="text-xs text-zinc-500 font-medium">
                      {activeModalItem.category} Integration Setup
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseConfig}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic Form Inputs based on Integration Type */}
              <div className="py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-3 text-xs text-zinc-600 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    API tokens are encrypted at-rest using AES-256 before storing. Real-time webhooks stream directly to the NomadsChat server.
                  </span>
                </div>

                {activeModalItem.id === 'slack' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">
                        Slack Webhook URL / Bot Token
                      </label>
                      <input
                        type="text"
                        placeholder="https://hooks.slack.com/services/T.../B.../X..."
                        value={configInputs.webhookUrl || ''}
                        onChange={e => setConfigInputs(prev => ({ ...prev, webhookUrl: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 font-mono placeholder-zinc-400 focus:outline-hidden focus:border-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">
                        Default Notification Channel
                      </label>
                      <input
                        type="text"
                        placeholder="#customer-support-leads"
                        value={configInputs.channel || ''}
                        onChange={e => setConfigInputs(prev => ({ ...prev, channel: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-950"
                      />
                    </div>
                  </>
                )}

                {activeModalItem.id === 'whatsapp' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">
                        WhatsApp Phone Number ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 109283746501928"
                        value={configInputs.phoneNumberId || ''}
                        onChange={e => setConfigInputs(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 font-mono placeholder-zinc-400 focus:outline-hidden focus:border-zinc-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">
                        Meta Permanent Access Token
                      </label>
                      <input
                        type="password"
                        placeholder="EAAGm0PX4ZC5..."
                        value={configInputs.accessToken || ''}
                        onChange={e => setConfigInputs(prev => ({ ...prev, accessToken: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 font-mono placeholder-zinc-400 focus:outline-hidden focus:border-zinc-950"
                      />
                    </div>
                  </>
                )}

                {activeModalItem.id === 'zapier' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">
                        Zapier Catch Hook URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://hooks.zapier.com/hooks/catch/123456/abcdef/"
                        value={configInputs.webhookUrl || ''}
                        onChange={e => setConfigInputs(prev => ({ ...prev, webhookUrl: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 font-mono placeholder-zinc-400 focus:outline-hidden focus:border-zinc-950"
                      />
                    </div>
                  </>
                )}

                {activeModalItem.id === 'hubspot' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">
                        HubSpot Private App Access Token (pat-na1-...)
                      </label>
                      <input
                        type="password"
                        placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        value={configInputs.apiKey || ''}
                        onChange={e => setConfigInputs(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-900 font-mono placeholder-zinc-400 focus:outline-hidden focus:border-zinc-950"
                      />
                    </div>
                  </>
                )}

                {/* Test Connection Output */}
                {testStatus && (
                  <div className={`p-3 rounded-xl text-xs font-medium border flex items-start gap-2 ${
                    testStatus.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {testStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span>{testStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleTestConnection(activeModalItem)}
                  disabled={testStatus?.loading}
                  className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testStatus?.loading ? 'animate-spin' : ''}`} />
                  <span>Test Ping</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseConfig}
                    className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConnect(activeModalItem)}
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save & Connect</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
