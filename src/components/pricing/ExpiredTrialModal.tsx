import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
} from 'lucide-react';
import { MotionButton } from '../common/MotionButton';

interface ExpiredTrialModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSelectUpgradeToPro: () => void;
  onContactSales?: () => void;
}

export const ExpiredTrialModal: React.FC<ExpiredTrialModalProps> = ({
  isOpen,
  onClose,
  onSelectUpgradeToPro,
  onContactSales,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen, onClose || (() => {}));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expired-trial-modal-title"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white border border-zinc-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden relative"
      >
        {/* Header */}
        <div className="bg-black text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-inner">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
          <h2 id="expired-trial-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-white font-heading">
            Your 3-Day Free Trial Has Ended
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-2 max-w-md mx-auto">
            Upgrade your workspace subscription to retain access to your AI chatbots, active automations, live inbox, and knowledge documents.
          </p>
        </div>

        {/* Upgrade Card */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="border-2 border-black rounded-2xl p-6 bg-zinc-950 text-white relative shadow-xl">
            <div className="absolute -top-3 right-6 bg-amber-400 text-black text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
              Unlimited Access
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">
                NomadsChat Pro
              </span>
              <div className="text-right">
                <span className="text-2xl font-black text-white font-heading">$39</span>
                <span className="text-xs text-zinc-400 font-normal"> / month</span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 font-medium mb-4">
              Everything you need to automate client communication, engage visitors, and scale customer support.
            </p>

            <ul className="space-y-2.5 text-xs text-zinc-200 border-t border-zinc-800 pt-4 mb-6">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Up to 10 AI Chatbots with Custom Knowledge Base</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited AI Message Generation & Smart Grounding</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full Live Human Agent Takeover Inbox & Analytics</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Remove NomadsChat Branding & Custom Embed Styles</span>
              </li>
            </ul>

            <MotionButton
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={onSelectUpgradeToPro}
              rightIcon={<ArrowRight className="w-4 h-4 text-black" />}
            >
              Activate Pro Subscription
            </MotionButton>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cancel anytime with 1-click in your billing portal</span>
            </div>
            {onContactSales && (
              <button
                type="button"
                onClick={onContactSales}
                className="text-xs font-bold text-zinc-900 hover:text-black hover:underline cursor-pointer flex items-center gap-1"
              >
                <Building2 className="w-3.5 h-3.5" />
                Need Custom Enterprise?
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
