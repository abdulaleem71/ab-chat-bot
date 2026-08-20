import { Chatbot } from '../types';

export interface DomainValidationResult {
  isAllowed: boolean;
  requestingDomain: string;
  source: 'origin' | 'referer' | 'header' | 'query' | 'direct' | 'none';
  reason?: string;
  authorizedDomains: string[];
}

export interface RequestLike {
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, any>;
  body?: any;
}

// -------------------------------------------------------------
// Universal Pure TypeScript/JS SHA-256 & HMAC-SHA256 Implementation
// (100% compatible with both Browser / Vite client & Node.js server)
// -------------------------------------------------------------

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function stringToUtf8(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 128) {
      bytes.push(code);
    } else if (code < 2048) {
      bytes.push(192 | (code >> 6), 128 | (code & 63));
    } else if (code < 55296 || code >= 57344) {
      bytes.push(224 | (code >> 12), 128 | ((code >> 6) & 63), 128 | (code & 63));
    } else {
      i++;
      const code2 = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(240 | (code2 >> 18), 128 | ((code2 >> 12) & 63), 128 | ((code2 >> 6) & 63), 128 | (code2 & 63));
    }
  }
  return new Uint8Array(bytes);
}

function sha256Bytes(input: Uint8Array): Uint8Array {
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const bytes: number[] = Array.from(input);
  const bitLength = bytes.length * 8;

  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) {
    bytes.push(0);
  }
  bytes.push(0, 0, 0, 0);
  bytes.push(
    (bitLength >>> 24) & 0xff,
    (bitLength >>> 16) & 0xff,
    (bitLength >>> 8) & 0xff,
    bitLength & 0xff
  );

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    const w: number[] = new Array(64);
    for (let t = 0; t < 16; t++) {
      w[t] = (bytes[chunk + t * 4] << 24) |
             (bytes[chunk + t * 4 + 1] << 16) |
             (bytes[chunk + t * 4 + 2] << 8) |
             (bytes[chunk + t * 4 + 3]);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rightRotate(w[t - 15], 7) ^ rightRotate(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rightRotate(w[t - 2], 17) ^ rightRotate(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
    }

    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (let t = 0; t < 64; t++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const temp1 = (h + S1 + ch + k[t] + w[t]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    out[i * 4] = (hash[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (hash[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (hash[i] >>> 8) & 0xff;
    out[i * 4 + 3] = hash[i] & 0xff;
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function universalHmacSha256(keyStr: string, messageStr: string): string {
  let keyBytes = stringToUtf8(keyStr || '');
  const blockSize = 64;

  if (keyBytes.length > blockSize) {
    keyBytes = sha256Bytes(keyBytes);
  }

  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(keyBytes);

  const oPad = new Uint8Array(blockSize);
  const iPad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    oPad[i] = paddedKey[i] ^ 0x5c;
    iPad[i] = paddedKey[i] ^ 0x36;
  }

  const msgBytes = stringToUtf8(messageStr || '');
  const inner = new Uint8Array(iPad.length + msgBytes.length);
  inner.set(iPad);
  inner.set(msgBytes, iPad.length);

  const innerHash = sha256Bytes(inner);

  const outer = new Uint8Array(oPad.length + innerHash.length);
  outer.set(oPad);
  outer.set(innerHash, oPad.length);

  const outerHash = sha256Bytes(outer);
  return bytesToHex(outerHash);
}

// -------------------------------------------------------------
// Security Service Class
// -------------------------------------------------------------

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
   * Runs identically and synchronously in both browser client and backend server
   */
  static generateEmbedSignature(botId: string, domain: string, secretKey: string): string {
    const cleanDomain = this.normalizeDomain(domain);
    const payload = `${(botId || '').trim()}:${cleanDomain}`;
    return universalHmacSha256(secretKey || 'default_secret', payload);
  }

  /**
   * Constant-time string equality check to prevent timing attacks
   */
  static constantTimeEqual(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
  }

  /**
   * Securely verifies if a provided embed token/signature matches the expected HMAC for the domain
   */
  static verifyEmbedSignature(botId: string, domain: string, signature: string, secretKey: string): boolean {
    if (!signature || !secretKey || !botId || !domain) return false;
    try {
      const expected = this.generateEmbedSignature(botId, domain, secretKey);
      return this.constantTimeEqual(expected, signature.trim());
    } catch {
      return false;
    }
  }

  /**
   * Retrieves all effective authorized domains for a chatbot
   */
  static getEffectiveAuthorizedDomains(bot?: Partial<Chatbot> | null): string[] {
    const domainsSet = new Set<string>();

    if (bot && bot.websiteUrl) {
      const primary = this.normalizeDomain(bot.websiteUrl);
      if (primary) domainsSet.add(primary);
    }

    if (bot && Array.isArray(bot.allowedDomains)) {
      bot.allowedDomains.forEach(d => {
        const norm = this.normalizeDomain(d);
        if (norm) domainsSet.add(norm);
      });
    }

    if (domainsSet.size === 0) {
      domainsSet.add('example.com');
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
  static extractRequestDomain(req: RequestLike): { domain: string; source: 'origin' | 'referer' | 'header' | 'query' | 'direct' | 'none' } {
    if (!req) return { domain: '', source: 'none' };

    // 1. Origin header (Sent by browsers on cross-origin fetch/XHR, cannot be modified by frontend JS)
    const origin = req.headers?.origin;
    if (origin && typeof origin === 'string') {
      const d = this.normalizeDomain(origin);
      if (d) return { domain: d, source: 'origin' };
    }

    // 2. Referer header (Sent by browser when loading scripts, iframes, or cross-site requests)
    const referer = req.headers?.referer;
    if (referer && typeof referer === 'string') {
      const d = this.normalizeDomain(referer);
      if (d) return { domain: d, source: 'referer' };
    }

    // 3. Explicit Query Param or Body parameter (e.g. ?host=... or ?domain=...)
    const qHost = req.query?.host || req.query?.domain || req.body?.hostOrigin || req.body?.hostUrl || req.body?.domain;
    if (qHost && typeof qHost === 'string') {
      const d = this.normalizeDomain(qHost);
      if (d) return { domain: d, source: 'query' };
    }

    return { domain: '', source: 'none' };
  }

  /**
   * Comprehensive Server-Side Domain Validation & Authorization Engine
   */
  static validateBotDomainAccess(bot: Chatbot, req: RequestLike): DomainValidationResult {
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
    const hostHeader = req.headers?.host;
    const serverHost = typeof hostHeader === 'string' ? this.normalizeDomain(hostHeader) : '';
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
    const providedToken = ((req.headers?.['x-embed-token'] as string) || (req.query?.token as string) || (req.body?.embedToken as string));
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
  static generateSecureEmbedSnippet(bot?: Partial<Chatbot> | null, appOrigin: string = '', selectedDomain?: string): {
    snippet: string;
    token?: string;
    domain: string;
    isLocked: boolean;
  } {
    const effectiveDomains = this.getEffectiveAuthorizedDomains(bot);
    const domain = selectedDomain || effectiveDomains[0] || (bot?.websiteUrl ? this.normalizeDomain(bot.websiteUrl) : 'example.com');
    const secretKey = bot?.embedSecretKey || 'secret_key';
    const botId = bot?.id || 'default_bot';
    const token = this.generateEmbedSignature(botId, domain, secretKey);
    const isLocked = bot?.domainLockEnabled !== false;

    const snippet = `<script src="${appOrigin}/widget.js" data-bot-id="${botId}" data-domain="${domain}" data-token="${token}" async></script>`;

    return {
      snippet,
      token,
      domain,
      isLocked,
    };
  }
}
