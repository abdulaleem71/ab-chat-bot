import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Chatbot, KnowledgeSource } from '../../types';
import { Globe, FileText, HelpCircle, Plus, Trash2, CheckCircle2, Sparkles, Loader2, Link2, ExternalLink, Laptop, Code, Check } from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface KnowledgeManagerProps {
  chatbots: Chatbot[];
  knowledgeSources: KnowledgeSource[];
  onAddSource: (source: Partial<KnowledgeSource> & { chatbotIds: string[] }) => Promise<void>;
  onScrapeUrl: (url: string, chatbotIds: string[]) => Promise<void>;
  onIngestHtml?: (html: string, url?: string, title?: string, chatbotIds?: string[]) => Promise<void>;
  onUpdateSourceLinks: (sourceId: string, chatbotIds: string[]) => Promise<void>;
  onDeleteSource: (sourceId: string) => Promise<void>;
}

export const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({
  chatbots = [],
  knowledgeSources = [],
  onAddSource,
  onScrapeUrl,
  onIngestHtml,
  onUpdateSourceLinks,
  onDeleteSource,
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

  // Multi-select chatbots for new source (default to all chatbots)
  const [selectedChatbotIds, setSelectedChatbotIds] = useState<string[]>(chatbots.map(b => b.id));
  const [isLoading, setIsLoading] = useState(false);
  const [deletingSource, setDeletingSource] = useState<KnowledgeSource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingLinksSourceId, setEditingLinksSourceId] = useState<string | null>(null);
  const [tempLinksBotIds, setTempLinksBotIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLoadSampleKnowledge = async () => {
    if (isLoading) return;
    const targetBots = selectedChatbotIds.length > 0 ? selectedChatbotIds : chatbots.map(b => b.id);
    if (targetBots.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please create or select at least one chatbot first.' });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
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
      setStatusMessage({ type: 'success', text: 'Loaded 2 sample knowledge documents into your tenant RAG database!' });
    } catch (err: any) {
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

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = inputUrl.trim();
    if (!url || isLoading) return;
    if (selectedChatbotIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one chatbot to link this knowledge source to.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const isLocal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');

    if (isLocal && onIngestHtml) {
      try {
        const localRes = await fetch(url, { mode: 'cors' });
        if (localRes.ok) {
          const html = await localRes.text();
          await onIngestHtml(html, url, `Local Page: ${url}`, selectedChatbotIds);
          setInputUrl('');
          setStatusMessage({ type: 'success', text: `Successfully fetched local page from ${url} and indexed RAG chunks!` });
          setIsLoading(false);
          return;
        }
      } catch (clientErr) {
        console.log('Client-side direct fetch blocked or unavailable:', clientErr);
      }
    }

    try {
      await onScrapeUrl(url, selectedChatbotIds);
      setInputUrl('');
      setStatusMessage({ type: 'success', text: 'URL successfully crawled, parsed into Markdown, and indexed into RAG knowledge chunks!' });
    } catch (err: any) {
      if (isLocal) {
        setStatusMessage({
          type: 'error',
          text: 'Remote cloud servers cannot reach your desktop localhost directly. Use the "Localhost & HTML Source" tab below to paste your local site HTML or text in 1 click!',
        });
        setActiveTab('local');
        setLocalUrl(url);
      } else {
        setStatusMessage({ type: 'error', text: err.message || 'Failed to crawl website URL. Ensure it is accessible.' });
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 6000);
    }
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

    try {
      await onIngestHtml(rawHtmlContent.trim(), localUrl.trim() || undefined, htmlDocTitle.trim() || undefined, selectedChatbotIds);
      setRawHtmlContent('');
      setHtmlDocTitle('');
      setStatusMessage({ type: 'success', text: 'Website HTML successfully converted to structured Markdown chunks and indexed!' });
    } catch (err: any) {
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

    try {
      await onAddSource({
        type: 'faq',
        title: `FAQ: ${faqQuestion.trim()}`,
        content: `Question: ${faqQuestion.trim()}\nAnswer: ${faqAnswer.trim()}`,
        chatbotIds: selectedChatbotIds,
      });
      setFaqQuestion('');
      setFaqAnswer('');
      setStatusMessage({ type: 'success', text: 'FAQ Q&A pair successfully indexed into knowledge base.' });
    } catch (err: any) {
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

    try {
      await onAddSource({
        type: 'text',
        title: docTitle.trim(),
        content: docContent.trim(),
        chatbotIds: selectedChatbotIds,
      });
      setDocTitle('');
      setDocContent('');
      setStatusMessage({ type: 'success', text: 'Document successfully indexed and chunked for grounded AI retrieval.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Error indexing document.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
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

      {/* Ingestion & Chatbot Association Form */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="border-b border-zinc-200 pb-4">
          <label className="block text-xs font-extrabold text-zinc-900 mb-2 font-heading uppercase tracking-wide">
            1. Select Target Chatbots for New Knowledge Source ({selectedChatbotIds.length} of {chatbots.length} selected)
          </label>
          <div className="flex flex-wrap gap-2">
            {chatbots.map(bot => {
              const isSelected = selectedChatbotIds.includes(bot.id);
              return (
                <button
                  key={bot.id}
                  type="button"
                  onClick={() => toggleTargetBot(bot.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <span>{bot.avatar || '🤖'}</span>
                  <span>{bot.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              );
            })}
          </div>
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
                  <Link2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                    placeholder="https://example.com or https://company.com/services"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium font-body"
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

        {knowledgeSources.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-2xl space-y-3">
            <Globe className="w-8 h-8 text-zinc-300 mx-auto" />
            <div>
              <p className="text-xs font-bold text-zinc-700 font-heading">No knowledge sources trained yet</p>
              <p className="text-[11px] text-zinc-400 font-body max-w-md mx-auto mt-0.5">
                Scrape a website URL, paste HTML source, or click below to load pre-made sample FAQs into your RAG engine.
              </p>
            </div>
            <MotionButton
              type="button"
              variant="primary"
              size="sm"
              shimmer
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={handleLoadSampleKnowledge}
              disabled={isLoading}
            >
              Load Sample Knowledge Pack
            </MotionButton>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {knowledgeSources
              .filter(s =>
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.sourceUrl && s.sourceUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (s.content && s.content.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map(source => {
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
                        <h4 className="text-xs font-extrabold text-zinc-900 truncate font-heading">{source.title}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase font-mono \${
                          source.status === 'indexed' ? 'bg-emerald-100 text-emerald-800' : 
                          source.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {source.status}
                        </span>
                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-mono">
                          {source.chunkCount || 1} Chunks
                        </span>
                      </div>

                      {source.sourceUrl && (
                        <a
                          href={source.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
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

                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeletingSource(source)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
                    title="Remove Source"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
