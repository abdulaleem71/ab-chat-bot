import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

let dbClient: Client | null = null;

function removeCorruptSqliteFiles(rawUrl: string) {
  try {
    const cleanUrl = rawUrl.replace(/^file:/, '');
    const dbPath = path.isAbsolute(cleanUrl) ? cleanUrl : path.resolve(process.cwd(), cleanUrl);
    const relatedFiles = [
      dbPath,
      `${dbPath}-journal`,
      `${dbPath}-wal`,
      `${dbPath}-shm`
    ];
    for (const filePath of relatedFiles) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.warn(`[DB RECOVERY] Removed corrupted SQLite database file: ${filePath}`);
        } catch (e) {
          // ignore error
        }
      }
    }
  } catch (err) {
    console.error('[DB RECOVERY] Error cleaning up corrupt SQLite files:', err);
  }
}

export function validateDatabaseConfig(): { isRemote: boolean; url: string; authToken?: string } {
  let dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:nomadschat.db';
  let authToken = process.env.TURSO_AUTH_TOKEN ? process.env.TURSO_AUTH_TOKEN.trim() : undefined;

  const isPlaceholderToken = !authToken || authToken === 'your_turso_auth_token_here' || authToken.startsWith('your_') || authToken.includes('here');

  let isRemote = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://') || dbUrl.startsWith('wss://');

  if (isRemote && isPlaceholderToken) {
    console.warn(
      `[DATABASE CONFIG WARNING] Remote Turso database URL detected ("${dbUrl}"), but TURSO_AUTH_TOKEN is placeholder or missing. ` +
      'Falling back to local SQLite database (file:nomadschat.db).'
    );
    dbUrl = 'file:nomadschat.db';
    authToken = undefined;
    isRemote = false;
  }

  return { isRemote, url: dbUrl, authToken };
}

export function getDb(): Client {
  if (!dbClient) {
    const config = validateDatabaseConfig();
    let targetUrl = config.url;
    // Prefer https:// protocol over libsql:// for HTTP fetch reliability in serverless environments (e.g. Vercel)
    if (targetUrl.startsWith('libsql://')) {
      targetUrl = targetUrl.replace(/^libsql:\/\//, 'https://');
    }
    dbClient = createClient({
      url: targetUrl,
      ...(config.authToken ? { authToken: config.authToken } : {}),
    });
  }
  return dbClient;
}

let isDbInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  if (isDbInitialized) return;
  if (!initPromise) {
    initPromise = initDb()
      .then(() => {
        isDbInitialized = true;
      })
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  return initPromise;
}

export async function initDb(): Promise<void> {
  const config = validateDatabaseConfig();
  let db = getDb();

  const runMigrations = async (client: Client, isRemoteConn: boolean) => {
    // Enable Foreign Key Enforcement for local SQLite file only (PRAGMA is unsupported over Hrana HTTP in Turso)
    if (!isRemoteConn) {
      try {
        await client.execute('PRAGMA foreign_keys = ON;');
      } catch (err) {
        console.warn('Note on PRAGMA foreign_keys = ON execution:', err);
      }
    }

    // Create Users Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'owner',
        created_at TEXT NOT NULL
      );
    `);

    // Create Tenants Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        owner_email TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'Pro',
        logo_url TEXT,
        timezone TEXT DEFAULT 'UTC',
        is_disabled INTEGER NOT NULL DEFAULT 0,
        disabled_reason TEXT,
        deleted_at TEXT,
        created_at TEXT NOT NULL
      );
    `);

    // Create Organization Members Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS organization_members (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        created_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create OAuth Accounts Table (Google, GitHub, etc.)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS oauth_accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(provider, provider_user_id)
      );
    `);

    // Create Chatbots Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS chatbots (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        system_instruction TEXT,
        tone TEXT NOT NULL DEFAULT 'Friendly',
        primary_color TEXT NOT NULL DEFAULT '#4F46E5',
        text_color TEXT NOT NULL DEFAULT '#FFFFFF',
        avatar TEXT NOT NULL DEFAULT '🤖',
        greeting_message TEXT NOT NULL,
        suggested_questions_json TEXT NOT NULL DEFAULT '[]',
        model TEXT NOT NULL DEFAULT 'gemini-3.7-flash',
        fallback_message TEXT NOT NULL,
        collect_lead_email INTEGER NOT NULL DEFAULT 1,
        lead_title TEXT,
        human_operator_online INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'active',
        is_disabled INTEGER NOT NULL DEFAULT 0,
        disabled_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Chatbot Versions Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS chatbot_versions (
        id TEXT PRIMARY KEY,
        chatbot_id TEXT NOT NULL,
        snapshot TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE
      );
    `);

    try {
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_chatbot_versions_bot ON chatbot_versions(chatbot_id);`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_chatbot_versions_created ON chatbot_versions(chatbot_id, created_at DESC);`);
    } catch (e) {}

    // Create Knowledge Sources Table (Tenant-owned)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS knowledge_sources (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        source_url TEXT,
        status TEXT NOT NULL DEFAULT 'indexed',
        chunk_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Chatbot Knowledge Sources Join Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS chatbot_knowledge_sources (
        chatbot_id TEXT NOT NULL,
        knowledge_source_id TEXT NOT NULL,
        PRIMARY KEY (chatbot_id, knowledge_source_id),
        FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE,
        FOREIGN KEY (knowledge_source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE
      );
    `);

    // Create Knowledge Chunks Table for RAG
    await client.execute(`
      CREATE TABLE IF NOT EXISTS knowledge_chunks (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        content TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        embedding_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Migration for knowledge_chunks embedding_json column
    try {
      await client.execute(`ALTER TABLE knowledge_chunks ADD COLUMN embedding_json TEXT;`);
    } catch (e) {}

    // Create Transactional Emails Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS transactional_emails (
        id TEXT PRIMARY KEY,
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        token TEXT,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Migration for legacy knowledge tables (migrating chatbot_id to join table and dropping old columns)
    try {
      const ksInfo = await client.execute(`PRAGMA table_info(knowledge_sources);`);
      if (ksInfo.rows.some((r: any) => String(r.name) === 'chatbot_id')) {
        await client.execute(`
          INSERT OR IGNORE INTO chatbot_knowledge_sources (chatbot_id, knowledge_source_id)
          SELECT chatbot_id, id FROM knowledge_sources WHERE chatbot_id IS NOT NULL AND chatbot_id != '';
        `);
        try {
          await client.execute(`ALTER TABLE knowledge_sources DROP COLUMN chatbot_id;`);
        } catch (e) {}
      }
    } catch (e) {}

    try {
      const tenantInfo = await client.execute(`PRAGMA table_info(tenants);`);
      if (!tenantInfo.rows.some((r: any) => String(r.name) === 'deleted_at')) {
        await client.execute(`ALTER TABLE tenants ADD COLUMN deleted_at TEXT;`);
      }
    } catch (e) {}

    try {
      await client.execute(`DELETE FROM tenants WHERE deleted_at IS NOT NULL AND datetime(deleted_at, '+30 days') < datetime('now');`);
    } catch (e) {}

    // Create Contacts Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        external_id TEXT,
        name TEXT,
        email TEXT,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    try {
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(tenant_id, email);`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_contacts_external ON contacts(tenant_id, external_id);`);
    } catch (e) {}

    // Create Conversations Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        chatbot_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        visitor_id TEXT NOT NULL,
        contact_id TEXT,
        visitor_name TEXT,
        visitor_email TEXT,
        visitor_location TEXT,
        visitor_browser TEXT,
        page_url TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        last_message TEXT NOT NULL DEFAULT '',
        last_message_time TEXT NOT NULL,
        unread_by_agent INTEGER NOT NULL DEFAULT 1,
        csat_rating INTEGER,
        is_test INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
      );
    `);

    try {
      const convInfo = await client.execute(`PRAGMA table_info(conversations);`);
      if (!convInfo.rows.some((r: any) => String(r.name) === 'contact_id')) {
        await client.execute(`ALTER TABLE conversations ADD COLUMN contact_id TEXT REFERENCES contacts(id);`);
      }
      if (!convInfo.rows.some((r: any) => String(r.name) === 'is_test')) {
        await client.execute(`ALTER TABLE conversations ADD COLUMN is_test INTEGER NOT NULL DEFAULT 0;`);
      }
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);`);
      await client.execute(`CREATE INDEX IF NOT EXISTS idx_conversations_istest ON conversations(is_test);`);
    } catch (e) {}

    // Create Messages Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        chatbot_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        agent_name TEXT,
        content TEXT NOT NULL,
        sources_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );
    `);

    // Create Leads Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        chatbot_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        first_question TEXT,
        captured_at TEXT NOT NULL,
        FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Usage Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS usage (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        query_count INTEGER NOT NULL DEFAULT 0,
        hour_timestamp INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Create Subscriptions Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        tenant_id TEXT UNIQUE NOT NULL,
        plan TEXT NOT NULL DEFAULT 'Pro',
        status TEXT NOT NULL DEFAULT 'active',
        renews_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Domain Verifications & Security Registry Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS domain_verifications (
        id TEXT PRIMARY KEY,
        domain TEXT UNIQUE NOT NULL,
        tenant_id TEXT,
        verification_status TEXT NOT NULL DEFAULT 'verified',
        verification_method TEXT NOT NULL DEFAULT 'dns_txt',
        verification_token TEXT NOT NULL,
        ssl_status TEXT NOT NULL DEFAULT 'valid',
        http_status INTEGER NOT NULL DEFAULT 200,
        response_time_ms INTEGER NOT NULL DEFAULT 45,
        is_whitelisted INTEGER NOT NULL DEFAULT 1,
        is_blocked INTEGER NOT NULL DEFAULT 0,
        lock_enforced INTEGER NOT NULL DEFAULT 1,
        last_checked_at TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
      );
    `);

    // Create Support Tickets Table (for Agent Tool Execution)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        conversation_id TEXT,
        ticket_number TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'open',
        assignee_id TEXT,
        customer_email TEXT,
        notes_json TEXT DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create Discount Codes Table (for Agent Tool Execution)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        percentage REAL NOT NULL DEFAULT 10.0,
        reason TEXT,
        customer_email TEXT,
        conversation_id TEXT,
        created_at TEXT NOT NULL,
        expires_at TEXT,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Discount Code Policies Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS discount_code_policies (
        tenant_id TEXT PRIMARY KEY,
        max_percent REAL NOT NULL DEFAULT 20.0,
        max_per_conversation INTEGER NOT NULL DEFAULT 1,
        requires_approval_above REAL NOT NULL DEFAULT 15.0,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Tenant Audit Logs Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tenant_audit_logs (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_resource TEXT,
        target_id TEXT,
        details_json TEXT,
        status TEXT NOT NULL DEFAULT 'success',
        created_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Moderation Blocklist Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS moderation_blocklist (
        id TEXT PRIMARY KEY,
        pattern TEXT NOT NULL UNIQUE,
        category TEXT DEFAULT 'general',
        created_at TEXT NOT NULL,
        admin_email TEXT
      );
    `);

    // Create Moderation Queue Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS moderation_queue (
        id TEXT PRIMARY KEY,
        item_type TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        resource_title TEXT,
        content_snippet TEXT,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'pending_review',
        flagged_source TEXT NOT NULL DEFAULT 'automatic_keyword_scan',
        flagged_by TEXT,
        created_at TEXT NOT NULL,
        reviewed_by_admin_email TEXT,
        reviewed_at TEXT,
        action_details TEXT,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Seed default blocklist if empty
    try {
      const blCheck = await client.execute(`SELECT COUNT(*) as cnt FROM moderation_blocklist;`);
      if (Number(blCheck.rows[0].cnt) === 0) {
        const now = new Date().toISOString();
        const defaults = [
          ['bl_1', 'credit card', 'financial', now, 'system@nomadschat.com'],
          ['bl_2', 'ssn', 'pii', now, 'system@nomadschat.com'],
          ['bl_3', 'cvv', 'financial', now, 'system@nomadschat.com'],
          ['bl_4', 'hack', 'security', now, 'system@nomadschat.com'],
          ['bl_5', 'malware', 'security', now, 'system@nomadschat.com'],
          ['bl_6', 'exploit', 'security', now, 'system@nomadschat.com'],
          ['bl_7', 'phishing', 'security', now, 'system@nomadschat.com'],
          ['bl_8', 'bypass safety', 'safety', now, 'system@nomadschat.com'],
          ['bl_9', 'jailbreak', 'safety', now, 'system@nomadschat.com'],
        ];
        for (const d of defaults) {
          try {
            await client.execute({
              sql: `INSERT OR IGNORE INTO moderation_blocklist (id, pattern, category, created_at, admin_email) VALUES (?, ?, ?, ?, ?);`,
              args: d,
            });
          } catch {}
        }
      }
    } catch {}

    // Create Audit Events Table (Append-Only)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        actor_id TEXT,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Tenant Notifications Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tenant_notifications (
        tenant_id TEXT PRIMARY KEY,
        new_ticket_alert INTEGER NOT NULL DEFAULT 1,
        integration_disconnected_alert INTEGER NOT NULL DEFAULT 1,
        usage_near_limit_alert INTEGER NOT NULL DEFAULT 1,
        email_notifications_enabled INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Tenant API Keys Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tenant_api_keys (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_used_at TEXT,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Tenant Webhooks Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tenant_webhooks (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        secret_encrypted TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Integrations Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        integration_id TEXT NOT NULL,
        is_connected INTEGER NOT NULL DEFAULT 0,
        config_json TEXT,
        connected_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        UNIQUE(tenant_id, integration_id)
      );
    `);

    // Create Team Invitations Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS team_invitations (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Agent',
        token TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        invited_by TEXT,
        invited_by_name TEXT,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create Background Jobs Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS background_jobs (
        id TEXT PRIMARY KEY,
        tenant_id TEXT,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        error TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        next_retry_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Create Admin Audit Logs Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        admin_email TEXT NOT NULL,
        action TEXT NOT NULL,
        target_resource TEXT,
        target_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        details_json TEXT,
        status TEXT NOT NULL DEFAULT 'success',
        created_at TEXT NOT NULL
      );
    `);

    // Create System Alerts Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS system_alerts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL,
        category TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        acknowledged_at TEXT,
        resolved_at TEXT,
        resolved_by TEXT
      );
    `);

    // Create Performance Indexes
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_chatbots_tenant ON chatbots(tenant_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_ks_bot ON knowledge_sources(chatbot_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_kc_bot ON knowledge_chunks(chatbot_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_conv_bot ON conversations(chatbot_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_oauth_provider_user ON oauth_accounts(provider, provider_user_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_oauth_user_id ON oauth_accounts(user_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON integrations(tenant_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_invites_tenant ON team_invitations(tenant_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_tenant_audit_tenant ON tenant_audit_logs(tenant_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_tenant_audit_created ON tenant_audit_logs(created_at);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_email);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs(action);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON system_alerts(status);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_alerts_severity ON system_alerts(severity);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_alerts_created ON system_alerts(created_at);`);

    // Column Migration for website_url
    try {
      await client.execute(`ALTER TABLE chatbots ADD COLUMN website_url TEXT;`);
    } catch {
      // Column already exists
    }

    // Column Migration for chatbot channel type (Website Widget, WhatsApp, Instagram DM, Email)
    try {
      await client.execute(`ALTER TABLE chatbots ADD COLUMN channel TEXT DEFAULT 'Website Widget';`);
    } catch {
      // Column already exists
    }

    // Column Migration for conversation channel type and assignee
    try {
      await client.execute(`ALTER TABLE conversations ADD COLUMN channel TEXT DEFAULT 'Website Widget';`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE conversations ADD COLUMN assigned_to TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE conversations ADD COLUMN assigned_to_name TEXT;`);
    } catch {
      // Column already exists
    }

    // Column Migration for users avatar_url & verification/reset
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN avatar_url TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN last_active_at TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 1;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN email_verification_token TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN email_verification_expires_at TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN password_reset_token TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN password_reset_expires_at TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN mfa_enabled INTEGER DEFAULT 0;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN mfa_secret TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE users ADD COLUMN mfa_backup_codes_json TEXT;`);
    } catch {
      // Column already exists
    }

    // Column Migration for domain locking & embed security
    try {
      await client.execute(`ALTER TABLE chatbots ADD COLUMN allowed_domains_json TEXT DEFAULT '[]';`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE chatbots ADD COLUMN domain_lock_enabled INTEGER DEFAULT 1;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE chatbots ADD COLUMN embed_secret_key TEXT;`);
    } catch {
      // Column already exists
    }

    // Column Migration for tenant BYOK (Bring Your Own Key)
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN byok_api_key TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN byok_provider TEXT DEFAULT 'gemini';`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN byok_updated_at TEXT;`);
    } catch {
      // Column already exists
    }

    // Column Migration for tenant 3-day Growth Pro Trial & Payment Method On File
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN trial_started_at TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN trial_ends_at TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN payment_method_on_file INTEGER DEFAULT 0;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN payment_method_brand TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN payment_method_last4 TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN payment_method_exp TEXT;`);
    } catch {
      // Column already exists
    }

    // Column Migration for tenant billing interventions & dunning telemetry
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN credit_balance REAL DEFAULT 0.0;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN payment_status TEXT DEFAULT 'active';`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN failed_payments_count INTEGER DEFAULT 0;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN retry_attempts INTEGER DEFAULT 0;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN last_payment_error TEXT;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN dunning_since TEXT;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN is_disabled INTEGER DEFAULT 0;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN disabled_reason TEXT;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE chatbots ADD COLUMN is_disabled INTEGER DEFAULT 0;`);
    } catch {}
    try {
      await client.execute(`ALTER TABLE chatbots ADD COLUMN disabled_reason TEXT;`);
    } catch {}

    // Column Migration for conversation outcome logging
    try {
      await client.execute(`ALTER TABLE conversations ADD COLUMN resolved_by TEXT DEFAULT 'ai';`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE conversations ADD COLUMN tools_invoked_json TEXT DEFAULT '[]';`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE conversations ADD COLUMN csat_feedback TEXT;`);
    } catch {
      // Column already exists
    }

    // Column Migration for escalation rules on tenants
    try {
      await client.execute(`ALTER TABLE tenants ADD COLUMN escalation_rules_json TEXT;`);
    } catch {
      // Column already exists
    }
    try {
      await client.execute(`ALTER TABLE support_tickets ADD COLUMN assignee_id TEXT;`);
    } catch {
      // Column already exists
    }

    // Model migration for any legacy gemini-3.6-flash entries
    try {
      await client.execute(`UPDATE chatbots SET model = 'gemini-3.7-flash' WHERE model = 'gemini-3.6-flash' OR model IS NULL;`);
    } catch {
      // Ignore if table not yet migrated
    }
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_conv_tenant ON conversations(tenant_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);`);

    // Seed Default Tenant & Demo User & Bot & Commerce Data if Database is empty
    await seedInitialData(client);
  };

  try {
    await runMigrations(db, config.isRemote);
  } catch (err: any) {
    const errMessage = String(err?.message || err || '');
    const isCorruptError = errMessage.includes('SQLITE_CORRUPT') || errMessage.includes('disk image is malformed');

    if (isCorruptError && !config.isRemote) {
      console.warn('⚠️ Detected corrupted local SQLite database file. Automatically rebuilding local database...');
      removeCorruptSqliteFiles(config.url);
      dbClient = null;
      db = getDb();
      await runMigrations(db, false);
      return;
    }

    if (config.isRemote && process.env.NODE_ENV !== 'production') {
      console.warn(`[DATABASE INIT WARNING] Remote Turso connection failed (${errMessage}). Falling back to local SQLite database (file:nomadschat.db) for local development.`);
      removeCorruptSqliteFiles('file:nomadschat.db');
      dbClient = createClient({ url: 'file:nomadschat.db' });
      try {
        await runMigrations(dbClient, false);
      } catch (fallbackErr: any) {
        const fallbackMsg = String(fallbackErr?.message || fallbackErr || '');
        if (fallbackMsg.includes('SQLITE_CORRUPT') || fallbackMsg.includes('disk image is malformed')) {
          console.warn('⚠️ Local SQLite fallback database file is corrupt. Recreating database from scratch...');
          removeCorruptSqliteFiles('file:nomadschat.db');
          dbClient = createClient({ url: 'file:nomadschat.db' });
          await runMigrations(dbClient, false);
        } else {
          throw fallbackErr;
        }
      }
    } else {
      throw err;
    }
  }
}

async function seedInitialData(db: Client) {
  const usersRes = await db.execute(`SELECT COUNT(*) as cnt FROM users;`);
  const count = Number(usersRes.rows[0]?.cnt || 0);

  if (count === 0) {
    const now = new Date().toISOString();
    const tenantId = 'tenant_acme';
    const userId = 'usr_acme_admin';
    const botId = 'bot_acme_support';

    // Seed Tenant
    await db.execute({
      sql: `INSERT INTO tenants (id, name, owner_email, plan, created_at) VALUES (?, ?, ?, ?, ?);`,
      args: [tenantId, 'Acme Workspace', 'alex@acmesaas.io', 'Pro', now],
    });

    // Seed User
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, name, tenant_id, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [userId, 'alex@acmesaas.io', 'password', 'Alex Rivera', tenantId, 'owner', now],
    });

    // Seed Agent User
    const agentUserId = 'usr_elena_agent';
    await db.execute({
      sql: `INSERT INTO users (id, email, password_hash, name, tenant_id, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [agentUserId, 'elena@acmesaas.io', 'password', 'Elena Rostova', tenantId, 'agent', now],
    });

    // Seed Org Members
    await db.execute({
      sql: `INSERT INTO organization_members (id, tenant_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?);`,
      args: ['mem_1', tenantId, userId, 'owner', now],
    });
    await db.execute({
      sql: `INSERT INTO organization_members (id, tenant_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?);`,
      args: ['mem_2', tenantId, agentUserId, 'agent', now],
    });

    // Seed Sample Team Invite
    await db.execute({
      sql: `INSERT INTO team_invitations (id, tenant_id, email, role, token, status, invited_by, invited_by_name, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: ['inv_1', tenantId, 'marcus.chen@acmesaas.io', 'Agent', 'tok_inv_1', 'pending', userId, 'Alex Rivera', now, new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()],
    });

    // Seed Integrations
    await db.execute({
      sql: `INSERT INTO integrations (id, tenant_id, integration_id, is_connected, config_json, connected_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: ['int_slack_1', tenantId, 'slack', 1, JSON.stringify({ channel: '#support-live', webhookUrl: 'https://hooks.slack.com/services/T00/B00/XXXX' }), now, now],
    });

    // Seed Subscription
    await db.execute({
      sql: `INSERT INTO subscriptions (id, tenant_id, plan, status, renews_at, created_at) VALUES (?, ?, ?, ?, ?, ?);`,
      args: ['sub_1', tenantId, 'Pro', 'active', new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), now],
    });

    // Seed Chatbot
    const suggestedQuestions = JSON.stringify([
      'How do I set up SSO authentication?',
      'What are the API rate limits for Pro plan?',
      'How do I invite team members?',
      'Can I export workspace metrics to CSV?'
    ]);

    await db.execute({
      sql: `INSERT INTO chatbots (
        id, tenant_id, user_id, name, description, system_instruction, tone, primary_color, text_color, avatar,
        greeting_message, suggested_questions_json, model, fallback_message, collect_lead_email, lead_title,
        human_operator_online, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        botId, tenantId, userId, 'Acme Product Concierge',
        'Handles technical support, feature questions, and account troubleshooting.',
        'You are the primary AI customer support assistant for Acme SaaS Corp. Answer questions politely, accurately, and concisely using the provided knowledge base.',
        'Friendly', '#4F46E5', '#FFFFFF', '🤖',
        '👋 Hi there! I am Acme AI Concierge. How can I assist you with your workspace today?',
        suggestedQuestions, 'gemini-3.7-flash',
        "I'm sorry, I don't have information on that specific topic yet. Would you like me to connect you with a live human support specialist?",
        1, 'Get personalized help from our team', 1, 'active', now, now
      ],
    });

    // Seed Knowledge Sources
    const ks1Id = 'ks_1';
    const ks1Content = `Acme supports Single Sign-On (SSO) integration via SAML 2.0 and OpenID Connect (OIDC) for Okta, Azure AD, PingIdentity, and Google Workspace.
    Setting up SSO:
    1. Navigate to Settings > Authentication > SSO Configuration.
    2. Download the Acme Service Provider Metadata XML file.
    3. Enter your Identity Provider Entity ID and ACS Endpoint URL.
    4. Enable Enforce SSO for all workspace members.
    SSO is available on Pro ($49/mo) and Enterprise plans.`;

    await db.execute({
      sql: `INSERT INTO knowledge_sources (id, tenant_id, type, title, content, source_url, status, chunk_count, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [ks1Id, tenantId, 'url', 'Acme Security & SSO Setup Documentation', ks1Content, 'https://docs.acmesaas.io/sso-guide', 'indexed', 2, now],
    });

    await db.execute({
      sql: `INSERT OR IGNORE INTO chatbot_knowledge_sources (chatbot_id, knowledge_source_id) VALUES (?, ?);`,
      args: [botId, ks1Id],
    });

    const ks2Id = 'ks_2';
    const ks2Content = `Q: How do I invite team members to my workspace?
    A: Click 'Team Settings' on the sidebar, hit 'Invite Member', type their email address, and select their role.

    Q: What are the API rate limits?
    A: Free tier allows 1,000 requests/day. Pro tier allows 100,000 requests/day. Enterprise offers unlimited capacity.`;

    await db.execute({
      sql: `INSERT INTO knowledge_sources (id, tenant_id, type, title, content, source_url, status, chunk_count, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [ks2Id, tenantId, 'faq', 'Acme Workspace FAQs & Rate Limits', ks2Content, '', 'indexed', 2, now],
    });

    await db.execute({
      sql: `INSERT OR IGNORE INTO chatbot_knowledge_sources (chatbot_id, knowledge_source_id) VALUES (?, ?);`,
      args: [botId, ks2Id],
    });

    // Seed Knowledge Chunks for RAG
    await db.execute({
      sql: `INSERT INTO knowledge_chunks (id, source_id, tenant_id, content, chunk_index, created_at)
            VALUES (?, ?, ?, ?, ?, ?);`,
      args: ['kc_1', ks1Id, tenantId, ks1Content, 0, now],
    });

    await db.execute({
      sql: `INSERT INTO knowledge_chunks (id, source_id, tenant_id, content, chunk_index, created_at)
            VALUES (?, ?, ?, ?, ?, ?);`,
      args: ['kc_2', ks2Id, tenantId, ks2Content, 0, now],
    });

    // Seed Demo Conversations & Messages
    const conv1Id = 'conv_1';
    await db.execute({
      sql: `INSERT INTO conversations (id, chatbot_id, tenant_id, visitor_id, visitor_name, visitor_email, visitor_location, visitor_browser, page_url, status, last_message, last_message_time, unread_by_agent, csat_rating, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [conv1Id, botId, tenantId, 'vis_101', 'Sarah Jenkins', 'sarah.j@enterprise.com', 'San Francisco, CA', 'Chrome / macOS', 'https://acmesaas.io/pricing', 'active', 'How do I configure SAML SSO for Okta?', now, 1, 5, now],
    });

    await db.execute({
      sql: `INSERT INTO messages (id, conversation_id, chatbot_id, tenant_id, sender, agent_name, content, sources_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: ['msg_101', conv1Id, botId, tenantId, 'visitor', null, 'How do I configure SAML SSO for Okta?', null, now],
    });

    await db.execute({
      sql: `INSERT INTO messages (id, conversation_id, chatbot_id, tenant_id, sender, agent_name, content, sources_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'msg_102', conv1Id, botId, tenantId, 'bot', null,
        'Acme supports SAML 2.0 SSO integration for Okta! You can configure it under Settings > Authentication > SSO Configuration by downloading our Metadata XML and uploading your Identity Provider Entity ID.',
        JSON.stringify([{ title: 'Acme Security & SSO Setup Documentation', snippet: 'Acme supports Single Sign-On (SSO)...' }]),
        now
      ],
    });

    // Seed Demo Lead
    await db.execute({
      sql: `INSERT INTO leads (id, chatbot_id, tenant_id, conversation_id, name, email, phone, company, first_question, captured_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: ['lead_1', botId, tenantId, conv1Id, 'Sarah Jenkins', 'sarah.j@enterprise.com', '+1 415 555 0199', 'Enterprise Corp', 'How do I configure SAML SSO for Okta?', now],
    });

    // Seed Sample Support Ticket
    await db.execute({
      sql: `INSERT INTO support_tickets (id, tenant_id, conversation_id, ticket_number, subject, description, priority, status, customer_email, notes_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        'tkt_1',
        tenantId,
        conv1Id,
        'TKT-1001',
        'SAML 2.0 Identity Provider Assertion Error',
        'Customer reported Okta metadata certificate validation timing out during initial handshake.',
        'high',
        'open',
        'sarah.j@enterprise.com',
        JSON.stringify(['Initial investigation assigned to tier 2 support engineer']),
        now,
        now,
      ],
    });
  }
}
