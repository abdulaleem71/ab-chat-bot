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
  Building2,
  Check,
  Loader2,
  Globe,
  ExternalLink,
  Receipt
} from 'lucide-react';
import {
  VisaLogo,
  MastercardLogo,
  AmexLogo,
  DiscoverLogo,
  PaypalLogo,
  GooglePayLogo,
  ApplePayLogo,
} from '../common/PaymentLogos';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: 'Free' | 'Pro' | 'Enterprise';
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
  const { switchPlan } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(initialBillingCycle);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [transactionId, setTransactionId] = useState('');

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

  const totalAmount = billingCycle === 'annual' ? annualPrice * 12 : monthlyPrice;

  const handleConfirmPlanSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const generatedTxn = 'PLAN-' + Math.floor(100000 + Math.random() * 900000) + '-ACT';
      setTransactionId(generatedTxn);
      switchPlan(planId);
      setIsProcessing(false);
      setIsCompleted(true);
      if (onSuccess) onSuccess();
    }, 600);
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
Status: ACTIVE

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
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl max-w-lg w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col my-auto relative overflow-hidden">
        {/* Header Bar */}
        <div className="bg-black text-white p-5 sm:p-6 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center font-bold text-white text-lg shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white tracking-tight">Confirm Plan Subscription</h3>
                <span className="bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Instant Activation
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Workspace Plan Tier Manager</p>
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
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Plan Activated
              </span>
              <h2 className="text-2xl font-extrabold text-black tracking-tight mt-3">
                Welcome to NomadsChat {planName}!
              </h2>
              <p className="text-xs text-zinc-600 font-medium max-w-md mx-auto mt-1">
                Your workspace subscription has been updated to {planName}. All included features and capabilities are unlocked.
              </p>
            </div>

            {/* Plan Confirmation Card */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                <span className="text-zinc-500 font-semibold">Confirmation Reference:</span>
                <span className="font-mono font-bold text-black">{transactionId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                <span className="text-zinc-500 font-semibold">Plan Tier:</span>
                <span className="font-bold text-black">{planName} ({billingCycle.toUpperCase()})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-semibold">Billing Rate:</span>
                <span className="font-extrabold text-black text-sm">${totalAmount}.00 USD / yr</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleDownloadInvoice}
                className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Download Confirmation Record</span>
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold px-6 py-3 rounded-xl border border-zinc-300 transition cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* PLAN CONFIRMATION FORM VIEW */
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
            {/* Selected Plan Details */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Target Workspace Plan</span>
                  <h4 className="text-xl font-extrabold text-black">{planName} Tier</h4>
                  <p className="text-xs text-zinc-500 font-medium">
                    {billingCycle === 'annual'
                      ? `$${annualPrice}/month billed annually ($${annualPrice * 12}/year)`
                      : `$${monthlyPrice}/month billed monthly`}
                  </p>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="bg-white border border-zinc-200 p-1.5 rounded-xl flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
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
              </div>

              <div className="space-y-2 text-xs text-zinc-600 font-medium">
                <div className="flex items-center gap-2 text-black font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Instant access to expanded AI chatbot quota</span>
                </div>
                <div className="flex items-center gap-2 text-black font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Unmetered RAG document & web indexing</span>
                </div>
                <div className="flex items-center gap-2 text-black font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Human operator inbox & lead collection</span>
                </div>
              </div>
            </div>

            {/* Activation Submit */}
            <form onSubmit={handleConfirmPlanSwitch} className="space-y-4">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-black hover:bg-zinc-800 text-white text-xs font-extrabold py-3.5 px-6 rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Workspace Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Activate {planName} Plan Now</span>
                  </>
                )}
              </button>
            </form>

            <p className="text-[10px] text-center text-zinc-400 font-medium">
              You can adjust or switch your workspace plan anytime from your account settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
