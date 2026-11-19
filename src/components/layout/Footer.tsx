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
  AlertCircle,
} from 'lucide-react';

interface FooterProps {
  onNavigateTab?: (tab: string) => void;
  onOpenCreateBot?: () => void;
  onOpenAuthModal?: () => void;
  onOpenAdminPortal?: () => void;
  onOpenAdminAuth?: () => void;
}

const PUBLIC_TABS = new Set(['landing', 'features', 'pricing', 'faq', 'help', 'security', 'status']);

export const Footer: React.FC<FooterProps> = ({
  onNavigateTab,
  onOpenCreateBot,
  onOpenAuthModal,
  onOpenAdminPortal,
  onOpenAdminAuth,
}) => {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'gdpr' | null>(null);

  const handleAdminClick = () => {
    if (onOpenAdminPortal) {
      onOpenAdminPortal();
    } else if (onOpenAdminAuth) {
      onOpenAdminAuth();
    } else {
      window.location.hash = 'admin';
    }
  };

  const handleLinkClick = (tab: string) => {
    if (!isAuthenticated && !PUBLIC_TABS.has(tab)) {
      onOpenAuthModal?.();
      return;
    }
    onNavigateTab?.(tab);
  };

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
        body: JSON.stringify({ email: trimmed, source: 'footer' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not subscribe at this moment.');
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
    <footer className="bg-black text-white border-t border-zinc-800 mt-12 pt-12 pb-8 px-6 md:px-12 w-full font-sans shrink-0">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Callout Banner */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-black border border-zinc-700 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Instant NomadsArc AI Deployment</span>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight font-heading">
              Ready to automate customer support with NomadsChat?
            </h3>
            <p className="text-xs text-zinc-400 font-medium max-w-xl">
              Create your custom grounded AI chatbot, customize theme colors, upload knowledge sources, and embed in under 2 minutes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => (isAuthenticated ? onOpenCreateBot?.() : onOpenAuthModal?.())}
              className="bg-white hover:bg-zinc-100 text-black text-xs font-extrabold px-6 py-3 rounded-xl shadow-lg transition duration-200 flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-black" />
              <span>{isAuthenticated ? 'Create New Chatbot' : 'Start Free 3-Day Trial'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick(isAuthenticated ? 'knowledge' : 'pricing')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold px-5 py-3 rounded-xl border border-zinc-700 transition duration-200 flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>{isAuthenticated ? 'AI Training Center' : 'View Pricing'}</span>
            </button>
          </div>
        </div>

        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pt-4">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <NomadsLogo showText textClassName="text-xl font-extrabold text-white tracking-tight" />
            <p className="text-xs text-zinc-400 font-medium leading-relaxed max-w-sm">
              NomadsChat is the enterprise AI customer support platform built on NomadsArc architecture. Deliver grounded support across web channels 24/7.
            </p>
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-white">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                NomadsArc Engine Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
                AES-256 &amp; TLS 1.3
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
                  onClick={() => handleLinkClick(isAuthenticated ? 'overview' : 'landing')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  {isAuthenticated ? 'Dashboard Overview' : 'Product Overview'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLinkClick('chatbots')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Bot Manager &amp; Themes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLinkClick('knowledge')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  AI Training Center (RAG)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLinkClick('inbox')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Live Inbox &amp; Human Takeover
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLinkClick('playground')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Interactive Playground
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLinkClick('embed')}
                  className="hover:text-white transition cursor-pointer text-left"
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
                  onClick={() => handleLinkClick('integrations')}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Integrations Marketplace
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleLinkClick('team')}
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
            <p className="text-xs text-zinc-400 font-medium">
              Get product releases and NomadsArc grounding updates.
            </p>
            {subscribed ? (
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs text-white font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
                {subscribeError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{subscribeError}</span>
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="w-full bg-white hover:bg-zinc-100 text-black text-xs font-extrabold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <span>{isSubscribing ? 'Subscribing...' : 'Subscribe'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-medium">
          <p>
            © {new Date().getFullYear()} NomadsChat. Powered by{' '}
            <a
              href="https://nomadsarc.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline font-extrabold text-white inline-flex items-center gap-1"
            >
              NomadsArc <ExternalLink className="w-3 h-3" />
            </a>
            . All rights reserved.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-zinc-400 flex-wrap justify-center md:justify-end">
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
