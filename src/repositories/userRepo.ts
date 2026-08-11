import { getDb } from '../db/index';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  tenant_id: string;
  role: string;
  created_at: string;
}

export interface TenantRow {
  id: string;
  name: string;
  owner_email: string;
  plan: string;
  created_at: string;
}

export class UserRepo {
  static async findUserByEmail(email: string): Promise<UserRow | null> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1;`,
      args: [email],
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      email: String(r.email),
      password_hash: String(r.password_hash),
      name: String(r.name),
      tenant_id: String(r.tenant_id),
      role: String(r.role),
      created_at: String(r.created_at),
    };
  }

  static async findUserById(id: string): Promise<UserRow | null> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM users WHERE id = ? LIMIT 1;`,
      args: [id],
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      email: String(r.email),
      password_hash: String(r.password_hash),
      name: String(r.name),
      tenant_id: String(r.tenant_id),
      role: String(r.role),
      created_at: String(r.created_at),
    };
  }

  static async createUser(user: UserRow): Promise<UserRow> {
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, name, tenant_id, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [user.id, user.email.toLowerCase(), user.password_hash, user.name, user.tenant_id, user.role, user.created_at],
    });
    return user;
  }

  static async findTenantById(id: string): Promise<TenantRow | null> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM tenants WHERE id = ? LIMIT 1;`,
      args: [id],
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      name: String(r.name),
      owner_email: String(r.owner_email),
      plan: String(r.plan),
      created_at: String(r.created_at),
    };
  }

  static async createTenant(tenant: TenantRow): Promise<TenantRow> {
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO tenants (id, name, owner_email, plan, created_at) VALUES (?, ?, ?, ?, ?);`,
      args: [tenant.id, tenant.name, tenant.owner_email.toLowerCase(), tenant.plan, tenant.created_at],
    });
    return tenant;
  }

  static async updateTenantPlan(tenantId: string, plan: string): Promise<void> {
    const db = getDb();
    await db.execute({
      sql: `UPDATE tenants SET plan = ? WHERE id = ?;`,
      args: [plan, tenantId],
    });
  }

  static async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    const db = getDb();
    await db.execute({
      sql: `UPDATE users SET password_hash = ? WHERE id = ?;`,
      args: [newPasswordHash, userId],
    });
  }
}
