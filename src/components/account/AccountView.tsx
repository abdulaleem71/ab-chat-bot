import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, Mail, Shield, Key, Save, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Lock, ExternalLink } from 'lucide-react';
import { MotionButton } from '../common/MotionButton';

export const AccountView: React.FC = () => {
  const { user, refreshTenant, verifySession } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Email verification resend
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  // Transactional email outbox (for sandbox testing)
  const [transactionalEmails, setTransactionalEmails] = useState<any[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);

  // MFA state
  const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [resetEmailId, setResetEmailId] = useState<string | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');

  const handleStartMfaSetup = async () => {
    setMfaError('');
    setMfaSuccess('');
    try {
      const res = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMfaSecret(data.secret);
        setMfaQrCode(data.qrCode);
        setIsSettingUpMfa(true);
      } else {
        setMfaError(data.error || 'Failed to start MFA setup.');
      }
    } catch (err: any) {
      setMfaError(err.message || 'Network error.');
    }
  };

  const handleVerifyAndEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError('');
    try {
      const res = await fetch('/api/auth/mfa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ secret: mfaSecret, code: mfaCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedBackupCodes(data.backupCodes || []);
        setShowBackupCodesModal(true);
        setIsSettingUpMfa(false);
        setMfaCode('');
        refreshTenant();
      } else {
        setMfaError(data.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setMfaError(err.message || 'Network error.');
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError('');
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMfaSuccess('Two-factor authentication has been disabled.');
        setShowDisableModal(false);
        setDisablePassword('');
        refreshTenant();
      } else {
        setMfaError(data.error || 'Failed to disable MFA.');
      }
    } catch (err: any) {
      setMfaError(err.message || 'Network error.');
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const fetchTransactionalEmails = async () => {
    setIsLoadingEmails(true);
    try {
      const res = await fetch('/api/tenant/transactional-emails', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.emails) {
        setTransactionalEmails(data.emails);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingEmails(false);
    }
  };

  useEffect(() => {
    fetchTransactionalEmails();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, avatarUrl }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileSuccess('Profile updated successfully!');
        refreshTenant();
      } else {
        setProfileError(data.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Network error.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordSuccess('');
    setPasswordError('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Failed to change password.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Network error.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMsg('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendMsg('Verification email sent! Check your outbox below.');
        fetchTransactionalEmails();
      } else {
        setResendMsg(data.error || 'Failed to send verification email.');
      }
    } catch (err: any) {
      setResendMsg(err.message || 'Network error.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 font-body">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-black text-white font-heading font-bold text-2xl flex items-center justify-center overflow-hidden shadow-inner">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              (name || user.email || 'U').charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-zinc-900 font-heading">{name || 'User Account'}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                user.emailVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {user.emailVerified ? 'Verified' : 'Unverified Email'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">{user.email} • Role: <strong className="text-zinc-700">{user.role}</strong></p>
          </div>
        </div>

        {!user.emailVerified && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex flex-col gap-2 max-w-sm">
            <p className="text-xs text-amber-800 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              Your email is unverified. Core features are restricted.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="px-3 py-1.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
              >
                {isResending ? 'Sending...' : 'Resend Verification'}
              </button>
              {resendMsg && <span className="text-xs font-medium text-amber-900">{resendMsg}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Details Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 font-heading">Personal Profile</h2>
              <p className="text-xs text-zinc-500 font-medium">Update your name and avatar appearance</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 font-heading">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:border-black focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 font-heading">Email Address (Read-Only)</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-500 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 font-heading">Avatar Image URL</label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:border-black focus:outline-hidden font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold font-heading hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 font-heading">Security & Password</h2>
              <p className="text-xs text-zinc-500 font-medium">Update your account password</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 font-heading">Current Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:border-black focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 font-heading">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:border-black focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1 font-heading">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:border-black focus:outline-hidden font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="w-full py-2.5 bg-black text-white rounded-xl text-xs font-bold font-heading hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {isChangingPassword ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 font-heading">Two-Factor Authentication (TOTP)</h3>
                <p className="text-xs text-zinc-500 font-medium">Add an extra layer of security using an authenticator app</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              user.mfaEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
            }`}>
              {user.mfaEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {mfaSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {mfaSuccess}
            </div>
          )}

          {mfaError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {mfaError}
            </div>
          )}

          {!user.mfaEnabled && !isSettingUpMfa && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-600 leading-relaxed">
                Protect your account with Time-based One-Time Passwords (TOTP) compatible with Google Authenticator, Authy, 1Password, or Bitwarden.
              </p>
              <button
                onClick={handleStartMfaSetup}
                className="px-4 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer flex items-center gap-2 font-heading"
              >
                <Shield className="w-4 h-4" />
                <span>Set up Two-Factor Authentication</span>
              </button>
            </div>
          )}

          {!user.mfaEnabled && isSettingUpMfa && (
            <div className="space-y-6 bg-zinc-50 p-6 rounded-2xl border border-zinc-200">
              <div className="text-center space-y-2">
                <h4 className="text-sm font-bold text-zinc-900 font-heading">Scan QR Code</h4>
                <p className="text-xs text-zinc-500">Scan this QR code with your authenticator app, or enter the secret key manually.</p>
              </div>

              {mfaQrCode && (
                <div className="flex justify-center">
                  <img src={mfaQrCode} alt="TOTP QR Code" className="w-44 h-44 border border-zinc-200 rounded-2xl p-2 bg-white shadow-xs" />
                </div>
              )}

              <div className="text-center">
                <span className="text-[10px] text-zinc-400 block mb-1">Manual Setup Key:</span>
                <code className="text-xs bg-white px-3 py-1.5 rounded-lg font-mono border border-zinc-200 select-all font-bold text-zinc-800">{mfaSecret}</code>
              </div>

              <form onSubmit={handleVerifyAndEnableMfa} className="space-y-4 max-w-sm mx-auto">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1 font-heading text-center">Enter 6-digit Code from App</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest text-lg px-3.5 py-2.5 border border-zinc-200 rounded-xl focus:border-black focus:outline-hidden font-mono font-bold bg-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSettingUpMfa(false)}
                    className="w-1/2 py-2.5 bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Verify & Enable
                  </button>
                </div>
              </form>
            </div>
          )}

          {user.mfaEnabled && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">✓</div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 font-heading">Authenticator App Connected</h4>
                    <p className="text-[11px] text-emerald-700">Your account is secured with 2FA.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDisableModal(true)}
                  className="px-3.5 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 transition cursor-pointer shrink-0"
                >
                  Disable 2FA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disable MFA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-xl border border-zinc-200 space-y-4">
            <h3 className="text-base font-bold text-zinc-900 font-heading">Disable Two-Factor Authentication</h3>
            <p className="text-xs text-zinc-500">Please enter your account password to confirm disabling 2FA.</p>
            <form onSubmit={handleDisableMfa} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1 font-heading">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={disablePassword}
                  onChange={e => setDisablePassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-zinc-200 rounded-xl focus:border-black focus:outline-hidden font-medium"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDisableModal(false); setDisablePassword(''); }}
                  className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition cursor-pointer"
                >
                  Confirm Disable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Backup Codes Modal */}
      {showBackupCodesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 sm:p-8 rounded-3xl shadow-2xl border border-zinc-200 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto font-bold text-xl">🛡️</div>
              <h3 className="text-lg font-extrabold text-zinc-900 font-heading">Save Your Backup Codes</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Two-factor authentication is now enabled. Save these 8 backup recovery codes in a secure place. If you lose access to your authenticator app, you can use each code once to log in.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 font-mono text-xs font-bold text-zinc-800 text-center">
              {generatedBackupCodes.map((code, idx) => (
                <div key={idx} className="bg-white p-2 rounded-xl border border-zinc-200 shadow-xs select-all">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedBackupCodes.join('\n'));
                  setCopiedBackupCodes(true);
                  toast.success('Copied', 'Backup codes copied to clipboard.');
                  setTimeout(() => setCopiedBackupCodes(false), 2500);
                }}
                className="w-full sm:w-1/2 py-2.5 bg-zinc-100 text-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-200 transition cursor-pointer"
              >
                {copiedBackupCodes ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={async () => {
                  setShowBackupCodesModal(false);
                  await verifySession();
                }}
                className="w-full sm:w-1/2 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer"
              >
                I Have Saved These Codes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Transactional Emails / Verification Link Outbox */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 font-heading">Simulated Transactional Email Outbox</h3>
              <p className="text-xs text-zinc-500 font-medium">Test verification and password reset links generated by the app</p>
            </div>
          </div>
          <button
            onClick={fetchTransactionalEmails}
            className="p-2 text-zinc-500 hover:text-black rounded-xl hover:bg-zinc-100 transition cursor-pointer"
            title="Refresh emails"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingEmails ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {transactionalEmails.length === 0 ? (
          <div className="py-8 text-center text-zinc-400 text-xs font-medium">
            No emails sent yet. Register a new account or trigger a password reset to see emails here.
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {transactionalEmails.map((em: any) => (
              <div key={em.id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                      {em.type}
                    </span>
                    <span className="text-xs font-bold text-zinc-800">{em.subject}</span>
                    <span className="text-[10px] text-zinc-400">To: {em.to_email}</span>
                  </div>
                  <p className="text-xs text-zinc-600 line-clamp-2">{em.body}</p>
                  <span className="text-[10px] text-zinc-400">{new Date(em.created_at).toLocaleString()}</span>
                </div>
                {em.token && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {em.type !== 'verification' && resetEmailId === em.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          placeholder="New password (min 6)"
                          value={resetPasswordInput}
                          onChange={(e) => setResetPasswordInput(e.target.value)}
                          className="px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-hidden focus:border-zinc-900"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (resetPasswordInput.trim().length < 6) {
                              toast.error('Invalid Password', 'Password must be at least 6 characters.');
                              return;
                            }
                            const res = await fetch('/api/auth/reset-password', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ resetToken: em.token, newPassword: resetPasswordInput }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              toast.success('Password Reset', data.message || 'Password updated.');
                              setResetEmailId(null);
                              setResetPasswordInput('');
                            } else {
                              toast.error('Reset Failed', data.error || 'Could not reset password.');
                            }
                          }}
                          className="px-3 py-1.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResetEmailId(null);
                            setResetPasswordInput('');
                          }}
                          className="px-2.5 py-1.5 bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold hover:bg-zinc-300 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          if (em.type === 'verification') {
                            const res = await fetch('/api/auth/verify-email', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ token: em.token }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              toast.success('Verified', 'Email verified successfully!');
                              await refreshTenant();
                              await verifySession();
                            } else {
                              toast.error('Verification Failed', data.error || 'Verification failed');
                            }
                          } else {
                            setResetEmailId(em.id);
                            setResetPasswordInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Simulate Action</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
