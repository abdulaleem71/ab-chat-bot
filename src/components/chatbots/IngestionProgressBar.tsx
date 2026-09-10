import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Loader2,
  Globe,
  FileCode,
  ShieldCheck,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export type IngestionStep = 'connecting' | 'parsing' | 'sanitizing' | 'chunking' | 'ready';

interface IngestionProgressBarProps {
  currentStep: IngestionStep;
  targetUrl?: string;
  sourceType?: 'url' | 'local' | 'faq' | 'text';
  error?: string | null;
}

interface StepConfig {
  id: IngestionStep;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
  {
    id: 'connecting',
    label: 'Connecting',
    description: 'Validating endpoint & DNS reachability',
    icon: <Globe className="w-3.5 h-3.5" />,
  },
  {
    id: 'parsing',
    label: 'Parsing HTML',
    description: 'Extracting DOM tree & document hierarchy',
    icon: <FileCode className="w-3.5 h-3.5" />,
  },
  {
    id: 'sanitizing',
    label: 'Sanitizing Content',
    description: 'Stripping noise, ads & boilerplate',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
  },
  {
    id: 'chunking',
    label: 'Chunking & RAG',
    description: 'Segmenting into 350-char overlapping chunks',
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  {
    id: 'ready',
    label: 'Ready',
    description: 'Vector embeddings indexed & live',
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
];

export const IngestionProgressBar: React.FC<IngestionProgressBarProps> = ({
  currentStep,
  targetUrl,
  sourceType = 'url',
  error,
}) => {
  const stepOrder: IngestionStep[] = ['connecting', 'parsing', 'sanitizing', 'chunking', 'ready'];
  const currentIndex = stepOrder.indexOf(currentStep);
  const progressPercent = Math.round(((currentIndex + 1) / stepOrder.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        error
          ? 'bg-red-50/70 border-red-200 text-red-900'
          : currentStep === 'ready'
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
      }`}
    >
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {error ? (
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          ) : currentStep === 'ready' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
            </span>
          )}
          <span className="text-xs font-black font-heading tracking-tight">
            {error
              ? 'Ingestion Interrupted'
              : currentStep === 'ready'
              ? 'Knowledge Ingestion Complete'
              : 'Knowledge Ingestion Pipeline Active'}
          </span>
          {targetUrl && (
            <span className="text-[11px] font-mono text-indigo-700/80 bg-white/70 px-2 py-0.5 rounded-md border border-indigo-200/60 truncate max-w-xs">
              {targetUrl}
            </span>
          )}
        </div>

        <span className="text-[11px] font-mono font-bold">
          {progressPercent}% • Step {currentIndex + 1} of 5
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full bg-white/80 h-2 rounded-full overflow-hidden mb-4 p-0.5 border border-indigo-100">
        <motion.div
          className={`h-full rounded-full transition-all duration-300 ${
            error
              ? 'bg-red-500'
              : currentStep === 'ready'
              ? 'bg-emerald-500'
              : 'bg-indigo-600'
          }`}
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 5-Step Pipeline Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {STEPS.map((step, idx) => {
          const isDone = currentIndex > idx || currentStep === 'ready';
          const isCurrent = currentIndex === idx && currentStep !== 'ready';
          const isPending = currentIndex < idx;

          return (
            <div
              key={step.id}
              className={`p-2 rounded-xl text-center border flex flex-col items-center gap-1 transition-all ${
                isCurrent
                  ? 'bg-white border-indigo-400 shadow-xs ring-2 ring-indigo-200'
                  : isDone
                  ? 'bg-white/80 border-emerald-200 text-emerald-900'
                  : 'bg-white/40 border-zinc-200/60 opacity-60'
              }`}
            >
              <div className="flex items-center justify-center">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                ) : (
                  <span className="text-zinc-400">{step.icon}</span>
                )}
              </div>
              <span className="text-[10px] font-extrabold leading-tight font-heading">
                {step.label}
              </span>
              <span className="text-[9px] text-zinc-500 line-clamp-1 leading-none font-body hidden sm:block">
                {step.description}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
