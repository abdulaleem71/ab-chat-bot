import React from 'react';
import { Shield, Clock, Globe, Terminal, User, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { AdminAuditLog } from '../types';

interface AuditDetailModalProps {
  log: AdminAuditLog | null;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  let parsedDetails: any = null;
  try {
    if (log.detailsJson) {
      parsedDetails = JSON.parse(log.detailsJson);
    }
  } catch (e) {
    parsedDetails = log.detailsJson;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Audit Event Record
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  log.status === 'success'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : log.status === 'blocked'
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {log.status}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{log.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-500 block mb-1">Action Type</span>
            <span className="font-mono font-bold text-white break-all">{log.action}</span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-500 block mb-1">Actor Email</span>
            <span className="font-mono text-indigo-400 font-medium break-all">{log.adminEmail}</span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-500 block mb-1">Timestamp</span>
            <span className="text-zinc-300">{new Date(log.createdAt).toLocaleString()}</span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-500 block mb-1">Target Resource</span>
            <span className="text-zinc-300 font-mono">{log.targetResource || 'N/A'}</span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-500 block mb-1">Target ID</span>
            <span className="text-zinc-300 font-mono">{log.targetId || 'N/A'}</span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
            <span className="text-zinc-500 block mb-1">Origin IP Address</span>
            <span className="text-zinc-300 font-mono">{log.ipAddress || '127.0.0.1'}</span>
          </div>
        </div>

        {/* User Agent */}
        {log.userAgent && (
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 text-xs">
            <span className="text-zinc-500 block mb-1">User Agent Header</span>
            <span className="text-zinc-400 font-mono break-all">{log.userAgent}</span>
          </div>
        )}

        {/* Details Payload */}
        <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
          <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            Event Context & Payload (JSON)
          </div>
          <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
            {parsedDetails ? JSON.stringify(parsedDetails, null, 2) : '// No structured payload recorded'}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
};
