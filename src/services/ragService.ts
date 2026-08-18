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

    // Score Chunks using Term Frequency, Keyword Coverage, and Exact Substring Matching
    const lowerQuery = query.toLowerCase().trim();
    const scoredChunks = chunks.map(chunk => {
      const lowerContent = chunk.content.toLowerCase();
      const lowerTitle = chunk.source_title.toLowerCase();
      const chunkTokens = this.tokenize(chunk.content);
      const titleTokens = this.tokenize(chunk.source_title);

      let score = 0;
      let matchedTokensCount = 0;

      // Exact phrase match in content gets strong boost
      if (lowerContent.includes(lowerQuery) && lowerQuery.length > 5) {
        score += 8.0;
        matchedTokensCount += queryTokens.length;
      }

      queryTokens.forEach(token => {
        let tokenMatched = false;
        // Exact token match in content
        const exactMatches = chunkTokens.filter(t => t === token).length;
        if (exactMatches > 0) {
          score += exactMatches * 1.5;
          tokenMatched = true;
        } else if (lowerContent.includes(token)) {
          score += 0.8;
          tokenMatched = true;
        }

        // Title matches are high intent signals
        const titleMatches = titleTokens.filter(t => t === token).length;
        if (titleMatches > 0) {
          score += titleMatches * 3.0;
          tokenMatched = true;
        } else if (lowerTitle.includes(token)) {
          score += 1.5;
          tokenMatched = true;
        }

        if (tokenMatched) {
          matchedTokensCount++;
        }
      });

      // Reward coverage of query terms (percentage of query keywords found)
      const coverageRatio = queryTokens.length > 0 ? (matchedTokensCount / queryTokens.length) : 0;
      score = score * (1 + coverageRatio);

      // Normalize by chunk length to avoid bias toward giant documents
      const normalizedScore = score / Math.sqrt(chunkTokens.length + 10);
      return { chunk, score: normalizedScore, coverageRatio };
    });

    // Filter by relevance: must have meaningful score and term coverage
    const topChunks = scoredChunks
      .filter(sc => sc.score >= 0.35 || (sc.coverageRatio >= 0.5 && sc.score > 0.2))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(sc => sc.chunk);

    if (topChunks.length === 0) {
      return {
        groundingContext: 'No specific knowledge base articles matched this query.',
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
