import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chatbot } from '../../types';
import { Code, Copy, Check, ExternalLink, Globe, Sparkles, Layers, Play, Shield, ShieldCheck, ShieldAlert, Lock, RefreshCw, CheckCircle2, XCircle, X } from 'lucide-react';
import { SecurityService } from '../../services/securityService';
import { MotionButton } from '../common/MotionButton';

interface WidgetEmbedModalProps {
  bot?: Partial<Chatbot> | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerFloatingWidget: () => void;
}

export const WidgetEmbedModal: React.FC<WidgetEmbedModalProps> = ({
  bot,
  isOpen,
  onClose,
  onTriggerFloatingWidget,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'security' | 'wordpress' | 'shopify' | 'webflow' | 'react'>('script');
  
  // Security & Domain states
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [customDomainInput, setCustomDomainInput] = useState<string>('');
  const [testDomainInput, setTestDomainInput] = useState<string>('');
  const [testResult, setTestResult] = useState<{ isAllowed?: boolean; reason?: string; testDomain?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const safeBotName = bot?.name || 'AI Support Assistant';
  const safeBotColor = bot?.primaryColor || '#4F46E5';
  const safeBotAvatar = bot?.avatar || '🤖';
  const safeBotId = bot?.id || 'demo_bot';

  const effectiveDomains = SecurityService.getEffectiveAuthorizedDomains(bot);
  const primaryDomain = effectiveDomains[0] || (bot?.websiteUrl ? SecurityService.normalizeDomain(bot.websiteUrl) : 'example.com');

  useEffect(() => {
    if (isOpen) {
      setSelectedDomain(primaryDomain);
      setTestDomainInput('');
      setTestResult(null);
    }
  }, [isOpen, primaryDomain]);

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

  const appOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentTargetDomain = selectedDomain || primaryDomain;
  const embedData = SecurityService.generateSecureEmbedSnippet(bot, appOrigin, currentTargetDomain);
  const scriptSnippet = embedData.snippet;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(scriptSnippet);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = scriptSnippet;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = scriptSnippet;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    }
  };

  const handleTestDomain = async (domainToTest: string) => {
    if (!domainToTest.trim() || isTesting) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
      const res = await fetch(`/api/chatbots/${safeBotId}/security/test-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ testDomain: domainToTest.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          isAllowed: data.isAllowed,
          reason: data.reason,
          testDomain: data.testDomain,
        });
      } else {
        setTestResult({
          isAllowed: false,
          reason: data.error || 'Diagnostic test failed',
          testDomain: domainToTest,
        });
      }
    } catch (err: any) {
      setTestResult({
        isAllowed: false,
        reason: err.message || 'Connection error',
        testDomain: domainToTest,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto relative z-10"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: safeBotColor }}
              className="w-10 h-10 rounded-2xl text-xl flex items-center justify-center text-white font-bold shadow-xs"
            >
              {safeBotAvatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-zinc-950 font-heading">Embed & Deploy {safeBotName}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Domain Locked
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium font-body">Secure embed code tied cryptographically to your authorized website domain</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-200 bg-white px-6 overflow-x-auto shrink-0 scrollbar-none gap-1">
          {[
            { id: 'script', label: 'HTML & Script Tag' },
            { id: 'security', label: 'Domain Security & Verification', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'wordpress', label: 'WordPress' },
            { id: 'shopify', label: 'Shopify' },
            { id: 'webflow', label: 'Webflow' },
            { id: 'react', label: 'React / Next.js' },
          ].map(t => (
            <motion.button
              key={t.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 font-heading ${
                activeTab === t.id ? 'border-zinc-950 text-zinc-950 font-extrabold' : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Snippet Box with Domain Binding */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold text-zinc-800 font-heading">Secure Embed Code (Locked to Domain)</label>
                <p className="text-[11px] text-zinc-500 font-medium font-body">Includes HMAC-SHA256 signature verified server-side on every request</p>
              </div>
              <MotionButton
                variant={copied ? 'secondary' : 'dark'}
                size="sm"
                shimmer={!copied}
                onClick={handleCopy}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Code'}
              </MotionButton>
            </div>

            <div className="bg-zinc-950 text-zinc-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto relative border border-zinc-800 shadow-inner">
              <code>{scriptSnippet}</code>
            </div>

            <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-500 px-1 font-body">
              <span>Authorized Host: <strong className="text-zinc-900 font-mono">{currentTargetDomain}</strong></span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" /> Server-enforced protection active
              </span>
            </div>
          </div>

          {/* Domain Security Protection Banner */}
          <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-indigo-950 flex items-center gap-1.5 font-heading">
                <span>Theft-Proof Server-Side Domain Protection</span>
                <span className="bg-indigo-200/80 text-indigo-900 text-[10px] px-2 py-0.5 rounded-full font-bold font-mono">Active</span>
              </h4>
              <p className="text-indigo-900 leading-relaxed text-[11px] font-body">
                If someone copies your embed code and pastes it onto another website, our backend server automatically inspects browser Origin & Referer headers and blocks access with <strong>403 Forbidden</strong>. Your AI credits and knowledge base remain 100% secure.
              </p>
            </div>
          </div>

          {/* Security Diagnostic Tab */}
          {activeTab === 'security' && (
            <div className="border border-zinc-200 rounded-2xl p-4 bg-zinc-50 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-900 mb-1 flex items-center gap-1.5 font-heading">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Authorized Domains Whitelist</span>
                </h4>
                <p className="text-[11px] text-zinc-500 mb-2 font-body">The chatbot will only load and respond to visitor inquiries on these domains:</p>
                <div className="flex flex-wrap gap-2">
                  {effectiveDomains.map(d => (
                    <span key={d} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-zinc-200 rounded-xl text-xs font-mono font-semibold text-zinc-800 shadow-2xs">
                      <Lock className="w-3 h-3 text-indigo-600" />
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Diagnostic Domain Test */}
              <div className="pt-3 border-t border-zinc-200">
                <h4 className="text-xs font-bold text-zinc-900 mb-1 font-heading">Live Server Authorization Diagnostic Test</h4>
                <p className="text-[11px] text-zinc-500 mb-2 font-body">Test how the server responds when a request arrives from any specific website domain:</p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testDomainInput}
                    onChange={e => setTestDomainInput(e.target.value)}
                    placeholder="e.g. mywebsite.com or stolen-site.com"
                    className="flex-1 px-3 py-2.5 text-xs border border-zinc-200 rounded-xl bg-white focus:border-zinc-900 focus:outline-hidden font-mono"
                    onKeyDown={e => e.key === 'Enter' && handleTestDomain(testDomainInput)}
                  />
                  <MotionButton
                    type="button"
                    variant="dark"
                    size="sm"
                    shimmer
                    onClick={() => handleTestDomain(testDomainInput)}
                    disabled={!testDomainInput.trim() || isTesting}
                    leftIcon={isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  >
                    Test Access
                  </MotionButton>
                </div>

                {/* Test Result Feedback */}
                {testResult && (
                  <div className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.isAllowed
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    {testResult.isAllowed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold mb-0.5 font-heading">
                        {testResult.isAllowed ? '✅ Access Granted (200 OK)' : '🚫 Access Rejected (403 Forbidden)'}
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90 font-body">{testResult.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Widget Live Button */}
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-indigo-950 font-heading">Test Floating Widget In Studio</h4>
              <p className="text-[11px] text-indigo-800 font-body">Trigger the floating chat bubble on bottom right to test live interaction.</p>
            </div>
            <MotionButton
              variant="primary"
              size="md"
              shimmer
              onClick={() => {
                onTriggerFloatingWidget();
                onClose();
              }}
              leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
            >
              Launch Widget
            </MotionButton>
          </div>

          {/* Platform Specific Instructions */}
          {activeTab === 'script' && (
            <div className="space-y-2 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900">Standard HTML Integration:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Copy the script tag above.</li>
                <li>Paste it right before the closing <code>&lt;/body&gt;</code> tag on your authorized website.</li>
                <li>The floating chat launcher will verify domain authorization and initialize automatically!</li>
              </ol>
            </div>
          )}

          {activeTab === 'wordpress' && (
            <div className="space-y-2 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900">WordPress Installation:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Log in to your WordPress Admin Dashboard.</li>
                <li>Go to <strong>Plugins &gt; Add New</strong> and install "Insert Headers and Footers" (or WPCode).</li>
                <li>Paste the script snippet inside the <strong>Footer Code</strong> section.</li>
                <li>Save changes and refresh your site to see your AI Support Assistant!</li>
              </ol>
            </div>
          )}

          {activeTab === 'shopify' && (
            <div className="space-y-2 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900">Shopify Integration:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Go to <strong>Online Store &gt; Themes</strong> in Shopify Admin.</li>
                <li>Click <strong>Actions &gt; Edit Code</strong>.</li>
                <li>Open <code>theme.liquid</code> file.</li>
                <li>Paste the script snippet right before <code>&lt;/body&gt;</code> and save.</li>
              </ol>
            </div>
          )}

          {activeTab === 'webflow' && (
            <div className="space-y-2 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900">Webflow Integration:</h4>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Open project in Webflow Designer.</li>
                <li>Go to <strong>Project Settings &gt; Custom Code</strong>.</li>
                <li>Paste the snippet in the <strong>Footer Code</strong> box and hit Publish!</li>
              </ol>
            </div>
          )}

          {activeTab === 'react' && (
            <div className="space-y-2 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900">React / Next.js Component Usage:</h4>
              <p>Add a <code>useEffect</code> hook in your root component:</p>
              <pre className="bg-slate-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto text-slate-800">
{`useEffect(() => {
  const script = document.createElement('script');
  script.src = "${appOrigin}/widget.js";
  script.setAttribute('data-bot-id', "${safeBotId}");
  script.setAttribute('data-domain', "${currentTargetDomain}");
  script.setAttribute('data-token', "${embedData.token}");
  script.async = true;
  document.body.appendChild(script);
}, []);`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200/80 bg-zinc-50 flex items-center justify-end">
          <MotionButton
            onClick={onClose}
            variant="dark"
            size="md"
          >
            Done
          </MotionButton>
        </div>
      </motion.div>
    </div>
  );
};

