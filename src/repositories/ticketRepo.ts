import { getDb } from '../db/index';
import { newId } from '../lib/ids';
import { SupportTicket, DiscountCode } from '../types';

export class TicketRepo {
  // ----------------------------------------------------
  // Support Tickets (Customer Support Agent Tool Execution)
  // ----------------------------------------------------
  static async createTicket(
    tenantId: string,
    data: {
      conversationId?: string;
      subject: string;
      description: string;
      priority?: 'low' | 'medium' | 'high';
      status?: 'open' | 'pending' | 'resolved' | 'closed';
      assigneeId?: string;
      customerEmail?: string;
    }
  ): Promise<SupportTicket> {
    const db = getDb();
    const id = newId('tkt');
    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const priority = data.priority || 'medium';
    const status = data.status || 'open';
    const assigneeId = data.assigneeId || null;

    await db.execute({
      sql: `
        INSERT INTO support_tickets (
          id, tenant_id, conversation_id, ticket_number, subject, description,
          priority, status, assignee_id, customer_email, notes_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [
        id,
        tenantId,
        data.conversationId || null,
        ticketNumber,
        data.subject,
        data.description,
        priority,
        status,
        assigneeId,
        data.customerEmail || null,
        JSON.stringify(['Created autonomously by AI Assistant during conversation']),
        now,
        now,
      ],
    });

    let assigneeName: string | undefined;
    if (assigneeId) {
      const uRes = await db.execute({ sql: `SELECT name FROM users WHERE id = ? LIMIT 1;`, args: [assigneeId] });
      if (uRes.rows.length > 0) {
        assigneeName = String(uRes.rows[0].name);
      }
    }

    return {
      id,
      tenantId,
      conversationId: data.conversationId,
      ticketNumber,
      subject: data.subject,
      description: data.description,
      priority,
      status,
      assigneeId: assigneeId || undefined,
      assigneeName,
      customerEmail: data.customerEmail,
      notes: ['Created autonomously by AI Assistant during conversation'],
      createdAt: now,
      updatedAt: now,
    };
  }

  static async updateTicket(
    tenantId: string,
    ticketNumberOrId: string,
    data: {
      status?: 'open' | 'pending' | 'resolved' | 'closed';
      priority?: 'low' | 'medium' | 'high';
      assigneeId?: string | null;
      note?: string;
    }
  ): Promise<SupportTicket | null> {
    const db = getDb();
    const clean = ticketNumberOrId.trim();
    const res = await db.execute({
      sql: `SELECT st.*, u.name as assignee_name FROM support_tickets st LEFT JOIN users u ON st.assignee_id = u.id WHERE st.tenant_id = ? AND (st.ticket_number = ? OR st.id = ?) LIMIT 1;`,
      args: [tenantId, clean, clean],
    });

    if (res.rows.length === 0) return null;
    const existing = this.mapRowToTicket(res.rows[0]);
    const now = new Date().toISOString();

    const updatedNotes = [...(existing.notes || [])];
    if (data.note) {
      updatedNotes.push(data.note);
    }

    const updatedStatus = data.status || existing.status;
    const updatedPriority = data.priority || existing.priority;
    const updatedAssigneeId = data.assigneeId !== undefined ? data.assigneeId : existing.assigneeId;

    await db.execute({
      sql: `
        UPDATE support_tickets SET
          status = ?, priority = ?, assignee_id = ?, notes_json = ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?;
      `,
      args: [updatedStatus, updatedPriority, updatedAssigneeId || null, JSON.stringify(updatedNotes), now, existing.id, tenantId],
    });

    let assigneeName = existing.assigneeName;
    if (updatedAssigneeId && updatedAssigneeId !== existing.assigneeId) {
      const uRes = await db.execute({ sql: `SELECT name FROM users WHERE id = ? LIMIT 1;`, args: [updatedAssigneeId] });
      assigneeName = uRes.rows.length > 0 ? String(uRes.rows[0].name) : undefined;
    } else if (!updatedAssigneeId) {
      assigneeName = undefined;
    }

    return {
      ...existing,
      status: updatedStatus,
      priority: updatedPriority,
      assigneeId: updatedAssigneeId || undefined,
      assigneeName,
      notes: updatedNotes,
      updatedAt: now,
    };
  }

  static async getTickets(tenantId: string): Promise<SupportTicket[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `
        SELECT st.*, u.name as assignee_name 
        FROM support_tickets st 
        LEFT JOIN users u ON st.assignee_id = u.id 
        WHERE st.tenant_id = ? 
        ORDER BY st.created_at DESC;
      `,
      args: [tenantId],
    });
    return res.rows.map(r => this.mapRowToTicket(r));
  }

  static async countDiscountCodesForConversation(tenantId: string, conversationId: string): Promise<number> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM discount_codes WHERE tenant_id = ? AND conversation_id = ?;`,
      args: [tenantId, conversationId],
    });
    return Number(res.rows[0]?.cnt || 0);
  }

  // ----------------------------------------------------
  // Discount Codes (Support Agent Tool Execution)
  // ----------------------------------------------------
  static async issueDiscountCode(
    tenantId: string,
    data: {
      percentage: number;
      reason?: string;
      customerEmail?: string;
      conversationId?: string;
    }
  ): Promise<DiscountCode> {
    const db = getDb();
    const id = newId('disc');
    const code = `SAVE${Math.round(data.percentage)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();

    await db.execute({
      sql: `
        INSERT INTO discount_codes (
          id, tenant_id, code, percentage, reason, customer_email, conversation_id, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [id, tenantId, code, data.percentage, data.reason || 'AI Customer Retention Courtesy', data.customerEmail || null, data.conversationId || null, now, expiresAt],
    });

    return {
      id,
      tenantId,
      code,
      percentage: data.percentage,
      reason: data.reason || 'AI Customer Retention Courtesy',
      customerEmail: data.customerEmail,
      createdAt: now,
      expiresAt,
    };
  }

  private static mapRowToTicket(r: any): SupportTicket {
    let notes: string[] = [];
    try {
      if (r.notes_json) notes = JSON.parse(String(r.notes_json));
    } catch {
      notes = [];
    }

    return {
      id: String(r.id),
      tenantId: String(r.tenant_id),
      conversationId: r.conversation_id ? String(r.conversation_id) : undefined,
      ticketNumber: String(r.ticket_number),
      subject: String(r.subject),
      description: String(r.description),
      priority: (r.priority || 'medium') as any,
      status: (r.status || 'open') as any,
      assigneeId: r.assignee_id ? String(r.assignee_id) : undefined,
      assigneeName: r.assignee_name ? String(r.assignee_name) : undefined,
      customerEmail: r.customer_email ? String(r.customer_email) : undefined,
      notes,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }
}
