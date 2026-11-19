import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface AdminLoginProps {
  onBackToApp: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToApp }) => {
  const { login, isLoading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both administrator email and passkey.');
      return;
    }

    const res = await login(email.trim(), password);
    if (!res.success) {
      setError(res.error || 'Access Denied: Invalid credentials or unauthorized account.');
    }
  };

  return (
    <div className="min-h-screen bg-dot-grid text-zinc-900 flex flex-col justify-center items-center p-4 selection:bg-zinc-900 selection:text-white">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <motion.button
          whileHover={{ x: -2 }}
          type="button"
          onClick={onBackToApp}
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-950 mb-6 transition cursor-pointer font-heading"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to NomadsChat Application</span>
        </motion.button>

        <div className="bg-white border border-zinc-200/90 rounded-2xl md:rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-zinc-950 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 font-heading">Admin Control Center</h1>
            <p className="text-xs text-zinc-500 mt-1.5 font-body">
              Restricted Area. Authorized platform administrator clearance required.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5 uppercase tracking-wider font-heading">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourcompany.com"
                  autoComplete="username"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition font-body"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider font-heading">
                  Admin Passkey
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-900 transition cursor-pointer font-medium"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition font-mono"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-zinc-950 hover:bg-black text-white font-bold py-3 px-4 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 font-heading"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  <span>Verifying Clearance...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-zinc-300" />
                  <span>Authenticate Admin Session</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
            <p className="text-[11px] text-zinc-500 font-medium">
              Protected by bcrypt verification, HttpOnly admin session cookies, and IP audit logging.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
