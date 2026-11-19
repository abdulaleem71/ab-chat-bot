import crypto from 'crypto';
import type { Request, CookieOptions } from 'express';

// Ephemeral fallback per-process secret for local dev when JWT_SECRET env var isn't supplied.
// In production, a missing or weak JWT_SECRET triggers a critical warning at boot.
let ephemeralDevSecret: string | null = null;

export function getJwtSecret(): string {
  const configured = process.env.JWT_SECRET?.trim();
  if (configured && configured.length >= 16) {
    return configured;
  }
  if (!ephemeralDevSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 [CRITICAL SECURITY WARNING] JWT_SECRET is missing or < 16 chars in production! Generating temporary runtime key; sessions will reset on restart.');
      ephemeralDevSecret = crypto.randomBytes(32).toString('hex');
    } else {
      ephemeralDevSecret = 'nomadschat_local_dev_secret_key_change_in_prod';
    }
  }
  return ephemeralDevSecret;
}

export function getAppUrl(req?: Request): string {
  const envUrl = process.env.APP_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  if (req) {
    const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
    const host = String(req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000').split(',')[0].trim();
    return `${proto}://${host}`;
  }
  return 'http://localhost:3000';
}

export function isHttpsRequest(req?: Request): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  if (!req) return false;
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return req.secure || forwardedProto.includes('https');
}

export function getSessionCookieOptions(req: Request, maxAgeMs: number): CookieOptions {
  const secure = isHttpsRequest(req);
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function getAllowedOrigins(): string[] {
  const origins = new Set<string>([
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]);
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    try {
      origins.add(new URL(appUrl).origin);
    } catch {}
  }
  const extra = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) || [];
  for (const item of extra) {
    origins.add(item);
  }
  return Array.from(origins);
}
