import React, { useState, useRef, useEffect } from 'react';
import { Chatbot, BotTone, BotModel } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { X, Save, Palette, Bot, Sparkles, MessageSquare, Shield, Check, Send, Globe, Trash2, AlertCircle } from 'lucide-react';

interface BotEditorModalProps {
  bot: Partial<Chatbot> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBot: Partial<Chatbot>) => void;
  onDelete?: (botId: string) => void;
}

export const BotEditorModal: React.FC<BotEditorModalProps> = ({
  bot,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, () => {
    if (isOpen) onClose();
  });

  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'leads'>('general');
  const [formData, setFormData] = useState<Partial<Chatbot>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setFormData({
        name: bot?.name || 'New AI Support Assistant',
        description: bot?.description || 'Handles customer inquiries and troubleshooting.',
        websiteUrl: bot?.websiteUrl || 'https://example.com',
        systemInstruction: bot?.systemInstruction || 'You are a helpful customer support representative. Answer accurately using knowledge base context.',
        tone: bot?.tone || 'Friendly',
        primaryColor: bot?.primaryColor || '#4F46E5',
        avatar: bot?.avatar || '🤖',
        greetingMessage: bot?.greetingMessage || '👋 Hi there! How can I help you today?',
        suggestedQuestions: bot?.suggestedQuestions || ['How do I reset my password?', 'What are your support hours?'],
        model: bot?.model || 'gemini-3.6-flash',
        fallbackMessage: bot?.fallbackMessage || "I don't have information on that yet. Let me connect you with a live specialist.",
        collectLeadEmail: bot?.collectLeadEmail ?? true,
        leadTitle: bot?.leadTitle || 'Leave your email to stay connected',
        humanOperatorOnline: bot?.humanOperatorOnline ?? true,
        status: bot?.status || 'active',
      });
      setActiveTab('general');
    }
  }, [bot, isOpen]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const url = formData.websiteUrl?.trim();
    if (!url) {
      setErrorMessage('Website URL is mandatory so the chatbot can fetch and use site data.');
      setActiveTab('general');
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setErrorMessage('Website URL must be a valid URL starting with http:// or https://');
      setActiveTab('general');
      return;
    }

    onSave({ ...formData, websiteUrl: url });
    onClose();
  };

  const tones: BotTone[] = ['Friendly', 'Professional', 'Concise', 'Technical', 'Empathetic'];
  const colors = [
    { hex: '#000000', name: 'Black' },
    { hex: '#18181B', name: 'Zinc' },
    { hex: '#4F46E5', name: 'Indigo' },
    { hex: '#2563EB', name: 'Blue' },
    { hex: '#059669', name: 'Emerald' },
    { hex: '#D97706', name: 'Amber' },
    { hex: '#DC2626', name: 'Crimson' },
    { hex: '#7C3AED', name: 'Purple' },
    { hex: '#0891B2', name: 'Cyan' },
  ];
  const avatars = ['🤖', '💼', '📦', '💬', '⚡', '🎧', '✨', '🌟'];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div
        ref={modalRef}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-zinc-200 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto relative overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-100 flex items-center justify-between bg-black text-white shrink-0">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: formData.primaryColor || '#000000' }}
              className="w-10 h-10 rounded-xl text-xl flex items-center justify-center text-white shadow-md border border-white/20 shrink-0"
            >
              {formData.avatar}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {bot?.id ? `Configure ${formData.name}` : 'Create New AI Chatbot'}
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-300 font-medium">Customize AI persona, theme color, navigation & grounding</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-4 sm:px-6 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all duration-150 cursor-pointer ${activeTab === 'general' ? 'border-black text-black bg-white shadow-xs' : 'border-transparent text-zinc-500 hover:text-black'
              }`}
          >
            General & AI Persona
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all duration-150 cursor-pointer ${activeTab === 'appearance' ? 'border-black text-black bg-white shadow-xs' : 'border-transparent text-zinc-500 hover:text-black'
              }`}
          >
            🎨 Color & Navigation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all duration-150 cursor-pointer ${activeTab === 'leads' ? 'border-black text-black bg-white shadow-xs' : 'border-transparent text-zinc-500 hover:text-black'
              }`}
          >
            Lead Capture Gate
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'general' && (
            <>
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Chatbot Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                  placeholder="e.g., Acme Product Assistant"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-zinc-900 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    Website URL (Required for Data Retrieval)
                  </span>
                  <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider">Mandatory</span>
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl || ''}
                  onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                  placeholder="https://example.com or https://company.com/help"
                  required
                />
                <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                  The chatbot will fetch and use this website's actual content/data when generating responses.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Description / Role</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                  placeholder="Brief summary of what this bot handles"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">System Instructions / AI Rules</label>
                <textarea
                  value={formData.systemInstruction}
                  onChange={e => setFormData({ ...formData, systemInstruction: e.target.value })}
                  rows={4}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-mono text-zinc-800"
                  placeholder="Define role, response formatting, and rules..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Tone of Voice</label>
                  <select
                    value={formData.tone}
                    onChange={e => setFormData({ ...formData, tone: e.target.value as BotTone })}
                    className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium bg-white"
                  >
                    {tones.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">AI Engine Model</label>
                  <select
                    value={formData.model}
                    onChange={e => setFormData({ ...formData, model: e.target.value as BotModel })}
                    className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium bg-white"
                  >
                    <option value="gemini-3.6-flash">Gemini 3.6 Flash (Fast Grounded Support)</option>
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Deep Reasoning)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Fallback Message</label>
                <input
                  type="text"
                  value={formData.fallbackMessage}
                  onChange={e => setFormData({ ...formData, fallbackMessage: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                />
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <div>
                <label className="block text-xs font-extrabold text-black mb-1.5">
                  Chatbot Accent & Navigation Color
                </label>
                <p className="text-[11px] text-zinc-500 font-medium mb-3">
                  This color styles the chat widget header, navigation, button states, launcher icon, and message accents.
                </p>

                {/* Color Swatches Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                  {colors.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, primaryColor: c.hex })}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer ${formData.primaryColor?.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-black ring-2 ring-black/20 bg-zinc-100 font-bold'
                          : 'border-zinc-200 hover:border-zinc-300 bg-white'
                        }`}
                    >
                      <span
                        style={{ backgroundColor: c.hex }}
                        className="w-5 h-5 rounded-lg shrink-0 border border-black/10 shadow-xs"
                      />
                      <span className="text-[11px] text-black truncate">{c.name}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Hex Code Entry */}
                <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-200">
                  <label className="text-xs font-bold text-zinc-700 shrink-0">Custom Color Hex:</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={formData.primaryColor || '#000000'}
                      onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer p-0 border border-zinc-300 shrink-0"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-zinc-200 rounded-xl bg-white focus:ring-2 focus:ring-black"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-2">Bot Avatar Icon</label>
                <div className="flex flex-wrap gap-2">
                  {avatars.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: a })}
                      className={`w-10 h-10 text-xl rounded-xl border flex items-center justify-center transition cursor-pointer ${formData.avatar === a ? 'border-black bg-black text-white scale-105 shadow-md' : 'border-zinc-200 hover:bg-zinc-100'
                        }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Welcome Greeting Message</label>
                <input
                  type="text"
                  value={formData.greetingMessage}
                  onChange={e => setFormData({ ...formData, greetingMessage: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                />
              </div>

              {/* Live Widget Header & Navigation Preview */}
              <div className="mt-4 border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-md">
                <div className="p-2.5 bg-zinc-100 border-b border-zinc-200 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-black uppercase tracking-wider">
                    Live Navigation & Chat Widget Color Preview
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 font-bold">{formData.primaryColor}</span>
                </div>

                {/* Widget Header Navigation bar */}
                <div
                  style={{ backgroundColor: formData.primaryColor || '#000000' }}
                  className="p-4 text-white flex items-center justify-between transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/20 text-lg flex items-center justify-center shadow-xs">
                      {formData.avatar}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-white">{formData.name}</h4>
                      <p className="text-[10px] text-white/80 font-medium">Online • AI Support</p>
                    </div>
                  </div>
                  <X className="w-4 h-4 text-white/80" />
                </div>

                {/* Simulated Chat */}
                <div className="p-4 bg-zinc-50 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <div
                      style={{ backgroundColor: formData.primaryColor || '#000000' }}
                      className="w-6 h-6 rounded-full text-white text-[10px] flex items-center justify-center shrink-0"
                    >
                      {formData.avatar}
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-zinc-800 max-w-[80%] shadow-2xs font-medium">
                      {formData.greetingMessage}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div
                      style={{ backgroundColor: formData.primaryColor || '#000000' }}
                      className="text-white rounded-2xl px-3 py-2 max-w-[80%] shadow-xs font-medium"
                    >
                      How do I get started?
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'leads' && (
            <>
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                <div>
                  <h4 className="text-xs font-extrabold text-black">Enable Lead Capture Gate</h4>
                  <p className="text-[11px] text-zinc-500 font-medium">Ask visitors for their email before initiating chat</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.collectLeadEmail}
                  onChange={e => setFormData({ ...formData, collectLeadEmail: e.target.checked })}
                  className="w-5 h-5 text-black rounded focus:ring-black cursor-pointer"
                />
              </div>

              {formData.collectLeadEmail && (
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Lead Banner Title</label>
                  <input
                    type="text"
                    value={formData.leadTitle}
                    onChange={e => setFormData({ ...formData, leadTitle: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                  />
                </div>
              )}
            </>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
            <div>
              {bot?.id && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(bot.id!);
                    onClose();
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete Chatbot</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-extrabold bg-black hover:bg-zinc-800 text-white rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save Chatbot Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
