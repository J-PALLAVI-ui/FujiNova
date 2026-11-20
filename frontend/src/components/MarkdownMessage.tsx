import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, Sparkles, Compass } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
  isHana?: boolean;
  onAddPlaceToJourney?: (placeName: string) => void;
  onExploreIn3D?: () => void;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  isHana = false,
  onAddPlaceToJourney: _onAddPlaceToJourney,
  onExploreIn3D
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Copy helper
  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Text to speech helper
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip code blocks and markdown markers for speech
    const cleanSpeechText = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[#*`_~[\]]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Detect if Japanese text
    if (/[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(cleanSpeechText)) {
      utterance.lang = 'ja-JP';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Inline markdown formatter: bold (**text**), italic (*text*), inline code (`code`), links ([text](url))
  const formatInline = (text: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    // Tokenizer regex for inline patterns
    // 1: `code`
    // 2: **bold** or __bold__
    // 3: *italic* or _italic_
    // 4: [text](url)
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+(?!\*)|(?<!_)_[^_]+(?<!_)|\[[^\]]+\]\([^)]+\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    let keyIdx = 0;
    while ((match = regex.exec(text)) !== null) {
      // Add preceding plain text
      if (match.index > lastIndex) {
        nodes.push(
          <span key={`txt_${keyIdx++}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      const raw = match[0];

      if (raw.startsWith('`') && raw.endsWith('`')) {
        // Inline code
        nodes.push(
          <code
            key={`code_${keyIdx++}`}
            className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-750 text-pink-300 font-mono text-[11px] font-semibold"
          >
            {raw.slice(1, -1)}
          </code>
        );
      } else if ((raw.startsWith('**') && raw.endsWith('**')) || (raw.startsWith('__') && raw.endsWith('__'))) {
        // Bold
        nodes.push(
          <strong key={`bold_${keyIdx++}`} className="font-bold text-white tracking-wide">
            {raw.slice(2, -2)}
          </strong>
        );
      } else if ((raw.startsWith('*') && raw.endsWith('*')) || (raw.startsWith('_') && raw.endsWith('_'))) {
        // Italic
        nodes.push(
          <em key={`em_${keyIdx++}`} className="italic text-slate-200">
            {raw.slice(1, -1)}
          </em>
        );
      } else if (raw.startsWith('[') && raw.includes('](')) {
        // Link
        const endTitle = raw.indexOf('](');
        const title = raw.substring(1, endTitle);
        const url = raw.substring(endTitle + 2, raw.length - 1);
        nodes.push(
          <a
            key={`link_${keyIdx++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 underline underline-offset-2 hover:text-sky-300 transition-colors"
          >
            {title}
          </a>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      nodes.push(<span key={`txt_${keyIdx++}`}>{text.substring(lastIndex)}</span>);
    }

    return nodes.length > 0 ? nodes : [<span key="single">{text}</span>];
  };

  // Block parser: Handles code blocks, tables, headers, lists, quotes, paragraphs
  const renderBlocks = () => {
    // 1. Split code blocks (```lang ... ```)
    const codeBlockRegex = /(```[a-zA-Z0-9_-]*\n[\s\S]*?\n```|```[\s\S]*?```)/g;
    const parts = content.split(codeBlockRegex);

    let codeBlockCount = 0;

    return parts.map((part, partIdx) => {
      // Is code block
      if (part.startsWith('```') && part.endsWith('```')) {
        const index = codeBlockCount++;
        const inner = part.slice(3, -3);
        const firstNewline = inner.indexOf('\n');
        let language = '';
        let code = inner;

        if (firstNewline !== -1) {
          const firstLine = inner.substring(0, firstNewline).trim();
          if (/^[a-zA-Z0-9_-]+$/.test(firstLine)) {
            language = firstLine;
            code = inner.substring(firstNewline + 1);
          }
        }

        const isCopied = copiedCodeIndex === index;

        return (
          <div
            key={`block_${partIdx}`}
            className="my-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-md text-xs font-mono"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
              <span className="font-bold text-sky-400 uppercase tracking-wider">
                {language || 'code'}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(code.trim(), index)}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                title="Copy code to clipboard"
              >
                {isCopied ? (
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
            <pre className="p-3 text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text">
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      }

      // Regular text: split by lines and handle headers, lists, tables, quotes
      const lines = part.split('\n');
      const renderedLines: React.ReactNode[] = [];
      let inTable = false;
      let tableRows: string[][] = [];

      const flushTable = (k: number) => {
        if (tableRows.length === 0) return null;
        const headerRow = tableRows[0];
        const dataRows = tableRows.slice(1);
        tableRows = [];
        inTable = false;

        return (
          <div key={`table_${k}`} className="my-2.5 overflow-x-auto rounded-xl border border-slate-800 shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-sky-300 font-bold">
                  {headerRow.map((cell, cIdx) => (
                    <th key={cIdx} className="px-3 py-2 border-r border-slate-800 last:border-r-0">
                      {formatInline(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`border-b border-slate-800/60 last:border-b-0 ${
                      rIdx % 2 === 0 ? 'bg-slate-950/40' : 'bg-slate-900/30'
                    } hover:bg-slate-800/40 transition-colors`}
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 border-r border-slate-800/60 last:border-r-0 text-slate-200">
                        {formatInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      };

      for (let lIdx = 0; lIdx < lines.length; lIdx++) {
        const rawLine = lines[lIdx];
        const trimmed = rawLine.trim();

        // 1. Table check
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          // Check if separator line (|---|---|)
          if (/^\|[\s-:]+\|/.test(trimmed)) {
            // separator, ignore row
            continue;
          }
          const cells = trimmed
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());
          if (!inTable) {
            inTable = true;
            tableRows = [cells];
          } else {
            tableRows.push(cells);
          }
          continue;
        } else if (inTable) {
          renderedLines.push(flushTable(lIdx));
        }

        // Empty line
        if (!trimmed) {
          renderedLines.push(<div key={`spacer_${lIdx}`} className="h-2" />);
          continue;
        }

        // 2. Headings
        if (trimmed.startsWith('#### ')) {
          renderedLines.push(
            <h4 key={`h4_${lIdx}`} className="text-xs font-bold text-slate-200 mt-2 mb-1 uppercase tracking-wider">
              {formatInline(trimmed.replace(/^####\s+/, ''))}
            </h4>
          );
          continue;
        }
        if (trimmed.startsWith('### ')) {
          renderedLines.push(
            <h3 key={`h3_${lIdx}`} className="text-sm font-bold text-pink-300 mt-2.5 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0 inline" />
              <span>{formatInline(trimmed.replace(/^###\s+/, ''))}</span>
            </h3>
          );
          continue;
        }
        if (trimmed.startsWith('## ')) {
          renderedLines.push(
            <h2 key={`h2_${lIdx}`} className="text-base font-bold text-sky-300 mt-3 mb-1.5 pb-0.5 border-b border-slate-800">
              {formatInline(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
          continue;
        }
        if (trimmed.startsWith('# ')) {
          renderedLines.push(
            <h1 key={`h1_${lIdx}`} className="text-lg font-black text-white mt-3.5 mb-2 pb-1 border-b border-slate-700">
              {formatInline(trimmed.replace(/^#\s+/, ''))}
            </h1>
          );
          continue;
        }

        // 3. Blockquotes
        if (trimmed.startsWith('> ')) {
          renderedLines.push(
            <blockquote
              key={`quote_${lIdx}`}
              className="border-l-3 border-pink-500 pl-3 py-1 my-1.5 bg-pink-950/20 rounded-r-lg text-slate-300 italic text-xs leading-relaxed"
            >
              {formatInline(trimmed.replace(/^>\s+/, ''))}
            </blockquote>
          );
          continue;
        }

        // 4. Bullet lists
        if (/^[-*+]\s+/.test(trimmed)) {
          const itemText = trimmed.replace(/^[-*+]\s+/, '');
          renderedLines.push(
            <div key={`bullet_${lIdx}`} className="flex items-start gap-2 my-1 ml-2 text-xs leading-relaxed">
              <span className="text-pink-400 font-bold shrink-0 mt-0.5 leading-none">•</span>
              <div className="flex-1 text-slate-200">{formatInline(itemText)}</div>
            </div>
          );
          continue;
        }

        // 5. Numbered lists (1. , 2. )
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const itemText = numMatch[2];
          renderedLines.push(
            <div key={`num_${lIdx}`} className="flex items-start gap-2 my-1 ml-1 text-xs leading-relaxed">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-sky-950 border border-sky-500/40 text-sky-400 text-[10px] font-bold shrink-0 mt-0.5">
                {num}
              </span>
              <div className="flex-1 text-slate-200">{formatInline(itemText)}</div>
            </div>
          );
          continue;
        }

        // 6. Horizontal rule
        if (/^---$|^\*\*\*$|^___$/.test(trimmed)) {
          renderedLines.push(<hr key={`hr_${lIdx}`} className="my-3 border-slate-800" />);
          continue;
        }

        // 7. Regular paragraph
        renderedLines.push(
          <p key={`p_${lIdx}`} className="my-1 text-xs leading-relaxed text-slate-200">
            {formatInline(trimmed)}
          </p>
        );
      }

      if (inTable) {
        renderedLines.push(flushTable(lines.length));
      }

      return <div key={`part_${partIdx}`}>{renderedLines}</div>;
    });
  };

  return (
    <div className="markdown-body space-y-1">
      {renderBlocks()}

      {/* Hana Interactive Action Bar at bottom of AI responses */}
      {isHana && content.length > 30 && (
        <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 select-none">
          <div className="flex items-center gap-2">
            {/* Audio Voice Speech */}
            {'speechSynthesis' in window && (
              <button
                type="button"
                onClick={handleToggleSpeech}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                  isSpeaking
                    ? 'bg-pink-600/30 border-pink-500 text-pink-300 animate-pulse'
                    : 'bg-slate-900 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
                title={isSpeaking ? 'Stop audio playback' : 'Listen to Hana answer'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3 h-3 text-pink-400" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3 text-pink-400" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            )}

            {/* Copy Response */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(content);
                setCopiedCodeIndex(-99);
                setTimeout(() => setCopiedCodeIndex(null), 2000);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copy message to clipboard"
            >
              {copiedCodeIndex === -99 ? (
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

          <div className="flex items-center gap-2">
            {/* View in 3D Route button if route or destinations mentioned */}
            {onExploreIn3D && (content.includes('Day 1') || content.includes('Route') || content.includes('Stop')) && (
              <button
                type="button"
                onClick={onExploreIn3D}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/50 text-sky-400 hover:bg-sky-900/60 transition-all font-semibold cursor-pointer"
                title="View itinerary route on 3D Digital Twin"
              >
                <Compass className="w-3 h-3 text-sky-400" />
                <span>View in 3D</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
