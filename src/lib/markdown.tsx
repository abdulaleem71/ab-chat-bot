import React from 'react';

/**
 * Clean, lightweight, zero-dependency Markdown renderer for chatbot replies.
 * Supports bold, italic, inline code, fenced code blocks, unordered lists,
 * ordered lists, headings, and safe external links.
 */
export const MarkdownContent: React.FC<{ content: string; className?: string }> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  // Split by code blocks first
  const blocks = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-2 text-sm leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const lines = block.slice(3, -3).trim().split('\n');
          const language = lines.length > 1 && !lines[0].includes(' ') ? lines[0] : '';
          const code = language ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div key={bIdx} className="my-2 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-mono">
              {language && (
                <div className="px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  {language}
                </div>
              )}
              <pre className="p-3 overflow-x-auto whitespace-pre leading-normal scrollbar-thin">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Standard text lines
        const paragraphs = block.split(/\n\n+/);

        return (
          <React.Fragment key={bIdx}>
            {paragraphs.map((p, pIdx) => {
              const lines = p.trim().split('\n');
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
                          {formatInlineMarkdown(itemText)}
                        </li>
                      );
                    })}
                  </ListTag>
                );
              }

              // Check if heading
              if (p.startsWith('### ')) {
                return (
                  <h4 key={pIdx} className="text-xs font-bold uppercase tracking-wider text-zinc-900 mt-2 mb-1">
                    {formatInlineMarkdown(p.slice(4))}
                  </h4>
                );
              }
              if (p.startsWith('## ')) {
                return (
                  <h3 key={pIdx} className="text-sm font-bold text-zinc-900 mt-3 mb-1">
                    {formatInlineMarkdown(p.slice(3))}
                  </h3>
                );
              }

              return (
                <p key={pIdx} className="my-1 whitespace-pre-line">
                  {formatInlineMarkdown(p)}
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

function formatInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to split by inline code, bold, links, and italic
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
          className="px-1.5 py-0.5 bg-zinc-200/80 text-zinc-900 rounded font-mono text-[12px]"
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
      parts.push(<strong key={keyCounter++} className="font-semibold text-inherit">{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // 3. Link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <a
          key={keyCounter++}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:underline font-medium break-all"
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // 4. Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      parts.push(<em key={keyCounter++}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Take next character or chunk up to next special char
    const nextSpecial = remaining.search(/[`*_\\[]/);
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
