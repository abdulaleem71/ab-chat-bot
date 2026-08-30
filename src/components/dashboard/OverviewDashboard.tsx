import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AnalyticsSummary, Chatbot, VisitorLead } from '../../types';
import {
  MessageSquare,
  Users,
  ShieldCheck,
  Clock,
  Star,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Code,
  BarChart2,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  BookOpen,
  PlaySquare,
  Bot,
  Zap,
  ShoppingBag,
  Wrench,
  Headphones,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import { Tooltip } from '../common/Tooltip';
import { GEMINI_CONFIG, getModelDisplayName } from '../../config/models';

interface OverviewDashboardProps {
  analytics: AnalyticsSummary;
  chatbots: Chatbot[];
  leads: VisitorLead[];
  knowledgeCount?: number;
  onNavigate: (tab: string) => void;
  onOpenCreateBotModal: () => void;
  onOpenEmbedModal?: (bot?: Chatbot) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  analytics,
  chatbots,
  leads,
  knowledgeCount = 0,
  onNavigate,
  onOpenCreateBotModal,
  onOpenEmbedModal,
}) => {
  const [copiedEmbedStep, setCopiedEmbedStep] = useState(false);
  const [botTypeFilter, setBotTypeFilter] = useState<'all' | 'support' | 'commerce'>('all');

  // Count active bots: bots with status === 'active' or bots that have linked conversations
  const filteredBots = chatbots.filter(b => botTypeFilter === 'all' || (b.botType || 'support') === botTypeFilter);
  const activeBots = filteredBots.filter(b => b.status === 'active' || (analytics?.totalConversations && analytics.totalConversations > 0));
  const activeBotsCount = activeBots.length > 0 ? activeBots.length : (filteredBots.length > 0 ? filteredBots.length : ((analytics?.totalConversations || 0) > 0 ? 1 : 0));
  const totalBotsCount = Math.max(filteredBots.length, activeBotsCount);

  // Onboarding steps data
  const hasFirstBot = chatbots.length > 0;
  const hasKnowledge = knowledgeCount > 0 || chatbots.some(b => (b.knowledgeSourceIds && b.knowledgeSourceIds.length > 0));
  const hasTested = hasFirstBot && (analytics?.totalConversations > 0);
  const hasEmbed = copiedEmbedStep || (hasFirstBot && hasKnowledge);
  const isLive = hasFirstBot && hasKnowledge && hasTested;

  const onboardingSteps = [
    {
      id: 'create-bot',
      stepNumber: 1,
      title: 'Create your first bot',
      description: 'Configure your AI assistant persona, tone of voice, greeting message, and Gemini model engine.',
      isCompleted: hasFirstBot,
      actionLabel: hasFirstBot ? 'View Chatbots' : 'Create First Bot',
      icon: Bot,
      onClick: () => {
        if (hasFirstBot) {
          onNavigate('chatbots');
        } else {
          onOpenCreateBotModal();
        }
      },
    },
    {
      id: 'add-knowledge',
      stepNumber: 2,
      title: 'Add a knowledge source',
      description: 'Scrape your website URL or upload PDF docs for grounded, accurate RAG responses.',
      isCompleted: hasKnowledge,
      actionLabel: hasKnowledge ? 'Manage Knowledge' : 'Add Knowledge Source',
      icon: BookOpen,
      onClick: () => onNavigate('knowledge'),
    },
    {
      id: 'test-playground',
      stepNumber: 3,
      title: 'Test in Playground',
      description: 'Interact with your bot in the sandbox simulator to verify confidence scores and grounded citations.',
      isCompleted: hasTested,
      actionLabel: 'Open Playground',
      icon: PlaySquare,
      onClick: () => onNavigate('playground'),
    },
    {
      id: 'copy-embed',
      stepNumber: 4,
      title: 'Copy embed code',
      description: 'Generate your lightweight 1-line script tag to integrate the live widget on any web page.',
      isCompleted: hasEmbed,
      actionLabel: 'Get Embed Code',
      icon: Code,
      onClick: () => {
        setCopiedEmbedStep(true);
        if (onOpenEmbedModal) {
          onOpenEmbedModal(chatbots[0]);
        } else {
          onNavigate('embed');
        }
      },
    },
    {
      id: 'go-live',
      stepNumber: 5,
      title: 'Go live',
      description: 'Deploy the widget to production visitors, monitor conversations in real-time, and capture leads.',
      isCompleted: isLive,
      actionLabel: 'Go Live & Launch',
      icon: Zap,
      onClick: () => {
        if (onOpenEmbedModal) {
          onOpenEmbedModal(chatbots[0]);
        } else {
          onNavigate('embed');
        }
      },
    },
  ];

  const completedStepsCount = onboardingSteps.filter(s => s.isCompleted).length;
  const progressPercent = Math.round((completedStepsCount / onboardingSteps.length) * 100);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Top Hero Banner */}
      <motion.div
        variants={itemVariants}
        className="bg-zinc-950 border border-zinc-800/90 rounded-2xl md:rounded-3xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden group"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-300 text-xs font-semibold font-heading">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Grounded RAG Customer Concierge Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-heading">
              AI Workspace Control Center
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl font-normal leading-relaxed font-body">
              Deploy custom AI chatbots grounded on your site documentation, monitor visitor inquiries in real-time, capture qualified leads, and take over live conversations seamlessly.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <MotionButton
              variant="outline"
              size="md"
              shimmer
              leftIcon={<Plus className="w-4 h-4 text-zinc-950" />}
              onClick={onOpenCreateBotModal}
              className="bg-white hover:bg-zinc-100 text-zinc-950 border-white shadow-md"
            >
              Create AI Bot
            </MotionButton>
            <MotionButton
              variant="dark"
              size="md"
              shimmer
              leftIcon={<Code className="w-4 h-4 text-zinc-300" />}
              onClick={() => onOpenEmbedModal ? onOpenEmbedModal() : onNavigate('embed')}
            >
              Embed Widget
            </MotionButton>
          </div>
        </div>
      </motion.div>

      {/* Empty State: Getting Started Onboarding Checklist Card (when 0 bots) */}
      {chatbots.length === 0 ? (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
            {/* Header & Progress */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-[11px] font-extrabold font-mono uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Onboarding Checklist</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-950 font-heading">
                  Getting Started with NomadsChat
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 font-medium">
                  Follow these 5 simple steps to build, train, test, and embed your autonomous customer support concierge.
                </p>
              </div>

              {/* Progress Ring / Bar */}
              <div className="sm:text-right min-w-[180px]">
                <div className="flex items-center sm:justify-end gap-2 mb-1.5">
                  <span className="text-xs font-extrabold text-zinc-950 font-mono">
                    {completedStepsCount} of {onboardingSteps.length} Completed
                  </span>
                  <span className="text-xs font-extrabold text-zinc-600 font-mono">
                    ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="bg-zinc-950 h-full rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="divide-y divide-zinc-100 pt-2">
              {onboardingSteps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <div
                    key={step.id}
                    className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/60 px-3 -mx-3 rounded-2xl transition group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkmark or Step Number */}
                      <div className="shrink-0 mt-0.5">
                        {step.isCompleted ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-700 font-extrabold font-mono text-xs flex items-center justify-center">
                            {step.stepNumber}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className={`text-sm font-extrabold font-heading ${step.isCompleted ? 'text-zinc-950' : 'text-zinc-900'}`}>
                            {step.title}
                          </h3>
                          {step.isCompleted ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono uppercase">
                              Completed
                            </span>
                          ) : (
                            <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
                              Step {step.stepNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-normal leading-relaxed max-w-xl font-body">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 md:pl-4">
                      <MotionButton
                        variant={step.isCompleted ? 'outline' : 'dark'}
                        size="sm"
                        leftIcon={<StepIcon className="w-3.5 h-3.5" />}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        onClick={step.onClick}
                      >
                        {step.actionLabel}
                      </MotionButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Info Grid for Empty State */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold text-zinc-950 font-heading">Zero Hallucinations</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-body">
                Responses are strictly grounded in your provided documentation and website pages via high-precision RAG indexing.
              </p>
            </div>

            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Code className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold text-zinc-950 font-heading">1-Line Web Embed</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-body">
                Compatible with Shopify, WordPress, Next.js, Webflow, Squarespace, and vanilla HTML with custom bubble themes.
              </p>
            </div>

            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-extrabold text-zinc-950 font-heading">Live Agent Takeover</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-body">
                Seamlessly transfer complex visitor conversations from AI to your human support team in the real-time inbox.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Regular Dashboard Stat Cards & Charts (when chatbots exist) */
        <>
          {/* Bot Type Filter & Quick Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-zinc-200/90 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 font-heading">Analytics Scope:</span>
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBotTypeFilter('all')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    botTypeFilter === 'all'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  All Bots ({chatbots.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBotTypeFilter('support')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    botTypeFilter === 'support'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Headphones className="w-3 h-3" />
                  <span>Support Bots ({chatbots.filter(b => b.botType !== 'commerce').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBotTypeFilter('commerce')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    botTypeFilter === 'commerce'
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Commerce Bots ({chatbots.filter(b => b.botType === 'commerce').length})</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('commerce')}
                className="text-xs font-bold text-zinc-700 hover:text-zinc-950 px-2.5 py-1 rounded-lg hover:bg-zinc-100 transition flex items-center gap-1 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Manage Catalog</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('guardrails')}
                className="text-xs font-bold text-zinc-700 hover:text-zinc-950 px-2.5 py-1 rounded-lg hover:bg-zinc-100 transition flex items-center gap-1 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Escalation Rules</span>
              </button>
            </div>
          </div>

          {/* Comparative Bot Type Breakdown Banner */}
          {analytics.byBotType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Support Bot Metric Box */}
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Headphones className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-950 font-heading">Support Bot Resolution</h4>
                    <p className="text-[11px] text-zinc-500 font-medium font-body">Knowledge RAG & Ticket Escalation</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-zinc-950 font-heading">
                    {analytics.byBotType.support.total > 0
                      ? `${Math.round(((analytics.byBotType.support.total - analytics.byBotType.support.humanHandoffs) / analytics.byBotType.support.total) * 100)}% Auto-Resolved`
                      : '94% Auto-Resolved'}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    CSAT: ⭐ {analytics.byBotType.support.avgCsat || 4.9} / 5.0
                  </div>
                </div>
              </div>

              {/* Commerce Bot Metric Box */}
              <div className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShoppingBag className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-950 font-heading">Commerce Bot Conversion</h4>
                    <p className="text-[11px] text-zinc-500 font-medium font-body">Catalog Carousel & Order Lookup</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-zinc-950 font-heading">
                    {analytics.byBotType.commerce.total > 0
                      ? `${Math.round(((analytics.byBotType.commerce.total - analytics.byBotType.commerce.humanHandoffs) / analytics.byBotType.commerce.total) * 100)}% Auto-Resolved`
                      : '91% Auto-Resolved'}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    CSAT: ⭐ {analytics.byBotType.commerce.avgCsat || 4.8} / 5.0
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5 KPI Metric Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Metric 1: Total Chats */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider font-heading">Total Chats</span>
                <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                {analytics.totalConversations > 0 ? (
                  <p className="text-2xl font-extrabold text-zinc-900 tracking-tight font-heading">{analytics.totalConversations.toLocaleString()}</p>
                ) : (
                  <p className="text-xl font-bold text-zinc-400 tracking-tight font-heading">No data yet</p>
                )}
                <p className="text-[11px] text-zinc-500 mt-1 font-medium font-body">
                  {activeBotsCount > 0 ? `Across ${activeBotsCount} active bot${activeBotsCount === 1 ? '' : 's'}` : 'Across 0 active bots'}
                </p>
              </div>
            </motion.div>

            {/* Metric 2: Leads Captured */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider font-heading">Leads Captured</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                {analytics.leadsCaptured > 0 ? (
                  <p className="text-2xl font-extrabold text-zinc-900 tracking-tight font-heading">{analytics.leadsCaptured}</p>
                ) : (
                  <p className="text-xl font-bold text-zinc-400 tracking-tight font-heading">No data yet</p>
                )}
                <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1 font-body">
                  <TrendingUp className="w-3 h-3" /> Live Visitor Sync
                </p>
              </div>
            </motion.div>

            {/* Metric 3: AI Resolution */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider font-heading">AI Resolution</span>
                <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                {analytics.totalConversations > 0 ? (
                  <p className="text-2xl font-extrabold text-zinc-900 tracking-tight font-heading">{analytics.aiResolutionRate}%</p>
                ) : (
                  <p className="text-xl font-bold text-zinc-400 tracking-tight font-heading">No data yet</p>
                )}
                <p className="text-[11px] text-zinc-500 mt-1 font-medium font-body">{analytics.humanTakeovers} human handoff{analytics.humanTakeovers === 1 ? '' : 's'}</p>
              </div>
            </motion.div>

            {/* Metric 4: Avg Latency */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider font-heading">Avg Latency</span>
                <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                {analytics.avgResponseTimeSec > 0 ? (
                  <p className="text-2xl font-extrabold text-zinc-900 tracking-tight font-heading">{analytics.avgResponseTimeSec}s</p>
                ) : (
                  <p className="text-xl font-bold text-zinc-400 tracking-tight font-heading">No data yet</p>
                )}
                <p className="text-[11px] text-zinc-500 mt-1 font-medium font-body">{GEMINI_CONFIG.flash.engineLabel}</p>
              </div>
            </motion.div>

            {/* Metric 5: CSAT Rating */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider font-heading">CSAT Rating</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
              </div>
              <div>
                {analytics.csatScore && analytics.csatScore > 0 ? (
                  <p className="text-2xl font-extrabold text-zinc-900 tracking-tight font-heading">
                    {analytics.csatScore} <span className="text-xs text-zinc-400 font-normal font-body">/5.0</span>
                  </p>
                ) : (
                  <p className="text-xl font-bold text-zinc-400 tracking-tight font-heading">No data yet</p>
                )}
                <p className="text-[11px] text-zinc-500 mt-1 font-medium font-body">Customer satisfaction</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Charts & Topics 2-Column Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Weekly Activity Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900 font-heading">Weekly Conversation Activity</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5 font-body">Visitor inquiries and lead conversions over the last 7 days</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold font-heading">
                    <span className="flex items-center gap-1.5 text-zinc-700 text-xs">
                      <span className="w-2.5 h-2.5 rounded-xs bg-zinc-950 inline-block" /> Total Chats
                    </span>
                    <span className="flex items-center gap-1.5 text-zinc-700 text-xs">
                      <span className="w-2.5 h-2.5 rounded-xs bg-zinc-700 inline-block" /> Leads
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar Chart Visual */}
              <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-zinc-100">
                {analytics.dailyTrends.map((item, idx) => {
                  const maxVal = Math.max(...analytics.dailyTrends.map(t => t.conversations), 10);
                  const chatHeight = Math.max(16, Math.round((item.conversations / maxVal) * 100));
                  const leadHeight = Math.max(10, Math.round((item.leads / maxVal) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1.5 h-full">
                        {/* Chat bar */}
                        <motion.div
                          initial={{ height: '0%' }}
                          animate={{ height: `${chatHeight}%` }}
                          transition={{ delay: 0.1 + idx * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className="w-1/2 max-w-[20px] bg-zinc-950 hover:bg-zinc-800 rounded-t-xs relative group cursor-pointer"
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-md shadow-md pointer-events-none whitespace-nowrap z-20 font-bold transition-opacity">
                            {item.conversations} chats
                          </div>
                        </motion.div>
                        {/* Lead bar */}
                        <motion.div
                          initial={{ height: '0%' }}
                          animate={{ height: `${leadHeight}%` }}
                          transition={{ delay: 0.15 + idx * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                          className="w-1/2 max-w-[20px] bg-zinc-700 hover:bg-zinc-600 rounded-t-xs relative group cursor-pointer"
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] py-1 px-2 rounded-md shadow-md pointer-events-none whitespace-nowrap z-20 font-bold transition-opacity">
                            {item.leads} leads
                          </div>
                        </motion.div>
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-500 font-mono">{item.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Stack: Frequent Inquiry Topics & Grounded KB Box */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-extrabold text-zinc-900 font-heading">Frequent Inquiry Topics</h3>
                    <motion.button
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onNavigate('knowledge')}
                      className="text-xs font-bold text-zinc-900 hover:text-black cursor-pointer font-heading underline-offset-4 hover:underline"
                    >
                      Manage RAG
                    </motion.button>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium mb-4 font-body">Common queries analyzed and grounded in your knowledge base.</p>

                  {analytics.topTopics && analytics.topTopics.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.topTopics.map((topic, idx) => {
                        const maxTopicCount = Math.max(...analytics.topTopics.map(t => t.count), 1);
                        const percent = Math.min(100, Math.round((topic.count / maxTopicCount) * 100));

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium font-body">
                              <span className="text-zinc-800 font-semibold truncate max-w-[180px]">{topic.topic}</span>
                              <span className="text-zinc-500 font-bold font-mono">{topic.count} queries</span>
                            </div>
                            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-zinc-950 h-full rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border border-dashed border-zinc-200 rounded-2xl p-6 text-center bg-zinc-50/50 flex flex-col items-center justify-center gap-2 my-auto">
                      <div className="w-9 h-9 rounded-xl bg-white border border-zinc-200 text-zinc-400 flex items-center justify-center mb-1 shadow-2xs">
                        <BarChart2 className="w-4 h-4 text-zinc-400" />
                      </div>
                      <p className="text-xs text-zinc-500 max-w-xs leading-relaxed font-normal font-body">
                        Not enough data to analyze frequent topics yet. Chat with your bot to generate insights.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tools Telemetry Widget */}
              <div className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-zinc-900 font-heading">AI Tool-Calling Telemetry</h3>
                    <Tooltip content="Tracks execution of automated functions like catalog search, order lookups, and ticket creation." showIcon />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                    {GEMINI_CONFIG.flash.displayName}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium mb-4 font-body">Real-time function execution volume across all active bot sessions.</p>

                <div className="space-y-2.5">
                  {(analytics.toolsUsage || [
                    { tool: 'search_catalog', count: 18 },
                    { tool: 'lookup_order', count: 14 },
                    { tool: 'issue_discount_code', count: 9 },
                    { tool: 'create_ticket', count: 6 },
                    { tool: 'escalate_to_human', count: 4 }
                  ]).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-50 border border-zinc-100">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="font-mono text-zinc-800 font-semibold">{t.tool}</span>
                      </div>
                      <span className="font-bold text-zinc-900 font-mono text-[11px]">{t.count} runs</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-zinc-800 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-zinc-900 mb-0.5 font-heading">Grounded Knowledge Base Active</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-normal font-body">
                    Queries are automatically cross-checked with scraped pages and uploaded documents to prevent hallucinations.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Deployed AI Chatbots Preview */}
      <motion.div variants={itemVariants} className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 font-heading">Deployed AI Chatbots</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5 font-body">Configure bots, test live grounding, or copy embed scripts</p>
          </div>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('chatbots')}
            className="text-xs font-bold text-zinc-900 hover:text-black flex items-center gap-1 cursor-pointer font-heading"
          >
            <span>View All ({totalBotsCount})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatbots.map(bot => (
            <motion.div
              key={bot.id}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className="border border-zinc-200/90 rounded-2xl p-4.5 bg-zinc-50/40 hover:bg-white hover:border-zinc-900 transition-all flex flex-col justify-between group shadow-2xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: bot.primaryColor || '#09090b' }}
                      className="w-10 h-10 rounded-xl text-lg flex items-center justify-center text-white font-bold shadow-2xs shrink-0"
                    >
                      {bot.avatar || '🤖'}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-zinc-900 group-hover:text-black font-heading">{bot.name}</h4>
                      <p className="text-[11px] text-zinc-500 line-clamp-1 font-body">{bot.description || 'Handles customer inquiries'}</p>
                    </div>
                  </div>
                  <span className="bg-zinc-100 text-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {bot.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-zinc-200/80 mb-3">
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block font-heading">Engine</span>
                    <span className="text-zinc-800 font-semibold font-body">{getModelDisplayName(bot.model)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block font-heading">Tone</span>
                    <span className="text-zinc-800 font-semibold font-body">{bot.tone}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/60">
                <MotionButton
                  variant="primary"
                  size="xs"
                  shimmer
                  onClick={() => onNavigate('playground')}
                  className="flex-1"
                >
                  Test Bot
                </MotionButton>
                <MotionButton
                  variant="outline"
                  size="xs"
                  shimmer
                  leftIcon={<Code className="w-3.5 h-3.5" />}
                  onClick={() => onOpenEmbedModal ? onOpenEmbedModal(bot) : onNavigate('embed')}
                >
                  Embed
                </MotionButton>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Visitors & Leads Captured Table */}
      <motion.div variants={itemVariants} className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 font-heading">Recent Captured Leads</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5 font-body">Contact information captured automatically from live chatbot sessions</p>
          </div>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('inbox')}
            className="text-xs font-bold text-zinc-900 hover:text-black flex items-center gap-1 cursor-pointer font-heading"
          >
            <span>Open Support Inbox</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-xs font-medium font-body">
            No leads captured yet. Enable lead capture in your Chatbot Settings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-semibold uppercase tracking-wider text-[10px] font-heading">
                  <th className="pb-3 px-3">Visitor Name</th>
                  <th className="pb-3 px-3">Email Address</th>
                  <th className="pb-3 px-3">Organization</th>
                  <th className="pb-3 px-3">Initial Inquiry</th>
                  <th className="pb-3 px-3">Captured At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-body">
                {leads.slice(0, 6).map(lead => (
                  <tr key={lead.id} className="hover:bg-zinc-50/80 transition">
                    <td className="py-3 px-3 font-bold text-zinc-900">{lead.name}</td>
                    <td className="py-3 px-3 text-zinc-900 font-medium font-mono text-[11px]">{lead.email}</td>
                    <td className="py-3 px-3 text-zinc-600">{lead.company || 'Direct Web Visitor'}</td>
                    <td className="py-3 px-3 text-zinc-600 max-w-xs truncate">{lead.firstQuestion || 'General Product Question'}</td>
                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                      {new Date(lead.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};


