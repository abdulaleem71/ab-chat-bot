import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CreditCard,
  CheckCircle2,
  Lock,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Download,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { TenantPlan } from '../../types';
import {
  VisaLogo,
  MastercardLogo,
  AmexLogo,
  DiscoverLogo,
} from '../common/PaymentLogos';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: TenantPlan;
  planName: string;
  monthlyPrice: number;
  annualPrice: number;
  initialBillingCycle?: 'monthly' | 'annual';
  onSuccess?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  planId,
  planName,
  monthlyPrice,
  annualPrice,
  initialBillingCycle = 'annual',
  onSuccess,
}) => {
  const { tenant, switchPlan, refreshTenant } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(initialBillingCycle);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');

  // Payment form state
  const hasExistingCard = Boolean(tenant?.hasPaymentMethod);
  const [useNewCard, setUseNewCard] = useState(!hasExistingCard);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(tenant?.name || '');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('2028');
  const [cvc, setCvc] = useState('');
  const [zip, setZip] = useState('');

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setErrorMessage('');
      setIsCompleted(false);
      setUseNewCard(!tenant?.hasPaymentMethod);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, tenant?.hasPaymentMethod]);

  if (!isOpen) return null;

  const totalAmount = billingCycle === 'annual' ? annualPrice * 12 : monthlyPrice;
  const isPaidPlan = planId !== 'Free';

  // Format card number with spaces as user types
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 19);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  const handleConfirmPlanSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const authHeaders = {
        'Content-Type': 'application/json',
      };

      // 1. If paid plan and need to save a card
      if (isPaidPlan && (useNewCard || !tenant?.hasPaymentMethod)) {
        const cleanCard = cardNumber.replace(/\s+/g, '');
        if (cleanCard.length < 13 || cleanCard.length > 19) {
          throw new Error('Please enter a valid credit card number (13-19 digits).');
        }
        if (!cvc || cvc.length < 3) {
          throw new Error('Please enter a valid 3 or 4 digit security CVC code.');
        }

        const cardRes = await fetch('/api/billing/payment-method', {
          method: 'POST',
          credentials: 'include',
          headers: authHeaders,
          body: JSON.stringify({
            cardNumber: cleanCard,
            expMonth,
            expYear,
            cvc,
            nameOnCard: cardHolder,
            autoUpgradePlan: planId,
          }),
        });

        const cardData = await cardRes.json();
        if (!cardRes.ok || !cardData.success) {
          throw new Error(cardData.error || 'Payment card validation failed. Please check details.');
        }
      } else {
        // 2. Switching with card already on file or to Free
        const planRes = await fetch('/api/tenant/plan', {
          method: 'POST',
          credentials: 'include',
          headers: authHeaders,
          body: JSON.stringify({ plan: planId }),
        });

        const planData = await planRes.json();
        if (!planRes.ok || !planData.success) {
          throw new Error(planData.error || 'Failed to activate plan tier.');
        }
      }

      await switchPlan(planId);
      await refreshTenant();

      const generatedTxn = 'PLAN-' + Math.floor(100000 + Math.random() * 900000) + '-ACT';
      setTransactionId(generatedTxn);
      setIsCompleted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process subscription. Please check your payment details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    const invoiceContent = `====================================================
NOMADSCHAT WORKSPACE PLAN CONFIRMATION
====================================================
Confirmation ID: ${transactionId}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Plan Activated: NomadsChat ${planName}
Billing Cycle: ${billingCycle.toUpperCase()}
Rate: $${totalAmount}.00 USD
Status: CONFIRMED & ACTIVE

Platform: NomadsChat AI Support Engine
Thank you for choosing NomadsChat!
====================================================`;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NomadsChat-Plan-${transactionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl max-w-lg w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col my-auto relative overflow-hidden font-body">
        {/* Header Bar */}
        <div className="bg-black text-white p-5 sm:p-6 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-white text-lg shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white tracking-tight font-heading">
                  {isPaidPlan ? 'Upgrade & Payment Method' : 'Confirm Free Plan'}
                </h3>
                <span className="bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase font-mono">
                  Secure Checkout
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium font-body">Workspace Plan Tier Manager</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCompleted ? (
          /* SUCCESS / PLAN CONFIRMATION VIEW */
          <div className="p-6 sm:p-8 text-center space-y-6 overflow-y-auto flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-mono">
                Plan Activated
              </span>
              <h2 className="text-2xl font-extrabold text-black tracking-tight mt-3 font-heading">
                Welcome to NomadsChat {planName}!
              </h2>
              <p className="text-xs text-zinc-600 font-medium max-w-md mx-auto mt-1 font-body">
                Your workspace subscription has been updated to {planName}. All included features and capabilities are unlocked.
              </p>
            </div>

            {/* Plan Confirmation Card */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2.5 text-xs font-body">
              <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                <span className="text-zinc-500 font-semibold">Confirmation Reference:</span>
                <span className="font-mono font-bold text-black">{transactionId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                <span className="text-zinc-500 font-semibold">Plan Tier:</span>
                <span className="font-bold text-black font-heading">{planName} ({billingCycle.toUpperCase()})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-semibold">Billing Rate:</span>
                <span className="font-extrabold text-black text-sm font-heading">
                  ${totalAmount}.00 USD {billingCycle === 'annual' ? '/ yr' : '/ mo'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleDownloadInvoice}
                className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 font-heading"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Download Confirmation Record</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold px-6 py-3 rounded-xl border border-zinc-300 transition cursor-pointer font-heading"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* PLAN CONFIRMATION FORM VIEW */
          <div className="p-6 sm:p-7 space-y-5 overflow-y-auto flex-1 font-body">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Selected Plan Details */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 font-mono">Target Workspace Plan</span>
                  <h4 className="text-lg sm:text-xl font-extrabold text-black font-heading">{planName} Tier</h4>
                  <p className="text-xs text-zinc-500 font-medium">
                    {billingCycle === 'annual'
                      ? `$${annualPrice}/month billed annually ($${annualPrice * 12}/year)`
                      : `$${monthlyPrice}/month billed monthly`}
                  </p>
                </div>

                {/* Billing Cycle Toggle */}
                {isPaidPlan && (
                  <div className="bg-white border border-zinc-200 p-1 rounded-xl flex items-center gap-1 shrink-0 font-heading">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        billingCycle === 'monthly'
                          ? 'bg-black text-white shadow-xs'
                          : 'text-zinc-500 hover:text-black'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        billingCycle === 'annual'
                          ? 'bg-black text-white shadow-xs'
                          : 'text-zinc-500 hover:text-black'
                      }`}
                    >
                      <span>Annual</span>
                      <span className="bg-emerald-400 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                        -20%
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant quota activation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Live human agent takeover</span>
                </div>
              </div>
            </div>

            {/* Payment Method Requirement Section */}
            {isPaidPlan && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-heading flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Payment Method (Required for Paid Plans)</span>
                  </label>
                  <div className="flex items-center gap-1 opacity-75 scale-90">
                    <VisaLogo className="h-3.5 w-auto" />
                    <MastercardLogo className="h-3.5 w-auto" />
                    <AmexLogo className="h-3.5 w-auto" />
                  </div>
                </div>

                {hasExistingCard && !useNewCard ? (
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono text-[10px] font-bold">
                        {tenant?.paymentMethodBrand || 'CARD'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black font-mono">
                          •••• •••• •••• {tenant?.paymentMethodLast4 || '4242'}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Expires {tenant?.paymentMethodExp || '12/28'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseNewCard(true)}
                      className="text-xs font-bold text-black hover:underline cursor-pointer"
                    >
                      Use Different Card
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                    {hasExistingCard && (
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                        <span className="text-[11px] font-bold text-zinc-600">Enter New Card</span>
                        <button
                          type="button"
                          onClick={() => setUseNewCard(false)}
                          className="text-xs font-bold text-black hover:underline cursor-pointer"
                        >
                          Use Saved Card (•••• {tenant?.paymentMethodLast4})
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1 font-heading">
                        Card Number
                      </label>
                      <input
                        type="text"
                        required={isPaidPlan}
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full px-3 py-2 text-xs font-mono border border-zinc-300 rounded-xl focus:border-black focus:outline-hidden bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="col-span-2 sm:col-span-2">
                        <label className="block text-[11px] font-bold text-zinc-700 mb-1 font-heading">
                          Name on Card
                        </label>
                        <input
                          type="text"
                          required={isPaidPlan}
                          placeholder="Alex Mercer"
                          value={cardHolder}
                          onChange={e => setCardHolder(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:border-black focus:outline-hidden bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 mb-1 font-heading">
                          Exp (MM/YY)
                        </label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="12"
                            maxLength={2}
                            value={expMonth}
                            onChange={e => setExpMonth(e.target.value)}
                            className="w-1/2 px-1.5 py-2 text-xs font-mono text-center border border-zinc-300 rounded-xl focus:border-black focus:outline-hidden bg-white"
                          />
                          <input
                            type="text"
                            placeholder="28"
                            maxLength={4}
                            value={expYear}
                            onChange={e => setExpYear(e.target.value)}
                            className="w-1/2 px-1.5 py-2 text-xs font-mono text-center border border-zinc-300 rounded-xl focus:border-black focus:outline-hidden bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-700 mb-1 font-heading">
                          CVC / CVV
                        </label>
                        <input
                          type="password"
                          required={isPaidPlan}
                          maxLength={4}
                          placeholder="123"
                          value={cvc}
                          onChange={e => setCvc(e.target.value)}
                          className="w-full px-2 py-2 text-xs font-mono text-center border border-zinc-300 rounded-xl focus:border-black focus:outline-hidden bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Action */}
            <form onSubmit={handleConfirmPlanSwitch} className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-black hover:bg-zinc-800 text-white text-xs font-extrabold py-3.5 px-6 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 font-heading"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Payment & Upgrading Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>
                      {isPaidPlan
                        ? `Confirm & Pay $${totalAmount}.00 (${planName})`
                        : 'Confirm Switch to Starter Free'}
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-medium pt-1">
              <Lock className="w-3 h-3 text-zinc-500" />
              <span>256-bit encrypted checkout • Cancel anytime without penalties</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
