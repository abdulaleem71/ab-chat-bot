import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  X,
  Layers,
  Bot
} from 'lucide-react';
import { MotionButton } from '../common/MotionButton';

interface ExpiredTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUpgradeToPro: () => void;
  onStayOnFree: () => void;
}

export const ExpiredTrialModal: React.FC<ExpiredTrialModalProps> = ({
  isOpen,
  onClose,
  onSelectUpgradeToPro,
  onStayOnFree,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white border border-zinc-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden relative"
      >
        {/* Header */}
        <div className="bg-black text-white p-6 text-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading">
            Your Growth Pro Trial Has Ended
          </h2>
          <p className="text-xs text-zinc-300 font-medium mt-1 max-w-md mx-auto">
            Choose how you'd like to continue with your NomadsChat workspace. Add a payment method to unlock full Growth Pro capabilities or stay on the Free tier.
          </p>
        </div>

        {/* Comparison Options */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option 1: Stay on Free */}
            <div className="border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 transition flex flex-col justify-between bg-zinc-50/50">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 font-mono">
                    Starter Free
                  </span>
                  <span className="text-xs font-extrabold text-black font-heading">$0 / mo</span>
                </div>
                <h3 className="text-base font-bold text-zinc-900 font-heading">Stay on Free</h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Limited access for small basic testing.
                </p>

                <ul className="space-y-2 mt-4 text-xs text-zinc-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>1 Chatbot</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span>500 Messages / month</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-400">
                    <Lock className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    <span>No Live Takeover Inbox</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-400">
                    <Lock className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                    <span>NomadsChat Badge on widget</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5">
                <button
                  type="button"
                  onClick={onStayOnFree}
                  className="w-full py-2.5 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition cursor-pointer"
                >
                  Stay on Free
                </button>
              </div>
            </div>

            {/* Option 2: Upgrade to Pro (Requires Card) */}
            <div className="border-2 border-black rounded-2xl p-5 flex flex-col justify-between bg-zinc-950 text-white relative shadow-lg">
              <div className="absolute -top-3 right-4 bg-emerald-400 text-black text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Recommended
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 font-mono">
                    Growth Pro
                  </span>
                  <span className="text-xs font-extrabold text-white font-heading">$39 / mo</span>
                </div>
                <h3 className="text-base font-bold text-white font-heading">Upgrade to Pro</h3>
                <p className="text-xs text-zinc-400 font-medium mt-1">
                  Keep all bots, unlimited knowledge, and live chat.
                </p>

                <ul className="space-y-2 mt-4 text-xs text-zinc-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Up to 5 Chatbots</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>10,000 Messages / month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Full Live Agent Inbox</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>White-label / Remove Branding</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5">
                <MotionButton
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={onSelectUpgradeToPro}
                  rightIcon={<ArrowRight className="w-4 h-4 text-black" />}
                >
                  Upgrade to Pro
                </MotionButton>
                <p className="text-[10px] text-zinc-400 text-center mt-2">
                  Requires valid payment card
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
