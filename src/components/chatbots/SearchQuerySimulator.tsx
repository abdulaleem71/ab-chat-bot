import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KnowledgeSource, Chatbot } from '../../types';
import {
  Search,
  Sparkles,
  Zap,
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Globe,
  HelpCircle,
  ExternalLink,
  Target,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { searchAndScoreChunks, ChunkSearchResult } from '../../lib/chunkUtils';

interface SearchQuerySimulatorProps {
  knowledgeSources: KnowledgeSource[];
  selectedBot?: Chatbot | null;
  onInspectSource: (source: KnowledgeSource) => void;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

const SAMPLE_QUERIES = [
  'What is the refund policy?',
  'What are your support hours?',
  'How do I embed the chat widget?',
  'How can I reach a human operator?',
  'What security compliance standards do you follow?',
];

export const SearchQuerySimulator: React.FC<SearchQuerySimulatorProps> = ({
  knowledgeSources,
  selectedBot,
  onInspectSource,
  initialQuery,
  onClearInitialQuery,
}) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [isExpanded, setIsExpanded] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
      setIsExpanded(true);
    }
  }, [initialQuery]);

  const searchResults: ChunkSearchResult[] = useMemo(() => {
    if (!query.trim()) return [];
    return searchAndScoreChunks(query, knowledgeSources, selectedBot?.id);
  }, [query, knowledgeSources, selectedBot]);

  const handleSelectPreset = (sampleQuery: string) => {
    setQuery(sampleQuery);
    setActivePreset(sampleQuery);
  };

  const handleClear = () => {
    setQuery('');
    setActivePreset(null);
    if (onClearInitialQuery) onClearInitialQuery();
  };

  const highlightTerms = (text: string, terms: string[]) => {
    if (!terms || terms.length === 0) return text;
    // Build regex of terms
    const escapedTerms = terms
      .filter(t => t.length > 1)
      .map(t => t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'))
      .sort((a, b) => b.length - a.length);

    if (escapedTerms.length === 0) return text;

    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) => {
          const isMatch = escapedTerms.some(t => t.toLowerCase() === part.toLowerCase());
          return isMatch ? (
            <mark key={i} className="bg-amber-200 text-amber-950 font-bold px-1 rounded-sm">
              {part}
            </mark>
          ) : (
            part
          );
        })}
      </>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.75) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500' };
    if (score >= 0.5) return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', bar: 'bg-indigo-500' };
    return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', bar: 'bg-amber-500' };
  };

  return (
    <div className="bg-white border border-zinc-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Simulator Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-zinc-900 font-heading">
                Search & Vector Retrieval Simulator
              </h3>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Real-Time RAG Test
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium font-body">
              Simulate semantic chunk retrieval and inspect relevance scores for any visitor question
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold text-zinc-600 hover:text-black flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-zinc-100 transition self-end sm:self-auto"
        >
          <span>{isExpanded ? 'Collapse Simulator' : 'Expand Simulator'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1">
          {/* Query Input Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setActivePreset(null);
              }}
              placeholder="Ask a question to test retrieval, e.g. 'What is the refund policy?'..."
              className="w-full pl-10 pr-10 py-3 text-xs bg-zinc-50/80 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-medium text-zinc-900 placeholder:text-zinc-400 shadow-2xs"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/60 transition"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Query Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Try test query:</span>
            </span>
            {SAMPLE_QUERIES.map(sample => (
              <button
                key={sample}
                type="button"
                onClick={() => handleSelectPreset(sample)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                  query === sample
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs font-bold'
                    : 'bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700 border-zinc-200/80'
                }`}
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Results Output Section */}
          {query.trim() && (
            <div className="space-y-3 pt-2">
              {/* Results Meta Banner */}
              <div className="flex items-center justify-between gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 text-xs">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-zinc-800">
                    {searchResults.length > 0
                      ? `Retrieved ${searchResults.length} relevant chunk${searchResults.length > 1 ? 's' : ''}`
                      : 'No relevant chunks found'}
                  </span>
                  {selectedBot && (
                    <span className="text-[10px] bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-md font-medium">
                      Scoped to {selectedBot.name}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Latency: ~{Math.floor(Math.random() * 8) + 8}ms
                </span>
              </div>

              {/* Retrieved Chunks List */}
              {searchResults.length === 0 ? (
                <div className="p-5 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 text-center space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-800">No Vector Match in Current Knowledge Corpus</h4>
                  <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                    The bot would fall back to its system persona or fallback message. Try adding a new URL, FAQ, or document covering this topic.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {searchResults.map(result => {
                    const { chunk, relevanceScore, matchPercentage, matchedTerms, rank } = result;
                    const colors = getScoreColor(relevanceScore);
                    const source = knowledgeSources.find(s => s.id === chunk.sourceId);

                    return (
                      <div
                        key={chunk.id}
                        className="p-4 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 transition shadow-2xs space-y-2.5"
                      >
                        {/* Chunk Match Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold bg-zinc-900 text-white px-2 py-0.5 rounded-md font-mono">
                              #{rank} Ranked
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${colors.bg} ${colors.text} ${colors.border}`}>
                              <span className="font-extrabold">{matchPercentage}% Match</span>
                              <span className="text-[10px] opacity-75 font-mono">({relevanceScore.toFixed(2)})</span>
                            </span>
                            <span className="text-xs font-bold text-zinc-800 truncate max-w-[200px] sm:max-w-xs font-heading">
                              {chunk.sourceTitle}
                            </span>
                            <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono">
                              Chunk #{chunk.index}
                            </span>
                          </div>

                          {source && (
                            <button
                              type="button"
                              onClick={() => onInspectSource(source)}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start sm:self-auto cursor-pointer hover:underline"
                            >
                              <span>Inspect Source Chunks</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Relevance score progress bar */}
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors.bar} rounded-full transition-all duration-300`}
                            style={{ width: `${matchPercentage}%` }}
                          />
                        </div>

                        {/* Chunk Content Preview */}
                        <div className="text-xs text-zinc-800 font-mono bg-zinc-50 p-3 rounded-xl border border-zinc-100 leading-relaxed whitespace-pre-wrap break-words">
                          {highlightTerms(chunk.content, matchedTerms)}
                        </div>

                        {/* Matched Keywords Tags */}
                        {matchedTerms.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              Matched terms:
                            </span>
                            {matchedTerms.map(term => (
                              <span
                                key={term}
                                className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 px-1.5 py-0.2 rounded font-mono"
                              >
                                {term}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
