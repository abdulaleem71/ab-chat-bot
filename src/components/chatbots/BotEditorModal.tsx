import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chatbot, BotTone, BotModel, ChannelType, BotType } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { X, Save, Palette, Bot, Sparkles, MessageSquare, Shield, Check, Send, Globe, Trash2, AlertCircle, Lock, Plus, ShieldCheck, ShieldAlert, Smartphone, Instagram, Mail, Layout, ShoppingBag, ExternalLink } from 'lucide-react';
import { SecurityService } from '../../services/securityService';
import { MotionButton } from '../common/MotionButton';
import { GEMINI_CONFIG } from '../../config/models';

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

  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'security' | 'leads'>('general');
  const [formData, setFormData] = useState<Partial<Chatbot>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [storeIntegrations, setStoreIntegrations] = useState<{ shopify: boolean; woocommerce: boolean }>({
    shopify: false,
    woocommerce: false,
  });

  useEffect(() => {
    if (isOpen) {
      // Check store integrations
      fetch('/api/integrations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.integrations)) {
            const hasShopify = data.integrations.some((i: any) => i.id === 'shopify' && i.isConnected);
            const hasWoo = data.integrations.some((i: any) => i.id === 'woocommerce' && i.isConnected);
            setStoreIntegrations({ shopify: hasShopify, woocommerce: hasWoo });
          }
        })
        .catch(() => {});

      setErrorMessage(null);
      setNewDomainInput('');
      const defaultDomain = bot?.websiteUrl ? SecurityService.normalizeDomain(bot.websiteUrl) : '';
      const initialAllowed = Array.isArray(bot?.allowedDomains) && bot.allowedDomains.length > 0
        ? bot.allowedDomains
        : (defaultDomain ? [defaultDomain] : []);

      setFormData({
        name: bot?.name || 'New AI Support Assistant',
        description: bot?.description || 'Handles customer inquiries and troubleshooting.',
        botType: bot?.botType || 'support',
        websiteUrl: bot?.websiteUrl || 'https://example.com',
        allowedDomains: initialAllowed,
        domainLockEnabled: bot?.domainLockEnabled ?? true,
        systemInstruction: bot?.systemInstruction || 'You are a helpful customer support representative. Answer accurately using knowledge base context.',
        tone: bot?.tone || 'Friendly',
        primaryColor: bot?.primaryColor || '#4F46E5',
        avatar: bot?.avatar || '🤖',
        greetingMessage: bot?.greetingMessage || '👋 Hi there! How can I help you today?',
        suggestedQuestions: bot?.suggestedQuestions || ['How do I reset my password?', 'What are your support hours?'],
        model: bot?.model || 'gemini-3.7-flash',
        fallbackMessage: bot?.fallbackMessage || "I don't have information on that yet. Let me connect you with a live specialist.",
        collectLeadEmail: bot?.collectLeadEmail ?? true,
        leadTitle: bot?.leadTitle || 'Leave your email to stay connected',
        humanOperatorOnline: bot?.humanOperatorOnline ?? true,
        channel: bot?.channel || 'website_widget',
        status: bot?.status || 'active',
      });
      setActiveTab('general');
    }
  }, [bot, isOpen]);

  const hasStoreConnected = storeIntegrations.shopify || storeIntegrations.woocommerce;

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

  const handleAddDomain = () => {
    if (!newDomainInput.trim()) return;
    const clean = SecurityService.normalizeDomain(newDomainInput.trim());
    if (!clean) return;
    const current = formData.allowedDomains || [];
    if (!current.includes(clean)) {
      setFormData({ ...formData, allowedDomains: [...current, clean] });
    }
    setNewDomainInput('');
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    const current = formData.allowedDomains || [];
    setFormData({ ...formData, allowedDomains: current.filter(d => d !== domainToRemove) });
  };

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

    // Ensure website domain is included in allowedDomains
    const cleanSiteDomain = SecurityService.normalizeDomain(url);
    const existingDomains = formData.allowedDomains || [];
    const mergedDomains = cleanSiteDomain && !existingDomains.includes(cleanSiteDomain)
      ? [cleanSiteDomain, ...existingDomains]
      : existingDomains;

    onSave({ ...formData, websiteUrl: url, allowedDomains: mergedDomains });
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          {/* Modal Dialog */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-zinc-200 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto relative z-10 overflow-hidden"
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
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${activeTab === 'security' ? 'border-black text-black bg-white shadow-xs' : 'border-transparent text-zinc-500 hover:text-black'
              }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Domain Security & Lock</span>
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
                <label className="block text-xs font-bold text-zinc-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-zinc-900" />
                    Bot Type / Capability Focus
                  </span>
                  {!hasStoreConnected && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold flex items-center gap-1">
                      <span>Store integration required for Commerce</span>
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, botType: 'support' })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      (formData.botType || 'support') === 'support'
                        ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950 shadow-xs'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50/80 text-zinc-600'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-950 flex items-center gap-1.5">
                        Support Assistant
                        {(formData.botType || 'support') === 'support' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">
                        Knowledge base RAG, FAQ resolution, lead capture, and support ticketing.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={!hasStoreConnected}
                    onClick={() => {
                      if (hasStoreConnected) {
                        setFormData({ ...formData, botType: 'commerce' });
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex items-start gap-3 ${
                      formData.botType === 'commerce'
                        ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950 shadow-xs'
                        : !hasStoreConnected
                        ? 'border-zinc-200 bg-zinc-50/70 text-zinc-400 cursor-not-allowed opacity-80'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50/80 text-zinc-600 cursor-pointer'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        formData.botType === 'commerce'
                          ? 'bg-emerald-50 text-emerald-600'
                          : hasStoreConnected
                          ? 'bg-zinc-100 text-zinc-600'
                          : 'bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span className={formData.botType === 'commerce' ? 'text-zinc-950' : 'text-zinc-700'}>
                          Commerce & Catalog
                        </span>
                        {formData.botType === 'commerce' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        )}
                        {!hasStoreConnected && <Lock className="w-3 h-3 text-amber-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-tight mt-0.5">
                        Product carousels, live catalog sync, order lookup, and dynamic discount coupons.
                      </p>
                      {!hasStoreConnected && (
                        <p className="text-[10px] text-amber-600 font-semibold mt-1">
                          Connect Shopify or WooCommerce in Integrations tab to enable
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1.5 font-heading">
                  Primary Deployment Channel
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'website_widget', label: 'Website Widget', icon: Layout, desc: 'Web chat bubble' },
                    { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone, desc: 'Meta Business API' },
                    { id: 'instagram_dm', label: 'Instagram DM', icon: Instagram, desc: 'Direct Messages' },
                    { id: 'email', label: 'Email Support', icon: Mail, desc: 'Inbound ticketing' },
                  ].map(ch => {
                    const IconComponent = ch.icon;
                    const isSelected = (formData.channel || 'website_widget') === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, channel: ch.id as ChannelType })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950 shadow-xs'
                            : 'border-zinc-200 bg-white hover:bg-zinc-50/80 text-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-zinc-950' : 'text-zinc-500'}`} />
                          <span className={`text-[11px] font-extrabold truncate ${isSelected ? 'text-zinc-950' : 'text-zinc-800'}`}>
                            {ch.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-tight truncate">{ch.desc}</p>
                      </button>
                    );
                  })}
                </div>
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
                    <option value={GEMINI_CONFIG.flash.id}>{GEMINI_CONFIG.flash.name} ({GEMINI_CONFIG.flash.description})</option>
                    <option value={GEMINI_CONFIG.pro.id}>{GEMINI_CONFIG.pro.name} ({GEMINI_CONFIG.pro.description})</option>
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

          {activeTab === 'security' && (
            <>
              {/* Domain Lock Enforcement Switch */}
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-black">Enforce Server-Side Domain Lock</h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Strictly block chatbot loading on unauthorized domains (returns 403 Forbidden).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.domainLockEnabled !== false}
                  onChange={e => setFormData({ ...formData, domainLockEnabled: e.target.checked })}
                  className="w-5 h-5 text-black rounded focus:ring-black cursor-pointer"
                />
              </div>

              {/* Primary Bound Website */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h4 className="text-xs font-bold text-indigo-950">Primary Website Domain</h4>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed font-mono font-medium">
                  {formData.websiteUrl ? SecurityService.normalizeDomain(formData.websiteUrl) : 'None configured yet'}
                </p>
                <p className="text-[10px] text-indigo-700">
                  Automatically extracted from your website URL. This domain is always authorized.
                </p>
              </div>

              {/* Allowed Domains List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-800">
                    Authorized Domains & Subdomains Whitelist
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Supports wildcards (e.g. *.example.com)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newDomainInput}
                    onChange={e => setNewDomainInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
                    placeholder="e.g. app.mywebsite.com, staging.mywebsite.com"
                    className="flex-1 px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-mono"
                  />
                  <MotionButton
                    type="button"
                    variant="dark"
                    size="sm"
                    shimmer
                    leftIcon={<Plus className="w-3.5 h-3.5 text-white" />}
                    onClick={handleAddDomain}
                    disabled={!newDomainInput.trim()}
                  >
                    Add Domain
                  </MotionButton>
                </div>

                {/* Whitelist Badges */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(formData.allowedDomains || []).length === 0 ? (
                    <p className="text-[11px] text-zinc-400 italic font-body">No additional domains configured. Primary website domain is used.</p>
                  ) : (
                    formData.allowedDomains?.map(domain => (
                      <div
                        key={domain}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 font-medium"
                      >
                        <Lock className="w-3 h-3 text-indigo-600" />
                        <span>{domain}</span>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveDomain(domain)}
                          className="p-0.5 text-zinc-400 hover:text-red-600 rounded-md transition cursor-pointer ml-1"
                          title="Remove domain"
                        >
                          <X className="w-3 h-3" />
                        </motion.button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Security Mechanism Notice */}
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-start gap-2.5 text-zinc-600 text-[11px] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="font-body">
                  <strong>Zero-Risk Revenue Protection:</strong> Embed scripts generate a cryptographically signed HMAC token for each domain. If someone copies your script and pastes it into another domain, the server rejects requests with HTTP 403 Forbidden.
                </p>
              </div>
            </>
          )}

          {activeTab === 'leads' && (
            <>
              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-200">
                <div>
                  <h4 className="text-xs font-extrabold text-black font-heading">Enable Lead Capture Gate</h4>
                  <p className="text-[11px] text-zinc-500 font-medium font-body">Ask visitors for their email before initiating chat</p>
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
                  <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">Lead Banner Title</label>
                  <input
                    type="text"
                    value={formData.leadTitle}
                    onChange={e => setFormData({ ...formData, leadTitle: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium font-body"
                  />
                </div>
              )}
            </>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
            <div>
              {bot?.id && onDelete && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2 bg-red-50 p-1.5 rounded-xl border border-red-200">
                    <span className="text-[11px] font-bold text-red-800 pl-1">Confirm delete?</span>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(bot.id!);
                        setShowDeleteConfirm(false);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-medium transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <MotionButton
                    type="button"
                    variant="danger"
                    size="sm"
                    shimmer
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-white" />}
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Chatbot
                  </MotionButton>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <MotionButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </MotionButton>
              <MotionButton
                type="submit"
                variant="primary"
                size="md"
                shimmer
                leftIcon={<Save className="w-4 h-4 text-white" />}
              >
                Save Chatbot Settings
              </MotionButton>
            </div>
          </div>
        </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
