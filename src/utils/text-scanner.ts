import type {
  LintSourceCode,
  PositionedInlineCodeNode,
  PositionedTextNode,
  TextRange
} from '../types';
import type { MarkdownTextNode } from './get-text-nodes';
import { InvalidRuleRangeError } from './source-code-errors';

export interface TextMatch {
  index: number
  length: number
  loc: {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  }
  absoluteRange: TextRange
}

export interface CharPosition {
  line: number
  column: number
  offset: number
  endOffset: number
}

/**
 * Scans normalized text through the document SourceCode service.
 */
export class TextScanner {
  private readonly _value: string;
  private readonly _node: MarkdownTextNode;
  private readonly _sourceCode: LintSourceCode;

  constructor(node: MarkdownTextNode, sourceCode: LintSourceCode) {
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

  private sourceRange(start: number, end: number) {
    if (!Number.isInteger(start) || !Number.isInteger(end)
      || start < 0 || end < start || end > this._value.length) {
      throw new InvalidRuleRangeError(
        `TextScanner range out of bounds: [${start}, ${end}]`
      );
    }
    const range = this._sourceCode.getTextRange(
      this._node as MarkdownTextNode as PositionedTextNode | PositionedInlineCodeNode,
      start,
      end
    );
    return this._sourceCode.getLocation(range);
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
        range ??= this.sourceRange(charIndex, charIndex + charLength);
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
