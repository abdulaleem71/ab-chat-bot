import React from 'react';

export type SkeletonVariant =
  | 'text'
  | 'circular'
  | 'rectangular'
  | 'card'
  | 'bot-card'
  | 'table-row'
  | 'button'
  | 'conversation-item'
  | 'metric-card'
  | 'knowledge-chunk';

export interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  lines?: number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'rectangular',
  width,
  height,
  lines = 3,
  rounded,
  className = '',
  style,
  ...props
}) => {
  const baseShimmer =
    'relative overflow-hidden bg-zinc-200/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmerSweep_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  const roundedClasses: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };

  const defaultRounded = rounded ? roundedClasses[rounded] : 'rounded-xl';

  if (variant === 'circular') {
    return (
      <div
        className={`${baseShimmer} rounded-full shrink-0 ${className}`}
        style={{
          width: width || 40,
          height: height || 40,
          ...style,
        }}
        {...props}
      />
    );
  }

  if (variant === 'button') {
    return (
      <div
        className={`${baseShimmer} ${defaultRounded} ${className}`}
        style={{
          width: width || 110,
          height: height || 38,
          ...style,
        }}
        {...props}
      />
    );
  }

  if (variant === 'text') {
    if (lines === 1) {
      return (
        <div
          className={`${baseShimmer} rounded-md ${className}`}
          style={{
            width: width || '100%',
            height: height || 16,
            ...style,
          }}
          {...props}
        />
      );
    }

    return (
      <div className={`space-y-2 w-full ${className}`} {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseShimmer} rounded-md`}
            style={{
              width: index === lines - 1 ? '65%' : '100%',
              height: height || 14,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'bot-card') {
    return (
      <div
        className={`p-5 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-4 ${className}`}
        {...props}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${baseShimmer}`} />
            <div className="space-y-1.5">
              <div className={`w-28 h-4 rounded-md ${baseShimmer}`} />
              <div className={`w-20 h-3 rounded-md ${baseShimmer}`} />
            </div>
          </div>
          <div className={`w-16 h-6 rounded-full ${baseShimmer}`} />
        </div>
        <div className="space-y-2">
          <div className={`w-full h-3 rounded-md ${baseShimmer}`} />
          <div className={`w-4/5 h-3 rounded-md ${baseShimmer}`} />
        </div>
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
          <div className={`w-24 h-3 rounded-md ${baseShimmer}`} />
          <div className={`w-16 h-7 rounded-xl ${baseShimmer}`} />
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={`p-6 rounded-3xl bg-white border border-zinc-200/80 shadow-xs space-y-4 ${className}`}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${baseShimmer}`} />
          <div className="space-y-1.5 flex-1">
            <div className={`w-1/3 h-4 rounded-md ${baseShimmer}`} />
            <div className={`w-1/4 h-3 rounded-md ${baseShimmer}`} />
          </div>
        </div>
        <div className="space-y-2">
          <div className={`w-full h-3 rounded-md ${baseShimmer}`} />
          <div className={`w-5/6 h-3 rounded-md ${baseShimmer}`} />
          <div className={`w-2/3 h-3 rounded-md ${baseShimmer}`} />
        </div>
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div
        className={`py-3 px-4 flex items-center justify-between gap-4 border-b border-zinc-100 ${className}`}
        {...props}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-8 h-8 rounded-xl ${baseShimmer}`} />
          <div className="space-y-1 flex-1">
            <div className={`w-36 h-3.5 rounded-md ${baseShimmer}`} />
            <div className={`w-24 h-2.5 rounded-md ${baseShimmer}`} />
          </div>
        </div>
        <div className={`w-20 h-5 rounded-full ${baseShimmer}`} />
        <div className={`w-16 h-7 rounded-xl ${baseShimmer}`} />
      </div>
    );
  }

  if (variant === 'conversation-item') {
    return (
      <div
        className={`p-4 flex items-start justify-between gap-3 border-b border-zinc-100 bg-white ${className}`}
        {...props}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-xl ${baseShimmer} shrink-0`} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-28 h-3.5 rounded-md ${baseShimmer}`} />
              <div className={`w-14 h-3 rounded-full ${baseShimmer}`} />
            </div>
            <div className={`w-4/5 h-2.5 rounded-md ${baseShimmer}`} />
          </div>
        </div>
        <div className="space-y-1.5 shrink-0 flex flex-col items-end">
          <div className={`w-10 h-2.5 rounded-md ${baseShimmer}`} />
          <div className={`w-4 h-4 rounded-md ${baseShimmer}`} />
        </div>
      </div>
    );
  }

  if (variant === 'metric-card') {
    return (
      <div
        className={`bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs flex flex-col justify-between min-h-[112px] ${className}`}
        {...props}
      >
        <div className="flex items-center justify-between mb-2">
          <div className={`w-20 h-3 rounded-md ${baseShimmer}`} />
          <div className={`w-7 h-7 rounded-lg ${baseShimmer}`} />
        </div>
        <div>
          <div className={`w-16 h-7 rounded-md ${baseShimmer} my-1.5`} />
          <div className={`w-28 h-2.5 rounded-md ${baseShimmer}`} />
        </div>
      </div>
    );
  }

  if (variant === 'knowledge-chunk') {
    return (
      <div
        className={`py-5 px-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border-b border-zinc-100 bg-white ${className}`}
        {...props}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1 w-full">
          <div className={`p-2.5 rounded-xl w-9 h-9 ${baseShimmer} shrink-0`} />
          <div className="min-w-0 space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`w-44 h-4 rounded-md ${baseShimmer}`} />
              <div className={`w-16 h-4 rounded-full ${baseShimmer}`} />
              <div className={`w-20 h-4 rounded-full ${baseShimmer}`} />
            </div>
            <div className={`w-64 h-3 rounded-md ${baseShimmer}`} />
            <div className="space-y-1.5 pt-1">
              <div className={`w-full h-3 rounded-md ${baseShimmer}`} />
              <div className={`w-4/5 h-3 rounded-md ${baseShimmer}`} />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <div className={`w-24 h-2.5 rounded-md ${baseShimmer}`} />
              <div className={`w-16 h-5 rounded-lg ${baseShimmer}`} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 md:self-center">
          <div className={`w-20 h-7 rounded-xl ${baseShimmer}`} />
          <div className={`w-7 h-7 rounded-xl ${baseShimmer}`} />
        </div>
      </div>
    );
  }

  // Default rectangular
  return (
    <div
      className={`${baseShimmer} ${defaultRounded} ${className}`}
      style={{
        width: width || '100%',
        height: height || 48,
        ...style,
      }}
      {...props}
    />
  );
};

/* =========================================================================
   Dedicated Domain Skeletons Matching Production Card Dimensions Exactly
   ========================================================================= */

/** Conversation List Item Skeleton */
export const ConversationItemSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonLoader variant="conversation-item" className={className} />
);

/** Conversation List Skeleton (Vertical Queue in Helpdesk Inbox) */
export const ConversationListSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 5,
  className = '',
}) => {
  return (
    <div className={`divide-y divide-zinc-100 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <ConversationItemSkeleton key={idx} />
      ))}
    </div>
  );
};

/** Thread Chat Pane Skeleton (Middle Column in Helpdesk Inbox) */
export const ThreadChatSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const baseShimmer =
    'relative overflow-hidden bg-zinc-200/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmerSweep_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  return (
    <div className={`flex flex-col justify-between h-full min-h-[660px] bg-white border-r border-zinc-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${baseShimmer}`} />
          <div className="space-y-1.5">
            <div className={`w-32 h-3.5 rounded-md ${baseShimmer}`} />
            <div className={`w-20 h-2.5 rounded-md ${baseShimmer}`} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-24 h-7 rounded-xl ${baseShimmer}`} />
          <div className={`w-8 h-8 rounded-xl ${baseShimmer}`} />
        </div>
      </div>

      {/* Messages bubbles */}
      <div className="p-5 space-y-5 flex-1 overflow-hidden">
        {/* Visitor bubble */}
        <div className="flex items-start gap-2.5 max-w-[75%]">
          <div className={`w-7 h-7 rounded-lg ${baseShimmer} shrink-0`} />
          <div className="space-y-1.5 flex-1">
            <div className="p-3.5 rounded-2xl bg-zinc-100 rounded-tl-xs space-y-2">
              <div className={`w-48 h-3 rounded-md ${baseShimmer}`} />
              <div className={`w-36 h-3 rounded-md ${baseShimmer}`} />
            </div>
            <div className={`w-12 h-2 rounded-md ${baseShimmer}`} />
          </div>
        </div>

        {/* AI Agent bubble */}
        <div className="flex items-start justify-end gap-2.5 max-w-[80%] ml-auto">
          <div className="space-y-1.5 flex-1 flex flex-col items-end">
            <div className="p-3.5 rounded-2xl bg-zinc-900 rounded-tr-xs space-y-2.5 w-full max-w-sm">
              <div className={`w-full h-3 rounded-md bg-zinc-800 ${baseShimmer}`} />
              <div className={`w-5/6 h-3 rounded-md bg-zinc-800 ${baseShimmer}`} />
              <div className={`w-2/3 h-3 rounded-md bg-zinc-800 ${baseShimmer}`} />
            </div>
            <div className={`w-14 h-2 rounded-md ${baseShimmer}`} />
          </div>
          <div className={`w-7 h-7 rounded-lg ${baseShimmer} shrink-0`} />
        </div>

        {/* Visitor bubble */}
        <div className="flex items-start gap-2.5 max-w-[70%]">
          <div className={`w-7 h-7 rounded-lg ${baseShimmer} shrink-0`} />
          <div className="space-y-1.5 flex-1">
            <div className="p-3.5 rounded-2xl bg-zinc-100 rounded-tl-xs space-y-2">
              <div className={`w-44 h-3 rounded-md ${baseShimmer}`} />
            </div>
            <div className={`w-12 h-2 rounded-md ${baseShimmer}`} />
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="p-3.5 border-t border-zinc-200 bg-white flex items-center gap-2">
        <div className={`flex-1 h-10 rounded-xl ${baseShimmer}`} />
        <div className={`w-20 h-10 rounded-xl ${baseShimmer}`} />
      </div>
    </div>
  );
};

/** Metric Card Skeleton (Matching Overview KPI Cards) */
export const MetricCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonLoader variant="metric-card" className={className} />
);

/** 5-Column Metric Cards Grid Skeleton */
export const MetricCardsGridSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 5,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <MetricCardSkeleton key={idx} />
      ))}
    </div>
  );
};

/** Full Dashboard Analytics Skeleton (KPIs + Chart + Activity Cards) */
export const DashboardAnalyticsSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const baseShimmer =
    'relative overflow-hidden bg-zinc-200/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmerSweep_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 5 KPI Cards Grid */}
      <MetricCardsGridSkeleton />

      {/* Charts & Lead Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart Skeleton */}
        <div className="lg:col-span-8 bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="space-y-1.5">
              <div className={`w-36 h-4 rounded-md ${baseShimmer}`} />
              <div className={`w-52 h-3 rounded-md ${baseShimmer}`} />
            </div>
            <div className={`w-24 h-7 rounded-xl ${baseShimmer}`} />
          </div>
          <div className={`w-full h-56 rounded-2xl ${baseShimmer}`} />
        </div>

        {/* Side Panel Skeleton */}
        <div className="lg:col-span-4 bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className={`w-28 h-4 rounded-md ${baseShimmer}`} />
            <div className={`w-16 h-4 rounded-full ${baseShimmer}`} />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-50">
                <div className={`w-8 h-8 rounded-lg ${baseShimmer}`} />
                <div className="flex-1 space-y-1">
                  <div className={`w-28 h-3 rounded-md ${baseShimmer}`} />
                  <div className={`w-16 h-2 rounded-md ${baseShimmer}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Knowledge Chunk Row Skeleton */
export const KnowledgeChunkRowSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonLoader variant="knowledge-chunk" className={className} />
);

/** Knowledge Chunk Rows Skeleton (Matching Knowledge Source List) */
export const KnowledgeChunkRowsSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 3,
  className = '',
}) => {
  return (
    <div className={`divide-y divide-zinc-100 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <KnowledgeChunkRowSkeleton key={idx} />
      ))}
    </div>
  );
};

/** Single Bot Card Skeleton */
export const BotCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <SkeletonLoader variant="bot-card" className={className} />
);

/** Bot List Grid Skeleton (Matching AI Chatbots View) */
export const BotListSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 6,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <BotCardSkeleton key={idx} />
      ))}
    </div>
  );
};

/** Table Rows Skeleton for tabular views (Tickets, Leads) */
export const TableRowsSkeleton: React.FC<{ count?: number; cols?: number; className?: string }> = ({
  count = 4,
  cols = 5,
  className = '',
}) => {
  const baseShimmer =
    'relative overflow-hidden bg-zinc-200/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmerSweep_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  return (
    <tbody className={`divide-y divide-zinc-200 bg-white ${className}`}>
      {Array.from({ length: count }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="p-3.5">
              <div
                className={`h-3 rounded-md ${baseShimmer}`}
                style={{ width: `${Math.max(45, 85 - (cIdx * 12))}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

/** Chat Messages List Skeleton */
export const ChatMessageSkeleton: React.FC<{ isAgent?: boolean; className?: string }> = ({
  isAgent = false,
  className = '',
}) => {
  const baseShimmer =
    'relative overflow-hidden bg-zinc-200/70 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmerSweep_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent';

  return (
    <div
      className={`flex items-start gap-2.5 max-w-[80%] ${
        isAgent ? 'ml-auto flex-row-reverse' : ''
      } ${className}`}
    >
      <div className={`w-7 h-7 rounded-lg ${baseShimmer} shrink-0`} />
      <div className={`space-y-1.5 flex-1 ${isAgent ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`p-3.5 rounded-2xl space-y-2 ${
            isAgent ? 'bg-zinc-900 rounded-tr-xs text-right' : 'bg-zinc-100 rounded-tl-xs'
          }`}
        >
          <div className={`w-40 h-3 rounded-md ${isAgent ? 'bg-zinc-800' : ''} ${baseShimmer}`} />
          <div className={`w-28 h-3 rounded-md ${isAgent ? 'bg-zinc-800' : ''} ${baseShimmer}`} />
        </div>
        <div className={`w-12 h-2 rounded-md ${baseShimmer}`} />
      </div>
    </div>
  );
};

