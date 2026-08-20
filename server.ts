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
import { KnowledgeService } from './src/services/knowledgeService';
import { ChatService } from './src/services/chatService';
import { SecurityService } from './src/services/securityService';
import { Chatbot } from './src/types';

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

ensureDbInitialized().then(() => {
  console.log('✅ Persistent database schema initialized successfully.');
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

  const tenant = await UserRepo.createTenant({
    id: tenantId,
    name: companyName ? String(companyName).slice(0, 100) : `${email.split('@')[0]}'s Workspace`,
    owner_email: email.toLowerCase(),
    plan: 'Pro',
    created_at: now,
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
    tenant: { id: tenant.id, name: tenant.name, ownerEmail: tenant.owner_email, plan: tenant.plan, createdAt: tenant.created_at },
  });
}));

app.post('/api/auth/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const user = await UserRepo.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  let isValidPassword = false;
  if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2y$')) {
    isValidPassword = await bcrypt.compare(password, user.password_hash);
  } else {
    // Legacy plaintext match during migration
    isValidPassword = (user.password_hash === password);
  }

  if (!isValidPassword) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const tenant = await UserRepo.findTenantById(user.tenant_id) || {
    id: user.tenant_id,
    name: 'Workspace',
    owner_email: user.email,
    plan: 'Pro',
    created_at: new Date().toISOString(),
  };

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, tenantId: user.tenant_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenant_id, role: user.role },
    tenant: { id: tenant.id, name: tenant.name, ownerEmail: tenant.owner_email, plan: tenant.plan, createdAt: tenant.created_at },
  });
}));

app.post('/api/auth/social', authLimiter, asyncHandler(async (req, res) => {
  const { provider, email: inputEmail, name: inputName } = req.body || {};
  const providerName = provider === 'github' ? 'GitHub' : 'Google';
  const email = (inputEmail && typeof inputEmail === 'string' && inputEmail.includes('@'))
    ? inputEmail.trim().toLowerCase()
    : `${providerName.toLowerCase()}.user@example.com`;
  const name = inputName || `${providerName} User`;

  let user = await UserRepo.findUserByEmail(email);

  if (!user) {
    const tenantId = 'tenant_' + Date.now();
    const userId = 'usr_' + Date.now();
    const now = new Date().toISOString();

    await UserRepo.createTenant({
      id: tenantId,
      name: `${name}'s Workspace`,
      owner_email: email,
      plan: 'Pro',
      created_at: now,
    });

    const passwordHash = await bcrypt.hash(`social_${Date.now()}`, 10);
    user = await UserRepo.createUser({
      id: userId,
      tenant_id: tenantId,
      email: email,
      name: name,
      password_hash: passwordHash,
      role: 'Admin',
      created_at: now,
    });
  }

  const tenant = await UserRepo.findTenantById(user.tenant_id) || {
    id: user.tenant_id,
    name: `${name}'s Workspace`,
    owner_email: user.email,
    plan: 'Pro',
    created_at: new Date().toISOString(),
  };

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, tenantId: user.tenant_id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenant_id, role: user.role },
    tenant: { id: tenant.id, name: tenant.name, ownerEmail: tenant.owner_email, plan: tenant.plan, createdAt: tenant.created_at },
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
  const tenantRow = await UserRepo.findTenantById(user.tenantId);

  res.json({
    success: true,
    user,
    tenant: tenantRow ? {
      id: tenantRow.id,
      name: tenantRow.name,
      ownerEmail: tenantRow.owner_email,
      plan: tenantRow.plan,
      createdAt: tenantRow.created_at,
    } : null,
  });
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

app.delete('/api/conversations/:id', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const deleted = await ConversationRepo.delete(req.params.id, req.user!.tenantId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }
  res.json({ success: true, id: req.params.id });
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
// ANALYTICS ENDPOINT
// ==========================================
app.get('/api/analytics', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const chatbotId = req.query.chatbotId ? String(req.query.chatbotId) : undefined;
  const analytics = await AnalyticsRepo.getSummaryForTenant(req.user!.tenantId, chatbotId);
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
  if (process.env.VERCEL) {
    // On Vercel, static files are served by Vercel CDN from the 'dist' directory.
    // The serverless function handles API routes only.
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
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
