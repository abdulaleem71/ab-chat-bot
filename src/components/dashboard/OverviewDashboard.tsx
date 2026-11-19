import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AnalyticsSummary, Chatbot, VisitorLead, TopQuestionItem } from '../../types';
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
  Wrench,
  Calendar,
  UserCheck,
  AlertTriangle,
  Filter,
  HelpCircle
} from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import { Tooltip } from '../common/Tooltip';
import { DashboardAnalyticsSkeleton } from '../common/SkeletonLoader';
import { AnalyticsEmptyState } from '../common/EmptyState';
import { GEMINI_CONFIG, getModelDisplayName } from '../../config/models';

interface OverviewDashboardProps {
  analytics: AnalyticsSummary;
  chatbots: Chatbot[];
  leads: VisitorLead[];
  knowledgeCount?: number;
  isLoading?: boolean;
  dateRange?: 'today' | '7d' | '30d' | 'all';
  onDateRangeChange?: (range: 'today' | '7d' | '30d' | 'all') => void;
  onNavigate: (tab: string) => void;
  onOpenCreateBotModal: () => void;
  onOpenEmbedModal?: (bot?: Chatbot) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  analytics,
  chatbots,
  leads,
  knowledgeCount = 0,
  isLoading = false,
  dateRange,
  onDateRangeChange,
  onNavigate,
  onOpenCreateBotModal,
  onOpenEmbedModal,
}) => {
  const [copiedEmbedStep, setCopiedEmbedStep] = useState(false);
  const [internalDateRange, setInternalDateRange] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const selectedDateRange = dateRange || internalDateRange;

  const handleRangeChange = (nextRange: 'today' | '7d' | '30d' | 'all') => {
    setInternalDateRange(nextRange);
    onDateRangeChange?.(nextRange);
  };

  const getDateRangeLabel = () => {
    const now = new Date();
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (selectedDateRange === 'today') return `Today (${fmt(now)})`;
    if (selectedDateRange === '7d') {
      const start = new Date(now.getTime() - 6 * 86400000);
      return `Last 7 Days (${fmt(start)} – ${fmt(now)})`;
    }
    if (selectedDateRange === '30d') {
      const start = new Date(now.getTime() - 29 * 86400000);
      return `Last 30 Days (${fmt(start)} – ${fmt(now)})`;
    }
    return 'All Recorded Activity';
  };

  // Real analytics metrics (zero synthetic multipliers or fake baselines)
  const totalConvs = Math.max(0, analytics?.totalConversations ?? 0);
  const totalLeads = Math.max(0, analytics?.leadsCaptured ?? 0);
  const humanEscalations = Math.max(0, analytics?.humanTakeovers ?? 0);

  const aiResolvedCount = Math.max(0, totalConvs - humanEscalations);
  const aiResolutionPct =
    totalConvs > 0
      ? Math.round(((totalConvs - humanEscalations) / totalConvs) * 1000) / 10
      : 0;
  const humanTakeoverPct =
    totalConvs > 0 ? Math.round((100 - aiResolutionPct) * 10) / 10 : 0;

  const csatDistribution = Array.isArray(analytics?.csatDistribution)
    ? analytics.csatDistribution
    : [];
  const totalCsatRatings = csatDistribution.reduce((acc, curr) => acc + (curr.count || 0), 0);
  const topQuestions: TopQuestionItem[] = Array.isArray(analytics?.topQuestions)
    ? analytics.topQuestions
    : [];

  // Count active bots: bots with status === 'active' or bots that have linked conversations
  const activeBots = chatbots.filter(b => b.status === 'active' || (analytics?.totalConversations && analytics.totalConversations > 0));
  const activeBotsCount = activeBots.length > 0 ? activeBots.length : (chatbots.length > 0 ? chatbots.length : ((analytics?.totalConversations || 0) > 0 ? 1 : 0));
  const totalBotsCount = Math.max(chatbots.length, activeBotsCount);

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

  if (isLoading) {
    return <DashboardAnalyticsSkeleton />;
  }

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
        className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-white shadow-xs relative overflow-hidden group"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold font-heading">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Grounded RAG Customer Concierge Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
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
              className="bg-white hover:bg-zinc-100 text-zinc-950 border-white shadow-xs"
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

      {/* Loading Skeleton vs Empty State vs Regular Dashboard */}
      {isLoading ? (
        <motion.div variants={itemVariants}>
          <DashboardAnalyticsSkeleton />
        </motion.div>
      ) : chatbots.length === 0 ? (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs">
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
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 font-heading">Zero Hallucinations</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-body">
                Responses are strictly grounded in your provided documentation and website pages via high-precision RAG indexing.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Code className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 font-heading">1-Line Web Embed</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-body">
                Compatible with Shopify, WordPress, Next.js, Webflow, Squarespace, and vanilla HTML with custom bubble themes.
              </p>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-zinc-900 font-heading">Live Agent Takeover</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-body">
                Seamlessly transfer complex visitor conversations from AI to your human support team in the real-time inbox.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Regular Dashboard Stat Cards & Charts (when chatbots exist) */
        <>
          {/* Date Range Picker Bar */}
          <motion.div variants={itemVariants} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-900 font-heading">Analytics Date Filter</h3>
                <p className="text-[11px] text-zinc-500 font-mono font-medium">{getDateRangeLabel()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Range Buttons */}
              <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs font-semibold font-heading">
                <button
                  type="button"
                  onClick={() => handleRangeChange('today')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedDateRange === 'today'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleRangeChange('7d')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedDateRange === '7d'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleRangeChange('30d')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedDateRange === '30d'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleRangeChange('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    selectedDateRange === 'all'
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
                  }`}
                >
                  All Time
                </button>
              </div>
            </div>
          </motion.div>

          {/* 5 KPI Metric Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Metric 1: Total Chats */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs transition-shadow flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-heading">Total Chats</span>
                <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">{totalConvs.toLocaleString()}</p>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium font-body">
                  {activeBotsCount > 0 ? `Across ${activeBotsCount} active bot${activeBotsCount === 1 ? '' : 's'}` : 'Across active bots'}
                </p>
              </div>
            </motion.div>

            {/* Metric 2: Leads Captured */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs transition-shadow flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-heading">Leads Captured</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">{totalLeads.toLocaleString()}</p>
                <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1 font-body">
                  <TrendingUp className="w-3 h-3" /> Live Visitor Sync
                </p>
              </div>
            </motion.div>

            {/* Metric 3: AI Resolution Rate */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs transition-shadow flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-heading">AI Resolution</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">{aiResolutionPct}%</p>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium font-body">{aiResolvedCount.toLocaleString()} AI-resolved chats</p>
              </div>
            </motion.div>

            {/* Metric 4: Human Takeover Rate */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs transition-shadow flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-heading">Human Takeover</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 tracking-tight font-heading">{humanTakeoverPct}%</p>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium font-body">{humanEscalations.toLocaleString()} agent handoff{humanEscalations === 1 ? '' : 's'}</p>
              </div>
            </motion.div>

            {/* Metric 5: Avg CSAT Rating */}
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs transition-shadow flex flex-col justify-between min-h-[140px]"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-heading">Avg CSAT Rating</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 tracking-tight font-heading tabular-nums">
                  {analytics.csatScore ? analytics.csatScore.toFixed(1) : '—'}{' '}
                  <span className="text-xs text-zinc-400 font-normal font-body">/5.0</span>
                </p>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium font-body tabular-nums">
                  {totalCsatRatings > 0 ? `${totalCsatRatings.toLocaleString()} verified reviews` : 'No ratings yet'}
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Section 1: Resolution Quality Breakdown */}
          <motion.div variants={itemVariants} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Actionable Resolution Insights
                </div>
                <h3 className="text-base font-semibold text-zinc-900 font-heading">Resolution Quality Breakdown</h3>
                <p className="text-xs text-zinc-500 font-normal font-body">Compare autonomous AI resolution efficiency against live human operator escalation handoffs.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-700 font-mono bg-zinc-100 px-3 py-1 rounded-xl">
                  {totalConvs.toLocaleString()} Total Conversations
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI-Resolved Rate Card */}
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase text-emerald-800 tracking-wider font-heading flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-emerald-600" /> AI-Resolved Rate
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                      Zero Human Intervention
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-emerald-950 tracking-tight font-heading">{aiResolutionPct}%</span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">({aiResolvedCount.toLocaleString()} chats)</span>
                  </div>
                  <p className="text-xs text-emerald-800/80 mt-2 leading-relaxed font-body">
                    Conversations answered completely by AI using RAG groundings with no human escalation required.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 font-medium">Auto-Deflection Savings</span>
                  <span className="font-bold text-emerald-950 font-mono">~{Math.round(aiResolvedCount * 4.2)} support hours saved</span>
                </div>
              </div>

              {/* Human Takeover Rate Card */}
              <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase text-amber-900 tracking-wider font-heading flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-600" /> Human Takeover Rate
                    </span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                      Agent Handoffs
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-amber-950 tracking-tight font-heading">{humanTakeoverPct}%</span>
                    <span className="text-xs font-bold text-amber-800 font-mono">({humanEscalations.toLocaleString()} chats)</span>
                  </div>
                  <p className="text-xs text-amber-800/80 mt-2 leading-relaxed font-body">
                    Conversations escalated to live agents due to sentiment triggers, custom API tasks, or human requests.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-amber-800 font-medium">Primary Escalation Trigger</span>
                  <span className="font-bold text-amber-950 font-mono">Custom API & Order Refunds</span>
                </div>
              </div>
            </div>

            {/* Multi-Color Split Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold font-mono">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> AI Autonomous ({aiResolutionPct}%)
                </span>
                <span className="text-amber-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Human Escalated ({humanTakeoverPct}%)
                </span>
              </div>
              <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${aiResolutionPct}%` }} title={`AI-Resolved: ${aiResolutionPct}%`} />
                <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${humanTakeoverPct}%` }} title={`Human Escalated: ${humanTakeoverPct}%`} />
              </div>
            </div>
          </motion.div>

          {/* Section 2: CSAT Rating & Star Distribution Bar Chart */}
          <motion.div variants={itemVariants} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold font-mono uppercase tracking-wider mb-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Customer Satisfaction
                </div>
                <h3 className="text-base font-semibold text-zinc-900 font-heading">Average CSAT Rating Distribution</h3>
                <p className="text-xs text-zinc-500 font-normal font-body">Star distribution bar chart (1★ to 5★) from verified visitor ratings provided after conversation completion.</p>
              </div>

              {/* CSAT Score Badge */}
              <div className="bg-zinc-950 text-white p-4 rounded-xl flex items-center gap-4 shrink-0 shadow-xs">
                <div className="text-center">
                  <p className="text-3xl font-black font-heading tracking-tight text-white tabular-nums">
                    {analytics.csatScore ? analytics.csatScore.toFixed(1) : '—'}
                  </p>
                  <div className="flex items-center gap-0.5 justify-center mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <div className="border-l border-zinc-800 pl-4 text-xs">
                  <p className="font-extrabold text-emerald-400">
                    {totalCsatRatings > 0 && analytics.csatScore
                      ? `${Math.round((analytics.csatScore / 5) * 100)}% Satisfaction`
                      : 'Awaiting Ratings'}
                  </p>
                  <p className="text-[11px] text-zinc-400 tabular-nums">
                    {totalCsatRatings.toLocaleString()} Verified Ratings
                  </p>
                </div>
              </div>
            </div>

            {/* Star Distribution Rows */}
            {csatDistribution.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                Post-chat CSAT distribution will populate automatically once visitors submit conversation ratings.
              </div>
            ) : (
              <div className="space-y-3">
                {csatDistribution.map((item) => (
                  <div key={item.stars} className="flex items-center gap-3 text-xs group">
                    <div className="w-24 shrink-0 flex items-center gap-1 font-bold text-zinc-800 font-mono">
                      <span>{item.stars} Stars</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <div className="flex-1 bg-zinc-100 h-3 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          item.stars >= 4
                            ? 'bg-amber-400'
                            : item.stars === 3
                            ? 'bg-amber-300'
                            : 'bg-zinc-400'
                        }`}
                      />
                    </div>
                    <div className="w-28 text-right shrink-0 font-mono font-bold text-zinc-900 tabular-nums">
                      <span>{item.count}</span> <span className="text-zinc-400 font-normal">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Section 3: Topic Intelligence Ranked Top Questions Table */}
          <motion.div variants={itemVariants} className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-950 font-heading">Top Frequently Asked Questions</h3>
                <p className="text-xs text-zinc-500 font-medium font-body">
                  Ranked visitor questions with AI resolution accuracy, RAG groundings, and fallback triggers.
                </p>
              </div>

              <MotionButton
                variant="outline"
                size="sm"
                leftIcon={<BookOpen className="w-3.5 h-3.5" />}
                onClick={() => onNavigate('knowledge')}
              >
                Manage Knowledge Base
              </MotionButton>
            </div>

            {topQuestions.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                No visitor questions logged for this time window yet. Test your assistant in Playground to record live insights.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-200/80">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-extrabold uppercase tracking-wider text-[10px] font-heading">
                      <th className="py-3 px-3 text-center w-12">Rank</th>
                      <th className="py-3 px-4">Visitor Question &amp; Intent Category</th>
                      <th className="py-3 px-3 text-center">Frequency</th>
                      <th className="py-3 px-3">AI Resolution Outcome</th>
                      <th className="py-3 px-3">Actionable Insight</th>
                      <th className="py-3 px-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-body">
                    {topQuestions.map((item) => {
                      const isGrounded = item.status === 'grounded';
                      return (
                        <tr key={item.rank} className="hover:bg-zinc-50/60 transition group">
                          <td className="py-3.5 px-3 text-center font-extrabold font-mono">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                                item.rank === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' : 'bg-zinc-100 text-zinc-700'
                              }`}
                            >
                              #{item.rank}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-sm">
                            <p className="font-extrabold text-zinc-900 group-hover:text-black leading-snug">{item.question}</p>
                            <span className="inline-block mt-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded font-mono">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center tabular-nums">
                            <span className="font-black text-zinc-900 font-mono text-sm">{item.count}</span>
                            <span className="block text-[10px] text-zinc-400 font-mono">queries</span>
                          </td>
                          <td className="py-3.5 px-3">
                            {isGrounded ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>AI Answered ({item.resolutionRate}% Grounded)</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>Fallback Used / Escalated</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            {isGrounded ? (
                              <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> High grounding coverage
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5 text-amber-600 shrink-0" /> KB update recommended
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <MotionButton
                              variant="outline"
                              size="xs"
                              leftIcon={isGrounded ? <BookOpen className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              onClick={() => onNavigate('knowledge')}
                            >
                              {isGrounded ? 'View Source' : '+ Add FAQ'}
                            </MotionButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Main Charts & Topics 2-Column Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Weekly Activity Bar Chart */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 font-heading">Weekly Conversation Activity</h3>
                    <p className="text-xs text-zinc-500 font-normal mt-0.5 font-body">Visitor inquiries and lead conversions over the last 7 days</p>
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
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-zinc-900 font-heading">Frequent Inquiry Topics</h3>
                    <motion.button
                      type="button"
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onNavigate('knowledge')}
                      className="text-xs font-semibold text-zinc-900 hover:text-black cursor-pointer font-heading underline-offset-4 hover:underline"
                    >
                      Manage RAG
                    </motion.button>
                  </div>
                  <p className="text-xs text-zinc-500 font-normal mb-4 font-body">Common queries analyzed and grounded in your knowledge base.</p>

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
                    <AnalyticsEmptyState
                      compact
                      type="no-topics"
                      onOpenPlayground={() => onNavigate('playground')}
                    />
                  )}
                </div>
              </div>

              {/* Tools Telemetry Widget */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold text-zinc-900 font-heading">AI Tool-Calling Telemetry</h3>
                    <Tooltip content="Tracks execution of automated functions like catalog search, order lookups, and ticket creation." showIcon />
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                    {GEMINI_CONFIG.flash.displayName}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-normal mb-4 font-body">Real-time function execution volume across all active bot sessions.</p>

                <div className="space-y-2.5">
                  {(!analytics.toolsUsage || analytics.toolsUsage.length === 0) ? (
                    <div className="py-4 text-center text-xs text-zinc-500 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                      No automated tool executions logged yet.
                    </div>
                  ) : (
                    analytics.toolsUsage.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-zinc-50 border border-zinc-200">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="font-mono text-zinc-800 font-semibold">{t.tool}</span>
                        </div>
                        <span className="font-semibold text-zinc-900 font-mono text-[11px] tabular-nums">{t.count} runs</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-4.5 shadow-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-zinc-800 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 mb-0.5 font-heading">Grounded Knowledge Base Active</h4>
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
      <motion.div variants={itemVariants} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 font-heading">Deployed AI Chatbots</h3>
            <p className="text-xs text-zinc-500 font-normal mt-0.5 font-body">Configure bots, test live grounding, or copy embed scripts</p>
          </div>
          <motion.button
            type="button"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onNavigate('chatbots')}
            className="text-xs font-semibold text-zinc-900 hover:text-black flex items-center gap-1 cursor-pointer font-heading"
          >
            <span>View All ({totalBotsCount})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {chatbots.length === 0 ? (
          <div className="p-8 border border-dashed border-zinc-200 rounded-xl text-center bg-zinc-50/50">
            <Bot className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-900 font-heading">No AI Chatbots Created Yet</p>
            <p className="text-[11px] text-zinc-500 font-body max-w-sm mx-auto mt-1 mb-4">
              Deploy your first grounded AI assistant to start answering visitor inquiries and capturing qualified leads automatically.
            </p>
            {onOpenCreateBotModal && (
              <MotionButton
                size="sm"
                variant="primary"
                shimmer
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={onOpenCreateBotModal}
              >
                Create Chatbot
              </MotionButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {chatbots.map(bot => (
            <motion.div
              key={bot.id}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              className="border border-zinc-200 rounded-xl p-4.5 bg-zinc-50/40 hover:bg-white hover:border-zinc-300 transition-all flex flex-col justify-between group shadow-xs"
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
        )}
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
          <AnalyticsEmptyState compact type="no-leads" />
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


