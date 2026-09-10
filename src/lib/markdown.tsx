import React, { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { GroundingSource } from '../types';
import { CitationBadge } from '../components/common/CitationComponents';

/**
 * Fenced Code Block with Syntax Header and Copy Action
 */
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono shadow-xs">
      <div className="px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between gap-2 text-[10px] text-zinc-400">
        <span className="font-semibold uppercase tracking-wider font-mono">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-zinc-800"
          title="Copy code snippet"
          aria-label={copied ? 'Code snippet copied' : 'Copy code snippet'}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto whitespace-pre leading-relaxed scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * Markdown Table Renderer
 */
const MarkdownTable: React.FC<{ lines: string[]; sources?: GroundingSource[] }> = ({ lines, sources }) => {
  if (lines.length < 2) return null;

  const parseRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());

  const headerCells = parseRow(lines[0]);
  // Line 1 is typically separator (|---|---|)
  const bodyRows = lines.slice(2).map(parseRow);

  return (
    <div className="my-2.5 overflow-x-auto rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
      <table className="min-w-full text-xs text-left divide-y divide-zinc-200">
        <thead className="bg-zinc-100/70 text-zinc-800 font-bold">
          <tr>
            {headerCells.map((cell, idx) => (
              <th key={idx} className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider">
                {formatInlineMarkdown(cell, sources)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 text-zinc-700">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-zinc-50/40' : 'bg-white'}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-2 text-xs leading-relaxed">
                  {formatInlineMarkdown(cell, sources)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export interface MarkdownContentProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
  sources?: GroundingSource[];
}

/**
 * Clean, high-craft Markdown renderer for chatbot replies.
 * Supports:
 * - Fenced code blocks with language labels & copy buttons
 * - Markdown tables
 * - Blockquotes
 * - Unordered & ordered lists
 * - Headings (H1, H2, H3, H4)
 * - Inline formatting (bold, italic, strikethrough, inline code, links)
 * - Interactive Citation Badges [1], [2] with popover preview
 * - Real-time animated typing cursor when isStreaming is active
 */
export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className = '',
  isStreaming = false,
  sources,
}) => {
  if (!content && !isStreaming) return null;

  // Split by code blocks first
  const blocks = (content || '').split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-2 text-xs leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.slice(3, -3).trim().split('\n');
          const language = lines.length > 1 && !lines[0].includes(' ') ? lines[0] : '';
          const code = language ? lines.slice(1).join('\n') : lines.join('\n');
          return <CodeBlock key={bIdx} code={code} language={language} />;
        }

        // Standard text lines
        const paragraphs = block.split(/\n\n+/);

        return (
          <React.Fragment key={bIdx}>
            {paragraphs.map((p, pIdx) => {
              const lines = p.trim().split('\n');
              if (!p.trim()) return null;

              // 1. Table Detection
              const isTable =
                lines.length >= 2 &&
                lines[0].includes('|') &&
                lines[1].includes('|') &&
                /^[\s|:-]+$/.test(lines[1]);

              if (isTable) {
                return <MarkdownTable key={pIdx} lines={lines} sources={sources} />;
              }

              // 2. Blockquote Detection
              const isBlockquote = lines.every(l => l.trim().startsWith('>'));
              if (isBlockquote) {
                const quoteText = lines.map(l => l.replace(/^>\s?/, '')).join('\n');
                return (
                  <blockquote
                    key={pIdx}
                    className="border-l-3 border-indigo-500 bg-indigo-50/40 px-3 py-2 rounded-r-xl my-2 text-zinc-700 italic text-xs leading-relaxed"
                  >
                    {formatInlineMarkdown(quoteText, sources)}
                  </blockquote>
                );
              }

              // 3. List Detection
              const isList = lines.every(l => /^\s*[-*•]\s+/.test(l) || /^\s*\d+\.\s+/.test(l));
              if (isList) {
                const isOrdered = /^\s*\d+\.\s+/.test(lines[0]);
                const ListTag = isOrdered ? 'ol' : 'ul';
                return (
                  <ListTag
                    key={pIdx}
                    className={`my-1.5 pl-5 space-y-1 ${isOrdered ? 'list-decimal' : 'list-disc'}`}
                  >
                    {lines.map((l, lIdx) => {
                      const itemText = l.replace(/^\s*([-*•]|\d+\.)\s+/, '');
                      return (
                        <li key={lIdx} className="pl-1">
                          {formatInlineMarkdown(itemText, sources)}
                        </li>
                      );
                    })}
                  </ListTag>
                );
              }

              // 4. Headings
              if (p.startsWith('# ')) {
                return (
                  <h2 key={pIdx} className="text-sm font-extrabold text-inherit mt-3 mb-1 font-heading">
                    {formatInlineMarkdown(p.slice(2), sources)}
                  </h2>
                );
              }
              if (p.startsWith('## ')) {
                return (
                  <h3 key={pIdx} className="text-xs font-bold text-inherit mt-2.5 mb-1 font-heading">
                    {formatInlineMarkdown(p.slice(3), sources)}
                  </h3>
                );
              }
              if (p.startsWith('### ')) {
                return (
                  <h4 key={pIdx} className="text-[11px] font-bold uppercase tracking-wider text-inherit mt-2 mb-0.5 font-heading">
                    {formatInlineMarkdown(p.slice(4), sources)}
                  </h4>
                );
              }

              // 5. Normal paragraph
              return (
                <p key={pIdx} className="my-1 whitespace-pre-line">
                  {formatInlineMarkdown(p, sources)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}

      {/* Streaming animated cursor indicator */}
      {isStreaming && (
        <span
          className="inline-block w-1.5 h-3.5 bg-current ml-1 translate-y-0.5 rounded-xs animate-pulse opacity-85"
          aria-label="Generating response"
        />
      )}
    </div>
  );
};

export function formatInlineMarkdown(text: string, sources?: GroundingSource[]): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyCounter = 0;

  while (remaining.length > 0) {
    // 1. Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <code
          key={keyCounter++}
          className="px-1.5 py-0.5 bg-zinc-200/70 text-zinc-900 rounded-md font-mono text-[11px] border border-zinc-300/60"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // 2. Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      parts.push(<strong key={keyCounter++} className="font-bold text-inherit">{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 3. Strikethrough: ~~text~~
    const strikeMatch = remaining.match(/^~~(.*?)~~/);
    if (strikeMatch) {
      parts.push(<del key={keyCounter++} className="line-through opacity-70">{strikeMatch[1]}</del>);
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // 4. Link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={keyCounter++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 hover:underline font-semibold break-all"
        >
          <span>{linkMatch[1]}</span>
          <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 5. Citation Pattern: [1], [2], [1, 2] or [Source 1]
    const citationMatch = remaining.match(/^\[(\d+)\]/);
    if (citationMatch) {
      const citeNum = parseInt(citationMatch[1], 10);
      const matchedSource = sources && sources.length >= citeNum ? sources[citeNum - 1] : sources?.[0];
      parts.push(
        <CitationBadge
          key={keyCounter++}
          index={citeNum}
          source={matchedSource}
        />
      );
      remaining = remaining.slice(citationMatch[0].length);
      continue;
    }

    // 6. Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      parts.push(<em key={keyCounter++}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Take next character or chunk up to next special char
    const nextSpecial = remaining.search(/[`*_~\[]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      parts.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      parts.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}
