import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Lock, Globe, CheckCircle2, Download, Trash2 } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms' | 'gdpr';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-zinc-200 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shadow-xs">
                {type === 'privacy' && <ShieldCheck className="w-5 h-5" />}
                {type === 'terms' && <FileText className="w-5 h-5" />}
                {type === 'gdpr' && <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-zinc-950 font-heading">
                  {type === 'privacy' && 'Privacy Policy & Data Security'}
                  {type === 'terms' && 'Terms of Service'}
                  {type === 'gdpr' && 'GDPR & Tenant Data Deletion Path'}
                </h3>
                <p className="text-xs text-zinc-500 font-medium font-body">
                  NomadsChat by NomadsArc • Effective Date: August 2026
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-600 leading-relaxed font-body">
            {type === 'privacy' && (
              <>
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-950 font-heading">1. Data Ingestion & Isolation</h4>
                  <p>
                    NomadsChat processes and indexes customer knowledge documents and website URLs strictly to ground RAG model responses. Tenant data is logically isolated with per-workspace UUID namespaces. No tenant data is shared or mixed across workspaces.
                  </p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-950 font-heading">2. AI Model Training Protections</h4>
                  <p>
                    Customer prompts, retrieved context chunks, and live conversations are <strong>never used to train underlying foundational models</strong> (Gemini 3.7 Flash & 3.1 Pro). All model inference operates via zero-data-retention enterprise endpoints.
                  </p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-950 font-heading">3. Storage & Encryption</h4>
                  <p>
                    All vector embeddings, chat histories, and captured visitor leads are encrypted at rest using AES-256 and in transit via TLS 1.3 encryption protocols.
                  </p>
                </section>
              </>
            )}

            {type === 'terms' && (
              <>
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-950 font-heading">1. Service Level & Usage</h4>
                  <p>
                    NomadsChat provides an autonomous AI customer support platform. Users agree to utilize the platform in compliance with applicable telecommunication laws and prohibited abuse standards.
                  </p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-950 font-heading">2. Quota & Overage Policies</h4>
                  <p>
                    Paid subscriptions (Growth Pro, Enterprise Ultra) include transparent soft-cap protection billed at $10 per 1,000 extra messages with zero service downtime. Starter Free tiers pause when the 500-message monthly cap is reached.
                  </p>
                </section>
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-950 font-heading">3. Bring Your Own Key (BYOK)</h4>
                  <p>
                    Enterprise customers utilizing BYOK are responsible for their own API rate limits and model consumption costs with external providers (Google Vertex AI, Azure OpenAI).
                  </p>
                </section>
              </>
            )}

            {type === 'gdpr' && (
              <>
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-950 font-heading">GDPR & CCPA Tenant Data Deletion</h4>
                  <p>
                    In accordance with GDPR Article 17 ("Right to Erasure") and CCPA guidelines, tenant administrators can permanently purge all stored documents, scraped knowledge vectors, customer conversation logs, and captured leads at any time.
                  </p>
                </section>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                    <Trash2 className="w-4 h-4 text-amber-700" />
                    <span>Permanent Workspace Data Purge Path</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    To request complete account removal or export a full JSON archive of all tenant logs, contact privacy@nomadschat.com or click Export Data below.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200/80 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
