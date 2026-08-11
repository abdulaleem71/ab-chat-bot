import { getDb } from '../db/index';
import { KnowledgeSource } from '../types';

export interface KnowledgeChunkRow {
  id: string;
  source_id: string;
  chatbot_id: string;
  tenant_id: string;
  content: string;
  chunk_index: number;
  created_at: string;
}

export class KnowledgeRepo {
  static async findSourcesByBot(chatbotId: string, tenantId: string): Promise<KnowledgeSource[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM knowledge_sources WHERE chatbot_id = ? AND tenant_id = ? ORDER BY updated_at DESC;`,
      args: [chatbotId, tenantId],
    });

    return res.rows.map(r => ({
      id: String(r.id),
      chatbotId: String(r.chatbot_id),
      tenantId: String(r.tenant_id),
      type: String(r.type) as any,
      title: String(r.title),
      content: String(r.content),
      sourceUrl: String(r.source_url || ''),
      status: String(r.status) as any,
      chunkCount: Number(r.chunk_count || 0),
      updatedAt: String(r.updated_at),
    }));
  }

  static async findSourceById(sourceId: string, tenantId: string): Promise<KnowledgeSource | null> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM knowledge_sources WHERE id = ? AND tenant_id = ? LIMIT 1;`,
      args: [sourceId, tenantId],
    });

    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      chatbotId: String(r.chatbot_id),
      tenantId: String(r.tenant_id),
      type: String(r.type) as any,
      title: String(r.title),
      content: String(r.content),
      sourceUrl: String(r.source_url || ''),
      status: String(r.status) as any,
      chunkCount: Number(r.chunk_count || 0),
      updatedAt: String(r.updated_at),
    };
  }

  static async createSourceWithChunks(source: KnowledgeSource, chunks: string[]): Promise<KnowledgeSource> {
    const db = getDb();

    await db.execute({
      sql: `INSERT INTO knowledge_sources (id, chatbot_id, tenant_id, type, title, content, source_url, status, chunk_count, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        source.id,
        source.chatbotId,
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

    const now = new Date().toISOString();
    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `kc_${source.id}_${i}`;
      await db.execute({
        sql: `INSERT INTO knowledge_chunks (id, source_id, chatbot_id, tenant_id, content, chunk_index, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?);`,
        args: [chunkId, source.id, source.chatbotId, source.tenantId, chunks[i], i, now],
      });
    }

    return { ...source, chunkCount: chunks.length };
  }

  static async deleteSource(sourceId: string, tenantId: string): Promise<boolean> {
    const db = getDb();
    await db.execute({
      sql: `DELETE FROM knowledge_chunks WHERE source_id = ? AND tenant_id = ?;`,
      args: [sourceId, tenantId],
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
            JOIN knowledge_sources ks ON kc.source_id = ks.id
            WHERE kc.chatbot_id = ?;`,
      args: [chatbotId],
    });

    return res.rows.map(r => ({
      id: String(r.id),
      source_id: String(r.source_id),
      chatbot_id: String(r.chatbot_id),
      tenant_id: String(r.tenant_id),
      content: String(r.content),
      chunk_index: Number(r.chunk_index),
      created_at: String(r.created_at),
      source_title: String(r.source_title),
      source_url: String(r.source_url || ''),
    }));
  }
}
