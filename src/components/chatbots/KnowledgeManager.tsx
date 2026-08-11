import React, { useState } from 'react';
import { Chatbot, KnowledgeSource, KnowledgeType } from '../../types';
import { Globe, FileText, HelpCircle, Upload, Plus, Trash2, CheckCircle2, RefreshCw, Sparkles, Loader2, Link2, Search } from 'lucide-react';

interface KnowledgeManagerProps {
  selectedBot: Chatbot;
  knowledgeSources: KnowledgeSource[];
  onAddSource: (source: Partial<KnowledgeSource>) => Promise<void>;
  onScrapeUrl: (url: string) => Promise<void>;
  onDeleteSource: (sourceId: string) => void;
}

export const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({
  selectedBot,
  knowledgeSources,
  onAddSource,
  onScrapeUrl,
  onDeleteSource,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'faq' | 'text'>('url');
  const [inputUrl, setInputUrl] = useState('');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl) return;
    setIsLoading(true);
    setStatusMessage('Crawling website URL and extracting textual content...');

    try {
      await onScrapeUrl(inputUrl);
      setInputUrl('');
      setStatusMessage('URL successfully scraped and indexed into knowledge vector chunks!');
    } catch (err: any) {
      setStatusMessage('Error scraping URL: ' + (err.message || 'Server error'));
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion || !faqAnswer) return;
    setIsLoading(true);

    try {
      await onAddSource({
        chatbotId: selectedBot.id,
        tenantId: selectedBot.tenantId,
        type: 'faq',
        title: `FAQ: ${faqQuestion}`,
        content: `Q: ${faqQuestion}\nA: ${faqAnswer}`,
      });
      setFaqQuestion('');
      setFaqAnswer('');
      setStatusMessage('FAQ pair added to bot knowledge base!');
    } catch (err: any) {
      setStatusMessage('Error adding FAQ');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent) return;
    setIsLoading(true);

    try {
      await onAddSource({
        chatbotId: selectedBot.id,
        tenantId: selectedBot.tenantId,
        type: 'text',
        title: docTitle,
        content: docContent,
      });
      setDocTitle('');
      setDocContent('');
      setStatusMessage('Document content successfully indexed!');
    } catch (err: any) {
      setStatusMessage('Error adding document');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const currentBotSources = knowledgeSources.filter(k => k.chatbotId === selectedBot.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Bot Selector & How To Train Guide Banner */}
      <div className="bg-black text-white border border-zinc-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div
              style={{ backgroundColor: selectedBot.primaryColor || '#000000' }}
              className="w-12 h-12 rounded-2xl text-2xl flex items-center justify-center text-white font-bold border border-white/20 shadow-md shrink-0"
            >
              {selectedBot.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                  AI Training Center
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {currentBotSources.length} Grounded Sources
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedBot.name} Training & RAG Knowledge</h2>
              <p className="text-xs text-zinc-400 font-medium pt-0.5">Scrape URLs, add FAQ pairs, or upload documentation to eliminate AI hallucinations.</p>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl max-w-sm space-y-1.5 shrink-0">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>How to Manage & Train Chatbots:</span>
            </h4>
            <ol className="text-[11px] text-zinc-300 space-y-1 font-medium list-decimal pl-4">
              <li>Enter your public web page URL or documentation link.</li>
              <li>Add custom FAQ Q&As for tricky product edge-cases.</li>
              <li>Test grounded answers live in the <strong>Playground</strong>.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Input Form Tabs */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm">
        <div className="flex border-b border-zinc-200 mb-6">
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'url' ? 'border-black text-black font-extrabold' : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Website URL Scraper</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'faq' ? 'border-black text-black font-extrabold' : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Q&A FAQ Builder</span>
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'text' ? 'border-black text-black font-extrabold' : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Raw Text & Docs</span>
          </button>
        </div>

        {statusMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-zinc-900 text-white text-xs font-bold flex items-center gap-2 border border-zinc-800 shadow-md">
            <Sparkles className="w-4 h-4 text-white shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab 1: URL Scraper */}
        {activeTab === 'url' && (
          <form onSubmit={handleScrape} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">Target Website Page URL</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={e => setInputUrl(e.target.value)}
                    placeholder="https://acmesaas.io/docs/sso-guide or https://yourcompany.com/faq"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>{isLoading ? 'Crawling...' : 'Scrape & Train'}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 font-medium">
                The Express backend will fetch and strip HTML formatting to index page context for Gemini RAG grounding.
              </p>
            </div>
          </form>
        )}

        {/* Tab 2: FAQ Builder */}
        {activeTab === 'faq' && (
          <form onSubmit={handleAddFaq} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">Frequently Asked Question</label>
              <input
                type="text"
                value={faqQuestion}
                onChange={e => setFaqQuestion(e.target.value)}
                placeholder="e.g., What is your refund policy?"
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">Detailed Answer</label>
              <textarea
                value={faqAnswer}
                onChange={e => setFaqAnswer(e.target.value)}
                rows={3}
                placeholder="Provide a clear, accurate response that the AI can synthesize..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add FAQ Pair</span>
            </button>
          </form>
        )}

        {/* Tab 3: Text / Docs */}
        {activeTab === 'text' && (
          <form onSubmit={handleAddDoc} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                placeholder="e.g., Enterprise SLA & Support Guidelines"
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">Raw Document Text / Markdown</label>
              <textarea
                value={docContent}
                onChange={e => setDocContent(e.target.value)}
                rows={5}
                placeholder="Paste guidelines, policy documents, or feature specifications here..."
                className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-mono text-zinc-800"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Index Document</span>
            </button>
          </form>
        )}
      </div>

      {/* Indexed Sources List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Indexed Knowledge Sources</h3>
        <p className="text-xs text-slate-500 mb-4">Active context references passed to Gemini during customer support queries</p>

        {currentBotSources.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No knowledge sources trained yet</p>
            <p className="text-[11px] text-slate-400">Scrape a website URL or add FAQs above to give this AI bot context.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {currentBotSources.map(source => (
              <div key={source.id} className="py-3.5 flex items-start justify-between gap-4 group hover:bg-slate-50/60 p-2 rounded-xl transition">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    {source.type === 'url' ? <Globe className="w-4 h-4" /> : source.type === 'faq' ? <HelpCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{source.title}</h4>
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded uppercase">
                        {source.status}
                      </span>
                    </div>
                    {source.sourceUrl && (
                      <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 hover:underline">
                        {source.sourceUrl}
                      </a>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 max-w-2xl">{source.content}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-medium">
                      <span>{source.chunkCount} Vector Chunks</span>
                      <span>•</span>
                      <span>Updated {new Date(source.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteSource(source.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
