import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chatbot, Message, GroundingSource } from '../../types';
import { Send, Bot, Loader2, Sparkles, X, Minimize2, RotateCcw, ChevronDown, ChevronUp, ExternalLink, Check, AlertCircle, Image as ImageIcon, Paperclip, Wrench, ShieldAlert, Square } from 'lucide-react';
import { MarkdownContent } from '../../lib/markdown';
import { TypingIndicator } from '../common/TypingIndicator';
import { GroundingSourceAccordion } from '../common/GroundingSourceAccordion';
import { MessageActionButtons } from '../common/MessageActionButtons';
import { streamChatResponse } from '../../lib/chatStream';
import { getAccessibleTextColor } from '../../lib/colorUtils';

interface EmbedChatWidgetProps {
  bot: Chatbot;
  isFloating?: boolean;
  onClose?: () => void;
}

export const EmbedChatWidget: React.FC<EmbedChatWidgetProps> = ({ bot, isFloating = false, onClose }) => {
  const storageKey = `nomadschat_conv_${bot.id}`;
  const visitorIdKey = `nomadschat_visitor_id_${bot.id}`;
  const [conversationId, setConversationId] = useState<string>(() => {
    return sessionStorage.getItem(storageKey) || '';
  });
  const [visitorId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      let vid = localStorage.getItem(visitorIdKey);
      if (!vid) {
        vid = 'vis_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem(visitorIdKey, vid);
      }
      return vid;
    }
    return 'vis_' + Date.now();
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
  const [isTypingWaitingToken, setIsTypingWaitingToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeStreamingMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsTypingWaitingToken(false);
    activeStreamingMsgIdRef.current = null;
  };

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
          visitorId,
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage('Image file must be under 4MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if ((!text && !attachedImageBase64) || isLoading) return;

    setErrorMessage(null);
    const imgToSend = attachedImageBase64;
    setAttachedImageBase64(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      conversationId: conversationId || 'pending',
      chatbotId: bot.id,
      sender: 'visitor',
      content: text || (imgToSend ? 'Attached a screenshot / image.' : ''),
      screenshotUrl: imgToSend || undefined,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsTypingWaitingToken(true);
    activeStreamingMsgIdRef.current = null;

    const meta = getVisitorMetadata();

    try {
      await streamChatResponse(
        bot.id,
        {
          message: text || 'Please review the attached screenshot.',
          conversationId: conversationId || undefined,
          visitorInfo: {
            visitorId,
            email: leadEmail ? leadEmail.trim() : undefined,
            name: leadName ? leadName.trim() : undefined,
            location: meta.location,
            browser: meta.browser,
            pageUrl: meta.pageUrl,
            screenshotBase64: imgToSend || undefined,
          },
        },
        {
          signal: abortController.signal,
          onMetadata: metadata => {
            if (metadata.conversationId) {
              setConversationId(metadata.conversationId);
              sessionStorage.setItem(storageKey, metadata.conversationId);
            }
          },
          onDelta: chunk => {
            setIsTypingWaitingToken(false);
            setMessages(prev => {
              const streamId = activeStreamingMsgIdRef.current;
              if (streamId && prev.some(m => m.id === streamId)) {
                return prev.map(m =>
                  m.id === streamId ? { ...m, content: m.content + chunk } : m
                );
              } else {
                const newStreamId = 'bot_stream_' + Date.now();
                activeStreamingMsgIdRef.current = newStreamId;
                return [
                  ...prev,
                  {
                    id: newStreamId,
                    conversationId: conversationId || 'conv',
                    chatbotId: bot.id,
                    sender: 'bot',
                    content: chunk,
                    timestamp: new Date().toISOString(),
                  },
                ];
              }
            });
          },
          onDone: result => {
            if (result.conversationId) {
              setConversationId(result.conversationId);
              sessionStorage.setItem(storageKey, result.conversationId);
            }
            const streamId = activeStreamingMsgIdRef.current;
            setMessages(prev => {
              if (streamId && prev.some(m => m.id === streamId)) {
                return prev.map(m =>
                  m.id === streamId
                    ? {
                        ...m,
                        content: result.reply || m.content,
                        sourcesUsed: result.sourcesUsed,
                        toolsInvoked: result.toolsInvoked,
                      }
                    : m
                );
              } else if (result.reply) {
                return [
                  ...prev,
                  {
                    id: 'bot_' + Date.now(),
                    conversationId: result.conversationId || conversationId || 'conv',
                    chatbotId: bot.id,
                    sender: 'bot',
                    content: result.reply,
                    sourcesUsed: result.sourcesUsed,
                    toolsInvoked: result.toolsInvoked,
                    timestamp: new Date().toISOString(),
                  },
                ];
              }
              return prev;
            });
            setIsLoading(false);
            setIsTypingWaitingToken(false);
            activeStreamingMsgIdRef.current = null;
          },
          onError: err => {
            console.error('Widget streaming error:', err);
            setErrorMessage(err.message || 'Could not connect to the assistant. Please try again.');
            setIsLoading(false);
            setIsTypingWaitingToken(false);
            activeStreamingMsgIdRef.current = null;
          },
        }
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        setErrorMessage(err.message || 'Could not connect to the assistant. Please try again.');
      }
      setIsLoading(false);
      setIsTypingWaitingToken(false);
      activeStreamingMsgIdRef.current = null;
    }
  };

  const toggleSource = (msgId: string) => {
    setExpandedSources(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const primaryColor = bot.primaryColor || '#09090b';
  const primaryTextColor = bot.textColor || getAccessibleTextColor(primaryColor);

  return (
    <div
      id="nomadschat-widget-container"
      className={`flex flex-col h-full w-full bg-white text-zinc-900 overflow-hidden font-sans ${
        isFloating
          ? 'fixed inset-0 w-full h-[100dvh] max-h-[100dvh] rounded-none border-0 shadow-none z-50 sm:static sm:inset-auto sm:w-[380px] sm:h-[580px] sm:max-h-[580px] sm:rounded-3xl sm:border sm:border-zinc-200/80 sm:shadow-2xl'
          : 'rounded-none sm:rounded-2xl md:rounded-3xl border-0 sm:border border-zinc-200/80 shadow-none sm:shadow-2xl'
      }`}
    >
      {/* Fixed Top Close Bar / Header */}
      <div
        style={{ backgroundColor: primaryColor, color: primaryTextColor }}
        className="px-3.5 sm:px-4 pt-2.5 pb-3 sm:py-3.5 flex flex-col shadow-xs shrink-0 select-none z-20 sticky top-0"
      >
        {/* Mobile Drag/Close Top Sheet Indicator Handle */}
        <div className="sm:hidden w-10 h-1 bg-white/35 rounded-full mx-auto mb-2 shrink-0 pointer-events-none" />

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-base sm:text-lg border border-white/20 shadow-inner">
                {bot.avatar || '🤖'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 style={{ color: primaryTextColor }} className="font-bold text-xs sm:text-sm truncate leading-tight">{bot.name}</h3>
              </div>
              <p style={{ color: primaryTextColor, opacity: 0.85 }} className="text-[10px] font-medium truncate flex items-center gap-1">
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
            <motion.button
              whileHover={{ scale: 1.15, rotate: -45 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleResetChat}
              style={{ color: primaryTextColor }} className="p-2 sm:p-1.5 hover:opacity-80 rounded-xl transition cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Reset Conversation"
              aria-label="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              style={{ color: primaryTextColor }} className="p-2 sm:p-1.5 hover:opacity-80 rounded-xl transition cursor-pointer min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center bg-white/10 sm:bg-transparent"
              title="Close Assistant"
              aria-label="Close Assistant"
            >
              {isFloating ? <X className="w-5 h-5 sm:w-4 sm:h-4" /> : <Minimize2 className="w-5 h-5 sm:w-4 sm:h-4" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div
        ref={messagesContainerRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Conversation messages"
        className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/60 scrollbar-thin"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'visitor';
            const isAgent = msg.sender === 'agent';

            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
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
                  style={isUser ? { backgroundColor: primaryColor, color: primaryTextColor } : {}}
                  className={`px-3.5 py-2.5 rounded-2xl shadow-xs text-xs sm:text-sm ${
                    isUser
                      ? 'rounded-br-xs'
                      : isAgent
                      ? 'bg-amber-50/90 text-amber-950 border border-amber-200 rounded-bl-xs'
                      : 'bg-white text-zinc-900 border border-zinc-200/90 rounded-bl-xs'
                  }`}
                >
                  {/* User Attached Screenshot */}
                  {msg.screenshotUrl && msg.screenshotUrl.startsWith('data:image') && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-[200px]">
                      <img
                        src={msg.screenshotUrl}
                        alt="Attached Screenshot"
                        className="w-full h-auto object-cover max-h-36"
                      />
                    </div>
                  )}

                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownContent
                      content={msg.content}
                      isStreaming={isLoading && activeStreamingMsgIdRef.current === msg.id}
                      sources={msg.sourcesUsed}
                    />
                  )}

                  {/* Actions / Tools Invoked Badges */}
                  {!isUser && msg.toolsInvoked && msg.toolsInvoked.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 flex flex-wrap gap-1">
                      {msg.toolsInvoked.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-200"
                        >
                          <Wrench className="w-2.5 h-2.5 text-zinc-500" />
                          <span>{t.replace(/_/g, ' ')}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Grounding Source Citations Accordion */}
                  {!isUser && msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                    <GroundingSourceAccordion sources={msg.sourcesUsed} variant="inline" />
                  )}
                </div>

                {/* Message Micro-Actions & Timestamp */}
                <div className="flex items-center justify-between gap-2 px-1 mt-0.5 w-full">
                  {!isUser && msg.content && (
                    <MessageActionButtons
                      messageId={msg.id}
                      content={msg.content}
                      isLatest={idx === messages.length - 1}
                      isStreaming={isLoading && activeStreamingMsgIdRef.current === msg.id}
                      onRegenerate={() => {
                        const lastUserMsg = [...messages].reverse().find(m => m.sender === 'visitor');
                        if (lastUserMsg) {
                          setMessages(prev => prev.filter(m => m.id !== msg.id));
                          handleSendMessage(lastUserMsg.content);
                        }
                      }}
                    />
                  )}
                  <span className="text-[9px] text-zinc-400 ml-auto">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Suggested Questions Pills (shown under initial greeting) */}
        {messages.length === 1 && bot.suggestedQuestions && bot.suggestedQuestions.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              Suggested Queries
            </span>
            <div className="flex flex-col gap-1.5">
              {bot.suggestedQuestions.map((q, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSendMessage(q)}
                  className="text-left text-xs bg-white hover:bg-zinc-100/90 text-zinc-700 hover:text-black p-2.5 rounded-xl border border-zinc-200/80 shadow-2xs transition flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate font-medium">{q}</span>
                  <Send className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 shrink-0 ml-2" />
                </motion.button>
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
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowLeadPrompt(false)}
                className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded cursor-pointer"
                title="Dismiss"
                aria-label="Dismiss lead capture prompt"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </div>
            <form onSubmit={handleLeadSubmit} className="space-y-1.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmittingLead || !leadEmail}
                style={{ backgroundColor: primaryColor, color: primaryTextColor }}
                className="w-full text-[11px] font-bold py-1.5 rounded-lg shadow-xs transition hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
              >
                {isSubmittingLead ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                <span>Save Contact Details</span>
              </motion.button>
            </form>
          </div>
        )}

        {/* Typing Loading Indicator */}
        {isLoading && isTypingWaitingToken && (
          <TypingIndicator
            botName={bot.name}
            avatar={bot.avatar}
            primaryColor={primaryColor}
            compact
            statusText="Thinking..."
            onStop={handleStopGenerating}
          />
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
      <div
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        className="p-3 sm:p-3.5 bg-white border-t border-zinc-200 shrink-0 select-none"
      >
        {/* Attached image preview banner */}
        {attachedImageBase64 && (
          <div className="mb-2 p-1.5 bg-zinc-100 rounded-xl flex items-center justify-between gap-2 border border-zinc-200">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={attachedImageBase64}
                alt="Upload preview"
                className="w-8 h-8 rounded-lg object-cover border border-zinc-300 shrink-0"
              />
              <span className="text-[11px] font-medium text-zinc-700 truncate">Screenshot attached</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImageBase64(null)}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md cursor-pointer"
              title="Remove attachment"
              aria-label="Remove image attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition cursor-pointer shrink-0"
            title="Attach screenshot or photo"
            aria-label="Attach screenshot or photo"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => {
              // Smooth scroll to keep active message feed & input visible when mobile virtual keyboard opens
              setTimeout(() => scrollToBottom(true), 150);
            }}
            placeholder="Type your question..."
            disabled={isLoading}
            autoCapitalize="sentences"
            autoCorrect="on"
            className="flex-1 text-xs sm:text-sm px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:border-zinc-900 focus:bg-white transition text-zinc-900 placeholder:text-zinc-400 font-medium"
          />
          {isLoading ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleStopGenerating}
              className="text-white bg-rose-600 hover:bg-rose-700 p-2 sm:p-2.5 rounded-xl transition cursor-pointer shadow-xs shrink-0 flex items-center justify-center min-w-[38px] min-h-[38px]"
              title="Stop Generating"
              aria-label="Stop generating response"
            >
              <Square className="w-4 h-4 fill-current" />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              disabled={(!input.trim() && !attachedImageBase64)}
              style={{ backgroundColor: primaryColor, color: primaryTextColor }}
              className="p-2 sm:p-2.5 rounded-xl transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs shrink-0 flex items-center justify-center min-w-[38px] min-h-[38px]"
              title="Send Message"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          )}
        </form>
        <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 px-1">
          <span>Powered by NomadsChat RAG</span>
          <span className="flex items-center gap-1" role="status" aria-label="Assistant Status: Active">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Active
          </span>
        </div>
      </div>
    </div>
  );
};
