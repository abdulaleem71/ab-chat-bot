import React, { useState, useEffect } from 'react';
import { Chatbot } from '../../types';
import { Code, Copy, Check, ExternalLink, Globe, Sparkles, Layers, Play, Shield, ShieldCheck, ShieldAlert, Lock, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { SecurityService } from '../../services/securityService';

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: safeBotColor }}
              className="w-10 h-10 rounded-xl text-xl flex items-center justify-center text-white font-bold"
            >
              {safeBotAvatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Embed & Deploy {safeBotName}</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Domain Locked
                </span>
              </div>
              <p className="text-xs text-slate-500">Secure embed code tied cryptographically to your authorized website domain</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-white px-6 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('script')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'script' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            HTML & Script Tag
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'security' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Domain Security & Verification</span>
          </button>
          <button
            onClick={() => setActiveTab('wordpress')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'wordpress' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            WordPress
          </button>
          <button
            onClick={() => setActiveTab('shopify')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'shopify' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Shopify
          </button>
          <button
            onClick={() => setActiveTab('webflow')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'webflow' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Webflow
          </button>
          <button
            onClick={() => setActiveTab('react')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'react' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            React / Next.js
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Snippet Box with Domain Binding */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold text-slate-800">Secure Embed Code (Locked to Domain)</label>
                <p className="text-[11px] text-slate-500">Includes HMAC-SHA256 signature verified server-side on every request</p>
              </div>
              <button
                onClick={handleCopy}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto relative border border-slate-800 shadow-inner">
              <code>{scriptSnippet}</code>
            </div>

            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 px-1">
              <span>Authorized Host: <strong className="text-slate-800 font-mono">{currentTargetDomain}</strong></span>
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" /> Server-enforced protection active
              </span>
            </div>
          </div>

          {/* Domain Security Protection Banner */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                <span>Theft-Proof Server-Side Domain Protection</span>
                <span className="bg-indigo-200/80 text-indigo-900 text-[10px] px-2 py-0.5 rounded-full font-medium">Active</span>
              </h4>
              <p className="text-indigo-900 leading-relaxed text-[11px]">
                If someone copies your embed code and pastes it onto another website, our backend server automatically inspects browser Origin & Referer headers and blocks access with <strong>403 Forbidden</strong>. Your AI credits and knowledge base remain 100% secure.
              </p>
            </div>
          </div>

          {/* Security Diagnostic Tab */}
          {activeTab === 'security' && (
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Authorized Domains Whitelist</span>
                </h4>
                <p className="text-[11px] text-slate-500 mb-2">The chatbot will only load and respond to visitor inquiries on these domains:</p>
                <div className="flex flex-wrap gap-2">
                  {effectiveDomains.map(d => (
                    <span key={d} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 shadow-2xs">
                      <Lock className="w-3 h-3 text-indigo-600" />
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Diagnostic Domain Test */}
              <div className="pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 mb-1">Live Server Authorization Diagnostic Test</h4>
                <p className="text-[11px] text-slate-500 mb-2">Test how the server responds when a request arrives from any specific website domain:</p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testDomainInput}
                    onChange={e => setTestDomainInput(e.target.value)}
                    placeholder="e.g. mywebsite.com or stolen-site.com"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-hidden font-mono"
                    onKeyDown={e => e.key === 'Enter' && handleTestDomain(testDomainInput)}
                  />
                  <button
                    type="button"
                    onClick={() => handleTestDomain(testDomainInput)}
                    disabled={!testDomainInput.trim() || isTesting}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
                  >
                    {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    <span>Test Domain Access</span>
                  </button>
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
                      <div className="font-bold mb-0.5">
                        {testResult.isAllowed ? '✅ Access Granted (200 OK)' : '🚫 Access Rejected (403 Forbidden)'}
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{testResult.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Widget Live Button */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-indigo-950">Test Floating Widget In Studio</h4>
              <p className="text-[11px] text-indigo-800">Trigger the floating chat bubble on bottom right to test live interaction.</p>
            </div>
            <button
              onClick={() => {
                onTriggerFloatingWidget();
                onClose();
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch Widget</span>
            </button>
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
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

