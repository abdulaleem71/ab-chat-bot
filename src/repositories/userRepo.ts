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

export interface OAuthAccountRow {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  email: string;
  created_at: string;
}

export class UserRepo {
  static async findUserByOAuth(provider: string, providerUserId: string): Promise<UserRow | null> {
    const db = getDb();
    const res = await db.execute({
      sql: `
        SELECT u.* 
        FROM users u
        INNER JOIN oauth_accounts oa ON u.id = oa.user_id
        WHERE oa.provider = ? AND oa.provider_user_id = ?
        LIMIT 1;
      `,
      args: [provider, String(providerUserId)],
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

  static async linkOAuthAccount(userId: string, provider: string, providerUserId: string, email: string): Promise<void> {
    const db = getDb();
    const id = `oa_${provider}_${providerUserId}`;
    const now = new Date().toISOString();
    await db.execute({
      sql: `
        INSERT INTO oauth_accounts (id, user_id, provider, provider_user_id, email, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(provider, provider_user_id) DO UPDATE SET
          user_id = excluded.user_id,
          email = excluded.email;
      `,
      args: [id, userId, provider, String(providerUserId), email.toLowerCase(), now],
    });
  }

  static async findOAuthAccountsByUserId(userId: string): Promise<OAuthAccountRow[]> {
    const db = getDb();
    const res = await db.execute({
      sql: `SELECT * FROM oauth_accounts WHERE user_id = ?;`,
      args: [userId],
    });
    return res.rows.map(r => ({
      id: String(r.id),
      user_id: String(r.user_id),
      provider: String(r.provider),
      provider_user_id: String(r.provider_user_id),
      email: String(r.email),
      created_at: String(r.created_at),
    }));
  }

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
