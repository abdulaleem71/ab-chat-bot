import { getDb } from '../db';
import crypto from 'crypto';

export interface JobOptions {
  tenantId?: string;
  type: string;
  payload: any;
  maxAttempts?: number;
}

export class JobService {
  static async enqueue(options: JobOptions) {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await db.execute({
      sql: `INSERT INTO background_jobs (id, tenant_id, type, payload, status, attempts, max_attempts, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'pending', 0, ?, ?, ?)`,
      args: [
        id,
        options.tenantId || null,
        options.type,
        JSON.stringify(options.payload),
        options.maxAttempts || 3,
        now,
        now
      ]
    });
    
    return id;
  }

  static async pollAndExecute() {
    const db = getDb();
    
    // Find a pending job
    const now = new Date().toISOString();
    
    const res = await db.execute({
      sql: `SELECT * FROM background_jobs 
            WHERE status = 'pending' 
               OR (status = 'failed' AND attempts < max_attempts AND next_retry_at <= ?)
            ORDER BY created_at ASC LIMIT 1`,
      args: [now]
    });
    
    if (res.rows.length === 0) return;
    
    const job = res.rows[0];
    
    // Mark as processing
    await db.execute({
      sql: `UPDATE background_jobs SET status = 'processing', updated_at = ? WHERE id = ?`,
      args: [new Date().toISOString(), job.id]
    });
    
    try {
      const payload = JSON.parse(String(job.payload));
      
      if (job.type === 'scrape_url') {
        const { KnowledgeService } = await import('./knowledgeService');
        const source = await KnowledgeService.scrapeAndIngestUrl(
          String(job.tenant_id), 
          payload.url, 
          payload.chatbotIds || []
        );
        if (source) {
          const { ModerationService } = await import('./moderationService');
          await ModerationService.checkAndFlagContent(String(job.tenant_id), source.id, source.title, 'knowledge_base', source.content);
        }

      } else if (job.type === 'call_webhook') {
         const headers: Record<string, string> = { 'Content-Type': 'application/json' };
         if (payload.webhook.secret) {
           headers['X-Webhook-Secret'] = payload.webhook.secret;
         }
         
         const webhookResp = await fetch(payload.webhook.url, {
           method: 'POST',
           headers,
           body: JSON.stringify({
             event: payload.event,
             payload: payload.payload,
             botId: payload.botId,
             conversationId: payload.conversationId,
             timestamp: new Date().toISOString(),
           }),
         });
         
         if (!webhookResp.ok) {
            throw new Error(`External webhook returned HTTP \${webhookResp.status}`);
         }
      } else {
        throw new Error(`Unknown job type: \${job.type}`);
      }
      
      // Mark completed
      await db.execute({
        sql: `UPDATE background_jobs SET status = 'completed', updated_at = ? WHERE id = ?`,
        args: [new Date().toISOString(), job.id]
      });
      
    } catch (err: any) {
      const attempts = Number(job.attempts) + 1;
      const maxAttempts = Number(job.max_attempts);
      const isFinalFailure = attempts >= maxAttempts;
      const nextRetry = new Date(Date.now() + Math.pow(2, attempts) * 60000).toISOString(); // Exp backoff in minutes
      
      await db.execute({
        sql: `UPDATE background_jobs 
              SET status = 'failed', 
                  error = ?, 
                  attempts = ?, 
                  next_retry_at = ?,
                  updated_at = ?
              WHERE id = ?`,
        args: [
          err.message || 'Unknown error', 
          attempts, 
          isFinalFailure ? null : nextRetry,
          new Date().toISOString(), 
          job.id
        ]
      });

      if (isFinalFailure && job.type === 'call_webhook') {
         // Log to system alerts on final failure
         const { AdminAlertsRepo } = await import('../admin/repositories/adminAlertsRepo');
         await AdminAlertsRepo.createAlert({
           title: `Webhook Final Failure`,
           message: `Webhook job failed after ${attempts} attempts. Error: ${err.message}`,
           severity: 'warning',
           category: 'integration',
           source: 'job_queue',
           metadata: {
             tenantId: String(job.tenant_id),
             jobId: String(job.id),
             attempts,
             error: err.message,
           }
         });
      }
    }
  }

  static startWorker() {
    setInterval(() => {
      this.pollAndExecute().catch(err => {
        console.error('[JobWorker] Error in poll cycle:', err);
      });
    }, 2000);
  }
}
