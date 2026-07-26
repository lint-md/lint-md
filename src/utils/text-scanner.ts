import type { LintSourceCode, PositionedInlineCodeNode, PositionedTextNode } from '../types';
import type { MarkdownTextNode } from './get-text-nodes';

export interface TextMatch {
  index: number
  length: number
  loc: {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  }
  absoluteRange: [number, number]
}

export interface CharPosition {
  line: number
  column: number
  offset: number
  endOffset: number
}

/**
 * Scans a normalized text node and resolves every diagnostic/fix range through
 * the document SourceCode service.  Falls back to node-position arithmetic
 * when no source code is provided.
 */
export class TextScanner {
  private readonly _value: string;
  private readonly _node: MarkdownTextNode;
  private readonly _sourceCode?: LintSourceCode;
  private _lineBreakIndices?: number[];

  constructor(node: MarkdownTextNode, sourceCode?: LintSourceCode) {
    this._node = node;
    this._value = node.value;
    this._sourceCode = sourceCode;
  }

  get value(): string {
    return this._value;
  }

  get node(): MarkdownTextNode {
    return this._node;
  }

  private get lineBreakIndices(): number[] {
    if (!this._lineBreakIndices) {
      const indices: number[] = [];
      for (let i = 0; i < this._value.length; i++) {
        if (this._value[i] === '\n') {
          indices.push(i);
        }
      }
      this._lineBreakIndices = indices;
    }
    return this._lineBreakIndices;
  }

  private fallbackRange(start: number, end: number) {
    const pointAt = (index: number) => {
      const breaks = this.lineBreakIndices;
      let lo = 0;
      let hi = breaks.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (breaks[mid] < index) {
          lo = mid + 1;
        }
        else {
          hi = mid;
        }
      }
      return {
        line: this._node.position.start.line + lo,
        column: lo === 0
          ? this._node.position.start.column + index
          : index - breaks[lo - 1],
        offset: this._node.position.start.offset + index
      };
    };
    return { start: pointAt(start), end: pointAt(end) };
  }

  private fallbackPointAtLinear(index: number) {
    let line = this._node.position.start.line;
    let column = this._node.position.start.column;
    for (let i = 0; i < index; i++) {
      if (this._value[i] === '\n') {
        line++;
        column = 1;
      }
      else {
        column++;
      }
    }
    return { line, column, offset: this._node.position.start.offset + index };
  }

  private sourceRange(start: number, end: number) {
    if (!Number.isInteger(start) || !Number.isInteger(end)
      || start < 0 || end < start || end > this._value.length) {
      throw new RangeError(`TextScanner range out of bounds: [${start}, ${end}]`);
    }
    if (this._sourceCode) {
      const range = this._sourceCode.getTextRange(
        this._node as MarkdownTextNode as PositionedTextNode | PositionedInlineCodeNode,
        start,
        end
      );
      return this._sourceCode.getLocation(range);
    }
    return this.fallbackRange(start, end);
  }

  matchAt(index: number, length: number): TextMatch {
    const range = this.sourceRange(index, index + length);
    return {
      index,
      length,
      loc: range,
      absoluteRange: [range.start.offset, range.end.offset]
    };
  }

  findAllMatches(regex: RegExp): TextMatch[] {
    const results: TextMatch[] = [];
    const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
    let matched = re.exec(this._value);
    while (matched !== null) {
      if (matched[0].length === 0) {
        re.lastIndex++;
      }
      else {
        results.push(this.matchAt(matched.index, matched[0].length));
      }
      matched = re.exec(this._value);
    }
    return results;
  }

  findAllOccurrences(searchStr: string): TextMatch[] {
    if (!searchStr) {
      return [];
    }
    const results: TextMatch[] = [];
    for (let start = 0; start < this._value.length;) {
      const index = this._value.indexOf(searchStr, start);
      if (index === -1) {
        break;
      }
      results.push(this.matchAt(index, searchStr.length));
      start = index + 1;
    }
    return results;
  }

  /** Iterates Unicode code points so an atomic two-unit entity is visited once. */
  forEachChar(callback: (char: string, index: number, pos: CharPosition) => void): void {
    for (let index = 0; index < this._value.length;) {
      const char = String.fromCodePoint(this._value.codePointAt(index)!);
      const charIndex = index;
      const charLength = char.length;
      let range: ReturnType<TextScanner['sourceRange']> | undefined;
      const getRange = () => {
        range ??= this._sourceCode
          ? this.sourceRange(charIndex, charIndex + charLength)
          : {
              start: this.fallbackPointAtLinear(charIndex),
              end: this.fallbackPointAtLinear(charIndex + charLength)
            };
        return range;
      };
      const pos = Object.defineProperties({}, {
        line: { enumerable: true, get: () => getRange().start.line },
        column: { enumerable: true, get: () => getRange().start.column },
        offset: { enumerable: true, get: () => getRange().start.offset },
        endOffset: { enumerable: true, get: () => getRange().end.offset }
      }) as CharPosition;
      callback(char, index, pos);
      index += char.length;
    }
  }
}
