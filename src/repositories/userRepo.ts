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
  byok_api_key?: string | null;
  byok_provider?: string | null;
  byok_updated_at?: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  payment_method_on_file?: number | null;
  payment_method_brand?: string | null;
  payment_method_last4?: string | null;
  payment_method_exp?: string | null;
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
      byok_api_key: r.byok_api_key ? String(r.byok_api_key) : null,
      byok_provider: r.byok_provider ? String(r.byok_provider) : null,
      byok_updated_at: r.byok_updated_at ? String(r.byok_updated_at) : null,
      trial_started_at: r.trial_started_at ? String(r.trial_started_at) : null,
      trial_ends_at: r.trial_ends_at ? String(r.trial_ends_at) : null,
      payment_method_on_file: r.payment_method_on_file ? Number(r.payment_method_on_file) : 0,
      payment_method_brand: r.payment_method_brand ? String(r.payment_method_brand) : null,
      payment_method_last4: r.payment_method_last4 ? String(r.payment_method_last4) : null,
      payment_method_exp: r.payment_method_exp ? String(r.payment_method_exp) : null,
    };
  }

  static async createTenant(tenant: TenantRow): Promise<TenantRow> {
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO tenants (
        id, name, owner_email, plan, created_at, byok_api_key, byok_provider, byok_updated_at,
        trial_started_at, trial_ends_at, payment_method_on_file, payment_method_brand, payment_method_last4, payment_method_exp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        tenant.id,
        tenant.name,
        tenant.owner_email.toLowerCase(),
        tenant.plan,
        tenant.created_at,
        tenant.byok_api_key || null,
        tenant.byok_provider || 'gemini',
        tenant.byok_updated_at || null,
        tenant.trial_started_at || null,
        tenant.trial_ends_at || null,
        tenant.payment_method_on_file || 0,
        tenant.payment_method_brand || null,
        tenant.payment_method_last4 || null,
        tenant.payment_method_exp || null,
      ],
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

  static async setPaymentMethod(
    tenantId: string,
    details: { brand: string; last4: string; exp: string }
  ): Promise<void> {
    const db = getDb();
    await db.execute({
      sql: `UPDATE tenants SET 
        payment_method_on_file = 1,
        payment_method_brand = ?,
        payment_method_last4 = ?,
        payment_method_exp = ?
      WHERE id = ?;`,
      args: [details.brand, details.last4, details.exp, tenantId],
    });
  }

  static async removePaymentMethod(tenantId: string): Promise<void> {
    const db = getDb();
    await db.execute({
      sql: `UPDATE tenants SET 
        payment_method_on_file = 0,
        payment_method_brand = NULL,
        payment_method_last4 = NULL,
        payment_method_exp = NULL
      WHERE id = ?;`,
      args: [tenantId],
    });
  }

  static async updateTenantTrial(tenantId: string, trialStartedAt: string, trialEndsAt: string): Promise<void> {
    const db = getDb();
    await db.execute({
      sql: `UPDATE tenants SET trial_started_at = ?, trial_ends_at = ? WHERE id = ?;`,
      args: [trialStartedAt, trialEndsAt, tenantId],
    });
  }

  /**
   * Evaluates all tenants with expired trials that have no payment method on file,
   * and auto-downgrades them to the 'Free' tier.
   */
  static async checkAndDowngradeExpiredTrials(): Promise<number> {
    const db = getDb();
    const now = new Date().toISOString();
    const res = await db.execute({
      sql: `
        UPDATE tenants 
        SET plan = 'Free' 
        WHERE (plan = 'growth_pro' OR plan = 'Pro' OR plan = 'Ultra' OR plan = 'Enterprise')
          AND (payment_method_on_file IS NULL OR payment_method_on_file = 0)
          AND trial_ends_at IS NOT NULL 
          AND trial_ends_at < ?;
      `,
      args: [now],
    });
    return Number(res.rowsAffected || 0);
  }

  static async updateTenantByok(tenantId: string, apiKey: string | null, provider: string = 'gemini'): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    await db.execute({
      sql: `UPDATE tenants SET byok_api_key = ?, byok_provider = ?, byok_updated_at = ? WHERE id = ?;`,
      args: [apiKey, provider, now, tenantId],
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
