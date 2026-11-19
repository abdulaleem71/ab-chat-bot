import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  Lock,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bot,
  Info,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { TenantPlan } from '../../types';
import {
  VisaLogo,
  MastercardLogo,
  AmexLogo,
  ShopPayLogo,
  GooglePayLogo,
  ApplePayLogo,
} from '../common/PaymentLogos';

interface ShopifyCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId?: TenantPlan;
  planName?: string;
  monthlyPrice?: number;
  annualPrice?: number;
  initialBillingCycle?: 'monthly' | 'annual';
  onSuccess?: () => void;
}

export const ShopifyCheckoutModal: React.FC<ShopifyCheckoutModalProps> = ({
  isOpen,
  onClose,
  planId = 'Pro',
  planName = 'NomadsChat Pro',
  monthlyPrice = 49,
  annualPrice = 39,
  initialBillingCycle = 'annual',
  onSuccess,
}) => {
  const { user, tenant, switchPlan, refreshTenant } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, { isOpen, onClose });

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(initialBillingCycle);
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('2029');
  const [cvc, setCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isStripeRedirecting, setIsStripeRedirecting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [detectedBrand, setDetectedBrand] = useState<'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown'>('unknown');

  const activeMonthlyRate = billingCycle === 'annual' ? annualPrice : monthlyPrice;
  const planSummaryText =
    planId === 'Ultra'
      ? 'Unlimited Chatbots + Dedicated RAG + BYOK'
      : 'Up to 10 AI Chatbots + Unlimited KB';

  const billingStartDate = new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  useEffect(() => {
    setBillingCycle(initialBillingCycle);
  }, [initialBillingCycle, isOpen]);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.displayName) {
      setCardHolder(user.displayName);
    }
    if (tenant?.name) {
      setOrgName(tenant.name);
    }
  }, [user, tenant]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setErrorMessage('');
      setIsCompleted(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getAuthHeaders = (): Record<string, string> => {
    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('auth_token') || localStorage.getItem('token') || ''
        : '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);

    if (raw.startsWith('4')) setDetectedBrand('visa');
    else if (/^(5[1-5]|2[2-7])/.test(raw)) setDetectedBrand('mastercard');
    else if (/^(34|37)/.test(raw)) setDetectedBrand('amex');
    else if (/^(6011|65|64[4-9])/.test(raw)) setDetectedBrand('discover');
    else setDetectedBrand('unknown');
  };

  const handleExpressCheckout = async (expressMethod: 'Shop Pay' | 'Google Pay' | 'Apple Pay') => {
    setErrorMessage('');
    setIsProcessing(true);
    try {
      const res = await fetch('/api/billing/payment-method', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          expressMethod,
          autoUpgradePlan: planId,
          billingCycle,
          nameOnCard: cardHolder || orgName || email,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to authorize with ${expressMethod}.`);
      }
      await switchPlan(planId);
      await refreshTenant();
      setIsCompleted(true);
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || `${expressMethod} checkout failed.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeCheckout = async () => {
    setErrorMessage('');
    setIsStripeRedirecting(true);
    try {
      const res = await fetch('/api/billing/checkout-session', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          planId,
          planName,
          billingCycle,
          unitAmountCents: activeMonthlyRate * 100,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      throw new Error(
        data.error || 'Stripe hosted checkout is not configured yet. You can complete activation using the card form below.'
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to launch Stripe Checkout.');
    } finally {
      setIsStripeRedirecting(false);
    }
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 13 || cleanCard.length > 19) {
      setErrorMessage('Please enter a valid card number (13–19 digits).');
      return;
    }
    if (!cvc || cvc.length < 3) {
      setErrorMessage('Please enter a valid 3 or 4 digit security CVC code.');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/billing/payment-method', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          cardNumber: cleanCard,
          expMonth,
          expYear,
          cvc,
          brand: detectedBrand === 'unknown' ? 'Card' : detectedBrand.toUpperCase(),
          nameOnCard: cardHolder || orgName || email,
          autoUpgradePlan: planId,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment method verification failed. Please check your card details.');
      }

      await switchPlan(planId);
      await refreshTenant();

      setIsCompleted(true);
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process trial activation. Please verify your payment card.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shopify-checkout-title"
        className="max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden relative flex flex-col my-auto max-h-[92vh] sm:max-h-[88vh]"
      >
        {/* Sticky Modal Top Bar */}
        <div className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-950 text-white flex items-center justify-center font-black text-xs shadow-xs">
              NC
            </div>
            <span className="text-base sm:text-lg font-black tracking-tight text-zinc-950 font-heading">
              NomadsChat Checkout
            </span>
            <span className="hidden sm:inline-flex text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
              3-Day Free Trial
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition cursor-pointer"
            aria-label="Close checkout modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {isCompleted ? (
            <div className="p-6 sm:p-12 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 id="shopify-checkout-title" className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight font-heading">
                  Subscription Activated!
                </h2>
                <p className="text-sm text-zinc-600 max-w-md mx-auto">
                  Welcome to <strong className="text-zinc-950">{planName}</strong>. Your 3-day full-access trial is active.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-left max-w-md mx-auto space-y-2 text-xs text-zinc-700">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Subscription:</span>
                  <span className="font-bold text-zinc-950">{planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Billing Cadence:</span>
                  <span className="font-bold text-zinc-950 capitalize">{billingCycle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Trial Duration:</span>
                  <span className="font-bold text-emerald-700">3 Days (Full Access)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Due Today:</span>
                  <span className="font-bold text-zinc-950 tabular-nums">$0.00</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2">
                  <span className="text-zinc-500 font-medium">First Billing Date:</span>
                  <span className="font-bold text-zinc-950 tabular-nums">
                    {billingStartDate} (${activeMonthlyRate}.00/mo)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-md py-3 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-sm transition cursor-pointer shadow-md"
              >
                Go to Workspace Dashboard
              </button>
            </div>
          ) : (
            /* Shopify Two-Column Layout: Mobile puts Order Summary (2nd DOM child) on top via flex-col-reverse */
            <div className="flex flex-col-reverse md:flex-row">
              {/* Left Pane (Customer & Payment - 60% Width) */}
              <div className="w-full md:w-[60%] p-5 sm:p-6 md:p-8 space-y-6">
                {/* Express Checkout Row */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                      Express Checkout
                    </span>
                    <span className="sm:hidden text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      3-Day Trial
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleExpressCheckout('Shop Pay')}
                      className="h-10 rounded-xl bg-[#5A31F4] hover:opacity-95 text-white flex items-center justify-center transition cursor-pointer shadow-xs disabled:opacity-60"
                      title="Express Checkout with Shop Pay"
                    >
                      <ShopPayLogo className="h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleExpressCheckout('Google Pay')}
                      className="h-10 rounded-xl bg-black hover:bg-zinc-800 text-white flex items-center justify-center transition cursor-pointer shadow-xs disabled:opacity-60"
                      title="Express Checkout with Google Pay"
                    >
                      <GooglePayLogo className="h-4" theme="dark" />
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleExpressCheckout('Apple Pay')}
                      className="h-10 rounded-xl bg-black hover:bg-zinc-800 text-white flex items-center justify-center transition cursor-pointer shadow-xs disabled:opacity-60"
                      title="Express Checkout with Apple Pay"
                    >
                      <ApplePayLogo className="h-4" theme="dark" />
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isStripeRedirecting || isProcessing}
                    onClick={handleStripeCheckout}
                    className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <span>{isStripeRedirecting ? 'Connecting to Stripe Checkout...' : 'Continue with Hosted Stripe Checkout'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                  </button>

                  <div className="relative flex items-center justify-center my-4">
                    <div className="border-t border-zinc-200 w-full" />
                    <span className="bg-white px-3 text-[11px] font-bold text-zinc-400 uppercase tracking-wider absolute">
                      OR
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmitCheckout} className="space-y-5">
                  {/* Account Section */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-zinc-900 font-heading block">
                      Account Details
                    </span>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Organization / Workspace Name
                        </label>
                        <input
                          type="text"
                          required
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="Your organization name"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-white text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Container */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 font-heading block">
                        Payment Method
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        All major cards accepted
                      </span>
                    </div>

                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-3">
                      {/* Card Number Input with Dynamic Logos (Zero bogus placeholder digits) */}
                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            inputMode="numeric"
                            autoComplete="cc-number"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="Card number"
                            className="w-full pl-3.5 pr-28 py-2.5 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent transition"
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                            <VisaLogo className={`h-3.5 transition-opacity ${detectedBrand === 'visa' || detectedBrand === 'unknown' ? 'opacity-100' : 'opacity-25'}`} />
                            <MastercardLogo className={`h-3.5 transition-opacity ${detectedBrand === 'mastercard' || detectedBrand === 'unknown' ? 'opacity-100' : 'opacity-25'}`} />
                            <AmexLogo className={`h-3.5 transition-opacity ${detectedBrand === 'amex' || detectedBrand === 'unknown' ? 'opacity-100' : 'opacity-25'}`} />
                          </div>
                        </div>
                      </div>

                      {/* Expiration & CVC Inline Grid */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                            Expiration (MM / YY)
                          </label>
                          <div className="flex gap-1.5">
                            <select
                              value={expMonth}
                              onChange={(e) => setExpMonth(e.target.value)}
                              className="w-1/2 px-2 py-2 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-black"
                            >
                              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <select
                              value={expYear}
                              onChange={(e) => setExpYear(e.target.value)}
                              className="w-1/2 px-2 py-2 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-black"
                            >
                              {['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033'].map((y) => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
                            Security Code (CVC)
                          </label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            autoComplete="cc-csc"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                            placeholder="CVC"
                            className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-black"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 pt-1">
                        <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>All transactions are encrypted and secured via 256-bit SSL.</span>
                      </div>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Primary Submit Button */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3.5 px-6 rounded-xl bg-zinc-950 hover:bg-zinc-800 active:scale-[0.99] text-white font-bold text-sm transition cursor-pointer shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Verifying Card &amp; Activating Trial...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-amber-400" />
                          <span>Start 3-Day Free Trial &amp; Subscribe</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-zinc-500 text-center leading-normal px-1">
                      By clicking above, you agree to start your 3-day free trial. You will be billed{' '}
                      <strong className="tabular-nums">${activeMonthlyRate}/mo</strong>{' '}
                      {billingCycle === 'annual' ? '(billed annually) ' : ''}starting on{' '}
                      <span className="underline font-semibold text-zinc-800">{billingStartDate}</span> unless canceled.
                    </p>
                  </div>
                </form>
              </div>

              {/* Right Pane (Order Summary - 40% Width) */}
              <div className="w-full md:w-[40%] bg-zinc-50 border-b md:border-b-0 md:border-l border-zinc-200 p-6 flex flex-col justify-between space-y-6">
                <div className="space-y-6">
                  {/* Product Summary Row */}
                  <div className="space-y-3 border-b border-zinc-200 pb-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Order Summary
                      </span>
                      <div className="inline-flex bg-zinc-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                            billingCycle === 'monthly' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600'
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingCycle('annual')}
                          className={`px-2 py-0.5 rounded-md cursor-pointer transition ${
                            billingCycle === 'annual' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600'
                          }`}
                        >
                          Annual
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Bot className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 id="shopify-checkout-title" className="text-sm font-bold text-zinc-950 font-heading truncate">
                            {planName}
                          </h3>
                          <p className="text-xs text-zinc-500 font-medium truncate">
                            {planSummaryText}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-zinc-950 bg-zinc-200/70 border border-zinc-300 px-2 py-1 rounded-md shrink-0 tabular-nums font-mono">
                        ${activeMonthlyRate}.00 / mo
                      </span>
                    </div>
                  </div>

                  {/* Cost Breakdown Table */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between text-zinc-600">
                      <span>{planName} Subtotal</span>
                      <span className="tabular-nums font-mono">${activeMonthlyRate}.00</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>3-Day Free Trial</span>
                      <span className="tabular-nums font-mono">-${activeMonthlyRate}.00</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>Tax / VAT</span>
                      <span className="tabular-nums font-mono">$0.00</span>
                    </div>
                    <div className="border-t border-zinc-200 pt-3 flex justify-between items-baseline">
                      <span className="text-sm font-extrabold text-zinc-950 font-heading">
                        Total Due Today
                      </span>
                      <span className="text-xl font-black text-zinc-950 font-heading tabular-nums">
                        $0.00
                      </span>
                    </div>
                  </div>

                  {/* Recurring Payment Disclosure Box */}
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 text-xs text-amber-950">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Trial Disclosure</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                      Recurring total: <strong className="tabular-nums">${activeMonthlyRate}.00</strong> billed every{' '}
                      {billingCycle === 'annual' ? 'month (annual plan)' : 'month'} starting on{' '}
                      <strong className="underline">{billingStartDate}</strong>. Cancel anytime from your account settings with zero penalty.
                    </p>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-zinc-200 space-y-2 text-[11px] text-zinc-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>PCI-DSS Compliant Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>256-Bit SSL Encrypted Connection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Instant Workspace Activation</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
