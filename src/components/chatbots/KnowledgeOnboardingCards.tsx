import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  FileText,
  HelpCircle,
  Upload,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  File,
  X,
  Layers,
} from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import { parseKnowledgeFile, ParsedKnowledgeFile } from '../../lib/fileUploadUtils';

interface KnowledgeOnboardingCardsProps {
  onCrawlUrl: (url: string) => Promise<void>;
  onUploadDocument: (title: string, content: string) => Promise<void>;
  onAddFaq: (question: string, answer: string) => Promise<void>;
  onLoadSamplePack?: () => Promise<void>;
  onSelectTab: (tab: 'url' | 'local' | 'faq' | 'text') => void;
  isLoading?: boolean;
  selectedChatbotCount?: number;
}

export const KnowledgeOnboardingCards: React.FC<KnowledgeOnboardingCardsProps> = ({
  onCrawlUrl,
  onUploadDocument,
  onAddFaq,
  onLoadSamplePack,
  onSelectTab,
  isLoading = false,
  selectedChatbotCount = 1,
}) => {
  // Card 1: Crawl Website State
  const [crawlUrlInput, setCrawlUrlInput] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);

  // Card 2: Document Upload & Dropzone State
  const [isDragging, setIsDragging] = useState(false);
  const [parsedFile, setParsedFile] = useState<ParsedKnowledgeFile | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Card 3: Quick FAQ State
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  // 1. Handle Crawl Website
  const handleQuickCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrlInput.trim() || isCrawling || isLoading) return;
    setIsCrawling(true);
    try {
      await onCrawlUrl(crawlUrlInput.trim());
      setCrawlUrlInput('');
    } catch {
      // Error handled by parent
    } finally {
      setIsCrawling(false);
    }
  };

  // 2. Handle File Processing
  const processSelectedFile = async (file: File) => {
    setFileError(null);
    try {
      const parsed = await parseKnowledgeFile(file);
      if (!parsed.content || parsed.content.length < 5) {
        setFileError('File contains insufficient readable text.');
        return;
      }
      setParsedFile(parsed);
    } catch (err: any) {
      setFileError(err?.message || 'Could not parse the selected file.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processSelectedFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processSelectedFile(file);
    }
  };

  const handleIngestParsedFile = async () => {
    if (!parsedFile || isUploadingDoc || isLoading) return;
    setIsUploadingDoc(true);
    try {
      await onUploadDocument(parsedFile.title, parsedFile.content);
      setParsedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // Error handled by parent
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // 3. Handle Quick FAQ Add
  const handleQuickFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQ.trim() || !faqA.trim() || isAddingFaq || isLoading) return;
    setIsAddingFaq(true);
    try {
      await onAddFaq(faqQ.trim(), faqA.trim());
      setFaqQ('');
      setFaqA('');
    } catch {
      // Error handled by parent
    } finally {
      setIsAddingFaq(false);
    }
  };

  const handleFillSampleFaq = () => {
    setFaqQ('What is your refund policy?');
    setFaqA('We provide a 100% money-back guarantee within 30 days of initial purchase with zero questions asked.');
  };

  return (
    <div className="space-y-6">
      {/* Onboarding Intro Header */}
      <div className="text-center max-w-xl mx-auto space-y-1.5 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider font-mono shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>RAG Vector Grounding</span>
        </div>
        <h3 className="text-lg sm:text-xl font-black text-zinc-950 font-heading tracking-tight">
          Choose How to Ground Your AI Knowledge
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 font-normal font-body">
          Connect your business data to provide precise, hallucination-free answers to your visitors.
        </p>
      </div>

      {/* Three Onboarding Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: 🌐 Crawl Website */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-3xl p-5 shadow-xs flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="space-y-3.5">
            {/* Header Icon & Title */}
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600 bg-sky-50/80 px-2.5 py-0.5 rounded-full border border-sky-200/60">
                Web Crawler
              </span>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-zinc-950 font-heading">
                🌐 Crawl Website
              </h4>
              <p className="text-xs text-zinc-500 mt-1 font-body">
                Paste your website or docs URL
              </p>
            </div>

            {/* Quick URL Input Form */}
            <form onSubmit={handleQuickCrawl} className="space-y-2.5 pt-1">
              <div className="relative">
                <input
                  type="url"
                  value={crawlUrlInput}
                  onChange={e => setCrawlUrlInput(e.target.value)}
                  placeholder="https://example.com/docs"
                  className="w-full px-3 py-2 text-xs bg-zinc-50/80 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-body text-zinc-900 placeholder:text-zinc-400"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <MotionButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  shimmer
                  disabled={isCrawling || isLoading || !crawlUrlInput.trim() || selectedChatbotCount === 0}
                  leftIcon={isCrawling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                  className="w-full text-xs font-bold"
                >
                  {isCrawling ? 'Crawling...' : 'Crawl & Index'}
                </MotionButton>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Auto-cleans scripts & ads</span>
            <button
              type="button"
              onClick={() => onSelectTab('url')}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer hover:underline"
            >
              <span>Full Tab</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* Card 2: 📄 Upload Document (Dropzone) */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className={`bg-white border transition-all rounded-3xl p-5 shadow-xs flex flex-col justify-between group relative ${
            isDragging
              ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/30'
              : 'border-zinc-200/90 hover:border-zinc-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-3.5">
            {/* Header Icon & Title */}
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                Drag & Drop
              </span>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-zinc-950 font-heading">
                📄 Upload Document
              </h4>
              <p className="text-xs text-zinc-500 mt-1 font-body">
                Drag-and-drop PDF, TXT, or Markdown
              </p>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown,.json,.csv,.docx,text/plain,application/pdf,text/markdown"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Dropzone Area */}
            {parsedFile ? (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-white text-indigo-600 rounded-lg shadow-2xs shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate font-heading">
                        {parsedFile.fileName}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {parsedFile.formattedSize} • ~{parsedFile.estimatedChunks} chunks
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParsedFile(null)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-white/60"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <MotionButton
                  type="button"
                  variant="primary"
                  size="sm"
                  shimmer
                  onClick={handleIngestParsedFile}
                  disabled={isUploadingDoc || isLoading || selectedChatbotCount === 0}
                  leftIcon={isUploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                  className="w-full text-xs font-bold"
                >
                  {isUploadingDoc ? 'Chunking & Indexing...' : 'Ingest Document'}
                </MotionButton>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-2xl p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-100/50'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100/70'
                }`}
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-zinc-800 font-heading">
                  Drop file here or <span className="text-indigo-600 underline">browse</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  PDF, TXT, MD, CSV, JSON
                </span>
              </div>
            )}

            {fileError && (
              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{fileError}</span>
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Extracts clean text</span>
            <button
              type="button"
              onClick={() => onSelectTab('text')}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer hover:underline"
            >
              <span>Full Tab</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* Card 3: ❓ Import FAQs */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-3xl p-5 shadow-xs flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="space-y-3.5">
            {/* Header Icon & Title */}
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                Direct Q&A
              </span>
            </div>

            <div>
              <h4 className="text-sm font-extrabold text-zinc-950 font-heading">
                ❓ Import FAQs
              </h4>
              <p className="text-xs text-zinc-500 mt-1 font-body">
                Quick-paste Q&A pairs
              </p>
            </div>

            {/* Quick FAQ Form */}
            <form onSubmit={handleQuickFaq} className="space-y-2 pt-0.5">
              <input
                type="text"
                value={faqQ}
                onChange={e => setFaqQ(e.target.value)}
                placeholder="Question (e.g., Refund policy?)"
                className="w-full px-3 py-1.5 text-xs bg-zinc-50/80 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-body text-zinc-900 placeholder:text-zinc-400"
                required
              />
              <textarea
                value={faqA}
                onChange={e => setFaqA(e.target.value)}
                rows={2}
                placeholder="Answer (e.g., Full refunds within 30 days.)"
                className="w-full px-3 py-1.5 text-xs bg-zinc-50/80 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-body text-zinc-900 placeholder:text-zinc-400"
                required
              />

              <div className="flex items-center gap-2">
                <MotionButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  shimmer
                  disabled={isAddingFaq || isLoading || !faqQ.trim() || !faqA.trim() || selectedChatbotCount === 0}
                  leftIcon={isAddingFaq ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HelpCircle className="w-3.5 h-3.5" />}
                  className="flex-1 text-xs font-bold"
                >
                  {isAddingFaq ? 'Adding...' : 'Add FAQ'}
                </MotionButton>
                <button
                  type="button"
                  onClick={handleFillSampleFaq}
                  className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0"
                  title="Prefill a sample refund policy question"
                >
                  Fill Sample
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
            <span>High-precision Q&A matching</span>
            <button
              type="button"
              onClick={() => onSelectTab('faq')}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer hover:underline"
            >
              <span>Full Tab</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Sample Pack Helper Banner */}
      {onLoadSamplePack && (
        <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-zinc-900 font-heading">
                Want to test vector search immediately without setup?
              </p>
              <p className="text-[11px] text-zinc-500 font-body">
                Load 2 curated knowledge documents covering support hours, features, and embed guidelines.
              </p>
            </div>
          </div>
          <MotionButton
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
            onClick={onLoadSamplePack}
            disabled={isLoading || selectedChatbotCount === 0}
            className="shrink-0 self-end sm:self-auto font-bold"
          >
            Load Sample Pack
          </MotionButton>
        </div>
      )}
    </div>
  );
};
