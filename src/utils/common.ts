import type { MarkdownNode } from '@lint-md/parser';

/**
 * 判断是否为一个合法的 ast 节点
 *
 * @date 2021-12-12 22:01:31
 */
export const isNode = (x: unknown): x is MarkdownNode => {
  return x !== null && typeof x === 'object' && typeof (x as Record<string, unknown>).type === 'string';
};
