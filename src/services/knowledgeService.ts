import { KnowledgeRepo } from '../repositories/knowledgeRepo';
import { KnowledgeSource } from '../types';
import { newId } from '../lib/ids';
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

    // Extract Page Title and Meta Description if present
    const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const extractedTitle = titleMatch ? this.decodeHtmlEntities(titleMatch[1]).trim() : '';

    const metaDescMatch = rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const metaDescription = metaDescMatch ? this.decodeHtmlEntities(metaDescMatch[1]).trim() : '';

    // Clean and convert HTML to structured Markdown text
    let cleanText = this.htmlToStructuredText(rawHtml);

    if (metaDescription && !cleanText.includes(metaDescription)) {
      cleanText = `Page Overview: ${metaDescription}\n\n${cleanText}`;
    }

    if (cleanText.length > 40000) {
      cleanText = cleanText.substring(0, 40000) + '\n... [content indexed up to 40,000 characters]';
    }

    const title = extractedTitle || `Scraped: ${finalUrl.hostname}${finalUrl.pathname}`;
    const chunks = this.chunkTextWithOverlap(cleanText, 350, 40);

    // Check if a source already exists for this URL on this chatbot to replace/update cleanly
    const existingSources = await KnowledgeRepo.findSourcesByBot(chatbotId, tenantId);
    const existingUrlSource = existingSources.find(s => s.sourceUrl === initialUrl || s.sourceUrl === finalUrl?.toString());
    if (existingUrlSource) {
      await KnowledgeRepo.deleteSource(existingUrlSource.id, tenantId);
    }

    const source: KnowledgeSource = {
      id: newId('ks'),
      chatbotId,
      tenantId,
      type: 'url',
      title: title.slice(0, 250),
      content: cleanText,
      sourceUrl: initialUrl,
      status: 'indexed',
      chunkCount: chunks.length,
      updatedAt: new Date().toISOString(),
    };

    return await KnowledgeRepo.createSourceWithChunks(source, chunks);
  }

  /**
   * Ingest Raw HTML from local websites, browser-assisted fetch, or view-source pastes
   */
  static async ingestRawHtml(
    chatbotId: string,
    tenantId: string,
    rawHtml: string,
    sourceUrl?: string,
    customTitle?: string
  ): Promise<KnowledgeSource> {
    if (!rawHtml || rawHtml.trim().length === 0) {
      throw new Error('HTML content cannot be empty');
    }

    if (rawHtml.length > 5 * 1024 * 1024) {
      throw new Error('Raw HTML exceeds maximum permitted size of 5MB');
    }

    // Extract Page Title and Meta Description
    const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const extractedTitle = titleMatch ? this.decodeHtmlEntities(titleMatch[1]).trim() : '';

    const metaDescMatch = rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const metaDescription = metaDescMatch ? this.decodeHtmlEntities(metaDescMatch[1]).trim() : '';

    // Convert HTML to structured Markdown text
    let cleanText = this.htmlToStructuredText(rawHtml);

    if (metaDescription && !cleanText.includes(metaDescription)) {
      cleanText = `Page Overview: ${metaDescription}\n\n${cleanText}`;
    }

    if (cleanText.length > 50000) {
      cleanText = cleanText.substring(0, 50000) + '\n... [content indexed up to 50,000 characters]';
    }

    if (cleanText.trim().length < 5) {
      throw new Error('Could not extract readable text content from the provided HTML. Ensure the page contains readable text or body content.');
    }

    const title = customTitle || extractedTitle || (sourceUrl ? `Page: ${sourceUrl}` : 'Imported Website Page');
    const chunks = this.chunkTextWithOverlap(cleanText, 350, 40);

    // Replace previous source for same URL if exists
    if (sourceUrl) {
      const existingSources = await KnowledgeRepo.findSourcesByBot(chatbotId, tenantId);
      const existingUrlSource = existingSources.find(s => s.sourceUrl === sourceUrl);
      if (existingUrlSource) {
        await KnowledgeRepo.deleteSource(existingUrlSource.id, tenantId);
      }
    }

    const source: KnowledgeSource = {
      id: newId('ks'),
      chatbotId,
      tenantId,
      type: 'url',
      title: title.slice(0, 250),
      content: cleanText,
      sourceUrl: sourceUrl || 'http://localhost (Imported)',
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

    const chunks = this.chunkTextWithOverlap(cleanContent, 350, 40);

    const source: KnowledgeSource = {
      id: newId('ks'),
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

  private static htmlToStructuredText(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      // Convert heading tags to markdown
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n')
      .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '\n\n#### $1\n')
      // List items & paragraphs
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n- $1')
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      // Strip remaining HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&copy;/g, '©')
      .replace(/\r\n/g, '\n')
      .replace(/\n\s+\n/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  private static decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static chunkTextWithOverlap(text: string, chunkSizeWords = 350, overlapWords = 40): string[] {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length <= chunkSizeWords) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < words.length) {
      const end = Math.min(start + chunkSizeWords, words.length);
      const chunkText = words.slice(start, end).join(' ');
      chunks.push(chunkText);

      if (end >= words.length) break;
      start += (chunkSizeWords - overlapWords);
    }

    return chunks;
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
