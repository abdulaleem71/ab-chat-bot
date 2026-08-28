import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, Clock, CreditCard } from 'lucide-react';
import { MotionButton } from '../common/MotionButton';

interface TrialBannerProps {
  onOpenUpgrade: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ onOpenUpgrade }) => {
  const { tenant, isAuthenticated } = useAuth();

  if (!isAuthenticated || !tenant) return null;

  const now = new Date();
  const trialEnds = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : null;
  const isTrialActive = Boolean(
    trialEnds &&
    trialEnds > now &&
    (tenant.plan === 'growth_pro' || tenant.plan === 'Pro') &&
    !tenant.hasPaymentMethod
  );

  if (!isTrialActive || !trialEnds) return null;

  // Calculate days/hours left
  const diffMs = trialEnds.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formattedDate = trialEnds.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      id="trial-banner"
      className="bg-black text-white px-4 py-2.5 sm:py-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-b border-zinc-800 shadow-md relative z-40"
    >
      <div className="flex items-center gap-2.5 text-center sm:text-left">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <div className="flex flex-wrap items-center gap-1.5 font-medium">
          <span className="font-bold text-emerald-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 inline" />
            3-Day Growth Pro Trial:
          </span>
          <span className="text-zinc-200">
            Ends <strong className="text-white font-semibold">{formattedDate}</strong>
            {diffHours <= 24 ? ` (${diffHours} hours remaining)` : ` (${diffDays} days remaining)`} — add a payment method to keep Pro features.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenUpgrade}
          className="bg-white hover:bg-zinc-100 text-black font-extrabold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <CreditCard className="w-3.5 h-3.5 text-zinc-900" />
          <span>Add Payment Method</span>
          <ArrowRight className="w-3 h-3 text-zinc-900" />
        </button>
      </div>
    </div>
  );
};
