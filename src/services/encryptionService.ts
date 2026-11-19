import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
let warnedMissingEncryptionKey = false;

function getMasterKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY?.trim();
  if (!rawKey) {
    if (!warnedMissingEncryptionKey && process.env.NODE_ENV === 'production') {
      warnedMissingEncryptionKey = true;
      console.warn('⚠️ [SECURITY WARNING] ENCRYPTION_KEY env var is not set in production. Set a strong 32+ char ENCRYPTION_KEY for secret encryption.');
    }
    return crypto.createHash('sha256').update('default-fallback-insecure-encryption-key-for-dev-32bytes').digest();
  }
  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Returns format: ivHex:tagHex:ciphertextHex
 */
export function encrypt(text: string): string {
  if (!text || typeof text !== 'string') return text;
  if (isEncrypted(text)) return text; // Prevent double encryption
  try {
    const iv = crypto.randomBytes(12);
    const key = getMasterKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

/**
 * Decrypts ciphertext string using AES-256-GCM.
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;
  if (!isEncrypted(ciphertext)) return ciphertext; // Fallback for unencrypted legacy data
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) return ciphertext;
    const [ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const ciphertextBuf = Buffer.from(cipherHex, 'hex');
    const key = getMasterKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertextBuf), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption error:', err);
    return ciphertext;
  }
}

function isEncrypted(val: string): boolean {
  const parts = val.split(':');
  if (parts.length !== 3) return false;
  return parts[0].length === 24 && parts[1].length === 32;
}

const SENSITIVE_KEYS = ['apiKey', 'accessToken', 'webhookUrl', 'secret', 'webhookSecret', 'password', 'token'];

export function encryptConfig(config: Record<string, any> | null): Record<string, any> | null {
  if (!config) return config;
  const encrypted: Record<string, any> = {};
  for (const [k, v] of Object.entries(config)) {
    if (SENSITIVE_KEYS.includes(k) && typeof v === 'string' && v.trim() !== '') {
      encrypted[k] = encrypt(v);
    } else {
      encrypted[k] = v;
    }
  }
  return encrypted;
}

export function decryptConfig(config: Record<string, any> | null): Record<string, any> | null {
  if (!config) return config;
  const decrypted: Record<string, any> = {};
  for (const [k, v] of Object.entries(config)) {
    if (SENSITIVE_KEYS.includes(k) && typeof v === 'string') {
      decrypted[k] = decrypt(v);
    } else {
      decrypted[k] = v;
    }
  }
  return decrypted;
}

export function maskConfig(config: Record<string, any> | null): Record<string, any> | null {
  if (!config) return config;
  const decrypted = decryptConfig(config);
  const masked: Record<string, any> = {};
  for (const [k, v] of Object.entries(decrypted || {})) {
    if (SENSITIVE_KEYS.includes(k) && typeof v === 'string' && v.trim() !== '') {
      masked[k] = maskSecret(v);
    } else {
      masked[k] = v;
    }
  }
  return masked;
}

export function maskSecret(secret: string): string {
  if (!secret || typeof secret !== 'string') return '****';
  const trimmed = secret.trim();
  if (trimmed.length <= 8) {
    return '****';
  }
  const prefixLen = trimmed.startsWith('sk-') || trimmed.startsWith('pat-') || trimmed.startsWith('EAAG') ? 4 : 3;
  const suffixLen = 4;
  if (trimmed.length <= prefixLen + suffixLen) {
    return trimmed.substring(0, 2) + '****';
  }
  const prefix = trimmed.substring(0, prefixLen);
  const suffix = trimmed.substring(trimmed.length - suffixLen);
  return `${prefix}****${suffix}`;
}
