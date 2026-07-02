import type { MarkdownTextNode } from './get-text-nodes';

/** 文本匹配结果，包含相对位置和绝对位置 */
export interface TextMatch {
  /** 文本内相对 index */
  index: number
  /** 匹配长度 */
  length: number
  /** 文档内绝对位置 */
  loc: {
    start: { line: number; column: number; offset: number }
    end: { line: number; column: number; offset: number }
  }
  /** 文档内绝对 offset 范围 */
  absoluteRange: [number, number]
}

/** 逐字符迭代时的位置信息 */
export interface CharPosition {
  line: number
  column: number
  offset: number
}

/**
 * 文本扫描器，消除规则中重复的位置计算和迭代模板
 *
 * 用法：
 *   const scanner = new TextScanner(node)
 *   const matches = scanner.findAllMatches(/[０-９]+/g)
 *   matches.forEach(m => context.report({ loc: m.loc, ... }))
 */
export class TextScanner {
  private readonly _value: string;
  private readonly _node: MarkdownTextNode;
  private readonly _startLine: number;
  private readonly _startColumn: number;
  private readonly _startOffset: number;

  constructor(node: MarkdownTextNode) {
    this._node = node;
    this._value = node.value;
    this._startLine = node.position.start.line;
    this._startColumn = node.position.start.column;
    this._startOffset = node.position.start.offset;
  }

  /** 文本内容 */
  get value(): string {
    return this._value;
  }

  /** 原始节点 */
  get node(): MarkdownTextNode {
    return this._node;
  }

  /**
   * 计算文本内某个 index 对应的文档位置
   *
   * Text nodes are typically small; a simple linear scan is clearer than caching.
   */
  private positionAt(index: number): CharPosition {
    let line = this._startLine;
    let column = this._startColumn;

    for (let i = 0; i < index; i++) {
      if (this._value[i] === '\n') {
        line++;
        column = 1;
      }
      else {
        column++;
      }
    }

    return {
      line,
      column,
      offset: this._startOffset + index
    };
  }

  /**
   * 将文本内相对 index + length 转换为绝对位置信息
   */
  matchAt(index: number, length: number): TextMatch {
    const start = this.positionAt(index);

    let endLine = start.line;
    let endColumn = start.column;
    for (let i = 0; i < length; i++) {
      if (this._value[index + i] === '\n') {
        endLine++;
        endColumn = 1;
      }
      else {
        endColumn++;
      }
    }

    const endOffset = start.offset + length;

    return {
      index,
      length,
      loc: {
        start: { line: start.line, column: start.column, offset: start.offset },
        end: { line: endLine, column: endColumn, offset: endOffset }
      },
      absoluteRange: [start.offset, endOffset]
    };
  }

  /**
   * 正则匹配所有结果，替代 while+exec 模板
   *
   * @example
   * const matches = scanner.findAllMatches(/[０-９]+/g)
   */
  findAllMatches(regex: RegExp): TextMatch[] {
    const results: TextMatch[] = [];
    // 确保正则有 g 标志
    const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);

    let matched = re.exec(this._value);
    while (matched !== null) {
      // 防止零长度匹配导致死循环（如 /\b/g、/^/gm）
      if (matched[0].length === 0) {
        re.lastIndex++;
        matched = re.exec(this._value);
        continue;
      }
      results.push(this.matchAt(matched.index, matched[0].length));
      matched = re.exec(this._value);
    }
    return results;
  }

  /**
   * 查找字符串所有出现位置，替代 indexOf 循环
   *
   * @example
   * const matches = scanner.findAllOccurrences('×')
   */
  findAllOccurrences(searchStr: string): TextMatch[] {
    if (searchStr.length === 0) {
      return [];
    }

    const results: TextMatch[] = [];
    let startIndex = 0;

    while (startIndex < this._value.length) {
      const idx = this._value.indexOf(searchStr, startIndex);
      if (idx === -1)
        break;
      results.push(this.matchAt(idx, searchStr.length));
      // Advance by 1 to allow overlapping occurrences
      startIndex = idx + 1;
    }
    return results;
  }

  /**
   * 逐字符迭代，自动跟踪 line/column
   *
   * @example
   * scanner.forEachChar((char, i, pos) => {
   *   if (shouldReport(char)) {
   *     context.report({
   *       loc: { start: pos, end: { line: pos.line, column: pos.column + 1 } },
   *       ...
   *     })
   *   }
   * })
   */
  forEachChar(callback: (char: string, index: number, pos: CharPosition) => void): void {
    let line = this._startLine;
    let column = this._startColumn;

    for (let i = 0; i < this._value.length; i++) {
      const char = this._value[i];
      callback(char, i, {
        line,
        column,
        offset: this._startOffset + i
      });

      if (char === '\n') {
        line++;
        column = 1;
      }
      else {
        column++;
      }
    }
  }
}
