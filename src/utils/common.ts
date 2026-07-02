import type { MarkdownNode } from '@lint-md/parser';
import type { MarkdownLocation, MarkdownOffsetLocation, MarkdownPosition } from '../types';

/**
 * 判断是否为一个合法的 ast 节点
 *
 * @date 2021-12-12 22:01:31
 */
export const isNode = (x: unknown): x is MarkdownNode => {
  return x !== null && typeof x === 'object' && typeof (x as Record<string, unknown>).type === 'string';
};

/**
 * 获取节点的位置信息，确保 position 存在
 */
export const getNodePosition = (node: MarkdownNode): MarkdownLocation | null => {
  const position = (node as { position?: { start?: { line?: number; column?: number; offset?: number }; end?: { line?: number; column?: number; offset?: number } } }).position;
  if (!position?.start || !position?.end) {
    return null;
  }
  return {
    start: {
      line: position.start.line ?? 0,
      column: position.start.column ?? 0,
      offset: position.start.offset
    },
    end: {
      line: position.end.line ?? 0,
      column: position.end.column ?? 0,
      offset: position.end.offset
    }
  };
};

/**
 * 获取节点的起始位置
 */
export const getNodeStart = (node: MarkdownNode): MarkdownPosition | null => {
  const loc = getNodePosition(node);
  return loc?.start ?? null;
};

/**
 * 获取节点的结束位置
 */
export const getNodeEnd = (node: MarkdownNode): MarkdownPosition | null => {
  const loc = getNodePosition(node);
  return loc?.end ?? null;
};

/**
 * 获取节点的 offset 位置（用于 fix 操作，确保 offset 存在）
 */
export const getNodeOffsetPosition = (node: MarkdownNode): MarkdownOffsetLocation | null => {
  const loc = getNodePosition(node);
  if (!loc || typeof loc.start.offset !== 'number' || typeof loc.end.offset !== 'number') {
    return null;
  }
  return loc as MarkdownOffsetLocation;
};
