import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chatbot } from '../../types';
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Sparkles,
  Layers,
  Play,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  X,
  Laptop,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Eye,
  FileCode,
  Terminal,
  Zap,
  Layout,
  ArrowRight
} from 'lucide-react';
import { SecurityService } from '../../services/securityService';
import { MotionButton } from '../common/MotionButton';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { EmbedChatWidget } from './EmbedChatWidget';

interface WidgetEmbedModalProps {
  bot?: Partial<Chatbot> | null;
  isOpen: boolean;
  onClose: () => void;
  onTriggerFloatingWidget: () => void;
}

// Brand SVG Badges for CMS Cards
const ShopifyLogo = () => (
  <svg className="w-5 h-5 fill-current text-[#008060]" viewBox="0 0 24 24">
    <path d="M18.8 8.8s-1.8.5-3.3.9c-1.2-3.1-3.2-5.7-5.5-7.7L7 4.2C6 4.7 5.2 5 4.5 5.3c-.3.1-.4.4-.3.7l1.7 11.2c.1.8.8 1.4 1.6 1.4h11.1c.9 0 1.6-.7 1.7-1.6l.8-7.2c.1-.6-.4-1-1.3-1zm-6.2 8.7h-1.8v-1.8h1.8v1.8zm0-3.6h-1.8V7.5h1.8v6.4z"/>
  </svg>
);

const WordPressLogo = () => (
  <svg className="w-5 h-5 fill-current text-[#21759B]" viewBox="0 0 24 24">
    <path d="M12.158 0C5.457 0 0 5.457 0 12.158c0 6.701 5.457 12.158 12.158 12.158 6.701 0 12.158-5.457 12.158-12.158C24.316 5.457 18.859 0 12.158 0zm0 22.585c-2.316 0-4.444-.75-6.173-2.022l4.896-13.418c.553.023 1.058.046 1.058.046.46 0 .392-.69-.068-.713 0 0-1.38-.115-2.277-.115-.828 0-2.277.115-2.277.115-.46.023-.529.713-.069.713 0 0 .483-.023.989-.046l2.368 6.486-3.334-9.936C2.323 5.48 0 8.562 0 12.158c0 2.231.621 4.323 1.702 6.105L8.27 3.518c.207-.345.345-.621.345-.897 0-.575-.437-.805-.851-.805-.299 0-.598.069-.874.138L12.158 22.585zm7.336-6.417l-3.311-9.613c.483.023.92.046.92.046.46 0 .391-.69-.069-.713 0 0-1.38-.115-2.277-.115-.828 0-2.277.115-2.277.115-.46.023-.529.713-.069.713 0 0 .46-.023.943-.046l1.817 5.267-2.162 6.715-4.231-12.626c1.035-.345 2.139-.552 3.289-.552 5.75 0 10.424 4.674 10.424 10.424 0 3.702-1.932 6.946-4.819 8.786z"/>
  </svg>
);

const WebflowLogo = () => (
  <svg className="w-5 h-5 fill-current text-[#4353FF]" viewBox="0 0 24 24">
    <path d="M18.8 8.12l-2.8 9.88h-3.2l-2-6.8-2 6.8H5.6L2.8 8.12h3.2l1.6 6.8 2-6.8h3.2l2 6.8 1.6-6.8h3.2z"/>
  </svg>
);

const NextjsLogo = () => (
  <svg className="w-5 h-5 fill-current text-zinc-950" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.56 18.27L10.32 8.72V16H8.8V7.2h1.64l7.24 9.55v-8.35h1.52v9.87h-.64z"/>
  </svg>
);

const HtmlLogo = () => (
  <svg className="w-5 h-5 fill-current text-[#E34F26]" viewBox="0 0 24 24">
    <path d="M1.5 0h21l-1.91 21.563L11.97 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.625h10.222l.23-2.625H5.405l.696 7.875h9.183l-.364 4.088-2.951.796-2.956-.796-.188-2.125H6.2l.375 4.238L11.97 20.3l5.39-1.453.743-8.347H8.531z"/>
  </svg>
);

interface CmsGuide {
  id: 'shopify' | 'wordpress' | 'webflow' | 'nextjs' | 'html';
  name: string;
  badge: string;
  color: string;
  bgColor: string;
  borderColor: string;
  logo: React.ReactNode;
  estTime: string;
  steps: {
    title: string;
    description: string;
    codeSnippet?: string;
    tip?: string;
  }[];
  microPreview: {
    editorName: string;
    locationText: string;
    highlightArea: string;
  };
}

export const WidgetEmbedModal: React.FC<WidgetEmbedModalProps> = ({
  bot,
  isOpen,
  onClose,
  onTriggerFloatingWidget,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedCms, setSelectedCms] = useState<'shopify' | 'wordpress' | 'webflow' | 'nextjs' | 'html'>('shopify');
  const [expandedAccordionStep, setExpandedAccordionStep] = useState<number>(0);

  // One-Click Live Demo Preview Modal State
  const [isDemoPreviewOpen, setIsDemoPreviewOpen] = useState(false);
  const [demoViewport, setDemoViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [demoWidgetActive, setDemoWidgetActive] = useState(true);

  // Security & Domain states
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [testDomainInput, setTestDomainInput] = useState<string>('');
  const [testResult, setTestResult] = useState<{ isAllowed?: boolean; reason?: string; testDomain?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'cms' | 'security'>('cms');
  
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, {
    isOpen,
    onClose,
    closeOnEsc: true,
  });

  const safeBotName = bot?.name || 'AI Support Assistant';
  const safeBotColor = bot?.primaryColor || '#4F46E5';
  const safeBotAvatar = bot?.avatar || '🤖';
  const safeBotId = bot?.id || 'demo_bot';

  const fullBot: Chatbot = {
    id: bot?.id || 'demo_bot',
    tenantId: bot?.tenantId || 'tenant_1',
    name: safeBotName,
    description: bot?.description || 'AI Support Assistant',
    botType: bot?.botType || 'support',
    websiteUrl: bot?.websiteUrl || 'https://example.com',
    allowedDomains: bot?.allowedDomains || [],
    domainLockEnabled: bot?.domainLockEnabled ?? true,
    channel: bot?.channel || 'Website Widget',
    systemInstruction: bot?.systemInstruction || '',
    tone: bot?.tone || 'Friendly',
    primaryColor: safeBotColor,
    textColor: bot?.textColor || '#FFFFFF',
    avatar: safeBotAvatar,
    greetingMessage: bot?.greetingMessage || 'Hello! How can I help you today?',
    suggestedQuestions: bot?.suggestedQuestions || ['How do I track my order?', 'What is your refund policy?'],
    model: bot?.model || 'gemini-3.7-flash',
    fallbackMessage: bot?.fallbackMessage || "I'm sorry, I don't have an answer for that.",
    collectLeadEmail: bot?.collectLeadEmail ?? true,
    leadTitle: bot?.leadTitle || 'Leave your email to stay connected',
    humanOperatorOnline: bot?.humanOperatorOnline ?? false,
    status: bot?.status || 'active',
    createdAt: bot?.createdAt || new Date().toISOString(),
    updatedAt: bot?.updatedAt || new Date().toISOString(),
  };

  const effectiveDomains = SecurityService.getEffectiveAuthorizedDomains(bot);
  const primaryDomain = effectiveDomains[0] || (bot?.websiteUrl ? SecurityService.normalizeDomain(bot.websiteUrl) : 'example.com');

  useEffect(() => {
    if (isOpen) {
      setSelectedDomain(primaryDomain);
      setTestDomainInput('');
      setTestResult(null);
    }
  }, [isOpen, primaryDomain]);

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

  const handleCopy = async (codeToCopy: string = scriptSnippet) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(codeToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = codeToCopy;
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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

  // CMS Definitions with Step-by-Step Accordions & Visual Editors
  const cmsGuides: CmsGuide[] = [
    {
      id: 'shopify',
      name: 'Shopify',
      badge: 'E-Commerce Store',
      color: '#008060',
      bgColor: 'bg-emerald-50/70',
      borderColor: 'border-emerald-200',
      logo: <ShopifyLogo />,
      estTime: '2 mins',
      steps: [
        {
          title: 'Navigate to Theme Liquid File',
          description: 'In your Shopify Admin, go to Online Store > Themes. Click the "..." or "Actions" dropdown on your active theme and select "Edit Code".',
          tip: 'Tip: Duplicate your theme first if you want an extra backup!'
        },
        {
          title: 'Paste Embed Script before </body>',
          description: 'In the left file navigator, open "Layout > theme.liquid". Scroll down to the bottom of the file and paste your secure chatbot snippet right above the </body> tag.',
          codeSnippet: scriptSnippet,
        },
        {
          title: 'Save & Test Live Store',
          description: 'Click "Save" in the upper right corner. Refresh your live Shopify storefront to start greeting visitors automatically!',
        }
      ],
      microPreview: {
        editorName: 'Shopify Code Editor (theme.liquid)',
        locationText: 'Layout / theme.liquid -> Line 240 (above </body>)',
        highlightArea: 'Paste your <script> tag before </body> and hit Save.'
      }
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      badge: 'WP Admin / Plugins',
      color: '#21759B',
      bgColor: 'bg-sky-50/70',
      borderColor: 'border-sky-200',
      logo: <WordPressLogo />,
      estTime: '2 mins',
      steps: [
        {
          title: 'Install WPCode or Header/Footer Plugin',
          description: 'In your WP Admin dashboard, go to Plugins > Add New. Search for "WPCode" or "Insert Headers and Footers" and click Install & Activate.',
        },
        {
          title: 'Add Snippet to Footer Scripts',
          description: 'Navigate to Code Snippets > Header & Footer. Paste the snippet inside the "Footer" text block.',
          codeSnippet: scriptSnippet,
        },
        {
          title: 'Save Changes & Clear Cache',
          description: 'Click "Save Changes". If using a caching plugin (WP Rocket / LiteSpeed), purge your cache to see the widget live.',
        }
      ],
      microPreview: {
        editorName: 'WordPress Dashboard (WPCode Settings)',
        locationText: 'Code Snippets > Header & Footer > Footer Box',
        highlightArea: 'Paste script in Footer code area & click Save.'
      }
    },
    {
      id: 'webflow',
      name: 'Webflow',
      badge: 'Custom Code / Footer',
      color: '#4353FF',
      bgColor: 'bg-indigo-50/70',
      borderColor: 'border-indigo-200',
      logo: <WebflowLogo />,
      estTime: '2 mins',
      steps: [
        {
          title: 'Open Webflow Site Settings',
          description: 'From your Webflow Dashboard, open your project settings (gear icon) or open the Designer and click Site Settings.',
        },
        {
          title: 'Paste Code into Footer Code Section',
          description: 'Click on the "Custom Code" tab. Scroll down to the "Footer Code" (before </body>) text area and paste your script.',
          codeSnippet: scriptSnippet,
        },
        {
          title: 'Publish Site',
          description: 'Hit the green "Publish" button in the upper right to push changes to your .webflow.io domain or custom domain.',
        }
      ],
      microPreview: {
        editorName: 'Webflow Project Settings',
        locationText: 'Custom Code Tab -> Footer Code (Before </body>)',
        highlightArea: 'Paste script & Publish to staging / custom domain.'
      }
    },
    {
      id: 'nextjs',
      name: 'React / Next.js',
      badge: 'Component / Script',
      color: '#000000',
      bgColor: 'bg-zinc-100/80',
      borderColor: 'border-zinc-300',
      logo: <NextjsLogo />,
      estTime: '1 min',
      steps: [
        {
          title: 'Use Next.js <Script> or useEffect',
          description: 'In Next.js App Router (app/layout.tsx) or Pages Router (_app.tsx), import Next Script or inject dynamically via useEffect hook.',
          codeSnippet: `import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${appOrigin}/widget.js"
          data-bot-id="${safeBotId}"
          data-domain="${currentTargetDomain}"
          data-token="${embedData.token}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`,
        },
        {
          title: 'Alternative Standard React useEffect',
          description: 'For standard Create React App or Vite apps, add script element dynamically inside your root App component.',
          codeSnippet: `useEffect(() => {
  const s = document.createElement('script');
  s.src = "${appOrigin}/widget.js";
  s.setAttribute('data-bot-id', "${safeBotId}");
  s.setAttribute('data-domain', "${currentTargetDomain}");
  s.setAttribute('data-token', "${embedData.token}");
  s.async = true;
  document.body.appendChild(s);
}, []);`,
        }
      ],
      microPreview: {
        editorName: 'Next.js app/layout.tsx',
        locationText: 'RootLayout component -> <Script strategy="lazyOnload" />',
        highlightArea: 'Integrate native Next.js Script component.'
      }
    },
    {
      id: 'html',
      name: 'Standard HTML',
      badge: 'Direct Web Page',
      color: '#E34F26',
      bgColor: 'bg-orange-50/70',
      borderColor: 'border-orange-200',
      logo: <HtmlLogo />,
      estTime: '1 min',
      steps: [
        {
          title: 'Copy Script Tag',
          description: 'Copy the full secure script snippet below.',
          codeSnippet: scriptSnippet,
        },
        {
          title: 'Paste into HTML document',
          description: 'Open index.html in your code editor (VS Code, Sublime, etc.) and paste right above </body>.',
        },
        {
          title: 'Deploy or Refresh',
          description: 'Save your file and open the site in your browser to verify the chat launcher widget.',
        }
      ],
      microPreview: {
        editorName: 'HTML Document (index.html)',
        locationText: 'Bottom of <body> -> Before </body>',
        highlightArea: 'Paste <script> tag & save index.html.'
      }
    }
  ];

  const activeCmsGuide = cmsGuides.find(c => c.id === selectedCms) || cmsGuides[0];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden font-sans">
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
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="widget-embed-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-zinc-200 flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto relative z-10"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/80 shrink-0">
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: safeBotColor }}
                className="w-10 h-10 rounded-2xl text-xl flex items-center justify-center text-white font-bold shadow-xs shrink-0"
              >
                {safeBotAvatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="widget-embed-modal-title" className="text-base sm:text-lg font-extrabold text-zinc-950 font-heading">
                    Embed & Deploy {safeBotName}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Domain Locked
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-medium">
                  Instant integration code & visual setup guides for your website
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* One-Click Test Live Preview Header Action Button */}
              <MotionButton
                variant="primary"
                size="sm"
                shimmer
                onClick={() => setIsDemoPreviewOpen(true)}
                leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
              >
                <span className="hidden sm:inline">One-Click</span> Test Live Preview
              </MotionButton>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close embed modal"
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-200/60 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Top Level Nav Bar */}
          <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 sm:px-6 shrink-0">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('cms')}
                className={`py-3 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 cursor-pointer font-heading ${
                  activeTab === 'cms' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Layout className="w-3.5 h-3.5 text-amber-600" />
                <span>CMS & Platform Guides</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`py-3 text-xs font-extrabold border-b-2 transition flex items-center gap-1.5 cursor-pointer font-heading ${
                  activeTab === 'security' ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Security & Domain Whitelist</span>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Host: <strong>{currentTargetDomain}</strong></span>
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-zinc-50/40">
            {activeTab === 'cms' && (
              <>
                {/* 1. Visual CMS Selector Cards */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-extrabold text-zinc-900 font-heading uppercase tracking-wider">
                      Select Your Platform / CMS
                    </label>
                    <span className="text-[11px] text-zinc-500 font-medium">Select platform to open step-by-step installation guide</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {cmsGuides.map(guide => {
                      const isSelected = selectedCms === guide.id;
                      return (
                        <button
                          key={guide.id}
                          type="button"
                          onClick={() => {
                            setSelectedCms(guide.id);
                            setExpandedAccordionStep(0);
                          }}
                          className={`p-3 rounded-2xl border transition text-left flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden ${
                            isSelected
                              ? 'bg-white border-zinc-950 shadow-md ring-2 ring-zinc-950/10'
                              : 'bg-white/80 hover:bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                              {guide.logo}
                            </div>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-extrabold text-zinc-950 font-heading">{guide.name}</h4>
                            <span className="text-[10px] text-zinc-500 font-medium block">{guide.badge}</span>
                          </div>

                          <div className="pt-1 border-t border-zinc-100 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                            <span>{guide.estTime}</span>
                            <span className="text-zinc-700 font-bold">{isSelected ? 'Active' : 'Guide'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Step-by-step Accordion Guide & Interactive Micro-Preview */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                        {activeCmsGuide.logo}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-zinc-950 font-heading">
                          {activeCmsGuide.name} Installation Accordion Guide
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-medium">
                          Estimated setup time: {activeCmsGuide.estTime} • Standard Footer Injection
                        </p>
                      </div>
                    </div>

                    <MotionButton
                      variant={copied ? 'secondary' : 'dark'}
                      size="sm"
                      onClick={() => handleCopy(scriptSnippet)}
                      leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    >
                      {copied ? 'Copied Snippet!' : 'Copy Snippet'}
                    </MotionButton>
                  </div>

                  {/* Accordion List */}
                  <div className="space-y-2">
                    {activeCmsGuide.steps.map((step, idx) => {
                      const isExpanded = expandedAccordionStep === idx;
                      return (
                        <div
                          key={idx}
                          className={`border rounded-2xl transition overflow-hidden ${
                            isExpanded ? 'border-zinc-400 bg-zinc-50/60 shadow-2xs' : 'border-zinc-200 bg-white hover:border-zinc-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedAccordionStep(isExpanded ? -1 : idx)}
                            className="w-full p-3.5 text-left flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full text-xs font-bold font-mono flex items-center justify-center shrink-0 ${
                                isExpanded ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-700'
                              }`}>
                                {idx + 1}
                              </span>
                              <span className="text-xs font-extrabold text-zinc-950 font-heading">{step.title}</span>
                            </div>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-600" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 space-y-3 text-xs text-zinc-700 border-t border-zinc-200/60 animate-in fade-in duration-150">
                              <p className="leading-relaxed font-medium">{step.description}</p>
                              {step.tip && (
                                <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                                  💡 {step.tip}
                                </p>
                              )}

                              {step.codeSnippet && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                                    <span>Code to paste:</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(step.codeSnippet!)}
                                      className="text-amber-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                      <Copy className="w-3 h-3" /> Copy Snippet
                                    </button>
                                  </div>
                                  <pre className="bg-zinc-950 text-amber-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto border border-zinc-800 shadow-inner">
                                    <code>{step.codeSnippet}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Visual Micro-Preview Card (Simulated CMS Editor Mockup) */}
                  <div className="bg-zinc-950 text-white rounded-2xl p-4 space-y-3 border border-zinc-800 relative overflow-hidden shadow-md">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-[11px] font-mono text-zinc-400 font-bold ml-2">{activeCmsGuide.microPreview.editorName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {activeCmsGuide.microPreview.locationText}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-zinc-300 space-y-1 bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                      <p className="text-zinc-500">&lt;!-- 1. Open your website code editor --&gt;</p>
                      <p className="text-zinc-500">&lt;body&gt;</p>
                      <p className="text-zinc-500 pl-4">...</p>
                      <div className="pl-4 py-1.5 my-1 bg-amber-500/10 border-l-2 border-amber-400 text-amber-300 rounded-r font-bold animate-pulse">
                        &lt;!-- 2. Paste secure AI chatbot embed snippet right here --&gt;
                        <br />
                        <span className="text-[10px] text-amber-200 font-normal">{activeCmsGuide.microPreview.highlightArea}</span>
                      </div>
                      <p className="text-zinc-500">&lt;/body&gt;</p>
                    </div>
                  </div>
                </div>

                {/* 3. One-Click Test Live Preview Callout Banner */}
                <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-zinc-950 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-300">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-zinc-950 fill-zinc-950" />
                      <h3 className="text-sm font-extrabold font-heading">Test Live Preview Demo Web Page</h3>
                    </div>
                    <p className="text-xs text-zinc-900 font-medium">
                      Want to verify how your chatbot looks and responds on an actual client webpage before publishing?
                    </p>
                  </div>

                  <MotionButton
                    variant="dark"
                    size="md"
                    shimmer
                    onClick={() => setIsDemoPreviewOpen(true)}
                    leftIcon={<Play className="w-4 h-4 fill-white" />}
                  >
                    Open Demo Page Sandbox
                  </MotionButton>
                </div>
              </>
            )}

            {/* Domain Security & Verification Tab */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border border-indigo-200/90 rounded-3xl p-5 flex items-start gap-3 shadow-2xs">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs space-y-1">
                    <h4 className="font-extrabold text-indigo-950 flex items-center gap-2 font-heading text-sm">
                      <span>Server-Enforced Theft-Proof Domain Protection</span>
                      <span className="bg-indigo-200/90 text-indigo-900 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold font-mono">
                        Active
                      </span>
                    </h4>
                    <p className="text-indigo-900 leading-relaxed text-xs">
                      If an unauthorized party copies your embed snippet and pastes it onto another domain, our Cloud backend server checks incoming browser Origin headers and returns a <strong>403 Forbidden</strong> response, keeping your knowledge base and credits safe.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-xs space-y-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-950 mb-1 flex items-center gap-1.5 font-heading">
                      <Globe className="w-4 h-4 text-indigo-600" />
                      <span>Authorized Website Domains</span>
                    </h4>
                    <p className="text-xs text-zinc-500 mb-3">Your chatbot will load and answer visitor queries exclusively on these domains:</p>
                    <div className="flex flex-wrap gap-2">
                      {effectiveDomains.map(d => (
                        <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 shadow-2xs">
                          <Lock className="w-3.5 h-3.5 text-indigo-600" />
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Diagnostic Domain Test */}
                  <div className="pt-4 border-t border-zinc-100 space-y-2">
                    <h4 className="text-xs font-extrabold text-zinc-950 font-heading">
                      Live Backend Domain Security Diagnostic
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Simulate a live request from any domain to test if the backend permits or blocks access:
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={testDomainInput}
                        onChange={e => setTestDomainInput(e.target.value)}
                        placeholder="e.g. mywebsite.com or stolen-site.com"
                        className="flex-1 px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl bg-white focus:border-zinc-900 focus:outline-hidden font-mono"
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
                        Run Diagnostic
                      </MotionButton>
                    </div>

                    {testResult && (
                      <div
                        className={`mt-3 p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                          testResult.isAllowed
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        {testResult.isAllowed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-extrabold mb-0.5 font-heading">
                            {testResult.isAllowed ? '✅ Domain Authorized (200 OK)' : '🚫 Access Denied (403 Forbidden)'}
                          </div>
                          <p className="text-xs opacity-90">{testResult.reason}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-200/80 bg-zinc-50 flex items-center justify-between shrink-0">
            <MotionButton
              onClick={() => setIsDemoPreviewOpen(true)}
              variant="primary"
              size="sm"
              leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
            >
              One-Click Live Test Page
            </MotionButton>

            <MotionButton onClick={onClose} variant="dark" size="md">
              Done
            </MotionButton>
          </div>
        </motion.div>
      </div>

      {/* ONE-CLICK TEST LIVE PREVIEW DEMO WEB PAGE OVERLAY MODAL */}
      <AnimatePresence>
        {isDemoPreviewOpen && (
          <div className="fixed inset-0 z-60 flex flex-col bg-zinc-950 text-zinc-100 font-sans animate-in fade-in duration-200">
            {/* Demo Sandbox Control Header */}
            <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>

                <div className="h-4 w-px bg-zinc-700 mx-1" />

                <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>https://{currentTargetDomain}/demo-sandbox</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
                    LIVE PREVIEW
                  </span>
                </div>
              </div>

              {/* Viewport Toggles & Actions */}
              <div className="flex items-center gap-2">
                <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDemoViewport('desktop')}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      demoViewport === 'desktop' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoViewport('mobile')}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                      demoViewport === 'mobile' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDemoPreviewOpen(false)}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 cursor-pointer font-heading"
                >
                  <X className="w-4 h-4" />
                  <span>Exit Preview</span>
                </button>
              </div>
            </header>

            {/* Sandbox Canvas Container */}
            <main className="flex-1 overflow-y-auto bg-zinc-900/50 flex items-center justify-center p-2 sm:p-6 relative">
              <div
                className={`transition-all duration-300 bg-white text-zinc-900 shadow-2xl overflow-hidden relative flex flex-col ${
                  demoViewport === 'mobile'
                    ? 'w-[375px] h-[750px] max-h-[90vh] rounded-[40px] border-8 border-zinc-800 ring-1 ring-zinc-700'
                    : 'w-full max-w-5xl h-[85vh] rounded-3xl border border-zinc-800'
                }`}
              >
                {/* Mock Client Website Nav Header */}
                <nav className="border-b border-zinc-200 px-6 py-4 flex items-center justify-between bg-zinc-50 shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-950 text-amber-400 font-extrabold flex items-center justify-center font-heading text-sm">
                      A
                    </div>
                    <span className="font-extrabold text-sm font-heading tracking-tight">Acme Global Store</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 text-xs font-extrabold text-zinc-600 font-heading">
                    <span className="text-zinc-950">Home</span>
                    <span className="hover:text-zinc-950 cursor-pointer">Products</span>
                    <span className="hover:text-zinc-950 cursor-pointer">Pricing</span>
                    <span className="hover:text-zinc-950 cursor-pointer">Contact</span>
                  </div>

                  <div className="px-3 py-1.5 bg-zinc-950 text-white rounded-xl text-xs font-bold font-heading">
                    Get Started
                  </div>
                </nav>

                {/* Mock Client Hero Page Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-8 bg-gradient-to-b from-zinc-50 to-white">
                  <div className="max-w-2xl space-y-4">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-100 text-amber-900 px-2.5 py-1 rounded-md font-mono">
                      Live Pre-Injected Widget Sandbox
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-heading leading-tight">
                      Experience Your Custom Chatbot Live On A Real Website
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed">
                      This demo web page renders your configured <strong className="text-zinc-900">{safeBotName}</strong> widget directly in the bottom-right corner. Click the floating chat bubble to test live automated answers, lead capture, and operator takeover!
                    </p>
                  </div>

                  {/* Mock Features Cards */}
                  <div className="grid sm:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-2xs space-y-1.5">
                      <Zap className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-extrabold text-zinc-950 font-heading">Instant AI Answers</h4>
                      <p className="text-[11px] text-zinc-500">Trained on your knowledge base docs.</p>
                    </div>
                    <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-2xs space-y-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-extrabold text-zinc-950 font-heading">Domain Lock Protection</h4>
                      <p className="text-[11px] text-zinc-500">Secured server-side against theft.</p>
                    </div>
                    <div className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-2xs space-y-1.5">
                      <Globe className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-extrabold text-zinc-950 font-heading">Multi-Platform Ready</h4>
                      <p className="text-[11px] text-zinc-500">Embed on Shopify, WP, Webflow, React.</p>
                    </div>
                  </div>
                </div>

                {/* Pre-Injected Live Floating Chatbot Widget Container */}
                <div className="absolute bottom-4 right-4 z-50">
                  <EmbedChatWidget
                    bot={fullBot}
                    isFloating={true}
                    onClose={() => setDemoWidgetActive(false)}
                  />
                </div>
              </div>
            </main>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};


