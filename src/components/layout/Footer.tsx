import React, { useState } from 'react';
import { NomadsLogo } from '../common/NomadsLogo';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, MessageSquare, Bot, HelpCircle, FileText, Lock, Globe, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigateTab?: (tab: string) => void;
  onOpenCreateBot?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateTab, onOpenCreateBot }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-black text-white border-t border-zinc-800 mt-16 pt-12 pb-8 px-6 md:px-12 w-full font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Callout Banner */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-black border border-zinc-700 text-white px-3 py-1 rounded-full text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Instant NomadsArc AI Deployment</span>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Ready to automate customer support with NomadsChat?
            </h3>
            <p className="text-xs text-zinc-400 font-medium max-w-xl">
              Create your custom grounded AI chatbot, customize theme colors, upload knowledge sources, and embed in under 2 minutes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenCreateBot && (
              <button
                onClick={onOpenCreateBot}
                className="bg-white hover:bg-zinc-100 text-black text-xs font-extrabold px-6 py-3 rounded-xl shadow-lg transition duration-200 flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-black" />
                <span>Create New Chatbot</span>
              </button>
            )}
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('knowledge')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-5 py-3 rounded-xl border border-zinc-700 transition duration-200 flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-white" />
                <span>AI Training Center</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pt-4">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <NomadsLogo showText textClassName="text-xl font-extrabold text-white tracking-tight" />
            <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-sm">
              NomadsChat is the enterprise-grade AI customer support platform built on NomadsArc AI architecture. Deliver grounded, hallucination-free support across all web channels 24/7.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                NomadsArc Engine Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                SOC2 Certified
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Product Navigation</h4>
            <ul className="space-y-2 text-xs text-zinc-400 font-medium">
              <li>
                <button
                  onClick={() => onNavigateTab?.('overview')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  Dashboard Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab?.('chatbots')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  Bot Manager & Custom Colors
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab?.('knowledge')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  AI Training Center (RAG)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab?.('inbox')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  Live Inbox & Human Takeover
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab?.('playground')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  Interactive Playground
                </button>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Resources & Guides</h4>
            <ul className="space-y-2 text-xs text-zinc-400 font-medium">
              <li>
                <button
                  onClick={() => onNavigateTab?.('features')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Complete Feature Suite
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab?.('pricing')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Pricing Plans & Free Trial
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab?.('faq')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Support FAQ & Help Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab?.('integrations')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Integrations Marketplace
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab?.('team')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Team & Role Management
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateTab?.('embed')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Embed Widget Code Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Subscription */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Stay Updated</h4>
            <p className="text-xs text-zinc-400 font-medium">Get the latest AI support techniques and NomadsArc grounding updates.</p>
            {subscribed ? (
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Subscribed successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-white font-medium"
                />
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-zinc-100 text-black text-xs font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>Subscribe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-medium">
          <p>© 2026 NomadsChat. Powered by <a href="https://nomadsarc.io" target="_blank" rel="noopener noreferrer" className="hover:underline font-extrabold text-white inline-flex items-center gap-1">NomadsArc <ExternalLink className="w-3 h-3" /></a>. All rights reserved.</p>
          <div className="flex items-center gap-6 text-zinc-400">
            <a href="https://nomadsarc.io" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">NomadsArc Platform</a>
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <a
              href="#security"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateTab) {
                  onNavigateTab('security');
                } else {
                  window.location.hash = 'security';
                }
              }}
              className="hover:text-white transition cursor-pointer"
            >
              Security Standards
            </a>
            <a
              href="#status"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigateTab) {
                  onNavigateTab('status');
                } else {
                  window.location.hash = 'status';
                }
              }}
              className="hover:text-white transition cursor-pointer"
            >
              System Status
            </a>
            <a
              href="#admin"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = 'admin';
              }}
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition font-medium border border-zinc-800 px-2 py-0.5 rounded-md hover:border-zinc-700 bg-zinc-950"
            >
              <Lock className="w-3 h-3 text-zinc-400" />
              <span>Admin Portal</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
