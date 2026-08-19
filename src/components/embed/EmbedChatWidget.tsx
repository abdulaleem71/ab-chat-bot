import React, { useState, useRef, useEffect } from 'react';
import { Chatbot, Message, GroundingSource } from '../../types';
import { Send, Bot, Loader2, Sparkles, X, Minimize2, RotateCcw, ChevronDown, ChevronUp, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { MarkdownContent } from '../../lib/markdown';

interface EmbedChatWidgetProps {
  bot: Chatbot;
  isFloating?: boolean;
  onClose?: () => void;
}

export const EmbedChatWidget: React.FC<EmbedChatWidgetProps> = ({ bot, isFloating = false, onClose }) => {
  const storageKey = `nomadschat_conv_${bot.id}`;
  const [conversationId, setConversationId] = useState<string>(() => {
    return sessionStorage.getItem(storageKey) || '';
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init_' + bot.id,
      conversationId: conversationId || 'init',
      chatbotId: bot.id,
      sender: 'bot',
      content: bot.greetingMessage || '👋 Hi there! How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  // Lead capture state
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);
  const [showLeadPrompt, setShowLeadPrompt] = useState(Boolean(bot.collectLeadEmail));
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Host detection state
  const [detectedHost, setDetectedHost] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qHost = params.get('host');
      if (qHost) {
        try {
          return new URL(qHost).hostname;
        } catch {
          return qHost.replace(/^https?:\/\//, '');
        }
      }
      if (document.referrer) {
        try {
          return new URL(document.referrer).hostname;
        } catch {}
      }
    }
    return '';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qHost = params.get('host') || (document.referrer ? new URL(document.referrer).origin : '');
      if (qHost && (qHost.startsWith('http://') || qHost.startsWith('https://'))) {
        try {
          fetch(`/api/chatbots/${bot.id}/auto-detect-host`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hostOrigin: qHost,
              hostUrl: document.referrer || qHost,
              hostTitle: document.title,
            }),
          }).catch(() => {});
        } catch {}
      }
    }
  }, [bot.id]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      }
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, isLoading, showLeadPrompt]);

  // Handle Close / Minimize
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    // Also broadcast to parent window if embedded in iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'nomadschat_close' }, '*');
    }
  };

  // Reset conversation
  const handleResetChat = () => {
    sessionStorage.removeItem(storageKey);
    setConversationId('');
    setMessages([
      {
        id: 'init_' + Date.now(),
        conversationId: '',
        chatbotId: bot.id,
        sender: 'bot',
        content: bot.greetingMessage || '👋 Hi there! How can I help you today?',
        timestamp: new Date().toISOString(),
      },
    ]);
    setErrorMessage(null);
    setShowLeadPrompt(Boolean(bot.collectLeadEmail));
  };

  // Helper to extract visitor telemetry
  const getVisitorMetadata = () => {
    let location = 'Direct Web Session';
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const lang = navigator.language || 'en';
      location = `${tz} (${lang})`;
    } catch {
      // fallback
    }

    let browser = 'Web Browser';
    try {
      const ua = navigator.userAgent;
      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Edge')) browser = 'Edge';

      if (ua.includes('Mac')) browser += ' on macOS';
      else if (ua.includes('Windows')) browser += ' on Windows';
      else if (ua.includes('iPhone') || ua.includes('iPad')) browser += ' on iOS';
      else if (ua.includes('Android')) browser += ' on Android';
      else if (ua.includes('Linux')) browser += ' on Linux';
    } catch {
      // fallback
    }

    let pageUrl = window.location.href;
    try {
      if (document.referrer && document.referrer.trim()) {
        pageUrl = document.referrer;
      } else if (window.parent && window.parent !== window) {
        pageUrl = window.location.href;
      }
    } catch {
      // fallback
    }

    return { location, browser, pageUrl };
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim() || isSubmittingLead) return;
    setIsSubmittingLead(true);

    const meta = getVisitorMetadata();
    try {
      await fetch(`/api/chatbots/${bot.id}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId || undefined,
          name: leadName.trim() || 'Website Visitor',
          email: leadEmail.trim(),
          firstQuestion: messages.length > 1 ? messages[1].content : undefined,
          pageUrl: meta.pageUrl,
          browser: meta.browser,
          location: meta.location,
        }),
      });
      setHasSubmittedLead(true);
      setShowLeadPrompt(false);
    } catch (err) {
      console.log('Error submitting lead:', err);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      conversationId: conversationId || 'pending',
      chatbotId: bot.id,
      sender: 'visitor',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const meta = getVisitorMetadata();
    try {
      const res = await fetch(`/api/chatbots/${bot.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId || undefined,
          conversationHistory: [...messages, userMsg],
          visitorInfo: {
            email: leadEmail ? leadEmail.trim() : undefined,
            name: leadName ? leadName.trim() : undefined,
            location: meta.location,
            browser: meta.browser,
            pageUrl: meta.pageUrl,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.conversationId) {
        setConversationId(data.conversationId);
        sessionStorage.setItem(storageKey, data.conversationId);
      }

      const botMsg: Message = {
        id: 'bot_' + Date.now(),
        conversationId: data.conversationId || conversationId || 'conv',
        chatbotId: bot.id,
        sender: 'bot',
        content: data.reply || bot.fallbackMessage || "I'm not sure how to answer that yet.",
        sourcesUsed: data.sourcesUsed || [],
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.log('Chat error:', err);
      setErrorMessage('Could not connect to the assistant. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSource = (msgId: string) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const primaryColor = bot.primaryColor || '#09090b';

  return (
    <div
      id="nomadschat-widget-container"
      className="flex flex-col h-full w-full bg-white text-zinc-900 overflow-hidden font-sans border border-zinc-200/80 shadow-2xl rounded-2xl md:rounded-3xl"
    >
      {/* Header */}
      <div
        style={{ backgroundColor: primaryColor }}
        className="px-4 py-3.5 text-white flex items-center justify-between shadow-xs shrink-0 select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-lg border border-white/20 shadow-inner">
              {bot.avatar || '🤖'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs sm:text-sm text-white truncate leading-tight">{bot.name}</h3>
            </div>
            <p className="text-[10px] text-white/80 font-medium truncate flex items-center gap-1">
              <span>{bot.humanOperatorOnline ? 'AI Assistant • Live Online' : 'AI Assistant'}</span>
              {detectedHost && (
                <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[9px] font-normal text-white/90">
                  • {detectedHost}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleResetChat}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Reset Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Close Assistant"
          >
            {isFloating ? <X className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Message Feed */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/60 scrollbar-thin"
      >
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'visitor';
          const isAgent = msg.sender === 'agent';

          return (
            <div
              key={msg.id || idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%] ${isUser ? 'ml-auto' : 'mr-auto'}`}
            >
              {!isUser && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {isAgent ? 'Support Specialist' : bot.name}
                  </span>
                  {isAgent && (
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-sm">
                      Human
                    </span>
                  )}
                </div>
              )}

              <div
                style={isUser ? { backgroundColor: primaryColor } : {}}
                className={`px-3.5 py-2.5 rounded-2xl shadow-xs text-xs sm:text-sm ${
                  isUser
                    ? 'text-white rounded-br-xs'
                    : isAgent
                    ? 'bg-amber-50/90 text-amber-950 border border-amber-200 rounded-bl-xs'
                    : 'bg-white text-zinc-900 border border-zinc-200/90 rounded-bl-xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <MarkdownContent content={msg.content} />
                )}

                {/* Grounding Source Citations */}
                {!isUser && msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-100">
                    <button
                      onClick={() => toggleSource(msg.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 cursor-pointer transition"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>{msg.sourcesUsed.length} Grounded Source{msg.sourcesUsed.length > 1 ? 's' : ''}</span>
                      {expandedSources[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {expandedSources[msg.id] && (
                      <div className="mt-2 space-y-1.5">
                        {msg.sourcesUsed.map((src, sIdx) => (
                          <div key={sIdx} className="bg-zinc-50 p-2 rounded-lg border border-zinc-200 text-[11px] space-y-0.5">
                            <div className="font-semibold text-zinc-800 flex items-center justify-between gap-1">
                              <span className="truncate">{src.title || 'Knowledge Base Document'}</span>
                            </div>
                            {src.snippet && (
                              <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                                {src.snippet}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span className="text-[9px] text-zinc-400 px-1 mt-0.5">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {/* Suggested Questions Pills (shown under initial greeting) */}
        {messages.length === 1 && bot.suggestedQuestions && bot.suggestedQuestions.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              Suggested Queries
            </span>
            <div className="flex flex-col gap-1.5">
              {bot.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="text-left text-xs bg-white hover:bg-zinc-100/90 text-zinc-700 hover:text-black p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs transition active:scale-98 flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate font-medium">{q}</span>
                  <Send className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Non-intrusive Inline Lead Gate */}
        {showLeadPrompt && !hasSubmittedLead && (
          <div className="bg-white border border-indigo-100 rounded-2xl p-3 shadow-sm my-2 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <h4 className="text-xs font-bold text-zinc-900">{bot.leadTitle || 'Stay connected with support'}</h4>
              </div>
              <button
                onClick={() => setShowLeadPrompt(false)}
                className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <form onSubmit={handleLeadSubmit} className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  placeholder="Your Name (optional)"
                  value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
                <input
                  type="email"
                  required
                  placeholder="Your Email"
                  value={leadEmail}
                  onChange={e => setLeadEmail(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingLead || !leadEmail}
                style={{ backgroundColor: primaryColor }}
                className="w-full text-white text-[11px] font-bold py-1.5 rounded-lg shadow-xs transition hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
              >
                {isSubmittingLead ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                <span>Save Contact Details</span>
              </button>
            </form>
          </div>
        )}

        {/* Typing Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 max-w-[80%]">
            <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-xs px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-xl border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-zinc-200 shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white transition text-zinc-900 placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            style={{ backgroundColor: primaryColor }}
            className="text-white p-2 sm:p-2.5 rounded-xl transition hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0 flex items-center justify-center"
            title="Send Message"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 px-1">
          <span>Powered by NomadsChat RAG</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Active
          </span>
        </div>
      </div>
    </div>
  );
};
