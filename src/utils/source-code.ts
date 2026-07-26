import type {
  MarkdownInlineCodeNode,
  MarkdownSourceMap,
  MarkdownTextNode as ParserMarkdownTextNode
} from '@lint-md/parser';
import type { LintSourceCode, MarkdownPosition, PositionedInlineCodeNode, PositionedMarkdownNode, PositionedMarkdownRoot, PositionedTextNode, TextRange } from '../types';

interface SourceCodeOptions {
  text: string
  ast: PositionedMarkdownRoot
  sourceMap: MarkdownSourceMap
}

export const createLintSourceCode = ({
  text,
  ast,
  sourceMap
}: SourceCodeOptions): LintSourceCode => {
  const lineStarts = buildLineStarts(text);

  return {
    text,
    ast,

    getRaw(node: PositionedMarkdownNode): string {
      return sourceMap.getRaw(node as any);
    },

    getTextRange(
      node: PositionedTextNode | PositionedInlineCodeNode,
      valueStart: number,
      valueEnd: number
    ): TextRange {
      const range = sourceMap.getSourceRange(
        node as unknown as ParserMarkdownTextNode | MarkdownInlineCodeNode,
        valueStart,
        valueEnd
      );
      return [range.start.offset, range.end.offset];
    },

    getPosition(offset: number): MarkdownPosition {
      if (!Number.isInteger(offset) || offset < 0 || offset > text.length) {
        throw new RangeError(`getPosition: offset must be an integer in [0, ${text.length}], got ${offset}`);
      }
      return offsetToPosition(lineStarts, offset);
    },

    getLocation(range: TextRange): { start: MarkdownPosition; end: MarkdownPosition } {
      const [start, end] = range;
      if (!Number.isInteger(start) || !Number.isInteger(end)
        || start < 0 || start > end || end > text.length) {
        throw new RangeError(
          `getLocation: range must satisfy 0 <= start <= end <= ${text.length}, got [${start}, ${end}]`
        );
      }
      return {
        start: offsetToPosition(lineStarts, start),
        end: offsetToPosition(lineStarts, end)
      };
    }
  };
};

function buildLineStarts(text: string): number[] {
  const starts: number[] = [0];
  let i = 0;
  while (i < text.length) {
    if (text.charCodeAt(i) === 0x0D && text.charCodeAt(i + 1) === 0x0A) {
      starts.push(i + 2);
      i += 2;
    }
    else if (text.charCodeAt(i) === 0x0D || text.charCodeAt(i) === 0x0A) {
      starts.push(i + 1);
      i += 1;
    }
    else {
      i += 1;
    }
  }
  return starts;
}

function offsetToPosition(
  lineStarts: number[],
  offset: number
): MarkdownPosition {
  let lo = 0;
  let hi = lineStarts.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (lineStarts[mid] <= offset) {
      lo = mid + 1;
    }
    else {
      hi = mid;
    }
  }
  const line = lo;
  const column = offset - lineStarts[line - 1] + 1;
  return { line, column, offset };
}
