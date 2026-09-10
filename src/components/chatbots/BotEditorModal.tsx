import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chatbot, BotTone, BotModel, ChannelType, ChatbotVersion } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';
import { X, Save, Palette, Bot, Sparkles, MessageSquare, Shield, Check, Send, Globe, Trash2, AlertCircle, Lock, Plus, ShieldCheck, ShieldAlert, Smartphone, Instagram, Mail, Layout, ExternalLink, History, RotateCcw, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import { SecurityService } from '../../services/securityService';
import { MotionButton } from '../common/MotionButton';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { GEMINI_CONFIG } from '../../config/models';
import { BOT_TEMPLATES, BotTemplate } from '../../data/botTemplates';
import {
  HEX_COLOR_REGEX,
  isValidHexColor,
  evaluateColorContrast,
  getAccessibleTextColor,
  evaluatePairContrast,
  BRAND_PALETTE_PRESETS,
  BrandPalettePreset,
} from '../../lib/colorUtils';
import { TONE_PRESETS, getTonePreset } from '../../data/tonePresets';
import { LiveBotPreviewCard } from './LiveBotPreviewCard';

interface BotEditorModalProps {
  bot: Partial<Chatbot> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBot: Partial<Chatbot>) => Promise<any> | void;
  onDelete?: (botId: string) => void;
}

const getInitialBotFormData = (bot?: Partial<Chatbot> | null): Partial<Chatbot> => {
  const defaultDomain = bot?.websiteUrl ? SecurityService.normalizeDomain(bot.websiteUrl) : '';
  const initialAllowed = Array.isArray(bot?.allowedDomains) && bot.allowedDomains.length > 0
    ? bot.allowedDomains
    : (defaultDomain ? [defaultDomain] : []);

  return {
    name: bot?.name || 'New AI Support Assistant',
    description: bot?.description || 'Handles customer inquiries and troubleshooting.',
    botType: bot?.botType || 'support',
    websiteUrl: bot?.websiteUrl || 'https://example.com',
    allowedDomains: initialAllowed,
    domainLockEnabled: bot?.domainLockEnabled ?? true,
    systemInstruction: bot?.systemInstruction || 'You are a helpful customer support representative. Answer accurately using knowledge base context.',
    tone: bot?.tone || 'Friendly',
    primaryColor: bot?.primaryColor || '#4F46E5',
    textColor: bot?.textColor || '#FFFFFF',
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
  };
};

export const BotEditorModal: React.FC<BotEditorModalProps> = ({
  bot,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useClickOutside(modalRef, () => {
    if (isOpen && !showDeleteConfirm) onClose();
  });

  useFocusTrap(modalRef, {
    isOpen: isOpen && !showDeleteConfirm,
    onClose,
    closeOnEsc: true,
  });

  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'security' | 'leads' | 'versions'>('general');
  const [formData, setFormData] = useState<Partial<Chatbot>>(() => getInitialBotFormData(bot));

  const currentPrimaryColor = formData.primaryColor?.trim() || '#4F46E5';
  const currentTextColor = formData.textColor?.trim() || '#FFFFFF';
  const isPrimaryValid = isValidHexColor(currentPrimaryColor);
  const isTextValid = isValidHexColor(currentTextColor);
  const isColorValid = isPrimaryValid && isTextValid;
  const contrastAssessment = useMemo(() => evaluateColorContrast(currentPrimaryColor), [currentPrimaryColor]);
  const pairContrast = useMemo(() => evaluatePairContrast(currentPrimaryColor, currentTextColor), [currentPrimaryColor, currentTextColor]);
  const accessibleTextColor = useMemo(() => getAccessibleTextColor(currentPrimaryColor), [currentPrimaryColor]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');

  // Version History State
  const [versions, setVersions] = useState<ChatbotVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [versionSuccessMessage, setVersionSuccessMessage] = useState<string | null>(null);
  const [expandedPromptVersionId, setExpandedPromptVersionId] = useState<string | null>(null);

  const fetchVersions = async () => {
    if (!bot?.id) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/chatbots/${bot.id}/versions`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.versions)) {
        setVersions(data.versions);
      }
    } catch (err) {
      console.error('Failed to load bot versions:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!bot?.id) return;
    setRestoringVersionId(versionId);
    setVersionSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/chatbots/${bot.id}/versions/${versionId}/restore`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.chatbot) {
        const restored = data.chatbot;
        setFormData(prev => ({
          ...prev,
          ...restored,
        }));
        onSave(restored);
        setVersionSuccessMessage('Version restored successfully! A rollback snapshot was created.');
        await fetchVersions();
      } else {
        setErrorMessage(data.error || 'Failed to restore version');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to restore version');
    } finally {
      setRestoringVersionId(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setVersionSuccessMessage(null);
      setNewDomainInput('');
      setFormData(getInitialBotFormData(bot));
      setActiveTab('general');

      if (bot?.id) {
        fetchVersions();
      } else {
        setVersions([]);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage(null);

    const botName = formData.name?.trim();
    if (!botName) {
      setErrorMessage('Assistant Name is required.');
      setActiveTab('general');
      return;
    }

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

    // Validate hex color input with regex ^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$
    const color = formData.primaryColor?.trim() || '#4F46E5';
    if (!HEX_COLOR_REGEX.test(color)) {
      setErrorMessage('Chatbot Accent Color must be a valid 3 or 6-digit hex code matching ^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$ (e.g., #4F46E5 or #000000).');
      setActiveTab('appearance');
      return;
    }

    const txtColor = formData.textColor?.trim() || '#FFFFFF';
    if (!HEX_COLOR_REGEX.test(txtColor)) {
      setErrorMessage('Chatbot Text Color must be a valid 3 or 6-digit hex code matching ^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$ (e.g., #FFFFFF or #09090B).');
      setActiveTab('appearance');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        name: botName,
        websiteUrl: url,
        allowedDomains: mergedDomains,
        primaryColor: color,
        textColor: txtColor,
      });
      onClose();
    } catch (err: any) {
      console.error('Save bot error in modal:', err);
      setErrorMessage(err.message || 'Failed to save chatbot. Please check the form and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tones: BotTone[] = ['Friendly', 'Professional', 'Concise', 'Technical', 'Empathetic'];
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="bot-editor-modal-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-white rounded-3xl shadow-2xl max-w-5xl xl:max-w-6xl w-full border border-zinc-200 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto relative z-10 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between bg-black text-white shrink-0">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: formData.primaryColor || '#4F46E5' }}
                  className="w-10 h-10 rounded-xl text-xl flex items-center justify-center text-white shadow-md border border-white/20 shrink-0"
                >
                  {formData.avatar}
                </div>
                <div>
                  <h2 id="bot-editor-modal-title" className="text-base sm:text-lg font-extrabold text-white font-heading">
                    {bot?.id ? `Configure ${formData.name}` : 'Create New AI Chatbot'}
                  </h2>
                  <p className="text-[11px] sm:text-xs text-zinc-300 font-medium">Customize AI persona, real-time tone, brand palette & live widget</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close chatbot editor"
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer shrink-0"
              >
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
              {bot?.id && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('versions');
                    fetchVersions();
                  }}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'versions' ? 'border-black text-black bg-white shadow-xs' : 'border-transparent text-zinc-500 hover:text-black'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-amber-600" />
                  <span>Version History</span>
                  {versions.length > 0 && (
                    <span className="text-[10px] bg-zinc-200 text-zinc-800 font-extrabold px-1.5 py-0.2 rounded-full">
                      {versions.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Modal Body: 2-Column Side-by-Side on Desktop */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 lg:max-w-[58%] xl:max-w-[60%] border-r-0 lg:border-r border-zinc-200 flex flex-col justify-between">
                <div className="space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {versionSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{versionSuccessMessage}</span>
            </div>
          )}

          {activeTab === 'general' && (
            <>
              {/* Starter Templates Picker */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 font-heading">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Quick Starter Templates
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">Click to prefill AI persona & rules</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BOT_TEMPLATES.map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          name: tmpl.name,
                          description: tmpl.description,
                          systemInstruction: tmpl.systemPrompt,
                          tone: (tmpl.tone.charAt(0).toUpperCase() + tmpl.tone.slice(1)) as BotTone,
                          avatar: tmpl.avatar,
                          primaryColor: tmpl.primaryColor,
                          greetingMessage: tmpl.greetingMessage,
                          fallbackMessage: tmpl.fallbackMessage,
                          suggestedQuestions: tmpl.starterQuestions,
                          model: tmpl.model as BotModel,
                        }));
                        setVersionSuccessMessage(`Loaded "${tmpl.name}" template configuration!`);
                        setTimeout(() => setVersionSuccessMessage(null), 3000);
                      }}
                      className="p-2.5 bg-white border border-zinc-200 hover:border-zinc-900 rounded-xl text-left transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-base">{tmpl.avatar}</span>
                        <span className="text-[11px] font-bold text-zinc-900 group-hover:text-black truncate font-heading">
                          {tmpl.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 block">
                        {tmpl.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Chatbot Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
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
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                  placeholder="Brief summary of what this bot handles"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">System Instructions / AI Rules</label>
                <textarea
                  value={formData.systemInstruction || ''}
                  onChange={e => setFormData({ ...formData, systemInstruction: e.target.value })}
                  rows={4}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-mono text-zinc-800"
                  placeholder="Define role, response formatting, and rules..."
                />
              </div>

              {/* Interactive Tone & Personality Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold text-zinc-900 font-heading">
                    Tone & Personality
                  </label>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    5 Adaptive Personas
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium mb-3">
                  Select a tone below to preview live speech patterns and sample responses in real time.
                </p>

                <div className="space-y-2">
                  {TONE_PRESETS.map(tp => {
                    const isSelected = (formData.tone || 'Friendly').toLowerCase() === tp.tone.toLowerCase();
                    return (
                      <button
                        key={tp.tone}
                        type="button"
                        onClick={() => setFormData({ ...formData, tone: tp.tone })}
                        className={`w-full p-3 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'border-black bg-zinc-50/80 ring-2 ring-black/10 shadow-xs'
                            : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{tp.icon}</span>
                            <span className="text-xs font-bold text-zinc-900 font-heading">{tp.label}</span>
                            <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600'
                            }`}>
                              {tp.badge}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </span>
                          )}
                        </div>

                        {/* Sample Reply Snippet Quote */}
                        <div className={`p-2.5 rounded-xl text-[11px] leading-relaxed border transition-colors ${
                          isSelected
                            ? 'bg-white border-zinc-200 text-zinc-900 font-medium shadow-2xs'
                            : 'bg-zinc-50/80 border-zinc-100 text-zinc-600'
                        }`}>
                          <span className="text-[10px] font-bold text-zinc-400 block mb-0.5">
                            Sample Response to "When will I get my refund?":
                          </span>
                          <span className="italic">"{tp.sampleReply}"</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Engine Model Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">AI Engine Model</label>
                <select
                  value={formData.model || 'gemini-3.7-flash'}
                  onChange={e => setFormData({ ...formData, model: e.target.value as BotModel })}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium bg-white"
                >
                  <option value={GEMINI_CONFIG.flash.id}>{GEMINI_CONFIG.flash.name} ({GEMINI_CONFIG.flash.description})</option>
                  <option value={GEMINI_CONFIG.pro.id}>{GEMINI_CONFIG.pro.name} ({GEMINI_CONFIG.pro.description})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Fallback Message</label>
                <input
                  type="text"
                  value={formData.fallbackMessage || ''}
                  onChange={e => setFormData({ ...formData, fallbackMessage: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                />
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-extrabold text-black">
                    Curated Brand Palette Presets
                  </label>
                  <span className="text-[11px] font-semibold text-zinc-500">8 Modern Presets</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium mb-3">
                  Select a pre-tuned, high-contrast palette or customize your exact brand hex values below.
                </p>

                {/* 8 Curated Brand Palette Presets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {BRAND_PALETTE_PRESETS.map(p => {
                    const isSelected =
                      formData.primaryColor?.toLowerCase() === p.primaryColor.toLowerCase() &&
                      formData.textColor?.toLowerCase() === p.textColor.toLowerCase();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            primaryColor: p.primaryColor,
                            textColor: p.textColor,
                          })
                        }
                        className={`group relative p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-black ring-2 ring-black/20 bg-zinc-50 shadow-xs'
                            : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{ backgroundColor: p.primaryColor }}
                              className="w-4 h-4 rounded-md shrink-0 border border-black/10 shadow-2xs"
                            />
                            <span
                              style={{ backgroundColor: p.textColor, color: p.primaryColor }}
                              className="w-4 h-4 rounded-md shrink-0 border border-black/10 text-[9px] font-bold flex items-center justify-center shadow-2xs"
                            >
                              Aa
                            </span>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-black shrink-0" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-900 leading-tight">{p.name}</p>
                          <p className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">{p.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Hex Code Entry with Regex Validation & Live Contrast */}
                <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/90 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Primary Color Picker */}
                    <div>
                      <label className="text-xs font-bold text-zinc-800 block mb-1.5">Primary Accent Color:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={isPrimaryValid ? currentPrimaryColor : '#4F46E5'}
                          onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                          className="w-9 h-9 rounded-xl cursor-pointer p-0 border border-zinc-300 shrink-0 shadow-xs"
                        />
                        <input
                          type="text"
                          value={formData.primaryColor || ''}
                          onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                          className={`w-full px-3 py-2 text-xs font-mono font-bold border rounded-xl bg-white transition-colors ${
                            !isPrimaryValid
                              ? 'border-red-400 text-red-950 bg-red-50/20 focus:ring-2 focus:ring-red-200'
                              : 'border-zinc-200 focus:ring-2 focus:ring-black'
                          }`}
                          placeholder="#4F46E5"
                        />
                      </div>
                    </div>

                    {/* Text Color Picker */}
                    <div>
                      <label className="text-xs font-bold text-zinc-800 block mb-1.5">Text & Header Color:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={isTextValid ? currentTextColor : '#FFFFFF'}
                          onChange={e => setFormData({ ...formData, textColor: e.target.value })}
                          className="w-9 h-9 rounded-xl cursor-pointer p-0 border border-zinc-300 shrink-0 shadow-xs"
                        />
                        <input
                          type="text"
                          value={formData.textColor || ''}
                          onChange={e => setFormData({ ...formData, textColor: e.target.value })}
                          className={`w-full px-3 py-2 text-xs font-mono font-bold border rounded-xl bg-white transition-colors ${
                            !isTextValid
                              ? 'border-red-400 text-red-950 bg-red-50/20 focus:ring-2 focus:ring-red-200'
                              : 'border-zinc-200 focus:ring-2 focus:ring-black'
                          }`}
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hex Regex Validation Alert */}
                  {(!isPrimaryValid || !isTextValid) && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Invalid hex color format. Both colors must match regex ^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$ (e.g., #4F46E5 or #FFF).</span>
                    </div>
                  )}

                  {/* Real-Time WCAG 2.1 Contrast Checker Card */}
                  {isColorValid && (
                    <div className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5 font-heading">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          Real-Time Contrast Checker (WCAG 2.1)
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                              pairContrast.passesAAA
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : pairContrast.passesAA
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-red-100 text-red-900 border-red-300'
                            }`}
                          >
                            {pairContrast.passesAA ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-700" />
                                {pairContrast.passesAAA ? 'WCAG AAA Compliant' : 'WCAG AA Compliant'} ({pairContrast.ratio}:1)
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 text-red-700" />
                                Text may be hard to read on this background ({pairContrast.ratio}:1)
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Live Widget Element Mini Preview */}
                      <div className="p-2.5 rounded-xl border border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/50">
                        <div className="flex items-center gap-2.5">
                          <div
                            style={{ backgroundColor: currentPrimaryColor, color: currentTextColor }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <span>{formData.avatar || '🤖'}</span>
                            <span>{formData.name || 'AI Assistant'}</span>
                          </div>
                          <span className="text-[11px] text-zinc-500 font-medium hidden sm:inline">
                            Ratio: <strong className="text-zinc-800 font-mono">{pairContrast.ratio}:1</strong>
                          </span>
                        </div>

                        {!pairContrast.passesAA && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                textColor: pairContrast.recommendedTextColor,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            Fix Contrast
                          </button>
                        )}
                      </div>

                      {/* Low Contrast Guardrail Badge & Automatic Fix Option */}
                      {!pairContrast.passesAA && (
                        <div className="p-2.5 bg-red-50 border border-red-200/90 rounded-xl text-xs text-red-950 flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                              <p className="font-extrabold text-red-950">
                                Text may be hard to read on this background ({pairContrast.ratio}:1)
                              </p>
                              <p className="mt-0.5 text-red-900 font-medium">
                                WCAG 2.1 requires a minimum contrast ratio of 4.5:1 for body text and navigation elements.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                textColor: pairContrast.recommendedTextColor,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-bold bg-black hover:bg-zinc-800 text-white rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <Wand2 className="w-3 h-3" />
                            Fix Contrast
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
                  value={formData.greetingMessage || ''}
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-zinc-500 font-bold">{formData.primaryColor}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                      accessibleTextColor === '#ffffff' ? 'bg-zinc-900 text-white' : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}>
                      {accessibleTextColor === '#ffffff' ? 'Light Text' : 'Dark Text (Guardrail Active)'}
                    </span>
                  </div>
                </div>

                {/* Widget Header Navigation bar with Accessible Contrast */}
                <div
                  style={{
                    backgroundColor: isPrimaryValid ? currentPrimaryColor : '#4F46E5',
                    color: isTextValid ? currentTextColor : accessibleTextColor,
                  }}
                  className="p-4 flex items-center justify-between transition-colors duration-200 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        backgroundColor: (isTextValid ? currentTextColor : accessibleTextColor) === '#ffffff' || (isTextValid ? currentTextColor : accessibleTextColor) === '#FFFFFF' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                        borderColor: (isTextValid ? currentTextColor : accessibleTextColor) === '#ffffff' || (isTextValid ? currentTextColor : accessibleTextColor) === '#FFFFFF' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
                        color: isTextValid ? currentTextColor : accessibleTextColor,
                      }}
                      className="w-8 h-8 rounded-xl text-lg flex items-center justify-center shadow-xs border"
                    >
                      {formData.avatar}
                    </div>
                    <div>
                      <h4 style={{ color: isTextValid ? currentTextColor : accessibleTextColor }} className="font-extrabold text-xs">{formData.name}</h4>
                      <p style={{ color: isTextValid ? currentTextColor : accessibleTextColor, opacity: 0.85 }} className="text-[10px] font-medium">Online • AI Support</p>
                    </div>
                  </div>
                  <X style={{ color: isTextValid ? currentTextColor : accessibleTextColor }} className="w-4 h-4" />
                </div>

                {/* Simulated Chat */}
                <div className="p-4 bg-zinc-50 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <div
                      style={{
                        backgroundColor: isPrimaryValid ? currentPrimaryColor : '#4F46E5',
                        color: isTextValid ? currentTextColor : accessibleTextColor,
                      }}
                      className="w-6 h-6 rounded-full text-[10px] flex items-center justify-center shrink-0 shadow-xs"
                    >
                      {formData.avatar}
                    </div>
                    <div className="bg-white border border-zinc-200 rounded-2xl px-3 py-2 text-zinc-800 max-w-[80%] shadow-2xs font-medium">
                      {formData.greetingMessage}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div
                      style={{
                        backgroundColor: isPrimaryValid ? currentPrimaryColor : '#4F46E5',
                        color: isTextValid ? currentTextColor : accessibleTextColor,
                      }}
                      className="rounded-2xl px-3.5 py-2 max-w-[80%] shadow-xs font-medium"
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
                          aria-label={`Remove authorized domain ${domain}`}
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
                  checked={formData.collectLeadEmail !== false}
                  onChange={e => setFormData({ ...formData, collectLeadEmail: e.target.checked })}
                  className="w-5 h-5 text-black rounded focus:ring-black cursor-pointer"
                />
              </div>

              {formData.collectLeadEmail && (
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1 font-heading">Lead Banner Title</label>
                  <input
                    type="text"
                    value={formData.leadTitle || ''}
                    onChange={e => setFormData({ ...formData, leadTitle: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium font-body"
                  />
                </div>
              )}
            </>
          )}

          {/* Version History Tab */}
          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <History className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-950 font-heading">Configuration Snapshots</h4>
                    <p className="text-[11px] text-amber-800/90 font-medium">
                      Each save automatically preserves a snapshot. The last 20 versions are archived.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={fetchVersions}
                  disabled={loadingVersions}
                  className="p-1.5 text-amber-700 hover:text-amber-950 hover:bg-amber-100/80 rounded-xl transition cursor-pointer disabled:opacity-50"
                  title="Refresh versions"
                  aria-label="Refresh version history"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingVersions ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loadingVersions && versions.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-zinc-400" />
                  <p className="text-xs font-medium">Loading version history...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 space-y-1">
                  <History className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                  <p className="text-xs font-bold text-zinc-700">No previous versions yet</p>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    Saving changes to this chatbot will automatically archive full snapshots here that you can roll back to at any time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {versions.map((ver, idx) => {
                    const isCurrent = idx === 0;
                    const isExpanded = expandedPromptVersionId === ver.id;
                    const isRestoring = restoringVersionId === ver.id;

                    return (
                      <div
                        key={ver.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-zinc-50/90 border-zinc-300 ring-1 ring-zinc-200'
                            : 'bg-white border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-zinc-900 font-heading">
                                {ver.snapshot.name || 'Chatbot'}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-black text-white px-2 py-0.5 rounded-md">
                                  Latest Save
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-md">
                                {ver.id.slice(0, 14)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
                              <span>{new Date(ver.createdAt).toLocaleString()}</span>
                              <span>•</span>
                              <span>By <strong className="text-zinc-700">{ver.createdBy}</strong></span>
                            </div>
                          </div>

                          <MotionButton
                            type="button"
                            variant="secondary"
                            size="xs"
                            disabled={isRestoring || restoringVersionId !== null}
                            onClick={() => handleRestoreVersion(ver.id)}
                            leftIcon={
                              isRestoring ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-zinc-600" />
                              ) : (
                                <RotateCcw className="w-3 h-3 text-indigo-600" />
                              )
                            }
                          >
                            {isRestoring ? 'Restoring...' : 'Restore Version'}
                          </MotionButton>
                        </div>

                        {/* Snapshot Specs Pill Row */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-zinc-100 text-[11px]">
                          <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-medium">
                            <span>Tone:</span>
                            <strong className="text-zinc-900">{ver.snapshot.tone || 'Friendly'}</strong>
                          </span>
                          <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md font-medium">
                            <span>Model:</span>
                            <strong className="text-zinc-900 font-mono">{ver.snapshot.model || 'gemini-3.7-flash'}</strong>
                          </span>
                          {ver.snapshot.allowedDomains && ver.snapshot.allowedDomains.length > 0 && (
                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                              <Shield className="w-3 h-3" />
                              <span>{ver.snapshot.allowedDomains.length} domains</span>
                            </span>
                          )}
                          {ver.snapshot.fallbackMessage && (
                            <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-normal truncate max-w-xs" title={ver.snapshot.fallbackMessage}>
                              <span>Fallback:</span>
                              <span className="truncate italic">"{ver.snapshot.fallbackMessage}"</span>
                            </span>
                          )}
                        </div>

                        {/* Expandable System Instruction Preview */}
                        {ver.snapshot.systemInstruction && (
                          <div className="mt-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setExpandedPromptVersionId(isExpanded ? null : ver.id)}
                              className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 font-bold transition cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  <span>Hide Instructions</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  <span>View Instructions Snapshot</span>
                                </>
                              )}
                            </button>
                            {isExpanded && (
                              <div className="mt-1.5 p-2.5 bg-zinc-100 rounded-xl text-zinc-800 font-mono text-[10px] leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {ver.snapshot.systemInstruction}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

                </div>

                {/* Modal Footer */}
                <div className="pt-4 mt-6 border-t border-zinc-100 flex items-center justify-between gap-3 shrink-0">
                  <div>
                    {bot?.id && onDelete && (
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
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <MotionButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSubmitting}
                      onClick={onClose}
                    >
                      Cancel
                    </MotionButton>
                    <MotionButton
                      type="submit"
                      variant="primary"
                      size="md"
                      shimmer
                      disabled={isSubmitting}
                      isLoading={isSubmitting}
                      leftIcon={<Save className="w-4 h-4 text-white" />}
                    >
                      {isSubmitting ? 'Saving Chatbot...' : (bot?.id ? 'Save Changes' : 'Create Chatbot')}
                    </MotionButton>
                  </div>
                </div>
              </form>

              {/* Right Column: Anchored Live Interactive Preview Card */}
              <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] bg-zinc-50/60 p-5 sm:p-6 flex-col overflow-y-auto shrink-0">
                <LiveBotPreviewCard
                  formData={formData}
                  onUpdateTextColor={color => setFormData(prev => ({ ...prev, textColor: color }))}
                  onSelectTone={tone => setFormData(prev => ({ ...prev, tone }))}
                />
              </div>
            </div>
          </motion.div>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            title={`Delete "${bot?.name || formData.name || 'Chatbot'}"?`}
            description="This will permanently delete this AI chatbot and unlink all associated conversations, messages, analytics, and knowledge embeddings. This action cannot be undone."
            itemName={bot?.name || formData.name || ''}
            confirmButtonText="Delete Chatbot"
            onConfirm={async () => {
              if (bot?.id && onDelete) {
                onDelete(bot.id);
              }
              setShowDeleteConfirm(false);
              onClose();
            }}
            onClose={() => setShowDeleteConfirm(false)}
          />
        </div>
      )}
    </AnimatePresence>
  );
};
