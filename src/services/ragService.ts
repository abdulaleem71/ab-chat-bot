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
  static async retrieveRelevantContext(
    chatbotId: string,
    query: string,
    botWebsiteUrl?: string,
    tenantId?: string
  ): Promise<RetrievalResult> {
    let chunks = await KnowledgeRepo.findChunksByBot(chatbotId);

    // If no chunks exist but a website URL is configured and tenantId is known, try an auto-ingest
    if (chunks.length === 0 && botWebsiteUrl && tenantId) {
      try {
        const { KnowledgeService } = await import('./knowledgeService');
        await KnowledgeService.scrapeAndIngestUrl(chatbotId, tenantId, botWebsiteUrl);
        chunks = await KnowledgeRepo.findChunksByBot(chatbotId);
      } catch (err: any) {
        console.warn(`[WARN] On-demand scrape attempt failed for ${botWebsiteUrl}:`, err.message);
      }
    }

    if (chunks.length === 0) {
      return {
        groundingContext: botWebsiteUrl
          ? `Chatbot configured website URL: ${botWebsiteUrl}. No additional scraped knowledge chunks are currently indexed.`
          : 'No indexed knowledge sources available for this chatbot.',
        sourcesUsed: [],
      };
    }

    const lowerQuery = query.toLowerCase().trim();
    const queryTokens = this.tokenize(query).filter(t => !STOP_WORDS.has(t) && t.length > 1);

    // If the corpus is compact (<= 10 chunks), include all chunks in context for 100% knowledge retention
    if (chunks.length <= 10) {
      const groundingContext = chunks
        .map(c => `[SOURCE: ${c.source_title}${c.source_url ? ` (${c.source_url})` : ''}]\n${c.content}`)
        .join('\n\n---\n\n');

      const sourceMap = new Map<string, GroundingSource>();
      chunks.forEach(c => {
        if (!sourceMap.has(c.source_id)) {
          sourceMap.set(c.source_id, {
            title: c.source_title,
            snippet: c.content.substring(0, 180) + '...',
            sourceType: c.source_url ? 'url' : 'document',
          });
        }
      });

      return {
        groundingContext,
        sourcesUsed: Array.from(sourceMap.values()),
      };
    }

    // For larger corpuses: Handle greetings or general questions by providing introductory chunks
    const isGreetingOrGeneral = queryTokens.length === 0 || ['hi', 'hello', 'hey', 'help', 'info', 'what do you do'].includes(lowerQuery);
    if (isGreetingOrGeneral) {
      const topOverviewChunks = chunks.slice(0, 3);
      const groundingContext = topOverviewChunks
        .map(c => `[SOURCE: ${c.source_title}${c.source_url ? ` (${c.source_url})` : ''}]\n${c.content}`)
        .join('\n\n---\n\n');

      const sourcesUsed: GroundingSource[] = [{
        title: topOverviewChunks[0].source_title,
        snippet: topOverviewChunks[0].content.substring(0, 180) + '...',
        sourceType: topOverviewChunks[0].source_url ? 'url' : 'document',
      }];

      return {
        groundingContext,
        sourcesUsed,
      };
    }

    // Score Chunks using Term Frequency, Keyword Coverage, and Exact Substring Matching
    const scoredChunks = chunks.map(chunk => {
      const lowerContent = chunk.content.toLowerCase();
      const lowerTitle = chunk.source_title.toLowerCase();
      const chunkTokens = this.tokenize(chunk.content);
      const titleTokens = this.tokenize(chunk.source_title);

      let score = 0;
      let matchedTokensCount = 0;

      // Exact phrase match in content gets strong boost
      if (lowerContent.includes(lowerQuery) && lowerQuery.length > 3) {
        score += 8.0;
        matchedTokensCount += queryTokens.length;
      }

      queryTokens.forEach(token => {
        let tokenMatched = false;
        // Exact token match in content
        const exactMatches = chunkTokens.filter(t => t === token).length;
        if (exactMatches > 0) {
          score += exactMatches * 2.0;
          tokenMatched = true;
        } else if (lowerContent.includes(token)) {
          score += 1.0;
          tokenMatched = true;
        }

        // Title matches are high intent signals
        const titleMatches = titleTokens.filter(t => t === token).length;
        if (titleMatches > 0) {
          score += titleMatches * 3.5;
          tokenMatched = true;
        } else if (lowerTitle.includes(token)) {
          score += 2.0;
          tokenMatched = true;
        }

        if (tokenMatched) {
          matchedTokensCount++;
        }
      });

      // Reward coverage of query terms (percentage of query keywords found)
      const coverageRatio = queryTokens.length > 0 ? (matchedTokensCount / queryTokens.length) : 0;
      score = score * (1 + coverageRatio * 1.5);

      // Normalize by chunk length to avoid bias toward giant documents
      const normalizedScore = score / Math.sqrt(chunkTokens.length + 10);
      return { chunk, score: normalizedScore, coverageRatio };
    });

    // Sort by relevance score
    const sorted = scoredChunks.sort((a, b) => b.score - a.score);
    let topChunks = sorted
      .filter(sc => sc.score > 0.1 || sc.coverageRatio > 0.3)
      .slice(0, 5)
      .map(sc => sc.chunk);

    // Fallback: If no chunks scored high enough, pick the top 3 best matching or first chunks
    if (topChunks.length === 0) {
      topChunks = sorted.slice(0, 3).map(sc => sc.chunk);
    }

    // Build Grounding Context Text
    const groundingContext = topChunks
      .map(c => `[SOURCE: ${c.source_title}${c.source_url ? ` (${c.source_url})` : ''}]\n${c.content}`)
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
