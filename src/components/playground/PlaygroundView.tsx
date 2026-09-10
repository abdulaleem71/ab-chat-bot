import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Trash2,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Code,
} from 'lucide-react';
import { Chatbot, Message, GroundingSource } from '../../types';
import { useChatStream } from '../../hooks/useChatStream';
import { MarkdownContent } from '../../lib/markdown';
import { GroundingSourceAccordion } from '../common/GroundingSourceAccordion';
import { MessageActionButtons } from '../common/MessageActionButtons';
import { getModelDisplayName } from '../../config/models';

export interface PlaygroundViewProps {
  bot?: Chatbot;
  chatbots?: Chatbot[];
  selectedBot?: Chatbot | null;
  onSelectBot?: (bot: Chatbot) => void;
  onCreateBot?: () => void;
  onSendQuery?: (botId: string, message: string, history: Message[]) => Promise<{ reply: string; sourcesUsed: GroundingSource[] }>;
  onOpenEmbedModal?: (bot: Chatbot) => void;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  bot,
  chatbots = [],
  selectedBot,
  onSelectBot,
  onCreateBot,
  onSendQuery,
  onOpenEmbedModal,
}) => {
  const activeBot = bot || selectedBot || chatbots[0] || null;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      conversationId: 'playground',
      chatbotId: activeBot?.id || 'playground_bot',
      sender: 'bot',
      content: activeBot?.greetingMessage || 'Hello! How can I assist you today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string>('');

  const { isStreaming, activeSources, streamMessage, stopStreaming } = useChatStream();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on incoming tokens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // If active bot changes, reset greeting
  useEffect(() => {
    if (activeBot) {
      setMessages([
        {
          id: 'greeting',
          conversationId: 'playground',
          chatbotId: activeBot.id,
          sender: 'bot',
          content: activeBot.greetingMessage || 'Hello! How can I assist you today?',
          timestamp: new Date().toISOString(),
        },
      ]);
      setConversationId('');
    }
  }, [activeBot?.id]);

  if (!activeBot) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center p-6 bg-zinc-50/50 rounded-2xl border border-zinc-200">
        <Bot className="w-12 h-12 text-zinc-300 mb-3" />
        <h3 className="text-sm font-bold text-zinc-700">No Chatbot Configured</h3>
        <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
          Create or select a bot to test live token streaming and RAG grounding in the playground sandbox.
        </p>
        {onCreateBot && (
          <button
            onClick={onCreateBot}
            className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Create New Bot
          </button>
        )}
      </div>
    );
  }

  const handleSend = async (overrideMessage?: string) => {
    const textToSend = overrideMessage !== undefined ? overrideMessage.trim() : inputMessage.trim();
    if (!textToSend || isStreaming) return;

    if (overrideMessage === undefined) {
      setInputMessage('');
    }

    const userMsgId = `user_${Date.now()}`;
    const botMsgId = `bot_${Date.now()}`;

    const userMsg: Message = {
      id: userMsgId,
      conversationId: conversationId || 'playground',
      chatbotId: activeBot.id,
      sender: 'visitor',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const initialBotMsg: Message = {
      id: botMsgId,
      conversationId: conversationId || 'playground',
      chatbotId: activeBot.id,
      sender: 'bot',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, initialBotMsg]);

    // Format chat history for context
    const currentHistory = [...messages, userMsg];

    // Stream response from server
    await streamMessage({
      botId: activeBot.id,
      conversationId,
      message: textToSend,
      history: currentHistory,
      onToken: (token) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, content: m.content + token } : m))
        );
      },
      onComplete: (newConvId, sources) => {
        if (newConvId) setConversationId(newConvId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? { ...m, sourcesUsed: sources.length > 0 ? sources : undefined }
              : m
          )
        );
      },
    });
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || isStreaming) return;
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.sender === 'visitor');
    if (lastUserIndex === -1) return;

    const userMessage = [...messages].reverse()[lastUserIndex];
    // Remove last bot message and replay user message
    setMessages((prev) => prev.slice(0, prev.length - 1));
    handleSend(userMessage.content);
  };

  const handleClear = () => {
    stopStreaming();
    setConversationId('');
    setMessages([
      {
        id: 'greeting',
        conversationId: 'playground',
        chatbotId: activeBot.id,
        sender: 'bot',
        content: activeBot.greetingMessage || 'Hello! How can I assist you today?',
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-5xl mx-auto p-4">
      {/* Playground Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white shrink-0 font-medium"
            style={{ backgroundColor: activeBot.primaryColor || '#4F46E5' }}
          >
            {activeBot.avatar || <Bot className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-zinc-900 leading-none">{activeBot.name} Sandbox</h2>
              {onOpenEmbedModal && (
                <button
                  onClick={() => onOpenEmbedModal(activeBot)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-900 flex items-center gap-0.5"
                  title="Open Embed Widget"
                >
                  <Code className="w-3 h-3" />
                  <span className="hidden sm:inline">Embed</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 font-medium text-zinc-600">
                Tone: {activeBot.tone}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 font-medium text-zinc-600">
                {getModelDisplayName(activeBot.model)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            title="Reset Chat Session"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {messages.map((m, idx) => {
          const isBot = m.sender === 'bot';
          const isLatest = idx === messages.length - 1;

          return (
            <div
              key={m.id}
              className={`flex gap-3 text-xs group ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] shrink-0 text-white shadow-xs ${
                  isBot ? '' : 'bg-zinc-800'
                }`}
                style={isBot ? { backgroundColor: activeBot.primaryColor || '#4F46E5' } : {}}
              >
                {isBot ? (activeBot.avatar || <Bot className="w-3.5 h-3.5" />) : <User className="w-3.5 h-3.5" />}
              </div>

              {/* Message Content Container */}
              <div className={`max-w-[80%] space-y-1.5 ${isBot ? 'text-left' : 'text-right'}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs inline-block text-left relative ${
                    isBot
                      ? 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-xs'
                      : 'bg-zinc-900 text-white rounded-tr-xs'
                  }`}
                >
                  {isBot ? (
                    <div>
                      {m.content ? (
                        <MarkdownContent
                          content={m.content}
                          isStreaming={isStreaming && isLatest}
                          sources={m.sourcesUsed}
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-400 py-0.5">
                          <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                          <span className="text-[11px] italic">Generating grounded response...</span>
                        </div>
                      )}
                      {/* Animated token cursor */}
                      {isStreaming && isLatest && m.content && (
                        <span className="inline-block w-1.5 h-3.5 bg-zinc-900 animate-pulse ml-1 align-middle" />
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}

                  {/* Verified Grounding Sources Accordion & Trust Badge */}
                  {m.sourcesUsed && m.sourcesUsed.length > 0 && (
                    <GroundingSourceAccordion sources={m.sourcesUsed} variant="inline" />
                  )}
                </div>

                {/* Message Micro-Actions: Copy as Markdown, Regenerate, Thumbs Feedback */}
                {isBot && m.content && (
                  <div className="pl-1">
                    <MessageActionButtons
                      messageId={m.id}
                      content={m.content}
                      isLatest={isLatest}
                      isStreaming={isStreaming}
                      onRegenerate={handleRegenerate}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      {activeBot.suggestedQuestions && activeBot.suggestedQuestions.length > 0 && (
        <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-zinc-400 font-semibold shrink-0">Try:</span>
          {activeBot.suggestedQuestions.map((q, qIdx) => (
            <button
              key={qIdx}
              disabled={isStreaming}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 text-[11px] whitespace-nowrap transition disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Composer Bar */}
      <div className="pt-2 border-t border-zinc-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask ${activeBot.name} a question...`}
            disabled={isStreaming}
            className="w-full pl-3 pr-24 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-800 focus:bg-white transition disabled:opacity-60"
          />

          <div className="absolute right-2 flex items-center gap-1">
            {isStreaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold transition shadow-xs cursor-pointer"
                title="Stop generation"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-1.5 bg-zinc-900 hover:bg-black text-white rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                title="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>
        <p className="text-[10px] text-zinc-400 text-center mt-1.5">
          Grounded with RAG retrieval embeddings & token-by-token streaming.
        </p>
      </div>
    </div>
  );
};
