import { KnowledgeRepo } from '../repositories/knowledgeRepo';
import { KnowledgeSource } from '../types';
import { newId } from '../lib/ids';
import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

export class KnowledgeService {
  /**
   * Safe URL Fetching with SSRF Protection and Strict Manual Redirect Validation
   */
  static async scrapeAndIngestUrl(tenantId: string, initialUrl: string, chatbotIds: string[] = []): Promise<KnowledgeSource> {
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

    const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const extractedTitle = titleMatch ? this.decodeHtmlEntities(titleMatch[1]).trim() : '';

    const metaDescMatch = rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const metaDescription = metaDescMatch ? this.decodeHtmlEntities(metaDescMatch[1]).trim() : '';

    let cleanText = this.htmlToStructuredText(rawHtml);

    if (metaDescription && !cleanText.includes(metaDescription)) {
      cleanText = `Page Overview: ${metaDescription}\n\n${cleanText}`;
    }

    if (cleanText.length > 40000) {
      cleanText = cleanText.substring(0, 40000) + '\n... [content indexed up to 40,000 characters]';
    }

    const title = extractedTitle || `Scraped: ${finalUrl.hostname}${finalUrl.pathname}`;
    const chunks = this.chunkTextWithOverlap(cleanText, 350, 40);

    const existingSources = await KnowledgeRepo.findSourcesByTenant(tenantId);
    const existingUrlSource = existingSources.find(s => s.sourceUrl === initialUrl || s.sourceUrl === finalUrl?.toString());
    if (existingUrlSource) {
      await KnowledgeRepo.deleteSource(existingUrlSource.id, tenantId);
    }

    const source = {
      id: newId('ks'),
      tenantId,
      type: 'url' as const,
      title: title.slice(0, 250),
      content: cleanText,
      sourceUrl: initialUrl,
      status: 'indexed' as const,
      updatedAt: new Date().toISOString(),
    };

    return await KnowledgeRepo.createSourceWithChunks(source, chunks, chatbotIds);
  }

  static async ingestRawHtml(
    tenantId: string,
    rawHtml: string,
    sourceUrl?: string,
    customTitle?: string,
    chatbotIds: string[] = []
  ): Promise<KnowledgeSource> {
    if (!rawHtml || rawHtml.trim().length === 0) {
      throw new Error('HTML content cannot be empty');
    }

    if (rawHtml.length > 5 * 1024 * 1024) {
      throw new Error('Raw HTML exceeds maximum permitted size of 5MB');
    }

    const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const extractedTitle = titleMatch ? this.decodeHtmlEntities(titleMatch[1]).trim() : '';

    const metaDescMatch = rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const metaDescription = metaDescMatch ? this.decodeHtmlEntities(metaDescMatch[1]).trim() : '';

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

    if (sourceUrl) {
      const existingSources = await KnowledgeRepo.findSourcesByTenant(tenantId);
      const existingUrlSource = existingSources.find(s => s.sourceUrl === sourceUrl);
      if (existingUrlSource) {
        await KnowledgeRepo.deleteSource(existingUrlSource.id, tenantId);
      }
    }

    const source = {
      id: newId('ks'),
      tenantId,
      type: 'url' as const,
      title: title.slice(0, 250),
      content: cleanText,
      sourceUrl: sourceUrl || 'http://localhost (Imported)',
      status: 'indexed' as const,
      updatedAt: new Date().toISOString(),
    };

    return await KnowledgeRepo.createSourceWithChunks(source, chunks, chatbotIds);
  }

  static async ingestTextDocument(
    tenantId: string,
    title: string,
    content: string,
    type: 'text' | 'faq' = 'text',
    chatbotIds: string[] = []
  ): Promise<KnowledgeSource> {
    const cleanContent = content.trim();
    if (cleanContent.length === 0) {
      throw new Error('Document content cannot be empty');
    }

    const chunks = this.chunkTextWithOverlap(cleanContent, 350, 40);

    const source = {
      id: newId('ks'),
      tenantId,
      type,
      title: title.slice(0, 200) || 'Custom Knowledge Document',
      content: cleanContent,
      sourceUrl: '',
      status: 'indexed' as const,
      updatedAt: new Date().toISOString(),
    };

    return await KnowledgeRepo.createSourceWithChunks(source, chunks, chatbotIds);
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
      // Structural elements
      .replace(/<\/(section|article|main|header|div|tr|blockquote)>/gi, '\n\n')
      .replace(/<td[^>]*>/gi, ' | ')
      // Convert heading tags to markdown
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n')
      .replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '\n\n#### $1\n\n')
      // List items & paragraphs
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n• $1')
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n')
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
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  /**
   * Ingests structured DOM text snapshot sent directly by the live widget embedded on the host website.
   */
  static async ingestClientDomSnapshot(
    chatbotId: string,
    tenantId: string,
    snapshotText: string,
    sourceUrl: string,
    sourceTitle: string
  ): Promise<KnowledgeSource> {
    const cleanContent = snapshotText.trim();
    if (!cleanContent || cleanContent.length < 15) {
      throw new Error('Snapshot content too short to index');
    }

    const title = (sourceTitle || 'Host Website Content').slice(0, 200);
    const chunks = this.chunkTextWithOverlap(cleanContent, 350, 40);

    // Replace previous snapshot from this same URL
    const existingSources = await KnowledgeRepo.findSourcesByBot(chatbotId, tenantId);
    const existing = existingSources.find(s => s.sourceUrl === sourceUrl);
    if (existing) {
      await KnowledgeRepo.deleteSource(existing.id, tenantId);
    }

    const source = {
      id: newId('ks'),
      tenantId,
      type: 'url' as const,
      title,
      content: cleanContent,
      sourceUrl,
      status: 'indexed' as const,
      updatedAt: new Date().toISOString(),
    };

    return await KnowledgeRepo.createSourceWithChunks(source, chunks, [chatbotId]);
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

  // In-memory cache to prevent repeated auto-crawls of the same domain within a 12-hour window
  private static domainCrawlCache = new Map<string, { timestamp: number; sourcesIndexed: number }>();
  private static domainInFlightCrawls = new Map<string, Promise<any>>();

  /**
   * Automatically detects and indexes the host website where the chatbot is embedded.
   * Handles immediate client DOM snapshot ingestion + background multi-page internal crawling.
   */
  static async autoDetectAndIngestHostSite(
    chatbotId: string,
    tenantId: string,
    params: {
      hostOrigin: string;
      hostUrl?: string;
      hostTitle?: string;
      clientDomSnapshot?: string;
    }
  ): Promise<{
    status: 'indexed' | 'cached' | 'processing';
    domain: string;
    sourcesIndexed: number;
    pagesCrawled: string[];
  }> {
    const { hostOrigin, hostUrl, hostTitle, clientDomSnapshot } = params;

    if (!hostOrigin || typeof hostOrigin !== 'string') {
      throw new Error('Valid host origin is required');
    }

    let parsedOrigin: URL;
    try {
      parsedOrigin = new URL(hostOrigin);
    } catch {
      throw new Error('Invalid host origin URL format');
    }

    const domainKey = `${chatbotId}:${parsedOrigin.hostname.toLowerCase()}`;
    const now = Date.now();
    const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

    // 1. If client snapshot is provided (e.g. from the active page in React/Next.js/Shopify),
    // ingest it immediately so the current page is indexed with zero latency.
    if (clientDomSnapshot && clientDomSnapshot.trim().length > 30) {
      try {
        await this.ingestClientDomSnapshot(
          chatbotId,
          tenantId,
          clientDomSnapshot,
          hostUrl || hostOrigin,
          hostTitle || `Live Site Content (${parsedOrigin.hostname})`
        );
      } catch (err: any) {
        console.log(`[Auto-Detect] Client snapshot ingest skipped:`, err.message);
      }
    }

    // 2. Check if this domain was already crawled recently for this bot
    const cached = this.domainCrawlCache.get(domainKey);
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return {
        status: 'cached',
        domain: parsedOrigin.hostname,
        sourcesIndexed: cached.sourcesIndexed,
        pagesCrawled: [hostUrl || hostOrigin],
      };
    }

    // 3. Prevent duplicate simultaneous crawls if multiple visitors open the site at once
    if (this.domainInFlightCrawls.has(domainKey)) {
      return {
        status: 'processing',
        domain: parsedOrigin.hostname,
        sourcesIndexed: 1,
        pagesCrawled: [hostOrigin],
      };
    }

    // 4. Launch domain crawl
    const crawlPromise = this.crawlEntireHostDomain(chatbotId, tenantId, parsedOrigin, hostUrl);
    this.domainInFlightCrawls.set(domainKey, crawlPromise);

    try {
      const crawlResult = await crawlPromise;
      this.domainCrawlCache.set(domainKey, {
        timestamp: now,
        sourcesIndexed: crawlResult.pagesCrawled.length,
      });
      return {
        status: 'indexed',
        domain: parsedOrigin.hostname,
        sourcesIndexed: crawlResult.pagesCrawled.length,
        pagesCrawled: crawlResult.pagesCrawled,
      };
    } finally {
      this.domainInFlightCrawls.delete(domainKey);
    }
  }

  /**
   * Internal helper: Crawls root and high-value same-domain pages, respecting robots.txt and SSRF rules.
   */
  private static async crawlEntireHostDomain(
    chatbotId: string,
    tenantId: string,
    originUrl: URL,
    initialPageUrl?: string
  ): Promise<{ pagesCrawled: string[] }> {
    const isLocalhost = originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1';
    if (isLocalhost) {
      // Localhost cannot be fetched by remote server; already handled via client DOM snapshot
      return { pagesCrawled: [initialPageUrl || originUrl.toString()] };
    }

    const pagesCrawled: string[] = [];
    const visitedUrls = new Set<string>();
    const disallowedPaths = await this.fetchRobotsDisallowedPaths(originUrl);

    // Queue of URLs to crawl on the same domain (up to 6 pages)
    const urlQueue: string[] = [originUrl.toString()];
    if (initialPageUrl && initialPageUrl !== originUrl.toString()) {
      urlQueue.push(initialPageUrl);
    }

    const MAX_PAGES_TO_CRAWL = 6;

    while (urlQueue.length > 0 && pagesCrawled.length < MAX_PAGES_TO_CRAWL) {
      const currentUrlStr = urlQueue.shift()!;
      let parsedCurrent: URL;
      try {
        parsedCurrent = new URL(currentUrlStr, originUrl);
      } catch {
        continue;
      }

      // Enforce strict same-origin boundary (no external domains)
      if (parsedCurrent.hostname.toLowerCase() !== originUrl.hostname.toLowerCase()) {
        continue;
      }

      const normalizedUrl = parsedCurrent.origin + parsedCurrent.pathname;
      if (visitedUrls.has(normalizedUrl)) {
        continue;
      }
      visitedUrls.add(normalizedUrl);

      // Check robots.txt Disallow paths
      const isDisallowed = disallowedPaths.some(p => parsedCurrent.pathname.startsWith(p));
      if (isDisallowed) {
        continue;
      }

      try {
        const validatedUrl = await this.validateUrlForSsrf(normalizedUrl);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(validatedUrl.toString(), {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NomadsChatAutoCrawler/1.0 (+https://nomadschat.ai/bot)',
            'Accept': 'text/html,application/xhtml+xml,text/plain',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) continue;
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
          continue;
        }

        const rawHtml = await res.text();
        if (rawHtml.length > 5 * 1024 * 1024) continue;

        // Extract title & meta description
        const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const extractedTitle = titleMatch ? this.decodeHtmlEntities(titleMatch[1]).trim() : '';

        const metaDescMatch = rawHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
        const metaDescription = metaDescMatch ? this.decodeHtmlEntities(metaDescMatch[1]).trim() : '';

        let cleanText = this.htmlToStructuredText(rawHtml);
        if (metaDescription && !cleanText.includes(metaDescription)) {
          cleanText = `Overview: ${metaDescription}\n\n${cleanText}`;
        }

        if (cleanText.length > 35000) {
          cleanText = cleanText.substring(0, 35000) + '\n... [content indexed up to 35,000 characters]';
        }

        if (cleanText.trim().length >= 40) {
          const title = extractedTitle || `Page: ${parsedCurrent.pathname || '/'}`;
          const chunks = this.chunkTextWithOverlap(cleanText, 350, 40);

          // Replace existing source for this specific URL if it exists
          const existingSources = await KnowledgeRepo.findSourcesByBot(chatbotId, tenantId);
          const existingUrlSource = existingSources.find(s => s.sourceUrl === normalizedUrl);
          if (existingUrlSource) {
            await KnowledgeRepo.deleteSource(existingUrlSource.id, tenantId);
          }

          const source = {
            id: newId('ks'),
            tenantId,
            type: 'url' as const,
            title: `${title} (${originUrl.hostname})`.slice(0, 250),
            content: cleanText,
            sourceUrl: normalizedUrl,
            status: 'indexed' as const,
            updatedAt: new Date().toISOString(),
          };

          await KnowledgeRepo.createSourceWithChunks(source, chunks, [chatbotId]);
          pagesCrawled.push(normalizedUrl);
        }

        // Extract new internal links from this page if we need more pages
        if (pagesCrawled.length < MAX_PAGES_TO_CRAWL) {
          const discoveredLinks = this.extractInternalLinks(rawHtml, originUrl);
          for (const link of discoveredLinks) {
            if (!visitedUrls.has(link) && !urlQueue.includes(link)) {
              urlQueue.push(link);
            }
          }
        }
      } catch (pageErr: any) {
        console.log(`[Auto-Crawler] Failed to crawl ${normalizedUrl}:`, pageErr.message);
      }
    }

    return { pagesCrawled };
  }

  /**
   * Extracts and prioritizes internal links from HTML.
   */
  private static extractInternalLinks(html: string, baseOrigin: URL): string[] {
    const linkMatches = html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi);
    const links: string[] = [];
    const priorityKeywords = ['about', 'service', 'pricing', 'product', 'faq', 'feature', 'doc', 'contact', 'help', 'support', 'terms', 'privacy', 'team'];

    for (const match of linkMatches) {
      const rawHref = match[1]?.trim();
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        continue;
      }

      // Ignore common static file extensions
      if (/\.(png|jpe?g|gif|webp|svg|css|js|woff2?|ttf|pdf|zip|rar|mp4|mp3|xml|json)$/i.test(rawHref)) {
        continue;
      }

      try {
        const resolved = new URL(rawHref, baseOrigin);
        if (resolved.hostname.toLowerCase() === baseOrigin.hostname.toLowerCase()) {
          const cleanUrl = resolved.origin + resolved.pathname;
          if (!links.includes(cleanUrl)) {
            links.push(cleanUrl);
          }
        }
      } catch {
        // Skip malformed URLs
      }
    }

    // Sort links: place high-priority keywords (about, services, pricing, faq) first
    links.sort((a, b) => {
      const aScore = priorityKeywords.some(k => a.toLowerCase().includes(k)) ? 1 : 0;
      const bScore = priorityKeywords.some(k => b.toLowerCase().includes(k)) ? 1 : 0;
      return bScore - aScore;
    });

    return links.slice(0, 15);
  }

  /**
   * Fetches and parses robots.txt Disallow rules
   */
  private static async fetchRobotsDisallowedPaths(originUrl: URL): Promise<string[]> {
    const disallowed: string[] = [];
    try {
      const robotsUrl = `${originUrl.origin}/robots.txt`;
      const validated = await this.validateUrlForSsrf(robotsUrl);
      const res = await fetch(validated.toString(), {
        headers: { 'User-Agent': 'Mozilla/5.0 NomadsChatAutoCrawler/1.0' },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const text = await res.text();
        const lines = text.split('\n');
        let appliesToAll = false;

        for (const line of lines) {
          const trimmed = line.trim();
          if (/^User-agent:\s*\*/i.test(trimmed)) {
            appliesToAll = true;
          } else if (/^User-agent:/i.test(trimmed)) {
            appliesToAll = false;
          } else if (appliesToAll && /^Disallow:\s*(.+)/i.test(trimmed)) {
            const match = trimmed.match(/^Disallow:\s*(.+)/i);
            if (match && match[1]) {
              disallowed.push(match[1].trim());
            }
          }
        }
      }
    } catch {
      // If robots.txt doesn't exist or errors, continue normally
    }
    return disallowed;
  }

  private static chunkTextWithOverlap(text: string, chunkSizeWords = 280, overlapWords = 30): string[] {
    const rawSections = text.split(/\n\s*---\s*\n|\n\s*={3,}\s*\n/).map(s => s.trim()).filter(Boolean);
    const chunks: string[] = [];

    for (const section of rawSections) {
      const words = section.split(/\s+/).filter(w => w.length > 0);
      if (words.length <= chunkSizeWords) {
        if (section.length > 10) {
          chunks.push(section);
        }
        continue;
      }

      // If a section is large, split by paragraphs first
      const paragraphs = section.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
      let currentChunk: string[] = [];
      let currentWordCount = 0;

      for (const para of paragraphs) {
        const paraWordCount = para.split(/\s+/).length;
        if (currentWordCount + paraWordCount > chunkSizeWords && currentChunk.length > 0) {
          chunks.push(currentChunk.join('\n\n'));
          currentChunk = [];
          currentWordCount = 0;
        }
        currentChunk.push(para);
        currentWordCount += paraWordCount;
      }

      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n\n'));
      }
    }

    if (chunks.length > 0) {
      return chunks;
    }

    // Standard word sliding window fallback
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length <= chunkSizeWords) {
      return [text];
    }

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
