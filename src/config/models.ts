export const GEMINI_CONFIG = {
  flash: {
    id: 'gemini-4-hydrogen',
    name: 'Gemini 4 Hydrogen',
    displayName: 'Gemini 4 Hydrogen',
    engineLabel: 'Gemini 4 Hydrogen Engine',
    description: 'Fast Grounded Support & Real-Time RAG',
    latency: '310ms avg',
  },
  pro: {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    displayName: 'Gemini 3.1 Flash-Lite',
    engineLabel: 'Gemini 3.1 Flash-Lite Engine',
    description: 'Ultra-Low-Latency High-Throughput Routing',
    latency: '190ms avg',
  },
  embeddingId: 'gemini-embedding-2',
  primaryEngine: 'Gemini 4 Hydrogen Engine',
  activeStatusText: 'Gemini 4 Hydrogen Active',
  matrixLabel: 'Gemini 4 Hydrogen / Flash-Lite LLM Engine',
  featuresTitle: 'Gemini 4 Hydrogen & Flash-Lite Models',
  featuresDescription: 'Powered by Google Gemini 4 Hydrogen for high-accuracy grounded RAG and Gemini 3.1 Flash-Lite for sub-second ticket routing.',
} as const;

export const DEFAULT_MODEL_ID = GEMINI_CONFIG.flash.id;

export function getModelDisplayName(modelId?: string): string {
  if (modelId === GEMINI_CONFIG.pro.id || modelId === 'gemini-3.1-flash-lite') {
    return GEMINI_CONFIG.pro.displayName;
  }
  return GEMINI_CONFIG.flash.displayName;
}

export function getModelEngineLabel(modelId?: string): string {
  if (modelId === GEMINI_CONFIG.pro.id || modelId === 'gemini-3.1-flash-lite') {
    return GEMINI_CONFIG.pro.engineLabel;
  }
  return GEMINI_CONFIG.flash.engineLabel;
}
