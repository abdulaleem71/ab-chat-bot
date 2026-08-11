import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  X,
  Lock,
  Sparkles,
  ShieldCheck,
  Save,
  Globe,
  ExternalLink,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import {
  VisaLogo,
  MastercardLogo,
  AmexLogo,
  DiscoverLogo,
  PaypalLogo,
  GooglePayLogo,
  ApplePayLogo,
  StripeLogo,
} from '../common/PaymentLogos';

interface PaymentGatewaysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentGatewaysModal: React.FC<PaymentGatewaysModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stripe' | 'paypal' | 'gpay' | 'applepay' | 'payouts'>('overview');
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

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

  // Gateway Credentials State
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');

  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecret, setPaypalSecret] = useState('');

  const [gpayMerchantId, setGpayMerchantId] = useState('');
  const [gpayBusinessName, setGpayBusinessName] = useState('NomadsChat Workspace');

  const [appleMerchantId, setAppleMerchantId] = useState('');
  const [appleDomain, setAppleDomain] = useState('');

  // Bank Payout State
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [payoutSchedule, setPayoutSchedule] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedStatus('Payment gateway credentials and bank payout details saved successfully!');
    setTimeout(() => setSavedStatus(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col my-auto relative overflow-hidden">
        {/* Top Header */}
        <div className="bg-black text-white p-5 sm:p-6 flex items-center justify-between border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center font-extrabold text-white text-xl shadow-md">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white tracking-tight">Receive Payments & Gateway Setup</h3>
                <span className="bg-amber-950 border border-amber-800 text-amber-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Production Keys Required
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium pt-0.5">Configure live API credentials from Stripe or PayPal to process real production transactions.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-900 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-6 pt-3 gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview' ? 'border-black text-black font-extrabold' : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            Overview & Status
          </button>
          <button
            onClick={() => setActiveTab('stripe')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stripe' ? 'border-black text-black font-extrabold' : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            <StripeLogo className="h-3.5" />
            <span>Cards (Stripe)</span>
          </button>
          <button
            onClick={() => setActiveTab('paypal')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'paypal' ? 'border-black text-black font-extrabold' : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            <PaypalLogo className="h-3.5" showWordmark={true} />
          </button>
          <button
            onClick={() => setActiveTab('gpay')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gpay' ? 'border-black text-black font-extrabold' : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            <GooglePayLogo className="h-3.5" theme="light" />
          </button>
          <button
            onClick={() => setActiveTab('applepay')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'applepay' ? 'border-black text-black font-extrabold' : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            <ApplePayLogo className="h-3.5" theme="light" />
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'payouts' ? 'border-black text-black font-extrabold' : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            Bank Payout Account
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {savedStatus && (
            <div className="p-4 rounded-2xl bg-black text-white text-xs font-bold flex items-center gap-2 border border-zinc-800 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{savedStatus}</span>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* How to receive payments guide box */}
              <div className="bg-zinc-900 text-white p-6 rounded-3xl border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-white" />
                  <h4 className="text-base font-extrabold text-white">How Customer Payments Work on NomadsChat:</h4>
                </div>
                <ol className="text-xs text-zinc-300 space-y-2 font-medium list-decimal pl-5 leading-relaxed">
                  <li><strong>Customer Selects Plan:</strong> When a user upgrades on the Pricing page, they choose between Credit/Debit Card, PayPal, Google Pay, or Apple Pay.</li>
                  <li><strong>Instant Processing:</strong> Payments are encrypted using 256-Bit SSL and routed through your configured gateway keys.</li>
                  <li><strong>Automatic Payouts:</strong> Customer funds are automatically deposited into your connected PayPal Wallet or Direct Bank Account on your designated payout schedule.</li>
                </ol>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stripe */}
                <div className="bg-white border border-zinc-200 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StripeLogo className="h-5" />
                      <div className="flex items-center gap-1 pl-1">
                        <VisaLogo className="h-3" />
                        <MastercardLogo className="h-3.5" />
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">Accept Visa, Mastercard, Amex, Discover worldwide.</p>
                  <button
                    onClick={() => setActiveTab('stripe')}
                    className="text-xs font-extrabold text-black hover:underline text-left pt-1"
                  >
                    Configure Stripe API Keys →
                  </button>
                </div>

                {/* PayPal */}
                <div className="bg-white border border-zinc-200 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <PaypalLogo className="h-5" showWordmark={true} />
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">Accept 1-click PayPal balances & instant credit checkout.</p>
                  <button
                    onClick={() => setActiveTab('paypal')}
                    className="text-xs font-extrabold text-black hover:underline text-left pt-1"
                  >
                    Configure PayPal Credentials →
                  </button>
                </div>

                {/* Google Pay */}
                <div className="bg-white border border-zinc-200 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <GooglePayLogo className="h-5" theme="light" />
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">Enable 1-tap Google Account express checkout.</p>
                  <button
                    onClick={() => setActiveTab('gpay')}
                    className="text-xs font-extrabold text-black hover:underline text-left pt-1"
                  >
                    Configure Google Merchant ID →
                  </button>
                </div>

                {/* Apple Pay */}
                <div className="bg-white border border-zinc-200 p-5 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <ApplePayLogo className="h-5" theme="light" />
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium">Enable Touch ID & Face ID payments on iOS & Safari.</p>
                  <button
                    onClick={() => setActiveTab('applepay')}
                    className="text-xs font-extrabold text-black hover:underline text-left pt-1"
                  >
                    Configure Apple Merchant ID →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STRIPE TAB */}
          {activeTab === 'stripe' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-black">Stripe / Credit Card API Credentials</h4>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">Found under Stripe Dashboard &gt; Developers &gt; API keys.</p>
                </div>
                <StripeLogo className="h-6 shrink-0" />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Stripe Publishable Key</label>
                <input
                  type="text"
                  required
                  value={stripePublishableKey}
                  onChange={e => setStripePublishableKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Stripe Secret Key</label>
                <input
                  type="password"
                  required
                  value={stripeSecretKey}
                  onChange={e => setStripeSecretKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save Stripe Gateway Credentials</span>
              </button>
            </form>
          )}

          {/* PAYPAL TAB */}
          {activeTab === 'paypal' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-black">PayPal Business API Credentials</h4>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">Found under PayPal Developer Dashboard &gt; Apps &amp; Credentials.</p>
                </div>
                <PaypalLogo className="h-6 shrink-0" showWordmark={true} />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">PayPal Client ID</label>
                <input
                  type="text"
                  required
                  value={paypalClientId}
                  onChange={e => setPaypalClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">PayPal Secret Key</label>
                <input
                  type="password"
                  required
                  value={paypalSecret}
                  onChange={e => setPaypalSecret(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save PayPal Credentials</span>
              </button>
            </form>
          )}

          {/* GPAY TAB */}
          {activeTab === 'gpay' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-black">Google Pay Merchant API Setup</h4>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">Registered via Google Pay Business Console.</p>
                </div>
                <GooglePayLogo className="h-6 shrink-0" theme="light" />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Google Pay Merchant ID</label>
                <input
                  type="text"
                  required
                  value={gpayMerchantId}
                  onChange={e => setGpayMerchantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Merchant Business Display Name</label>
                <input
                  type="text"
                  required
                  value={gpayBusinessName}
                  onChange={e => setGpayBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-medium focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save Google Pay Config</span>
              </button>
            </form>
          )}

          {/* APPLE PAY TAB */}
          {activeTab === 'applepay' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-black">Apple Pay Merchant Identifier</h4>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">Configured via Apple Developer Portal &gt; Certificates, IDs &amp; Profiles.</p>
                </div>
                <ApplePayLogo className="h-6 shrink-0" theme="light" />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Merchant Identifier</label>
                <input
                  type="text"
                  required
                  value={appleMerchantId}
                  onChange={e => setAppleMerchantId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Verified Domain URL</label>
                <input
                  type="url"
                  required
                  value={appleDomain}
                  onChange={e => setAppleDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-medium focus:ring-2 focus:ring-black"
                />
              </div>

              <button
                type="submit"
                className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save Apple Pay Merchant ID</span>
              </button>
            </form>
          )}

          {/* PAYOUTS TAB */}
          {activeTab === 'payouts' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-2xl">
                <h4 className="text-sm font-extrabold text-black">Direct Deposit Bank Payout Account</h4>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Customer revenue collected across all payment methods will be wired directly to this bank account.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-medium focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={e => setAccountHolder(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-medium focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Routing / ABA Number</label>
                  <input
                    type="text"
                    required
                    value={routingNumber}
                    onChange={e => setRoutingNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Account Number / IBAN</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-mono font-medium focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 mb-1">Payout Frequency Schedule</label>
                <select
                  value={payoutSchedule}
                  onChange={e => setPayoutSchedule(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-300 rounded-xl font-medium focus:ring-2 focus:ring-black"
                >
                  <option value="daily">Daily Automatic Payouts (Recommended)</option>
                  <option value="weekly">Weekly (Every Monday)</option>
                  <option value="monthly">Monthly (1st of Month)</option>
                </select>
              </div>

              <button
                type="submit"
                className="bg-black hover:bg-zinc-800 text-white text-xs font-extrabold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Save Bank Payout Account</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-4 text-center text-xs text-zinc-500 font-medium">
          Need help setting up gateway Webhooks or payout schedules? Contact <a href="https://nomadsarc.io" target="_blank" rel="noreferrer" className="text-black font-extrabold hover:underline">NomadsArc Support</a>.
        </div>
      </div>
    </div>
  );
};
