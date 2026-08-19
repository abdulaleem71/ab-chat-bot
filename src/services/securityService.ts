import crypto from 'crypto';
import express from 'express';
import { Chatbot } from '../types';

export interface DomainValidationResult {
  isAllowed: boolean;
  requestingDomain: string;
  source: 'origin' | 'referer' | 'header' | 'query' | 'direct' | 'none';
  reason?: string;
  authorizedDomains: string[];
}

export class SecurityService {
  /**
   * Normalizes a URL, origin, or domain string into a clean lowercase hostname (preserving port for localhost)
   */
  static normalizeDomain(rawDomainOrUrl?: string | null): string {
    if (!rawDomainOrUrl || typeof rawDomainOrUrl !== 'string') return '';
    let trimmed = rawDomainOrUrl.trim().toLowerCase();

    // If starts with protocol, parse using URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const u = new URL(trimmed);
        const portPart = (u.port && u.port !== '80' && u.port !== '443') ? `:${u.port}` : '';
        return `${u.hostname}${portPart}`.toLowerCase();
      } catch {
        // Fallback below
      }
    }

    // Strip leading protocols or slashes
    trimmed = trimmed.replace(/^https?:\/\//i, '').replace(/^\/\//, '');
    // Strip trailing paths, queries, hashes
    trimmed = trimmed.split('/')[0].split('?')[0].split('#')[0];

    return trimmed;
  }

  /**
   * Generates a tamper-proof HMAC SHA-256 embed signature tied to the specific bot and authorized domain
   */
  static generateEmbedSignature(botId: string, domain: string, secretKey: string): string {
    const cleanDomain = this.normalizeDomain(domain);
    const payload = `${botId.trim()}:${cleanDomain}`;
    return crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
  }

  /**
   * Securely verifies if a provided embed token/signature matches the expected HMAC for the domain
   */
  static verifyEmbedSignature(botId: string, domain: string, signature: string, secretKey: string): boolean {
    if (!signature || !secretKey || !botId || !domain) return false;
    try {
      const expected = this.generateEmbedSignature(botId, domain, secretKey);
      const expectedBuf = Buffer.from(expected, 'utf8');
      const providedBuf = Buffer.from(signature.trim(), 'utf8');
      if (expectedBuf.length !== providedBuf.length) return false;
      return crypto.timingSafeEqual(expectedBuf, providedBuf);
    } catch {
      return false;
    }
  }

  /**
   * Retrieves all effective authorized domains for a chatbot
   */
  static getEffectiveAuthorizedDomains(bot: Chatbot): string[] {
    const domainsSet = new Set<string>();

    if (bot.websiteUrl) {
      const primary = this.normalizeDomain(bot.websiteUrl);
      if (primary) domainsSet.add(primary);
    }

    if (Array.isArray(bot.allowedDomains)) {
      bot.allowedDomains.forEach(d => {
        const norm = this.normalizeDomain(d);
        if (norm) domainsSet.add(norm);
      });
    }

    return Array.from(domainsSet);
  }

  /**
   * Checks if a target domain matches any of the allowed domain rules (supports wildcards like *.example.com)
   */
  static isDomainMatchingRule(targetDomain: string, allowedRule: string): boolean {
    const cleanTarget = this.normalizeDomain(targetDomain);
    const cleanRule = this.normalizeDomain(allowedRule);

    if (!cleanTarget || !cleanRule) return false;

    // Exact match (e.g. "example.com" === "example.com")
    if (cleanTarget === cleanRule) return true;

    // Direct domain wildcard rule (e.g. "*.example.com")
    if (cleanRule.startsWith('*.')) {
      const rootRule = cleanRule.slice(2);
      if (cleanTarget === rootRule || cleanTarget.endsWith('.' + rootRule)) {
        return true;
      }
    }

    // Auto-allow subdomains if base domain is registered (e.g. rule "example.com" matches "www.example.com", "app.example.com")
    if (cleanTarget.endsWith('.' + cleanRule)) {
      return true;
    }

    // Allow reverse if rule is "www.example.com" and target is "example.com"
    if (cleanRule.startsWith('www.') && cleanTarget === cleanRule.slice(4)) {
      return true;
    }

    return false;
  }

  /**
   * Extracts the requesting client website domain from browser security headers
   */
  static extractRequestDomain(req: express.Request): { domain: string; source: 'origin' | 'referer' | 'header' | 'query' | 'direct' | 'none' } {
    // 1. Origin header (Sent by browsers on cross-origin fetch/XHR, cannot be modified by frontend JS)
    const origin = req.headers.origin;
    if (origin && typeof origin === 'string') {
      const d = this.normalizeDomain(origin);
      if (d) return { domain: d, source: 'origin' };
    }

    // 2. Referer header (Sent by browser when loading scripts, iframes, or cross-site requests)
    const referer = req.headers.referer;
    if (referer && typeof referer === 'string') {
      const d = this.normalizeDomain(referer);
      if (d) return { domain: d, source: 'referer' };
    }

    // 3. Explicit Query Param or Body parameter (e.g. ?host=... or ?domain=...)
    const qHost = req.query.host || req.query.domain || req.body?.hostOrigin || req.body?.hostUrl || req.body?.domain;
    if (qHost && typeof qHost === 'string') {
      const d = this.normalizeDomain(qHost);
      if (d) return { domain: d, source: 'query' };
    }

    return { domain: '', source: 'none' };
  }

  /**
   * Comprehensive Server-Side Domain Validation & Authorization Engine
   */
  static validateBotDomainAccess(bot: Chatbot, req: express.Request): DomainValidationResult {
    const authorizedDomains = this.getEffectiveAuthorizedDomains(bot);

    // If domain lock is explicitly disabled, or no website/domains have been configured yet
    if (bot.domainLockEnabled === false) {
      return {
        isAllowed: true,
        requestingDomain: 'unrestricted',
        source: 'direct',
        authorizedDomains,
      };
    }

    // If bot has no authorized domains configured, allow default setup
    if (authorizedDomains.length === 0) {
      return {
        isAllowed: true,
        requestingDomain: 'no_domains_configured',
        source: 'direct',
        authorizedDomains,
      };
    }

    const { domain: requestingDomain, source } = this.extractRequestDomain(req);

    // Check if the request is from the same host (e.g. AI Studio preview, localhost dashboard, internal testing)
    const serverHost = this.normalizeDomain(req.headers.host || '');
    if (requestingDomain && serverHost && (requestingDomain === serverHost || requestingDomain.includes('localhost') || requestingDomain.includes('127.0.0.1'))) {
      // Local development or internal dashboard preview is always permitted
      return {
        isAllowed: true,
        requestingDomain,
        source,
        authorizedDomains,
      };
    }

    // Optional: Check cryptographically signed embed token in headers or query
    const providedToken = (req.headers['x-embed-token'] as string) || (req.query.token as string) || (req.body?.embedToken as string);
    if (providedToken && bot.embedSecretKey && requestingDomain) {
      const isTokenValid = this.verifyEmbedSignature(bot.id, requestingDomain, providedToken, bot.embedSecretKey);
      if (isTokenValid) {
        // Double check domain matches whitelist
        const matched = authorizedDomains.some(rule => this.isDomainMatchingRule(requestingDomain, rule));
        if (matched) {
          return {
            isAllowed: true,
            requestingDomain,
            source,
            authorizedDomains,
          };
        }
      }
    }

    // If no requesting domain could be extracted from browser headers and lock is active
    if (!requestingDomain) {
      // In browser cross-origin requests, Origin or Referer is mandatory
      return {
        isAllowed: false,
        requestingDomain: 'unknown',
        source: 'none',
        reason: 'Missing origin or referer header. Requests must originate from an authorized domain.',
        authorizedDomains,
      };
    }

    // Verify requestingDomain against authorized domains list
    const isMatched = authorizedDomains.some(rule => this.isDomainMatchingRule(requestingDomain, rule));

    if (isMatched) {
      return {
        isAllowed: true,
        requestingDomain,
        source,
        authorizedDomains,
      };
    }

    return {
      isAllowed: false,
      requestingDomain,
      source,
      reason: `Domain "${requestingDomain}" is unauthorized. This chatbot embed is securely locked to: [${authorizedDomains.join(', ')}].`,
      authorizedDomains,
    };
  }

  /**
   * Generates production-ready embed code snippet with security signature and domain locking
   */
  static generateSecureEmbedSnippet(bot: Chatbot, appOrigin: string, selectedDomain?: string): {
    snippet: string;
    token?: string;
    domain: string;
    isLocked: boolean;
  } {
    const effectiveDomains = this.getEffectiveAuthorizedDomains(bot);
    const domain = selectedDomain || effectiveDomains[0] || (bot.websiteUrl ? this.normalizeDomain(bot.websiteUrl) : 'example.com');
    const secretKey = bot.embedSecretKey || 'secret_key';
    const token = this.generateEmbedSignature(bot.id, domain, secretKey);
    const isLocked = bot.domainLockEnabled !== false;

    const snippet = `<script src="${appOrigin}/widget.js" data-bot-id="${bot.id}" data-domain="${domain}" data-token="${token}" async></script>`;

    return {
      snippet,
      token,
      domain,
      isLocked,
    };
  }
}
