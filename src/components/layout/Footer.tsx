import React, { useState } from 'react';
import { NomadsLogo } from '../common/NomadsLogo';
import { LegalModal } from '../public/LegalModal';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Bot,
  FileText,
  Lock,
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';

interface FooterProps {
  onNavigateTab?: (tab: string) => void;
  onOpenCreateBot?: () => void;
  onOpenAdminPortal?: () => void;
  onOpenAdminAuth?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateTab,
  onOpenCreateBot,
  onOpenAdminPortal,
  onOpenAdminAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'gdpr' | null>(null);

  const handleAdminClick = () => {
    const role = String(user?.role || '').toLowerCase();
    if (isAuthenticated && (role === 'owner' || role === 'admin' || role === 'super_admin')) {
      onOpenAdminPortal?.();
    } else {
      onOpenAdminAuth?.();
    }
  };

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
                type="button"
                onClick={onOpenCreateBot}
                className="bg-white hover:bg-zinc-100 text-black text-xs font-extrabold px-6 py-3 rounded-xl shadow-lg transition duration-200 flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-black" />
                <span>Create New Chatbot</span>
              </button>
            )}
            {onNavigateTab && (
              <button
                type="button"
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
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                NomadsArc Engine Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                SOC2 Certified
              </span>
            </div>

            {/* Social & Community Links */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-2 font-mono">
                Connect &amp; Community
              </span>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://github.com/google-gemini"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Google Gemini GitHub repository"
                  className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                  title="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://x.com/nomadsarc"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="NomadsArc on X / Twitter"
                  className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                  title="X / Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com/company/nomadsarc"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="NomadsArc on LinkedIn"
                  className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://nomadsarc.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="NomadsArc Official Platform"
                  className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-lg px-2.5 py-1.5 bg-zinc-900 hover:border-zinc-700 transition ml-1"
                >
                  <span>nomadsarc.io</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Product Navigation</h4>
            <ul className="space-y-2 text-xs text-zinc-400 font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('overview')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  Dashboard Overview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('chatbots')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  Bot Manager &amp; Custom Colors
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('knowledge')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  AI Training Center (RAG)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('inbox')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  Live Inbox &amp; Human Takeover
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('playground')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  Interactive Playground
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('embed')}
                  className="hover:text-white transition flex items-center gap-1.5 cursor-pointer text-left"
                >
                  Embed Widget Code Guide
                </button>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Resources &amp; Guides</h4>
            <ul className="space-y-2 text-xs text-zinc-400 font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('features')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Complete Feature Suite
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('pricing')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Pricing Plans &amp; Free Trial
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('faq')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Support FAQ &amp; Help Center
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('integrations')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Integrations Marketplace
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('team')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Team &amp; Role Management
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('security')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Security Standards &amp; VDP
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('status')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Edge System Status
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
          <div className="flex items-center gap-4 sm:gap-6 text-zinc-400 flex-wrap justify-center md:justify-end">
            <a href="https://nomadsarc.io" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">NomadsArc Platform</a>
            <button
              type="button"
              onClick={() => setLegalModalType('privacy')}
              className="hover:text-white transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setLegalModalType('terms')}
              className="hover:text-white transition cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setLegalModalType('gdpr')}
              className="hover:text-white transition cursor-pointer"
            >
              GDPR &amp; Deletion
            </button>
            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('security');
                } else {
                  window.location.hash = 'security';
                }
              }}
              className="hover:text-white transition cursor-pointer"
            >
              Security Standards
            </button>
            <button
              type="button"
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab('status');
                } else {
                  window.location.hash = 'status';
                }
              }}
              className="hover:text-white transition cursor-pointer"
            >
              System Status
            </button>
            <button
              type="button"
              onClick={handleAdminClick}
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition font-medium border border-zinc-800 px-2.5 py-1 rounded-md hover:border-zinc-700 bg-zinc-950 cursor-pointer"
            >
              <Lock className="w-3 h-3 text-zinc-400" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>

      </div>

      {legalModalType && (
        <LegalModal
          isOpen={!!legalModalType}
          type={legalModalType}
          onClose={() => setLegalModalType(null)}
        />
      )}
    </footer>
  );
};
