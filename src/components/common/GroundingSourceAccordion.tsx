import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Globe,
  FileText,
  HelpCircle,
  Copy,
  Check,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { GroundingSource } from '../../types';
import { CitationPopover, TrustSummaryPill } from './CitationComponents';

export interface GroundingSourceAccordionProps {
  sources?: GroundingSource[];
  variant?: 'inline' | 'panel' | 'badge-only';
  initialExpanded?: boolean;
  botName?: string;
  className?: string;
}

export const GroundingSourceAccordion: React.FC<GroundingSourceAccordionProps> = ({
  sources = [],
  variant = 'inline',
  initialExpanded = false,
  botName,
  className = '',
}) => {
  const [isMasterExpanded, setIsMasterExpanded] = useState<boolean>(
    variant === 'panel' ? true : initialExpanded
  );
  // Track individually expanded source snippet indices
  const [expandedSnippets, setExpandedSnippets] = useState<Record<number, boolean>>(() => {
    if (variant === 'panel') {
      const all: Record<number, boolean> = {};
      sources.forEach((_, idx) => {
        all[idx] = true;
      });
      return all;
    }
    return {};
  });

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [activePopover, setActivePopover] = useState<{ source: GroundingSource; index: number; rect: DOMRect } | null>(null);

  if (!sources || sources.length === 0) {
    if (variant === 'panel') {
      return (
        <div className={`p-6 text-center text-zinc-400 bg-zinc-50/50 rounded-2xl border border-zinc-200/70 space-y-2 ${className}`}>
          <BookOpen className="w-6 h-6 mx-auto text-zinc-300" />
          <p className="text-xs font-semibold text-zinc-600">No Grounding Citations Yet</p>
          <p className="text-[11px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
            Ask a question to see the RAG retrieval pipeline query knowledge chunks and cite sources in real time.
          </p>
        </div>
      );
    }
    return null;
  }

  const toggleSnippet = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedSnippets(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleCopySnippet = (text: string, idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleAll = () => {
    const nextState = !isMasterExpanded;
    setIsMasterExpanded(nextState);
    if (nextState) {
      const allOpen: Record<number, boolean> = {};
      sources.forEach((_, idx) => {
        allOpen[idx] = true;
      });
      setExpandedSnippets(allOpen);
    }
  };

  const handleOpenSourceModal = (source: GroundingSource, index: number, rect: DOMRect) => {
    setActivePopover({ source, index, rect });
  };

  const filteredSources = searchFilter.trim()
    ? sources.filter(
        s =>
          s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (s.snippet && s.snippet.toLowerCase().includes(searchFilter.toLowerCase())) ||
          (s.url && s.url.toLowerCase().includes(searchFilter.toLowerCase()))
      )
    : sources;

  const getSourceIcon = (source: GroundingSource) => {
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

  // ----------------------------------------------------
  // INLINE VARIANT (used in chat bubbles)
  // ----------------------------------------------------
  if (variant === 'inline') {
    return (
      <div className={`mt-2.5 pt-2 border-t border-zinc-100/90 text-xs ${className}`}>
        {/* Accordion Master Trigger with Trust Pill and Summary Badge */}
        <div className="w-full flex items-center justify-between text-left py-1 text-zinc-600 transition-colors">
          <div className="flex items-center gap-2 flex-wrap">
            <TrustSummaryPill
              sources={sources}
              onOpenSourceModal={handleOpenSourceModal}
            />
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-900 px-1.5 py-0.5 rounded hover:bg-zinc-100 cursor-pointer transition"
              aria-expanded={isMasterExpanded}
            >
              <span>{isMasterExpanded ? 'Hide Passages' : 'View Passages'}</span>
              <motion.span
                animate={{ rotate: isMasterExpanded ? 180 : 0 }}
                transition={{ duration: 0.18 }}
                className="inline-flex"
              >
                <ChevronDown className="w-3 h-3" />
              </motion.span>
            </button>
          </div>
        </div>

        {/* Collapsible Source List */}
        <AnimatePresence initial={false}>
          {isMasterExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden space-y-1.5 pt-2"
            >
              {sources.map((src, idx) => {
                const isSnippetOpen = expandedSnippets[idx] ?? false;

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-2.5 transition-colors hover:bg-zinc-50"
                  >
                    {/* Source Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 font-extrabold text-[9px] font-mono shrink-0">
                          {idx + 1}
                        </span>
                        {getSourceIcon(src)}
                        <span className="font-semibold text-zinc-800 text-[11px] truncate">
                          {src.title || 'Knowledge Base Document'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {src.url && (
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-zinc-400 hover:text-indigo-600 rounded transition"
                            title={`Open source website: ${src.url}`}
                            aria-label={`Open source URL for ${src.title}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {src.snippet && (
                          <button
                            type="button"
                            onClick={e => toggleSnippet(idx, e)}
                            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 px-1.5 py-0.5 rounded hover:bg-zinc-200/60 cursor-pointer transition"
                            aria-expanded={isSnippetOpen}
                          >
                            <span>{isSnippetOpen ? 'Less' : 'Excerpt'}</span>
                            <motion.span
                              animate={{ rotate: isSnippetOpen ? 180 : 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </motion.span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Snippet Excerpt */}
                    <AnimatePresence initial={false}>
                      {isSnippetOpen && src.snippet && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 pt-2 border-t border-zinc-200/60 text-[11px] text-zinc-600 bg-white/80 p-2 rounded-lg border border-zinc-200/50 leading-relaxed font-body relative group">
                            <p className="italic">"{src.snippet}"</p>
                            <div className="mt-1.5 flex items-center justify-between text-[9px] text-zinc-400">
                              <span className="font-mono">Chunk Excerpt</span>
                              <button
                                type="button"
                                onClick={e => handleCopySnippet(src.snippet, idx, e)}
                                className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                                aria-label="Copy snippet"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    <span className="text-emerald-600 font-bold">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-2.5 h-2.5" />
                                    <span>Copy Snippet</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Click-to-Inspect Popover */}
        {activePopover && (
          <CitationPopover
            source={activePopover.source}
            citationIndex={activePopover.index}
            isOpen={!!activePopover}
            onClose={() => setActivePopover(null)}
            triggerRect={activePopover.rect}
          />
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // PANEL VARIANT (used in Playground Inspection Sidebar)
  // ----------------------------------------------------
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header with Counter and Quick Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider font-heading">
            Grounding Citations ({sources.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={toggleAll}
          className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer transition"
        >
          {isMasterExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Search Filter when multiple sources */}
      {sources.length > 2 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Filter citations by keyword..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium"
          />
        </div>
      )}

      {/* Cards List */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {filteredSources.map((src, idx) => {
          const isSnippetOpen = expandedSnippets[idx] ?? true;

          return (
            <div
              key={idx}
              className="p-3 bg-zinc-50/80 rounded-2xl border border-zinc-200/80 space-y-1.5 text-xs shadow-2xs hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 font-extrabold text-[9px] font-mono shrink-0">
                    {idx + 1}
                  </span>
                  {getSourceIcon(src)}
                  <span className="font-bold text-zinc-900 truncate text-[11px]">
                    {src.title}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-zinc-400 hover:text-indigo-600 transition"
                      title={src.url}
                      aria-label={`Open link for ${src.title}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={e => toggleSnippet(idx, e)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                    aria-label={isSnippetOpen ? 'Collapse snippet' : 'Expand snippet'}
                  >
                    <motion.span
                      animate={{ rotate: isSnippetOpen ? 180 : 0 }}
                      transition={{ duration: 0.15 }}
                      className="inline-flex"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </motion.span>
                  </button>
                </div>
              </div>

              {/* Collapsible snippet */}
              <AnimatePresence initial={false}>
                {isSnippetOpen && src.snippet && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white p-2 rounded-xl border border-zinc-200/70 text-[11px] text-zinc-600 leading-relaxed font-body relative group">
                      <p className="italic font-normal">"{src.snippet}"</p>
                      <div className="mt-2 pt-1.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="font-mono text-[9px] uppercase">RAG Matched Excerpt</span>
                        <button
                          type="button"
                          onClick={e => handleCopySnippet(src.snippet, idx, e)}
                          className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer font-medium"
                          aria-label="Copy snippet"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Excerpt</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {activePopover && (
        <CitationPopover
          source={activePopover.source}
          citationIndex={activePopover.index}
          isOpen={!!activePopover}
          onClose={() => setActivePopover(null)}
          triggerRect={activePopover.rect}
        />
      )}
    </div>
  );
};
