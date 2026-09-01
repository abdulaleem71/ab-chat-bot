import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, Mail, CheckCircle2, ArrowRight } from 'lucide-react';

export const VerificationBanner: React.FC = () => {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [msg, setMsg] = useState('');

  if (user.emailVerified) return null;

  const handleResend = async () => {
    setIsSending(true);
    setMsg('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg('Verification email resent! Check your Account settings outbox.');
      } else {
        setMsg(data.error || 'Failed to resend verification email.');
      }
    } catch {
      setMsg('Network error while resending verification.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 text-xs font-medium flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm relative z-40 font-body">
      <div className="flex items-center gap-2 text-center sm:text-left">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>
          <strong>Action Required:</strong> Please verify your email address (<strong>{user.email}</strong>) to unlock all workspace features.
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleResend}
          disabled={isSending}
          className="px-3 py-1 bg-white text-amber-900 rounded-lg text-xs font-bold hover:bg-amber-50 transition cursor-pointer disabled:opacity-50 font-heading"
        >
          {isSending ? 'Sending...' : 'Resend Verification Email'}
        </button>
        {msg && <span className="text-[11px] font-semibold text-white bg-amber-600 px-2 py-0.5 rounded">{msg}</span>}
      </div>
    </div>
  );
};
