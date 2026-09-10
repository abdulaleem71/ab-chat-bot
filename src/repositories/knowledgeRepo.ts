import { getDb } from '../db/index';
import { KnowledgeSource } from '../types';

export interface KnowledgeChunkRow {
  id: string;
  source_id: string;
  tenant_id: string;
  content: string;
  chunk_index: number;
  embedding_json?: string | null;
  created_at: string;
}

export class KnowledgeRepo {
  static async findSourcesByTenant(tenantId: string): Promise<KnowledgeSource[]> {
    const db = getDb();
    const sourcesRes = await db.execute({
      sql: `SELECT * FROM knowledge_sources WHERE tenant_id = ? ORDER BY updated_at DESC;`,
      args: [tenantId],
    });

    const linksRes = await db.execute({
      sql: `SELECT cks.chatbot_id, cks.knowledge_source_id
            FROM chatbot_knowledge_sources cks
            JOIN knowledge_sources ks ON cks.knowledge_source_id = ks.id
            WHERE ks.tenant_id = ?;`,
      args: [tenantId],
    });

    const linksMap = new Map<string, string[]>();
    for (const r of linksRes.rows) {
      const sourceId = String(r.knowledge_source_id);
      const botId = String(r.chatbot_id);
      if (!linksMap.has(sourceId)) linksMap.set(sourceId, []);
      linksMap.get(sourceId)!.push(botId);
    }

    return sourcesRes.rows.map(r => {
      const id = String(r.id);
      const chatbotIds = linksMap.get(id) || [];
      return {
        id,
        tenantId: String(r.tenant_id),
        type: String(r.type) as any,
        title: String(r.title),
        content: String(r.content),
        sourceUrl: String(r.source_url || ''),
        status: String(r.status) as any,
        chunkCount: Number(r.chunk_count || 0),
        chatbotIds,
        chatbotId: chatbotIds[0] || '',
        updatedAt: String(r.updated_at),
      };
    });
  }

  static async findSourcesByBot(chatbotId: string, tenantId: string): Promise<KnowledgeSource[]> {
    const all = await this.findSourcesByTenant(tenantId);
    return all.filter(s => s.chatbotIds.includes(chatbotId));
  }

  static async findSourceById(sourceId: string, tenantId: string): Promise<KnowledgeSource | null> {
    const all = await this.findSourcesByTenant(tenantId);
    return all.find(s => s.id === sourceId) || null;
  }

  static async createSourceWithChunks(
    source: Omit<KnowledgeSource, 'chatbotIds' | 'chatbotId' | 'chunkCount'>,
    chunks: string[],
    chatbotIds: string[],
    chunkEmbeddings?: (number[] | null)[]
  ): Promise<KnowledgeSource> {
    const db = getDb();

    await db.execute({
      sql: `INSERT INTO knowledge_sources (id, tenant_id, type, title, content, source_url, status, chunk_count, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        source.id,
        source.tenantId,
        source.type,
        source.title,
        source.content,
        source.sourceUrl || '',
        source.status,
        chunks.length,
        source.updatedAt,
      ],
    });

    for (const botId of chatbotIds) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO chatbot_knowledge_sources (chatbot_id, knowledge_source_id) VALUES (?, ?);`,
        args: [botId, source.id],
      });
    }

    const now = new Date().toISOString();
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `kc_${source.id}_${i}`;
      const emb = chunkEmbeddings && chunkEmbeddings[i] ? JSON.stringify(chunkEmbeddings[i]) : null;
      await db.execute({
        sql: `INSERT INTO knowledge_chunks (id, source_id, tenant_id, content, chunk_index, embedding_json, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?);`,
        args: [chunkId, source.id, source.tenantId, chunks[i], i, emb, now],
      });
    }

    return {
      ...source,
      chunkCount: chunks.length,
      chatbotIds,
      chatbotId: chatbotIds[0] || '',
    };
  }

  static async updateChunkEmbedding(chunkId: string, embedding: number[]): Promise<void> {
    const db = getDb();
    await db.execute({
      sql: `UPDATE knowledge_chunks SET embedding_json = ? WHERE id = ?;`,
      args: [JSON.stringify(embedding), chunkId],
    });
  }

  static async updateSourceLinks(sourceId: string, tenantId: string, chatbotIds: string[]): Promise<void> {
    const db = getDb();
    const source = await this.findSourceById(sourceId, tenantId);
    if (!source) throw new Error('Knowledge source not found');

    await db.execute({
      sql: `DELETE FROM chatbot_knowledge_sources WHERE knowledge_source_id = ?;`,
      args: [sourceId],
    });

    for (const botId of chatbotIds) {
      await db.execute({
        sql: `INSERT OR IGNORE INTO chatbot_knowledge_sources (chatbot_id, knowledge_source_id) VALUES (?, ?);`,
        args: [botId, sourceId],
      });
    }
  }

  static async deleteSource(sourceId: string, tenantId: string): Promise<boolean> {
    const db = getDb();
    await db.execute({
      sql: `DELETE FROM knowledge_chunks WHERE source_id = ? AND tenant_id = ?;`,
      args: [sourceId, tenantId],
    });
    await db.execute({
      sql: `DELETE FROM chatbot_knowledge_sources WHERE knowledge_source_id = ?;`,
      args: [sourceId],
    });
    const res = await db.execute({
      sql: `DELETE FROM knowledge_sources WHERE id = ? AND tenant_id = ?;`,
      args: [sourceId, tenantId],
    });
    return (res.rowsAffected || 0) > 0;
  }

  static async findChunksByBot(chatbotId: string): Promise<(KnowledgeChunkRow & { source_title: string; source_url: string })[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT kc.*, ks.title as source_title, ks.source_url
            FROM knowledge_chunks kc
            JOIN chatbot_knowledge_sources cks ON kc.source_id = cks.knowledge_source_id
            JOIN knowledge_sources ks ON kc.source_id = ks.id
            WHERE cks.chatbot_id = ?;`,
      args: [chatbotId],
    });

    return res.rows.map(r => ({
      id: String(r.id),
      source_id: String(r.source_id),
      tenant_id: String(r.tenant_id),
      content: String(r.content),
      chunk_index: Number(r.chunk_index),
      embedding_json: r.embedding_json ? String(r.embedding_json) : null,
      created_at: String(r.created_at),
      source_title: String(r.source_title),
      source_url: String(r.source_url || ''),
    }));
  }
}
