import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { ShopifyCheckoutModal } from './ShopifyCheckoutModal';
import { ContactSalesModal } from './ContactSalesModal';
import {
  Check,
  Sparkles,
  ArrowRight,
  Lock,
  Building2,
  ShieldCheck,
  PhoneCall,
  ChevronDown,
} from 'lucide-react';
import { GEMINI_CONFIG } from '../../config/models';
import { TenantPlan } from '../../types';

interface PricingViewProps {
  onOpenAuthModal?: () => void;
  onNavigateToFaq?: () => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onOpenAuthModal }) => {
  const { tenant, isAuthenticated } = useAuth();
  const currentPlan = isAuthenticated ? (tenant?.plan || 'Pro') : null;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<{
    id: TenantPlan;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
  } | null>(null);

  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);

  const proPrice = billingCycle === 'annual' ? 39 : 49;
  const ultraPrice = billingCycle === 'annual' ? 159 : 199;

  const plans = [
    {
      id: 'Pro' as TenantPlan,
      name: 'NomadsChat Pro',
      tagline: 'Full-featured AI support automation for growing teams & agencies.',
      monthlyPrice: 49,
      annualPrice: 39,
      isCustomPrice: false,
      popular: true,
      badge: '3-Day Free Trial',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      trialNote: 'Includes 3-Day Full-Access Trial · $0 Due Today',
      features: [
        'Up to 10 AI Chatbot Instances',
        '10,000 Messages / month included',
        'Unlimited Knowledge Base Sources (URL Scraper + PDFs)',
        `${GEMINI_CONFIG.flash.name} & ${GEMINI_CONFIG.pro.name} Models`,
        'Remove "Powered by NomadsChat" Branding',
        'Live Agent Human Takeover Inbox',
        'Visitor Lead Capture & CRM Sync',
        'Custom Color & Font Widget Themes',
        'Priority Email & Chat Support',
      ],
      limitations: [
        'Bring Your Own API Key (BYOK)',
        'SSO / SAML 2.0 Authentication',
      ],
      ctaText: currentPlan === 'Pro' ? 'Current Active Plan' : 'Start 3-Day Free Trial',
      isCurrent: currentPlan === 'Pro',
      actionType: 'self-serve' as const,
    },
    {
      id: 'Ultra' as TenantPlan,
      name: 'Enterprise Ultra',
      tagline: 'High-scale infrastructure for high-volume platforms & agencies.',
      monthlyPrice: 199,
      annualPrice: 159,
      isCustomPrice: false,
      popular: false,
      badge: 'High Scale & BYOK',
      badgeClass: 'bg-zinc-900 text-white border border-zinc-800',
      trialNote: 'Soft-Cap Protection · BYOK Ready',
      features: [
        'Unlimited AI Chatbots',
        '100,000+ Messages / month',
        'Dedicated RAG Indexer & Instant Web Crawler',
        `${GEMINI_CONFIG.pro.name} & Custom System Prompts`,
        'Custom Domain Embed & White-Label Webhooks',
        'Multi-Agent Team Routing & Assignment',
        'Bring Your Own API Key (Gemini & OpenAI)',
        'Priority 24/7 Phone & Slack Channel',
      ],
      limitations: [
        'Dedicated VPC Deployment',
      ],
      ctaText: currentPlan === 'Ultra' ? 'Current Active Plan' : 'Upgrade to Ultra',
      isCurrent: currentPlan === 'Ultra',
      actionType: 'self-serve' as const,
    },
    {
      id: 'Enterprise' as TenantPlan,
      name: 'Enterprise',
      tagline: 'Custom quote & dedicated architecture for global organizations.',
      monthlyPrice: 0,
      annualPrice: 0,
      isCustomPrice: true,
      popular: false,
      badge: 'Sales-Assisted',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30',
      trialNote: 'Dedicated VPC deployment & SLA',
      features: [
        'Everything in Enterprise Ultra +',
        'Single Sign-On (SSO / SAML 2.0 & Okta / Azure AD)',
        'Compliance Audit Package & Security Review',
        'Custom Master Services Agreement (MSA) & 99.99% SLA',
        'Dedicated Solutions Architect & Custom Onboarding',
        'Custom Data Processing Agreement (DPA)',
        'Bring Your Own Key (Vertex AI & Custom Endpoints)',
      ],
      limitations: [],
      ctaText: currentPlan === 'Enterprise' ? 'Current Active Plan' : 'Contact Sales',
      isCurrent: currentPlan === 'Enterprise',
      actionType: 'contact-sales' as const,
    },
  ];

  const faqs = [
    {
      q: 'How does the 3-day free trial work?',
      a: 'Every new organization receives immediate full access to NomadsChat Pro for 3 days with zero upfront charge ($0 due today). Build chatbots, train knowledge sources, and test live support before billing begins.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Yes. You can upgrade, downgrade, or cancel your subscription at any time directly from your Billing Dashboard or Stripe billing portal with zero penalty.',
    },
    {
      q: 'What happens if I exceed my monthly message quota?',
      a: 'We never cut off your AI chatbots unexpectedly. On paid plans, soft-cap protection ensures 100% visitor coverage. Extra volume is billed transparently at $10 per 1,000 additional messages.',
    },
    {
      q: 'Can I bring my own Gemini or OpenAI API keys (BYOK)?',
      a: 'Yes. BYOK is supported on Enterprise Ultra and Enterprise plans. Connected provider keys are AES-256 encrypted on the server and billed directly to your provider account.',
    },
    {
      q: 'Is my company data secure and private?',
      a: 'All traffic is encrypted via TLS 1.3 and workspace secrets are encrypted at rest with AES-256. Knowledge sources remain strictly isolated per workspace.',
    },
  ];

  const handleSelectSelfServePlan = (plan: typeof plans[number]) => {
    if (plan.isCurrent) return;
    if (!isAuthenticated && onOpenAuthModal) {
      onOpenAuthModal();
      return;
    }
    setSelectedCheckoutPlan({
      id: plan.id,
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
    });
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-16 px-4 sm:px-6 pt-4">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-2">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 font-mono">
          3-Day Free Trial · $0 Due Today
        </p>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-950 tracking-tight leading-tight font-heading [text-wrap:balance]">
          Transparent pricing for high-converting AI support
        </h1>
        <p className="text-zinc-600 text-sm sm:text-base font-medium leading-relaxed">
          Deploy grounded AI chatbots trained on your company knowledge base. Start your 3-day trial today with zero upfront charge.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-zinc-950' : 'text-zinc-400'}`}>
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-12 h-6 bg-zinc-950 rounded-full p-1 relative transition-colors duration-200 focus:outline-hidden cursor-pointer shrink-0"
            aria-label="Toggle billing cycle between monthly and annual"
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-zinc-950' : 'text-zinc-400'}`}>
              Annual Billing
            </span>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono whitespace-nowrap">
              Save 20%
            </span>
          </div>
        </div>
      </div>

      {/* 3 Responsive Pricing Cards (Inline header badges — zero collision) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
        {plans.map((plan) => {
          const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          const isDarkCard = plan.actionType === 'contact-sales';

          return (
            <div
              key={plan.id}
              className={`min-w-0 rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'bg-white border-2 border-zinc-950 shadow-xl ring-4 ring-zinc-950/5'
                  : isDarkCard
                  ? 'bg-zinc-950 border-zinc-800 text-white shadow-lg'
                  : 'bg-white border-zinc-200 hover:border-zinc-400 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                {/* Inline Card Tier Header (Zero negative positioning overlap) */}
                <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                  <span
                    className={`${plan.badgeClass} text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider inline-flex items-center gap-1.5 font-mono whitespace-nowrap shrink-0`}
                  >
                    {plan.popular && <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />}
                    <span>{plan.badge}</span>
                  </span>

                  {plan.isCurrent && (
                    <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider font-mono whitespace-nowrap shrink-0">
                      Active Plan
                    </span>
                  )}
                </div>

                {/* Title & Tagline */}
                <div className="space-y-1.5">
                  <h2 className={`text-xl font-extrabold font-heading tracking-tight ${isDarkCard ? 'text-white' : 'text-zinc-950'}`}>
                    {plan.name}
                  </h2>
                  <p className={`text-xs font-medium leading-relaxed min-h-[38px] ${isDarkCard ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {plan.tagline}
                  </p>
                </div>

                {/* Price Display */}
                <div className={`my-5 pb-5 border-b ${isDarkCard ? 'border-zinc-800' : 'border-zinc-100'}`}>
                  {plan.isCustomPrice ? (
                    <div>
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
                        Custom
                      </span>
                      <p className="text-[11px] text-zinc-400 font-medium mt-1.5">{plan.trialNote}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black tracking-tight font-heading tabular-nums text-zinc-950">
                          ${price}
                        </span>
                        <span className="text-xs font-bold text-zinc-500">
                          / month {billingCycle === 'annual' ? 'billed annually' : 'billed monthly'}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold mt-1.5 text-emerald-700">{plan.trialNote}</p>
                    </div>
                  )}
                </div>

                {/* Feature List */}
                <div className="space-y-2.5 mb-6">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider font-mono block text-zinc-400">
                    Included Capabilities
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2.5 text-xs font-medium ${isDarkCard ? 'text-zinc-200' : 'text-zinc-800'}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isDarkCard ? 'bg-indigo-500 text-white' : 'bg-zinc-950 text-white'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}

                  {plan.limitations.map((lim, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-400 font-medium py-0.5">
                      <div className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0">
                        <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                      </div>
                      <span className="truncate">{lim}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {plan.actionType === 'contact-sales' ? (
                  <button
                    type="button"
                    onClick={() => setIsContactSalesOpen(true)}
                    className="w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Contact Sales</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={plan.isCurrent}
                    onClick={() => handleSelectSelfServePlan(plan)}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 ${
                      plan.isCurrent
                        ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-default'
                        : plan.popular
                        ? 'bg-zinc-950 hover:bg-zinc-800 text-white cursor-pointer'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 cursor-pointer'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    {!plan.isCurrent && <ArrowRight className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transparent Overage Policy Card */}
      <div className="max-w-6xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Transparent Quota &amp; Soft-Cap Protection</span>
            </div>
            <h3 className="text-xl font-bold text-white font-heading">
              Zero Support Interruptions with Soft-Cap Protection
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              We never cut off your AI support widgets unexpectedly. When your workspace exceeds its monthly message allocation, additional traffic is handled automatically and billed at a predictable <strong>$10 per 1,000 extra messages</strong>.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center min-w-[140px]">
              <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono block">Extra Message Rate</span>
              <span className="text-lg font-extrabold text-white font-mono tabular-nums">$10 / 1k</span>
              <span className="text-[10px] text-emerald-400 font-semibold block">Zero downtime</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-center min-w-[140px]">
              <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono block">BYOK API Support</span>
              <span className="text-lg font-extrabold text-white font-mono">Ultra &amp; Ent</span>
              <span className="text-[10px] text-amber-400 font-semibold block">Unlimited volume</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="max-w-6xl mx-auto bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-xl mb-6">
          <h3 className="text-xl font-extrabold text-zinc-950 font-heading">Detailed Capability Matrix</h3>
          <p className="text-xs text-zinc-500 font-medium">
            Compare features, model access, compliance standards, and limits ({billingCycle === 'annual' ? 'annual rate shown' : 'monthly rate shown'}).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
                <th className="py-3.5 px-4 font-bold">Capability</th>
                <th className="py-3.5 px-4 font-bold text-center text-zinc-950 bg-zinc-50 border-x border-zinc-200 tabular-nums">
                  NomadsChat Pro (${proPrice}/mo)
                </th>
                <th className="py-3.5 px-4 font-bold text-center text-zinc-950 tabular-nums">
                  Enterprise Ultra (${ultraPrice}/mo)
                </th>
                <th className="py-3.5 px-4 font-bold text-center text-indigo-700 bg-indigo-50/50 border-x border-indigo-200">
                  Enterprise (Custom)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
              <tr>
                <td className="py-3.5 px-4 font-bold">Monthly Included AI Messages</td>
                <td className="py-3.5 px-4 text-center font-black text-zinc-950 bg-zinc-50/50 border-x border-zinc-200 tabular-nums">
                  10,000
                </td>
                <td className="py-3.5 px-4 text-center font-bold tabular-nums">100,000+</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-x border-indigo-200">
                  Custom Unlimited
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">3-Day Free Trial</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-700 bg-zinc-50/50 border-x border-zinc-200">
                  Full Access ($0 Today)
                </td>
                <td className="py-3.5 px-4 text-center text-zinc-500">Available on request</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-x border-indigo-200">
                  POC Available
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Message Overage Policy</td>
                <td className="py-3.5 px-4 text-center text-emerald-700 font-semibold bg-zinc-50/50 border-x border-zinc-200">
                  Soft Cap ($10 / 1k msgs)
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-700 font-semibold">
                  Soft Cap ($10 / 1k msgs)
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-x border-indigo-200">
                  Committed Tier
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Bring Your Own API Key (BYOK)</td>
                <td className="py-3.5 px-4 text-center text-zinc-400 bg-zinc-50/50 border-x border-zinc-200">
                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                    <Lock className="w-3 h-3" /> Ultra+ Only
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-700 font-bold">
                  Included (Gemini &amp; OpenAI)
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-x border-indigo-200">
                  Vertex AI &amp; Custom Endpoints
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Knowledge Base Sources</td>
                <td className="py-3.5 px-4 text-center font-bold text-zinc-950 bg-zinc-50/50 border-x border-zinc-200">
                  Unlimited Web Scrapes + Docs
                </td>
                <td className="py-3.5 px-4 text-center font-bold">Dedicated RAG Indexer</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-x border-indigo-200">
                  VPC Indexer &amp; Realtime S3 Sync
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Live Human Takeover Inbox</td>
                <td className="py-3.5 px-4 text-center text-zinc-950 font-bold bg-zinc-50/50 border-x border-zinc-200">
                  Included
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-zinc-950">Included</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-x border-indigo-200">
                  Multi-Team Routing
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">White-Label &amp; Custom Branding</td>
                <td className="py-3.5 px-4 text-center text-zinc-950 font-bold bg-zinc-50/50 border-x border-zinc-200">
                  Remove &quot;Powered By&quot;
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-zinc-950">Full White-Label</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-x border-indigo-200">
                  Custom CNAME &amp; Domain
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">SSO &amp; Security Compliance</td>
                <td className="py-3.5 px-4 text-center text-zinc-400 bg-zinc-50/50 border-x border-zinc-200">—</td>
                <td className="py-3.5 px-4 text-center text-zinc-400">—</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-700 bg-indigo-50/20 border-x border-indigo-200">
                  SAML 2.0 / Okta + Audit Package
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 font-heading">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium">
            Everything you need to know about subscriptions, trial accounting, and features.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden transition">
              <button
                type="button"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-zinc-950 hover:bg-zinc-50 transition cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                    openFaqIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {openFaqIndex === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Enterprise Contact Banner */}
      <div className="max-w-6xl mx-auto bg-zinc-950 rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-zinc-800">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider font-mono">
            <Building2 className="w-4 h-4" />
            <span>Need Custom Volume or Enterprise Procurement?</span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight font-heading">
            Speak with our solutions engineering team
          </h3>
          <p className="text-xs text-zinc-300 font-medium max-w-xl">
            Custom message quotas, private VPC deployments, security documentation, and dedicated account management.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsContactSalesOpen(true)}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contact Sales</span>
          </button>
        </div>
      </div>

      {selectedCheckoutPlan && (
        <ShopifyCheckoutModal
          isOpen={!!selectedCheckoutPlan}
          onClose={() => setSelectedCheckoutPlan(null)}
          planId={selectedCheckoutPlan.id}
          planName={selectedCheckoutPlan.name}
          monthlyPrice={selectedCheckoutPlan.monthlyPrice}
          annualPrice={selectedCheckoutPlan.annualPrice}
          initialBillingCycle={billingCycle}
        />
      )}

      <ContactSalesModal isOpen={isContactSalesOpen} onClose={() => setIsContactSalesOpen(false)} />
    </div>
  );
};
