import React, { useState } from 'react';
import { Chatbot, KnowledgeSource, KnowledgeType } from '../../types';
import { Globe, FileText, HelpCircle, Plus, Trash2, CheckCircle2, Sparkles, Loader2, Link2, ExternalLink, Laptop, Code } from 'lucide-react';

interface KnowledgeManagerProps {
  selectedBot: Chatbot;
  allBots?: Chatbot[];
  onSelectBot?: (bot: Chatbot) => void;
  knowledgeSources: KnowledgeSource[];
  onAddSource: (source: Partial<KnowledgeSource>) => Promise<void>;
  onScrapeUrl: (url: string) => Promise<void>;
  onIngestHtml?: (html: string, url?: string, title?: string) => Promise<void>;
  onDeleteSource: (sourceId: string) => void;
}

export const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({
  selectedBot,
  allBots = [],
  onSelectBot,
  knowledgeSources,
  onAddSource,
  onScrapeUrl,
  onIngestHtml,
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
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = inputUrl.trim();
    if (!url || isLoading) return;
    setIsLoading(true);
    setStatusMessage(null);

    const isLocal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0');

    if (isLocal && onIngestHtml) {
      // Attempt browser-assisted direct fetch from the user's active session
      try {
        const localRes = await fetch(url, { mode: 'cors' });
        if (localRes.ok) {
          const html = await localRes.text();
          await onIngestHtml(html, url, `Local Page: ${url}`);
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
      await onScrapeUrl(url);
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
    setIsLoading(true);
    setStatusMessage(null);

    try {
      await onIngestHtml(rawHtmlContent.trim(), localUrl.trim() || undefined, htmlDocTitle.trim() || undefined);
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
    setIsLoading(true);
    setStatusMessage(null);

    try {
      await onAddSource({
        chatbotId: selectedBot.id,
        tenantId: selectedBot.tenantId,
        type: 'faq',
        title: `FAQ: ${faqQuestion.trim()}`,
        content: `Question: ${faqQuestion.trim()}\nAnswer: ${faqAnswer.trim()}`,
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
    setIsLoading(true);
    setStatusMessage(null);

    try {
      await onAddSource({
        chatbotId: selectedBot.id,
        tenantId: selectedBot.tenantId,
        type: 'text',
        title: docTitle.trim(),
        content: docContent.trim(),
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

  const currentBotSources = knowledgeSources.filter(k => k.chatbotId === selectedBot.id);
  const totalChunks = currentBotSources.reduce((acc, s) => acc + (s.chunkCount || 1), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            style={{ backgroundColor: selectedBot.primaryColor || '#09090b' }}
            className="w-14 h-14 rounded-2xl text-3xl flex items-center justify-center text-white font-bold border border-white/20 shadow-md shrink-0"
          >
            {selectedBot.avatar || '🤖'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                RAG Grounding Engine
              </span>
              <span className="text-[11px] font-mono text-zinc-400">
                {currentBotSources.length} Sources • {totalChunks} Chunks
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{selectedBot.name} Knowledge Base</h1>
            <p className="text-xs text-zinc-400 font-medium">Connect live websites, local dev sites, and documentation to ground your chatbot in real data.</p>
          </div>
        </div>

        {allBots.length > 1 && onSelectBot && (
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-2xl shrink-0">
            <span className="text-[11px] text-zinc-400 font-semibold px-2">Target Bot:</span>
            <select
              value={selectedBot.id}
              onChange={e => {
                const b = allBots.find(x => x.id === e.target.value);
                if (b) onSelectBot(b);
              }}
              className="bg-zinc-950 text-white text-xs font-bold border border-zinc-700 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              {allBots.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Input Ingestion Form */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex border-b border-zinc-200 overflow-x-auto scrollbar-none gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'url' ? 'border-zinc-950 text-zinc-950 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Live Website URL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'local' ? 'border-zinc-950 text-zinc-950 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Laptop className="w-4 h-4 text-indigo-600" />
            <span>Localhost & HTML Source</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'faq' ? 'border-zinc-950 text-zinc-950 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Q&A FAQ Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'text' ? 'border-zinc-950 text-zinc-950 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Raw Text & Documentation</span>
          </button>
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
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Live URL Scraper */}
        {activeTab === 'url' && (
          <form onSubmit={handleScrape} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">Live Website URL</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                    placeholder="https://example.com or https://company.com/services"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !inputUrl.trim()}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>{isLoading ? 'Crawling Page...' : 'Scrape & Ingest'}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-2 font-medium">
                Fetches live HTML, converts content into structured Markdown with headings and lists, and generates overlapping RAG chunks for accurate answering.
              </p>
            </div>
          </form>
        )}

        {/* Tab 2: Localhost & HTML Source */}
        {activeTab === 'local' && (
          <form onSubmit={handleIngestRawHtml} className="space-y-4">
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-indigo-950 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-2 text-indigo-900">
                <Laptop className="w-4 h-4 text-indigo-600" />
                <span>Local Website (localhost:3000 / localhost:5173) & HTML Ingestion</span>
              </div>
              <p className="text-indigo-800/90 text-[11px] leading-relaxed">
                Because cloud sandboxes cannot directly connect to your personal computer's loopback network, you can paste the HTML source code from your local development browser (<strong>Right Click &rarr; View Page Source / Inspect</strong>) or enter page content below to index your local project instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">Local Source URL / Identifier</label>
                <input
                  type="text"
                  value={localUrl}
                  onChange={e => setLocalUrl(e.target.value)}
                  placeholder="http://localhost:3000 or http://localhost:5173"
                  className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-mono text-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5">Custom Title (Optional)</label>
                <input
                  type="text"
                  value={htmlDocTitle}
                  onChange={e => setHtmlDocTitle(e.target.value)}
                  placeholder="e.g., Localhost Product Catalog & Services"
                  className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">Page HTML / Body Source Markup</label>
              <textarea
                value={rawHtmlContent}
                onChange={e => setRawHtmlContent(e.target.value)}
                rows={6}
                placeholder="<html><body><h1>Services</h1><p>We provide custom Shopify development, Shopify Plus development, Liquid development, and conversion optimization.</p></body></html>"
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-mono text-zinc-800"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !rawHtmlContent.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code className="w-4 h-4" />}
              <span>Index Local Website HTML</span>
            </button>
          </form>
        )}

        {/* Tab 3: FAQ Builder */}
        {activeTab === 'faq' && (
          <form onSubmit={handleAddFaq} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">Frequently Asked Question</label>
              <input
                type="text"
                value={faqQuestion}
                onChange={e => setFaqQuestion(e.target.value)}
                placeholder="e.g., Do you offer Shopify development?"
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">Accurate Answer</label>
              <textarea
                value={faqAnswer}
                onChange={e => setFaqAnswer(e.target.value)}
                rows={3}
                placeholder="We provide custom Shopify development, Shopify Plus development, Liquid development, and conversion optimization."
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !faqQuestion.trim() || !faqAnswer.trim()}
              className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add FAQ Pair</span>
            </button>
          </form>
        )}

        {/* Tab 4: Text / Docs */}
        {activeTab === 'text' && (
          <form onSubmit={handleAddDoc} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="e.g., Services & Capabilities Overview"
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">Raw Text / Markdown Content</label>
              <textarea
                value={docContent}
                onChange={e => setDocContent(e.target.value)}
                rows={5}
                placeholder="We provide custom Shopify development, Shopify Plus development, Liquid development, and conversion optimization."
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 font-mono text-zinc-800"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !docTitle.trim() || !docContent.trim()}
              className="bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Index Document</span>
            </button>
          </form>
        )}
      </div>

      {/* Indexed Sources List */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900">Indexed Knowledge Context ({currentBotSources.length})</h3>
            <p className="text-xs text-zinc-500 font-medium">Grounding context used to synthesize answers and generate citation references</p>
          </div>
        </div>

        {currentBotSources.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-2xl space-y-2">
            <Globe className="w-8 h-8 text-zinc-300 mx-auto" />
            <p className="text-xs font-bold text-zinc-700">No knowledge sources trained yet</p>
            <p className="text-[11px] text-zinc-400">Scrape a website URL, paste HTML source, or add FAQ pairs above to teach this AI bot your product details.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {currentBotSources.map(source => (
              <div key={source.id} className="py-4 flex items-start justify-between gap-4 group hover:bg-zinc-50/70 p-3 rounded-2xl transition">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-800 shrink-0">
                    {source.type === 'url' ? (
                      <Globe className="w-4 h-4" />
                    ) : source.type === 'faq' ? (
                      <HelpCircle className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-zinc-900 truncate">{source.title}</h4>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                        {source.status}
                      </span>
                    </div>

                    {source.sourceUrl && (
                      <a
                        href={source.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{source.sourceUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}

                    <p className="text-[11px] text-zinc-500 line-clamp-2 max-w-2xl font-normal leading-relaxed">
                      {source.content}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
                      <span className="font-semibold text-zinc-600">{source.chunkCount || 1} RAG Chunks</span>
                      <span>•</span>
                      <span>Updated {new Date(source.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteSource(source.id)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer shrink-0"
                  title="Remove Source"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
