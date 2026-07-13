import type { MarkdownTextNode } from './get-text-nodes';
import { now } from './time';

/**
 * TextScanner 索引构建诊断（仅供 benchmark / 单测观测使用）。
 * 仅记录「换行索引首次构建」的重复成本，用于判断是否有必要引入
 * 跨 scanner 的索引缓存（见 issue #176）。不涉及规则公共 API。
 */
let scannerIndexBuilds = 0;
let scannerIndexBuildWallTimeMs = 0;

export const getScannerDiagnostics = () => ({
  textScannerIndexBuilds: scannerIndexBuilds,
  textScannerIndexBuildWallTimeMs: scannerIndexBuildWallTimeMs
});

export const resetScannerDiagnostics = () => {
  scannerIndexBuilds = 0;
  scannerIndexBuildWallTimeMs = 0;
};

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
  private _lineBreakIndices?: number[];

  constructor(node: MarkdownTextNode) {
    this._node = node;
    this._value = node.value;
    this._startLine = node.position.start.line;
    this._startColumn = node.position.start.column;
    this._startOffset = node.position.start.offset;
  }

  /** 换行索引，首次需要时构建（并累计诊断计数/耗时） */
  private get lineBreakIndices(): number[] {
    if (!this._lineBreakIndices) {
      const buildStart = now();
      const indices: number[] = [];
      for (let i = 0; i < this._value.length; i++) {
        if (this._value[i] === '\n') {
          indices.push(i);
        }
      }
      this._lineBreakIndices = indices;
      scannerIndexBuilds++;
      scannerIndexBuildWallTimeMs += now() - buildStart;
    }
    return this._lineBreakIndices;
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
   * 使用预计算的换行索引 + 二分查找，复杂度 O(log k)，k = 换行数。
   */
  private positionAt(index: number): CharPosition {
    const lb = this.lineBreakIndices;
    let lo = 0;
    let hi = lb.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (lb[mid] < index) {
        lo = mid + 1;
      }
      else {
        hi = mid;
      }
    }
    // lo = 换行符在 index 之前的数量（index 处的换行符不算）
    const line = this._startLine + lo;
    const column = lo === 0
      ? this._startColumn + index
      : index - lb[lo - 1];

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
    const end = this.positionAt(index + length);
    const endOffset = start.offset + length;

    return {
      index,
      length,
      loc: {
        start: { line: start.line, column: start.column, offset: start.offset },
        end: { line: end.line, column: end.column, offset: endOffset }
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
