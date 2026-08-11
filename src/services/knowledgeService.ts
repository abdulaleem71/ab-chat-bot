import { KnowledgeRepo } from '../repositories/knowledgeRepo';
import { KnowledgeSource } from '../types';
import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

export class KnowledgeService {
  /**
   * Safe URL Fetching with SSRF Protection and Strict Manual Redirect Validation
   */
  static async scrapeAndIngestUrl(chatbotId: string, tenantId: string, initialUrl: string): Promise<KnowledgeSource> {
    let currentUrlStr = initialUrl;
    let redirectCount = 0;
    const maxRedirects = 5;
    const visitedUrls = new Set<string>();

    let response: Response | null = null;
    let finalUrl: URL | null = null;

    while (redirectCount <= maxRedirects) {
      if (visitedUrls.has(currentUrlStr)) {
        throw new Error('Redirect loop detected during scraping');
      }
      visitedUrls.add(currentUrlStr);

      const validatedUrl = await this.validateUrlForSsrf(currentUrlStr);
      finalUrl = validatedUrl;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch(validatedUrl.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NomadsChatIngest/1.0',
            'Accept': 'text/html,application/xhtml+xml,text/plain',
          },
          signal: controller.signal,
          redirect: 'manual',
        });

        clearTimeout(timeout);

        if (res.status >= 300 && res.status < 400) {
          const locationHeader = res.headers.get('location');
          if (!locationHeader) {
            throw new Error(`Redirect HTTP ${res.status} missing Location header`);
          }

          // Resolve relative redirect against current validatedUrl
          const nextUrl = new URL(locationHeader, validatedUrl);
          currentUrlStr = nextUrl.toString();
          redirectCount++;
          if (redirectCount > maxRedirects) {
            throw new Error('Maximum HTTP redirect limit exceeded');
          }
          continue;
        }

        response = res;
        break;
      } catch (err: any) {
        clearTimeout(timeout);
        throw new Error(`Failed to scrape URL: ${err.message || 'Network error'}`);
      }
    }

    if (!response || !finalUrl) {
      throw new Error('Failed to retrieve content from target URL');
    }

    if (!response.ok) {
      throw new Error(`Target server returned HTTP status ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      throw new Error('Remote target content exceeds maximum permitted size (5MB)');
    }

    const rawHtml = await response.text();
    if (rawHtml.length > 5 * 1024 * 1024) {
      throw new Error('Remote response body exceeds maximum permitted size (5MB)');
    }

    // Clean HTML to readable plain text
    let cleanText = rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanText.length > 15000) {
      cleanText = cleanText.substring(0, 15000) + '... [content truncated for index]';
    }

    const title = `Scraped: ${finalUrl.hostname}${finalUrl.pathname}`;
    const chunks = this.chunkText(cleanText, 500);

    const source: KnowledgeSource = {
      id: 'ks_' + Date.now(),
      chatbotId,
      tenantId,
      type: 'url',
      title,
      content: cleanText,
      sourceUrl: initialUrl,
      status: 'indexed',
      chunkCount: chunks.length,
      updatedAt: new Date().toISOString(),
    };

    return await KnowledgeRepo.createSourceWithChunks(source, chunks);
  }

  /**
   * Ingest Raw Text or FAQ Document
   */
  static async ingestTextDocument(
    chatbotId: string,
    tenantId: string,
    title: string,
    content: string,
    type: 'text' | 'faq' = 'text'
  ): Promise<KnowledgeSource> {
    const cleanContent = content.trim();
    if (cleanContent.length === 0) {
      throw new Error('Document content cannot be empty');
    }

    const chunks = this.chunkText(cleanContent, 500);

    const source: KnowledgeSource = {
      id: 'ks_' + Date.now(),
      chatbotId,
      tenantId,
      type,
      title: title.slice(0, 200) || 'Custom Knowledge Document',
      content: cleanContent,
      sourceUrl: '',
      status: 'indexed',
      chunkCount: chunks.length,
      updatedAt: new Date().toISOString(),
    };

    return await KnowledgeRepo.createSourceWithChunks(source, chunks);
  }

  private static chunkText(text: string, chunkSize: number): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentLen = 0;

    for (const word of words) {
      currentChunk.push(word);
      currentLen += word.length + 1;

      if (currentLen >= chunkSize) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
        currentLen = 0;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks.length > 0 ? chunks : [text];
  }

  private static async validateUrlForSsrf(targetUrlStr: string): Promise<URL> {
    const parsedUrl = new URL(targetUrlStr);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Only HTTP and HTTPS protocols are permitted');
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.includes('metadata.google.internal') ||
      hostname === '169.254.169.254' ||
      hostname === '0.0.0.0'
    ) {
      throw new Error('Access to local hostnames or cloud metadata endpoints is prohibited');
    }

    const addresses = await dns.lookup(hostname, { all: true });
    for (const addr of addresses) {
      const parsedIp = ipaddr.parse(addr.address);
      const range = parsedIp.range();
      if (
        range === 'loopback' ||
        range === 'private' ||
        range === 'linkLocal' ||
        range === 'uniqueLocal' ||
        range === 'unspecified' ||
        range === 'carrierGradeNat' ||
        range === 'reserved'
      ) {
        throw new Error('Target hostname resolves to a restricted IP address');
      }
    }

    return parsedUrl;
  }
}
