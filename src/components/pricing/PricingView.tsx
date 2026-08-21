import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { CheckoutModal } from './CheckoutModal';
import { PaymentGatewaysModal } from './PaymentGatewaysModal';
import { Check, Sparkles, Zap, Shield, HelpCircle, ArrowRight, Bot, MessageSquare, Layers, Users, Headphones, CheckCircle2, DollarSign, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { MotionButton } from '../common/MotionButton';

interface PricingViewProps {
  onOpenAuthModal?: () => void;
  onNavigateToFaq?: () => void;
}

export const PricingView: React.FC<PricingViewProps> = ({ onOpenAuthModal, onNavigateToFaq }) => {
  const { tenant, switchPlan } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [isGatewaysModalOpen, setIsGatewaysModalOpen] = useState(false);

  // Checkout modal state
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<{
    id: 'Free' | 'Pro' | 'Enterprise';
    name: string;
    monthlyPrice: number;
    annualPrice: number;
  } | null>(null);

  const plans = [
    {
      id: 'Free',
      name: 'Starter',
      tagline: 'Ideal for small projects & testing AI support widgets.',
      monthlyPrice: 0,
      annualPrice: 0,
      popular: false,
      badge: 'Free Forever',
      features: [
        '1 AI Chatbot Instance',
        '500 Messages / month',
        '1 Knowledge Base Source (URL or PDF)',
        'Gemini 3.6 Flash Engine',
        'Standard Chat Widget Theme',
        'Community Forum Support',
      ],
      limitations: [
        'Custom branding removal',
        'Human operator live takeover',
        'Automated lead routing to CRM',
      ],
      ctaText: tenant.plan === 'Free' ? 'Current Active Plan' : 'Select Free Plan',
      isCurrent: tenant.plan === 'Free',
    },
    {
      id: 'Pro',
      name: 'Growth Pro',
      tagline: 'For fast-growing startups & high-converting support teams.',
      monthlyPrice: 49,
      annualPrice: 39,
      popular: true,
      badge: 'Most Popular',
      features: [
        'Up to 5 AI Chatbots',
        '10,000 Messages / month',
        'Unlimited Knowledge Base Sources (Web Scraper + Documents + Notion)',
        'Gemini 3.6 Flash & Gemini 3.1 Pro Models',
        'Remove "Powered by NomadsChat" Branding',
        'Live Agent Human Takeover Inbox',
        'Lead Generation & Visitor Email Collector',
        'Custom Color & Font Widget Themes',
        'Priority Email & Chat Support',
      ],
      limitations: [],
      ctaText: tenant.plan === 'Pro' ? 'Current Active Plan' : 'Upgrade to Pro',
      isCurrent: tenant.plan === 'Pro',
    },
    {
      id: 'Enterprise',
      name: 'Enterprise Ultra',
      tagline: 'For high-scale companies with custom security & SLA needs.',
      monthlyPrice: 199,
      annualPrice: 159,
      popular: false,
      badge: 'Maximum Power',
      features: [
        'Unlimited AI Chatbots',
        '100,000+ Messages / month',
        'Dedicated RAG Indexer & Instant Web Crawler',
        'Gemini 3.1 Pro & Custom Fine-Tuned System Prompts',
        'Custom Domain Embed & White-Label Webhooks',
        'Multi-Agent Team Routing & Assignment',
        'SSO / SAML Security & SOC2 Compliance',
        'Dedicated Account Manager & 99.9% SLA',
      ],
      limitations: [],
      ctaText: tenant.plan === 'Enterprise' ? 'Current Active Plan' : 'Upgrade to Enterprise',
      isCurrent: tenant.plan === 'Enterprise',
    },
  ];

  return (
    <div className="space-y-12 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-black text-white border border-black px-3.5 py-1 rounded-full text-xs font-bold tracking-tight shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>Simple, Transparent Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight leading-tight">
          Scale customer support with <br /> zero friction
        </h1>
        <p className="text-zinc-600 text-sm font-medium leading-relaxed">
          Deploy grounded AI chatbots trained on your company knowledge base. Upgrade or downgrade anytime as your support volume grows.
        </p>

        {/* Admin Payout & Payment Gateways Config Bar */}
        <div className="pt-2">
          <MotionButton
            variant="dark"
            size="md"
            shimmer
            onClick={() => setIsGatewaysModalOpen(true)}
            leftIcon={<DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />}
          >
            <span className="font-heading">Configure Payment Gateways & Payouts</span>
            <span className="ml-2 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              PayPal • Cards • G Pay • Apple Pay
            </span>
          </MotionButton>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-xs font-bold font-heading ${billingCycle === 'monthly' ? 'text-zinc-950' : 'text-zinc-400'}`}>
            Monthly Billing
          </span>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="w-12 h-6 bg-zinc-950 rounded-full p-1 relative transition-colors duration-200 focus:outline-hidden cursor-pointer"
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
            <span className={`text-xs font-bold font-heading ${billingCycle === 'annual' ? 'text-zinc-950' : 'text-zinc-400'}`}>
              Annual Billing
            </span>
            <span className="bg-zinc-950 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              Save 20%
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map(plan => {
          const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className={`relative rounded-3xl bg-white border p-7 flex flex-col justify-between shadow-sm ${
                plan.popular
                  ? 'border-zinc-950 ring-2 ring-zinc-950/10 shadow-xl'
                  : 'border-zinc-200/90 hover:border-zinc-400/80 hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-zinc-950 text-white text-[11px] font-extrabold px-4 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1.5 border border-zinc-800 font-mono">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div>
                {/* Plan Title & Tagline */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-extrabold text-zinc-950 font-heading">{plan.name}</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1 min-h-[32px] leading-relaxed font-body">{plan.tagline}</p>
                  </div>
                  {plan.isCurrent && (
                    <span className="bg-zinc-950 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-zinc-950 uppercase tracking-wider font-mono">
                      Active
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="my-6 pb-6 border-b border-zinc-100">
                  <div className="flex items-baseline gap-1 font-heading">
                    <span className="text-4xl sm:text-5xl font-extrabold text-zinc-950 tracking-tight">${price}</span>
                    <span className="text-xs text-zinc-500 font-bold">/ month</span>
                  </div>
                  {billingCycle === 'annual' && price > 0 && (
                    <p className="text-[11px] text-zinc-800 font-bold mt-1 font-body">Billed annually (${price * 12}/yr)</p>
                  )}
                </div>

                {/* Feature List */}
                <div className="space-y-3 mb-8">
                  <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider font-mono">Included Features</p>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-800 font-medium font-body">
                      <div className="w-4 h-4 rounded-full bg-zinc-950 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}

                  {plan.limitations.map((lim, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-400 line-through font-body">
                      <div className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold">×</span>
                      </div>
                      <span>{lim}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <MotionButton
                variant={plan.isCurrent ? 'secondary' : plan.popular ? 'dark' : 'primary'}
                size="lg"
                shimmer={!plan.isCurrent}
                fullWidth
                disabled={plan.isCurrent}
                onClick={() => {
                  if (plan.isCurrent) return;
                  if (plan.id === 'Free') {
                    switchPlan('Free');
                  } else {
                    setSelectedCheckoutPlan({
                      id: plan.id as 'Free' | 'Pro' | 'Enterprise',
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
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-xl mb-6">
          <h3 className="text-xl font-extrabold text-black">Detailed Capability Matrix</h3>
          <p className="text-xs text-zinc-500 font-medium">Compare specific operational features across all plan tiers.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="py-3.5 px-4 font-bold">Feature / Capability</th>
                <th className="py-3.5 px-4 font-bold text-center">Starter (Free)</th>
                <th className="py-3.5 px-4 font-bold text-center text-black bg-zinc-100 rounded-t-xl border-x border-zinc-200">Pro ($39/mo)</th>
                <th className="py-3.5 px-4 font-bold text-center">Enterprise ($159/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-800 font-medium">
              <tr>
                <td className="py-3.5 px-4 font-bold">Monthly AI Messages</td>
                <td className="py-3.5 px-4 text-center">500</td>
                <td className="py-3.5 px-4 text-center font-extrabold text-black bg-zinc-50 border-x border-zinc-200">10,000</td>
                <td className="py-3.5 px-4 text-center font-bold">100,000+</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Knowledge Base Documents & Web Scrapes</td>
                <td className="py-3.5 px-4 text-center">1 Source</td>
                <td className="py-3.5 px-4 text-center font-extrabold text-black bg-zinc-50 border-x border-zinc-200">Unlimited</td>
                <td className="py-3.5 px-4 text-center font-bold">Unlimited + Custom API</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Gemini 3.6 Flash / 3.1 Pro LLM Engine</td>
                <td className="py-3.5 px-4 text-center">Flash Only</td>
                <td className="py-3.5 px-4 text-center text-black bg-zinc-50 font-bold border-x border-zinc-200">Both Models</td>
                <td className="py-3.5 px-4 text-center">Both Models + Fine-Tuning</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Human Operator Live Chat Takeover</td>
                <td className="py-3.5 px-4 text-center text-zinc-300">—</td>
                <td className="py-3.5 px-4 text-center text-black bg-zinc-50 font-extrabold border-x border-zinc-200">✓ Included</td>
                <td className="py-3.5 px-4 text-center text-black font-extrabold">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Visitor Lead Email Capture</td>
                <td className="py-3.5 px-4 text-center text-zinc-300">—</td>
                <td className="py-3.5 px-4 text-center text-black bg-zinc-50 font-extrabold border-x border-zinc-200">✓ Included</td>
                <td className="py-3.5 px-4 text-center text-black font-extrabold">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-bold">Widget Customization & Branding Removal</td>
                <td className="py-3.5 px-4 text-center text-zinc-300">—</td>
                <td className="py-3.5 px-4 text-center text-black bg-zinc-50 font-extrabold border-x border-zinc-200">✓ Included</td>
                <td className="py-3.5 px-4 text-center text-black font-extrabold">✓ White-Label</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="bg-black rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/40 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500" />
        <div className="space-y-2 relative z-10">
          <h3 className="text-2xl font-extrabold tracking-tight">Ready to automate 70%+ of support queries?</h3>
          <p className="text-xs text-zinc-300 font-medium">
            Start completely free. No credit card required to build and embed your first chatbot.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 relative z-10">
          <MotionButton
            variant="secondary"
            size="md"
            shimmer
            onClick={onOpenAuthModal}
          >
            Create Free Account
          </MotionButton>
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

      {/* Checkout Modal */}
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

      {/* Admin Payment Gateways & Payout Setup Modal */}
      <PaymentGatewaysModal
        isOpen={isGatewaysModalOpen}
        onClose={() => setIsGatewaysModalOpen(false)}
      />
    </div>
  );
};
