import React, { useState, useEffect } from 'react';
import { Send, RotateCcw, Sparkles, AlertCircle, Check, Wand2 } from 'lucide-react';
import { Chatbot, BotTone, GroundingSource } from '../../types';
import {
  evaluatePairContrast,
  getAccessibleTextColor,
  isValidHexColor,
} from '../../lib/colorUtils';
import { getTonePreset } from '../../data/tonePresets';
import { MarkdownContent } from '../../lib/markdown';
import { GroundingSourceAccordion } from '../common/GroundingSourceAccordion';
import { MessageActionButtons } from '../common/MessageActionButtons';

interface LiveBotPreviewCardProps {
  formData: Partial<Chatbot>;
  onUpdateTextColor?: (color: string) => void;
  onSelectTone?: (tone: BotTone) => void;
}

interface PreviewMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  sourcesUsed?: GroundingSource[];
}

export const LiveBotPreviewCard: React.FC<LiveBotPreviewCardProps> = ({
  formData,
  onUpdateTextColor,
}) => {
  const primaryColor = formData.primaryColor?.trim() || '#4F46E5';
  const textColor = formData.textColor?.trim() || '#FFFFFF';
  const isPrimaryValid = isValidHexColor(primaryColor);
  const isTextValid = isValidHexColor(textColor);
  const accessibleTextColor = getAccessibleTextColor(primaryColor);

  const pairContrast = evaluatePairContrast(primaryColor, textColor);
  const activeTonePreset = getTonePreset(formData.tone);

  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize and sync greeting when changed
  useEffect(() => {
    setMessages([
      {
        id: 'greeting',
        sender: 'bot',
        text: formData.greetingMessage || '👋 Hi there! How can I help you today?',
        timestamp: 'Just now',
      },
    ]);
  }, [formData.greetingMessage]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputVal).trim();
    if (!text) return;

    const userMsg: PreviewMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // Simulate smart tone-adaptive response with simulated grounding citations
    setTimeout(() => {
      let botReply = '';
      let simulatedSources: GroundingSource[] = [];
      const lower = text.toLowerCase();

      if (lower.includes('refund') || lower.includes('return') || lower.includes('policy')) {
        simulatedSources = [
          {
            title: 'Customer Refund & Returns Policy',
            snippet: 'Standard refunds are processed back to the original payment method within 3 to 5 business days upon approval.',
            sourceType: 'document',
          },
          {
            title: 'Billing & Settlement FAQs',
            snippet: 'All major credit cards and digital wallets receive automated refund confirmation emails instantly.',
            url: 'https://help.nomads.ai/refund-policy',
            sourceType: 'url',
          },
        ];

        switch (formData.tone) {
          case 'Concise':
            botReply = 'Refunds process in 3–5 business days to your original payment method [1]. Instant confirmation sent via email [2].';
            break;
          case 'Friendly':
            botReply = "Good news! We'll process your refund within 3 to 5 business days right back to your account [1]! You'll also get an email confirmation right away [2]! 🎉";
            break;
          case 'Technical':
            botReply = 'Refund transaction pipeline: Automated ACH/Gateway settlement takes 3–5 business days [1]. Webhook dispatched upon confirmation [2].';
            break;
          case 'Empathetic':
            botReply = "I understand waiting on money can be stressful. We'll have your refund safely processed within 3–5 business days [1], and you will receive instant confirmation [2]! 💙";
            break;
          case 'Professional':
          default:
            botReply = 'Our standard refund timeframe is 3 to 5 business days, credited directly to your original payment method [1]. A confirmation email will follow [2].';
            break;
        }
      } else if (lower.includes('password') || lower.includes('reset') || lower.includes('login')) {
        simulatedSources = [
          {
            title: 'Account Security & Password Reset Guide',
            snippet: 'Users can reset credentials by entering their registered email on the login screen to receive a secure 15-minute token link.',
            url: 'https://nomads.ai/docs/security/password-reset',
            sourceType: 'url',
          },
        ];

        switch (formData.tone) {
          case 'Concise':
            botReply = 'Password reset link sent to your registered email [1]. Link expires in 15 minutes.';
            break;
          case 'Friendly':
            botReply = "No worries at all! Just check your inbox for the reset link we just sent over [1]! 💌";
            break;
          case 'Technical':
            botReply = 'Auth flow initiated: Dispatched 15-minute cryptographic reset token to registered email [1].';
            break;
          case 'Empathetic':
            botReply = "Account lockouts are frustrating! I've sent a secure reset link to your email to get you right back in [1]. 🛡️";
            break;
          case 'Professional':
          default:
            botReply = 'A secure password reset verification link has been dispatched to your email address on file [1].';
            break;
        }
      } else if (lower.includes('hour') || lower.includes('support') || lower.includes('time')) {
        simulatedSources = [
          {
            title: 'Support Operations & SLAs',
            snippet: 'AI Assistant operates 24/7/365 with automated knowledge base resolution. Live human specialists are active Monday through Friday, 9:00 AM to 6:00 PM EST.',
            sourceType: 'document',
          },
        ];

        switch (formData.tone) {
          case 'Concise':
            botReply = 'Support active 24/7 via chat. Human agents available Mon–Fri 9am–6pm EST [1].';
            break;
          case 'Friendly':
            botReply = "We're here for you 24/7! Our friendly human team is also live Mon–Fri 9am–6pm EST [1]! ✨";
            break;
          case 'Technical':
            botReply = 'AI gateway SLA: 99.9% uptime 24/7/365. Tier-2 engineer escalations Mon–Fri 14:00–23:00 UTC [1].';
            break;
          case 'Empathetic':
            botReply = "We're always here whenever you need us! Our AI is ready 24/7, and our caring team is on standby Mon–Fri [1]. 💙";
            break;
          case 'Professional':
          default:
            botReply = 'Our AI assistance is available 24/7. Live customer service specialists operate Monday–Friday 9:00 AM – 6:00 PM EST [1].';
            break;
        }
      } else {
        switch (formData.tone) {
          case 'Concise':
            botReply = `Received: "${text}". Verified against company knowledge base documentation.`;
            break;
          case 'Friendly':
            botReply = `Great question about "${text}"! I'm happy to look that up in our database for you right now! 😊`;
            break;
          case 'Technical':
            botReply = `Query parsed: "${text}". Vector similarity threshold > 0.85 retrieved relevant knowledge chunks.`;
            break;
          case 'Empathetic':
            botReply = `Thank you for asking about "${text}"! I'm here to ensure you get the exact help and guidance you need. 💙`;
            break;
          case 'Professional':
          default:
            botReply = `Thank you for your inquiry regarding "${text}". I am reviewing your account records and knowledge resources.`;
            break;
        }
      }

      const botMsg: PreviewMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botReply,
        sourcesUsed: simulatedSources.length > 0 ? simulatedSources : undefined,
        timestamp: 'Just now',
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'greeting',
        sender: 'bot',
        text: formData.greetingMessage || '👋 Hi there! How can I help you today?',
        timestamp: 'Just now',
      },
    ]);
  };

  const starterQuestions =
    formData.suggestedQuestions && formData.suggestedQuestions.length > 0
      ? formData.suggestedQuestions
      : ['When will I get my refund?', 'How do I reset my password?', 'What are support hours?'];

  const headerBg = isPrimaryValid ? primaryColor : '#4F46E5';
  const headerFg = isTextValid ? textColor : accessibleTextColor;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-zinc-200/90 shadow-sm overflow-hidden">
      {/* Top Banner / Controls */}
      <div className="px-3.5 py-2.5 bg-zinc-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider font-heading">
            Live Interactive Preview
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResetChat}
            title="Reset simulated conversation"
            className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1 text-[10px] font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Tone & Accessibility Status Bar */}
      <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-zinc-500">Tone:</span>
          <span className="text-[11px] font-extrabold text-zinc-900 bg-white border border-zinc-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
            <span>{activeTonePreset.icon}</span>
            <span>{formData.tone || 'Friendly'}</span>
          </span>
        </div>

        {/* Contrast Status */}
        <div className="flex items-center gap-1">
          {pairContrast.passesAA ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>{pairContrast.ratio}:1 AA</span>
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>Low ({pairContrast.ratio}:1)</span>
              </span>
              {onUpdateTextColor && (
                <button
                  type="button"
                  onClick={() => onUpdateTextColor(pairContrast.recommendedTextColor)}
                  className="text-[10px] font-extrabold text-white bg-black hover:bg-zinc-800 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 cursor-pointer shadow-2xs"
                >
                  <Wand2 className="w-2.5 h-2.5" />
                  <span>Fix</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mock Chat Frame */}
      <div className="flex-1 flex flex-col min-h-[360px] bg-zinc-100/70 p-3">
        {/* Chat Widget Container */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-zinc-200/90 shadow-sm overflow-hidden">
          {/* Widget Header */}
          <div
            style={{
              backgroundColor: headerBg,
              color: headerFg,
            }}
            className="px-3.5 py-3 flex items-center justify-between transition-colors duration-200 shrink-0 shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                style={{
                  backgroundColor:
                    headerFg.toLowerCase() === '#ffffff'
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(0,0,0,0.08)',
                  borderColor:
                    headerFg.toLowerCase() === '#ffffff'
                      ? 'rgba(255,255,255,0.3)'
                      : 'rgba(0,0,0,0.15)',
                  color: headerFg,
                }}
                className="w-8 h-8 rounded-xl text-base flex items-center justify-center shrink-0 border shadow-2xs"
              >
                {formData.avatar || '🤖'}
              </div>
              <div className="min-w-0">
                <h4 style={{ color: headerFg }} className="font-extrabold text-xs truncate">
                  {formData.name || 'AI Assistant'}
                </h4>
                <p style={{ color: headerFg, opacity: 0.85 }} className="text-[10px] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Online • AI Support</span>
                </p>
              </div>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-zinc-50/50 text-xs">
            {messages.map((msg, idx) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[90%] ${isBot ? 'justify-start' : 'justify-end'}`}>
                    {isBot && (
                      <div
                        style={{
                          backgroundColor: headerBg,
                          color: headerFg,
                        }}
                        className="w-6 h-6 rounded-full text-[10px] flex items-center justify-center shrink-0 shadow-2xs mt-0.5"
                      >
                        {formData.avatar || '🤖'}
                      </div>
                    )}
                    <div
                      style={
                        !isBot
                          ? {
                              backgroundColor: headerBg,
                              color: headerFg,
                            }
                          : undefined
                      }
                      className={`rounded-2xl px-3 py-2 text-[11px] leading-relaxed font-medium transition-all ${
                        isBot
                          ? 'bg-white border border-zinc-200 text-zinc-800 shadow-2xs'
                          : 'shadow-xs font-semibold'
                      }`}
                    >
                      {isBot ? (
                        <>
                          <MarkdownContent content={msg.text} sources={msg.sourcesUsed} />
                          {msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                            <GroundingSourceAccordion sources={msg.sourcesUsed} variant="inline" />
                          )}
                        </>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>

                  {/* Micro Actions */}
                  {isBot && msg.text && (
                    <div className="pl-8 pt-1">
                      <MessageActionButtons
                        messageId={msg.id}
                        content={msg.text}
                        isLatest={idx === messages.length - 1}
                        onRegenerate={() => {
                          const lastUser = [...messages].reverse().find(m => m.sender === 'user');
                          if (lastUser) {
                            setMessages(prev => prev.filter(m => m.id !== msg.id));
                            handleSendMessage(lastUser.text);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div
                  style={{ backgroundColor: headerBg, color: headerFg }}
                  className="w-6 h-6 rounded-full text-[10px] flex items-center justify-center shrink-0"
                >
                  {formData.avatar || '🤖'}
                </div>
                <div className="bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-zinc-500 shadow-2xs flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce delay-100"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce delay-200"></span>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Quick Question Chips */}
          <div className="p-2 bg-white border-t border-zinc-100 space-y-1 shrink-0">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              Click to test citations & tone:
            </p>
            <div className="flex flex-wrap gap-1">
              {starterQuestions.slice(0, 3).map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="text-[10px] font-semibold text-zinc-700 hover:text-black bg-zinc-100 hover:bg-zinc-200/80 px-2 py-1 rounded-lg transition-colors cursor-pointer text-left truncate max-w-full"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Box */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2 bg-white border-t border-zinc-100 flex items-center gap-1.5 shrink-0"
          >
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 text-xs bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-zinc-700 focus:bg-white text-zinc-900 placeholder-zinc-400 font-medium"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              style={{
                backgroundColor: headerBg,
                color: headerFg,
              }}
              className="p-2 rounded-xl transition-opacity disabled:opacity-30 cursor-pointer shrink-0 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
