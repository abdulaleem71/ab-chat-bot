import { KnowledgeRepo, KnowledgeChunkRow } from '../repositories/knowledgeRepo';
import { GroundingSource } from '../types';

interface RetrievalResult {
  groundingContext: string;
  sourcesUsed: GroundingSource[];
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'what', 'how', 'where', 'when', 'who', 'why', 'can', 'do', 'does',
  'i', 'you', 'me', 'my', 'we', 'our', 'your', 'tell', 'about', 'please', 'help'
]);

export class RagService {
  /**
   * Retrieves top relevant knowledge chunks for a user query and returns grounded prompt context with actual citations.
   */
  static async retrieveRelevantContext(chatbotId: string, query: string): Promise<RetrievalResult> {
    const chunks = await KnowledgeRepo.findChunksByBot(chatbotId);

    if (chunks.length === 0) {
      return {
        groundingContext: 'No indexed knowledge sources available for this chatbot.',
        sourcesUsed: [],
      };
    }

    // Tokenize Query
    const queryTokens = this.tokenize(query).filter(t => !STOP_WORDS.has(t) && t.length > 2);

    if (queryTokens.length === 0) {
      // If query only contains stop words (e.g. "hi", "hello"), return empty context without citations
      return {
        groundingContext: 'No relevant knowledge sources matched.',
        sourcesUsed: [],
      };
    }

    // Score Chunks using Term Frequency and Title Match Boost
    const scoredChunks = chunks.map(chunk => {
      const chunkTokens = this.tokenize(chunk.content);
      const titleTokens = this.tokenize(chunk.source_title);

      let score = 0;
      queryTokens.forEach(token => {
        // Content match frequency
        const contentMatches = chunkTokens.filter(t => t === token || t.includes(token) || token.includes(t)).length;
        score += contentMatches * 1.0;

        // Title match boost
        const titleMatches = titleTokens.filter(t => t === token || t.includes(token) || token.includes(t)).length;
        score += titleMatches * 3.0;
      });

      // Normalize by chunk length
      const normalizedScore = score / Math.sqrt(chunkTokens.length + 5);
      return { chunk, score: normalizedScore };
    });

    // Filter and Sort by Score
    const topChunks = scoredChunks
      .filter(sc => sc.score > 0.1) // Must have actual token overlap
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(sc => sc.chunk);

    if (topChunks.length === 0) {
      return {
        groundingContext: 'No matching knowledge sources found for this specific query.',
        sourcesUsed: [],
      };
    }

    // Build Grounding Context Text
    const groundingContext = topChunks
      .map(c => `[SOURCE: ${c.source_title}]\n${c.content}`)
      .join('\n\n---\n\n');

    // Deduplicate and Map Actual Sources Used
    const sourceMap = new Map<string, GroundingSource>();
    topChunks.forEach(c => {
      if (!sourceMap.has(c.source_id)) {
        sourceMap.set(c.source_id, {
          title: c.source_title,
          snippet: c.content.substring(0, 180) + '...',
          sourceType: c.source_url ? 'url' : 'document',
        });
      }
    });

    const sourcesUsed = Array.from(sourceMap.values());

    return {
      groundingContext,
      sourcesUsed,
    };
  }

  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 0);
  }
}
