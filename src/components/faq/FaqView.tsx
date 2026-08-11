import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Sparkles, HelpCircle, MessageSquare, ShieldCheck, Zap, Code, Bot } from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface FaqViewProps {
  onOpenTestChat?: () => void;
}

export const FaqView: React.FC<FaqViewProps> = ({ onOpenTestChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq_1');

  const faqs: FaqItem[] = [
    {
      id: 'faq_1',
      category: 'General',
      question: 'What is NomadsChat AI SaaS and how does it work?',
      answer:
        'NomadsChat is an AI customer support platform built on NomadsArc engine. It allows you to crawl your website or upload company documents to create a grounded AI support bot that answers visitor questions 24/7 with direct source citations.',
    },
    {
      id: 'faq_2',
      category: 'General',
      question: 'How fast can I get a chatbot running on my website?',
      answer:
        'You can deploy a chatbot in under 2 minutes! Simply enter your website URL in the Knowledge Manager, copy your unique 1-line `<script>` embed tag, and paste it before the `</body>` tag of your website HTML.',
    },
    {
      id: 'faq_3',
      category: 'AI Models & Training',
      question: 'Which AI models are used for chatbot responses?',
      answer:
        'NomadsChat uses high-performance Gemini LLMs powered by NomadsArc RAG for instant, low-latency grounded answers. All queries go through server-side RAG retrieval so your API keys remain 100% hidden and secure.',
    },
    {
      id: 'faq_4',
      category: 'AI Models & Training',
      question: 'Does the AI invent or hallucinate information?',
      answer:
        'NomadsChat uses strict grounding constraints. If a visitor asks a question that is not covered in your uploaded knowledge sources, the chatbot responds with a customizable fallback message or offers to connect the visitor to a live human support agent.',
    },
    {
      id: 'faq_5',
      category: 'Embed & Integration',
      question: 'Can I embed the chat widget on Shopify, WordPress, or React?',
      answer:
        'Yes! The widget works seamlessly across all CMS and web frameworks including Shopify, WordPress, React, Next.js, Webflow, Squarespace, and vanilla HTML pages.',
    },
    {
      id: 'faq_6',
      category: 'Embed & Integration',
      question: 'Can I customize the color, logo, and greeting message of the chat widget?',
      answer:
        'Absolutely! In the Bot Editor, you can customize the primary brand color, avatar emoji/icon, greeting message, suggested quick-reply chips, and lead collection fields.',
    },
    {
      id: 'faq_7',
      category: 'Live Support & Inbox',
      question: 'How does the human operator takeover feature work?',
      answer:
        'When a visitor requests human assistance or if a query requires human intervention, the conversation appears in your NomadsChat Live Inbox. Agents can click "Take over conversation" to chat with the visitor in real-time over WebSockets.',
    },
    {
      id: 'faq_8',
      category: 'Security & Pricing',
      question: 'Is my company data kept private and secure?',
      answer:
        'Yes. Your training documents and web scrapes are stored in an isolated, encrypted tenant index. Your data is strictly used for your company chatbot and is never shared or used to train public LLM baseline weights.',
    },
    {
      id: 'faq_9',
      category: 'Security & Pricing',
      question: 'Can I switch plans or cancel at any time?',
      answer:
        'Yes, you can upgrade, downgrade, or switch between Free, Pro, and Enterprise tiers at any time directly from the Organization switcher in your top header navbar.',
    },
  ];

  const categories = ['all', 'General', 'AI Models & Training', 'Embed & Integration', 'Live Support & Inbox', 'Security & Pricing'];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-black text-white border border-black px-3.5 py-1 rounded-full text-xs font-bold shadow-sm">
          <HelpCircle className="w-3.5 h-3.5 text-white" />
          <span>Knowledge & Support Hub</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight leading-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-zinc-600 text-sm font-medium max-w-xl mx-auto">
          Find quick answers about chatbot setup, Gemini model grounding, embedding widgets, live agent handoff, and privacy.
        </p>

        {/* Search Bar */}
        <div className="pt-4 max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder="Search questions or keywords (e.g., embed, Gemini, RAG)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden shadow-xs transition-all duration-150"
          />
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap justify-center gap-2 pt-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer active:scale-95 ${
                activeCategory === cat
                  ? 'bg-black text-white shadow-md'
                  : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {cat === 'all' ? 'All Questions' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 text-center text-zinc-500">
            <HelpCircle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-black">No questions matching "{searchQuery}"</p>
            <p className="text-[11px] text-zinc-400 mt-1">Try searching for broader terms or select another category.</p>
          </div>
        ) : (
          filteredFaqs.map(faq => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white border border-zinc-200 rounded-2xl overflow-hidden transition duration-200 hover:border-black/30 shadow-xs"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-black text-xs sm:text-sm cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-black shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs text-zinc-700 leading-relaxed border-t border-zinc-100 bg-zinc-50/50 animate-in fade-in duration-200">
                    <p className="pl-4 border-l-2 border-black font-medium">{faq.answer}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>Category: <strong className="text-black">{faq.category}</strong></span>
                      <span className="text-zinc-800 font-extrabold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-black" /> Grounded & Verified
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still Have Questions Box */}
      <div className="bg-black text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/40 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shrink-0 shadow-lg font-bold">
            <MessageSquare className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Still have a question?</h3>
            <p className="text-xs text-zinc-300 font-medium mt-0.5">
              Test our live AI support widget or start a conversation with our AI bot in real-time.
            </p>
          </div>
        </div>

        {onOpenTestChat && (
          <button
            onClick={onOpenTestChat}
            className="bg-white hover:bg-zinc-100 text-black text-xs font-extrabold px-6 py-3.5 rounded-2xl shadow-lg transition flex items-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer relative z-10"
          >
            <Bot className="w-4 h-4 text-black" />
            <span>Ask AI Support Bot</span>
          </button>
        )}
      </div>
    </div>
  );
};
