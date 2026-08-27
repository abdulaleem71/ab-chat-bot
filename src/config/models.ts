export const GEMINI_CONFIG = {
  flash: {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    displayName: 'Gemini 3.7 Flash',
    engineLabel: 'Gemini 3.7 Flash Engine',
    description: 'Fast Grounded Support & Real-Time RAG',
    latency: '340ms avg',
  },
  pro: {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    displayName: 'Gemini 3.1 Pro',
    engineLabel: 'Gemini 3.1 Pro Engine',
    description: 'Deep Reasoning & Complex Enterprise Workflows',
    latency: '680ms avg',
  },
  primaryEngine: 'Gemini 3.7 Flash Engine',
  activeStatusText: 'Gemini 3.7 Flash Active',
  matrixLabel: 'Gemini 3.7 Flash / 3.1 Pro LLM Engine',
  featuresTitle: 'Gemini 3.7 Flash & 3.1 Pro Models',
  featuresDescription: 'Powered by Google’s ultra-fast Gemini 3.7 Flash and high-reasoning Gemini 3.1 Pro preview models.',
} as const;

export const DEFAULT_MODEL_ID = GEMINI_CONFIG.flash.id;

export function getModelDisplayName(modelId?: string): string {
  if (modelId === GEMINI_CONFIG.pro.id || modelId === 'gemini-3.1-pro') {
    return GEMINI_CONFIG.pro.displayName;
  }
  return GEMINI_CONFIG.flash.displayName;
}

export function getModelEngineLabel(modelId?: string): string {
  if (modelId === GEMINI_CONFIG.pro.id || modelId === 'gemini-3.1-pro') {
    return GEMINI_CONFIG.pro.engineLabel;
  }
  return GEMINI_CONFIG.flash.engineLabel;
}
