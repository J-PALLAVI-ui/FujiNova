import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, Sparkles, Compass } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
  isHana?: boolean;
  onAddPlaceToJourney?: (placeName: string) => void;
  onExploreIn3D?: () => void;
  isDarkBackground?: boolean;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  isHana = false,
  onAddPlaceToJourney: _onAddPlaceToJourney,
  onExploreIn3D,
  isDarkBackground = false
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Exact contrast tokens requested for light & dark backgrounds
  const headingColor = isDarkBackground ? '#FFFFFF' : '#29232B';
  const bodyColor = isDarkBackground ? '#F5EDF3' : '#403944';
  const secondaryColor = isDarkBackground ? '#D9CED8' : '#625966';
  const sakuraAccent = isDarkBackground ? '#FFB2D2' : '#A83F70';
  const linkColor = isDarkBackground ? '#FFD2E5' : '#87365E';

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

    const cleanSpeechText = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[#*`_~[\]]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

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
    const regex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+(?!\*)|(?<!_)_[^_]+(?<!_)|\[[^\]]+\]\([^)]+\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    let keyIdx = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(
          <span key={`txt_${keyIdx++}`} style={{ color: bodyColor }}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      const raw = match[0];

      if (raw.startsWith('`') && raw.endsWith('`')) {
        nodes.push(
          <code
            key={`code_${keyIdx++}`}
            className="px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold"
            style={{
              backgroundColor: isDarkBackground ? '#3D3740' : '#F3E7D9',
              color: isDarkBackground ? '#FFD2E5' : '#87365E',
              borderColor: isDarkBackground ? '#554C5A' : '#E2D5C4'
            }}
          >
            {raw.slice(1, -1)}
          </code>
        );
      } else if ((raw.startsWith('**') && raw.endsWith('**')) || (raw.startsWith('__') && raw.endsWith('__'))) {
        nodes.push(
          <strong
            key={`bold_${keyIdx++}`}
            className="font-bold tracking-wide"
            style={{ color: headingColor }}
          >
            {raw.slice(2, -2)}
          </strong>
        );
      } else if ((raw.startsWith('*') && raw.endsWith('*')) || (raw.startsWith('_') && raw.endsWith('_'))) {
        nodes.push(
          <em
            key={`em_${keyIdx++}`}
            className="italic font-medium"
            style={{ color: secondaryColor }}
          >
            {raw.slice(1, -1)}
          </em>
        );
      } else if (raw.startsWith('[') && raw.includes('](')) {
        const endTitle = raw.indexOf('](');
        const title = raw.substring(1, endTitle);
        const url = raw.substring(endTitle + 2, raw.length - 1);
        nodes.push(
          <a
            key={`link_${keyIdx++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors font-semibold"
            style={{ color: linkColor }}
          >
            {title}
          </a>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      nodes.push(
        <span key={`txt_${keyIdx++}`} style={{ color: bodyColor }}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return nodes.length > 0 ? nodes : [<span key="single" style={{ color: bodyColor }}>{text}</span>];
  };

  // Block parser: Handles code blocks, tables, headers, lists, quotes, paragraphs
  const renderBlocks = () => {
    const codeBlockRegex = /(```[a-zA-Z0-9_-]*\n[\s\S]*?\n```|```[\s\S]*?```)/g;
    const parts = content.split(codeBlockRegex);

    let codeBlockCount = 0;

    return parts.map((part, partIdx) => {
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
            className="my-3 rounded-xl border overflow-hidden shadow-md text-xs font-mono"
            style={{
              backgroundColor: '#1E1B20',
              borderColor: '#3D3740'
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-1.5 border-b text-[11px]"
              style={{
                backgroundColor: '#29232B',
                borderColor: '#3D3740',
                color: '#D9CED8'
              }}
            >
              <span className="font-bold uppercase tracking-wider" style={{ color: '#E9A5B5' }}>
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
            <pre className="p-3 text-[#F5EDF3] overflow-x-auto whitespace-pre-wrap leading-relaxed select-text font-mono">
              <code>{code.trim()}</code>
            </pre>
          </div>
        );
      }

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
          <div
            key={`table_${k}`}
            className="my-3 overflow-x-auto rounded-xl border shadow-xs"
            style={{
              borderColor: isDarkBackground ? '#554C5A' : '#E2D5C4',
              backgroundColor: isDarkBackground ? 'rgba(0,0,0,0.2)' : '#FFFFFF'
            }}
          >
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr
                  className="border-b font-bold"
                  style={{
                    backgroundColor: isDarkBackground ? '#3D3740' : '#FAF3EC',
                    borderColor: isDarkBackground ? '#554C5A' : '#E2D5C4',
                    color: headingColor
                  }}
                >
                  {headerRow.map((cell, cIdx) => (
                    <th
                      key={cIdx}
                      className="px-3 py-2 border-r last:border-r-0"
                      style={{ borderColor: isDarkBackground ? '#554C5A' : '#E2D5C4' }}
                    >
                      {formatInline(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="border-b last:border-b-0 transition-colors"
                    style={{
                      borderColor: isDarkBackground ? '#3D3740' : '#E2D5C4',
                      backgroundColor: rIdx % 2 === 0 ? (isDarkBackground ? 'transparent' : '#FFFFFF') : (isDarkBackground ? 'rgba(255,255,255,0.03)' : '#FAF6F0')
                    }}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3 py-2 border-r last:border-r-0"
                        style={{
                          borderColor: isDarkBackground ? '#3D3740' : '#E2D5C4',
                          color: bodyColor
                        }}
                      >
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

        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          if (/^\|[\s-:]+\|/.test(trimmed)) {
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

        if (!trimmed) {
          renderedLines.push(<div key={`spacer_${lIdx}`} className="h-2" />);
          continue;
        }

        // Headings
        if (trimmed.startsWith('#### ')) {
          renderedLines.push(
            <h4
              key={`h4_${lIdx}`}
              className="text-xs font-bold mt-2.5 mb-1 uppercase tracking-wider"
              style={{ color: secondaryColor }}
            >
              {formatInline(trimmed.replace(/^####\s+/, ''))}
            </h4>
          );
          continue;
        }
        if (trimmed.startsWith('### ')) {
          renderedLines.push(
            <h3
              key={`h3_${lIdx}`}
              className="text-sm font-bold mt-3 mb-1.5 flex items-center gap-1.5"
              style={{ color: headingColor }}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 inline" style={{ color: sakuraAccent }} />
              <span>{formatInline(trimmed.replace(/^###\s+/, ''))}</span>
            </h3>
          );
          continue;
        }
        if (trimmed.startsWith('## ')) {
          renderedLines.push(
            <h2
              key={`h2_${lIdx}`}
              className="text-base font-extrabold mt-3.5 mb-2 pb-1 border-b"
              style={{
                color: headingColor,
                borderColor: isDarkBackground ? '#554C5A' : '#E2D5C4'
              }}
            >
              {formatInline(trimmed.replace(/^##\s+/, ''))}
            </h2>
          );
          continue;
        }
        if (trimmed.startsWith('# ')) {
          renderedLines.push(
            <h1
              key={`h1_${lIdx}`}
              className="text-lg font-black mt-4 mb-2 pb-1 border-b"
              style={{
                color: headingColor,
                borderColor: isDarkBackground ? '#554C5A' : '#E2D5C4'
              }}
            >
              {formatInline(trimmed.replace(/^#\s+/, ''))}
            </h1>
          );
          continue;
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          renderedLines.push(
            <blockquote
              key={`quote_${lIdx}`}
              className="border-l-4 pl-3 py-1.5 my-2 rounded-r-lg italic text-xs leading-relaxed"
              style={{
                borderColor: sakuraAccent,
                backgroundColor: isDarkBackground ? 'rgba(255,255,255,0.06)' : '#FAF3EC',
                color: bodyColor
              }}
            >
              {formatInline(trimmed.replace(/^>\s+/, ''))}
            </blockquote>
          );
          continue;
        }

        // Bullet lists
        if (/^[-*+]\s+/.test(trimmed)) {
          const itemText = trimmed.replace(/^[-*+]\s+/, '');
          renderedLines.push(
            <div key={`bullet_${lIdx}`} className="flex items-start gap-2 my-1.5 ml-2 text-xs sm:text-sm leading-relaxed">
              <span className="font-extrabold shrink-0 mt-0.5 leading-none text-base" style={{ color: sakuraAccent }}>•</span>
              <div className="flex-1" style={{ color: bodyColor }}>{formatInline(itemText)}</div>
            </div>
          );
          continue;
        }

        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const itemText = numMatch[2];
          renderedLines.push(
            <div key={`num_${lIdx}`} className="flex items-start gap-2 my-1.5 ml-1 text-xs sm:text-sm leading-relaxed">
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px] font-bold shrink-0 mt-0.5"
                style={{
                  backgroundColor: isDarkBackground ? 'rgba(255,255,255,0.1)' : '#FAF3EC',
                  borderColor: sakuraAccent,
                  color: sakuraAccent
                }}
              >
                {num}
              </span>
              <div className="flex-1" style={{ color: bodyColor }}>{formatInline(itemText)}</div>
            </div>
          );
          continue;
        }

        // Horizontal rule
        if (/^---$|^\*\*\*$|^___$/.test(trimmed)) {
          renderedLines.push(
            <hr
              key={`hr_${lIdx}`}
              className="my-3 border-t"
              style={{ borderColor: isDarkBackground ? '#554C5A' : '#E2D5C4' }}
            />
          );
          continue;
        }

        // Regular paragraph
        renderedLines.push(
          <p
            key={`p_${lIdx}`}
            className="my-1.5 text-xs sm:text-sm leading-relaxed"
            style={{ color: bodyColor }}
          >
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
        <div
          className="mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] select-none"
          style={{
            borderColor: isDarkBackground ? '#554C5A' : '#EAE0D0',
            color: secondaryColor
          }}
        >
          <div className="flex items-center gap-2">
            {'speechSynthesis' in window && (
              <button
                type="button"
                onClick={handleToggleSpeech}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
                  isSpeaking
                    ? 'bg-[#A83F70]/20 border-[#A83F70] text-[#A83F70] animate-pulse'
                    : 'bg-[#FAF6F0] border-[#E2D5C4] hover:bg-[#F3E7D9] text-[#403944] hover:text-[#29232B]'
                }`}
                title={isSpeaking ? 'Stop audio playback' : 'Listen to Hana answer'}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3 h-3 text-[#A83F70]" />
                    <span className="font-bold">Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3 text-[#A83F70]" />
                    <span>Listen</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(content);
                setCopiedCodeIndex(-99);
                setTimeout(() => setCopiedCodeIndex(null), 2000);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6F0] border border-[#E2D5C4] hover:bg-[#F3E7D9] text-[#403944] hover:text-[#29232B] transition-colors cursor-pointer font-medium"
              title="Copy message to clipboard"
            >
              {copiedCodeIndex === -99 ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#625966]" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onExploreIn3D && (content.includes('Day 1') || content.includes('Route') || content.includes('Stop')) && (
              <button
                type="button"
                onClick={onExploreIn3D}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6F0] border border-[#C66B4E]/40 text-[#C66B4E] hover:bg-[#C66B4E] hover:text-white transition-all font-bold cursor-pointer shadow-xs"
                title="View itinerary route on 3D Digital Twin"
              >
                <Compass className="w-3 h-3" />
                <span>View in 3D</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
