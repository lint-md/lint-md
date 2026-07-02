import type { PositionedMarkdownNode } from '@lint-md/parser';
import type { TraverserOptions } from '../types';
import { isNode } from './common';

const noop = () => {};

/**
 * 初始化遍历器
 *
 * @date 2021-12-12 22:04:25
 */
export const createTraverser = (options: TraverserOptions) => {
  const { onLeave = noop, onEnter = noop } = options;

  const traverse = (node: PositionedMarkdownNode | null, parent: PositionedMarkdownNode | null) => {
    if (!isNode(node)) {
      return;
    }

    onEnter(node, parent);

    const children = 'children' in node && Array.isArray((node as { children?: unknown }).children)
      ? (node as { children: PositionedMarkdownNode[] }).children
      : [];

    for (const child of children) {
      traverse(child, node);
    }

    onLeave(node, parent);
  };

  return {
    traverse
  };
};
