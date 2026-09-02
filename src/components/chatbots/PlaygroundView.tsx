import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Chatbot, Message, GroundingSource } from '../../types';
import { MarkdownContent } from '../../lib/markdown';
import { Send, Bot, User, Sparkles, BookOpen, RotateCcw, ShieldCheck, CheckCircle2, ChevronRight, Loader2, ExternalLink, Layers, Code, Copy, Check } from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import { getModelDisplayName } from '../../config/models';
import { telemetry } from '../../lib/telemetry';

interface PlaygroundViewProps {
  chatbots: Chatbot[];
  selectedBot?: Chatbot | null;
  onSelectBot: (bot: Chatbot) => void;
  onCreateBot?: () => void;
  onSendQuery: (botId: string, message: string, history: Message[]) => Promise<{ reply: string; sourcesUsed: GroundingSource[] }>;
  onOpenEmbedModal?: (bot: Chatbot) => void;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  chatbots,
  selectedBot,
  onSelectBot,
  onCreateBot,
  onSendQuery,
  onOpenEmbedModal,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSources, setActiveSources] = useState<GroundingSource[]>([]);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  useEffect(() => {
    if (selectedBot) {
      setMessages([
        {
          id: 'm_init_' + selectedBot.id,
          conversationId: 'playground',
          chatbotId: selectedBot.id,
          sender: 'bot',
          content: selectedBot.greetingMessage || 'Hello! How can I assist you today?',
          timestamp: new Date().toISOString(),
        },
      ]);
      setActiveSources([]);
    } else {
      setMessages([]);
      setActiveSources([]);
    }
  }, [selectedBot?.id]);

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      } else if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'end',
        });
      }
    });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom(true);
    }
  }, [isLoading]);

  if (!selectedBot) {
    return (
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-12 text-center shadow-xs animate-in fade-in duration-200">
        <div className="w-16 h-16 bg-zinc-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-zinc-400">
          <Bot className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2 font-heading">No Active Chatbots</h2>
        <p className="text-xs text-zinc-500 max-w-md mx-auto mb-6 font-body">
          Create your first grounded AI chatbot to test live responses in the interactive playground.
        </p>
        {onCreateBot && (
          <MotionButton
            variant="primary"
            size="md"
            shimmer
            leftIcon={<Bot className="w-4 h-4" />}
            onClick={onCreateBot}
          >
            Create New Chatbot
          </MotionButton>
        )}
      </div>
    );
  }

  const handleResetChat = () => {
    if (!selectedBot) return;
    setMessages([
      {
        id: 'm_init_' + Date.now(),
        conversationId: 'playground',
        chatbotId: selectedBot.id,
        sender: 'bot',
        content: selectedBot.greetingMessage || 'Hello! How can I assist you today?',
        timestamp: new Date().toISOString(),
      },
    ]);
    setActiveSources([]);
  };

  const handleSend = async (textToSend?: string) => {
    if (!selectedBot) return;
    const queryText = textToSend || input;
    if (!queryText.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      conversationId: 'playground',
      chatbotId: selectedBot.id,
      sender: 'visitor',
      content: queryText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await onSendQuery(selectedBot.id, queryText.trim(), [...messages, userMsg]);

      const botMsg: Message = {
        id: 'bot_' + Date.now(),
        conversationId: 'playground',
        chatbotId: selectedBot.id,
        sender: 'bot',
        content: res.reply,
        sourcesUsed: res.sourcesUsed,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMsg]);
      if (res.sourcesUsed && res.sourcesUsed.length > 0) {
        setActiveSources(res.sourcesUsed);
      }
    } catch (err: any) {
      console.log('Error querying playground bot:', err);
      telemetry.logGeminiApiFailure(err, {
        botId: selectedBot.id,
        model: selectedBot.model,
        promptSnippet: queryText,
      });
      const errorMsg: Message = {
        id: 'err_' + Date.now(),
        conversationId: 'playground',
        chatbotId: selectedBot.id,
        sender: 'bot',
        content: selectedBot.fallbackMessage || "I'm having trouble processing that right now. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'How do I embed the chat widget on my website?',
    'What features are included in the Pro Plan?',
    'Can I connect custom domain knowledge?',
    'How does live operator takeover work?',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Bot Selector Bar */}
      <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            style={{ backgroundColor: selectedBot.primaryColor || '#09090b' }}
            className="w-12 h-12 rounded-2xl text-2xl flex items-center justify-center text-white shadow-xs shrink-0 font-bold"
          >
            {selectedBot.avatar || '🤖'}
          </div>
          <div>
            <h1 className="text-base font-extrabold text-zinc-900">{selectedBot.name} Playground</h1>
            <p className="text-xs text-zinc-500 font-medium">Test live Gemini API synthesis and inspect retrieved RAG citations.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {chatbots.length > 1 && (
            <select
              value={selectedBot.id}
              onChange={e => {
                const b = chatbots.find(x => x.id === e.target.value);
                if (b) onSelectBot(b);
              }}
              className="bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:border-zinc-900"
            >
              {chatbots.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({getModelDisplayName(b.model)})
                </option>
              ))}
            </select>
          )}

          {onOpenEmbedModal && (
            <MotionButton
              variant="dark"
              size="sm"
              shimmer
              leftIcon={<Code className="w-3.5 h-3.5" />}
              onClick={() => onOpenEmbedModal(selectedBot)}
            >
              Get Embed Code
            </MotionButton>
          )}

          <MotionButton
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5 text-zinc-700" />}
            onClick={handleResetChat}
          >
            Reset Chat
          </MotionButton>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left: Chat Simulator (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-zinc-200/80 rounded-3xl shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Header */}
          <div
            style={{ backgroundColor: selectedBot.primaryColor || '#09090b' }}
            className="p-4 text-white flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">
                {selectedBot.avatar || '🤖'}
              </div>
              <div>
                <h3 className="text-xs font-extrabold font-heading">{selectedBot.name}</h3>
                <p className="text-[10px] text-white/80 font-medium font-body">Model: {getModelDisplayName(selectedBot.model)} • Grounded RAG</p>
              </div>
            </div>

            <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
              Interactive Test
            </span>
          </div>

          {/* Messages Window */}
          <div
            ref={messagesContainerRef}
            className="flex-1 p-5 overflow-y-auto space-y-4 bg-zinc-50/40 min-h-[380px]"
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div
                    style={{ backgroundColor: selectedBot.primaryColor || '#09090b' }}
                    className="w-8 h-8 rounded-xl text-white text-xs flex items-center justify-center shrink-0 font-bold shadow-xs"
                  >
                    {selectedBot.avatar || '🤖'}
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs shadow-2xs relative group ${
                    msg.sender === 'visitor'
                      ? 'bg-zinc-950 text-white rounded-tr-xs font-medium'
                      : 'bg-white border border-zinc-200/80 text-zinc-900 rounded-tl-xs'
                  }`}
                >
                  <MarkdownContent content={msg.content} />

                  {msg.sender === 'bot' && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Grounded RAG
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 cursor-pointer flex items-center gap-1 text-[10px] font-medium"
                        title="Copy response"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block font-heading">
                        Citations & Sources:
                      </span>
                      {msg.sourcesUsed.map((s, idx) => (
                        <div key={idx} className="text-[11px] text-zinc-600 bg-zinc-50 p-1.5 rounded-lg border border-zinc-200/60 font-medium font-body">
                          <strong>[{idx + 1}]</strong> {s.title} {s.url && `(${s.url})`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'visitor' && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 text-white text-xs flex items-center justify-center shrink-0 font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: selectedBot.primaryColor || '#09090b' }}
                  className="w-8 h-8 rounded-xl text-white text-xs flex items-center justify-center shrink-0"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl px-4 py-3 text-xs text-zinc-500 font-medium flex items-center gap-2 shadow-2xs font-body">
                  <span>Synthesizing grounded response with Gemini...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-zinc-50 border-t border-zinc-200/80 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 px-1 font-heading">
              Sample Queries:
            </span>
            {sampleQuestions.map((q, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-[11px] font-semibold bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer disabled:opacity-50 font-body"
              >
                {q}
              </motion.button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3.5 bg-white border-t border-zinc-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything to test chatbot grounding..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white transition font-medium font-body"
            />
            <MotionButton
              type="submit"
              variant="primary"
              size="md"
              shimmer
              disabled={isLoading || !input.trim()}
              leftIcon={isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            >
              Send
            </MotionButton>
          </form>
        </div>

        {/* Right: Inspection Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Persona Specs */}
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
              Chatbot Persona Specs
            </h3>

            <div className="space-y-2 text-xs">
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">AI Engine</span>
                <span className="text-zinc-900 font-bold">{getModelDisplayName(selectedBot.model)}</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Tone of Voice</span>
                <span className="text-zinc-900 font-bold">{selectedBot.tone}</span>
              </div>
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/60">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">System Instruction</span>
                <p className="text-[11px] text-zinc-600 font-normal mt-0.5 line-clamp-3">
                  {selectedBot.systemInstruction || selectedBot.description || 'Ground answers using knowledge base citations.'}
                </p>
              </div>
            </div>
          </div>

          {/* Active Grounding Sources */}
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
                Grounding Citations
              </h3>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>

            {activeSources.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-xs font-medium space-y-1">
                <BookOpen className="w-6 h-6 mx-auto text-zinc-300" />
                <p>No citations queried yet.</p>
                <p className="text-[10px] text-zinc-400">Ask a question to see the RAG retrieval pipeline in action.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeSources.map((src, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 truncate">{src.title}</span>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded uppercase">
                        Matched
                      </span>
                    </div>
                    {src.snippet && (
                      <p className="text-[11px] text-zinc-600 font-normal line-clamp-2 leading-relaxed">
                        "{src.snippet}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
