import { GoogleGenAI } from '@google/genai';
import { KnowledgeRepo, KnowledgeChunkRow } from '../repositories/knowledgeRepo';
import { GroundingSource } from '../types';

export interface RetrievalResult {
  groundingContext: string;
  sourcesUsed: GroundingSource[];
  isBelowThreshold: boolean;
  topScore: number;
  fallbackTriggered: boolean;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const GREETINGS = new Set(['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you']);

export class RagService {
  /**
   * Computes embedding vector for a query using Gemini gemini-embedding-2 model
   */
  static async computeQueryEmbedding(query: string): Promise<number[] | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const res = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: query.trim().slice(0, 8000),
      });

      const emb = res.embeddings;
      if (Array.isArray(emb) && emb[0]?.values) {
        return emb[0].values;
      }
      if ((emb as any)?.values && Array.isArray((emb as any).values)) {
        return (emb as any).values;
      }
      return null;
    } catch (err: any) {
      console.warn('[Query Embedding Error]:', err.message || err);
      return null;
    }
  }

  /**
   * Retrieves top relevant knowledge chunks using Gemini gemini-embedding-2 and Cosine Similarity (> 0.65 threshold).
   */
  static async retrieveRelevantContext(
    chatbotId: string,
    query: string,
    botWebsiteUrl?: string,
    tenantId?: string
  ): Promise<RetrievalResult> {
    let chunks = await KnowledgeRepo.findChunksByBot(chatbotId);

    // If no chunks exist but a website URL is configured and tenantId is known, attempt on-demand scrape
    if (chunks.length === 0 && botWebsiteUrl && tenantId) {
      try {
        const { KnowledgeService } = await import('./knowledgeService');
        await KnowledgeService.scrapeAndIngestUrl(tenantId, botWebsiteUrl, [chatbotId]);
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
        isBelowThreshold: true,
        topScore: 0,
        fallbackTriggered: true,
      };
    }

    const lowerQuery = query.toLowerCase().trim();

    // Check for conversational greetings
    if (GREETINGS.has(lowerQuery)) {
      const introChunks = chunks.slice(0, 2);
      const groundingContext = introChunks
        .map(c => `[SOURCE: ${c.source_title}${c.source_url ? ` (${c.source_url})` : ''}]\n${c.content}`)
        .join('\n\n---\n\n');

      const sourcesUsed: GroundingSource[] = introChunks.map(c => ({
        title: c.source_title,
        snippet: c.content.length > 250 ? c.content.substring(0, 250) + '...' : c.content,
        sourceType: c.source_url ? 'url' : 'document',
        url: c.source_url || undefined,
      }));

      return {
        groundingContext,
        sourcesUsed,
        isBelowThreshold: false,
        topScore: 1.0,
        fallbackTriggered: false,
      };
    }

    // Compute Query Vector Embedding using gemini-embedding-2
    const queryEmbedding = await this.computeQueryEmbedding(query);

    // Score Chunks using Vector Cosine Similarity
    const scoredChunks: { chunk: KnowledgeChunkRow & { source_title: string; source_url: string }; score: number }[] = [];

    if (queryEmbedding && queryEmbedding.length > 0) {
      for (const chunk of chunks) {
        let chunkEmbedding: number[] | null = null;

        if (chunk.embedding_json) {
          try {
            chunkEmbedding = JSON.parse(chunk.embedding_json);
          } catch (e) {
            chunkEmbedding = null;
          }
        }

        // On-the-fly embedding calculation for legacy chunks missing vector data
        if (!chunkEmbedding) {
          try {
            const { KnowledgeService } = await import('./knowledgeService');
            const embs = await KnowledgeService.computeChunkEmbeddings([chunk.content]);
            if (embs[0]) {
              chunkEmbedding = embs[0];
              await KnowledgeRepo.updateChunkEmbedding(chunk.id, chunkEmbedding);
            }
          } catch (e) {
            console.warn('[On-demand chunk embedding failed]:', e);
          }
        }

        if (chunkEmbedding && chunkEmbedding.length === queryEmbedding.length) {
          const sim = cosineSimilarity(queryEmbedding, chunkEmbedding);
          scoredChunks.push({ chunk, score: sim });
        } else {
          // Keyword fallback score if embedding missing
          const kwScore = this.computeKeywordScore(query, chunk.content, chunk.source_title);
          scoredChunks.push({ chunk, score: kwScore });
        }
      }
    } else {
      // Fallback: Keyword scoring if Gemini API key missing
      for (const chunk of chunks) {
        const kwScore = this.computeKeywordScore(query, chunk.content, chunk.source_title);
        scoredChunks.push({ chunk, score: kwScore });
      }
    }

    // Sort by Cosine Similarity score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    const topScore = scoredChunks.length > 0 ? scoredChunks[0].score : 0;
    const SIMILARITY_THRESHOLD = 0.65;

    // Filter top-k (top 4) chunks above similarity threshold (> 0.65)
    const qualifying = scoredChunks.filter(sc => sc.score > SIMILARITY_THRESHOLD);
    const top4 = qualifying.slice(0, 4).map(sc => sc.chunk);

    if (top4.length === 0 || topScore <= SIMILARITY_THRESHOLD) {
      return {
        groundingContext: `[KNOWLEDGE BASE BELOW CONFIDENCE THRESHOLD] Top chunk similarity score is ${topScore.toFixed(3)}, which is below the required 0.65 threshold. Answer strictly using the configured bot fallback message.`,
        sourcesUsed: [],
        isBelowThreshold: true,
        topScore,
        fallbackTriggered: true,
      };
    }

    // Build Grounding Context Text
    const groundingContext = top4
      .map(c => `[SOURCE: ${c.source_title}${c.source_url ? ` (${c.source_url})` : ''}]\n${c.content}`)
      .join('\n\n---\n\n');

    // Deduplicate and Map Actual Sources Used
    const sourceMap = new Map<string, GroundingSource>();
    top4.forEach(c => {
      if (!sourceMap.has(c.source_id)) {
        sourceMap.set(c.source_id, {
          title: c.source_title,
          snippet: c.content.length > 350 ? c.content.substring(0, 350) + '...' : c.content,
          sourceType: c.source_url ? 'url' : 'document',
          url: c.source_url || undefined,
        });
      }
    });

    return {
      groundingContext,
      sourcesUsed: Array.from(sourceMap.values()),
      isBelowThreshold: false,
      topScore,
      fallbackTriggered: false,
    };
  }

  private static computeKeywordScore(query: string, content: string, title: string): number {
    const lQuery = query.toLowerCase().trim();
    const lContent = content.toLowerCase();
    const lTitle = title.toLowerCase();

    let score = 0;
    if (lContent.includes(lQuery)) score += 0.5;
    if (lTitle.includes(lQuery)) score += 0.4;

    const queryWords = lQuery.split(/\s+/).filter(w => w.length > 2);
    let matches = 0;
    for (const w of queryWords) {
      if (lContent.includes(w) || lTitle.includes(w)) matches++;
    }

    if (queryWords.length > 0) {
      score += (matches / queryWords.length) * 0.4;
    }

    return Math.min(score, 0.99);
  }
}
