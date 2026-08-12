import React, { useState, useRef, useEffect } from 'react';
import { Chatbot, Message, GroundingSource } from '../../types';
import { Send, Bot, Loader2, Sparkles, X, Minimize2, BookOpen } from 'lucide-react';

interface EmbedChatWidgetProps {
  bot: Chatbot;
  isFloating?: boolean;
  onClose?: () => void;
}

export const EmbedChatWidget: React.FC<EmbedChatWidgetProps> = ({ bot, isFloating = false, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init_' + Date.now(),
      conversationId: 'embed_conv',
      chatbotId: bot.id,
      sender: 'bot',
      content: bot.greetingMessage,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasCapturedLead, setHasCapturedLead] = useState(!bot.collectLeadEmail);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadName, setLeadName] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`nc_conv_${bot.id}`) || null;
    } catch {
      return null;
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim()) return;
    setHasCapturedLead(true);

    try {
      const res = await fetch(`/api/chatbots/${bot.id}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadName || 'Website Visitor',
          email: leadEmail,
          firstQuestion: messages.length > 1 ? messages[messages.length - 1].content : undefined,
          conversationId: conversationId || undefined,
        }),
      });
      const data = await res.json();
      if (data.lead?.conversationId && data.lead.conversationId !== conversationId) {
        setConversationId(data.lead.conversationId);
        try {
          localStorage.setItem(`nc_conv_${bot.id}`, data.lead.conversationId);
        } catch (e) {
          // ignore storage failures (e.g. private mode)
        }
      }
    } catch (err) {
      console.log('Error saving lead to database:', err);
    }

    setMessages(prev => [
      ...prev,
      {
        id: 'lead_ack_' + Date.now(),
        conversationId: 'embed_conv',
        chatbotId: bot.id,
        sender: 'bot',
        content: `Thank you, ${leadName || 'there'} (${leadEmail})! You're connected. How can I help you?`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      conversationId: 'embed_conv',
      chatbotId: bot.id,
      sender: 'visitor',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/chatbots/${bot.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId || undefined,
          conversationHistory: [...messages, userMsg],
          visitorInfo: { email: leadEmail, name: leadName },
        }),
      });

      const data = await res.json();
      if (data.conversationId && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        try {
          localStorage.setItem(`nc_conv_${bot.id}`, data.conversationId);
        } catch (e) {
          // ignore storage failures (e.g. private mode)
        }
      }

      const botMsg: Message = {
        id: 'bot_' + Date.now(),
        conversationId: 'embed_conv',
        chatbotId: bot.id,
        sender: 'bot',
        content: data.reply || bot.fallbackMessage,
        sourcesUsed: data.sourcesUsed || [],
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          conversationId: 'embed_conv',
          chatbotId: bot.id,
          sender: 'bot',
          content: bot.fallbackMessage,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col bg-white overflow-hidden shadow-2xl border border-slate-200 ${
      isFloating ? 'w-80 sm:w-96 h-[540px] rounded-2xl fixed bottom-20 right-6 z-50 animate-in slide-in-from-bottom-4 duration-200' : 'w-full h-full min-h-[500px] rounded-2xl'
    }`}>
      {/* Header */}
      <div
        style={{ backgroundColor: bot.primaryColor || '#4F46E5' }}
        className="p-4 text-white flex items-center justify-between shrink-0 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs text-xl flex items-center justify-center shrink-0">
            {bot.avatar || '🤖'}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{bot.name}</h3>
            <div className="flex items-center gap-1.5 text-[10px] opacity-90">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Support • {bot.model || 'Gemini 3.6'}</span>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages / Lead Capture */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
        {!hasCapturedLead ? (
          <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm text-center my-4">
            <div
              style={{ color: bot.primaryColor }}
              className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-2 font-bold text-xl"
            >
              ✉️
            </div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">{bot.leadTitle || 'Connect with support'}</h4>
            <p className="text-[11px] text-slate-500 mb-3">Please provide your details so we can assist you better.</p>

            <form onSubmit={handleLeadSubmit} className="space-y-2 text-left">
              <div>
                <input
                  type="text"
                  placeholder="Your name"
                  value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Work email address *"
                  value={leadEmail}
                  onChange={e => setLeadEmail(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                style={{ backgroundColor: bot.primaryColor || '#4F46E5' }}
                className="w-full text-white text-xs font-semibold py-2 rounded-xl shadow-xs hover:opacity-95 transition"
              >
                Start Chat Session
              </button>
            </form>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div
                    style={{ backgroundColor: bot.primaryColor || '#4F46E5' }}
                    className="w-7 h-7 rounded-full text-white text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-xs"
                  >
                    {bot.avatar || '🤖'}
                  </div>
                )}

                <div
                  style={msg.sender === 'visitor' ? { backgroundColor: bot.primaryColor || '#000000' } : undefined}
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === 'visitor'
                      ? 'text-white font-medium rounded-tr-xs shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                      <span className="font-semibold text-indigo-600 flex items-center gap-1 mb-0.5">
                        <BookOpen className="w-3 h-3" /> Grounded Source:
                      </span>
                      {msg.sourcesUsed.map((s, i) => (
                        <p key={i} className="italic text-slate-600 truncate">{s.title}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start items-center text-xs text-slate-400">
                <div
                  style={{ backgroundColor: bot.primaryColor || '#4F46E5' }}
                  className="w-7 h-7 rounded-full text-white text-xs flex items-center justify-center animate-bounce"
                >
                  {bot.avatar || '🤖'}
                </div>
                <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-[11px]">
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggested Prompts */}
      {hasCapturedLead && bot.suggestedQuestions && bot.suggestedQuestions.length > 0 && (
        <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto shrink-0">
          {bot.suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[10px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap transition border border-slate-200 shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {hasCapturedLead && (
        <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-black focus:outline-hidden"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            style={{ backgroundColor: bot.primaryColor || '#000000' }}
            className="p-2 text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* NomadsArc Powered Footer Credit */}
      <div className="text-[10px] text-center text-zinc-400 py-1 bg-zinc-50 border-t border-zinc-100 font-medium shrink-0">
        Powered by{' '}
        <a
          href="https://nomadsarc.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline font-bold text-black"
        >
          NomadsArc
        </a>
      </div>
    </div>
  );
};
