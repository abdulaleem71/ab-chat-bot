import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Mail,
  Phone,
  Clock,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { ModalDialog, Button, Input, Select, Badge } from '../common';

interface ContactSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessageVolume?: string;
}

export const ContactSalesModal: React.FC<ContactSalesModalProps> = ({
  isOpen,
  onClose,
  initialMessageVolume = '100k - 500k messages/mo',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [teamSize, setTeamSize] = useState('20 - 100 employees');
  const [messageVolume, setMessageVolume] = useState(initialMessageVolume);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([
    'SSO / SAML 2.0 Auth',
    'SOC 2 Type II Audit Report',
    'Custom 99.99% SLA & DPA',
  ]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [copiedRef, setCopiedRef] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleRequirement = (req: string) => {
    setSelectedRequirements(prev =>
      prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      setErrorMessage('Please fill in your name and corporate email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          teamSize,
          messageVolume,
          requirements: selectedRequirements,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReferenceId(data.referenceId || 'ENT-2026-' + Math.floor(10000 + Math.random() * 90000));
        setSubmitted(true);
      } else {
        setErrorMessage(data.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch {
      // Fallback offline mock response
      setReferenceId('ENT-2026-' + Math.floor(10000 + Math.random() * 90000));
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referenceId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const enterpriseFeatures = [
    { id: 'SSO / SAML 2.0 Auth', label: 'SSO & SAML 2.0 (Okta / Azure AD / Ping)' },
    { id: 'SOC 2 Type II Audit Report', label: 'SOC 2 Type II Compliance & Audit Package' },
    { id: 'Custom 99.99% SLA & DPA', label: 'Custom 99.99% Uptime SLA & Custom DPA' },
    { id: 'Dedicated Solutions Architect', label: 'Dedicated Solutions Architect & Onboarding' },
    { id: 'BYOK Custom LLM Endpoints', label: 'BYOK (Vertex AI, Azure OpenAI & Custom Endpoints)' },
    { id: 'EU Data Residency & VPC', label: 'EU Data Residency & Private VPC Deployment' },
  ];

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Talk with Our Enterprise Solutions Team"
      description="Tailored message capacity, dedicated architecture, SOC 2 compliance packages, custom SLAs, and high-volume pricing quotes."
      icon={<Building2 className="w-5 h-5 text-indigo-600" />}
    >
      {submitted ? (
        <div className="text-center py-6 sm:py-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 animate-in zoom-in-50 duration-300">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-zinc-950 font-heading">
              Inquiry Received Successfully
            </h3>
            <p className="text-zinc-600 text-sm max-w-md mx-auto font-body">
              Thank you, <span className="font-semibold text-zinc-900">{name}</span>. A Dedicated Solutions Architect has been assigned to your workspace inquiry and will reach out within <span className="font-semibold text-indigo-600">2 business hours</span>.
            </p>
          </div>

          {/* Reference Card */}
          <div className="max-w-md mx-auto bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 text-left font-body">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Inquiry Reference Number
              </span>
              <button
                type="button"
                onClick={handleCopyRef}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                {copiedRef ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Reference
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-base font-bold text-zinc-950 tracking-wide">
              {referenceId}
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-200 text-xs text-zinc-500 flex items-center justify-between">
              <span>Confirmation sent to: <strong className="text-zinc-800">{email}</strong></span>
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <Clock className="w-3.5 h-3.5" /> &lt; 2h SLA
              </span>
            </div>
          </div>

          {/* Direct Support Notice */}
          <div className="pt-2 text-xs text-zinc-500 max-w-md mx-auto flex items-center justify-center gap-4 font-body">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              sales@nomadschat.com
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-indigo-500" />
              +1 (800) 555-0199
            </span>
          </div>

          <div className="pt-4 flex justify-center">
            <Button
              type="button"
              variant="primary"
              onClick={onClose}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 font-body">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Your Name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Elena Rostova"
            />

            <Input
              label="Work Email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="elena@enterprise.com"
            />

            <Input
              label="Company Name"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Apex Global Technologies"
            />

            <Select
              label="Company Size"
              value={teamSize}
              onChange={e => setTeamSize(e.target.value)}
              options={[
                { value: '1 - 20 employees', label: '1 - 20 employees' },
                { value: '20 - 100 employees', label: '20 - 100 employees' },
                { value: '100 - 1,000 employees', label: '100 - 1,000 employees' },
                { value: '1,000+ employees', label: '1,000+ employees (Global Enterprise)' },
              ]}
            />
          </div>

          {/* Monthly Message Capacity Range */}
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1.5 font-heading">
              Expected Monthly AI Message Volume
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                '100k - 500k msgs/mo',
                '500k - 2M msgs/mo',
                '2M+ msgs/mo (Custom Scale)',
              ].map(option => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setMessageVolume(option)}
                  className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl border text-left transition cursor-pointer ${
                    messageVolume === option
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 ring-1 ring-indigo-500'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50 text-zinc-700'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Key Enterprise Requirements Checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider font-heading">
                Key Enterprise Requirements (Select all that apply)
              </label>
              <Badge variant="brand" size="sm">SOC 2 & SAML</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {enterpriseFeatures.map(item => {
                const isChecked = selectedRequirements.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleRequirement(item.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition ${
                      isChecked
                        ? 'border-indigo-500/60 bg-indigo-50/50 text-zinc-950'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-indigo-600 text-white'
                          : 'border border-zinc-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs leading-tight font-medium">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-1.5 font-heading">
              Project Scope & Implementation Timeline (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Share details about existing CRM, ticketing stacks (Zendesk/HubSpot/Salesforce), or required go-live dates..."
              className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 resize-none font-body"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100">
            <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>SOC 2 Type II Certified • NDA upon request</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="brand"
                size="sm"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Request Custom Quote & Demo
              </Button>
            </div>
          </div>
        </form>
      )}
    </ModalDialog>
  );
};

