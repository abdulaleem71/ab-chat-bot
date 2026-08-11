import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { X, Sparkles, Mail, Lock, Building, ArrowRight, CheckCircle2, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { login, register, requestPasswordReset, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompany] = useState('');
  const [teamSize, setTeamSize] = useState('2-10');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const modalContainerRef = useRef<HTMLDivElement>(null);
  useClickOutside(modalContainerRef, () => {
    if (isOpen) onClose();
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      if (mode === 'signin') {
        await login(email, password);
        setSuccessMsg('Successfully signed in!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1000);
      } else if (mode === 'signup') {
        await register(email, password, name, companyName);
        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1000);
      } else if (mode === 'forgot') {
        if (!newPassword || newPassword.length < 6) {
          setErrorMsg('Please enter a new password of at least 6 characters.');
          setIsLoading(false);
          return;
        }

        // Request token and reset password
        let tokenToUse = resetToken;
        if (!tokenToUse) {
          const res = await requestPasswordReset(email);
          if (res.resetToken) {
            tokenToUse = res.resetToken;
          }
        }

        await resetPassword(email, newPassword, tokenToUse);
        setSuccessMsg('Your password has been reset! Please sign in with your new password.');
        setTimeout(() => {
          setSuccessMsg('');
          setMode('signin');
          setPassword(newPassword);
        }, 1800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Action failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs overflow-hidden animate-in fade-in duration-200">
      <div
        ref={modalContainerRef}
        className="bg-white rounded-3xl max-w-md w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col my-auto overflow-hidden shadow-2xl border border-zinc-200 relative animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-black rounded-full hover:bg-zinc-100 transition z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-black p-6 text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-800/40 rounded-full blur-2xl" />
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {mode === 'signin' && 'Welcome back to NomadsChat'}
            {mode === 'signup' && 'Start your 14-day free trial'}
            {mode === 'forgot' && 'Reset Your Workspace Password'}
          </h2>
          <p className="text-xs text-zinc-300 font-medium mt-1 max-w-xs mx-auto">
            {mode === 'signin' && 'Sign in to access your AI Support Chatbots & Analytics'}
            {mode === 'signup' && 'Deploy Gemini-powered AI chatbots in under 2 minutes'}
            {mode === 'forgot' && 'Enter your account email and new password to regain access'}
          </p>
        </div>

        {/* Form Container */}
        <div className="p-6 overflow-y-auto flex-1">
          {successMsg ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-black mx-auto animate-bounce" />
              <h3 className="text-base font-extrabold text-black">{successMsg}</h3>
              <p className="text-xs text-zinc-500 font-medium">Updating account status...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
                  {errorMsg}
                </div>
              )}

              {/* Tab Selector for Signin/Signup */}
              {mode !== 'forgot' && (
                <div className="flex bg-zinc-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                      mode === 'signin' ? 'bg-black text-white shadow-sm' : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all duration-150 cursor-pointer ${
                      mode === 'signup' ? 'bg-black text-white shadow-sm' : 'text-zinc-600 hover:text-black'
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Form Fields */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Mercer"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Company / Workspace</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Acme Corp"
                        value={companyName}
                        onChange={e => setCompany(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Team Size</label>
                    <select
                      value={teamSize}
                      onChange={e => setTeamSize(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden bg-white font-medium"
                    >
                      <option value="1">1 person</option>
                      <option value="2-10">2 - 10 people</option>
                      <option value="11-50">11 - 50 people</option>
                      <option value="50+">50+ people</option>
                    </select>
                  </div>
                </div>
              )}

              {mode !== 'forgot' ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-zinc-700">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg('');
                          setMode('forgot');
                        }}
                        className="text-[11px] font-bold text-black hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-black cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                /* Forgot Password Form */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Enter new password (min 6 chars)"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-black focus:border-black focus:outline-hidden font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-black cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black hover:bg-zinc-800 text-white text-xs font-bold py-3 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <span>
                        {mode === 'signin' && 'Sign In to Workspace'}
                        {mode === 'signup' && 'Create Free Workspace'}
                        {mode === 'forgot' && 'Reset & Update Password'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </>
                  )}
                </button>
              </div>

              {mode === 'forgot' && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-xs font-bold text-zinc-600 hover:text-black cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              )}

              {/* Social Login Options */}
              {mode !== 'forgot' && (
                <div className="pt-3">
                  <div className="relative flex items-center justify-center mb-3">
                    <div className="border-t border-zinc-200 w-full" />
                    <span className="bg-white px-2 text-[10px] text-zinc-400 uppercase font-bold">Or continue with</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('google.user@example.com');
                        login('google.user@example.com');
                        onClose();
                      }}
                      className="flex items-center justify-center gap-2 border border-zinc-200 hover:bg-zinc-100 py-2 rounded-xl text-xs font-bold text-zinc-800 transition active:scale-95 cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Google SSO</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEmail('github.user@example.com');
                        login('github.user@example.com');
                        onClose();
                      }}
                      className="flex items-center justify-center gap-2 border border-zinc-200 hover:bg-zinc-100 py-2 rounded-xl text-xs font-bold text-zinc-800 transition active:scale-95 cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-black" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>GitHub</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Security guarantee */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                <span>256-bit SSL encryption • SOC2 Type II Certified</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
