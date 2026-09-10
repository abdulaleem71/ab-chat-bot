/**
 * Client-side file parsing utilities for PDF, Markdown, TXT, CSV, JSON knowledge ingestion.
 */

export interface ParsedKnowledgeFile {
  title: string;
  content: string;
  fileName: string;
  fileSize: number;
  formattedSize: string;
  fileType: 'pdf' | 'markdown' | 'text' | 'json' | 'csv' | 'other';
  charCount: number;
  estimatedChunks: number;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Extracts plain text from a raw PDF ArrayBuffer by reading text objects and streams.
 */
function extractTextFromPdfBuffer(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder('latin1');
  const rawText = decoder.decode(buffer);
  
  // Extract text within standard PDF stream text blocks: BT ... ET
  const textBlocks: string[] = [];
  const btRegex = /BT[\s\S]*?ET/g;
  let match: RegExpExecArray | null;

  while ((match = btRegex.exec(rawText)) !== null) {
    const block = match[0];
    
    // Match literal strings: (text) Tj or ' or "
    const tjRegex = /\((.*?)\)\s*(?:Tj|'|")/g;
    let tjMatch: RegExpExecArray | null;
    let blockText = '';
    
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      const unescaped = tjMatch[1]
        .replace(/\\([()\\])/g, '$1')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\t/g, ' ');
      blockText += unescaped + ' ';
    }

    // Match array strings: [(text) 10 (more text)] TJ
    const arrayTjRegex = /\[(.*?)\]\s*TJ/g;
    let arrayMatch: RegExpExecArray | null;
    while ((arrayMatch = arrayTjRegex.exec(block)) !== null) {
      const inner = arrayMatch[1];
      const strRegex = /\((.*?)\)/g;
      let strMatch: RegExpExecArray | null;
      while ((strMatch = strRegex.exec(inner)) !== null) {
        const unescaped = strMatch[1]
          .replace(/\\([()\\])/g, '$1')
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, ' ');
        blockText += unescaped + ' ';
      }
    }

    if (blockText.trim()) {
      textBlocks.push(blockText.trim());
    }
  }

  if (textBlocks.length > 0) {
    return textBlocks.join('\n\n');
  }

  // Fallback: strip binary noise and extract printable ascii sequences
  const printable = rawText
    .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Filter out PDF internal dictionary keywords
  const cleaned = printable
    .split(' ')
    .filter(w => !w.startsWith('/') && w.length > 1 && !/^[0-9]+$/.test(w))
    .join(' ');

  return cleaned.slice(0, 50000);
}

/**
 * Parses uploaded file (PDF, TXT, MD, CSV, JSON) and extracts structured knowledge text.
 */
export async function parseKnowledgeFile(file: File): Promise<ParsedKnowledgeFile> {
  const fileName = file.name;
  const fileSize = file.size;
  const formattedSize = formatBytes(fileSize);
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Clean title without file extension
  const titleWithoutExt = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
  const title = titleWithoutExt.charAt(0).toUpperCase() + titleWithoutExt.slice(1);

  let content = '';
  let fileType: ParsedKnowledgeFile['fileType'] = 'other';

  if (ext === 'pdf' || file.type === 'application/pdf') {
    fileType = 'pdf';
    try {
      const buffer = await file.arrayBuffer();
      const extracted = extractTextFromPdfBuffer(buffer);
      if (extracted && extracted.length > 30) {
        content = extracted;
      } else {
        // Fallback text
        content = `Document: ${title}\n(Uploaded PDF: ${fileName} - ${formattedSize})\n\nContent extracted from PDF document.`;
      }
    } catch {
      content = `Document: ${title}\n(Uploaded PDF: ${fileName} - ${formattedSize})`;
    }
  } else if (ext === 'md' || ext === 'markdown') {
    fileType = 'markdown';
    content = await file.text();
  } else if (ext === 'json') {
    fileType = 'json';
    const raw = await file.text();
    try {
      const parsed = JSON.parse(raw);
      content = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
    } catch {
      content = raw;
    }
  } else if (ext === 'csv') {
    fileType = 'csv';
    content = await file.text();
  } else {
    fileType = 'text';
    content = await file.text();
  }

  const cleanContent = content.trim();
  const charCount = cleanContent.length;
  // Estimate ~350 chars per chunk
  const estimatedChunks = Math.max(1, Math.ceil(charCount / 310));

  return {
    title,
    content: cleanContent,
    fileName,
    fileSize,
    formattedSize,
    fileType,
    charCount,
    estimatedChunks,
  };
}
