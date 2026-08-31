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
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      customerEmail?: string;
    }
  ): Promise<SupportTicket> {
    const db = getDb();
    const id = newId('tkt');
    const ticketNumber = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const priority = data.priority || 'medium';

    await db.execute({
      sql: `
        INSERT INTO support_tickets (
          id, tenant_id, conversation_id, ticket_number, subject, description,
          priority, status, customer_email, notes_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [
        id,
        tenantId,
        data.conversationId || null,
        ticketNumber,
        data.subject,
        data.description,
        priority,
        'open',
        data.customerEmail || null,
        JSON.stringify(['Created autonomously by AI Assistant during conversation']),
        now,
        now,
      ],
    });

    return {
      id,
      tenantId,
      conversationId: data.conversationId,
      ticketNumber,
      subject: data.subject,
      description: data.description,
      priority,
      status: 'open',
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
      status?: 'open' | 'in_progress' | 'resolved' | 'closed';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      note?: string;
    }
  ): Promise<SupportTicket | null> {
    const db = getDb();
    const clean = ticketNumberOrId.trim();
    const res = await db.execute({
      sql: `SELECT * FROM support_tickets WHERE tenant_id = ? AND (ticket_number = ? OR id = ?) LIMIT 1;`,
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

    await db.execute({
      sql: `
        UPDATE support_tickets SET
          status = ?, priority = ?, notes_json = ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?;
      `,
      args: [updatedStatus, updatedPriority, JSON.stringify(updatedNotes), now, existing.id, tenantId],
    });

    return {
      ...existing,
      status: updatedStatus,
      priority: updatedPriority,
      notes: updatedNotes,
      updatedAt: now,
    };
  }

  static async getTickets(tenantId: string): Promise<SupportTicket[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM support_tickets WHERE tenant_id = ? ORDER BY created_at DESC;`,
      args: [tenantId],
    });
    return res.rows.map(r => this.mapRowToTicket(r));
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
          id, tenant_id, code, percentage, reason, customer_email, created_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [id, tenantId, code, data.percentage, data.reason || 'AI Customer Retention Courtesy', data.customerEmail || null, now, expiresAt],
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
      customerEmail: r.customer_email ? String(r.customer_email) : undefined,
      notes,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }
}
