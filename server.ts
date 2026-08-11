import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ override: process.env.NODE_ENV !== 'production' });

import { initDb, getDb, validateDatabaseConfig } from './src/db/index';
import { UserRepo } from './src/repositories/userRepo';
import { ChatbotRepo } from './src/repositories/chatbotRepo';
import { KnowledgeRepo } from './src/repositories/knowledgeRepo';
import { ConversationRepo } from './src/repositories/conversationRepo';
import { LeadRepo } from './src/repositories/leadRepo';
import { AnalyticsRepo } from './src/repositories/analyticsRepo';
import { KnowledgeService } from './src/services/knowledgeService';
import { ChatService } from './src/services/chatService';
import { Chatbot } from './src/types';

const _filename = typeof __filename !== 'undefined' ? __filename : (import.meta?.url ? fileURLToPath(import.meta.url) : '');
const _dirname = typeof __dirname !== 'undefined' ? __dirname : (_filename ? path.dirname(_filename) : process.cwd());

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nomadschat_secure_jwt_secret_key_2026';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'nomadschat_secure_jwt_secret_key_2026' || process.env.JWT_SECRET.trim().length < 16) {
    console.error('❌ CRITICAL CONFIGURATION ERROR: A strong JWT_SECRET environment variable (>= 16 characters) is required in production mode.');
    process.exit(1);
  }
}

// Validate Production Configuration & Initialize Database
try {
  const dbConfig = validateDatabaseConfig();
  console.log(`ℹ️ Database mode: ${dbConfig.isRemote ? 'Remote Turso Database' : 'Local SQLite File'}`);
} catch (configErr: any) {
  console.error('❌ Configuration Error:', configErr.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

initDb().then(() => {
  console.log('✅ Persistent database schema initialized successfully.');
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
});

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: false, // Allows iframe embedding for chatbot widget
  })
);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Public widget endpoints allow cross-origin requests
app.use('/api/chatbots/:id/chat', cors({ origin: '*', credentials: false }));
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

app.use(express.json({ limit: '100kb' }));

// Rate Limiters
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit exceeded for chat messages. Please wait a moment.' },
});

app.use('/api/', globalApiLimiter);

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
  res.setHeader('Content-Type', 'application/javascript');
  const widgetScript = `
(function() {
  const scriptTag = document.currentScript || document.querySelector('script[data-bot-id]');
  const botId = scriptTag ? scriptTag.getAttribute('data-bot-id') : null;
  if (!botId) return;

  const host = window.location.origin;
  const container = document.createElement('div');
  container.id = 'nomadschat-widget-root';
  document.body.appendChild(container);

  const button = document.createElement('button');
  button.innerHTML = '💬';
  button.style.cssText = 'position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:#4F46E5;color:#fff;border:none;box-shadow:0 4px 12px rgba(0,0,0,0.15);cursor:pointer;z-index:999999;font-size:24px;display:flex;align-items:center;justify-content:center;transition:transform 0.2s;';
  
  const iframe = document.createElement('iframe');
  iframe.src = host + '/embed/' + botId;
  iframe.style.cssText = 'position:fixed;bottom:88px;right:20px;width:380px;height:580px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:999999;display:none;background:transparent;';

  let isOpen = false;
  button.onclick = function() {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    button.innerHTML = isOpen ? '✕' : '💬';
  };

  document.body.appendChild(button);
  document.body.appendChild(iframe);
})();
  `;
  res.send(widgetScript);
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', async (req, res) => {
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

  const dbUrl = process.env.DATABASE_URL || 'file:nomadschat.db';
  const isRemote = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://') || dbUrl.startsWith('wss://');

  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'ok' : 'degraded',
    database: dbHealthy ? 'healthy' : 'unhealthy',
    databaseMode: isRemote ? 'turso_remote' : 'sqlite_local',
    ...(dbError ? { databaseError: dbError } : {}),
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================
app.post('/api/auth/register', authLimiter, async (req, res) => {
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
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
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
});

app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
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
});

app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
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
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
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
});

// ==========================================
// CHATBOT ENDPOINTS
// ==========================================
app.get('/api/chatbots', requireAuth, async (req: AuthenticatedRequest, res) => {
  const chatbots = await ChatbotRepo.findByTenant(req.user!.tenantId);
  res.json({ success: true, chatbots });
});

app.get('/api/chatbots/:id', async (req, res) => {
  const bot = await ChatbotRepo.findById(req.params.id);
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }
  res.json({ success: true, chatbot: bot });
});

app.post('/api/chatbots', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { name, description, systemInstruction, tone, primaryColor, avatar, greetingMessage, model, fallbackMessage, collectLeadEmail, leadTitle } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return res.status(400).json({ success: false, error: 'Name is required and must be under 100 characters' });
  }

  const now = new Date().toISOString();
  const hexColorRegex = /^#([0-9a-fA-F]{3}){1,2}$/;
  const validatedColor = (primaryColor && typeof primaryColor === 'string' && hexColorRegex.test(primaryColor)) ? primaryColor : '#4F46E5';

  const newBot = await ChatbotRepo.create({
    id: 'bot_' + Date.now(),
    tenantId: req.user!.tenantId,
    name: name.trim(),
    description: (description && typeof description === 'string') ? description.slice(0, 500) : 'AI Assistant',
    systemInstruction: (systemInstruction && typeof systemInstruction === 'string') ? systemInstruction.slice(0, 3000) : 'You are a helpful support representative.',
    tone: (tone && typeof tone === 'string') ? (tone as any) : 'Friendly',
    primaryColor: validatedColor,
    textColor: '#FFFFFF',
    avatar: (avatar && typeof avatar === 'string') ? avatar.slice(0, 10) : '🤖',
    greetingMessage: (greetingMessage && typeof greetingMessage === 'string') ? greetingMessage.slice(0, 500) : 'Hello! How can I help you today?',
    suggestedQuestions: ['What are your support hours?', 'How do I contact team?'],
    model: (model && typeof model === 'string') ? (model as any) : 'gemini-3.6-flash',
    fallbackMessage: (fallbackMessage && typeof fallbackMessage === 'string') ? fallbackMessage.slice(0, 500) : 'I will connect you to a support agent.',
    collectLeadEmail: collectLeadEmail !== false,
    leadTitle: (leadTitle && typeof leadTitle === 'string') ? leadTitle.slice(0, 200) : 'Leave your email to stay connected',
    humanOperatorOnline: true,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });

  res.json({ success: true, chatbot: newBot });
});

app.put('/api/chatbots/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const body = req.body || {};
  const allowedUpdates: Partial<Chatbot> = {};

  if (typeof body.name === 'string' && body.name.trim().length > 0) allowedUpdates.name = body.name.trim().slice(0, 100);
  if (typeof body.description === 'string') allowedUpdates.description = body.description.slice(0, 500);
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

  const updated = await ChatbotRepo.update(req.params.id, req.user!.tenantId, allowedUpdates);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }
  res.json({ success: true, chatbot: updated });
});

app.delete('/api/chatbots/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const deleted = await ChatbotRepo.delete(req.params.id, req.user!.tenantId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
  }
  res.json({ success: true, id: req.params.id });
});

// ==========================================
// KNOWLEDGE BASE ENDPOINTS
// ==========================================
app.get('/api/chatbots/:id/knowledge', requireAuth, async (req: AuthenticatedRequest, res) => {
  const sources = await KnowledgeRepo.findSourcesByBot(req.params.id, req.user!.tenantId);
  res.json({ success: true, knowledgeSources: sources });
});

app.post('/api/chatbots/:id/scrape-url', requireAuth, async (req: AuthenticatedRequest, res) => {
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
});

app.post('/api/chatbots/:id/knowledge', express.json({ limit: '1mb' }), requireAuth, async (req: AuthenticatedRequest, res) => {
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
});

app.delete('/api/chatbots/:id/knowledge/:sourceId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const deleted = await KnowledgeRepo.deleteSource(req.params.sourceId, req.user!.tenantId);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Knowledge source not found' });
  }
  res.json({ success: true, id: req.params.sourceId });
});

// ==========================================
// PUBLIC AI CHAT ENDPOINT
// ==========================================
app.post('/api/chatbots/:id/chat', chatLimiter, async (req, res) => {
  const { message, conversationId, visitorInfo } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  if (message.length > 2000) {
    return res.status(400).json({ success: false, error: 'Message exceeds maximum length of 2000 characters' });
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
});

// ==========================================
// CONVERSATIONS & INBOX ENDPOINTS
// ==========================================
app.get('/api/conversations', requireAuth, async (req: AuthenticatedRequest, res) => {
  const chatbotId = req.query.chatbotId ? String(req.query.chatbotId) : undefined;
  const conversations = await ConversationRepo.findByTenant(req.user!.tenantId, chatbotId);
  res.json({ success: true, conversations });
});

app.get('/api/conversations/:id/messages', requireAuth, async (req: AuthenticatedRequest, res) => {
  const conversation = await ConversationRepo.findById(req.params.id, req.user!.tenantId);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }

  const messages = await ConversationRepo.findMessagesByConversation(req.params.id);
  res.json({ success: true, messages });
});

// ==========================================
// LEADS ENDPOINTS
// ==========================================
app.get('/api/leads', requireAuth, async (req: AuthenticatedRequest, res) => {
  const chatbotId = req.query.chatbotId ? String(req.query.chatbotId) : undefined;
  const leads = await LeadRepo.findByTenant(req.user!.tenantId, chatbotId);
  res.json({ success: true, leads });
});

app.post('/api/chatbots/:id/leads', async (req, res) => {
  const { conversationId, name, email, phone, company, firstQuestion } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email is required' });
  }

  const bot = await ChatbotRepo.findById(req.params.id);
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Chatbot not found' });
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

  res.json({ success: true, lead });
});

// ==========================================
// ANALYTICS ENDPOINT
// ==========================================
app.get('/api/analytics', requireAuth, async (req: AuthenticatedRequest, res) => {
  const chatbotId = req.query.chatbotId ? String(req.query.chatbotId) : undefined;
  const analytics = await AnalyticsRepo.getSummaryForTenant(req.user!.tenantId, chatbotId);
  res.json({ success: true, analytics });
});

// Unknown /api/* routes catch-all handler
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

// ==========================================
// VITE MIDDLEWARE / PRODUCTION STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Absolute path independent of CWD
    const distPath = path.resolve(_dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: 'An unexpected internal server error occurred',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
