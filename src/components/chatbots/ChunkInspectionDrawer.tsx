import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KnowledgeSource } from '../../types';
import {
  X,
  FileText,
  Globe,
  HelpCircle,
  Copy,
  Check,
  Search,
  Hash,
  Cpu,
  Layers,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Database,
} from 'lucide-react';
import { extractChunksFromSource, calculateSourceMetrics, KnowledgeChunkDetail } from '../../lib/chunkUtils';

interface ChunkInspectionDrawerProps {
  source: KnowledgeSource | null;
  isOpen: boolean;
  onClose: () => void;
  onTestQuery?: (query: string) => void;
}

export const ChunkInspectionDrawer: React.FC<ChunkInspectionDrawerProps> = ({
  source,
  isOpen,
  onClose,
  onTestQuery,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    if (!source) return null;
    return calculateSourceMetrics(source);
  }, [source]);

  const allChunks = useMemo(() => {
    if (!source) return [];
    return extractChunksFromSource(source);
  }, [source]);

  const filteredChunks = useMemo(() => {
    if (!filterQuery.trim()) return allChunks;
    const q = filterQuery.toLowerCase();
    return allChunks.filter(
      c =>
        c.content.toLowerCase().includes(q) ||
        `chunk #${c.index}`.toLowerCase().includes(q)
    );
  }, [allChunks, filterQuery]);

  const handleCopyChunk = (chunk: KnowledgeChunkDetail) => {
    navigator.clipboard.writeText(chunk.content);
    setCopiedChunkId(chunk.id);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!isOpen || !source) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white h-full shadow-2xl z-10 flex flex-col overflow-hidden border-l border-zinc-200"
        >
          {/* Header */}
          <div className="p-5 bg-zinc-900 text-white border-b border-zinc-800 flex items-start justify-between gap-4 shrink-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
                  {source.type === 'url' ? (
                    <Globe className="w-4 h-4 text-sky-400" />
                  ) : source.type === 'faq' ? (
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-400" />
                  )}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  {source.type} Source
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {source.status === 'indexed' ? 'Vector Indexed' : source.status}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white truncate font-heading">
                {source.title}
              </h2>
              {source.sourceUrl && (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 mt-1 font-mono truncate"
                >
                  <span className="truncate">{source.sourceUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer shrink-0"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metrics Summary Strip */}
          {metrics && (
            <div className="grid grid-cols-4 gap-2 p-4 bg-zinc-50 border-b border-zinc-200 text-center shrink-0">
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-zinc-400 mb-0.5">
                  <Layers className="w-3 h-3 text-indigo-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Chunks</span>
                </div>
                <div className="text-sm font-black text-zinc-900 font-heading">{metrics.totalChunks}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-zinc-400 mb-0.5">
                  <Hash className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Characters</span>
                </div>
                <div className="text-sm font-black text-zinc-900 font-heading">{metrics.totalChars.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-zinc-400 mb-0.5">
                  <Cpu className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tokens</span>
                </div>
                <div className="text-sm font-black text-zinc-900 font-heading">~{metrics.totalTokens.toLocaleString()}</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-zinc-400 mb-0.5">
                  <Database className="w-3 h-3 text-purple-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Avg / Chunk</span>
                </div>
                <div className="text-sm font-black text-zinc-900 font-heading">{metrics.avgChunkSize}c</div>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="p-4 border-b border-zinc-100 bg-white flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                placeholder="Filter within chunk text or chunk number..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium"
              />
              {filterQuery && (
                <button
                  type="button"
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-[11px] font-bold text-zinc-500 shrink-0 font-mono">
              {filteredChunks.length} of {allChunks.length}
            </span>
          </div>

          {/* Chunks List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/40">
            {filteredChunks.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-2.5">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-zinc-800">No matching chunks found</h4>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Try adjusting your filter keyword or clear search to view all chunks.
                </p>
              </div>
            ) : (
              filteredChunks.map(chunk => {
                const isCopied = copiedChunkId === chunk.id;
                return (
                  <div
                    key={chunk.id}
                    className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 transition group space-y-2.5"
                  >
                    {/* Chunk Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold bg-zinc-900 text-white px-2 py-0.5 rounded-md font-mono">
                          Chunk #{chunk.index}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 font-mono">
                          {chunk.charCount} chars • ~{chunk.estimatedTokens} tokens
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onTestQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              const previewWords = chunk.content.slice(0, 60).trim();
                              onTestQuery(previewWords);
                              onClose();
                            }}
                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Simulate vector query with this chunk"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Test Retrieval</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCopyChunk(chunk)}
                          className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition cursor-pointer"
                          title="Copy chunk text"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Chunk Text */}
                    <div className="text-xs text-zinc-800 font-normal leading-relaxed bg-zinc-50/70 p-3 rounded-xl border border-zinc-100/80 font-mono whitespace-pre-wrap break-words">
                      {highlightMatch(chunk.content, filterQuery)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-zinc-200 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-zinc-500 font-medium">
              RAG Embeddings are generated with 350-char window & 40-char overlap.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-black cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
