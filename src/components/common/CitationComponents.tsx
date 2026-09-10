import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, BookOpen, Globe, FileText, HelpCircle, Copy, Check, Sparkles, X, ShieldCheck } from 'lucide-react';
import { GroundingSource } from '../../types';

interface CitationPopoverProps {
  source: GroundingSource;
  citationIndex: number;
  isOpen: boolean;
  onClose: () => void;
  triggerRect: DOMRect | null;
}

export const CitationPopover: React.FC<CitationPopoverProps> = ({
  source,
  citationIndex,
  isOpen,
  onClose,
  triggerRect,
}) => {
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !triggerRect) return null;

  const handleCopyExcerpt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (source.snippet) {
      navigator.clipboard.writeText(source.snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSourceIcon = () => {
    if (source.url || source.sourceType === 'url') {
      return <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    }
    if (source.sourceType === 'pdf' || source.sourceType === 'document') {
      return <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    }
    if (source.sourceType === 'faq') {
      return <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
    }
    return <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
  };

  // Compute position relative to viewport
  const popoverWidth = 320;
  let top = triggerRect.bottom + 8;
  let left = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2;

  // Viewport bounds protection
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  if (left < 12) left = 12;
  if (left + popoverWidth > windowWidth - 12) {
    left = windowWidth - popoverWidth - 12;
  }

  // If overflows bottom, position above trigger
  const estimatedHeight = 220;
  if (top + estimatedHeight > windowHeight - 12) {
    top = Math.max(12, triggerRect.top - estimatedHeight - 8);
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            top: `${top}px`,
            left: `${left}px`,
            width: `${popoverWidth}px`,
          }}
          className="pointer-events-auto absolute bg-white rounded-2xl border border-zinc-200/90 shadow-xl p-3.5 text-xs text-zinc-800 space-y-2.5 z-50 backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] font-mono shrink-0">
                [{citationIndex}]
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                {getSourceIcon()}
                <h4 className="font-bold text-zinc-900 truncate text-xs font-heading">
                  {source.title || 'Knowledge Source'}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 transition cursor-pointer"
              aria-label="Close citation details"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* URL Badge / Destination if applicable */}
          {source.url && (
            <div className="flex items-center justify-between gap-2 bg-blue-50/60 border border-blue-100 rounded-xl px-2.5 py-1.5 text-[11px]">
              <span className="text-blue-900 font-mono truncate max-w-[200px]" title={source.url}>
                {source.url.replace(/^https?:\/\//, '')}
              </span>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 shrink-0"
              >
                <span>Visit</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}

          {/* Exact Passage Excerpt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-semibold uppercase tracking-wider font-mono">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Grounded Passage</span>
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                RAG Verified
              </span>
            </div>
            <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200/70 text-[11px] leading-relaxed text-zinc-700 italic max-h-36 overflow-y-auto scrollbar-thin">
              {source.snippet ? `"${source.snippet}"` : 'Source passage referenced in generation.'}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-[10px] text-zinc-400 font-mono">
              Grounding Vector Reference
            </span>
            {source.snippet && (
              <button
                type="button"
                onClick={handleCopyExcerpt}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-[10px] transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-zinc-500" />
                    <span>Copy Excerpt</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

interface CitationBadgeProps {
  index: number;
  source?: GroundingSource;
  onOpenSourceModal?: (source: GroundingSource, index: number, rect: DOMRect) => void;
  className?: string;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({
  index,
  source,
  onOpenSourceModal,
  className = '',
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!source) return;

    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setTriggerRect(rect);
      if (onOpenSourceModal) {
        onOpenSourceModal(source, index, rect);
      } else {
        setIsPopoverOpen(!isPopoverOpen);
      }
    }
  };

  return (
    <>
      <button
        ref={badgeRef}
        type="button"
        onClick={handleClick}
        title={source?.title ? `Source [${index}]: ${source.title}` : `Source [${index}]`}
        className={`inline-flex items-center justify-center align-super text-[9px] font-mono font-bold leading-none px-1.5 py-0.5 mx-0.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200/90 shadow-2xs transition-all cursor-pointer select-none active:scale-95 ${className}`}
        aria-label={`Inspect citation ${index}`}
      >
        <span>[{index}]</span>
      </button>

      {source && (
        <CitationPopover
          source={source}
          citationIndex={index}
          isOpen={isPopoverOpen}
          onClose={() => setIsPopoverOpen(false)}
          triggerRect={triggerRect}
        />
      )}
    </>
  );
};

interface TrustSummaryPillProps {
  sources: GroundingSource[];
  onOpenSourceModal?: (source: GroundingSource, index: number, rect: DOMRect) => void;
  className?: string;
}

export const TrustSummaryPill: React.FC<TrustSummaryPillProps> = ({
  sources,
  onOpenSourceModal,
  className = '',
}) => {
  const [selectedSource, setSelectedSource] = useState<{ source: GroundingSource; index: number; rect: DOMRect } | null>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  if (!sources || sources.length === 0) return null;

  const handleOpenFirstSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pillRef.current && sources.length > 0) {
      const rect = pillRef.current.getBoundingClientRect();
      if (onOpenSourceModal) {
        onOpenSourceModal(sources[0], 1, rect);
      } else {
        setSelectedSource({ source: sources[0], index: 1, rect });
      }
    }
  };

  return (
    <>
      <button
        ref={pillRef}
        type="button"
        onClick={handleOpenFirstSource}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold shadow-2xs transition-all cursor-pointer select-none ${className}`}
        title="Click to inspect grounding passage excerpts"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          {sources.length} source{sources.length > 1 ? 's' : ''} verified
        </span>
      </button>

      {selectedSource && (
        <CitationPopover
          source={selectedSource.source}
          citationIndex={selectedSource.index}
          isOpen={!!selectedSource}
          onClose={() => setSelectedSource(null)}
          triggerRect={selectedSource.rect}
        />
      )}
    </>
  );
};
