import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  Check,
  Code2,
  Database,
  Globe,
  MessageSquare,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import heroWorkspaceImg from '../../assets/images/hero_nomadschat_workspace_1795073264762.jpg';
import { TestimonialsCarousel } from '../common/TestimonialsCarousel';

interface PublicLandingViewProps {
  onOpenSignup: () => void;
  onOpenSignIn: () => void;
  onTryDemo: () => Promise<void> | void;
  onNavigate: (tab: string) => void;
  isDemoLoading?: boolean;
}

export const PublicLandingView: React.FC<PublicLandingViewProps> = ({
  onOpenSignup,
  onOpenSignIn,
  onTryDemo,
  onNavigate,
  isDemoLoading = false,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const kpis = [
    { value: '< 350ms', label: 'Streaming AI Response Latency' },
    { value: '99.4%', label: 'Source-Grounded RAG Accuracy' },
    { value: '2 min', label: 'Single-Script Widget Embed' },
    { value: '24/7', label: 'Instant Live Human Takeover' },
  ];

  const capabilities = [
    {
      index: '01',
      title: 'Grounded Document & Web RAG',
      description:
        'Ingest live help centers, PDFs, sitemaps, and markdown docs into isolated vector indexes. Every reply is strictly grounded in your verified company sources.',
      highlights: ['URL Crawler & Raw HTML Ingestion', 'Multi-Tenant Vector Isolation', 'Citation Traceability'],
      spanClass: 'md:col-span-2',
      icon: Database,
    },
    {
      index: '02',
      title: 'Live Agent Takeover Inbox',
      description:
        'Seamless human escalation inside one unified workspace inbox with full transcript context and SLA ticket queues.',
      highlights: ['1-Click AI Pause & Takeover', 'Team Assignment & Notes'],
      spanClass: 'md:col-span-1',
      icon: MessageSquare,
    },
    {
      index: '03',
      title: 'Lead Capture & CRM Webhooks',
      description:
        'Qualify visitors directly inside chat and route structured leads to Slack, HubSpot, Zapier, or WhatsApp in real time.',
      highlights: ['Pre-Chat Lead Gates', 'AES-256 Encrypted Integration Keys'],
      spanClass: 'md:col-span-1',
      icon: Users,
    },
    {
      index: '04',
      title: 'Brand-Matched Widget Embed',
      description:
        'Customize colors, typography, welcome prompts, and fallback behavior per assistant. Deploy anywhere with one copy-paste script tag.',
      highlights: ['React, Next.js, Shopify & WordPress', 'Mobile Responsive Breakpoints', 'Custom Domain Allowed Origins'],
      spanClass: 'md:col-span-2',
      icon: Code2,
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-20 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
      {/* Hero Section: Two-column split grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6 py-2">
          <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-800">
            <Sparkles className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
            <span>Enterprise AI Support Platform</span>
          </div>

          <h1 className="text-[clamp(2.25rem,4vw,3.75rem)] font-extrabold tracking-tight leading-[1.06] text-zinc-950 font-heading [text-wrap:balance]">
            Grounded AI customer support, deployed in minutes.
          </h1>

          <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-xl font-medium">
            Train custom AI chatbots on your documentation, websites, and product policies. Resolve visitor questions instantly with source citations and hand off complex threads to human agents without losing context.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onOpenSignup}
              className="px-6 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-bold transition shadow-md flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span>Start Free 3-Day Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onTryDemo}
              disabled={isDemoLoading}
              className="px-5 py-3.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 text-sm font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Play className="w-4 h-4 text-zinc-700" />
              <span>{isDemoLoading ? 'Opening Demo...' : 'Try Live Demo'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs text-zinc-500 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              3-day full access trial
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              $0 due today
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Cancel anytime
            </span>
            <button
              type="button"
              onClick={onOpenSignIn}
              className="text-zinc-900 font-semibold underline underline-offset-4 hover:text-zinc-600 transition cursor-pointer"
            >
              Existing workspace? Sign in
            </button>
          </div>
        </div>

        {/* Hero Visual Container */}
        <div className="lg:col-span-6 flex">
          <div className="w-full min-h-[300px] lg:h-full rounded-2xl border border-zinc-200 bg-zinc-950 overflow-hidden shadow-xl relative flex items-center justify-center">
            {!heroImgFailed ? (
              <img
                src={heroWorkspaceImg}
                alt="NomadsChat workspace showing grounded AI chat responses and live team inbox"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-8 text-white space-y-4 w-full max-w-md">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-white" />
                    <span className="text-sm font-bold">NomadsChat Assistant</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">RAG Grounded</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-200 leading-relaxed">
                  Your shipping &amp; return documentation is indexed and verified across 42 knowledge chunks. Visitors receive cited answers under 350ms.
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4-Column Architectural KPI Strip */}
      <section aria-label="Platform performance benchmarks" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((item) => (
          <div
            key={item.label}
            className="bg-white border border-zinc-200 rounded-2xl p-5 sm:p-6 shadow-xs"
          >
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-mono tabular-nums">
              {item.value}
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1.5 leading-snug">
              {item.label}
            </p>
          </div>
        ))}
      </section>

      {/* Asymmetric Bento Capabilities */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Platform Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight font-heading">
              Everything required to run production AI support
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('features')}
            className="self-start sm:self-auto text-xs font-bold text-zinc-900 hover:text-zinc-600 inline-flex items-center gap-1.5 border border-zinc-200 bg-white px-4 py-2 rounded-xl transition cursor-pointer"
          >
            <span>Explore Full Feature Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.index}
                className={`${cap.spanClass} bg-white border border-zinc-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs hover:border-zinc-400 transition`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-zinc-400">{cap.index}</span>
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-950 font-heading tracking-tight">
                    {cap.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
                    {cap.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100">
                  {cap.highlights.map((hl) => (
                    <span
                      key={hl}
                      className="text-[11px] font-medium text-zinc-700 bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg"
                    >
                      {hl}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Customer Success Carousel */}
      <TestimonialsCarousel />

      {/* Bottom Conversion Banner */}
      <section className="bg-zinc-950 text-white rounded-3xl p-8 sm:p-10 border border-zinc-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>3-Day Full-Access Trial · $0 Due Today</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            Launch your first grounded AI assistant today
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Create a workspace in seconds, connect your help docs or website URL, and test responses inside the live sandbox before embedding.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('pricing')}
            className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-bold transition cursor-pointer"
          >
            View Pricing Plans
          </button>
          <button
            type="button"
            onClick={onTryDemo}
            disabled={isDemoLoading}
            className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Try Live Demo</span>
          </button>
          <button
            type="button"
            onClick={onOpenSignup}
            className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-extrabold transition cursor-pointer inline-flex items-center gap-1.5 shadow-md"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Start Free 3-Day Trial</span>
          </button>
        </div>
      </section>
    </div>
  );
};
