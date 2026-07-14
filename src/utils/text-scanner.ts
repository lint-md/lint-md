import * as parseEntitiesNs from 'parse-entities';
import type { MarkdownTextNode } from './get-text-nodes';
import { now } from './time';

// parse-entities 使用 `export =`，需兼容 CommonJS 与 ESM 两种产物：
// 在 ESM 构建下命名空间对象本身不可调用，需取 .default。
const parseEntities = (parseEntitiesNs as { default?: typeof parseEntitiesNs }).default ?? parseEntitiesNs;

/** CommonMark 可转义标点集合（与解析器一致）。 */
const ESCAPABLE_PUNCTUATION = new Set('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'.split(''));

/**
 * 构建「归一化文本索引 -> 原始文档偏移」的前缀长度映射。
 *
 * 解析器返回的 `node.value` 是**已解码/去转义**的文本（如 `\\` -> `\`、
 * `\(` -> `(`、`&amp;` -> `&`），而 `node.position` 的 offset 指向**原始**
 * markdown 文本。两者在出现转义/实体的文本上长度不一致，导致基于
 * `value` 索引推算出的 fix offset 与 `applyFix` 实际操作的原始文档错位。
 *
 * 映射约定：`prefixLengths[k]` = `value[0..k)` 对应的原始文档字符数
 * （含第 0 项 0）。于是 `value[k]` 在原始文档中的字节起点偏移为
 * `node.position.start.offset + prefixLengths[k]`。
 *
 * @see issue #155
 */
const buildDecodePrefixLengths = (raw: string): number[] => {
  const prefixLengths: number[] = [0];
  let i = 0;
  while (i < raw.length) {
    const char = raw[i];

    if (char === '&') {
      // 注意：parse-entities 的 reference 回调第三个参数类型声明为 Location，
      // 但运行时实际传入的是该字符引用的原始源片段字符串（见 micromark 实现）。
      let entityRaw: string | '' = '';
      const refHandler = (_value: string, _pos: unknown, full: unknown) => {
        entityRaw = typeof full === 'string' ? full : '';
      };
      parseEntities(raw.slice(i), { text: () => {}, reference: refHandler as never });
      if (entityRaw !== '' && raw.startsWith(entityRaw, i)) {
        prefixLengths.push(prefixLengths[prefixLengths.length - 1] + entityRaw.length);
        i += entityRaw.length;
        continue;
      }
      prefixLengths.push(prefixLengths[prefixLengths.length - 1] + 1);
      i++;
      continue;
    }

    if (char === '\\' && i + 1 < raw.length && ESCAPABLE_PUNCTUATION.has(raw[i + 1])) {
      // 转义序列占两个原始字符，但归一化后只占一个字符。
      prefixLengths.push(prefixLengths[prefixLengths.length - 1] + 2);
      i += 2;
      continue;
    }

    prefixLengths.push(prefixLengths[prefixLengths.length - 1] + 1);
    i++;
  }
  return prefixLengths;
};

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
 * 文本扫描器，消除规则中重复的位置计算和迭代模板。
 *
 * 关键约定（见 issue #155）：规则匹配基于解析器返回的「归一化」文本
 * `node.value`，但 fix 的 offset 必须指向「原始」 markdown。因此 scanner
 * 同时持有 `node.value`（用于匹配）和原始文本切片（用于位置换算），通过
 * `decodePrefixLengths` 把归一化索引对齐到原始文档 offset / 行列号。
 *
 * 用法：
 *   const scanner = new TextScanner(node, markdown)
 *   const matches = scanner.findAllMatches(/[０-９]+/g)
 *   matches.forEach(m => context.report({ loc: m.loc, ... }))
 *
 * @param node     文本节点（含归一化 value 与原始 position）
 * @param markdown 原始 markdown 文本，用于把归一化索引换算回原始 offset。
 *                省略时退化为旧行为（value 即原始文本，映射为恒等）。
 */
export class TextScanner {
  private readonly _value: string;
  private readonly _node: MarkdownTextNode;
  private readonly _startLine: number;
  private readonly _startColumn: number;
  private readonly _startOffset: number;
  /** 原始文本切片（node 对应区间），用于位置换算。 */
  private readonly _raw: string;
  /** 原始切片内的换行索引，用于行列号换算。 */
  private _rawLineBreakIndices?: number[];
  /** value 索引 -> 原始文档前缀长度映射（见 buildDecodePrefixLengths）。 */
  private _decodePrefixLengths?: number[];

  constructor(node: MarkdownTextNode, markdown?: string) {
    this._node = node;
    this._value = node.value;
    this._startLine = node.position.start.line;
    this._startColumn = node.position.start.column;
    this._startOffset = node.position.start.offset;

    const rawSlice = markdown?.slice(node.position.start.offset, node.position.end.offset);
    // 无 markdown 或切片长度异常时退回 node.value，保持旧行为。
    this._raw = (rawSlice && rawSlice.length > 0) ? rawSlice : this._value;
  }

  /**
   * 原始切片换行索引，首次需要时构建（并累计诊断计数/耗时，见 issue #176）。
   */
  private get rawLineBreakIndices(): number[] {
    if (!this._rawLineBreakIndices) {
      const buildStart = now();
      const indices: number[] = [];
      for (let i = 0; i < this._raw.length; i++) {
        if (this._raw[i] === '\n') {
          indices.push(i);
        }
      }
      this._rawLineBreakIndices = indices;
      scannerIndexBuilds++;
      scannerIndexBuildWallTimeMs += now() - buildStart;
    }
    return this._rawLineBreakIndices;
  }

  /** 归一化索引 -> 原始文档前缀长度映射，首次需要时构建（见 issue #155）。 */
  private get decodePrefixLengths(): number[] {
    if (!this._decodePrefixLengths) {
      this._decodePrefixLengths = buildDecodePrefixLengths(this._raw);
    }
    return this._decodePrefixLengths;
  }

  /** 将「归一化 value 的索引」换算为「原始文档 offset」。 */
  private rawOffsetAt(index: number): number {
    const prefixLengths = this.decodePrefixLengths;
    const len = prefixLengths.length - 1;
    const clamped = index < 0 ? 0 : index > len ? len : index;
    return this._startOffset + prefixLengths[clamped];
  }

  /** 文本内容（归一化，用于匹配） */
  get value(): string {
    return this._value;
  }

  /** 原始节点 */
  get node(): MarkdownTextNode {
    return this._node;
  }

  /**
   * 计算归一化文本内某个 index 对应的「原始文档」位置。
   *
   * 通过前缀长度映射得到原始切片内的偏移，再基于原始切片换行索引换算行列号。
   */
  private positionAt(index: number): CharPosition {
    const rawRel = this.rawOffsetAt(index) - this._startOffset;
    const lb = this.rawLineBreakIndices;
    let lo = 0;
    let hi = lb.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (lb[mid] < rawRel) {
        lo = mid + 1;
      }
      else {
        hi = mid;
      }
    }
    // lo = 换行符在 rawRel 之前的数量（rawRel 处的换行符不算）
    const line = this._startLine + lo;
    const column = lo === 0
      ? this._startColumn + rawRel
      : rawRel - lb[lo - 1];

    const clampedIndex = Math.max(0, Math.min(index, this.decodePrefixLengths.length - 1));

    return {
      line,
      column,
      offset: this._startOffset + this.decodePrefixLengths[clampedIndex]
    };
  }

  /**
   * 将文本内相对 index + length 转换为绝对位置信息（基于原始文档）。
   */
  matchAt(index: number, length: number): TextMatch {
    const start = this.positionAt(index);
    const endPos = this.positionAt(index + length);
    const startOffset = this.rawOffsetAt(index);
    const endOffset = this.rawOffsetAt(index + length);

    return {
      index,
      length,
      loc: {
        start: { line: start.line, column: start.column, offset: startOffset },
        end: { line: endPos.line, column: endPos.column, offset: endOffset }
      },
      absoluteRange: [startOffset, endOffset]
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
   * 逐字符迭代，自动跟踪 line/column（均基于原始文档）。
   *
   * 注意：回调收到的 `offset` 是原始文档 offset，`index` 仍是归一化 value
   * 索引，便于规则基于 `value` 做字符判断。
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
    const prefixLengths = this.decodePrefixLengths;
    let line = this._startLine;
    let column = this._startColumn;

    for (let i = 0; i < this._value.length; i++) {
      const char = this._value[i];
      const runStart = prefixLengths[i];
      const runEnd = prefixLengths[i + 1];
      const offset = this._startOffset + runStart;

      callback(char, i, { line, column, offset });

      // 沿原始切片推进行列号（不构建二分换行索引，保持 issue #176 诊断行为）。
      for (let r = runStart; r < runEnd; r++) {
        if (this._raw[r] === '\n') {
          line++;
          column = 1;
        }
        else {
          column++;
        }
      }
    }
  }
}
