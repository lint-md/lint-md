import { noop } from 'lodash';
import type { MarkdownNode } from '@lint-md/parser';
import type { TraverserOptions } from '../types';
import { isNode } from './common';

/**
 * 初始化遍历器
 *
 * @date 2021-12-12 22:04:25
 */
export const createTraverser = (options: TraverserOptions) => {
  const { onLeave = noop, onEnter = noop } = options;

  const traverse = (node: MarkdownNode, parent: MarkdownNode | null) => {
    if (!isNode(node)) {
      return;
    }

    onEnter(node, parent);

    const children = node?.children || [];

    // 递归处理各个子节点
    for (const child of children) {
      traverse(child as MarkdownNode, node);
    }

    onLeave(node, parent);
  };

  return {
    traverse
  };
};
