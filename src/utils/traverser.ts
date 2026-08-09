import type { PositionedMarkdownNode } from '@lint-md/parser';
import type { TraverserOptions } from '../types';
import { isNode } from './common';

const noop = () => {};

interface TraverseMarkdownOptions {
  enter?: (node: PositionedMarkdownNode, parent: PositionedMarkdownNode | null) => void
  leave?: (node: PositionedMarkdownNode, parent: PositionedMarkdownNode | null) => void
}

const traverseNode = (
  node: PositionedMarkdownNode | null,
  parent: PositionedMarkdownNode | null,
  options: TraverseMarkdownOptions
): void => {
  const { enter = noop, leave = noop } = options;

  const visit = (
    current: PositionedMarkdownNode | null,
    currentParent: PositionedMarkdownNode | null
  ): void => {
    if (!isNode(current)) {
      return;
    }

    enter(current, currentParent);

    const children = 'children' in current
      && Array.isArray((current as { children?: unknown }).children)
      ? (current as { children: PositionedMarkdownNode[] }).children
      : [];

    for (const child of children) {
      visit(child, current);
    }

    leave(current, currentParent);
  };

  visit(node, parent);
};

export const traverseMarkdown = (
  node: PositionedMarkdownNode | null,
  options: TraverseMarkdownOptions
): void => {
  traverseNode(node, null, options);
};

/** @deprecated Use traverseMarkdown. */
export const createTraverser = (options: TraverserOptions) => {
  const traversalOptions: TraverseMarkdownOptions = {
    enter: options.onEnter,
    leave: options.onLeave
  };

  return {
    traverse: (
      node: PositionedMarkdownNode | null,
      parent: PositionedMarkdownNode | null
    ): void => traverseNode(node, parent, traversalOptions)
  };
};
