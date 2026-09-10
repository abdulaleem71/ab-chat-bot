import { KnowledgeSource, KnowledgeType } from '../types';

export interface KnowledgeChunkDetail {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: KnowledgeType;
  sourceUrl?: string;
  chatbotIds: string[];
  index: number;
  content: string;
  charCount: number;
  estimatedTokens: number;
}

export interface ChunkSearchResult {
  chunk: KnowledgeChunkDetail;
  relevanceScore: number; // 0.0 to 1.0
  matchPercentage: number; // 0 to 100
  matchedTerms: string[];
  rank: number;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'how', 'where', 'when', 'who', 'why', 'can', 'do', 'does',
  'i', 'you', 'me', 'my', 'we', 'our', 'your', 'tell', 'about', 'please', 'help', 'is', 'the'
]);

/**
 * Splits text into overlapping chunks consistent with NomadsChat RAG engine
 */
export function chunkTextWithOverlap(
  text: string,
  maxChars = 350,
  overlap = 40
): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < clean.length) {
    let endIndex = startIndex + maxChars;

    if (endIndex < clean.length) {
      // Find a natural sentence or paragraph break near the boundary
      const boundaryWindow = clean.substring(startIndex, endIndex);
      const lastParagraph = boundaryWindow.lastIndexOf('\n\n');
      const lastSentence = boundaryWindow.lastIndexOf('. ');
      const lastNewline = boundaryWindow.lastIndexOf('\n');
      const lastSpace = boundaryWindow.lastIndexOf(' ');

      if (lastParagraph > maxChars * 0.5) {
        endIndex = startIndex + lastParagraph + 2;
      } else if (lastSentence > maxChars * 0.5) {
        endIndex = startIndex + lastSentence + 2;
      } else if (lastNewline > maxChars * 0.5) {
        endIndex = startIndex + lastNewline + 1;
      } else if (lastSpace > maxChars * 0.5) {
        endIndex = startIndex + lastSpace + 1;
      }
    } else {
      endIndex = clean.length;
    }

    const chunk = clean.substring(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    if (endIndex >= clean.length) break;
    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

/**
 * Estimates LLM token count from raw text (industry standard ~3.8 to 4 chars per token)
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Estimate based on characters and whitespace/punctuation boundaries
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  // Average between word heuristic (1.33 tokens/word) and char heuristic (1 token/4 chars)
  const byChars = Math.ceil(chars / 3.8);
  const byWords = Math.ceil(words * 1.3);
  return Math.max(1, Math.round((byChars + byWords) / 2));
}

/**
 * Extracts structured chunk details from a KnowledgeSource document
 */
export function extractChunksFromSource(source: KnowledgeSource): KnowledgeChunkDetail[] {
  if (!source || !source.content) return [];

  // If FAQ type with Q&A format, treat as single high-signal chunk if under 600 chars
  let rawChunks: string[];
  if (source.type === 'faq' && source.content.length <= 600) {
    rawChunks = [source.content.trim()];
  } else {
    rawChunks = chunkTextWithOverlap(source.content, 350, 40);
  }

  return rawChunks.map((content, idx) => ({
    id: `${source.id}_chunk_${idx + 1}`,
    sourceId: source.id,
    sourceTitle: source.title,
    sourceType: source.type,
    sourceUrl: source.sourceUrl,
    chatbotIds: source.chatbotIds || [],
    index: idx + 1,
    content,
    charCount: content.length,
    estimatedTokens: estimateTokenCount(content),
  }));
}

/**
 * Calculates aggregate knowledge metrics for a source
 */
export function calculateSourceMetrics(source: KnowledgeSource) {
  const chunks = extractChunksFromSource(source);
  const totalChars = source.content ? source.content.length : 0;
  const totalTokens = chunks.reduce((acc, c) => acc + c.estimatedTokens, 0);
  const avgChunkSize = chunks.length > 0 ? Math.round(totalChars / chunks.length) : 0;

  return {
    totalChunks: chunks.length || source.chunkCount || 1,
    totalChars,
    totalTokens: totalTokens || estimateTokenCount(source.content || ''),
    avgChunkSize,
    chunks,
  };
}

/**
 * Tokenizes text into normalized lowercase alphanumeric terms
 */
function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9_]+/g) || []);
}

/**
 * Simulates vector semantic & keyword hybrid retrieval against a corpus of sources
 */
export function searchAndScoreChunks(
  query: string,
  sources: KnowledgeSource[],
  activeBotId?: string
): ChunkSearchResult[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery || sources.length === 0) return [];

  // Filter sources if active bot is selected
  const targetSources = activeBotId
    ? sources.filter(s => !s.chatbotIds || s.chatbotIds.length === 0 || s.chatbotIds.includes(activeBotId))
    : sources;

  // Extract all chunks across target sources
  const allChunks: KnowledgeChunkDetail[] = [];
  targetSources.forEach(source => {
    allChunks.push(...extractChunksFromSource(source));
  });

  if (allChunks.length === 0) return [];

  const lowerQuery = trimmedQuery.toLowerCase();
  const queryTokens = tokenize(lowerQuery).filter(t => !STOP_WORDS.has(t) && t.length > 1);
  const allQueryTerms = queryTokens.length > 0 ? queryTokens : tokenize(lowerQuery);

  const scored: ChunkSearchResult[] = [];

  for (const chunk of allChunks) {
    const lowerContent = chunk.content.toLowerCase();
    const lowerTitle = chunk.sourceTitle.toLowerCase();
    const chunkTokens = tokenize(lowerContent);
    const chunkTokenSet = new Set(chunkTokens);

    let score = 0;
    const matchedTerms: string[] = [];

    // 1. Exact substring match in content or title (high weight)
    if (lowerContent.includes(lowerQuery)) {
      score += 45;
      matchedTerms.push(lowerQuery);
    }
    if (lowerTitle.includes(lowerQuery)) {
      score += 35;
      if (!matchedTerms.includes(lowerQuery)) matchedTerms.push(lowerQuery);
    }

    // 2. Individual query term matching & frequency
    let matchedTokenCount = 0;
    for (const token of allQueryTerms) {
      if (chunkTokenSet.has(token) || lowerContent.includes(token)) {
        matchedTokenCount++;
        matchedTerms.push(token);
        // Frequency in chunk
        const count = chunkTokens.filter(t => t === token).length;
        score += 15 + Math.min(count * 4, 16);
      }
      if (lowerTitle.includes(token)) {
        score += 12;
      }
    }

    // 3. Keyword Coverage Ratio
    const coverage = allQueryTerms.length > 0 ? (matchedTokenCount / allQueryTerms.length) : 0;
    score += coverage * 25;

    // 4. Boost for high-signal types (FAQ)
    if (chunk.sourceType === 'faq' && coverage > 0.4) {
      score += 10;
    }

    // Normalize score to 0.0 - 1.0 (with max realistic raw score around 120)
    if (score > 0) {
      const normalizedScore = Math.min(1.0, Math.max(0.12, score / 110));
      const matchPercentage = Math.min(99, Math.round(normalizedScore * 100));

      scored.push({
        chunk,
        relevanceScore: Number(normalizedScore.toFixed(3)),
        matchPercentage,
        matchedTerms: Array.from(new Set(matchedTerms)),
        rank: 0,
      });
    }
  }

  // Sort descending by relevance score
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Assign ranks
  return scored.slice(0, 8).map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}
