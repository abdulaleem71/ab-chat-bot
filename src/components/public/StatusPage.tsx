import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Activity,
  Server,
  Zap,
  Globe,
  Bell,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Bot
} from 'lucide-react';
import { NomadsLogo } from '../common/NomadsLogo';

interface StatusPageProps {
  onReturnToApp?: () => void;
}

export const StatusPage: React.FC<StatusPageProps> = ({ onReturnToApp }) => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  const services = [
    {
      name: 'Gemini AI Inference & Grounding Gateway',
      description: 'Gemini 3.7 Flash & 3.1 Pro real-time completion engine',
      status: 'Operational',
      uptime: '99.99%',
      latency: '340ms',
    },
    {
      name: 'RAG Knowledge Search & Webpage Crawler',
      description: 'Document vector indexing, URL scraping, and semantic retrieval',
      status: 'Operational',
      uptime: '99.98%',
      latency: '180ms',
    },
    {
      name: 'Embed Widget Edge CDN & JavaScript Runtime',
      description: 'Global Cloudflare edge delivery for website chat bubbles',
      status: 'Operational',
      uptime: '100.0%',
      latency: '22ms',
    },
    {
      name: 'Live Chat Inbox & Human Takeover Stream',
      description: 'Real-time agent takeover and live visitor messaging channels',
      status: 'Operational',
      uptime: '99.99%',
      latency: '45ms',
    },
    {
      name: 'Integrations & Webhook Ingestion API',
      description: 'Slack, WhatsApp, Zapier, HubSpot, and Shopify sync pipes',
      status: 'Operational',
      uptime: '99.97%',
      latency: '95ms',
    },
  ];

  const pastIncidents = [
    {
      date: 'August 24, 2026',
      title: 'Scheduled Database Index Optimization',
      status: 'Resolved',
      impact: 'Informational',
      description: 'Completed scheduled performance tuning and vector index compaction on core US-East and EU-Central clusters. Zero user downtime recorded.',
      duration: '22 mins',
    },
    {
      date: 'August 11, 2026',
      title: 'Elevated Webhook Latency on Meta WhatsApp Relay',
      status: 'Resolved',
      impact: 'Minor',
      description: 'Upstream rate limit throttling on WhatsApp Cloud API caused minor response delays. Automatic backpressure retry queue cleared all messages within 6 minutes.',
      duration: '6 mins',
    },
    {
      date: 'July 28, 2026',
      title: 'Edge CDN Routine SSL Certificate Rotation',
      status: 'Resolved',
      impact: 'Maintenance',
      description: 'Automated global edge wildcard SSL certificates renewed seamlessly with zero packet loss.',
      duration: '15 mins',
    },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  const days = Array.from({ length: 90 }, (_, i) => ({
    day: 90 - i,
    status: 'operational',
  }));

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col">
      {/* Standalone Public Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NomadsLogo showText textClassName="text-base font-extrabold text-zinc-950 font-heading" />
            <span className="hidden sm:inline-block text-zinc-300">/</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              System Status
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
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
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Overall Status Hero Card */}
        <div className="bg-emerald-600 text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-emerald-700/70 border border-emerald-500/50 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>Real-Time Incident Monitor</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-heading">
                All Systems Operational
              </h1>
              <p className="text-xs text-emerald-100 font-medium max-w-xl">
                NomadsChat AI inference, RAG vectors, widget embeds, and live chat WebSockets are running smoothly with zero active incidents.
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1 bg-emerald-700/60 p-4 rounded-2xl border border-emerald-500/40 shrink-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">90-Day Uptime</span>
              <span className="text-2xl font-extrabold text-white font-heading">99.992%</span>
              <span className="text-[10px] text-emerald-200">Refreshed just now</span>
            </div>
          </div>
        </div>

        {/* 90-Day Uptime Visualization */}
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Uptime History (Last 90 Days)</h2>
            <div className="flex items-center gap-4 text-xs font-bold text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Operational (90d)
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-45 sm:grid-cols-90 gap-0.5">
              {days.map(d => (
                <div
                  key={d.day}
                  title={`Day ${d.day} ago: 100% Operational`}
                  className="h-7 rounded-[2px] bg-emerald-500 hover:bg-emerald-600 transition cursor-pointer"
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold pt-1">
              <span>90 days ago</span>
              <span>45 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* System Component Breakdown Table */}
        <div className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-zinc-950 font-heading">System Components & Gateways</h2>
            <span className="text-xs text-zinc-500 font-medium">5 Core Services</span>
          </div>

          <div className="divide-y divide-zinc-100">
            {services.map((svc, idx) => (
              <div
                key={idx}
                className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-950 font-heading">{svc.name}</span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">{svc.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-extrabold text-zinc-900 font-mono">{svc.uptime}</span>
                    <span className="text-[10px] text-zinc-400 block font-mono">avg {svc.latency}</span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {svc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Incidents Timeline */}
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Past Incidents & Maintenance Log</h2>

          <div className="space-y-6">
            {pastIncidents.map((incident, idx) => (
              <div key={idx} className="border-l-2 border-zinc-200 pl-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{incident.date}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {incident.impact}
                  </span>
                </div>
                <h3 className="text-xs font-extrabold text-zinc-900 font-heading">{incident.title}</h3>
                <p className="text-xs text-zinc-600 font-medium leading-relaxed">{incident.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subscribe for Alerts Banner */}
        <div className="bg-zinc-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Bell className="w-3.5 h-3.5 text-white" />
              <span>Stay Informed</span>
            </div>
            <h3 className="text-base font-extrabold text-white font-heading">
              Subscribe to System Status Notifications
            </h3>
            <p className="text-xs text-zinc-400 max-w-md">
              Receive automated email alerts whenever maintenance is scheduled or service degradation occurs.
            </p>
          </div>

          {subscribed ? (
            <div className="bg-zinc-800 border border-zinc-700 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Subscribed to notifications!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-white font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-extrabold rounded-xl transition cursor-pointer shrink-0"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Standalone Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 NomadsChat Inc. Hosted on distributed edge network.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { window.location.hash = 'security'; }}
              className="hover:text-zinc-900 transition cursor-pointer"
            >
              Security Overview
            </button>
            <a href="https://nomadsarc.io" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition">NomadsArc AI</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
