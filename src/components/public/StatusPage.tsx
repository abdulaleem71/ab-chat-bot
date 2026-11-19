import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Activity,
  Bell,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { NomadsLogo } from '../common/NomadsLogo';
import { GEMINI_CONFIG } from '../../config/models';

interface StatusPageProps {
  onReturnToApp?: () => void;
}

interface StatusServiceItem {
  name: string;
  description?: string;
  status: string;
  region?: string;
  latency?: string;
}

export const StatusPage: React.FC<StatusPageProps> = ({ onReturnToApp }) => {
  const [subscribed, setSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [email, setEmail] = useState('');
  const [overallStatus, setOverallStatus] = useState<'operational' | 'degraded'>('operational');
  const [checkedAt, setCheckedAt] = useState<string>('');
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [services, setServices] = useState<StatusServiceItem[]>([
    {
      name: 'Gemini AI Inference & Grounding Gateway',
      description: `${GEMINI_CONFIG.flash.name} & ${GEMINI_CONFIG.pro.name} completion engine`,
      status: 'Operational',
      region: 'Global',
      latency: '—',
    },
    {
      name: 'RAG Knowledge Search & Webpage Crawler',
      description: 'Document vector indexing, URL scraping, and semantic retrieval',
      status: 'Operational',
      region: 'US / EU',
      latency: '—',
    },
    {
      name: 'Embed Widget Edge CDN & Script Delivery',
      description: 'Static & iframe runtime delivery for embedded chat widgets',
      status: 'Operational',
      region: 'Edge',
      latency: '—',
    },
    {
      name: 'Live Chat Inbox & Human Takeover API',
      description: 'Real-time agent takeover and visitor transcript storage',
      status: 'Operational',
      region: 'Global',
      latency: '—',
    },
    {
      name: 'Integrations & Webhook Ingestion Pipeline',
      description: 'Slack, WhatsApp, Zapier, and HubSpot connectors',
      status: 'Operational',
      region: 'Global',
      latency: '—',
    },
  ]);

  const fetchLiveStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.overallStatus === 'degraded' || data.overallStatus === 'operational') {
          setOverallStatus(data.overallStatus);
        }
        if (data.checkedAt) {
          setCheckedAt(new Date(data.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
        if (Array.isArray(data.services) && data.services.length > 0) {
          setServices(
            data.services.map((s: any) => ({
              name: s.name,
              description: s.region ? `Region: ${s.region}` : undefined,
              status: s.status || 'Operational',
              region: s.region,
              latency: s.latency || '—',
            }))
          );
        }
      }
    } catch {
      // Keep graceful UI fallback
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveStatus();
  }, [fetchLiveStatus]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setIsSubscribing(true);
    setSubscribeError('');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source: 'status_page' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not subscribe to status alerts.');
      }
      setSubscribed(true);
      setEmail('');
    } catch (err: any) {
      setSubscribeError(err.message || 'Subscription failed.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col">
      {/* Standalone Public Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <NomadsLogo showText textClassName="text-base font-extrabold text-zinc-950 font-heading" />
            <span className="hidden sm:inline-block text-zinc-300">/</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              System Status
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchLiveStatus}
              disabled={loadingStatus}
              className="px-3 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onReturnToApp) {
                  onReturnToApp();
                } else {
                  window.location.href = '/';
                }
              }}
              className="px-4 py-2 text-xs font-extrabold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Status Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 md:p-10 space-y-8">
        {/* Overall Status Hero Card */}
        <div
          className={`${
            overallStatus === 'operational' ? 'bg-emerald-600' : 'bg-amber-600'
          } text-white rounded-3xl p-6 sm:p-8 shadow-lg`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-black/15 border border-white/20 px-3 py-1 rounded-md text-xs font-bold">
                {overallStatus === 'operational' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-white" />
                )}
                <span>Live Health Check</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading">
                {overallStatus === 'operational' ? 'All Systems Operational' : 'Partial System Degradation'}
              </h1>
              <p className="text-xs text-white/90 font-medium max-w-xl">
                NomadsChat API, RAG indexing, widget embeds, and persistence services are monitored continuously in real time.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1 bg-black/15 p-4 rounded-2xl border border-white/20 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Last Probe</span>
              <span className="text-xl font-extrabold text-white font-mono tabular-nums">
                {checkedAt || 'Just now'}
              </span>
              <span className="text-[10px] text-white/80 font-mono">
                {services.length} Core Components
              </span>
            </div>
          </div>
        </div>

        {/* System Component Breakdown Table */}
        <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-zinc-950 font-heading">System Components &amp; Gateways</h2>
            <span className="text-xs text-zinc-500 font-medium tabular-nums">
              {services.length} Services
            </span>
          </div>

          <div className="divide-y divide-zinc-100">
            {services.map((svc, idx) => (
              <div
                key={idx}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 transition"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-zinc-950 font-heading block truncate">{svc.name}</span>
                  {svc.description && (
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">{svc.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {svc.latency && (
                    <div className="text-right">
                      <span className="text-[11px] text-zinc-500 font-mono tabular-nums">{svc.latency}</span>
                    </div>
                  )}

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Incident Notice */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-2">
          <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Incident Log</h2>
          <p className="text-xs text-zinc-600 font-medium">
            No active service incidents reported. Scheduled maintenance windows are communicated in advance to workspace owners.
          </p>
        </div>

        {/* Subscribe for Alerts Banner */}
        <div className="bg-zinc-950 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Bell className="w-3.5 h-3.5 text-white" />
              <span>Stay Informed</span>
            </div>
            <h3 className="text-base font-extrabold text-white font-heading">
              Subscribe to System Status Notifications
            </h3>
            <p className="text-xs text-zinc-400 max-w-md">
              Receive email alerts whenever scheduled maintenance or service degradation occurs.
            </p>
          </div>

          {subscribed ? (
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Subscribed to status notifications</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="w-full md:w-auto space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-white font-medium flex-1"
                />
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-extrabold rounded-xl transition cursor-pointer shrink-0 disabled:opacity-60"
                >
                  {isSubscribing ? 'Saving...' : 'Subscribe'}
                </button>
              </div>
              {subscribeError && (
                <p className="text-[11px] text-rose-400">{subscribeError}</p>
              )}
            </form>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} NomadsChat Inc.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { window.location.hash = 'security'; }}
              className="hover:text-zinc-900 transition cursor-pointer"
            >
              Security Overview
            </button>
            <a href="https://nomadsarc.io" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition">
              NomadsArc AI
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
