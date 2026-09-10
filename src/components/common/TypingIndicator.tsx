import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Square } from 'lucide-react';

export interface TypingIndicatorProps {
  botName?: string;
  avatar?: string;
  primaryColor?: string;
  statusText?: string;
  variant?: 'bubble' | 'minimal' | 'inline';
  compact?: boolean;
  onStop?: () => void;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  botName,
  avatar = '🤖',
  primaryColor = '#09090b',
  statusText = 'AI is typing...',
  variant = 'bubble',
  compact = false,
  onStop,
  className = '',
}) => {
  if (variant === 'minimal') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100/90 text-zinc-600 rounded-full text-xs w-fit ${className}`}
      >
        <span className="text-[11px] font-medium">{statusText}</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-1.5 py-1 px-2 text-xs text-zinc-500 font-medium ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
        <span>{statusText}</span>
        <div className="flex items-center gap-0.5 ml-0.5">
          <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2.5 max-w-[85%] ${className}`}
    >
      <div
        style={{ backgroundColor: primaryColor }}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-white text-xs flex items-center justify-center shrink-0 shadow-xs font-bold mt-0.5"
      >
        {avatar}
      </div>

      <div className="bg-white border border-zinc-200/90 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs text-xs text-zinc-600 flex flex-col gap-2">
        {botName && (
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-1.5">
            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-wider">
              {botName}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">Generating...</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"
                style={{ animationDelay: '0ms', animationDuration: '0.9s' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                style={{ animationDelay: '180ms', animationDuration: '0.9s' }}
              />
              <span
                className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: '360ms', animationDuration: '0.9s' }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 font-medium">{statusText}</span>
          </div>

          {onStop && (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-600 hover:text-rose-600 bg-zinc-100 hover:bg-rose-50 px-2 py-0.5 rounded-md border border-zinc-200 hover:border-rose-200 transition cursor-pointer"
              title="Stop Generation"
            >
              <Square className="w-2.5 h-2.5 fill-current" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
