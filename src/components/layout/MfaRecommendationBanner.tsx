import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';

interface MfaBannerProps {
  onNavigateToAccount: () => void;
}

export const MfaRecommendationBanner: React.FC<MfaBannerProps> = ({ onNavigateToAccount }) => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !user) return null;

  const roleLower = String(user.role || '').toLowerCase();
  const isAdminOrOwner = roleLower === 'owner' || roleLower === 'admin';

  if (!isAdminOrOwner || user.mfaEnabled) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 shadow-md flex items-center justify-between gap-4 text-sm font-body z-40 relative">
      <div className="flex items-center gap-3 max-w-5xl mx-auto">
        <div className="p-1.5 bg-amber-700/60 rounded-xl shrink-0">
          <ShieldAlert className="w-5 h-5 text-amber-100" />
        </div>
        <div>
          <span className="font-bold">Security Recommendation:</span> Two-Factor Authentication (MFA) is recommended for all <span className="uppercase font-extrabold">{user.role}</span> roles to safeguard your workspace.
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onNavigateToAccount}
          className="px-4 py-1.5 bg-white text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-50 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>Enable MFA Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-100 hover:text-white rounded-lg hover:bg-amber-700/40 transition cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
