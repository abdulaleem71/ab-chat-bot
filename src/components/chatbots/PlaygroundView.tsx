import React, { useState, useRef, useEffect } from 'react';
import { Chatbot, Message, GroundingSource } from '../../types';
import { Send, Bot, User, Sparkles, BookOpen, RotateCcw, ShieldCheck, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

interface PlaygroundViewProps {
  chatbots: Chatbot[];
  selectedBot: Chatbot;
  onSelectBot: (bot: Chatbot) => void;
  onSendQuery: (botId: string, message: string, conversationId: string | null, history: Message[]) => Promise<{ reply: string; sourcesUsed: GroundingSource[]; conversationId: string }>;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  chatbots,
  selectedBot,
  onSelectBot,
  onSendQuery,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm_init',
      conversationId: 'playground',
      chatbotId: selectedBot.id,
      sender: 'bot',
      content: selectedBot.greetingMessage,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSources, setActiveSources] = useState<GroundingSource[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleResetChat = () => {
    setMessages([
      {
        id: 'm_init_' + Date.now(),
        conversationId: 'playground',
        chatbotId: selectedBot.id,
        sender: 'bot',
        content: selectedBot.greetingMessage,
        timestamp: new Date().toISOString(),
      },
    ]);
    setActiveSources([]);
    setConversationId(null);
  };

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input;
    if (!queryText.trim() || isLoading) return;

    const userMsg: Message = {
      id: 'usr_' + Date.now(),
      conversationId: 'playground',
      chatbotId: selectedBot.id,
      sender: 'visitor',
      content: queryText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await onSendQuery(selectedBot.id, queryText, conversationId, [...messages, userMsg]);

      if (res.conversationId) {
        setConversationId(res.conversationId);
      }

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
    } catch (err) {
      const errorMsg: Message = {
        id: 'err_' + Date.now(),
        conversationId: 'playground',
        chatbotId: selectedBot.id,
        sender: 'bot',
        content: selectedBot.fallbackMessage,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Bot Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: selectedBot.primaryColor }}
            className="w-10 h-10 rounded-xl text-xl flex items-center justify-center text-white"
          >
            {selectedBot.avatar}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Interactive Chatbot Playground</h2>
            <p className="text-xs text-slate-500">Test live Gemini API responses with knowledge grounding before embedding widget</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBot.id}
            onChange={e => {
              const b = chatbots.find(x => x.id === e.target.value);
              if (b) {
                onSelectBot(b);
                handleResetChat();
              }
            }}
            className="text-xs font-semibold bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
          >
            {chatbots.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <button
            onClick={handleResetChat}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="Reset Chat Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Live Chat Preview (Left) + RAG Grounding Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px] lg:h-[600px]">
        {/* Chat Interface Container */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col overflow-hidden">
          {/* Header */}
          <div
            style={{ backgroundColor: selectedBot.primaryColor }}
            className="p-4 text-white flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedBot.avatar}</span>
              <div>
                <h3 className="font-bold text-sm">{selectedBot.name}</h3>
                <p className="text-[11px] opacity-90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Gemini 2.5 Flash • {selectedBot.tone} Tone</span>
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
              Live Preview
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div
                    style={{ backgroundColor: selectedBot.primaryColor }}
                    className="w-8 h-8 rounded-full text-white text-sm flex items-center justify-center shrink-0 mt-0.5 shadow-xs"
                  >
                    {selectedBot.avatar}
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'visitor'
                      ? 'bg-indigo-600 text-white font-medium rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Sources Used Badge */}
                  {msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                      <span className="font-semibold text-indigo-600 flex items-center gap-1 mb-1">
                        <BookOpen className="w-3 h-3" /> Grounded in Knowledge Sources:
                      </span>
                      {msg.sourcesUsed.map((s, i) => (
                        <div key={i} className="bg-indigo-50/80 p-1.5 rounded border border-indigo-100 mt-1 font-sans">
                          <p className="font-bold text-indigo-900">{s.title}</p>
                          <p className="italic text-slate-600 line-clamp-1">{s.snippet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'visitor' && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    U
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start items-center text-xs text-slate-400">
                <div
                  style={{ backgroundColor: selectedBot.primaryColor }}
                  className="w-8 h-8 rounded-full text-white text-sm flex items-center justify-center animate-bounce"
                >
                  {selectedBot.avatar}
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Generating AI reply from Gemini & Knowledge Base...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {selectedBot.suggestedQuestions && selectedBot.suggestedQuestions.length > 0 && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Prompts:</span>
              {selectedBot.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap transition border border-slate-200 shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={`Ask ${selectedBot.name} a question...`}
              className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              style={{ backgroundColor: selectedBot.primaryColor }}
              className="p-2.5 text-white rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Panel: Gemini RAG Grounding Inspector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900">Gemini Grounding Inspector</h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Real-time inspection of source documents referenced by Gemini to generate verified responses.
            </p>

            {activeSources.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">No active sources triggered yet</p>
                <p className="text-[10px] text-slate-400 mt-1">Send a message in the test chat to view RAG citations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSources.map((source, idx) => (
                  <div key={idx} className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1 text-indigo-900 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{source.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-indigo-100">
                      "{source.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 bg-slate-50 p-3 rounded-xl border-slate-200 mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Bot System Persona</span>
            <p className="text-[11px] text-slate-600 line-clamp-3 font-mono">{selectedBot.systemInstruction}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
