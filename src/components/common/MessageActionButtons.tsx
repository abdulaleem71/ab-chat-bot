import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';

export interface MessageActionButtonsProps {
  messageId: string;
  content: string;
  isLatest?: boolean;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onFeedback?: (rating: 'positive' | 'negative') => void;
  className?: string;
}

export const MessageActionButtons: React.FC<MessageActionButtonsProps> = ({
  messageId,
  content,
  isLatest = false,
  isStreaming = false,
  onRegenerate,
  onFeedback,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);

  if (isStreaming || !content) return null;

  const handleCopyMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleThumb = (type: 'positive' | 'negative', e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = feedback === type ? null : type;
    setFeedback(nextState);
    if (nextState) {
      setShowFeedbackToast(true);
      setTimeout(() => setShowFeedbackToast(false), 2500);
      onFeedback?.(type);
    }
  };

  return (
    <div className={`flex items-center gap-1 text-[11px] text-zinc-400 transition-opacity duration-150 relative ${className}`}>
      {/* Copy as Markdown */}
      <button
        type="button"
        onClick={handleCopyMarkdown}
        title="Copy message as Markdown"
        aria-label={copied ? 'Copied as Markdown' : 'Copy as Markdown'}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer text-[10px] font-medium"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-600" />
            <span className="text-emerald-600 font-bold">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Regenerate Turn (if latest) */}
      {isLatest && onRegenerate && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onRegenerate();
          }}
          title="Regenerate this response"
          aria-label="Regenerate this response"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer text-[10px] font-medium"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Regenerate</span>
        </button>
      )}

      {/* Thumbs Feedback */}
      <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-zinc-200">
        <button
          type="button"
          onClick={e => handleThumb('positive', e)}
          title="Good response"
          aria-label="Thumbs up"
          className={`p-1 rounded-md transition cursor-pointer ${
            feedback === 'positive'
              ? 'text-emerald-600 bg-emerald-50'
              : 'hover:text-emerald-600 hover:bg-zinc-100 text-zinc-400'
          }`}
        >
          <ThumbsUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={e => handleThumb('negative', e)}
          title="Poor response"
          aria-label="Thumbs down"
          className={`p-1 rounded-md transition cursor-pointer ${
            feedback === 'negative'
              ? 'text-red-600 bg-red-50'
              : 'hover:text-red-600 hover:bg-zinc-100 text-zinc-400'
          }`}
        >
          <ThumbsDown className="w-3 h-3" />
        </button>
      </div>

      {/* Feedback Toast */}
      <AnimatePresence>
        {showFeedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-0 bottom-full mb-1 z-20 px-2 py-1 rounded-lg bg-zinc-900 text-white text-[9px] font-semibold flex items-center gap-1 shadow-md pointer-events-none whitespace-nowrap"
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>Thank you for your feedback!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
