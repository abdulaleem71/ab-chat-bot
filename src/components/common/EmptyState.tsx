import React from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  BookOpen,
  Inbox,
  BarChart2,
  Search,
  FilterX,
  MessageSquare,
  Mail,
  Users,
  Bot,
  Layers,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Plus,
  Code
} from 'lucide-react';
import { Button } from './Button';
import { MotionButton } from './MotionButton';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: React.ReactNode;
  badge?: React.ReactNode;
  tip?: React.ReactNode;
  compact?: boolean;
  dashed?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
  secondaryAction,
  badge,
  tip,
  compact = false,
  dashed = true,
  className = '',
}) => {
  const renderedAction =
    action ||
    (actionLabel && onAction ? (
      <Button variant="primary" size={compact ? 'sm' : 'md'} onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`text-center flex flex-col items-center justify-center rounded-3xl bg-white ${
        dashed
          ? 'border border-dashed border-zinc-300'
          : 'border border-zinc-200/80 shadow-xs'
      } ${compact ? 'p-6' : 'p-8 sm:p-12'} ${className}`}
    >
      {badge && (
        <div className="mb-3">
          {badge}
        </div>
      )}

      {/* Icon Container */}
      <div
        className={`rounded-2xl bg-zinc-100/90 text-zinc-900 border border-zinc-200/80 flex items-center justify-center shrink-0 mb-4 shadow-2xs ${
          compact ? 'w-10 h-10' : 'w-12 h-12'
        }`}
      >
        {icon || <Sparkles className={compact ? 'w-5 h-5 text-zinc-700' : 'w-6 h-6 text-zinc-700'} />}
      </div>

      {/* Title */}
      <h3
        className={`font-extrabold text-zinc-950 font-heading tracking-tight ${
          compact ? 'text-sm' : 'text-base sm:text-lg'
        }`}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={`text-zinc-500 font-normal font-body max-w-md mx-auto mt-1.5 leading-relaxed ${
            compact ? 'text-xs' : 'text-xs sm:text-sm'
          }`}
        >
          {description}
        </p>
      )}

      {/* Tip or Context */}
      {tip && (
        <div className="mt-3 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/70 text-[11px] text-zinc-600 font-medium max-w-sm">
          {tip}
        </div>
      )}

      {/* Actions */}
      {(renderedAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
          {renderedAction}
          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
};

/* =========================================================================
   Dedicated Empty States for Knowledge, Inbox, and Analytics
   ========================================================================= */

/** Knowledge Empty State */
export interface KnowledgeEmptyStateProps {
  type?: 'no-sources' | 'no-matches' | 'no-bot-linked';
  searchQuery?: string;
  botName?: string;
  onAddSource?: () => void;
  onLoadSample?: () => void;
  onClearSearch?: () => void;
  onCrawlWebsite?: () => void;
  onUploadDocument?: () => void;
  onImportFaq?: () => void;
  compact?: boolean;
  className?: string;
}

export const KnowledgeEmptyState: React.FC<KnowledgeEmptyStateProps> = ({
  type = 'no-sources',
  searchQuery,
  botName,
  onAddSource,
  onLoadSample,
  onClearSearch,
  onCrawlWebsite,
  onUploadDocument,
  onImportFaq,
  compact = false,
  className = '',
}) => {
  if (type === 'no-matches') {
    return (
      <EmptyState
        compact={compact}
        className={className}
        icon={<FilterX className={compact ? 'w-5 h-5 text-zinc-600' : 'w-6 h-6 text-zinc-600'} />}
        title="No matching knowledge sources"
        description={
          searchQuery
            ? `No indexed sources match "${searchQuery}". Try adjusting your keywords or clearing the search.`
            : 'No knowledge sources match the selected filter criteria.'
        }
        action={
          onClearSearch ? (
            <Button variant="outline" size="sm" onClick={onClearSearch}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
              Clear Search & Filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (type === 'no-bot-linked') {
    return (
      <EmptyState
        compact={compact}
        className={className}
        icon={<Layers className={compact ? 'w-5 h-5 text-amber-600' : 'w-6 h-6 text-amber-600'} />}
        title="No sources linked to this bot"
        description={
          botName
            ? `Knowledge sources exist in your tenant workspace, but none are currently attached to ${botName}. Ground your assistant with relevant documents or URLs.`
            : 'Knowledge sources exist, but none are linked to the active chatbot.'
        }
        actionLabel={onAddSource ? 'Link Knowledge Sources' : undefined}
        onAction={onAddSource}
      />
    );
  }

  // Default: 'no-sources'
  return (
    <EmptyState
      compact={compact}
      className={className}
      icon={<BookOpen className={compact ? 'w-5 h-5 text-indigo-600' : 'w-6 h-6 text-indigo-600'} />}
      title="No knowledge sources added yet"
      description="Ingest your website URL, frequently asked questions (FAQs), or upload documents to ground your AI assistant with zero hallucinations."
      action={
        onAddSource ? (
          <MotionButton
            type="button"
            variant="primary"
            size={compact ? 'sm' : 'md'}
            shimmer
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={onAddSource}
          >
            Add First Source
          </MotionButton>
        ) : undefined
      }
      secondaryAction={
        onLoadSample ? (
          <MotionButton
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'md'}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
            onClick={onLoadSample}
          >
            Load Sample Pack
          </MotionButton>
        ) : undefined
      }
      tip="💡 Tip: Live web crawling automatically extracts page sections into semantic vector chunks."
    />
  );
};

/** Inbox Empty State */
export interface InboxEmptyStateProps {
  type?: 'no-conversations' | 'no-matches' | 'no-selection' | 'no-tickets';
  onOpenEmbed?: () => void;
  onTestPlayground?: () => void;
  onResetFilters?: () => void;
  compact?: boolean;
  className?: string;
}

export const InboxEmptyState: React.FC<InboxEmptyStateProps> = ({
  type = 'no-conversations',
  onOpenEmbed,
  onTestPlayground,
  onResetFilters,
  compact = false,
  className = '',
}) => {
  if (type === 'no-matches') {
    return (
      <EmptyState
        compact={compact}
        className={className}
        icon={<Search className={compact ? 'w-5 h-5 text-zinc-500' : 'w-6 h-6 text-zinc-500'} />}
        title="No matching conversations"
        description="No visitor conversations match your active search keywords or queue filter status."
        action={
          onResetFilters ? (
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
              Reset Filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (type === 'no-selection') {
    return (
      <EmptyState
        compact={compact}
        dashed={false}
        className={`h-full min-h-[420px] bg-zinc-50/40 border-0 ${className}`}
        icon={<MessageSquare className="w-6 h-6 text-zinc-400" />}
        title="No conversation selected"
        description="Select a visitor session from the left conversation queue to review chat transcripts, inspect tool calls, or take over with live human support."
      />
    );
  }

  if (type === 'no-tickets') {
    return (
      <EmptyState
        compact={compact}
        className={className}
        icon={<Mail className={compact ? 'w-5 h-5 text-zinc-500' : 'w-6 h-6 text-zinc-500'} />}
        title="No support tickets found"
        description="Customer issues converted from live chat sessions, email escalations, or manual ticketing will be organized here."
      />
    );
  }

  // Default: 'no-conversations'
  return (
    <EmptyState
      compact={compact}
      className={className}
      icon={<Inbox className={compact ? 'w-5 h-5 text-zinc-800' : 'w-6 h-6 text-zinc-800'} />}
      title="No visitor conversations yet"
      description="Your inbox is ready and listening. Embed your widget on your website to start answering questions, capturing qualified leads, and resolving support inquiries in real-time."
      action={
        onOpenEmbed ? (
          <MotionButton
            type="button"
            variant="primary"
            size={compact ? 'sm' : 'md'}
            shimmer
            leftIcon={<Code className="w-3.5 h-3.5" />}
            onClick={onOpenEmbed}
          >
            Get Embed Code
          </MotionButton>
        ) : undefined
      }
      secondaryAction={
        onTestPlayground ? (
          <MotionButton
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'md'}
            leftIcon={<Bot className="w-3.5 h-3.5" />}
            onClick={onTestPlayground}
          >
            Test in Playground
          </MotionButton>
        ) : undefined
      }
      tip="⚡ Tip: You can test the widget immediately in the Live Playground without installing scripts."
    />
  );
};

/** Analytics Empty State */
export interface AnalyticsEmptyStateProps {
  type?: 'no-data' | 'no-leads' | 'no-topics';
  onOpenPlayground?: () => void;
  onOpenEmbed?: () => void;
  compact?: boolean;
  className?: string;
}

export const AnalyticsEmptyState: React.FC<AnalyticsEmptyStateProps> = ({
  type = 'no-data',
  onOpenPlayground,
  onOpenEmbed,
  compact = false,
  className = '',
}) => {
  if (type === 'no-leads') {
    return (
      <EmptyState
        compact={compact}
        className={className}
        icon={<Users className={compact ? 'w-5 h-5 text-emerald-600' : 'w-6 h-6 text-emerald-600'} />}
        title="No leads captured yet"
        description="Lead capture triggers automatically when visitors submit their email or phone number in chatbot conversations. Captured contacts appear here instantly."
        tip="🎯 Tip: Verify 'Lead Capture' is enabled in your Chatbot Settings."
      />
    );
  }

  if (type === 'no-topics') {
    return (
      <EmptyState
        compact={compact}
        className={className}
        icon={<BarChart2 className={compact ? 'w-5 h-5 text-zinc-500' : 'w-6 h-6 text-zinc-500'} />}
        title="Topic clustering pending"
        description="Inquiry topics are aggregated automatically once conversations occur. Chat with your bot in the playground or on your site to populate semantic category analytics."
        actionLabel={onOpenPlayground ? 'Open Playground' : undefined}
        onAction={onOpenPlayground}
      />
    );
  }

  // Default: 'no-data'
  return (
    <EmptyState
      compact={compact}
      className={className}
      icon={<TrendingUp className={compact ? 'w-5 h-5 text-indigo-600' : 'w-6 h-6 text-indigo-600'} />}
      title="Analytics waiting for first conversations"
      description="Performance metrics—including Total Chats, AI Resolution Rate, Response Latency, and CSAT scores—will begin populating as soon as visitors interact with your assistant."
      action={
        onOpenPlayground ? (
          <MotionButton
            type="button"
            variant="primary"
            size={compact ? 'sm' : 'md'}
            shimmer
            leftIcon={<Bot className="w-3.5 h-3.5" />}
            onClick={onOpenPlayground}
          >
            Start Test Chat in Playground
          </MotionButton>
        ) : undefined
      }
      secondaryAction={
        onOpenEmbed ? (
          <MotionButton
            type="button"
            variant="outline"
            size={compact ? 'sm' : 'md'}
            leftIcon={<Code className="w-3.5 h-3.5" />}
            onClick={onOpenEmbed}
          >
            Get Embed Code
          </MotionButton>
        ) : undefined
      }
      tip="📊 Telemetry: Once deployed, response latency and tool-calling execution times stream in real-time."
    />
  );
};


