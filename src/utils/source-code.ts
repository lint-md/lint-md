import type {
  MarkdownInlineCodeNode,
  MarkdownSourceMap,
  MarkdownTextNode as ParserMarkdownTextNode
} from '@lint-md/parser';
import { SourceMapUnavailableError } from '@lint-md/parser';
import type { LintSourceCode, MarkdownPosition, PositionedInlineCodeNode, PositionedMarkdownNode, PositionedMarkdownRoot, PositionedTextNode, ReportOption, ReportPosition, TextRange } from '../types';
import { InvalidRuleRangeError, isSourceMapError } from './source-code-errors';

interface SourceCodeOptions {
  text: string
  ast: PositionedMarkdownRoot
  sourceMap: MarkdownSourceMap
}

type ReportLocationInput =
  | { loc: ReportOption['loc'] }
  | { range: TextRange };

interface NormalizedReportLocation {
  loc: ReportOption['loc']
  range: TextRange
  usedFallback: boolean
}

/** Core report helpers that use the current document source. */
export interface ReportSourceCode extends LintSourceCode {
  getOffset(position: ReportPosition): number
  normalizeReportLocation(input: ReportLocationInput): NormalizedReportLocation
  getContext(range: TextRange, padding?: number): string
}

/** A usable offset is a finite, non-negative integer within an optional document length. */
export const isValidOffset = (
  value: unknown,
  length?: number
): value is number =>
  typeof value === 'number'
  && Number.isInteger(value)
  && value >= 0
  && (length === undefined || value <= length);

export const createLintSourceCode = ({
  text,
  ast,
  sourceMap
}: SourceCodeOptions): ReportSourceCode => {
  const lineStarts = buildLineStarts(text);

  const getPosition = (offset: number): MarkdownPosition => {
    if (!Number.isInteger(offset) || offset < 0 || offset > text.length) {
      throw new InvalidRuleRangeError(
        `getPosition: offset must be an integer in [0, ${text.length}], got ${offset}`
      );
    }
    return offsetToPosition(lineStarts, offset);
  };

  const getLocation = (range: TextRange): { start: MarkdownPosition; end: MarkdownPosition } => {
    const [start, end] = range;
    if (!Number.isInteger(start) || !Number.isInteger(end)
      || start < 0 || start > end || end > text.length) {
      throw new InvalidRuleRangeError(
        `getLocation: range must satisfy 0 <= start <= end <= ${text.length}, got [${start}, ${end}]`
      );
    }
    return {
      start: offsetToPosition(lineStarts, start),
      end: offsetToPosition(lineStarts, end)
    };
  };

  const getOffset = (position: ReportPosition): number => {
    if (isValidOffset(position.offset, text.length)) {
      return position.offset;
    }

    let lineStart = 0;
    if (position.line > lineStarts.length) {
      lineStart = text.length;
    }
    else if (position.line > 1) {
      lineStart = lineStarts[Math.ceil(position.line) - 1] ?? text.length;
    }

    return Math.min(
      text.length,
      lineStart + Math.max(0, position.column - 1)
    );
  };

  const normalizeReportLocation = (
    input: ReportLocationInput
  ): NormalizedReportLocation => {
    if ('range' in input) {
      return {
        loc: getLocation(input.range),
        range: input.range,
        usedFallback: false
      };
    }

    const usedFallback
      = !isValidOffset(input.loc.start.offset, text.length)
        || !isValidOffset(input.loc.end.offset, text.length);

    return {
      loc: input.loc,
      range: [getOffset(input.loc.start), getOffset(input.loc.end)],
      usedFallback
    };
  };

  const getContext = (range: TextRange, padding = 5): string => {
    const [start, end] = range;
    return text.slice(
      Math.max(0, start - padding),
      Math.min(text.length, end + padding)
    );
  };

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
      if (!Number.isInteger(valueStart) || !Number.isInteger(valueEnd)) {
        throw new InvalidRuleRangeError(
          `getTextRange: range must satisfy 0 <= start <= end <= ${node.value.length}, got [${valueStart}, ${valueEnd}]`
        );
      }

      try {
        const range = sourceMap.getSourceRange(
          node as unknown as ParserMarkdownTextNode | MarkdownInlineCodeNode,
          valueStart,
          valueEnd
        );
        return [range.start.offset, range.end.offset];
      }
      catch (error) {
        if (isSourceMapError(error)) {
          throw error;
        }
        if (error instanceof RangeError) {
          if (valueStart < 0 || valueStart > valueEnd || valueEnd > node.value.length) {
            throw new InvalidRuleRangeError(
              `getTextRange: range must satisfy 0 <= start <= end <= ${node.value.length}, got [${valueStart}, ${valueEnd}]`
            );
          }
          throw new SourceMapUnavailableError(error.message);
        }
        throw error;
      }
    },

    getPosition,
    getLocation,
    getOffset,
    normalizeReportLocation,
    getContext
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
