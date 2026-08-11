# NomadsChat - AI Customer Support Chatbot Platform

NomadsChat is an enterprise-ready, multi-tenant AI customer support platform powered by Gemini AI and `@libsql/client`.

---

## 🛠️ Database Configuration Guide

NomadsChat uses `@libsql/client` as its database abstraction, providing full support for both local file-based SQLite development and high-availability production deployments powered by **Turso (libSQL)**.

---

### 1. Local Development Mode (SQLite File)

For local development and quick offline testing, NomadsChat defaults to a local file-based SQLite database (`nomadschat.db`).

#### `.env` setup for local development:
```env
DATABASE_URL=file:nomadschat.db
TURSO_AUTH_TOKEN=
JWT_SECRET=nomadschat_dev_secret_key_2026
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
APP_URL=http://localhost:3000
```

- When `DATABASE_URL` starts with `file:`, no `TURSO_AUTH_TOKEN` is required.
- The SQLite file will be created automatically at startup and seeded with initial demo data if empty.

---

### 2. Production Mode (Remote Turso / libSQL)

In production environments (e.g., Cloud Run, Docker containers, multi-instance serverless deployments), NomadsChat requires a remote Turso database instance (`libsql://...`).

#### Key Security & Runtime Rules:
- `DATABASE_URL` **MUST** start with `libsql://` or `https://` in production (`NODE_ENV=production`).
- `TURSO_AUTH_TOKEN` **MUST** be supplied via secure environment variables/secrets.
- Local SQLite file fallback is **strictly disabled** in production mode to prevent silent data loss across ephemeral containers.
- `TURSO_AUTH_TOKEN` is kept strictly server-side and is **never** exposed to the browser/client bundle.

#### `.env` setup for production:
```env
DATABASE_URL=libsql://nomadschat-prod-abdulaleem.aws-ap-south-1.turso.io
TURSO_AUTH_TOKEN=your_secure_turso_auth_token_here
JWT_SECRET=your_super_secret_jwt_key_here
GEMINI_API_KEY=your_production_gemini_api_key
NODE_ENV=production
PORT=3000
APP_URL=https://your-domain.com
```

---

## 🚀 Running & Verification

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
NODE_ENV=production npm start
```

### Check System & Database Health
```bash
curl http://localhost:3000/api/health
```

Expected Response:
```json
{
  "status": "ok",
  "database": "healthy",
  "databaseMode": "turso_remote",
  "timestamp": "2026-08-08T12:00:00.000Z",
  "geminiConfigured": true
}
```

---

## 🔒 Security & Multi-Tenant Architecture

- **Tenant Isolation**: All database queries filter strictly by `tenant_id` extracted from verified JWT headers.
- **Foreign Key Enforcement**: Enforced via `PRAGMA foreign_keys = ON;` upon client initialization.
- **SSRF Protection**: URL scraping validates IP addresses against loopback, private IPv4/IPv6 blocks, and forbidden metadata IP addresses (`169.254.169.254`).
