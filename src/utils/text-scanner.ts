import type { MarkdownNode } from '@lint-md/parser';

/** 文本匹配结果，包含相对位置和绝对位置 */
export interface TextMatch {
  /** 文本内相对 index */
  index: number
  /** 匹配长度 */
  length: number
  /** 文档内绝对位置 */
  loc: {
    start: { line: number; column: number }
    end: { line: number; column: number }
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
  private readonly _node: MarkdownNode;
  private readonly _startLine: number;
  private readonly _startColumn: number;
  private readonly _startOffset: number;

  constructor(node: MarkdownNode & { value: string }) {
    this._node = node;
    this._value = node.value;
    this._startLine = node.position.start.line;
    this._startColumn = node.position.start.column;
    this._startOffset = node.position.start.offset ?? 0;
  }

  /** 文本内容 */
  get value(): string {
    return this._value;
  }

  /** 原始节点 */
  get node(): MarkdownNode {
    return this._node;
  }

  /**
   * 将文本内相对 index + length 转换为绝对位置信息
   */
  toMatch(index: number, length: number): TextMatch {
    // 计算起始位置
    const startLine = this._startLine;
    const startColumn = this._startColumn + index;
    const startOffset = this._startOffset + index;

    // 计算结束位置：需要遍历中间的换行符
    let endLine = startLine;
    let endColumn = startColumn;
    for (let i = 0; i < length; i++) {
      const char = this._value[index + i];
      if (char === '\n') {
        endLine++;
        endColumn = 1;
      }
      else {
        endColumn++;
      }
    }

    return {
      index,
      length,
      loc: {
        start: { line: startLine, column: startColumn },
        end: { line: endLine, column: endColumn }
      },
      absoluteRange: [startOffset, startOffset + length]
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
      results.push(this.toMatch(matched.index, matched[0].length));
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
    const results: TextMatch[] = [];
    let startIndex = 0;

    while (startIndex < this._value.length) {
      const idx = this._value.indexOf(searchStr, startIndex);
      if (idx === -1)
        break;
      results.push(this.toMatch(idx, searchStr.length));
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
