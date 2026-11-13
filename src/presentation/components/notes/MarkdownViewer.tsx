import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface MarkdownViewerProps {
  content: string;
  onToggleChecklist?: (lineIndex: number, newChecked: boolean) => void;
  className?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  onToggleChecklist,
  className = '',
}) => {
  if (!content) {
    return <p className="text-xs italic text-[#6E687B]">Empty note</p>;
  }

  const lines = content.split('\n');

  // Helper to format inline bold, italic, code
  const renderInlineFormatted = (text: string) => {
    // Regex for bold **text**, italic *text*, code `code`
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Pattern matches `code`, **bold**, or *italic*
    const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const matchedStr = match[0];
      if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
        parts.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 rounded bg-black/8 font-mono text-[11px] text-[#5B4593]"
          >
            {matchedStr.slice(1, -1)}
          </code>
        );
      } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-[#292536]">
            {matchedStr.slice(2, -2)}
          </strong>
        );
      } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
        parts.push(
          <em key={keyIdx++} className="italic text-[#393344]">
            {matchedStr.slice(1, -1)}
          </em>
        );
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={`space-y-1.5 text-xs text-[#393344] leading-relaxed ${className}`}>
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // 1. Headings
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-base sm:text-lg font-bold text-[#292536] mt-2 mb-1">
              {renderInlineFormatted(line.slice(2))}
            </h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-sm sm:text-base font-bold text-[#292536] mt-2 mb-1">
              {renderInlineFormatted(line.slice(3))}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={index} className="text-xs sm:text-sm font-bold text-[#292536] mt-1.5 mb-1">
              {renderInlineFormatted(line.slice(4))}
            </h3>
          );
        }

        // 2. Checklists (- [ ] or - [x])
        const checklistMatch = line.match(/^(\s*)[-*]\s*\[([ xX])\]\s*(.*)$/);
        if (checklistMatch) {
          const indent = checklistMatch[1];
          const isChecked = checklistMatch[2].toLowerCase() === 'x';
          const itemText = checklistMatch[3];

          return (
            <div
              key={index}
              className="flex items-start gap-2 py-0.5 group cursor-pointer"
              style={{ marginLeft: `${indent.length * 8}px` }}
              onClick={() => onToggleChecklist && onToggleChecklist(index, !isChecked)}
            >
              <button
                type="button"
                className="mt-0.5 shrink-0 text-[#5D5868] group-hover:text-[#593F94] transition-colors"
                aria-label={isChecked ? 'Mark unchecked' : 'Mark checked'}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-[#3A8E6C] fill-[#B5DCCB]/30" />
                ) : (
                  <Square className="w-4 h-4 text-[#6E687B]" />
                )}
              </button>
              <span
                className={`flex-1 min-w-0 transition-all ${
                  isChecked
                    ? 'line-through text-[#6E687B]'
                    : 'text-[#393344]'
                }`}
              >
                {renderInlineFormatted(itemText)}
              </span>
            </div>
          );
        }

        // 3. Bullet lists (- item or * item)
        if (line.match(/^[-*]\s+/)) {
          return (
            <div key={index} className="flex items-start gap-2 pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6D56A8] mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">{renderInlineFormatted(line.replace(/^[-*]\s+/, ''))}</div>
            </div>
          );
        }

        // 4. Numbered lists (1. item)
        const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={index} className="flex items-start gap-2 pl-2">
              <span className="text-[11px] font-mono font-semibold text-[#6D56A8] w-4 shrink-0">
                {numMatch[1]}.
              </span>
              <div className="flex-1 min-w-0">{renderInlineFormatted(numMatch[2])}</div>
            </div>
          );
        }

        // 5. Blockquotes (> quote)
        if (line.startsWith('> ')) {
          return (
            <blockquote
              key={index}
              className="border-l-3 border-[#A995D8] pl-3 py-1 my-1 italic text-[#5D5868] bg-black/5 rounded-r-lg"
            >
              {renderInlineFormatted(line.slice(2))}
            </blockquote>
          );
        }

        // 6. Empty line
        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        // 7. Regular paragraph line
        return (
          <p key={index} className="leading-relaxed">
            {renderInlineFormatted(line)}
          </p>
        );
      })}
    </div>
  );
};
