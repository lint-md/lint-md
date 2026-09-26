import type {
  LintSourceCode,
  PositionedInlineCodeNode,
  PositionedTextNode,
  TextRange
} from '../types.js';
import type { MarkdownTextNode } from './get-text-nodes.js';

export interface TextMatch {
  index: number
  length: number
  absoluteRange: TextRange
}

type TextRangeResolver = (valueStart: number, valueEnd: number) => TextRange;
type ResolverSourceCode = LintSourceCode & {
  createTextRangeResolver?: (node: MarkdownTextNode) => TextRangeResolver
};

/**
 * Scans normalized text through the document SourceCode service.
 */
export class TextScanner {
  private readonly _value: string;
  private readonly _node: MarkdownTextNode;
  private readonly _sourceCode: LintSourceCode;
  private _resolveRange?: TextRangeResolver;

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

  matchAt(index: number, length: number): TextMatch {
    if (this._node.position.start.line === this._node.position.end.line) {
      const absoluteRange = this._sourceCode.getTextRange(
        this._node as MarkdownTextNode as PositionedTextNode | PositionedInlineCodeNode,
        index,
        index + length
      );
      return { index, length, absoluteRange };
    }

    const sourceCode = this._sourceCode as ResolverSourceCode;
    this._resolveRange ??= sourceCode.createTextRangeResolver?.(this._node)
      ?? ((valueStart, valueEnd) => this._sourceCode.getTextRange(
        this._node as MarkdownTextNode as PositionedTextNode | PositionedInlineCodeNode,
        valueStart,
        valueEnd
      ));
    const absoluteRange = this._resolveRange(index, index + length);
    return {
      index,
      length,
      absoluteRange
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
  forEachChar(callback: (char: string, index: number) => void): void {
    for (let index = 0; index < this._value.length;) {
      const char = String.fromCodePoint(this._value.codePointAt(index)!);
      callback(char, index);
      index += char.length;
    }
  }
}
