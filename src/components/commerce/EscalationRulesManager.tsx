import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { EscalationRules } from '../../types';
import {
  ShieldAlert,
  Save,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Scale,
  Trash2,
  Plus,
  Sliders,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const EscalationRulesManager: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  const [rules, setRules] = useState<EscalationRules>({
    enabled: true,
    refundThreshold: 100,
    escalateOnRefundsOverThreshold: true,
    escalateOnAccountDeletion: true,
    escalateOnLegalThreats: true,
    escalateOnChargeback: true,
    customSensitiveKeywords: ['lawyer', 'attorney', 'sue', 'lawsuit', 'bbb', 'chargeback'],
    sensitiveTopics: ['account_deletion', 'chargeback', 'legal_threat', 'data_privacy', 'security_breach'],
    customKeywords: ['sue', 'lawyer', 'attorney', 'fraud', 'bbb', 'scam', 'police', 'arbitration'],
    autoEscalateVip: true,
    forceHumanOnNegativeSentiment: true,
  });

  const getAuthHeaders = () => {
    const currentToken = localStorage.getItem('auth_token') || token;
    return {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
  };

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/escalation-rules', { headers: getAuthHeaders() });
        const data = await res.json();
        if (data.success && data.rules) {
          setRules(prev => ({
            ...prev,
            ...data.rules,
            sensitiveTopics: data.rules.sensitiveTopics || prev.sensitiveTopics || ['account_deletion', 'chargeback', 'legal_threat', 'data_privacy', 'security_breach'],
            customKeywords: data.rules.customKeywords || prev.customKeywords || ['sue', 'lawyer', 'attorney', 'fraud', 'bbb', 'scam', 'police', 'arbitration'],
            customSensitiveKeywords: data.rules.customSensitiveKeywords || prev.customSensitiveKeywords || [],
          }));
        }
      } catch (err) {
        console.error('Failed to load escalation rules:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/escalation-rules', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(rules),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save rules');
      }
    } catch (err: any) {
      alert('Error saving rules: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTopic = (topic: string) => {
    setRules(prev => {
      const currentTopics = prev.sensitiveTopics || [];
      const exists = currentTopics.includes(topic);
      return {
        ...prev,
        sensitiveTopics: exists
          ? currentTopics.filter(t => t !== topic)
          : [...currentTopics, topic],
      };
    });
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const kw = newKeyword.trim().toLowerCase();
    const currentKeywords = rules.customKeywords || [];
    if (!currentKeywords.includes(kw)) {
      setRules(prev => ({
        ...prev,
        customKeywords: [...(prev.customKeywords || []), kw],
      }));
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setRules(prev => ({
      ...prev,
      customKeywords: (prev.customKeywords || []).filter(k => k !== kw),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-500 text-white rounded-xl">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-zinc-950 font-heading">AI Guardrails & Escalation Rules</h2>
          </div>
          <p className="text-xs text-zinc-500 font-medium font-body">
            Configure automated rules that force AI bots to trigger <code className="bg-zinc-100 px-1 py-0.5 rounded text-[11px] font-mono">escalate_to_human</code> when sensitive boundaries are met.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="py-2.5 px-5 text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <span>Saving Rules...</span>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Guardrails</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rule 1: Financial & Refund Threshold */}
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-950 font-heading">Max Refund / Transaction Threshold</h3>
              <p className="text-[11px] text-zinc-500">Auto-escalate requests exceeding this dollar amount</p>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold text-zinc-800">
              Refund Escalation Ceiling: <span className="font-mono text-zinc-950">${rules.refundThreshold} USD</span>
            </label>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={rules.refundThreshold}
              onChange={e => setRules(prev => ({ ...prev, refundThreshold: Number(e.target.value) }))}
              className="w-full accent-zinc-950 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-zinc-400">
              <span>$20</span>
              <span>$100</span>
              <span>$250</span>
              <span>$500+</span>
            </div>
            <p className="text-[11px] text-zinc-600">
              Any customer requesting refunds or order adjustments greater than <strong>${rules.refundThreshold}</strong> will immediately route to a human supervisor.
            </p>
          </div>
        </div>

        {/* Rule 2: Automatic Sensitive Topics */}
        <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-zinc-950 font-heading">Sensitive Category Triggers</h3>
              <p className="text-[11px] text-zinc-500">Toggle domain scenarios that bypass AI automatically</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { id: 'account_deletion', label: 'GDPR / Account Deletion Requests', desc: 'Personal data erasure requests' },
              { id: 'chargeback', label: 'Disputes & Chargeback Threats', desc: 'Credit card dispute or fraud claims' },
              { id: 'legal_threat', label: 'Legal & Regulatory Compliance', desc: 'Mentions of attorneys or litigation' },
              { id: 'security_breach', label: 'Security & Compromised Accounts', desc: 'Unauthorized access or hacked credentials' },
            ].map(item => {
              const active = (rules.sensitiveTopics || []).includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleTopic(item.id)}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    active
                      ? 'bg-zinc-950 text-white border-zinc-950'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className={`text-[10px] ${active ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.desc}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    active ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {active ? 'Active' : 'Off'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rule 3: Custom Trigger Keywords */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-zinc-950 font-heading">Custom Sensitive Trigger Keywords</h3>
            <p className="text-[11px] text-zinc-500">Live visitor messages containing any of these keywords immediately trigger human handoff</p>
          </div>
        </div>

        <form onSubmit={handleAddKeyword} className="flex gap-2">
          <input
            type="text"
            placeholder="Add keyword (e.g. attorney, scam, bbb, sue)..."
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-950"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Keyword</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {(rules.customKeywords || []).map(kw => (
            <span
              key={kw}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-800 rounded-lg text-xs font-mono border border-zinc-200"
            >
              <span>{kw}</span>
              <button
                type="button"
                onClick={() => handleRemoveKeyword(kw)}
                className="text-zinc-400 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
