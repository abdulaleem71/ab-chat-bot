import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Chatbot, KnowledgeSource } from '../../types';
import {
  Globe,
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Loader2,
  Link2,
  ExternalLink,
  Laptop,
  Code,
  Check,
  Bot,
  BookOpen,
  AlertTriangle,
  Layers,
  Eye,
  Search,
  Zap,
  BarChart3,
  Database,
  Upload,
} from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState, KnowledgeEmptyState } from '../common/EmptyState';
import { KnowledgeChunkRowSkeleton, KnowledgeChunkRowsSkeleton } from '../common/SkeletonLoader';
import { ChunkInspectionDrawer } from './ChunkInspectionDrawer';
import { SearchQuerySimulator } from './SearchQuerySimulator';
import { IngestionProgressBar, IngestionStep } from './IngestionProgressBar';
import { KnowledgeOnboardingCards } from './KnowledgeOnboardingCards';
import { extractChunksFromSource, calculateSourceMetrics } from '../../lib/chunkUtils';
import { parseKnowledgeFile } from '../../lib/fileUploadUtils';

interface KnowledgeManagerProps {
  chatbots: Chatbot[];
  selectedBot?: Chatbot | null;
  onSelectBot?: (bot: Chatbot) => void;
  knowledgeSources: KnowledgeSource[];
  isFetchingSources?: boolean;
  onAddSource: (source: Partial<KnowledgeSource> & { chatbotIds: string[] }) => Promise<void>;
  onScrapeUrl: (url: string, chatbotIds: string[]) => Promise<void>;
  onIngestHtml?: (html: string, url?: string, title?: string, chatbotIds?: string[]) => Promise<void>;
  onUpdateSourceLinks: (sourceId: string, chatbotIds: string[]) => Promise<void>;
  onDeleteSource: (sourceId: string) => Promise<void>;
  onCreateBot?: () => void;
}

export const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({
  chatbots = [],
  selectedBot,
  onSelectBot,
  knowledgeSources = [],
  isFetchingSources = false,
  onAddSource,
  onScrapeUrl,
  onIngestHtml,
  onUpdateSourceLinks,
  onDeleteSource,
  onCreateBot,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'local' | 'faq' | 'text'>('url');
  const [inputUrl, setInputUrl] = useState('');
  const [localUrl, setLocalUrl] = useState('http://localhost:3000');
  const [rawHtmlContent, setRawHtmlContent] = useState('');
  const [htmlDocTitle, setHtmlDocTitle] = useState('');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');

  // Chunk Inspection Drawer State
  const [selectedSourceForInspection, setSelectedSourceForInspection] = useState<KnowledgeSource | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Granular Ingestion Progression State
  const [ingestionStep, setIngestionStep] = useState<IngestionStep | null>(null);
  const [ingestingUrl, setIngestingUrl] = useState<string>('');

  // Search Simulator Query State
  const [simulatorInitialQuery, setSimulatorInitialQuery] = useState<string>('');

  // Multi-select chatbots for new source (default to activeBot or all chatbots)
  const [selectedChatbotIds, setSelectedChatbotIds] = useState<string[]>(() => {
    if (selectedBot) return [selectedBot.id];
    return chatbots.map(b => b.id);
  });

  // Keep selected target bots in sync with activeBot and chatbots list
  useEffect(() => {
    if (selectedChatbotIds.length === 0 && chatbots.length > 0) {
      if (selectedBot) {
        setSelectedChatbotIds([selectedBot.id]);
      } else {
        setSelectedChatbotIds(chatbots.map(b => b.id));
      }
    }
  }, [chatbots, selectedBot]);

  const [isLoading, setIsLoading] = useState(false);
  const [deletingSource, setDeletingSource] = useState<KnowledgeSource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingLinksSourceId, setEditingLinksSourceId] = useState<string | null>(null);
  const [tempLinksBotIds, setTempLinksBotIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenDrawer = (source: KnowledgeSource) => {
    setSelectedSourceForInspection(source);
    setIsDrawerOpen(true);
  };

  const handleTestChunkInSimulator = (queryText: string) => {
    setSimulatorInitialQuery(queryText);
    // Scroll to top simulator smoothly
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleLoadSampleKnowledge = async () => {
    if (isLoading) return;
    const targetBots = selectedChatbotIds.length > 0 ? selectedChatbotIds : chatbots.map(b => b.id);
    if (targetBots.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please create or select at least one chatbot first.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    setIngestionStep('connecting');
    setIngestingUrl('Sample Knowledge Pack (FAQs & Docs)');

    const t1 = setTimeout(() => setIngestionStep('parsing'), 200);
    const t2 = setTimeout(() => setIngestionStep('sanitizing'), 450);
    const t3 = setTimeout(() => setIngestionStep('chunking'), 700);

    try {
      await onAddSource({
        type: 'faq',
        title: 'FAQ: Business Hours & Support Channels',
        content: 'Question: What are your support hours and how can I reach the team?\nAnswer: Our AI assistant is available 24/7. Human support operators are online Monday through Friday, 8:00 AM to 6:00 PM EST via live chat and email at support@nomadschat.com.',
        chatbotIds: targetBots,
      });
      await onAddSource({
        type: 'text',
        title: 'Product Overview & Widget Installation Guide',
        content: 'NomadsChat is an enterprise AI customer support platform. To embed the live widget on any HTML website, simply paste the single script tag before the closing </body> tag. Features include RAG citations, lead capture, and instant human operator takeover.',
        chatbotIds: targetBots,
      });
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIngestionStep('ready');
      setStatusMessage({ type: 'success', text: 'Loaded 2 sample knowledge documents into your tenant RAG database!' });
      setTimeout(() => {
        setIngestionStep(null);
        setIngestingUrl('');
      }, 2500);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setIngestionStep(null);
      setStatusMessage({ type: 'error', text: 'Failed to load sample knowledge documents.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const toggleTargetBot = (botId: string) => {
    setSelectedChatbotIds(prev =>
      prev.includes(botId) ? prev.filter(id => id !== botId) : [...prev, botId]
    );
  };

  const executeScrapeUrl = async (targetUrl: string) => {
    const url = targetUrl.trim();
    if (!url || isLoading) return;
    setUrlError(null);
    setStatusMessage(null);

    const targetBots = selectedChatbotIds.length > 0 ? selectedChatbotIds : chatbots.map(b => b.id);
    if (targetBots.length === 0) {
      const errText = 'Please select at least one chatbot to link this knowledge source to.';
      setUrlError(errText);
      setStatusMessage({ type: 'error', text: errText });
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const errText = 'Invalid URL format: URL must begin with http:// or https:// (e.g., https://example.com)';
      setUrlError(errText);
      setStatusMessage({ type: 'error', text: errText });
      return;
    }

    const nonHtmlFileRegex = /\.(png|jpe?g|gif|webp|svg|bmp|ico|pdf|zip|tar|gz|7z|mp4|mov|avi|wmv|mp3|wav|ogg|flac|exe|dmg|bin|iso)(\?.*)?$/i;
    if (nonHtmlFileRegex.test(url)) {
      const ext = url.match(nonHtmlFileRegex)?.[1] || 'binary';
      const errText = `Non-HTML resource detected (.${ext}). URL scraping only supports HTML web pages and text documents.`;
      setUrlError(errText);
      setStatusMessage({ type: 'error', text: errText });
      return;
    }

    setIsLoading(true);
    setIngestionStep('connecting');
    setIngestingUrl(url);

    const step1 = setTimeout(() => setIngestionStep('parsing'), 300);
    const step2 = setTimeout(() => setIngestionStep('sanitizing'), 650);
    const step3 = setTimeout(() => setIngestionStep('chunking'), 1000);

    const isLocal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');

    if (isLocal && onIngestHtml) {
      try {
        const localRes = await fetch(url, { mode: 'cors' });
        if (localRes.ok) {
          const html = await localRes.text();
          await onIngestHtml(html, url, `Local Page: ${url}`, targetBots);
          clearTimeout(step1);
          clearTimeout(step2);
          clearTimeout(step3);
          setIngestionStep('ready');
          setInputUrl('');
          setUrlError(null);
          setStatusMessage({ type: 'success', text: `Successfully fetched local page from ${url} and indexed RAG chunks!` });
          setIsLoading(false);
          setTimeout(() => {
            setIngestionStep(null);
            setIngestingUrl('');
          }, 2500);
          return;
        }
      } catch (clientErr) {
        console.log('Client-side direct fetch blocked or unavailable:', clientErr);
      }
    }

    try {
      await onScrapeUrl(url, targetBots);
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      setIngestionStep('ready');
      setInputUrl('');
      setUrlError(null);
      setStatusMessage({ type: 'success', text: 'URL successfully crawled, parsed into Markdown, and indexed into RAG knowledge chunks!' });
      setTimeout(() => {
        setIngestionStep(null);
        setIngestingUrl('');
      }, 2500);
    } catch (err: any) {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      setIngestionStep(null);
      if (isLocal) {
        const localErr = 'Remote cloud servers cannot reach your desktop localhost directly. Use the "Localhost & HTML Source" tab below to paste your local site HTML or text in 1 click!';
        setUrlError(localErr);
        setStatusMessage({
          type: 'error',
          text: localErr,
        });
        setActiveTab('local');
        setLocalUrl(url);
      } else {
        const diagnosticError = err.message || 'URL unreachable: connection failed. Ensure the server is online and accessible.';
        setUrlError(diagnosticError);
        setStatusMessage({ type: 'error', text: diagnosticError });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeScrapeUrl(inputUrl);
  };

  const handleIngestRawHtml = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawHtmlContent.trim() || isLoading || !onIngestHtml) return;
    if (selectedChatbotIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one chatbot to link this knowledge source to.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    setIngestionStep('parsing');
    setIngestingUrl(localUrl || 'Raw HTML Document');

    const step1 = setTimeout(() => setIngestionStep('sanitizing'), 300);
    const step2 = setTimeout(() => setIngestionStep('chunking'), 600);

    try {
      await onIngestHtml(rawHtmlContent.trim(), localUrl.trim() || undefined, htmlDocTitle.trim() || undefined, selectedChatbotIds);
      clearTimeout(step1);
      clearTimeout(step2);
      setIngestionStep('ready');
      setRawHtmlContent('');
      setHtmlDocTitle('');
      setStatusMessage({ type: 'success', text: 'Website HTML successfully converted to structured Markdown chunks and indexed!' });
      setTimeout(() => {
        setIngestionStep(null);
        setIngestingUrl('');
      }, 2500);
    } catch (err: any) {
      clearTimeout(step1);
      clearTimeout(step2);
      setIngestionStep(null);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to ingest HTML content.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim() || isLoading) return;
    if (selectedChatbotIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one chatbot to link this knowledge source to.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    setIngestionStep('chunking');
    setIngestingUrl(`FAQ: ${faqQuestion.trim().slice(0, 35)}...`);

    try {
      await onAddSource({
        type: 'faq',
        title: `FAQ: ${faqQuestion.trim()}`,
        content: `Question: ${faqQuestion.trim()}\nAnswer: ${faqAnswer.trim()}`,
        chatbotIds: selectedChatbotIds,
      });
      setIngestionStep('ready');
      setFaqQuestion('');
      setFaqAnswer('');
      setStatusMessage({ type: 'success', text: 'FAQ Q&A pair successfully indexed into knowledge base.' });
      setTimeout(() => {
        setIngestionStep(null);
        setIngestingUrl('');
      }, 2500);
    } catch (err: any) {
      setIngestionStep(null);
      setStatusMessage({ type: 'error', text: 'Error adding FAQ pair.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim() || isLoading) return;
    if (selectedChatbotIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one chatbot to link this knowledge source to.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    setIngestionStep('parsing');
    setIngestingUrl(docTitle.trim());

    const step1 = setTimeout(() => setIngestionStep('chunking'), 300);

    try {
      await onAddSource({
        type: 'text',
        title: docTitle.trim(),
        content: docContent.trim(),
        chatbotIds: selectedChatbotIds,
      });
      clearTimeout(step1);
      setIngestionStep('ready');
      setDocTitle('');
      setDocContent('');
      setStatusMessage({ type: 'success', text: 'Document successfully indexed and chunked for grounded AI retrieval.' });
      setTimeout(() => {
        setIngestionStep(null);
        setIngestingUrl('');
      }, 2500);
    } catch (err: any) {
      clearTimeout(step1);
      setIngestionStep(null);
      setStatusMessage({ type: 'error', text: 'Error indexing document.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const [tab4IsDragging, setTab4IsDragging] = useState(false);
  const [tab4FileError, setTab4FileError] = useState<string | null>(null);
  const tab4FileInputRef = React.useRef<HTMLInputElement>(null);

  const handleTab4ProcessFile = async (file: File) => {
    setTab4FileError(null);
    try {
      const parsed = await parseKnowledgeFile(file);
      if (!parsed.content || parsed.content.length < 5) {
        setTab4FileError('File contains insufficient readable text.');
        return;
      }
      setDocTitle(parsed.title);
      setDocContent(parsed.content);
      setStatusMessage({
        type: 'success',
        text: `Loaded "${parsed.fileName}" (${parsed.formattedSize}, ~${parsed.estimatedChunks} chunks). Ready to index!`,
      });
    } catch (err: any) {
      setTab4FileError(err?.message || 'Could not parse the selected file.');
    }
  };

  const handleTab4Drop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTab4IsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleTab4ProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleQuickCrawlFromCard = async (url: string) => {
    setInputUrl(url);
    await executeScrapeUrl(url);
  };

  const handleQuickUploadDocumentFromCard = async (title: string, content: string) => {
    const targetBots = selectedChatbotIds.length > 0 ? selectedChatbotIds : chatbots.map(b => b.id);
    if (targetBots.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one chatbot to link this document to.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    setIngestionStep('parsing');
    setIngestingUrl(title);

    const step1 = setTimeout(() => setIngestionStep('chunking'), 300);

    try {
      await onAddSource({
        type: 'text',
        title,
        content,
        chatbotIds: targetBots,
      });
      clearTimeout(step1);
      setIngestionStep('ready');
      setStatusMessage({ type: 'success', text: `Document "${title}" successfully ingested and indexed into RAG vectors!` });
      setTimeout(() => {
        setIngestionStep(null);
        setIngestingUrl('');
      }, 2500);
    } catch (err: any) {
      clearTimeout(step1);
      setIngestionStep(null);
      setStatusMessage({ type: 'error', text: err?.message || 'Error indexing document.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleQuickAddFaqFromCard = async (question: string, answer: string) => {
    const targetBots = selectedChatbotIds.length > 0 ? selectedChatbotIds : chatbots.map(b => b.id);
    if (targetBots.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one chatbot to link this FAQ to.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    setIngestionStep('chunking');
    setIngestingUrl(`FAQ: ${question.slice(0, 30)}...`);

    try {
      await onAddSource({
        type: 'faq',
        title: `FAQ: ${question}`,
        content: `Question: ${question}\nAnswer: ${answer}`,
        chatbotIds: targetBots,
      });
      setIngestionStep('ready');
      setStatusMessage({ type: 'success', text: 'FAQ Q&A pair successfully indexed into knowledge base.' });
      setTimeout(() => {
        setIngestionStep(null);
        setIngestingUrl('');
      }, 2500);
    } catch (err: any) {
      setIngestionStep(null);
      setStatusMessage({ type: 'error', text: err?.message || 'Error adding FAQ pair.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleSelectTabAndScroll = (tab: 'url' | 'local' | 'faq' | 'text') => {
    setActiveTab(tab);
    const formEl = document.getElementById('knowledge-ingestion-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstInput = formEl.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
      if (firstInput) firstInput.focus();
    }
  };

  const totalChunks = knowledgeSources.reduce((acc, s) => acc + (s.chunkCount || 1), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
            <Globe className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                Tenant Knowledge Center
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {knowledgeSources.length} Total Sources • {totalChunks} Chunks
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Knowledge Base & RAG Sources</h1>
            <p className="text-xs text-zinc-400 font-medium">Manage tenant-wide knowledge sources and link them to any combination of your chatbots.</p>
          </div>
        </div>
      </div>

      {/* RAG Vector Simulator & Test Search */}
      <SearchQuerySimulator
        knowledgeSources={knowledgeSources}
        selectedBot={selectedBot}
        onInspectSource={handleOpenDrawer}
        initialQuery={simulatorInitialQuery}
        onClearInitialQuery={() => setSimulatorInitialQuery('')}
      />

      {/* Ingestion Pipeline Stepper (Active during scraping & ingestion) */}
      {ingestionStep && (
        <IngestionProgressBar
          currentStep={ingestionStep}
          targetUrl={ingestingUrl}
          error={urlError}
        />
      )}

      {/* Ingestion & Chatbot Association Form */}
      <div id="knowledge-ingestion-form" className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-zinc-200 pb-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="block text-xs font-extrabold text-zinc-900 font-heading uppercase tracking-wide">
              1. Target Assistants for New Knowledge ({selectedChatbotIds.length} of {chatbots.length} linked)
            </label>
            {chatbots.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChatbotIds(chatbots.map(b => b.id))}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-zinc-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedChatbotIds([])}
                  className="text-[11px] font-bold text-zinc-500 hover:text-zinc-700 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {chatbots.length === 0 ? (
            <div className="p-4 bg-zinc-50 border border-dashed border-zinc-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 font-heading">No AI Chatbots Created Yet</p>
                  <p className="text-[11px] text-zinc-500 font-body">Create an assistant first to ground it with live web knowledge and FAQs.</p>
                </div>
              </div>
              {onCreateBot && (
                <MotionButton
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={onCreateBot}
                >
                  Create Chatbot
                </MotionButton>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {chatbots.map(bot => {
                const isSelected = selectedChatbotIds.includes(bot.id);
                const isActive = selectedBot?.id === bot.id;
                return (
                  <button
                    key={bot.id}
                    type="button"
                    onClick={() => toggleTargetBot(bot.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-xs'
                        : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <span>{bot.avatar || '🤖'}</span>
                    <span>{bot.name}</span>
                    {isActive && (
                      <span className={`text-[9px] font-extrabold uppercase px-1 rounded-sm ${isSelected ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-200 text-zinc-600'}`}>
                        Active
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex border-b border-zinc-200 overflow-x-auto scrollbar-none gap-2">
          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 font-heading ${
              activeTab === 'url' ? 'border-zinc-950 text-zinc-950 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Live Website URL</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('local')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 font-heading ${
              activeTab === 'local' ? 'border-zinc-950 text-zinc-950 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Laptop className="w-4 h-4 text-indigo-600" />
            <span>Localhost & HTML Source</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('faq')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 font-heading ${
              activeTab === 'faq' ? 'border-zinc-950 text-zinc-950 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Q&A FAQ Builder</span>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('text')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 font-heading ${
              activeTab === 'text' ? 'border-zinc-950 text-zinc-950 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Raw Text & Documentation</span>
          </motion.button>
        </div>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-body">{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Live URL Scraper */}
        {activeTab === 'url' && (
          <form onSubmit={handleScrape} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 font-heading">Live Website URL</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Link2 className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${urlError ? 'text-red-500' : 'text-zinc-400'}`} />
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={e => {
                      setInputUrl(e.target.value);
                      if (urlError) setUrlError(null);
                    }}
                    placeholder="https://example.com or https://company.com/services"
                    className={`w-full pl-9 pr-3.5 py-2.5 text-xs border rounded-xl font-medium font-body transition-all ${
                      urlError
                        ? 'border-red-400 bg-red-50/20 text-red-950 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100'
                    }`}
                    required
                  />
                </div>
                <MotionButton
                  type="submit"
                  variant="primary"
                  size="md"
                  shimmer
                  disabled={isLoading || !inputUrl.trim() || selectedChatbotIds.length === 0}
                  leftIcon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  className="shrink-0"
                >
                  {isLoading ? 'Crawling Page...' : 'Scrape & Ingest'}
                </MotionButton>
              </div>

              {/* Inline Diagnostic Error Card */}
              {urlError && (
                <motion.div
                  id="knowledge-url-inline-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 p-3.5 bg-red-50/90 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-900 shadow-xs"
                >
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-red-950 font-heading">
                      {urlError}
                    </p>
                    {urlError.includes('timed out') && (
                      <p className="text-[11px] text-red-800 font-normal">
                        Diagnostic: The target server did not respond within the 5s timeout window. Verify the host is reachable or use the &ldquo;Localhost & HTML Source&rdquo; tab to paste the page markup directly.
                      </p>
                    )}
                    {urlError.includes('Non-HTML') && (
                      <p className="text-[11px] text-red-800 font-normal">
                        Diagnostic: The server returned binary media rather than an HTML webpage. RAG indexing requires text documents or web pages.
                      </p>
                    )}
                    {urlError.includes('DNS lookup failed') && (
                      <p className="text-[11px] text-red-800 font-normal">
                        Diagnostic: Domain name resolution failed. Check the hostname spelling or network connectivity.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </form>
        )}

        {/* Tab 2: Localhost & HTML Source */}
        {activeTab === 'local' && (
          <form onSubmit={handleIngestRawHtml} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5 font-heading">Local Source URL / Identifier</label>
                <input
                  type="text"
                  value={localUrl}
                  onChange={e => setLocalUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-mono text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5 font-heading">Custom Title (Optional)</label>
                <input
                  type="text"
                  value={htmlDocTitle}
                  onChange={e => setHtmlDocTitle(e.target.value)}
                  placeholder="e.g., Localhost Product Catalog"
                  className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium font-body"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 font-heading">Page HTML / Body Source Markup</label>
              <textarea
                value={rawHtmlContent}
                onChange={e => setRawHtmlContent(e.target.value)}
                rows={5}
                placeholder="<html><body>...</body></html>"
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-mono text-zinc-800"
                required
              />
            </div>
            <MotionButton
              type="submit"
              variant="dark"
              size="md"
              shimmer
              disabled={isLoading || !rawHtmlContent.trim() || selectedChatbotIds.length === 0}
              leftIcon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code className="w-4 h-4" />}
            >
              Index Local Website HTML
            </MotionButton>
          </form>
        )}

        {/* Tab 3: FAQ Builder */}
        {activeTab === 'faq' && (
          <form onSubmit={handleAddFaq} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 font-heading">Frequently Asked Question</label>
              <input
                type="text"
                value={faqQuestion}
                onChange={e => setFaqQuestion(e.target.value)}
                placeholder="e.g., What are your support hours?"
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium font-body"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 font-heading">Accurate Answer</label>
              <textarea
                value={faqAnswer}
                onChange={e => setFaqAnswer(e.target.value)}
                rows={3}
                placeholder="We provide 24/7 support via our live concierge and email."
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium font-body"
                required
              />
            </div>
            <MotionButton
              type="submit"
              variant="primary"
              size="md"
              shimmer
              disabled={isLoading || !faqQuestion.trim() || !faqAnswer.trim() || selectedChatbotIds.length === 0}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add FAQ Pair
            </MotionButton>
          </form>
        )}

        {/* Tab 4: Text / Docs */}
        {activeTab === 'text' && (
          <form onSubmit={handleAddDoc} className="space-y-4">
            {/* Drag & Drop File Helper Zone */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 font-heading">
                Upload File or Drag & Drop (Optional)
              </label>
              <input
                ref={tab4FileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.markdown,.json,.csv,.docx,text/plain,application/pdf,text/markdown"
                onChange={async e => {
                  if (e.target.files && e.target.files.length > 0) {
                    await handleTab4ProcessFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setTab4IsDragging(true);
                }}
                onDragLeave={e => {
                  e.preventDefault();
                  setTab4IsDragging(false);
                }}
                onDrop={handleTab4Drop}
                onClick={() => tab4FileInputRef.current?.click()}
                className={`border border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                  tab4IsDragging
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-zinc-200 bg-zinc-50/70 hover:bg-zinc-100/80'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 font-heading">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Drag & drop PDF, TXT, or Markdown file here, or <span className="text-indigo-600 underline">browse</span></span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Automatically extracts text, formats content, and calculates token volume
                </span>
              </div>
              {tab4FileError && (
                <p className="mt-1.5 text-[11px] text-red-600 font-medium">{tab4FileError}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 font-heading">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="e.g., Security & Compliance Overview"
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium font-body"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 font-heading">Raw Text / Markdown Content</label>
              <textarea
                value={docContent}
                onChange={e => setDocContent(e.target.value)}
                rows={5}
                placeholder="Our platform complies with SOC2 Type II, GDPR, and HIPAA standards."
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-mono text-zinc-800"
                required
              />
            </div>
            <MotionButton
              type="submit"
              variant="primary"
              size="md"
              shimmer
              disabled={isLoading || !docTitle.trim() || !docContent.trim() || selectedChatbotIds.length === 0}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Index Document
            </MotionButton>
          </form>
        )}
      </div>

      {/* Indexed Sources List */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 font-heading">
              Tenant Knowledge Sources ({knowledgeSources.length})
            </h3>
            <p className="text-xs text-zinc-500 font-medium font-body">
              All knowledge sources in your tenant and their linked chatbots
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <MotionButton
              type="button"
              variant="outline"
              size="xs"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
              onClick={handleLoadSampleKnowledge}
              disabled={isLoading}
              title="Load pre-made FAQs & documentation to test RAG"
            >
              Load Sample Pack
            </MotionButton>
          </div>
        </div>

        {/* Search Bar */}
        {knowledgeSources.length > 0 && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search knowledge sources by title, url, or content..."
              className="w-full px-3.5 py-2 text-xs bg-zinc-50/70 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-body"
            />
          </div>
        )}

        {/* Active chunk indexing indicator */}
        {isLoading && (
          <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
              </span>
              <span className="text-xs font-bold text-indigo-950 font-heading">
                Extracting, Chunking & Indexing Embeddings...
              </span>
            </div>
            <KnowledgeChunkRowSkeleton className="bg-white/90 rounded-xl" />
          </div>
        )}

        {isFetchingSources ? (
          <KnowledgeChunkRowsSkeleton count={3} />
        ) : knowledgeSources.length === 0 ? (
          <KnowledgeOnboardingCards
            onCrawlUrl={handleQuickCrawlFromCard}
            onUploadDocument={handleQuickUploadDocumentFromCard}
            onAddFaq={handleQuickAddFaqFromCard}
            onLoadSamplePack={handleLoadSampleKnowledge}
            onSelectTab={handleSelectTabAndScroll}
            isLoading={isLoading}
            selectedChatbotCount={selectedChatbotIds.length}
          />
        ) : (() => {
          const filtered = knowledgeSources.filter(s =>
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.sourceUrl && s.sourceUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.content && s.content.toLowerCase().includes(searchQuery.toLowerCase()))
          );

          if (filtered.length === 0) {
            return (
              <KnowledgeEmptyState
                type="no-matches"
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
              />
            );
          }

          return (
            <div className="divide-y divide-zinc-100">
              {filtered.map(source => {
                const linkedBots = chatbots.filter(b => source.chatbotIds?.includes(b.id));
                const isEditingLinks = editingLinksSourceId === source.id;

                return (
                  <div key={source.id} className="py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:bg-zinc-50/70 p-3 rounded-2xl transition">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-800 shrink-0">
                      {source.type === 'url' ? (
                        <Globe className="w-4 h-4" />
                      ) : source.type === 'faq' ? (
                        <HelpCircle className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(source)}
                          className="text-xs font-extrabold text-zinc-900 hover:text-indigo-600 truncate font-heading text-left transition cursor-pointer"
                          title="Click to inspect all generated chunks"
                        >
                          {source.title}
                        </button>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                          source.status === 'indexed' ? 'bg-emerald-100 text-emerald-800' : 
                          source.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {source.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(source)}
                          className="text-[9px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 transition cursor-pointer"
                          title="Click to view all chunks in inspection drawer"
                        >
                          <Layers className="w-3 h-3" />
                          <span>{source.chunkCount || 1} Chunks</span>
                        </button>
                      </div>

                      {source.sourceUrl && (
                        <a
                          href={source.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 truncate font-mono"
                        >
                          <span className="truncate">{source.sourceUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}

                      <p className="text-[11px] text-zinc-500 line-clamp-2 max-w-2xl font-normal leading-relaxed font-body">
                        {source.content}
                      </p>

                      {/* Linked Chatbots Badges & Editor */}
                      <div className="pt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-zinc-600">Linked Chatbots:</span>
                        {isEditingLinks ? (
                          <div className="flex items-center gap-1.5 flex-wrap bg-white border border-zinc-200 p-2 rounded-xl shadow-xs">
                            {chatbots.map(b => {
                              const linked = tempLinksBotIds.includes(b.id);
                              return (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => {
                                    setTempLinksBotIds(prev =>
                                      linked ? prev.filter(id => id !== b.id) : [...prev, b.id]
                                    );
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border ${
                                    linked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                                  }`}
                                >
                                  <span>{b.avatar}</span>
                                  <span>{b.name}</span>
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={async () => {
                                await onUpdateSourceLinks(source.id, tempLinksBotIds);
                                setEditingLinksSourceId(null);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-700 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLinksSourceId(null)}
                              className="px-2 py-1 bg-zinc-200 text-zinc-700 rounded-lg text-[11px] font-bold hover:bg-zinc-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {linkedBots.length === 0 ? (
                              <span className="text-[11px] text-amber-600 font-medium">Unlinked (No bots selected)</span>
                            ) : (
                              linkedBots.map(b => (
                                <span key={b.id} className="inline-flex items-center gap-1 text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded-lg">
                                  <span>{b.avatar || '🤖'}</span>
                                  <span>{b.name}</span>
                                </span>
                              ))
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLinksSourceId(source.id);
                                setTempLinksBotIds(source.chatbotIds || []);
                              }}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline ml-1 cursor-pointer"
                            >
                              Edit Links
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDrawer(source)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 transition flex items-center gap-1.5 cursor-pointer"
                      title="Inspect chunks, character count & token weight"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Inspect Chunks</span>
                    </button>

                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setDeletingSource(source)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="Remove Source"
                      aria-label={`Remove knowledge source ${source.title || source.sourceUrl || 'source'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
      </div>

      {/* Chunk Inspection Slide-Over Drawer */}
      <ChunkInspectionDrawer
        source={selectedSourceForInspection}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedSourceForInspection(null);
        }}
        onTestQuery={handleTestChunkInSimulator}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deletingSource}
        title="Delete Knowledge Source?"
        description="This will permanently remove this knowledge source and delete all chunked vector embeddings. AI chatbots will no longer reference this information in their grounded answers."
        itemName={deletingSource?.title || ''}
        confirmButtonText="Delete Source"
        isLoading={isDeleting}
        onConfirm={async () => {
          if (deletingSource) {
            setIsDeleting(true);
            try {
              await onDeleteSource(deletingSource.id);
              setDeletingSource(null);
            } finally {
              setIsDeleting(false);
            }
          }
        }}
        onClose={() => {
          if (!isDeleting) setDeletingSource(null);
        }}
      />
    </div>
  );
};
