import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { CheckoutModal } from './CheckoutModal';
import { ContactSalesModal } from './ContactSalesModal';
import {
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  Lock,
  Building2,
  HelpCircle,
  Key,
  ShieldCheck,
  FileCheck2,
  PhoneCall,
  Flame,
  Info,
} from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import { GEMINI_CONFIG } from '../../config/models';
import { TenantPlan } from '../../types';

interface PricingViewProps {
  onOpenAuthModal?: () => void;
  onNavigateToFaq?: () => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onOpenAuthModal, onNavigateToFaq }) => {
  const { tenant, switchPlan } = useAuth();
  const currentPlan = tenant?.plan || 'Free';
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Checkout modal state (self-serve plans)
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<{
    id: TenantPlan;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
  } | null>(null);

  // Enterprise contact sales modal state
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);

  const plans = [
    {
      id: 'Free' as TenantPlan,
      name: 'Starter',
      tagline: 'Ideal for small projects & testing AI support widgets.',
      monthlyPrice: 0,
      annualPrice: 0,
      isCustomPrice: false,
      popular: false,
      badge: 'Free Forever',
      features: [
        '1 AI Chatbot Instance',
        '500 Messages / month',
        '1 Knowledge Base Source (URL or Document)',
        GEMINI_CONFIG.flash.engineLabel,
        'Standard Chat Widget Theme',
        'Community Forum Support',
      ],
      limitations: [
        'Custom branding removal',
        'Live agent takeover inbox',
        'Bring Your Own API Key (BYOK)',
        'Automated CRM lead routing',
      ],
      ctaText: currentPlan === 'Free' ? 'Current Active Plan' : 'Select Free Plan',
      isCurrent: currentPlan === 'Free',
      actionType: 'self-serve' as const,
    },
    {
      id: 'Pro' as TenantPlan,
      name: 'Growth Pro',
      tagline: 'For fast-growing startups & high-converting support teams.',
      monthlyPrice: 49,
      annualPrice: 39,
      isCustomPrice: false,
      popular: true,
      badge: 'Most Popular',
      features: [
        'Up to 5 AI Chatbots',
        '10,000 Messages / month',
        'Unlimited Knowledge Base Sources (Web Crawler + Docs + Notion)',
        `${GEMINI_CONFIG.flash.name} & ${GEMINI_CONFIG.pro.name} Models`,
        'Remove "Powered by NomadsChat" Branding',
        'Live Agent Human Takeover Inbox',
        'Lead Generation & Visitor Email Collector',
        'Custom Color & Font Widget Themes',
        'Priority Email & Chat Support',
      ],
      limitations: [
        'Bring Your Own API Key (BYOK)',
        'SSO / SAML 2.0 Authentication',
      ],
      ctaText: currentPlan === 'Pro' ? 'Current Active Plan' : 'Upgrade to Pro',
      isCurrent: currentPlan === 'Pro',
      actionType: 'self-serve' as const,
    },
    {
      id: 'Ultra' as TenantPlan,
      name: 'Enterprise Ultra',
      tagline: 'High-scale infrastructure for high-traffic platforms & agencies.',
      monthlyPrice: 199,
      annualPrice: 159,
      isCustomPrice: false,
      popular: false,
      badge: 'High Scale',
      features: [
        'Unlimited AI Chatbots',
        '100,000+ Messages / month',
        'Dedicated RAG Indexer & Instant Web Crawler',
        `${GEMINI_CONFIG.pro.name} & Custom Fine-Tuned System Prompts`,
        'Custom Domain Embed & White-Label Webhooks',
        'Multi-Agent Team Routing & Assignment',
        'Bring Your Own API Key (Gemini & OpenAI)',
        'Priority 24/7 Phone & Slack Support',
      ],
      limitations: [],
      ctaText: currentPlan === 'Ultra' ? 'Current Active Plan' : 'Upgrade to Ultra',
      isCurrent: currentPlan === 'Ultra',
      actionType: 'self-serve' as const,
    },
    {
      id: 'Enterprise' as TenantPlan,
      name: 'Enterprise',
      tagline: 'Custom quote & dedicated architecture for global enterprises.',
      monthlyPrice: 0,
      annualPrice: 0,
      isCustomPrice: true,
      popular: false,
      badge: 'Sales-Assisted',
      features: [
        'Everything in Enterprise Ultra +',
        'Single Sign-On (SSO / SAML 2.0 & Okta / Azure AD)',
        'SOC 2 Type II Compliance & Audit Package',
        'Custom Master Services Agreement (MSA) & 99.99% SLA',
        'Dedicated Solutions Architect & Custom Onboarding',
        'Custom Data Processing Agreement (DPA) & EU Data Residency',
        'Bring Your Own Key (Vertex AI, Azure OpenAI & Custom Endpoints)',
      ],
      limitations: [],
      ctaText: currentPlan === 'Enterprise' ? 'Current Active Plan' : 'Contact Sales',
      isCurrent: currentPlan === 'Enterprise',
      actionType: 'contact-sales' as const,
    },
  ];

  return (
    <div className="space-y-14 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-1 rounded-full text-xs font-bold tracking-tight shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simple, Transparent & Scalable Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-tight">
          Scale customer support with <br className="hidden sm:inline" /> zero friction
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base font-medium leading-relaxed">
          Deploy grounded AI chatbots trained on your company knowledge base. Upgrade, downgrade, or connect custom enterprise models anytime.
        </p>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-3 pt-3">
          <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-950 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
            Monthly Billing
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-12 h-6 bg-slate-950 dark:bg-slate-700 rounded-full p-1 relative transition-colors duration-200 focus:outline-none cursor-pointer"
            aria-label="Toggle billing cycle between monthly and annual"
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`w-4 h-4 bg-white rounded-full shadow-md ${
                billingCycle === 'annual' ? 'ml-6' : 'ml-0'
              }`}
            />
          </motion.button>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-slate-950 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
              Annual Billing
            </span>
            <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Save 20%
            </span>
          </div>
        </div>
      </div>

      {/* 4 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {plans.map(plan => {
          const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className={`relative rounded-2xl bg-white dark:bg-slate-900 border p-6 flex flex-col justify-between shadow-sm ${
                plan.popular
                  ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl'
                  : plan.actionType === 'contact-sales'
                  ? 'border-slate-800 dark:border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 text-white dark:from-slate-900 dark:to-slate-950'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-extrabold px-3.5 py-0.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                  <span>{plan.badge}</span>
                </div>
              )}

              {plan.actionType === 'contact-sales' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 text-indigo-300 text-[11px] font-extrabold px-3.5 py-0.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Building2 className="w-3 h-3" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div>
                {/* Plan Title & Tagline */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className={`text-xl font-extrabold ${plan.actionType === 'contact-sales' ? 'text-white' : 'text-slate-950 dark:text-white'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs font-medium mt-1 min-h-[32px] leading-relaxed ${plan.actionType === 'contact-sales' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      {plan.tagline}
                    </p>
                  </div>
                  {plan.isCurrent && (
                    <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      Active
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className={`my-5 pb-5 border-b ${plan.actionType === 'contact-sales' ? 'border-slate-800' : 'border-slate-100 dark:border-slate-800'}`}>
                  {plan.isCustomPrice ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Custom</span>
                      </div>
                      <p className="text-[11px] text-indigo-300 font-medium mt-1">
                        Sales-assisted quote tailored to volume
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-extrabold tracking-tight ${plan.actionType === 'contact-sales' ? 'text-white' : 'text-slate-950 dark:text-white'}`}>
                          ${price}
                        </span>
                        <span className={`text-xs font-bold ${plan.actionType === 'contact-sales' ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          / month
                        </span>
                      </div>
                      {billingCycle === 'annual' && price > 0 && (
                        <p className={`text-[11px] font-semibold mt-1 ${plan.actionType === 'contact-sales' ? 'text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`}>
                          Billed annually (${price * 12}/yr)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Feature List */}
                <div className="space-y-2.5 mb-6">
                  <p className={`text-[10px] font-extrabold uppercase tracking-wider font-mono ${plan.actionType === 'contact-sales' ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    Included Capabilities
                  </p>
                  {plan.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 text-xs font-medium ${plan.actionType === 'contact-sales' ? 'text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.actionType === 'contact-sales'
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}

                  {plan.limitations.map((lim, idx) => (
                    <div
                      key={idx}
                      className="group/item relative flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium py-0.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center shrink-0">
                          <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                        </div>
                        <span className="truncate">{lim}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono shrink-0 transition-colors group-hover/item:text-slate-900 dark:group-hover/item:text-white">
                        Upgrade
                      </span>
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
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <span>Contact Sales</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <MotionButton
                    variant={plan.isCurrent ? 'secondary' : plan.popular ? 'primary' : 'dark'}
                    size="lg"
                    shimmer={!plan.isCurrent && plan.popular}
                    fullWidth
                    disabled={plan.isCurrent}
                    onClick={() => {
                      if (plan.isCurrent) return;
                      if (plan.id === 'Free') {
                        switchPlan('Free');
                      } else {
                        setSelectedCheckoutPlan({
                          id: plan.id,
                          name: plan.name,
                          monthlyPrice: plan.monthlyPrice,
                          annualPrice: plan.annualPrice,
                        });
                      }
                    }}
                    rightIcon={!plan.isCurrent ? <ArrowRight className="w-4 h-4" /> : undefined}
                  >
                    {plan.ctaText}
                  </MotionButton>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Explicit Transparent Overage Policy Card */}
      <div className="bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Transparent Quota & Overage Policy</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Zero Support Interruptions with Soft-Cap Protection
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              We never cut off your customers unexpectedly. On paid plans (<strong>Growth Pro</strong> & <strong>Enterprise Ultra</strong>), when your workspace exceeds its monthly message allocation, the platform continues handling 100% of visitor traffic. Additional volume is automatically billed at a predictable <strong>$10 per 1,000 extra messages</strong> at cycle close. On Starter (Free), bots automatically pause at 500 messages until cycle reset.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-center min-w-[140px] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Paid Overage Rate</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">$10 / 1k</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Zero downtime</span>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-center min-w-[140px] shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">BYOK Tier Support</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">Ultra &amp; Ent</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block">Unlimited volume</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Comparison Table (4 Tiers) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-xl mb-6">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Detailed Capability Matrix</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Compare specific operational features, compliance standards, and quotas across all 4 tiers.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3.5 px-4 font-bold">Feature / Capability</th>
                <th className="py-3.5 px-4 font-bold text-center">Starter (Free)</th>
                <th className="py-3.5 px-4 font-bold text-center text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 border-x border-slate-200 dark:border-slate-800">
                  Growth Pro ($39/mo)
                </th>
                <th className="py-3.5 px-4 font-bold text-center">Enterprise Ultra ($159/mo)</th>
                <th className="py-3.5 px-4 font-bold text-center text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-t-xl border-x border-indigo-200 dark:border-indigo-900/50">
                  Enterprise (Custom)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200 font-medium">
              <tr>
                <td className="py-3.5 px-4 font-bold">Monthly Included AI Messages</td>
                <td className="py-3.5 px-4 text-center">500</td>
                <td className="py-3.5 px-4 text-center font-extrabold text-slate-950 dark:text-white bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">
                  10,000
                </td>
                <td className="py-3.5 px-4 text-center font-bold">100,000+</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  Custom Unlimited Quota
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Message Overage Policy</td>
                <td className="py-3.5 px-4 text-center text-slate-500">Hard Cap (Pauses at 500)</td>
                <td className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-semibold bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">
                  Soft Cap ($10 / 1k msgs)
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-semibold">
                  Soft Cap ($10 / 1k msgs)
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  Custom Committed Tiers
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Bring Your Own API Key (BYOK)</td>
                <td className="py-3.5 px-4 text-center text-slate-400">
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><Lock className="w-3 h-3" /> Locked</span>
                </td>
                <td className="py-3.5 px-4 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><Lock className="w-3 h-3" /> Locked</span>
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Included (Gemini &amp; OpenAI)
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  ✓ Included (Vertex AI, Azure &amp; Custom)
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Knowledge Base Sources &amp; Web Scrapes</td>
                <td className="py-3.5 px-4 text-center">1 Source</td>
                <td className="py-3.5 px-4 text-center font-extrabold text-slate-950 dark:text-white bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">
                  Unlimited Sources
                </td>
                <td className="py-3.5 px-4 text-center font-bold">Dedicated RAG Indexer</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  Real-Time VPC Indexing &amp; S3 Sync
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">{GEMINI_CONFIG.matrixLabel}</td>
                <td className="py-3.5 px-4 text-center">Flash Only</td>
                <td className="py-3.5 px-4 text-center text-slate-900 dark:text-white font-bold bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">
                  Flash + Pro Models
                </td>
                <td className="py-3.5 px-4 text-center">Flash, Pro + Custom Fine-Tuning</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  Custom Fine-Tuning &amp; LoRA Adapters
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Live Agent Human Takeover Inbox</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600">—</td>
                <td className="py-3.5 px-4 text-center text-slate-900 dark:text-white font-extrabold bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">
                  ✓ Included
                </td>
                <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 dark:text-white">✓ Included</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  ✓ Advanced Multi-Queue Routing
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Visitor Lead Capture &amp; CRM Webhooks</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600">—</td>
                <td className="py-3.5 px-4 text-center text-slate-900 dark:text-white font-extrabold bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">
                  ✓ Included
                </td>
                <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 dark:text-white">✓ Included</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  ✓ Salesforce &amp; HubSpot Bi-Directional
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">White-Label &amp; Remove Branding</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600">—</td>
                <td className="py-3.5 px-4 text-center text-slate-900 dark:text-white font-extrabold bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">
                  ✓ Included
                </td>
                <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 dark:text-white">✓ Full White-Label</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  ✓ Full White-Label + Custom CNAME
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">SSO &amp; SAML 2.0 (Okta, Azure AD, Ping)</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600">—</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">—</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600">—</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  ✓ Included (SAML / OIDC / SCIM)
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">SOC 2 Type II &amp; Security Compliance Package</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600">—</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">—</td>
                <td className="py-3.5 px-4 text-center text-slate-300 dark:text-slate-600">—</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  ✓ Included + Annual Audit Reports
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Service Level Agreement (SLA) &amp; Support</td>
                <td className="py-3.5 px-4 text-center text-slate-500">Community</td>
                <td className="py-3.5 px-4 text-center text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-800/30 border-x border-slate-200 dark:border-slate-800">
                  Priority Email &amp; Chat
                </td>
                <td className="py-3.5 px-4 text-center text-slate-800 dark:text-slate-200">
                  24/7 Phone &amp; Slack Channel
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/10 border-x border-indigo-200 dark:border-indigo-900/50">
                  99.99% Uptime SLA + Dedicated Architect
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise Contact & Conversion Banner */}
      <div className="bg-slate-950 dark:bg-slate-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider font-mono">
            <Building2 className="w-4 h-4" />
            <span>Need Custom Volume or Enterprise Procurement?</span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight">Speak with our enterprise solutions architects</h3>
          <p className="text-xs text-slate-300 font-medium max-w-xl">
            Custom message quotas, private VPC deployments, strict SOC 2 audit reports, and dedicated account engineering.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => setIsContactSalesOpen(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contact Sales</span>
          </button>
          {onNavigateToFaq && (
            <MotionButton
              variant="dark"
              size="md"
              onClick={onNavigateToFaq}
            >
              Read FAQs
            </MotionButton>
          )}
        </div>
      </div>

      {/* Checkout Modal (Self-Serve) */}
      {selectedCheckoutPlan && (
        <CheckoutModal
          isOpen={!!selectedCheckoutPlan}
          onClose={() => setSelectedCheckoutPlan(null)}
          planId={selectedCheckoutPlan.id}
          planName={selectedCheckoutPlan.name}
          monthlyPrice={selectedCheckoutPlan.monthlyPrice}
          annualPrice={selectedCheckoutPlan.annualPrice}
          initialBillingCycle={billingCycle}
        />
      )}

      {/* Enterprise Contact Sales Modal (Sales-Assisted) */}
      <ContactSalesModal
        isOpen={isContactSalesOpen}
        onClose={() => setIsContactSalesOpen(false)}
      />
    </div>
  );
};
