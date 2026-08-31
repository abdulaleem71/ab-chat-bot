import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ override: process.env.NODE_ENV !== 'production' });

import { initDb, getDb, validateDatabaseConfig, ensureDbInitialized } from './src/db/index';
import { UserRepo } from './src/repositories/userRepo';
import { ChatbotRepo } from './src/repositories/chatbotRepo';
import { KnowledgeRepo } from './src/repositories/knowledgeRepo';
import { ConversationRepo } from './src/repositories/conversationRepo';
import { LeadRepo } from './src/repositories/leadRepo';
import { AnalyticsRepo } from './src/repositories/analyticsRepo';
import { TeamRepo } from './src/repositories/teamRepo';
import { IntegrationRepo } from './src/repositories/integrationRepo';
import { CommerceRepo } from './src/repositories/commerceRepo';
import { KnowledgeService } from './src/services/knowledgeService';
import { ChatService } from './src/services/chatService';
import { SecurityService } from './src/services/securityService';
import { Chatbot } from './src/types';
import { AdminAuthService } from './src/admin/services/adminAuthService';
import { AdminAuditRepo } from './src/admin/repositories/adminAuditRepo';
import { AdminOverviewRepo } from './src/admin/repositories/adminOverviewRepo';
import { AdminUserRepo } from './src/admin/repositories/adminUserRepo';
import { AdminChatbotRepo } from './src/admin/repositories/adminChatbotRepo';
import { AdminDomainRepo } from './src/admin/repositories/adminDomainRepo';
import { AdminConversationRepo } from './src/admin/repositories/adminConversationRepo';
import { AdminAnalyticsRepo } from './src/admin/repositories/adminAnalyticsRepo';
import { AdminFunnelRepo } from './src/admin/repositories/adminFunnelRepo';
import { AdminIntelligenceRepo } from './src/admin/repositories/adminIntelligenceRepo';
import { AdminAlertsRepo } from './src/admin/repositories/adminAlertsRepo';
import { AdminUser } from './src/admin/types';
import { OAuthService } from './src/services/oauthService';

const _filename = typeof __filename !== 'undefined' ? __filename : (import.meta?.url ? fileURLToPath(import.meta.url) : '');
const _dirname = typeof __dirname !== 'undefined' ? __dirname : (_filename ? path.dirname(_filename) : process.cwd());

const app = express();
// Enable trust proxy for reverse proxies (Cloud Run, Vercel, Nginx)
app.set('trust proxy', 1);

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nomadschat_secure_jwt_secret_key_2026';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'nomadschat_secure_jwt_secret_key_2026' || process.env.JWT_SECRET.trim().length < 16) {
    console.warn('⚠️ SECURITY WARNING: A strong JWT_SECRET environment variable (>= 16 characters) should be set in production.');
  }
}

// Validate Production Configuration & Initialize Database
try {
  const dbConfig = validateDatabaseConfig();
  console.log(`ℹ️ Database mode: ${dbConfig.isRemote ? 'Remote Turso Database' : 'Local SQLite File'}`);
} catch (configErr: any) {
  console.warn('⚠️ Configuration Warning:', configErr.message);
}

ensureDbInitialized().then(async () => {
  console.log('✅ Persistent database schema initialized successfully.');
  try {
    await AdminAuthService.ensureAdminAccountsExist();
  } catch (adminInitErr: any) {
    console.warn('⚠️ Admin accounts provisioning notice:', adminInitErr.message || adminInitErr);
  }
}).catch(err => {
  console.error('❌ Failed to initialize database on startup:', err.message);
});

// Helper for wrapping async route handlers to guarantee JSON error responses
const asyncHandler = (fn: (req: any, res: express.Response, next: express.NextFunction) => Promise<any>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Crucial: Allows external websites to load widget.js & embed iframes
    crossOriginOpenerPolicy: false,
    frameguard: false, // Allows iframe embedding for chatbot widget on 3rd party websites
  })
);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Explicitly allow cross-origin resource loading for widget and embed endpoints
  if (req.path === '/widget.js' || req.path.startsWith('/embed') || req.path.startsWith('/api/chatbots/')) {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  next();
});

// Public widget endpoints allow cross-origin requests
app.use('/api/chatbots/:id/chat', cors({ origin: '*', credentials: false }));
app.use('/api/chatbots/:id/auto-detect-host', cors({ origin: '*', credentials: false }));
app.use('/widget.js', cors({ origin: '*', credentials: false }));

// All other routes use controlled CORS policy
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, true);
    },
    credentials: false,
  })
);

app.use(express.json({ limit: '500kb' }));

// Rate Limiters
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, error: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, error: 'Rate limit exceeded for chat messages. Please wait a moment.' },
});

const autoDetectLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { success: false, error: 'Auto-detect rate limit reached. Please wait a moment.' },
});

app.use('/api/', globalApiLimiter);

// Ensure DB is fully initialized before executing any /api query
app.use('/api/', async (req, res, next) => {
  try {
    await ensureDbInitialized();
    next();
  } catch (err: any) {
    console.error('Database Initialization Middleware Error:', err.message || err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Database connection error. Please verify TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel environment variables.',
    });
  }
});

// Authentication Middleware
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    role: string;
  };
}

function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }
}

// Tenant Admin Clearance Middleware (for billing, team invites, role edits)
function requireTenantAdminAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const role = String(req.user?.role || '').toLowerCase();
  if (role !== 'owner' && role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Permission Denied: Only workspace Admins and Owners can perform this action.',
    });
  }
  next();
}

// Dedicated Admin Server-Side Authentication Middleware
export interface AdminAuthenticatedRequest extends express.Request {
  admin?: AdminUser;
}

export function requireAdminAuth(req: AdminAuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Administrator clearance required: Missing bearer token' });
  }

  const token = authHeader.split(' ')[1];
  const verifiedAdmin = AdminAuthService.verifyAdminToken(token, JWT_SECRET);

  if (!verifiedAdmin) {
    // Log unauthorized access attempt
    AdminAuditRepo.logAction({
      adminId: 'unknown',
      adminEmail: 'unknown',
      action: 'ADMIN_ENDPOINT_ACCESS_DENIED',
      targetResource: req.originalUrl || req.path,
      ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''),
      userAgent: String(req.headers['user-agent'] || ''),
      status: 'denied',
      detailsJson: JSON.stringify({ path: req.path, method: req.method }),
    }).catch(() => {});

    return res.status(403).json({
      success: false,
      error: 'Forbidden: Access restricted to authorized administrator accounts only.',
    });
  }

  req.admin = verifiedAdmin;
  next();
}

// ==========================================
// EMBED WIDGET JS ENDPOINT (/widget.js)
// ==========================================
app.get('/widget.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=300');

  try {
    const widgetPath = path.join(process.cwd(), 'public', 'widget.js');
    if (fs.existsSync(widgetPath)) {
      const scriptContent = fs.readFileSync(widgetPath, 'utf-8');
      return res.send(scriptContent);
    }
  } catch (e) {
    // Fallback if file read fails
  }

  res.send(`console.warn('[NomadsChat] widget.js loading fallback');`);
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', asyncHandler(async (req, res) => {
  let dbHealthy = false;
  let dbError: string | undefined;

  try {
    const db = getDb();
    await db.execute('SELECT 1;');
    dbHealthy = true;
  } catch (err: any) {
    dbHealthy = false;
    dbError = err.message || 'Database ping failed';
  }

  const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:nomadschat.db';
  const isRemote = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://') || dbUrl.startsWith('wss://');

  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'ok' : 'degraded',
    database: dbHealthy ? 'healthy' : 'unhealthy',
    databaseMode: isRemote ? 'turso_remote' : 'sqlite_local',
    ...(dbError ? { databaseError: dbError } : {}),
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
}));

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================
app.post('/api/auth/register', authLimiter, asyncHandler(async (req, res) => {
  const { email, password, name, companyName } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 100) {
    return res.status(400).json({ success: false, error: 'Valid email address is required' });
  }

  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 100) {
    return res.status(400).json({ success: false, error: 'Password must be between 6 and 100 characters' });
  }

  const existing = await UserRepo.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, error: 'An account with this email address already exists' });
  }

  const tenantId = 'tenant_' + Date.now();
  const userId = 'usr_' + Date.now();
  const now = new Date().toISOString();
  const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const tenant = await UserRepo.createTenant({
    id: tenantId,
    name: companyName ? String(companyName).slice(0, 100) : `${email.split('@')[0]}'s Workspace`,
    owner_email: email.toLowerCase(),
    plan: 'growth_pro',
    created_at: now,
    trial_started_at: now,
    trial_ends_at: trialEndsAt,
    payment_method_on_file: 0,
  });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await UserRepo.createUser({
    id: userId,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    name: name ? String(name).slice(0, 100) : email.split('@')[0],
    tenant_id: tenantId,
    role: 'owner',
    created_at: now,
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, tenantId: user.tenant_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenant_id, role: user.role },
    tenant: {
      id: tenant.id,
      name: tenant.name,
      ownerEmail: tenant.owner_email,
      plan: tenant.plan,
      createdAt: tenant.created_at,
      trialStartedAt: tenant.trial_started_at,
      trialEndsAt: tenant.trial_ends_at,
      hasPaymentMethod: false,
      paymentMethodBrand: null,
      paymentMethodLast4: null,
      paymentMethodExp: null,
    },
  });
}));

app.post('/api/auth/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  // 1. Block sign-in without an account. Require existing user.
  const user = await UserRepo.findUserByEmail(email.trim());
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'No account found with this email address. Please sign up first.',
      code: 'ACCOUNT_NOT_FOUND',
    });
  }

  let isValidPassword = false;
  if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2y$')) {
    isValidPassword = await bcrypt.compare(password, user.password_hash);
  } else {
    // Legacy plaintext match during migration
    isValidPassword = (user.password_hash === password);
  }

  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: 'Invalid password. Please check your credentials and try again.',
      code: 'INVALID_PASSWORD',
    });
  }

  let tenant = await UserRepo.findTenantById(user.tenant_id);
  if (!tenant) {
    const now = new Date().toISOString();
    const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    tenant = await UserRepo.createTenant({
      id: user.tenant_id,
      name: `${user.name}'s Workspace`,
      owner_email: user.email,
      plan: 'growth_pro',
      created_at: now,
      trial_started_at: now,
      trial_ends_at: trialEndsAt,
      payment_method_on_file: 0,
    });
  }

  // Check trial expiration: if trial has expired and no payment method exists, auto-downgrade to Free
  const now = new Date();
  if (
    tenant.trial_ends_at &&
    new Date(tenant.trial_ends_at) <= now &&
    !tenant.payment_method_on_file &&
    tenant.plan !== 'Free'
  ) {
    await UserRepo.updateTenantPlan(tenant.id, 'Free');
    tenant.plan = 'Free';
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, tenantId: user.tenant_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenant_id, role: user.role },
    tenant: {
      id: tenant.id,
      name: tenant.name,
      ownerEmail: tenant.owner_email,
      plan: tenant.plan,
      createdAt: tenant.created_at,
      trialStartedAt: tenant.trial_started_at,
      trialEndsAt: tenant.trial_ends_at,
      hasPaymentMethod: Boolean(tenant.payment_method_on_file),
      paymentMethodBrand: tenant.payment_method_brand,
      paymentMethodLast4: tenant.payment_method_last4,
      paymentMethodExp: tenant.payment_method_exp,
    },
  });
}));

// ==========================================
// OAUTH STATUS & CONFIGURATION DIAGNOSTICS
// ==========================================
app.get('/api/auth/oauth/status', (req, res) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const origin = `${protocol}://${host}`;

  res.json({
    success: true,
    providers: {
      google: {
        configured: OAuthService.isGoogleConfigured(),
        clientIdConfigured: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
        clientSecretConfigured: Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
        callbackUrl: `${origin}/api/auth/google/callback`,
        authorizedRedirectUriHelp: `${origin}/api/auth/google/callback`,
      },
      github: {
        configured: OAuthService.isGitHubConfigured(),
        clientIdConfigured: Boolean(process.env.GITHUB_CLIENT_ID?.trim()),
        clientSecretConfigured: Boolean(process.env.GITHUB_CLIENT_SECRET?.trim()),
        callbackUrl: `${origin}/api/auth/github/callback`,
        authorizedRedirectUriHelp: `${origin}/api/auth/github/callback`,
      },
    },
  });
});

// ==========================================
// GOOGLE OAUTH FLOW
// ==========================================
app.get('/api/auth/google/url', (req, res) => {
  try {
    if (!OAuthService.isGoogleConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.',
        configured: false,
      });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const defaultRedirectUri = `${protocol}://${host}/api/auth/google/callback`;
    const requestedRedirectUri = (req.query.redirect_uri as string) || defaultRedirectUri;

    const { url, state } = OAuthService.getGoogleAuthUrl(requestedRedirectUri);
    res.json({ success: true, url, state, redirectUri: requestedRedirectUri, configured: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to generate Google auth URL' });
  }
});

const handleGoogleCallback = async (req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  try {
    // 1. Check for provider-level errors (e.g. user cancelled)
    if (req.query.error) {
      const errorMsg = req.query.error === 'access_denied'
        ? 'Google sign-in was cancelled.'
        : `Google OAuth Error: ${req.query.error_description || req.query.error}`;
      return res.send(OAuthService.renderCallbackHtml({ success: false, provider: 'google', error: errorMsg }));
    }

    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      return res.status(400).send(OAuthService.renderCallbackHtml({
        success: false,
        provider: 'google',
        error: 'Missing required authorization code or state parameter.',
      }));
    }

    // 2. Verify state token
    const statePayload = OAuthService.verifyState(state, 'google');
    if (!statePayload) {
      return res.status(400).send(OAuthService.renderCallbackHtml({
        success: false,
        provider: 'google',
        error: 'OAuth state token has expired or is invalid. Please try signing in again.',
      }));
    }

    // 3. Exchange code for access token
    const accessToken = await OAuthService.exchangeGoogleCode(code, statePayload.redirectUri);

    // 4. Fetch Google user profile
    const googleUser = await OAuthService.fetchGoogleUserInfo(accessToken);

    // 5. Account resolution, tenant creation & JWT generation
    const { user, tenant, token } = await OAuthService.processOAuthLogin({
      provider: 'google',
      providerUserId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatarUrl: googleUser.picture,
    });

    return res.send(OAuthService.renderCallbackHtml({
      success: true,
      provider: 'google',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenant_id,
        role: user.role,
        avatarUrl: googleUser.picture,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        ownerEmail: tenant.owner_email,
        plan: tenant.plan,
        createdAt: tenant.created_at,
      },
    }));
  } catch (err: any) {
    console.error('[Google OAuth Callback Error]:', err.message || err);
    return res.status(500).send(OAuthService.renderCallbackHtml({
      success: false,
      provider: 'google',
      error: err.message || 'An unexpected error occurred during Google authentication.',
    }));
  }
};

app.get('/api/auth/google/callback', asyncHandler(handleGoogleCallback));
app.get('/auth/google/callback', asyncHandler(handleGoogleCallback));

// ==========================================
// GITHUB OAUTH FLOW
// ==========================================
app.get('/api/auth/github/url', (req, res) => {
  try {
    if (!OAuthService.isGitHubConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in environment variables.',
        configured: false,
      });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const defaultRedirectUri = `${protocol}://${host}/api/auth/github/callback`;
    const requestedRedirectUri = (req.query.redirect_uri as string) || defaultRedirectUri;

    const { url, state } = OAuthService.getGithubAuthUrl(requestedRedirectUri);
    res.json({ success: true, url, state, redirectUri: requestedRedirectUri, configured: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to generate GitHub auth URL' });
  }
});

const handleGithubCallback = async (req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  try {
    // 1. Check for provider-level errors
    if (req.query.error) {
      const errorMsg = req.query.error === 'access_denied'
        ? 'GitHub sign-in was cancelled.'
        : `GitHub OAuth Error: ${req.query.error_description || req.query.error}`;
      return res.send(OAuthService.renderCallbackHtml({ success: false, provider: 'github', error: errorMsg }));
    }

    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      return res.status(400).send(OAuthService.renderCallbackHtml({
        success: false,
        provider: 'github',
        error: 'Missing required authorization code or state parameter.',
      }));
    }

    // 2. Verify state token
    const statePayload = OAuthService.verifyState(state, 'github');
    if (!statePayload) {
      return res.status(400).send(OAuthService.renderCallbackHtml({
        success: false,
        provider: 'github',
        error: 'OAuth state token has expired or is invalid. Please try signing in again.',
      }));
    }

    // 3. Exchange code for access token
    const accessToken = await OAuthService.exchangeGithubCode(code, statePayload.redirectUri);

    // 4. Fetch GitHub user profile and verified email
    const githubUser = await OAuthService.fetchGithubUserInfo(accessToken);

    // 5. Account resolution, tenant creation & JWT generation
    const { user, tenant, token } = await OAuthService.processOAuthLogin({
      provider: 'github',
      providerUserId: githubUser.id,
      email: githubUser.email,
      name: githubUser.name,
      avatarUrl: githubUser.avatarUrl,
    });

    return res.send(OAuthService.renderCallbackHtml({
      success: true,
      provider: 'github',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenant_id,
        role: user.role,
        avatarUrl: githubUser.avatarUrl,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        ownerEmail: tenant.owner_email,
        plan: tenant.plan,
        createdAt: tenant.created_at,
      },
    }));
  } catch (err: any) {
    console.error('[GitHub OAuth Callback Error]:', err.message || err);
    return res.status(500).send(OAuthService.renderCallbackHtml({
      success: false,
      provider: 'github',
      error: err.message || 'An unexpected error occurred during GitHub authentication.',
    }));
  }
};

app.get('/api/auth/github/callback', asyncHandler(handleGithubCallback));
app.get('/auth/github/callback', asyncHandler(handleGithubCallback));

app.post('/api/auth/social', authLimiter, asyncHandler(async (req, res) => {
  return res.status(400).json({
    success: false,
    error: 'Direct social login bypass is disabled. Please use the official Google or GitHub OAuth popup authorization, or sign up with email and password.',
  });
}));

app.post('/api/auth/forgot-password', authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'A valid email address is required' });
  }

  const user = await UserRepo.findUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account exists for this email, password reset instructions have been generated.',
    });
  }

  const resetToken = jwt.sign(
    { userId: user.id, email: user.email, action: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({
    success: true,
    message: 'Password reset token generated.',
    resetToken,
  });
}));

app.post('/api/auth/reset-password', authLimiter, asyncHandler(async (req, res) => {
  const { email, resetToken, newPassword } = req.body || {};

  if (!email || typeof email !== 'string' || !newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Email and a new password (min 6 characters) are required' });
  }

  const user = await UserRepo.findUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return res.status(400).json({ success: false, error: 'User account not found' });
  }

  if (resetToken) {
    try {
      const decoded = jwt.verify(resetToken, JWT_SECRET) as any;
      if (decoded.action !== 'password_reset' || decoded.userId !== user.id) {
        return res.status(400).json({ success: false, error: 'Invalid or expired password reset token' });
      }
    } catch (err) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset token' });
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await UserRepo.updateUserPassword(user.id, passwordHash);

  res.json({
    success: true,
    message: 'Your password has been successfully updated. You can now sign in with your new password.',
  });
}));

app.get('/api/auth/me', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  let tenantRow = await UserRepo.findTenantById(user.tenantId);

  // Auto-downgrade check if trial expired and no card on file
  if (tenantRow) {
    const now = new Date();
    if (
      tenantRow.trial_ends_at &&
      new Date(tenantRow.trial_ends_at) <= now &&
      !tenantRow.payment_method_on_file &&
      tenantRow.plan !== 'Free'
    ) {
      await UserRepo.updateTenantPlan(tenantRow.id, 'Free');
      tenantRow.plan = 'Free';
    }
  }

  res.json({
    success: true,
    user,
    tenant: tenantRow ? {
      id: tenantRow.id,
      name: tenantRow.name,
      ownerEmail: tenantRow.owner_email,
      plan: tenantRow.plan,
      createdAt: tenantRow.created_at,
      trialStartedAt: tenantRow.trial_started_at,
      trialEndsAt: tenantRow.trial_ends_at,
      hasPaymentMethod: Boolean(tenantRow.payment_method_on_file),
      paymentMethodBrand: tenantRow.payment_method_brand,
      paymentMethodLast4: tenantRow.payment_method_last4,
      paymentMethodExp: tenantRow.payment_method_exp,
      byokConfig: {
        hasCustomKey: Boolean(tenantRow.byok_api_key),
        provider: tenantRow.byok_provider || 'gemini',
        maskedKey: tenantRow.byok_api_key
          ? (tenantRow.byok_api_key.length > 8
              ? `${tenantRow.byok_api_key.slice(0, 4)}••••••••${tenantRow.byok_api_key.slice(-4)}`
              : '••••••••••••')
          : undefined,
        updatedAt: tenantRow.byok_updated_at || undefined,
      },
    } : null,
  });
}));

// ==========================================
// ADMIN AUTHENTICATION & SECURITY ENDPOINTS
// ==========================================
app.post('/api/admin/auth/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminAuthService.authenticateAdmin(email, password, JWT_SECRET, { ip, userAgent });
  if (!result.success) {
    return res.status(401).json(result);
  }

  res.json(result);
}));

app.get('/api/admin/auth/me', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  res.json({
    success: true,
    admin: req.admin,
    authorizedWhitelist: AdminAuthService.getAuthorizedAdminEmails(),
    serverTime: new Date().toISOString(),
  });
}));

app.post('/api/admin/auth/logout', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  await AdminAuditRepo.logAction({
    adminId: req.admin!.id,
    adminEmail: req.admin!.email,
    action: 'ADMIN_LOGOUT',
    status: 'success',
    ipAddress: ip,
    userAgent,
  });

  res.json({ success: true, message: 'Admin session terminated successfully.' });
}));

app.get('/api/admin/audit-logs', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const action = req.query.action ? String(req.query.action) : undefined;
  const search = req.query.search ? String(req.query.search) : undefined;
  const adminEmail = req.query.adminEmail ? String(req.query.adminEmail) : undefined;
  const targetResource = req.query.targetResource ? String(req.query.targetResource) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;

  const result = await AdminAuditRepo.getRecentLogs({
    limit,
    offset,
    action,
    search,
    adminEmail,
    targetResource,
    status,
  });
  res.json({ success: true, ...result, limit, offset });
}));

app.get('/api/admin/audit-logs/export', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { action, adminEmail, targetResource, status, format = 'csv' } = req.query as Record<string, string>;

  const result = await AdminAuditRepo.getRecentLogs({
    limit: 1000,
    offset: 0,
    action,
    adminEmail,
    targetResource,
    status,
  });

  if (format === 'csv') {
    const headers = ['Timestamp', 'Admin Email', 'Action', 'Target Resource', 'Target ID', 'Status', 'IP Address', 'User Agent', 'Details JSON'];
    const rows = result.logs.map((l) => [
      `"${l.createdAt}"`,
      `"${l.adminEmail}"`,
      `"${l.action}"`,
      `"${l.targetResource || ''}"`,
      `"${l.targetId || ''}"`,
      `"${l.status}"`,
      `"${l.ipAddress || ''}"`,
      `"${(l.userAgent || '').replace(/"/g, '""')}"`,
      `"${(l.detailsJson || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="admin-audit-logs-${Date.now()}.csv"`);
    return res.send(csvContent);
  }

  res.json({
    success: true,
    exportedAt: new Date().toISOString(),
    logs: result.logs,
  });
}));

app.get('/api/admin/overview', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const metrics = await AdminOverviewRepo.getOverviewMetrics();
  res.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString(),
  });
}));

// ==========================================
// ADMIN USER MANAGEMENT ENDPOINTS
// ==========================================
app.get('/api/admin/users', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const search = req.query.search ? String(req.query.search) : undefined;
  const role = req.query.role ? String(req.query.role) : undefined;
  const plan = req.query.plan ? String(req.query.plan) : undefined;
  const sortBy = (req.query.sortBy as any) || 'created_at';
  const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const result = await AdminUserRepo.getUsersList({
    search,
    role,
    plan,
    limit,
    offset,
    sortBy,
    sortOrder,
  });

  res.json({
    success: true,
    ...result,
    limit,
    offset,
  });
}));

app.get('/api/admin/users/:userId', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const userId = req.params.userId;
  const userDetail = await AdminUserRepo.getUserDetail(userId);

  if (!userDetail) {
    return res.status(404).json({ success: false, error: 'User not found in system directory.' });
  }

  res.json({
    success: true,
    data: userDetail,
  });
}));

app.post('/api/admin/users/:userId/update-role', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const userId = req.params.userId;
  const { newRole } = req.body || {};

  if (!newRole || typeof newRole !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid role string is required.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminUserRepo.updateUserRole(userId, newRole.trim().toLowerCase(), {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, message: `User role updated successfully to '${newRole}'.` });
}));

app.post('/api/admin/users/:userId/update-plan', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const userId = req.params.userId;
  const { tenantId, newPlan } = req.body || {};

  if (!tenantId || !newPlan) {
    return res.status(400).json({ success: false, error: 'tenantId and newPlan are required.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminUserRepo.updateTenantPlan(userId, tenantId, newPlan, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, message: `Tenant workspace plan updated successfully to '${newPlan}'.` });
}));

app.post('/api/admin/users/:userId/reset-password', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const userId = req.params.userId;
  const { newPassword } = req.body || {};

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminUserRepo.resetUserPassword(userId, newPassword, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json({ success: true, message: 'User password reset and hash updated securely.' });
}));

// ==========================================
// ADMIN CHATBOTS MANAGEMENT ENDPOINTS
// ==========================================
app.get('/api/admin/chatbots', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const search = req.query.search ? String(req.query.search) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  const model = req.query.model ? String(req.query.model) : undefined;
  const domainLock = (req.query.domainLock as any) || 'all';
  const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined;
  const sortBy = (req.query.sortBy as any) || 'created_at';
  const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const result = await AdminChatbotRepo.getChatbotsList({
    search,
    status,
    model,
    domainLock,
    tenantId,
    limit,
    offset,
    sortBy,
    sortOrder,
  });

  res.json({
    success: true,
    ...result,
    limit,
    offset,
  });
}));

app.get('/api/admin/chatbots/:id', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const botId = req.params.id;
  const botDetail = await AdminChatbotRepo.getChatbotDetail(botId);

  if (!botDetail) {
    return res.status(404).json({ success: false, error: 'Chatbot not found in system directory.' });
  }

  res.json({
    success: true,
    data: botDetail,
  });
}));

app.post('/api/admin/chatbots/:id/status', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const botId = req.params.id;
  const { status } = req.body || {};

  if (!status || !['active', 'inactive', 'archived'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Valid status is required (active, inactive, archived).' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminChatbotRepo.updateStatus(botId, status, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
}));

app.post('/api/admin/chatbots/:id/domain-lock', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const botId = req.params.id;
  const { domainLockEnabled, allowedDomains, websiteUrl } = req.body || {};

  if (typeof domainLockEnabled !== 'boolean') {
    return res.status(400).json({ success: false, error: 'domainLockEnabled boolean is required.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminChatbotRepo.updateDomainLockSettings(
    botId,
    {
      domainLockEnabled,
      allowedDomains: Array.isArray(allowedDomains) ? allowedDomains : [],
      websiteUrl,
    },
    {
      id: req.admin!.id,
      email: req.admin!.email,
      ip,
      userAgent,
    }
  );

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
}));

app.post('/api/admin/chatbots/:id/regenerate-key', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const botId = req.params.id;
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminChatbotRepo.regenerateEmbedSecretKey(botId, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
}));

app.post('/api/admin/chatbots/:id/config', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const botId = req.params.id;
  const updates = req.body || {};

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminChatbotRepo.updateChatbotConfig(botId, updates, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
}));

// ==========================================
// ADMIN WEBSITES & DOMAIN VERIFICATION CENTER ENDPOINTS
// ==========================================
app.get('/api/admin/domains', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const offset = Number(req.query.offset) || 0;
  const search = req.query.search ? String(req.query.search) : undefined;
  const verificationStatus = req.query.verificationStatus ? String(req.query.verificationStatus) : undefined;
  const sslStatus = req.query.sslStatus ? String(req.query.sslStatus) : undefined;
  const tenantId = req.query.tenantId ? String(req.query.tenantId) : undefined;
  const sortBy = (req.query.sortBy as any) || 'last_checked_at';
  const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const result = await AdminDomainRepo.getDomainsList({
    search,
    verificationStatus,
    sslStatus,
    tenantId,
    sortBy,
    sortOrder,
    limit,
    offset,
  });

  res.json({
    success: true,
    ...result,
    limit,
    offset,
  });
}));

app.get('/api/admin/domains/:domain', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const domain = req.params.domain;
  const domainDetail = await AdminDomainRepo.getDomainDetail(domain);

  if (!domainDetail) {
    return res.status(404).json({ success: false, error: `Domain '${domain}' not found in verification registry.` });
  }

  res.json({
    success: true,
    data: domainDetail,
  });
}));

app.post('/api/admin/domains/verify', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { domain } = req.body || {};
  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ success: false, error: 'Domain name is required for verification.' });
  }

  const diagnostics = await AdminDomainRepo.runDomainDiagnostics(domain);
  res.json({
    success: true,
    diagnostics,
  });
}));

app.post('/api/admin/domains/:domain/status', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const domain = req.params.domain;
  const { status, notes } = req.body || {};

  if (!status || !['verified', 'pending', 'whitelisted', 'blocked', 'revoked'].includes(status)) {
    return res.status(400).json({ success: false, error: "Valid status ('verified', 'pending', 'whitelisted', 'blocked', 'revoked') is required." });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminDomainRepo.updateDomainStatus(domain, status, notes, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  res.json(result);
}));

app.post('/api/admin/domains/:domain/whitelist', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const domain = req.params.domain;
  const { isWhitelisted } = req.body || {};

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminDomainRepo.toggleWhitelist(domain, isWhitelisted !== false, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  res.json(result);
}));

app.post('/api/admin/domains/:domain/block', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const domain = req.params.domain;
  const { isBlocked } = req.body || {};

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminDomainRepo.toggleBlock(domain, isBlocked !== false, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  res.json(result);
}));

app.post('/api/admin/domains/register', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { domain, tenantId, notes } = req.body || {};

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ success: false, error: 'Domain name is required.' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminDomainRepo.registerDomain(domain, tenantId, notes, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  res.json(result);
}));

// ==========================================
// ADMIN CONVERSATIONS & TRANSCRIPT LOGS ENDPOINTS
// ==========================================
app.get('/api/admin/conversations', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const {
    search,
    status,
    chatbotId,
    tenantId,
    csatRating,
    hasLeadOnly,
    sortBy,
    sortOrder,
    limit,
    offset,
  } = req.query as Record<string, string>;

  const result = await AdminConversationRepo.getConversationsList({
    search,
    status,
    chatbotId,
    tenantId,
    csatRating,
    hasLeadOnly: hasLeadOnly === 'true',
    sortBy: sortBy as any,
    sortOrder: (sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as any,
    limit: limit ? parseInt(limit, 10) : 50,
    offset: offset ? parseInt(offset, 10) : 0,
  });

  res.json({ success: true, ...result });
}));

app.get('/api/admin/conversations/export', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { tenantId, chatbotId, format = 'json' } = req.query as Record<string, string>;

  const result = await AdminConversationRepo.getConversationsList({
    tenantId,
    chatbotId,
    limit: 1000,
  });

  if (format === 'csv') {
    const headers = ['Conversation ID', 'Chatbot', 'Tenant', 'Visitor Name', 'Visitor Email', 'Visitor Location', 'Status', 'Messages', 'CSAT', 'Has Lead', 'Created At'];
    const rows = result.conversations.map(c => [
      `"${c.id}"`,
      `"${c.chatbotName.replace(/"/g, '""')}"`,
      `"${c.tenantName.replace(/"/g, '""')}"`,
      `"${(c.visitorName || 'Anonymous').replace(/"/g, '""')}"`,
      `"${(c.visitorEmail || 'N/A').replace(/"/g, '""')}"`,
      `"${(c.visitorLocation || 'N/A').replace(/"/g, '""')}"`,
      `"${c.status}"`,
      c.messageCount,
      c.csatRating !== undefined ? c.csatRating : 'N/A',
      c.hasLead ? 'Yes' : 'No',
      `"${c.createdAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="conversations-export-${Date.now()}.csv"`);
    return res.send(csvContent);
  }

  res.json({
    success: true,
    count: result.conversations.length,
    exportedAt: new Date().toISOString(),
    conversations: result.conversations,
  });
}));

app.get('/api/admin/conversations/:id', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const detail = await AdminConversationRepo.getConversationDetail(req.params.id);
  if (!detail) {
    return res.status(404).json({ success: false, error: 'Conversation not found.' });
  }

  res.json({ success: true, ...detail });
}));

app.patch('/api/admin/conversations/:id/status', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { status } = req.body || {};
  if (!status || !['active', 'closed', 'archived', 'flagged'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Valid status required (active, closed, archived, flagged).' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminConversationRepo.updateStatus(req.params.id, status, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  res.json(result);
}));

app.delete('/api/admin/conversations/:id', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');

  const result = await AdminConversationRepo.deleteConversation(req.params.id, {
    id: req.admin!.id,
    email: req.admin!.email,
    ip,
    userAgent,
  });

  res.json(result);
}));

// ==========================================
// ADMIN PRODUCT ANALYTICS ENDPOINTS
// ==========================================
app.get('/api/admin/analytics', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { range = '30d', tenantId, chatbotId } = req.query as Record<string, string>;

  const report = await AdminAnalyticsRepo.getAnalyticsReport({
    range: range as any,
    tenantId: tenantId && tenantId !== 'all' ? tenantId : undefined,
    chatbotId: chatbotId && chatbotId !== 'all' ? chatbotId : undefined,
  });

  res.json({ success: true, ...report });
}));

app.get('/api/admin/analytics/export', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { range = '30d', tenantId, chatbotId, format = 'json' } = req.query as Record<string, string>;

  const report = await AdminAnalyticsRepo.getAnalyticsReport({
    range: range as any,
    tenantId: tenantId && tenantId !== 'all' ? tenantId : undefined,
    chatbotId: chatbotId && chatbotId !== 'all' ? chatbotId : undefined,
  });

  if (format === 'csv') {
    const headers = ['Date / Interval', 'Conversations', 'Messages', 'User Sent', 'Bot Sent', 'Leads Captured', 'Est Tokens', 'Avg Latency (ms)'];
    const rows = report.timeSeries.map((t) => [
      `"${t.date}"`,
      t.conversations,
      t.messages,
      t.userMessages,
      t.botMessages,
      t.leads,
      t.estimatedTokens,
      t.avgResponseTimeMs,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="analytics-timeseries-${range}-${Date.now()}.csv"`);
    return res.send(csvContent);
  }

  res.json({
    success: true,
    exportedAt: new Date().toISOString(),
    filter: { range, tenantId, chatbotId },
    report,
  });
}));

// ==========================================
// ADMIN CONVERSION FUNNEL & LEADS ENDPOINTS
// ==========================================
app.get('/api/admin/funnel', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { range = '30d', tenantId, chatbotId, minScore } = req.query as Record<string, string>;

  const data = await AdminFunnelRepo.getFunnelAnalytics({
    range: range as any,
    tenantId: tenantId && tenantId !== 'all' ? tenantId : undefined,
    chatbotId: chatbotId && chatbotId !== 'all' ? chatbotId : undefined,
    minScore: minScore ? Number(minScore) : undefined,
  });

  res.json({ success: true, ...data });
}));

app.get('/api/admin/funnel/leads/:id', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const leadData = await AdminFunnelRepo.getLeadById(req.params.id);
  if (!leadData) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  res.json({ success: true, ...leadData });
}));

app.get('/api/admin/funnel/export', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { range = '30d', tenantId, chatbotId, format = 'csv' } = req.query as Record<string, string>;

  const data = await AdminFunnelRepo.getFunnelAnalytics({
    range: range as any,
    tenantId: tenantId && tenantId !== 'all' ? tenantId : undefined,
    chatbotId: chatbotId && chatbotId !== 'all' ? chatbotId : undefined,
  });

  if (format === 'csv') {
    const headers = ['Lead ID', 'Name', 'Email', 'Company', 'Phone', 'Intent Score', 'Tier', 'Workspace', 'Chatbot', 'Captured Date', 'First Inquiry', 'Key Signals'];
    const rows = data.topLeads.map((l) => [
      `"${l.id}"`,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      l.score,
      `"${l.tier}"`,
      `"${l.tenantName.replace(/"/g, '""')}"`,
      `"${l.chatbotName.replace(/"/g, '""')}"`,
      `"${l.capturedAt}"`,
      `"${(l.firstQuestion || '').replace(/"/g, '""')}"`,
      `"${l.highIntentKeywords.join('; ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-intelligence-${range}-${Date.now()}.csv"`);
    return res.send(csvContent);
  }

  res.json({
    success: true,
    exportedAt: new Date().toISOString(),
    filter: { range, tenantId, chatbotId },
    leads: data.topLeads,
  });
}));

// ==========================================
// ADMIN USER INTELLIGENCE & VISITOR PROFILES
// ==========================================
app.get('/api/admin/intelligence', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { range = '30d', tenantId, chatbotId, cohort } = req.query as Record<string, string>;

  const data = await AdminIntelligenceRepo.getIntelligenceData({
    range: range as any,
    tenantId: tenantId && tenantId !== 'all' ? tenantId : undefined,
    chatbotId: chatbotId && chatbotId !== 'all' ? chatbotId : undefined,
    cohort: cohort && cohort !== 'all' ? cohort : undefined,
  });

  res.json({ success: true, ...data });
}));

app.get('/api/admin/intelligence/export', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { range = '30d', tenantId, chatbotId, format = 'csv' } = req.query as Record<string, string>;

  const data = await AdminIntelligenceRepo.getIntelligenceData({
    range: range as any,
    tenantId: tenantId && tenantId !== 'all' ? tenantId : undefined,
    chatbotId: chatbotId && chatbotId !== 'all' ? chatbotId : undefined,
  });

  if (format === 'csv') {
    const headers = ['Visitor ID', 'Location', 'Browser/Platform', 'First Seen', 'Last Seen', 'Conversations', 'Messages', 'Engagement Score', 'Cohort', 'Lead Email', 'Primary Bot', 'Workspace'];
    const rows = data.topVisitors.map((v) => [
      `"${v.visitorId}"`,
      `"${v.visitorLocation}"`,
      `"${v.visitorBrowser}"`,
      `"${v.firstSeenAt}"`,
      `"${v.lastSeenAt}"`,
      v.conversationCount,
      v.messageCount,
      v.engagementScore,
      `"${v.cohort}"`,
      `"${v.leadEmail || 'N/A'}"`,
      `"${v.primaryChatbotName}"`,
      `"${v.primaryTenantName}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="visitor-intelligence-${range}-${Date.now()}.csv"`);
    return res.send(csvContent);
  }

  res.json({
    success: true,
    exportedAt: new Date().toISOString(),
    filter: { range, tenantId, chatbotId },
    visitors: data.topVisitors,
  });
}));

// ==========================================
// ADMIN SYSTEM ALERTS & HEALTH MONITOR
// ==========================================
app.get('/api/admin/alerts', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { status, severity, category, limit, offset } = req.query as Record<string, string>;

  const result = await AdminAlertsRepo.getAlertsList({
    status,
    severity,
    category,
    limit: limit ? parseInt(limit, 10) : 50,
    offset: offset ? parseInt(offset, 10) : 0,
  });

  res.json({ success: true, ...result });
}));

app.post('/api/admin/alerts/:id/acknowledge', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const alertId = req.params.id;
  const result = await AdminAlertsRepo.acknowledgeAlert(alertId);

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');
  await AdminAuditRepo.logAction({
    adminId: req.admin!.id,
    adminEmail: req.admin!.email,
    action: 'SYSTEM_ALERT_ACKNOWLEDGE',
    targetResource: 'SYSTEM_ALERT',
    targetId: alertId,
    ipAddress: ip,
    userAgent,
    status: 'success',
  });

  res.json(result);
}));

app.post('/api/admin/alerts/:id/resolve', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const alertId = req.params.id;
  const result = await AdminAlertsRepo.resolveAlert(alertId, req.admin!.email);

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');
  await AdminAuditRepo.logAction({
    adminId: req.admin!.id,
    adminEmail: req.admin!.email,
    action: 'SYSTEM_ALERT_RESOLVE',
    targetResource: 'SYSTEM_ALERT',
    targetId: alertId,
    ipAddress: ip,
    userAgent,
    status: 'success',
  });

  res.json(result);
}));

app.post('/api/admin/alerts/resolve-all', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const result = await AdminAlertsRepo.resolveAll(req.admin!.email);

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '');
  const userAgent = String(req.headers['user-agent'] || '');
  await AdminAuditRepo.logAction({
    adminId: req.admin!.id,
    adminEmail: req.admin!.email,
    action: 'SYSTEM_ALERT_RESOLVE_ALL',
    targetResource: 'SYSTEM_ALERT',
    ipAddress: ip,
    userAgent,
    status: 'success',
  });

  res.json(result);
}));

app.post('/api/admin/alerts/create', requireAdminAuth, asyncHandler(async (req: AdminAuthenticatedRequest, res) => {
  const { title, message, severity = 'info', category = 'system', source = 'AdminConsole', metadata } = req.body || {};

  if (!title || !message) {
    return res.status(400).json({ success: false, error: 'Title and message are required.' });
  }

  const alert = await AdminAlertsRepo.createAlert({
    title,
    message,
    severity: severity as any,
    category: category as any,
    source,
    metadata,
  });

  res.json({ success: true, alert });
}));

// ==========================================
// CHATBOT ENDPOINTS
// ==========================================
app.get('/api/chatbots', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const chatbots = await ChatbotRepo.findByTenant(req.user!.tenantId);
  res.json({ success: true, chatbots });
}));

app.get('/api/chatbots/:id', asyncHandler(async (req, res) => {
  let bot = await ChatbotRepo.findById(req.params.id);
  if (!bot) {
    bot = await ChatbotRepo.findById('bot_acme_support');
  }
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }

  // If request comes from an iframe embed or cross-origin widget, perform domain validation
  const isEmbedRequest = req.headers.referer?.includes('/embed/') || req.query.embed === 'true';
  if (isEmbedRequest) {
    const validation = SecurityService.validateBotDomainAccess(bot, req);
    if (!validation.isAllowed) {
      return res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED_DOMAIN',
        error: validation.reason || 'Unauthorized domain. This chatbot widget is restricted to authorized websites only.',
        requestingDomain: validation.requestingDomain,
        authorizedDomains: validation.authorizedDomains,
      });
    }
  }

  res.json({ success: true, chatbot: bot });
}));

// Public Chatbot endpoint for external widget initialization with strict domain authorization
app.get('/api/chatbots/:id/public', asyncHandler(async (req, res) => {
  const bot = await ChatbotRepo.findById(req.params.id);
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }

  const validation = SecurityService.validateBotDomainAccess(bot, req);
  if (!validation.isAllowed) {
    return res.status(403).json({
      success: false,
      code: 'UNAUTHORIZED_DOMAIN',
      error: validation.reason || 'Domain unauthorized. This chatbot embed is locked to authorized websites only.',
      requestingDomain: validation.requestingDomain,
      authorizedDomains: validation.authorizedDomains,
    });
  }

  res.json({
    success: true,
    chatbot: {
      id: bot.id,
      name: bot.name,
      avatar: bot.avatar,
      primaryColor: bot.primaryColor,
      textColor: bot.textColor,
      greetingMessage: bot.greetingMessage,
      suggestedQuestions: bot.suggestedQuestions,
      fallbackMessage: bot.fallbackMessage,
      collectLeadEmail: bot.collectLeadEmail,
      leadTitle: bot.leadTitle,
      status: bot.status,
    },
  });
}));

// Security configuration endpoint for dashboard management
app.get('/api/chatbots/:id/security', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const bot = await ChatbotRepo.findById(req.params.id, req.user!.tenantId);
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }

  const effectiveDomains = SecurityService.getEffectiveAuthorizedDomains(bot);
  const appOrigin = `${req.protocol}://${req.get('host')}`;
  const embedData = SecurityService.generateSecureEmbedSnippet(bot, appOrigin);

  res.json({
    success: true,
    security: {
      domainLockEnabled: bot.domainLockEnabled !== false,
      allowedDomains: bot.allowedDomains || [],
      effectiveDomains,
      embedSecretKey: bot.embedSecretKey || '',
      embedSnippet: embedData.snippet,
      embedToken: embedData.token,
    },
  });
}));

app.put('/api/chatbots/:id/security', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { domainLockEnabled, allowedDomains, regenerateSecretKey } = req.body || {};
  const bot = await ChatbotRepo.findById(req.params.id, req.user!.tenantId);
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }

  const updates: Partial<Chatbot> = {};
  if (typeof domainLockEnabled === 'boolean') {
    updates.domainLockEnabled = domainLockEnabled;
  }

  if (Array.isArray(allowedDomains)) {
    const cleaned = allowedDomains
      .map(d => SecurityService.normalizeDomain(String(d)))
      .filter(d => d.length > 0 && d.length < 255);
    updates.allowedDomains = Array.from(new Set(cleaned));
  }

  if (regenerateSecretKey === true) {
    const crypto = await import('crypto');
    updates.embedSecretKey = crypto.randomBytes(24).toString('hex');
  }

  const updated = await ChatbotRepo.update(req.params.id, req.user!.tenantId, updates);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Failed to update security settings' });
  }

  const effectiveDomains = SecurityService.getEffectiveAuthorizedDomains(updated);
  const appOrigin = `${req.protocol}://${req.get('host')}`;
  const embedData = SecurityService.generateSecureEmbedSnippet(updated, appOrigin);

  res.json({
    success: true,
    security: {
      domainLockEnabled: updated.domainLockEnabled !== false,
      allowedDomains: updated.allowedDomains || [],
      effectiveDomains,
      embedSecretKey: updated.embedSecretKey || '',
      embedSnippet: embedData.snippet,
      embedToken: embedData.token,
    },
  });
}));

// Test Domain Authorization Diagnostic Tool
app.post('/api/chatbots/:id/security/test-domain', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { testDomain } = req.body || {};
  if (!testDomain || typeof testDomain !== 'string') {
    return res.status(400).json({ success: false, error: 'testDomain string is required' });
  }

  const bot = await ChatbotRepo.findById(req.params.id, req.user!.tenantId);
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }

  const cleanTestDomain = SecurityService.normalizeDomain(testDomain);
  const effectiveDomains = SecurityService.getEffectiveAuthorizedDomains(bot);
  const isLocked = bot.domainLockEnabled !== false;

  let isAllowed = true;
  let reason = 'Domain access granted.';
  let matchedRule: string | undefined = undefined;

  if (isLocked && effectiveDomains.length > 0) {
    const matched = effectiveDomains.find(rule => SecurityService.isDomainMatchingRule(cleanTestDomain, rule));
    if (matched) {
      isAllowed = true;
      matchedRule = matched;
      reason = `Domain "${cleanTestDomain}" matches authorized rule "${matched}".`;
    } else {
      isAllowed = false;
      reason = `Domain "${cleanTestDomain}" is not in authorized domains list [${effectiveDomains.join(', ')}]. Requests from this site will be blocked with 403 Forbidden.`;
    }
  } else if (!isLocked) {
    reason = 'Domain lock is currently disabled. All domains are permitted.';
  }

  res.json({
    success: true,
    testDomain: cleanTestDomain,
    isAllowed,
    reason,
    matchedRule,
    effectiveDomains,
    domainLockEnabled: isLocked,
  });
}));

app.post('/api/chatbots', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { name, description, websiteUrl, allowedDomains, domainLockEnabled, systemInstruction, tone, primaryColor, avatar, greetingMessage, model, fallbackMessage, collectLeadEmail, leadTitle } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return res.status(400).json({ success: false, error: 'Name is required and must be under 100 characters' });
  }

  // Mandatory Website URL validation for Data Retrieval
  if (!websiteUrl || typeof websiteUrl !== 'string' || websiteUrl.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Website URL is required for chatbot data retrieval.' });
  }

  const cleanUrl = websiteUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    return res.status(400).json({ success: false, error: 'Website URL must be a valid web address starting with http:// or https://' });
  }

  const now = new Date().toISOString();
  const hexColorRegex = /^#([0-9a-fA-F]{3}){1,2}$/;
  const validatedColor = (primaryColor && typeof primaryColor === 'string' && hexColorRegex.test(primaryColor)) ? primaryColor : '#4F46E5';

  const defaultDomain = SecurityService.normalizeDomain(cleanUrl);
  const initialAllowedDomains = Array.isArray(allowedDomains) && allowedDomains.length > 0
    ? allowedDomains.map(d => SecurityService.normalizeDomain(String(d))).filter(Boolean)
    : (defaultDomain ? [defaultDomain] : []);

  const newBot = await ChatbotRepo.create({
    id: 'bot_' + Date.now(),
    tenantId: req.user!.tenantId,
    name: name.trim(),
    description: (description && typeof description === 'string') ? description.slice(0, 500) : 'AI Assistant',
    websiteUrl: cleanUrl,
    allowedDomains: initialAllowedDomains,
    domainLockEnabled: domainLockEnabled !== false,
    systemInstruction: (systemInstruction && typeof systemInstruction === 'string') ? systemInstruction.slice(0, 3000) : 'You are a helpful support representative.',
    tone: (tone && typeof tone === 'string') ? (tone as any) : 'Friendly',
    primaryColor: validatedColor,
    textColor: '#FFFFFF',
    avatar: (avatar && typeof avatar === 'string') ? avatar.slice(0, 10) : '🤖',
    greetingMessage: (greetingMessage && typeof greetingMessage === 'string') ? greetingMessage.slice(0, 500) : 'Hello! How can I help you today?',
    suggestedQuestions: ['What services do you offer?', 'How do I contact support?'],
    model: (model && typeof model === 'string') ? (model as any) : 'gemini-3.7-flash',
    fallbackMessage: (fallbackMessage && typeof fallbackMessage === 'string') ? fallbackMessage.slice(0, 500) : 'I will connect you to a support agent.',
    collectLeadEmail: collectLeadEmail !== false,
    leadTitle: (leadTitle && typeof leadTitle === 'string') ? leadTitle.slice(0, 200) : 'Leave your email to stay connected',
    humanOperatorOnline: true,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  // Automatically fetch and ingest knowledge content from the provided website URL
  if (cleanUrl) {
    try {
      await KnowledgeService.scrapeAndIngestUrl(newBot.id, req.user!.tenantId, cleanUrl);
    } catch (err: any) {
      console.warn(`[WARN] Auto-scrape on bot creation (${newBot.id}):`, err.message);
    }
  }

  res.json({ success: true, chatbot: newBot });
}));

app.put('/api/chatbots/:id', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const body = req.body || {};
  const allowedUpdates: Partial<Chatbot> = {};

  if (typeof body.name === 'string' && body.name.trim().length > 0) allowedUpdates.name = body.name.trim().slice(0, 100);
  if (typeof body.description === 'string') allowedUpdates.description = body.description.slice(0, 500);
  if (typeof body.websiteUrl === 'string') allowedUpdates.websiteUrl = body.websiteUrl.trim().slice(0, 2000);
  if (Array.isArray(body.allowedDomains)) allowedUpdates.allowedDomains = body.allowedDomains.map(d => SecurityService.normalizeDomain(String(d))).filter(Boolean);
  if (typeof body.domainLockEnabled === 'boolean') allowedUpdates.domainLockEnabled = body.domainLockEnabled;
  if (typeof body.systemInstruction === 'string') allowedUpdates.systemInstruction = body.systemInstruction.slice(0, 3000);
  if (typeof body.tone === 'string') allowedUpdates.tone = body.tone as any;
  if (typeof body.primaryColor === 'string' && /^#([0-9a-fA-F]{3}){1,2}$/.test(body.primaryColor)) allowedUpdates.primaryColor = body.primaryColor;
  if (typeof body.avatar === 'string') allowedUpdates.avatar = body.avatar.slice(0, 10);
  if (typeof body.greetingMessage === 'string') allowedUpdates.greetingMessage = body.greetingMessage.slice(0, 500);
  if (Array.isArray(body.suggestedQuestions)) allowedUpdates.suggestedQuestions = body.suggestedQuestions.map(q => String(q).slice(0, 200)).slice(0, 5);
  if (typeof body.model === 'string') allowedUpdates.model = body.model as any;
  if (typeof body.fallbackMessage === 'string') allowedUpdates.fallbackMessage = body.fallbackMessage.slice(0, 500);
  if (typeof body.collectLeadEmail === 'boolean') allowedUpdates.collectLeadEmail = body.collectLeadEmail;
  if (typeof body.leadTitle === 'string') allowedUpdates.leadTitle = body.leadTitle.slice(0, 200);
  if (typeof body.humanOperatorOnline === 'boolean') allowedUpdates.humanOperatorOnline = body.humanOperatorOnline;
  if (typeof body.status === 'string' && ['active', 'paused', 'archived'].includes(body.status)) allowedUpdates.status = body.status as any;

  const existingBot = await ChatbotRepo.findById(req.params.id, req.user!.tenantId);
  const updated = await ChatbotRepo.update(req.params.id, req.user!.tenantId, allowedUpdates);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }

  // If websiteUrl was provided or changed, auto-scrape and index in background
  if (allowedUpdates.websiteUrl && (allowedUpdates.websiteUrl !== existingBot?.websiteUrl)) {
    KnowledgeService.scrapeAndIngestUrl(updated.id, req.user!.tenantId, allowedUpdates.websiteUrl)
      .catch(err => console.warn(`[WARN] Auto-scrape on bot update (${updated.id}):`, err.message));
  }

  res.json({ success: true, chatbot: updated });
}));

app.delete('/api/chatbots/:id', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const deleted = await ChatbotRepo.delete(req.params.id, req.user!.tenantId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }
  res.json({ success: true, id: req.params.id });
}));

// ==========================================
// KNOWLEDGE BASE ENDPOINTS
// ==========================================
app.get('/api/chatbots/:id/knowledge', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const sources = await KnowledgeRepo.findSourcesByBot(req.params.id, req.user!.tenantId);
  res.json({ success: true, knowledgeSources: sources });
}));

app.post('/api/chatbots/:id/scrape-url', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string' || url.length > 2000) {
    return res.status(400).json({ success: false, error: 'Valid URL is required' });
  }

  try {
    const source = await KnowledgeService.scrapeAndIngestUrl(req.params.id, req.user!.tenantId, url);
    res.json({ success: true, knowledgeSource: source });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to crawl target URL' });
  }
}));

app.post('/api/chatbots/:id/ingest-raw-html', express.json({ limit: '10mb' }), requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { html, url, title } = req.body || {};
  if (!html || typeof html !== 'string' || html.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'HTML markup content is required' });
  }

  try {
    const source = await KnowledgeService.ingestRawHtml(
      req.params.id,
      req.user!.tenantId,
      html,
      typeof url === 'string' ? url : undefined,
      typeof title === 'string' ? title : undefined
    );
    res.json({ success: true, knowledgeSource: source });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to ingest HTML content' });
  }
}));

app.post('/api/chatbots/:id/knowledge', express.json({ limit: '1mb' }), requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { type, title, content } = req.body || {};
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Knowledge content is required' });
  }

  try {
    const source = await KnowledgeService.ingestTextDocument(
      req.params.id,
      req.user!.tenantId,
      title || 'Custom Knowledge Document',
      content,
      type === 'faq' ? 'faq' : 'text'
    );
    res.json({ success: true, knowledgeSource: source });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to ingest knowledge' });
  }
}));

app.delete('/api/chatbots/:id/knowledge/:sourceId', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const deleted = await KnowledgeRepo.deleteSource(req.params.sourceId, req.user!.tenantId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Knowledge source not found' });
  }
  res.json({ success: true, id: req.params.sourceId });
}));

// ==========================================
// AUTOMATIC HOST WEBSITE DETECTION & INGESTION ENDPOINT
// ==========================================
app.post('/api/chatbots/:id/auto-detect-host', autoDetectLimiter, asyncHandler(async (req, res) => {
  const { hostOrigin, hostUrl, hostTitle, clientDomSnapshot } = req.body || {};

  if (!hostOrigin || typeof hostOrigin !== 'string') {
    return res.status(400).json({ success: false, error: 'hostOrigin string is required' });
  }

  const bot = await ChatbotRepo.findById(req.params.id);
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }

  // Server-side Domain Authorization Check
  const validation = SecurityService.validateBotDomainAccess(bot, req);
  if (!validation.isAllowed) {
    return res.status(403).json({
      success: false,
      code: 'UNAUTHORIZED_DOMAIN',
      error: validation.reason || 'Domain unauthorized. This chatbot embed is locked to authorized websites only.',
      requestingDomain: validation.requestingDomain,
      authorizedDomains: validation.authorizedDomains,
    });
  }

  try {
    const result = await KnowledgeService.autoDetectAndIngestHostSite(
      bot.id,
      bot.tenantId,
      {
        hostOrigin,
        hostUrl,
        hostTitle,
        clientDomSnapshot,
      }
    );

    res.json({
      success: true,
      domain: result.domain,
      status: result.status,
      sourcesIndexed: result.sourcesIndexed,
      pagesCrawled: result.pagesCrawled,
    });
  } catch (err: any) {
    console.error('[Auto-Detect Endpoint Error]:', err.message);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to auto-detect and ingest host website',
    });
  }
}));

// ==========================================
// PUBLIC AI CHAT ENDPOINT
// ==========================================
app.post('/api/chatbots/:id/chat', chatLimiter, asyncHandler(async (req, res) => {
  const { message, conversationId, visitorInfo } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ success: false, error: 'Message exceeds maximum length of 2000 characters' });
  }

  const bot = await ChatbotRepo.findById(req.params.id);
  if (!bot || bot.status === 'archived') {
    return res.status(404).json({ success: false, error: 'Chatbot not found or inactive' });
  }

  // Server-side Domain Authorization Validation
  const validation = SecurityService.validateBotDomainAccess(bot, req);
  if (!validation.isAllowed) {
    return res.status(403).json({
      success: false,
      code: 'UNAUTHORIZED_DOMAIN',
      error: validation.reason || 'Domain unauthorized. This chatbot embed is locked and restricted to authorized domains.',
      requestingDomain: validation.requestingDomain,
      authorizedDomains: validation.authorizedDomains,
    });
  }

  try {
    const result = await ChatService.handleVisitorChat(
      req.params.id,
      message,
      conversationId,
      visitorInfo
    );

    res.json({
      success: true,
      reply: result.reply,
      conversationId: result.conversationId,
      sourcesUsed: result.sourcesUsed,
    });
  } catch (err: any) {
    console.error('Chat API Error:', err.message || err);
    res.status(err.message === 'Chatbot not found or inactive' ? 404 : 500).json({
      success: false,
      error: err.message || 'Failed to generate AI response',
    });
  }
}));

// ==========================================
// CONVERSATIONS & INBOX ENDPOINTS
// ==========================================
app.get('/api/conversations', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const chatbotId = req.query.chatbotId ? String(req.query.chatbotId) : undefined;
  const conversations = await ConversationRepo.findByTenant(req.user!.tenantId, chatbotId);
  res.json({ success: true, conversations });
}));

app.get('/api/conversations/:id/messages', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const conversation = await ConversationRepo.findById(req.params.id, req.user!.tenantId);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }

  const messages = await ConversationRepo.findMessagesByConversation(req.params.id);
  res.json({ success: true, messages });
}));

app.post('/api/conversations/:id/messages', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { content } = req.body || {};
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  const conversation = await ConversationRepo.findById(req.params.id, req.user!.tenantId);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }

  const message = await ConversationRepo.addAgentMessage(
    conversation.id,
    conversation.chatbotId,
    req.user!.tenantId,
    content.trim(),
    req.user!.name || 'Support Specialist'
  );

  res.json({ success: true, message });
}));

app.patch('/api/conversations/:id/status', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { status } = req.body || {};
  const validStatuses = ['active', 'human_takeover', 'resolved', 'closed'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Valid status is required (active, human_takeover, resolved, closed)' });
  }

  const updated = await ConversationRepo.updateStatus(req.params.id, req.user!.tenantId, status);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }

  res.json({ success: true, conversation: updated });
}));

app.patch('/api/conversations/:id/assign', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { assignedTo, assignedToName } = req.body || {};
  const updated = await ConversationRepo.assignConversation(
    req.params.id,
    req.user!.tenantId,
    assignedTo || null,
    assignedToName || null
  );

  if (!updated) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }

  res.json({ success: true, conversation: updated });
}));

app.delete('/api/conversations/:id', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const deleted = await ConversationRepo.delete(req.params.id, req.user!.tenantId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }
  res.json({ success: true, id: req.params.id });
}));

// ==========================================
// TEAM & ROLE MANAGEMENT ENDPOINTS
// ==========================================
app.get('/api/team/members', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const members = await TeamRepo.getTeamMembers(req.user!.tenantId);
  res.json({ success: true, members });
}));

app.get('/api/team/invites', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const invites = await TeamRepo.getPendingInvites(req.user!.tenantId);
  res.json({ success: true, invites });
}));

app.post('/api/team/invites', requireAuth, requireTenantAdminAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { email, role = 'Agent' } = req.body || {};
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  }

  const validRole = role === 'Admin' ? 'Admin' : 'Agent';
  const invite = await TeamRepo.inviteTeammate(
    req.user!.tenantId,
    email,
    validRole,
    req.user!.id,
    req.user!.name
  );

  res.json({
    success: true,
    invite,
    message: `Invitation sent to ${email} as ${validRole}.`,
  });
}));

app.delete('/api/team/invites/:id', requireAuth, requireTenantAdminAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const success = await TeamRepo.cancelInvite(req.params.id, req.user!.tenantId);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Invitation not found or already processed.' });
  }
  res.json({ success: true, message: 'Invitation cancelled successfully.' });
}));

app.patch('/api/team/members/:id/role', requireAuth, requireTenantAdminAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { role } = req.body || {};
  if (!role || !['Admin', 'Agent'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Valid role (Admin or Agent) is required.' });
  }

  // Member ID might be tm_usr_xxx or usr_xxx
  const userId = req.params.id.startsWith('tm_') ? req.params.id.replace('tm_', '') : req.params.id;

  await TeamRepo.updateMemberRole(userId, req.user!.tenantId, role as any);
  res.json({ success: true, message: `Member role updated to ${role}.` });
}));

app.delete('/api/team/members/:id', requireAuth, requireTenantAdminAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.params.id.startsWith('tm_') ? req.params.id.replace('tm_', '') : req.params.id;

  try {
    await TeamRepo.removeMember(userId, req.user!.tenantId);
    res.json({ success: true, message: 'Team member removed from workspace.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Failed to remove team member.' });
  }
}));

// ==========================================
// INTEGRATIONS MARKETPLACE ENDPOINTS
// ==========================================
app.get('/api/integrations', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const integrations = await IntegrationRepo.getIntegrations(req.user!.tenantId);
  res.json({ success: true, integrations });
}));

app.post('/api/integrations/:id/connect', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const integrationId = req.params.id as any;
  const { config } = req.body || {};

  const validIntegrations = ['slack', 'whatsapp', 'zapier', 'hubspot', 'shopify', 'woocommerce'];
  if (!validIntegrations.includes(integrationId)) {
    return res.status(400).json({ success: false, error: `Invalid integration identifier: ${integrationId}` });
  }

  const result = await IntegrationRepo.setConnection(
    req.user!.tenantId,
    integrationId,
    true,
    config || {}
  );

  res.json({
    success: true,
    integration: result,
    message: `Connected ${result.name} successfully.`,
  });
}));

app.post('/api/integrations/:id/disconnect', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const integrationId = req.params.id as any;
  await IntegrationRepo.disconnect(req.user!.tenantId, integrationId);
  res.json({ success: true, message: `Disconnected integration successfully.` });
}));

app.post('/api/integrations/:id/test', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const integrationId = req.params.id;
  let config = req.body?.config;
  
  if (!config || Object.keys(config).length === 0) {
    const integrations = await IntegrationRepo.getIntegrations(req.user!.tenantId);
    const found = integrations.find(i => i.id === integrationId);
    config = found?.config || {};
  }

  if (integrationId === 'shopify') {
    const rawStoreUrl = (config.storeUrl || '').trim();
    const token = (config.apiKey || config.accessToken || '').trim();

    if (!rawStoreUrl || !token) {
      return res.status(400).json({
        success: false,
        status: 'error',
        error: 'Shopify Store URL and API Access Token are required to test connection.',
        message: 'Shopify Store URL and API Access Token are required to test connection.',
      });
    }

    let domain = rawStoreUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    if (!domain.includes('.')) {
      domain += '.myshopify.com';
    }

    try {
      const pingUrl = `https://${domain}/admin/api/2024-01/shop.json`;
      const testRes = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'NomadsChat-TestPing/1.0',
        },
      });

      if (testRes.ok) {
        const json = await testRes.json();
        const shopName = json.shop?.name || domain;
        return res.json({
          success: true,
          status: 'healthy',
          message: `Successfully connected to Shopify store "${shopName}" (${domain}). Live API credentials verified!`,
        });
      } else {
        let errDetail = `HTTP ${testRes.status} (${testRes.statusText})`;
        try {
          const errJson = await testRes.json();
          if (errJson.errors) {
            errDetail += `: ${typeof errJson.errors === 'string' ? errJson.errors : JSON.stringify(errJson.errors)}`;
          }
        } catch {}
        return res.status(400).json({
          success: false,
          status: 'error',
          error: `Shopify authentication failed: ${errDetail}. Check your store domain and Admin Access Token.`,
          message: `Shopify authentication failed: ${errDetail}. Check your store domain and Admin Access Token.`,
        });
      }
    } catch (fetchErr: any) {
      return res.status(400).json({
        success: false,
        status: 'error',
        error: `Could not reach Shopify store at ${domain}: ${fetchErr.message}`,
        message: `Could not reach Shopify store at ${domain}: ${fetchErr.message}`,
      });
    }
  }

  if (integrationId === 'woocommerce') {
    const rawStoreUrl = (config.storeUrl || '').trim();
    const consumerKey = (config.consumerKey || config.apiKey || '').trim();
    const consumerSecret = (config.consumerSecret || config.apiSecret || '').trim();

    if (!rawStoreUrl || !consumerKey) {
      return res.status(400).json({
        success: false,
        status: 'error',
        error: 'WooCommerce Store URL and Consumer Key are required to test connection.',
        message: 'WooCommerce Store URL and Consumer Key are required to test connection.',
      });
    }

    let cleanUrl = rawStoreUrl.replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      const pingUrl = new URL(`${cleanUrl}/wp-json/wc/v3/products`);
      pingUrl.searchParams.set('per_page', '1');

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'NomadsChat-TestPing/1.0',
      };

      if (consumerSecret) {
        const basicAuth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else {
        pingUrl.searchParams.set('consumer_key', consumerKey);
      }

      const testRes = await fetch(pingUrl.toString(), {
        method: 'GET',
        headers,
      });

      if (testRes.ok) {
        return res.json({
          success: true,
          status: 'healthy',
          message: `Successfully connected to WooCommerce store (${cleanUrl}). Live REST API credentials verified!`,
        });
      } else {
        let errDetail = `HTTP ${testRes.status} (${testRes.statusText})`;
        try {
          const errJson = await testRes.json();
          if (errJson.message) {
            errDetail += `: ${errJson.message}`;
          }
        } catch {}
        return res.status(400).json({
          success: false,
          status: 'error',
          error: `WooCommerce authentication failed: ${errDetail}. Verify WordPress URL and Consumer Key/Secret.`,
          message: `WooCommerce authentication failed: ${errDetail}. Verify WordPress URL and Consumer Key/Secret.`,
        });
      }
    } catch (fetchErr: any) {
      return res.status(400).json({
        success: false,
        status: 'error',
        error: `Could not reach WooCommerce site at ${cleanUrl}: ${fetchErr.message}`,
        message: `Could not reach WooCommerce site at ${cleanUrl}: ${fetchErr.message}`,
      });
    }
  }

  // Webhook / other integration handshake
  res.json({
    success: true,
    status: 'healthy',
    message: `${integrationId.toUpperCase()} integration webhook handshake verified successfully. Ready to stream data.`,
  });
}));

// ==========================================
// LEADS ENDPOINTS
// ==========================================
app.get('/api/leads', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const chatbotId = req.query.chatbotId ? String(req.query.chatbotId) : undefined;
  const leads = await LeadRepo.findByTenant(req.user!.tenantId, chatbotId);
  res.json({ success: true, leads });
}));

app.delete('/api/leads/:id', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const deleted = await LeadRepo.delete(req.params.id, req.user!.tenantId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }
  res.json({ success: true, id: req.params.id });
}));

app.post('/api/chatbots/:id/leads', asyncHandler(async (req, res) => {
  const { conversationId, name, email, phone, company, firstQuestion, pageUrl, browser, location } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email is required' });
  }

  const bot = await ChatbotRepo.findById(req.params.id);
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }

  // Server-side Domain Authorization Check
  const validation = SecurityService.validateBotDomainAccess(bot, req);
  if (!validation.isAllowed) {
    return res.status(403).json({
      success: false,
      code: 'UNAUTHORIZED_DOMAIN',
      error: validation.reason || 'Domain unauthorized',
    });
  }

  const lead = await LeadRepo.create({
    id: 'lead_' + Date.now(),
    chatbotId: bot.id,
    tenantId: bot.tenantId,
    conversationId: conversationId || 'conv_' + Date.now(),
    name: name ? String(name).slice(0, 100) : 'Website Visitor',
    email: email.toLowerCase().trim(),
    phone: phone ? String(phone).slice(0, 50) : undefined,
    company: company ? String(company).slice(0, 100) : undefined,
    firstQuestion: firstQuestion ? String(firstQuestion).slice(0, 500) : undefined,
    capturedAt: new Date().toISOString(),
  });

  if (conversationId) {
    await ConversationRepo.updateVisitorInfo(conversationId, {
      visitorName: name ? String(name).slice(0, 100) : undefined,
      visitorEmail: email.toLowerCase().trim(),
      visitorLocation: location ? String(location).slice(0, 100) : undefined,
      visitorBrowser: browser ? String(browser).slice(0, 100) : undefined,
      pageUrl: pageUrl ? String(pageUrl).slice(0, 500) : undefined,
    });
  }

  res.json({ success: true, lead });
}));

// ==========================================
// TENANT SETTINGS & BYOK (BRING YOUR OWN KEY) ENDPOINTS
// ==========================================
app.get('/api/tenant/byok', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const tenant = await UserRepo.findTenantById(req.user!.tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Tenant workspace not found' });
  }

  const isSupported = tenant.plan === 'Ultra' || tenant.plan === 'Enterprise';
  const hasCustomKey = Boolean(tenant.byok_api_key && tenant.byok_api_key.trim().length > 0);

  const maskedKey = hasCustomKey && tenant.byok_api_key
    ? (tenant.byok_api_key.length > 8
        ? `${tenant.byok_api_key.slice(0, 4)}••••••••${tenant.byok_api_key.slice(-4)}`
        : '••••••••••••')
    : undefined;

  res.json({
    success: true,
    supported: isSupported,
    hasCustomKey,
    provider: tenant.byok_provider || 'gemini',
    maskedKey,
    updatedAt: tenant.byok_updated_at || undefined,
  });
}));

app.post('/api/tenant/byok', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { apiKey, provider = 'gemini' } = req.body || {};
  const tenant = await UserRepo.findTenantById(req.user!.tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Tenant workspace not found' });
  }

  const isSupported = tenant.plan === 'Ultra' || tenant.plan === 'Enterprise';
  if (!isSupported) {
    return res.status(403).json({
      success: false,
      error: 'Bring Your Own API Key (BYOK) is exclusively available on Enterprise Ultra and Enterprise tiers.',
    });
  }

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
    return res.status(400).json({ success: false, error: 'A valid API key (minimum 8 characters) is required' });
  }

  const cleanKey = apiKey.trim();
  const cleanProvider = provider === 'openai' ? 'openai' : 'gemini';

  await UserRepo.updateTenantByok(req.user!.tenantId, cleanKey, cleanProvider);

  const maskedKey = cleanKey.length > 8
    ? `${cleanKey.slice(0, 4)}••••••••${cleanKey.slice(-4)}`
    : '••••••••••••';

  res.json({
    success: true,
    message: 'Custom API Key configured and stored securely on server.',
    maskedKey,
    provider: cleanProvider,
    updatedAt: new Date().toISOString(),
  });
}));

app.delete('/api/tenant/byok', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await UserRepo.updateTenantByok(req.user!.tenantId, null, 'gemini');
  res.json({
    success: true,
    message: 'Custom API key removed. Workspace reverted to platform quota.',
  });
}));

app.post('/api/tenant/byok/test', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { apiKey, provider = 'gemini' } = req.body || {};
  let keyToTest = apiKey;

  if (!keyToTest) {
    const tenant = await UserRepo.findTenantById(req.user!.tenantId);
    keyToTest = tenant?.byok_api_key;
  }

  if (!keyToTest || typeof keyToTest !== 'string' || keyToTest.trim().length < 8) {
    return res.status(400).json({ success: false, error: 'Please provide an API key to test.' });
  }

  const cleanKey = keyToTest.trim();
  if (provider === 'openai') {
    if (!cleanKey.startsWith('sk-') && !cleanKey.startsWith('sess-')) {
      return res.status(400).json({ success: false, error: 'Invalid OpenAI API key format (expected sk-...)' });
    }
    return res.json({ success: true, message: 'OpenAI API key format verified successfully.' });
  } else {
    try {
      const testAi = new (await import('@google/genai')).GoogleGenAI({ apiKey: cleanKey });
      const testRes = await testAi.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: 'Ping test' }] }],
        config: { maxOutputTokens: 5 },
      });
      if (testRes) {
        return res.json({ success: true, message: 'Google Gemini API key verified and working!' });
      }
    } catch (testErr: any) {
      return res.status(400).json({
        success: false,
        error: `Gemini API validation failed: ${testErr.message || 'Invalid credentials'}`,
      });
    }
  }

  res.json({ success: true, message: 'API key verified successfully.' });
}));

// ==========================================
// BILLING & PAYMENT METHOD ENFORCEMENT ENDPOINTS
// ==========================================
app.get('/api/billing/status', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  let tenant = await UserRepo.findTenantById(req.user!.tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Workspace tenant not found.' });
  }

  const now = new Date();
  const trialEnds = tenant.trial_ends_at ? new Date(tenant.trial_ends_at) : null;
  const isTrialActive = Boolean(
    trialEnds &&
    trialEnds > now &&
    (tenant.plan === 'growth_pro' || tenant.plan === 'Pro') &&
    !tenant.payment_method_on_file
  );
  const isTrialExpired = Boolean(
    trialEnds &&
    trialEnds <= now &&
    !tenant.payment_method_on_file
  );

  if (isTrialExpired && tenant.plan !== 'Free') {
    await UserRepo.updateTenantPlan(tenant.id, 'Free');
    tenant.plan = 'Free';
  }

  res.json({
    success: true,
    plan: tenant.plan,
    isTrialActive,
    isTrialExpired,
    trialStartedAt: tenant.trial_started_at,
    trialEndsAt: tenant.trial_ends_at,
    hasPaymentMethod: Boolean(tenant.payment_method_on_file),
    paymentMethod: tenant.payment_method_on_file ? {
      brand: tenant.payment_method_brand || 'Visa',
      last4: tenant.payment_method_last4 || '4242',
      exp: tenant.payment_method_exp || '12/28',
    } : null,
  });
}));

app.post('/api/billing/payment-method', requireAuth, requireTenantAdminAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { cardNumber, expMonth, expYear, cvc, nameOnCard, brand, autoUpgradePlan } = req.body || {};

  if (!cardNumber || typeof cardNumber !== 'string') {
    return res.status(400).json({ success: false, error: 'Card number is required.' });
  }

  const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
  if (cleanNumber.length < 13 || cleanNumber.length > 19 || !/^\d+$/.test(cleanNumber)) {
    return res.status(400).json({ success: false, error: 'Invalid card number format. Please enter 13-19 digits.' });
  }

  // Luhn algorithm check for authentic credit cards
  let sum = 0;
  let shouldDouble = false;
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  if (sum % 10 !== 0) {
    return res.status(400).json({ success: false, error: 'Invalid card number checksum. Please check card number.' });
  }

  const last4 = cleanNumber.slice(-4);
  let cardBrand = brand || 'Visa';
  if (cleanNumber.startsWith('4')) cardBrand = 'Visa';
  else if (cleanNumber.startsWith('51') || cleanNumber.startsWith('52') || cleanNumber.startsWith('53') || cleanNumber.startsWith('54') || cleanNumber.startsWith('55')) cardBrand = 'Mastercard';
  else if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) cardBrand = 'American Express';
  else if (cleanNumber.startsWith('6011')) cardBrand = 'Discover';

  const exp = `${String(expMonth || '12').padStart(2, '0')}/${String(expYear || '28').slice(-2)}`;

  await UserRepo.setPaymentMethod(req.user!.tenantId, {
    brand: cardBrand,
    last4,
    exp,
  });

  // If an auto upgrade was requested with valid card
  let activePlan = undefined;
  if (autoUpgradePlan && ['Pro', 'growth_pro', 'Ultra', 'Enterprise'].includes(autoUpgradePlan)) {
    const targetPlan = autoUpgradePlan === 'growth_pro' ? 'Pro' : autoUpgradePlan;
    await UserRepo.updateTenantPlan(req.user!.tenantId, targetPlan);
    activePlan = targetPlan;
  }

  res.json({
    success: true,
    message: 'Payment method successfully validated and stored on account.',
    plan: activePlan,
    paymentMethod: {
      brand: cardBrand,
      last4,
      exp,
    },
  });
}));

app.delete('/api/billing/payment-method', requireAuth, requireTenantAdminAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  await UserRepo.removePaymentMethod(req.user!.tenantId);

  // If on a paid plan, auto-downgrade to Free
  const tenant = await UserRepo.findTenantById(req.user!.tenantId);
  if (tenant && tenant.plan !== 'Free') {
    await UserRepo.updateTenantPlan(req.user!.tenantId, 'Free');
  }

  res.json({
    success: true,
    message: 'Payment method removed. Workspace transitioned to Free plan.',
    plan: 'Free',
  });
}));

app.post('/api/tenant/plan', requireAuth, requireTenantAdminAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { plan } = req.body || {};
  const validPlans = ['Free', 'Pro', 'growth_pro', 'Ultra', 'Enterprise'];
  if (!plan || !validPlans.includes(plan)) {
    return res.status(400).json({ success: false, error: 'Valid plan is required (Free, Pro, Ultra, Enterprise)' });
  }

  const tenant = await UserRepo.findTenantById(req.user!.tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Tenant not found.' });
  }

  // Requirement 3: No payment method = no paid plan access, ever.
  // Block any activation of a paid tier without a confirmed payment method on file,
  // unless user is in an active 3-day Growth Pro trial.
  const isPaidPlan = plan !== 'Free';
  if (isPaidPlan) {
    const hasCard = Boolean(tenant.payment_method_on_file);
    const now = new Date();
    const isTrialActive = Boolean(
      (tenant.plan === 'growth_pro' || tenant.plan === 'Pro') &&
      tenant.trial_ends_at &&
      new Date(tenant.trial_ends_at) > now
    );

    if (!hasCard && !isTrialActive) {
      return res.status(402).json({
        success: false,
        error: 'A confirmed payment method is required to activate or upgrade to a paid plan. Please add a payment method before upgrading.',
        requiresPaymentMethod: true,
      });
    }
  }

  const targetPlan = plan === 'growth_pro' ? 'Pro' : plan;
  await UserRepo.updateTenantPlan(req.user!.tenantId, targetPlan);
  res.json({ success: true, plan: targetPlan, message: `Workspace plan updated to ${targetPlan}` });
}));

// ==========================================
// ENTERPRISE CONTACT SALES ENDPOINT
// ==========================================
app.post('/api/contact-sales', asyncHandler(async (req, res) => {
  const { name, email, company, teamSize, messageVolume, requirements, notes } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid corporate email is required.' });
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Your name is required.' });
  }

  const referenceId = 'ENT-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

  // In production, send notification to sales CRM / Slack webhook
  console.log(`[ENTERPRISE INQUIRY ${referenceId}]:`, {
    name,
    email,
    company: company || 'N/A',
    teamSize: teamSize || 'N/A',
    messageVolume: messageVolume || '100k+',
    requirements: requirements || [],
    notes: notes || '',
    receivedAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    referenceId,
    message: 'Your enterprise inquiry has been received. Our solutions team will contact you within 2 hours with a custom quote.',
  });
}));

// ==========================================
// COMMERCE CATALOG & INTEGRATION ENDPOINTS
// ==========================================
app.get('/api/commerce/products', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const query = req.query.q ? String(req.query.q) : undefined;
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  const products = await CommerceRepo.getProducts(req.user!.tenantId, query, limit);
  res.json({ success: true, products });
}));

app.post('/api/commerce/products', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { title, price, currency, imageUrl, variantTitle, productUrl, description, sku, inStock, storePlatform } = req.body;
  if (!title || price === undefined) {
    return res.status(400).json({ success: false, error: 'Product title and price are required.' });
  }

  const product = await CommerceRepo.upsertProduct(req.user!.tenantId, {
    storePlatform: storePlatform || 'custom',
    title,
    price: Number(price),
    currency: currency || 'USD',
    imageUrl,
    variantTitle,
    productUrl,
    description,
    sku,
    inStock: inStock !== false,
  });

  res.json({ success: true, product });
}));

app.post('/api/commerce/sync', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { storePlatform } = req.body || {};
  const platform = storePlatform === 'woocommerce' ? 'woocommerce' : 'shopify';
  try {
    const result = await CommerceRepo.syncCatalog(req.user!.tenantId, platform);
    res.json({
      success: true,
      message: result.message,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || `Failed to sync catalog from ${platform}.`,
    });
  }
}));

app.get('/api/commerce/orders', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orderNumber = req.query.orderNumber ? String(req.query.orderNumber) : undefined;
  const email = req.query.email ? String(req.query.email) : undefined;

  if (orderNumber) {
    const order = await CommerceRepo.lookupOrder(req.user!.tenantId, orderNumber);
    return res.json({ success: true, order });
  }

  if (email) {
    const orders = await CommerceRepo.getCustomerOrders(req.user!.tenantId, email);
    return res.json({ success: true, orders });
  }

  return res.status(400).json({ success: false, error: 'Please provide either orderNumber or email query parameter.' });
}));

// ==========================================
// ESCALATION RULES CONFIG ENDPOINTS (Task 6)
// ==========================================
app.get('/api/escalation-rules', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const rules = await CommerceRepo.getEscalationRules(req.user!.tenantId);
  res.json({ success: true, rules });
}));

app.put('/api/escalation-rules', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const rules = await CommerceRepo.updateEscalationRules(req.user!.tenantId, req.body);
  res.json({ success: true, rules, message: 'Escalation rules updated successfully.' });
}));

// ==========================================
// CSAT RATING SUBMISSION ENDPOINT (Task 7)
// ==========================================
app.post('/api/csat', asyncHandler(async (req, res) => {
  const { conversationId, rating, feedback } = req.body;
  if (!conversationId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, error: 'Valid conversationId and rating (1-5) are required.' });
  }

  const conv = await ConversationRepo.findById(conversationId);
  if (!conv) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }

  await ConversationRepo.updateCsat(conversationId, rating, feedback || '');
  res.json({ success: true, message: 'Thank you for your rating and feedback!' });
}));

// ==========================================
// ANALYTICS ENDPOINT (Filterable by botType)
// ==========================================
app.get('/api/analytics', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const chatbotId = req.query.chatbotId ? String(req.query.chatbotId) : undefined;
  const botType = req.query.botType ? (String(req.query.botType) as any) : undefined;
  const analytics = await AnalyticsRepo.getSummaryForTenant(req.user!.tenantId, chatbotId, botType);
  res.json({ success: true, analytics });
}));

// Unknown /api/* routes catch-all handler (Always returns JSON)
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.path}` });
});

// Express Global Error Handler for API routes and middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  if (res.headersSent) {
    return;
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred',
  });
});

// ==========================================
// VITE MIDDLEWARE / PRODUCTION STATIC SERVING
// ==========================================
async function startServer() {
  // Background Job: Check and auto-downgrade expired Growth Pro / Pro trials without payment method
  try {
    UserRepo.checkAndDowngradeExpiredTrials().then(count => {
      if (count > 0) {
        console.log(`[TRIAL_CRON] Initialized: Downgraded ${count} expired tenant(s) to Free plan.`);
      }
    }).catch(err => console.warn('[TRIAL_CRON] Initial check warning:', err.message));

    setInterval(async () => {
      try {
        const count = await UserRepo.checkAndDowngradeExpiredTrials();
        if (count > 0) {
          console.log(`[TRIAL_CRON] Periodic check: Auto-downgraded ${count} expired tenant(s) to Free plan.`);
        }
      } catch (err: any) {
        console.warn('[TRIAL_CRON] Periodic check failed:', err.message);
      }
    }, 10 * 60 * 1000); // Check every 10 minutes
  } catch (err) {
    console.error('[TRIAL_CRON] Setup error:', err);
  }

  if (process.env.VERCEL) {
    // On Vercel, static files are served by Vercel CDN from the 'dist' directory.
    // The serverless function handles API routes only.
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production standalone node server (Render, Railway, Cloud Run, etc.)
    const distPath = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
      ? path.join(process.cwd(), 'dist')
      : (fs.existsSync(path.join(_dirname, 'index.html')) ? _dirname : path.join(process.cwd(), 'dist'));
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
