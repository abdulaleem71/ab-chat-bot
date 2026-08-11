import React, { useState, useEffect } from 'react';
import { Chatbot } from '../../types';
import { Code, Copy, Check, ExternalLink, Globe, Sparkles, Layers, Play } from 'lucide-react';

interface WidgetEmbedModalProps {
  bot: Chatbot;
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
  const [activeTab, setActiveTab] = useState<'script' | 'wordpress' | 'shopify' | 'webflow' | 'react'>('script');

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
  const scriptSnippet = `<script src="${appOrigin}/widget.js" data-bot-id="${bot?.id || ''}" async></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: bot.primaryColor }}
              className="w-10 h-10 rounded-xl text-xl flex items-center justify-center text-white font-bold"
            >
              {bot.avatar}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Embed & Deploy {bot.name}</h2>
              <p className="text-xs text-slate-500">Add this script tag to any website to display your live floating chat widget</p>
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
          {/* Main Snippet Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">Your Unique Chatbot Embed Code</label>
              <button
                onClick={handleCopy}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto relative border border-slate-800 shadow-inner">
              <code>{scriptSnippet}</code>
            </div>
          </div>

          {/* Test Widget Live Button */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-indigo-950">Test Floating Widget On This Page</h4>
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
                <li>Paste it right before the closing <code>&lt;/body&gt;</code> tag on your HTML website.</li>
                <li>The floating chat launcher will initialize automatically on load!</li>
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
  script.setAttribute('data-bot-id', "${bot.id}");
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
