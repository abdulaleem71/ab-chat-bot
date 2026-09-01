import { getDb } from '../db/index';
import { newId } from '../lib/ids';
import { Contact } from '../types';

export class ContactRepo {
  static async findOrCreateContact(
    tenantId: string,
    data: {
      externalId?: string;
      name?: string;
      email?: string;
    }
  ): Promise<{ contactId: string; isNew: boolean }> {
    const db = getDb();
    const now = new Date().toISOString();
    const email = data.email ? data.email.toLowerCase().trim() : undefined;
    const externalId = data.externalId ? data.externalId.trim() : undefined;
    const name = data.name ? data.name.trim() : undefined;

    let existing: any = null;

    // 1. Try lookup by email if provided
    if (email) {
      const res = await db.execute({
        sql: `SELECT * FROM contacts WHERE tenant_id = ? AND email IS NOT NULL AND LOWER(email) = ? LIMIT 1;`,
        args: [tenantId, email],
      });
      if (res.rows.length > 0) {
        existing = res.rows[0];
      }
    }

    // 2. If not found by email, try lookup by external_id
    if (!existing && externalId) {
      const res = await db.execute({
        sql: `SELECT * FROM contacts WHERE tenant_id = ? AND external_id = ? LIMIT 1;`,
        args: [tenantId, externalId],
      });
      if (res.rows.length > 0) {
        existing = res.rows[0];
      }
    }

    if (existing) {
      const contactId = String(existing.id);
      const updates: string[] = [];
      const args: any[] = [];

      updates.push(`last_seen_at = ?`);
      args.push(now);

      if (email && !existing.email) {
        updates.push(`email = ?`);
        args.push(email);
      }
      if (name && (!existing.name || existing.name === 'Website Visitor')) {
        updates.push(`name = ?`);
        args.push(name);
      }
      if (externalId && !existing.external_id) {
        updates.push(`external_id = ?`);
        args.push(externalId);
      }

      args.push(contactId);
      await db.execute({
        sql: `UPDATE contacts SET ${updates.join(', ')} WHERE id = ?;`,
        args,
      });

      return { contactId, isNew: false };
    } else {
      const contactId = newId('cnt');
      await db.execute({
        sql: `INSERT INTO contacts (id, tenant_id, external_id, name, email, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        args: [
          contactId,
          tenantId,
          externalId || null,
          name || 'Website Visitor',
          email || null,
          now,
          now,
        ],
      });
      return { contactId, isNew: true };
    }
  }

  static async findById(contactId: string, tenantId?: string): Promise<Contact | null> {
    const db = getDb();
    let sql = `SELECT * FROM contacts WHERE id = ?`;
    const args: any[] = [contactId];
    if (tenantId) {
      sql += ` AND tenant_id = ?`;
      args.push(tenantId);
    }
    sql += ` LIMIT 1;`;
    const res = await db.execute({ sql, args });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      tenantId: String(r.tenant_id),
      externalId: r.external_id ? String(r.external_id) : undefined,
      name: r.name ? String(r.name) : undefined,
      email: r.email ? String(r.email) : undefined,
      firstSeenAt: String(r.first_seen_at),
      lastSeenAt: String(r.last_seen_at),
    };
  }
}
