import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  FileCheck,
  Server,
  KeyRound,
  EyeOff,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Download,
  Mail,
  Layers,
  Database,
  Globe
} from 'lucide-react';
import { NomadsLogo } from '../common/NomadsLogo';

interface SecurityPageProps {
  onReturnToApp?: () => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ onReturnToApp }) => {
  const complianceBadges = [
    { name: 'SOC 2 Type II', subtitle: 'Security & Availability Certified', status: 'Compliant' },
    { name: 'GDPR / CCPA', subtitle: 'EU & California Privacy Framework', status: 'Compliant' },
    { name: 'HIPAA-Eligible', subtitle: 'BAA Available for Enterprise Tiers', status: 'Ready' },
    { name: 'ISO/IEC 27001', subtitle: 'Information Security Governance', status: 'Certified' },
  ];

  const subProcessors = [
    {
      name: 'Google Cloud Platform (GCP)',
      purpose: 'Core application compute, Gemini AI inference, and serverless hosting',
      location: 'United States & European Union',
      certification: 'SOC 1/2/3, ISO 27001, HIPAA',
    },
    {
      name: 'Cloudflare, Inc.',
      purpose: 'Global edge CDN, DDoS mitigation, DNS, and Web Application Firewall (WAF)',
      location: 'Global Edge Network (275+ cities)',
      certification: 'SOC 2 Type II, ISO 27001, PCI-DSS',
    },
    {
      name: 'Turso / ChiselStrike Inc.',
      purpose: 'Distributed SQLite database with AES-256 disk encryption and tenant isolation',
      location: 'United States (AWS us-east-1) & EU',
      certification: 'SOC 2 Type II, GDPR compliant',
    },
    {
      name: 'Stripe, Inc.',
      purpose: 'Secure subscription billing, payment tokens, and invoice processing',
      location: 'United States & Global',
      certification: 'PCI-DSS Level 1 Service Provider',
    },
    {
      name: 'SendGrid / Twilio Inc.',
      purpose: 'Transactional authentication emails and system notification delivery',
      location: 'United States',
      certification: 'SOC 2 Type II, ISO 27001',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans flex flex-col">
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NomadsLogo showText textClassName="text-base font-extrabold text-zinc-950 font-heading" />
            <span className="hidden sm:inline-block text-zinc-300">/</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Trust & Security Center
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (onReturnToApp) {
                  onReturnToApp();
                } else {
                  window.location.href = '/';
                }
              }}
              className="px-4 py-2 text-xs font-extrabold text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-10">
        {/* Security Hero Header */}
        <div className="bg-zinc-950 text-white rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enterprise-Grade Security Architecture</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-heading">
              Security, Privacy & Data Protection
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 font-medium leading-relaxed">
              At NomadsChat, customer trust is our highest priority. We safeguard your conversational data, proprietary knowledge documents, and customer records with defense-in-depth isolation.
            </p>
          </div>
        </div>

        {/* Compliance Certification Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {complianceBadges.map((badge, idx) => (
            <div
              key={idx}
              className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-zinc-950 font-heading">{badge.name}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {badge.status}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">{badge.subtitle}</p>
              </div>
              <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-bold text-zinc-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Compliance</span>
              </div>
            </div>
          ))}
        </div>

        {/* 4 Core Pillars of Data Protection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-zinc-950" />
            </div>
            <h3 className="text-sm font-extrabold text-zinc-950 font-heading">Zero Model Training Commitments</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              Your documents, knowledge embeddings, customer chat transcripts, and lead details are strictly private. We maintain explicit enterprise agreements ensuring customer data is <strong>never used to train or fine-tune public AI foundation models</strong>.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Lock className="w-5 h-5 text-zinc-950" />
            </div>
            <h3 className="text-sm font-extrabold text-zinc-950 font-heading">End-to-End Strong Encryption</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              All communications are enforced over <strong>TLS 1.3</strong> with HTTP Strict Transport Security (HSTS). Data at rest, including vector embeddings and conversation archives, is secured with <strong>AES-256 disk encryption</strong> and HMAC cryptographic hashing.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Database className="w-5 h-5 text-zinc-950" />
            </div>
            <h3 className="text-sm font-extrabold text-zinc-950 font-heading">Multi-Tenant Logical Isolation</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              Every workspace is provisioned with a strict <code className="font-mono text-zinc-900 bg-zinc-100 px-1 py-0.5 rounded">tenant_id</code> boundary. Server-side middleware verifies and enforces tenant authorization across every database read, write, and AI query.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-zinc-950" />
            </div>
            <h3 className="text-sm font-extrabold text-zinc-950 font-heading">Domain Lock & Origin Verification</h3>
            <p className="text-xs text-zinc-600 leading-relaxed font-medium">
              Embeddable widgets feature server-side origin domain verification. Unlocking or locking allowed hostnames prevents unauthorized third-party scraping and cross-origin iframe hijacking.
            </p>
          </div>
        </div>

        {/* Sub-processors Table */}
        <div className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-6 py-4.5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-zinc-950 font-heading">Authorized Sub-Processors Directory</h2>
              <p className="text-xs text-zinc-500 font-medium">
                Third-party infrastructure providers supporting NomadsChat services
              </p>
            </div>
            <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-full">
              Updated August 2026
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-6">Entity</th>
                  <th className="py-3 px-6">Service Purpose</th>
                  <th className="py-3 px-6">Data Hosting Region</th>
                  <th className="py-3 px-6">Certifications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {subProcessors.map((p, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/70 transition">
                    <td className="py-3.5 px-6 font-bold text-zinc-950">{p.name}</td>
                    <td className="py-3.5 px-6 font-medium text-zinc-600">{p.purpose}</td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-zinc-600">{p.location}</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                        {p.certification}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Contact & Whitepaper Section */}
        <div className="bg-zinc-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Mail className="w-3.5 h-3.5 text-white" />
              <span>Vulnerability Disclosure Program (VDP)</span>
            </div>
            <h3 className="text-base font-extrabold text-white font-heading">
              Report a Security Finding or Request SOC 2 Report
            </h3>
            <p className="text-xs text-zinc-400 max-w-lg">
              Our dedicated SecOps team responds to coordinated vulnerability disclosures within 24 hours. Enterprise customers can request our complete SOC 2 Type II audit report.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <a
              href="mailto:security@nomadschat.com"
              className="px-4 py-2.5 bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-extrabold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>security@nomadschat.com</span>
            </a>
          </div>
        </div>
      </main>

      {/* Standalone Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 NomadsChat Inc. Data protected under international privacy standards.</p>
          <div className="flex items-center gap-4">
            <a href="#status" onClick={(e) => { e.preventDefault(); window.location.hash = 'status'; }} className="hover:text-zinc-900 transition">System Status</a>
            <a href="https://nomadsarc.io" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-900 transition">NomadsArc Platform</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
