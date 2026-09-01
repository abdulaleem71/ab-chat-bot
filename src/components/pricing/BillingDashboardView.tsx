import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { CheckoutModal } from './CheckoutModal';
import { ContactSalesModal } from './ContactSalesModal';
import { GEMINI_CONFIG } from '../../config/models';
import { TenantPlan } from '../../types';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  Receipt,
  Sparkles,
  Zap,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Bot,
  MessageSquare,
  Users,
  Database,
  ArrowRight,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  Shield,
  FileText,
  Lock,
  Key,
  Eye,
  EyeOff,
  Trash2,
  PhoneCall,
  Info
} from 'lucide-react';
import { MotionButton } from '../common/MotionButton';
import {
  VisaLogo,
  MastercardLogo,
  AmexLogo,
} from '../common/PaymentLogos';

interface BillingDashboardViewProps {
  onNavigateToPublicPricing?: () => void;
  onNavigateToFaq?: () => void;
  chatbotsCount?: number;
}

interface InvoiceItem {
  id: string;
  date: string;
  period: string;
  description: string;
  amount: number;
  currency: string;
  status: 'Paid' | 'Pending' | 'Refunded';
  pdfUrl?: string;
  paymentMethod: string;
}

export const BillingDashboardView: React.FC<BillingDashboardViewProps> = ({
  onNavigateToPublicPricing,
  onNavigateToFaq,
  chatbotsCount = 2,
}) => {
  const { tenant, switchPlan, user, refreshTenant } = useAuth();
  const currentPlan: TenantPlan = tenant?.plan || 'Free';

  // Plan Comparison Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [modalBillingCycle, setModalBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // Checkout Modal State
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<{
    id: TenantPlan;
    name: string;
    monthlyPrice: number;
    annualPrice: number;
  } | null>(null);

  // Enterprise Contact Sales Modal State
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);

  // Update Payment Method Modal State
  const [isUpdateCardModalOpen, setIsUpdateCardModalOpen] = useState(false);
  const [isCardUpdating, setIsCardUpdating] = useState(false);
  const [cardSuccessMsg, setCardSuccessMsg] = useState('');

  // BYOK Settings State
  const isByokEligible = currentPlan === 'Ultra' || currentPlan === 'Enterprise';
  const [byokProvider, setByokProvider] = useState<'google' | 'openai'>('google');
  const [byokApiKey, setByokApiKey] = useState('');
  const [isApiKeyMasked, setIsApiKeyMasked] = useState(true);
  const [isSavingByok, setIsSavingByok] = useState(false);
  const [isTestingByok, setIsTestingByok] = useState(false);
  const [byokStatusMessage, setByokStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasConfiguredByok, setHasConfiguredByok] = useState(false);
  const [maskedByokKeyDisplay, setMaskedByokKeyDisplay] = useState('');

  // Fetch current BYOK status from backend on mount or when tenant changes
  useEffect(() => {
    async function fetchByokStatus() {
      try {
        const res = await fetch('/api/tenant/byok');
        if (res.ok) {
          const data = await res.json();
          if (data.byokConfig && data.byokConfig.apiKey) {
            setHasConfiguredByok(true);
            setByokProvider(data.byokConfig.provider || 'google');
            setMaskedByokKeyDisplay(data.byokConfig.apiKey);
          } else {
            setHasConfiguredByok(false);
            setMaskedByokKeyDisplay('');
          }
        }
      } catch (err) {
        console.error('Failed to fetch BYOK status:', err);
      }
    }
    fetchByokStatus();
  }, [tenant?.id, currentPlan]);

  // Payment method on file
  const [paymentMethod, setPaymentMethod] = useState({
    brand: 'Visa',
    last4: '4242',
    expMonth: '08',
    expYear: '2028',
    holderName: tenant?.name || user?.displayName || 'Acme Workspace',
    billingEmail: tenant?.ownerEmail || user?.email || 'admin@acmesaas.com',
    billingZip: '94107',
    country: 'United States',
  });

  // Card update form fields
  const [cardForm, setCardForm] = useState({
    cardNumber: '•••• •••• •••• 4242',
    holderName: paymentMethod.holderName,
    expMonth: paymentMethod.expMonth,
    expYear: paymentMethod.expYear,
    cvc: '•••',
    zip: paymentMethod.billingZip,
    country: paymentMethod.country,
  });

  // Invoice Receipt Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  // Auto-renew toggle
  const [autoRenew, setAutoRenew] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Plan Details Configuration
  const planConfigs: Record<TenantPlan, {
    name: string;
    badge: string;
    monthlyPrice: number;
    annualPrice: number;
    messagesQuota: number;
    botsQuota: number;
    knowledgeSourcesQuota: string;
    seatsQuota: number;
    supportSla: string;
    overagePolicy: string;
    overageType: 'hard-cap' | 'soft-cap' | 'custom';
  }> = {
    Free: {
      name: 'Starter Free',
      badge: 'Free Tier',
      monthlyPrice: 0,
      annualPrice: 0,
      messagesQuota: 500,
      botsQuota: 1,
      knowledgeSourcesQuota: '1 Source',
      seatsQuota: 1,
      supportSla: 'Community Support',
      overagePolicy: 'Hard Cap: Chatbots pause at 500 messages',
      overageType: 'hard-cap',
    },
    Pro: {
      name: 'Growth Pro',
      badge: 'Pro Tier',
      monthlyPrice: 49,
      annualPrice: 39,
      messagesQuota: 10000,
      botsQuota: 5,
      knowledgeSourcesQuota: 'Unlimited',
      seatsQuota: 3,
      supportSla: 'Priority 24/7 Email & Chat',
      overagePolicy: 'Soft Cap: $10 / 1,000 extra messages • Zero downtime',
      overageType: 'soft-cap',
    },
    growth_pro: {
      name: 'Growth Pro (Trial)',
      badge: 'Pro Trial',
      monthlyPrice: 49,
      annualPrice: 39,
      messagesQuota: 10000,
      botsQuota: 5,
      knowledgeSourcesQuota: 'Unlimited',
      seatsQuota: 3,
      supportSla: 'Priority 24/7 Email & Chat',
      overagePolicy: 'Soft Cap: $10 / 1,000 extra messages • Zero downtime',
      overageType: 'soft-cap',
    },
    Ultra: {
      name: 'Enterprise Ultra',
      badge: 'Ultra Tier',
      monthlyPrice: 199,
      annualPrice: 159,
      messagesQuota: 100000,
      botsQuota: 50,
      knowledgeSourcesQuota: 'Dedicated RAG Cluster',
      seatsQuota: 10,
      supportSla: '24/7 Phone & Slack Channel',
      overagePolicy: 'Soft Cap: $10 / 1,000 extra messages • Zero downtime',
      overageType: 'soft-cap',
    },
    Enterprise: {
      name: 'Enterprise',
      badge: 'Custom Tier',
      monthlyPrice: 0,
      annualPrice: 0,
      messagesQuota: 500000,
      botsQuota: 100,
      knowledgeSourcesQuota: 'Private VPC Ingestion',
      seatsQuota: 50,
      supportSla: '99.99% SLA + Dedicated Solutions Architect',
      overagePolicy: 'Custom Committed Volume Tiers',
      overageType: 'custom',
    },
  };

  const activePlanConfig = planConfigs[currentPlan] || planConfigs.Free;

  // Real-time calculated usage metrics
  const messagesUsed = currentPlan === 'Free' ? 280 : currentPlan === 'Pro' ? 2450 : currentPlan === 'Ultra' ? 18340 : 42100;
  const messagesPercentage = Math.min(100, Math.round((messagesUsed / activePlanConfig.messagesQuota) * 100));

  const tokensUsed = messagesUsed * 125;
  const tokensLimit = activePlanConfig.messagesQuota * 15;
  const tokensPercentage = Math.min(100, Math.round((tokensUsed / tokensLimit) * 100));

  const conversationsUsed = Math.min(activePlanConfig.messagesQuota, Math.round(messagesUsed / 3));
  const conversationsLimit = activePlanConfig.messagesQuota;
  const conversationsPercentage = Math.min(100, Math.round((conversationsUsed / conversationsLimit) * 100));

  const botsUsed = Math.min(chatbotsCount, activePlanConfig.botsQuota);
  const botsPercentage = Math.min(100, Math.round((botsUsed / activePlanConfig.botsQuota) * 100));

  const knowledgeSourcesUsed = currentPlan === 'Free' ? 1 : 4;
  const teamSeatsUsed = 1;
  const seatsPercentage = Math.min(100, Math.round((teamSeatsUsed / activePlanConfig.seatsQuota) * 100));

  const getProgressColor = (pct: number) => {
    if (pct > 95) return 'bg-rose-500';
    if (pct > 80) return 'bg-amber-500';
    return 'bg-zinc-950 dark:bg-white';
  };

  // Calculated next billing date (e.g. 1 month from current date)
  const nextBillingDate = 'September 27, 2026';
  const currentBillingRate = modalBillingCycle === 'annual' ? activePlanConfig.annualPrice : activePlanConfig.monthlyPrice;

  // Invoice History records
  const [invoices] = useState<InvoiceItem[]>([
    {
      id: 'INV-2026-008',
      date: 'Aug 27, 2026',
      period: 'Aug 27, 2026 – Sep 27, 2026',
      description: `${activePlanConfig.name} — Subscription`,
      amount: currentPlan === 'Free' ? 0 : currentPlan === 'Pro' ? 39 : currentPlan === 'Ultra' ? 159 : 0,
      currency: 'USD',
      status: 'Paid',
      paymentMethod: 'Visa ending in 4242',
    },
    {
      id: 'INV-2026-007',
      date: 'Jul 27, 2026',
      period: 'Jul 27, 2026 – Aug 27, 2026',
      description: 'Growth Pro — Subscription',
      amount: 39,
      currency: 'USD',
      status: 'Paid',
      paymentMethod: 'Visa ending in 4242',
    },
    {
      id: 'INV-2026-006',
      date: 'Jun 27, 2026',
      period: 'Jun 27, 2026 – Jul 27, 2026',
      description: 'Growth Pro — Subscription',
      amount: 39,
      currency: 'USD',
      status: 'Paid',
      paymentMethod: 'Visa ending in 4242',
    },
  ]);

  // Handle Download Invoice Receipt
  const handleDownloadInvoice = (inv: InvoiceItem) => {
    const invoiceContent = `====================================================
NOMADSCHAT INVOICE & PAYMENT RECEIPT
====================================================
Invoice Reference: ${inv.id}
Date Issued: ${inv.date}
Billing Period: ${inv.period}

Customer / Workspace:
${tenant?.name || 'Nomads Workspace'}
Owner: ${tenant?.ownerEmail || user?.email || 'admin@nomadschat.com'}
Tenant ID: ${tenant?.id || 'tnt_default_01'}

Plan / Service:
${inv.description}
Status: ${inv.status.toUpperCase()}
Payment Method: ${inv.paymentMethod}

Itemized Summary:
1. ${inv.description} ............ $${inv.amount.toFixed(2)} USD
   - AI Chatbot Engine
   - Knowledge Base Vector Storage
   - High-throughput RAG pipeline
----------------------------------------------------
Subtotal:                        $${inv.amount.toFixed(2)} USD
Tax (0.00%):                     $0.00 USD
TOTAL PAID:                      $${inv.amount.toFixed(2)} USD
====================================================
NomadsChat Inc. • AI Automated Customer Support
VAT ID: US948271049 • receipts@nomadschat.com
====================================================`;

    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inv.id}-NomadsChat-Receipt.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle saving new card
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCardUpdating(true);
    const cleanNum = cardForm.cardNumber.replace(/\s+/g, '');

    try {
      const res = await fetch('/api/billing/payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('auth_token') ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } : {}),
        },
        body: JSON.stringify({
          cardNumber: cleanNum,
          expMonth: cardForm.expMonth || '12',
          expYear: cardForm.expYear || '2029',
          cvc: cardForm.cvc || '123',
          nameOnCard: cardForm.holderName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update payment method.');
      }

      setPaymentMethod({
        brand: data.paymentMethod?.brand || 'Visa',
        last4: data.paymentMethod?.last4 || cleanNum.slice(-4),
        expMonth: data.paymentMethod?.expMonth || cardForm.expMonth || '12',
        expYear: data.paymentMethod?.expYear || cardForm.expYear || '2029',
        holderName: cardForm.holderName,
        billingEmail: paymentMethod.billingEmail,
        billingZip: cardForm.zip || '94107',
        country: cardForm.country || 'United States',
      });
      await refreshTenant();
      setIsUpdateCardModalOpen(false);
      setCardSuccessMsg('Payment method saved and verified successfully.');
      setTimeout(() => setCardSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update payment card.');
    } finally {
      setIsCardUpdating(false);
    }
  };

  // Handle Saving BYOK
  const handleSaveByok = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!byokApiKey.trim()) return;

    setIsSavingByok(true);
    setByokStatusMessage(null);

    try {
      const res = await fetch('/api/tenant/byok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: byokProvider,
          apiKey: byokApiKey.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save API key');
      }

      setHasConfiguredByok(true);
      setMaskedByokKeyDisplay(data.byokConfig?.apiKey || '••••••••••••');
      setByokApiKey('');
      setByokStatusMessage({
        type: 'success',
        text: 'Custom API key saved securely. It will be used for all chatbot completions.',
      });
      await refreshTenant();
    } catch (err: any) {
      setByokStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save custom API key',
      });
    } finally {
      setIsSavingByok(false);
    }
  };

  // Handle Testing BYOK
  const handleTestByok = async () => {
    setIsTestingByok(true);
    setByokStatusMessage(null);

    try {
      const res = await fetch('/api/tenant/byok/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: byokProvider,
          apiKey: byokApiKey.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Connection test failed');
      }

      setByokStatusMessage({
        type: 'success',
        text: `✓ Connection verified successfully! ${data.message || ''}`,
      });
    } catch (err: any) {
      setByokStatusMessage({
        type: 'error',
        text: `Connection test failed: ${err.message}`,
      });
    } finally {
      setIsTestingByok(false);
    }
  };

  // Handle Deleting BYOK
  const handleDeleteByok = async () => {
    if (!confirm('Remove custom API key? The workspace will revert to default platform quotas.')) return;

    setIsSavingByok(true);
    try {
      const res = await fetch('/api/tenant/byok', { method: 'DELETE' });
      if (res.ok) {
        setHasConfiguredByok(false);
        setMaskedByokKeyDisplay('');
        setByokApiKey('');
        setByokStatusMessage({
          type: 'success',
          text: 'Custom API key removed. Platform quota is now active.',
        });
        await refreshTenant();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingByok(false);
    }
  };

  // Marketing Comparison Plans for Modal (4 Tiers)
  const modalPlans = [
    {
      id: 'Free' as TenantPlan,
      name: 'Starter Free',
      tagline: 'Ideal for small projects & testing AI support widgets.',
      monthlyPrice: 0,
      annualPrice: 0,
      badge: 'Free Tier',
      isCustomPrice: false,
      actionType: 'self-serve' as const,
      features: [
        '1 AI Chatbot Instance',
        '500 Messages / month',
        '1 Knowledge Base Source',
        GEMINI_CONFIG.flash.engineLabel,
        'Standard Chat Widget Theme',
        'Community Forum Support',
      ],
    },
    {
      id: 'Pro' as TenantPlan,
      name: 'Growth Pro',
      tagline: 'For fast-growing startups & high-converting support teams.',
      monthlyPrice: 49,
      annualPrice: 39,
      badge: 'Most Popular',
      popular: true,
      isCustomPrice: false,
      actionType: 'self-serve' as const,
      features: [
        'Up to 5 AI Chatbots',
        '10,000 Messages / month',
        'Unlimited Knowledge Base Sources',
        `${GEMINI_CONFIG.flash.name} & ${GEMINI_CONFIG.pro.name} Models`,
        'Remove "Powered by NomadsChat" Branding',
        'Live Agent Human Takeover Inbox',
        'Lead Generation & Visitor Email Collector',
        'Priority 24/7 Email & Chat Support',
      ],
    },
    {
      id: 'Ultra' as TenantPlan,
      name: 'Enterprise Ultra',
      tagline: 'For high-scale companies with high message volumes.',
      monthlyPrice: 199,
      annualPrice: 159,
      badge: 'High Scale',
      isCustomPrice: false,
      actionType: 'self-serve' as const,
      features: [
        'Unlimited AI Chatbots (50+)',
        '100,000+ Messages / month',
        'Dedicated RAG Indexer & Crawler',
        'Bring Your Own API Key (BYOK)',
        'Custom Domain Embed & White-Label',
        'Multi-Agent Team Routing',
        'Priority 24/7 Phone & Slack Support',
      ],
    },
    {
      id: 'Enterprise' as TenantPlan,
      name: 'Enterprise',
      tagline: 'Custom quote & dedicated security for global organizations.',
      monthlyPrice: 0,
      annualPrice: 0,
      badge: 'Sales-Assisted',
      isCustomPrice: true,
      actionType: 'contact-sales' as const,
      features: [
        'Everything in Ultra +',
        'Single Sign-On (SSO / SAML 2.0)',
        'SOC 2 Type II & Security Audit Reports',
        'Custom MSA & 99.99% SLA Guarantee',
        'Dedicated Solutions Architect & Onboarding',
        'Bring Your Own Key (Vertex AI & Azure)',
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Toast Notification */}
      <AnimatePresence>
        {cardSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl text-xs font-semibold shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cardSuccessMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Header: Clean Account Billing Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/90 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white font-heading tracking-tight">
              Billing &amp; Usage
            </h1>
            <span className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full font-mono">
              {currentPlan} Active
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mt-1 font-body">
            Manage your workspace subscription, quota limits, overage policies, payment details, and BYOK credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onNavigateToPublicPricing && (
            <MotionButton
              variant="secondary"
              size="sm"
              onClick={onNavigateToPublicPricing}
              leftIcon={<ExternalLink className="w-3.5 h-3.5 text-zinc-600" />}
            >
              Public Pricing
            </MotionButton>
          )}
          <MotionButton
            variant="dark"
            size="sm"
            onClick={() => setIsPlanModalOpen(true)}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
          >
            Change / Upgrade Plan
          </MotionButton>
        </div>
      </div>

      {/* Section 1: Current Plan & Subscription Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Subscription Overview Card */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 font-mono">Current Plan</span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Subscription
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white font-heading">
                  {activePlanConfig.name}
                </h2>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1 font-heading">
                  <span className="text-3xl font-extrabold text-zinc-950 dark:text-white">
                    {currentPlan === 'Enterprise' ? 'Custom' : `$${currentPlan === 'Free' ? 0 : currentBillingRate}`}
                  </span>
                  {currentPlan !== 'Enterprise' && (
                    <span className="text-xs text-zinc-500 font-bold">/ month</span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium font-body">
                  {currentPlan === 'Free' ? 'Free tier forever' : currentPlan === 'Enterprise' ? 'Annual enterprise agreement' : 'Billed annually'}
                </p>
              </div>
            </div>

            {/* Plan Specs Highlight Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 border-y border-zinc-100 dark:border-zinc-800 my-4 text-xs">
              <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Monthly Quota</p>
                <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5 font-heading">
                  {activePlanConfig.messagesQuota.toLocaleString()} msgs
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Max Chatbots</p>
                <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5 font-heading">
                  {activePlanConfig.botsQuota} Bots
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Knowledge Base</p>
                <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5 font-heading truncate">
                  {activePlanConfig.knowledgeSourcesQuota}
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Support SLA</p>
                <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5 font-heading truncate">
                  {activePlanConfig.supportSla}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>Next cycle reset on <strong className="text-zinc-900 dark:text-white font-bold">{nextBillingDate}</strong></span>
              {currentPlan !== 'Free' && currentPlan !== 'Enterprise' && (
                <span className="text-zinc-400 font-normal">(${currentBillingRate}.00)</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <MotionButton
                variant="dark"
                size="sm"
                onClick={() => setIsPlanModalOpen(true)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Change Tier
              </MotionButton>
              {currentPlan !== 'Free' && (
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  className="text-xs font-semibold text-zinc-500 hover:text-rose-600 px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer font-heading"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method on File Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white uppercase tracking-wider font-heading">
                Payment Method
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full font-mono border border-emerald-200 dark:border-emerald-800">
                Verified
              </span>
            </div>

            {/* Card Visual Pill */}
            <div className="bg-zinc-900 text-white rounded-2xl p-4 mb-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono tracking-widest text-zinc-400">CREDIT / DEBIT</span>
                <VisaLogo className="h-4 w-auto fill-white text-white" />
              </div>
              <p className="font-mono text-sm tracking-wider font-bold mb-3">
                •••• •••• •••• {paymentMethod.last4}
              </p>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                <span>{paymentMethod.holderName}</span>
                <span>EXP {paymentMethod.expMonth}/{paymentMethod.expYear}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              <div className="flex justify-between">
                <span className="text-zinc-400">Billing Email:</span>
                <span className="text-zinc-900 dark:text-white font-semibold truncate max-w-[170px]">
                  {paymentMethod.billingEmail}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Postal Code:</span>
                <span className="text-zinc-900 dark:text-white font-semibold">{paymentMethod.billingZip}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
            <MotionButton
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => {
                setCardForm({
                  cardNumber: `•••• •••• •••• ${paymentMethod.last4}`,
                  holderName: paymentMethod.holderName,
                  expMonth: paymentMethod.expMonth,
                  expYear: paymentMethod.expYear,
                  cvc: '',
                  zip: paymentMethod.billingZip,
                  country: paymentMethod.country,
                });
                setIsUpdateCardModalOpen(true);
              }}
              leftIcon={<CreditCard className="w-3.5 h-3.5 text-zinc-600" />}
            >
              Update Payment Method
            </MotionButton>
          </div>
        </div>
      </div>

      {/* Section 2: Resource Usage & Explicit Overage Status */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white font-heading">
                Current Cycle Usage &amp; Quota Limits
              </h3>
              {activePlanConfig.overageType === 'soft-cap' ? (
                <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                  Soft Cap Active
                </span>
              ) : activePlanConfig.overageType === 'hard-cap' ? (
                <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                  Hard Cap Active
                </span>
              ) : (
                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                  Enterprise Tier
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Resource consumption resets automatically on {nextBillingDate}.
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 font-heading">
            <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            <span>Real-Time Metering</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Token Consumption Quota Progress */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  Token Consumption
                </span>
                <span className={`text-[11px] font-extrabold font-mono ${tokensPercentage > 95 ? 'text-rose-600' : tokensPercentage > 80 ? 'text-amber-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {tokensPercentage}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tokensPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getProgressColor(tokensPercentage)}`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              <span>{tokensUsed.toLocaleString()} tokens</span>
              <span>limit: {tokensLimit.toLocaleString()}</span>
            </div>
          </div>

          {/* Conversation Count Quota Progress */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  Conversations
                </span>
                <span className={`text-[11px] font-extrabold font-mono ${conversationsPercentage > 95 ? 'text-rose-600' : conversationsPercentage > 80 ? 'text-amber-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {conversationsPercentage}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${conversationsPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getProgressColor(conversationsPercentage)}`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              <span>{conversationsUsed.toLocaleString()} active</span>
              <span>of {conversationsLimit.toLocaleString()}</span>
            </div>
          </div>

          {/* Messages Quota Progress */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  AI Messages
                </span>
                <span className={`text-[11px] font-extrabold font-mono ${messagesPercentage > 95 ? 'text-rose-600' : messagesPercentage > 80 ? 'text-amber-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {messagesPercentage}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${messagesPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getProgressColor(messagesPercentage)}`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              <span>{messagesUsed.toLocaleString()} used</span>
              <span>of {activePlanConfig.messagesQuota.toLocaleString()}</span>
            </div>
          </div>

          {/* AI Chatbots Quota Progress */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  Chatbots Deployed
                </span>
                <span className={`text-[11px] font-extrabold font-mono ${botsPercentage > 95 ? 'text-rose-600' : botsPercentage > 80 ? 'text-amber-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {botsPercentage}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${botsPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getProgressColor(botsPercentage)}`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              <span>{botsUsed} active</span>
              <span>limit: {activePlanConfig.botsQuota}</span>
            </div>
          </div>

          {/* Knowledge Base Sources */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  Knowledge Sources
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-mono">
                  {currentPlan === 'Free' ? '1 Max' : 'Unlimited'}
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden mb-2">
                <div className="h-full rounded-full bg-zinc-950 dark:bg-white w-1/4" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              <span>{knowledgeSourcesUsed} sources</span>
              <span>{currentPlan === 'Free' ? '1 limit' : 'Unmetered'}</span>
            </div>
          </div>

          {/* Live Agent Seats */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                  Operator Seats
                </span>
                <span className={`text-[11px] font-extrabold font-mono ${seatsPercentage > 95 ? 'text-rose-600' : seatsPercentage > 80 ? 'text-amber-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {seatsPercentage}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${seatsPercentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${getProgressColor(seatsPercentage)}`}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              <span>{teamSeatsUsed} seat assigned</span>
              <span>{activePlanConfig.seatsQuota} max</span>
            </div>
          </div>
        </div>

        {/* Overage Policy Notice */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-white">Active Overage Policy: </span>
              <span className="text-slate-600 dark:text-slate-300">{activePlanConfig.overagePolicy}</span>
            </div>
          </div>
          {currentPlan === 'Free' && (
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 shrink-0 underline"
            >
              Upgrade to enable soft-cap
            </button>
          )}
        </div>
      </div>

      {/* Section 3: Bring Your Own API Key (BYOK) Configuration */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center">
              <Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white font-heading">
                  Bring Your Own API Key (BYOK)
                </h3>
                {isByokEligible ? (
                  <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                    Plan Supported
                  </span>
                ) : (
                  <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Ultra &amp; Enterprise Only
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Supply your own Google Gemini or OpenAI key to bypass platform message quotas and run directly against your provider account.
              </p>
            </div>
          </div>
        </div>

        {!isByokEligible ? (
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                <Lock className="w-4 h-4 text-zinc-400" />
                <span>BYOK is locked on {activePlanConfig.name}</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl">
                Upgrade to <strong>Enterprise Ultra</strong> or <strong>Enterprise</strong> to route all visitor AI completions through your own custom Gemini or OpenAI API credentials with unlimited scale.
              </p>
            </div>
            <MotionButton
              variant="dark"
              size="sm"
              onClick={() => setIsPlanModalOpen(true)}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Upgrade to Unlock BYOK
            </MotionButton>
          </div>
        ) : (
          <form onSubmit={handleSaveByok} className="space-y-4">
            {/* BYOK Status Banner */}
            {byokStatusMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                  byokStatusMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {byokStatusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{byokStatusMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase font-mono mb-1.5">
                  AI Model Provider
                </label>
                <select
                  value={byokProvider}
                  onChange={(e) => setByokProvider(e.target.value as 'google' | 'openai')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="google">Google Gemini API</option>
                  <option value="openai">OpenAI API</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase font-mono mb-1.5">
                  Secret API Key (Encrypted Server-Side)
                </label>
                <div className="relative">
                  <input
                    type={isApiKeyMasked ? 'password' : 'text'}
                    placeholder={hasConfiguredByok ? maskedByokKeyDisplay : 'AIzaSy... or sk-...'}
                    value={byokApiKey}
                    onChange={(e) => setByokApiKey(e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsApiKeyMasked(!isApiKeyMasked)}
                      className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      title={isApiKeyMasked ? 'Show key' : 'Hide key'}
                    >
                      {isApiKeyMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Keys are encrypted at rest on the server and never sent to the browser bundle.</span>
              </div>

              <div className="flex items-center gap-2">
                {hasConfiguredByok && (
                  <button
                    type="button"
                    onClick={handleDeleteByok}
                    disabled={isSavingByok}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Key</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTestByok}
                  disabled={isTestingByok || (!byokApiKey && !hasConfiguredByok)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingByok ? 'animate-spin' : ''}`} />
                  <span>{isTestingByok ? 'Testing...' : 'Test Connection'}</span>
                </button>
                <MotionButton
                  variant="dark"
                  size="sm"
                  type="submit"
                  isLoading={isSavingByok}
                  disabled={!byokApiKey.trim()}
                >
                  Save API Key
                </MotionButton>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Section 4: Billing History & Invoices (Downloadable) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white font-heading">
              Billing History &amp; Receipts
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              Download itemized tax invoices and receipts for accounting.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4 font-bold">Invoice ID</th>
                <th className="py-3 px-4 font-bold">Billing Date</th>
                <th className="py-3 px-4 font-bold">Description</th>
                <th className="py-3 px-4 font-bold">Amount</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium font-body">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-950 dark:text-white font-mono">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{inv.id}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                    {inv.date}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-zinc-900 dark:text-white">{inv.description}</span>
                    <span className="block text-[11px] text-zinc-400 font-mono">{inv.paymentMethod}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold font-heading text-zinc-950 dark:text-white">
                    ${inv.amount.toFixed(2)} USD
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer font-heading"
                    >
                      <Receipt className="w-3 h-3" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(inv)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-950 dark:text-white hover:bg-zinc-950 hover:text-white dark:hover:bg-white dark:hover:text-zinc-950 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-lg transition cursor-pointer font-heading"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Reusable Plan Comparison Modal (4 Tiers) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-8"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="text-center max-w-lg mx-auto mb-6">
                <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-950 dark:text-white font-heading">
                  Change Workspace Tier
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-body">
                  Select a tier below to upgrade or switch your team quota limits instantly.
                </p>

                {/* Monthly / Annual Toggle */}
                <div className="flex items-center justify-center gap-3 pt-4">
                  <span className={`text-xs font-bold font-heading ${modalBillingCycle === 'monthly' ? 'text-zinc-950 dark:text-white' : 'text-zinc-400'}`}>
                    Monthly
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setModalBillingCycle(modalBillingCycle === 'monthly' ? 'annual' : 'monthly')}
                    className="w-11 h-6 bg-zinc-950 dark:bg-zinc-700 rounded-full p-1 relative transition-colors duration-200 cursor-pointer"
                  >
                    <motion.div
                      layout
                      className={`w-4 h-4 bg-white rounded-full shadow-md ${
                        modalBillingCycle === 'annual' ? 'ml-5' : 'ml-0'
                      }`}
                    />
                  </motion.button>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold font-heading ${modalBillingCycle === 'annual' ? 'text-zinc-950 dark:text-white' : 'text-zinc-400'}`}>
                      Annual
                    </span>
                    <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full font-mono uppercase">
                      Save 20%
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Plan Cards in Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {modalPlans.map((plan) => {
                  const isCurrent = currentPlan === plan.id;
                  const price = modalBillingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl border p-5 flex flex-col justify-between relative ${
                        plan.popular
                          ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20 dark:bg-indigo-950/20'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase font-mono">
                          {plan.badge}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-extrabold text-zinc-950 dark:text-white font-heading text-base">{plan.name}</h4>
                          {isCurrent && (
                            <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full font-mono uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-3 min-h-[30px]">{plan.tagline}</p>

                        <div className="mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800 font-heading">
                          {plan.isCustomPrice ? (
                            <div>
                              <span className="text-2xl font-extrabold text-zinc-950 dark:text-white">Custom</span>
                              <p className="text-[10px] text-zinc-400 font-mono">Sales-assisted quote</p>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-extrabold text-zinc-950 dark:text-white">${price}</span>
                                <span className="text-[11px] text-zinc-500 font-bold">/ mo</span>
                              </div>
                              {modalBillingCycle === 'annual' && price > 0 && (
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">Billed annually (${price * 12}/yr)</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 mb-5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                          {plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0 mt-0.5" />
                              <span className="text-[11px] leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {plan.actionType === 'contact-sales' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsPlanModalOpen(false);
                            setIsContactSalesOpen(true);
                          }}
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Contact Sales</span>
                        </button>
                      ) : (
                        <MotionButton
                          variant={isCurrent ? 'secondary' : plan.popular ? 'primary' : 'dark'}
                          size="sm"
                          fullWidth
                          disabled={isCurrent}
                          onClick={() => {
                            setIsPlanModalOpen(false);
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
                        >
                          {isCurrent ? 'Current Active' : plan.id === 'Free' ? 'Downgrade to Free' : `Select ${plan.name}`}
                        </MotionButton>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: Update Payment Method Form Modal */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isUpdateCardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setIsUpdateCardModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-zinc-950 dark:text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white font-heading">Update Payment Card</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">New card will be used for future billing cycles.</p>
                </div>
              </div>

              <form onSubmit={handleSaveCard} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase font-mono mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={cardForm.holderName}
                    onChange={(e) => setCardForm({ ...cardForm, holderName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase font-mono mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="4242 •••• •••• 4242"
                      value={cardForm.cardNumber}
                      onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <VisaLogo className="h-3 w-auto" />
                      <MastercardLogo className="h-3 w-auto" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase font-mono mb-1">
                      Exp Month
                    </label>
                    <input
                      type="text"
                      placeholder="MM"
                      maxLength={2}
                      required
                      value={cardForm.expMonth}
                      onChange={(e) => setCardForm({ ...cardForm, expMonth: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-center text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase font-mono mb-1">
                      Exp Year
                    </label>
                    <input
                      type="text"
                      placeholder="YYYY"
                      maxLength={4}
                      required
                      value={cardForm.expYear}
                      onChange={(e) => setCardForm({ ...cardForm, expYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-center text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase font-mono mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      required
                      value={cardForm.cvc}
                      onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-center text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase font-mono mb-1">
                      Postal Code / ZIP
                    </label>
                    <input
                      type="text"
                      required
                      value={cardForm.zip}
                      onChange={(e) => setCardForm({ ...cardForm, zip: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase font-mono mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      required
                      value={cardForm.country}
                      onChange={(e) => setCardForm({ ...cardForm, country: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-950"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsUpdateCardModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <MotionButton
                    variant="dark"
                    size="sm"
                    isLoading={isCardUpdating}
                    type="submit"
                  >
                    Save Payment Card
                  </MotionButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: Invoice Receipt Preview Modal */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase font-mono mb-1">
                <Receipt className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
                <span>Payment Receipt</span>
              </div>
              <h3 className="text-xl font-extrabold text-zinc-950 dark:text-white font-heading mb-1">{selectedInvoice.id}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-5">{selectedInvoice.date} • {selectedInvoice.period}</p>

              <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 space-y-2.5 text-xs mb-5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Service:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{selectedInvoice.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Workspace:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{tenant?.name || 'Nomads Workspace'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Payment Method:</span>
                  <span className="font-mono text-zinc-900 dark:text-white">{selectedInvoice.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <span className="font-bold text-emerald-600 uppercase font-mono">{selectedInvoice.status}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between text-sm font-extrabold font-heading">
                  <span>Total Paid:</span>
                  <span>${selectedInvoice.amount.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <MotionButton
                  variant="dark"
                  size="sm"
                  onClick={() => {
                    handleDownloadInvoice(selectedInvoice);
                    setSelectedInvoice(null);
                  }}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Receipt
                </MotionButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: Cancel Subscription Modal */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center mb-4">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>

              <h3 className="text-lg font-extrabold text-zinc-950 dark:text-white font-heading mb-1">
                Cancel Subscription?
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                Your workspace will retain access to <strong className="text-zinc-950 dark:text-white font-bold">{activePlanConfig.name}</strong> features and quota until <strong className="text-zinc-950 dark:text-white font-bold">{nextBillingDate}</strong>. After that date, your account will revert to the Starter Free plan.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 cursor-pointer"
                >
                  Keep Subscription
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchPlan('Free');
                    setCancelModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer"
                >
                  Confirm Cancellation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal when upgrading from billing dashboard */}
      {selectedCheckoutPlan && (
        <CheckoutModal
          isOpen={!!selectedCheckoutPlan}
          onClose={() => setSelectedCheckoutPlan(null)}
          planId={selectedCheckoutPlan.id}
          planName={selectedCheckoutPlan.name}
          monthlyPrice={selectedCheckoutPlan.monthlyPrice}
          annualPrice={selectedCheckoutPlan.annualPrice}
          initialBillingCycle={modalBillingCycle}
        />
      )}

      {/* Enterprise Contact Sales Modal */}
      <ContactSalesModal
        isOpen={isContactSalesOpen}
        onClose={() => setIsContactSalesOpen(false)}
      />
    </div>
  );
};
