/**
 * 给定一个 Markdown 节点，递归寻找所有文本节点
 * @author YuZhanglong <loveyzl1123@gmail.com>
 */
import type { PositionedMarkdownNode } from '@lint-md/parser';

export type MarkdownTextNode = PositionedMarkdownNode & {
  value: string
};

const TEXT_NODE_TYPES = new Set(['text', 'inlineCode']);

const hasChildren = (node: PositionedMarkdownNode): node is PositionedMarkdownNode & { children: PositionedMarkdownNode[] } => {
  return 'children' in node && Array.isArray((node as { children?: unknown }).children);
};

export const getTextNodes = (node: PositionedMarkdownNode) => {
  const textNodes: MarkdownTextNode[] = [];

  // text / inlineCode 自带 value，结束递归
  if (TEXT_NODE_TYPES.has(node.type)) {
    const value = (node as { value?: string }).value;
    if (typeof value === 'string') {
      textNodes.push(node as MarkdownTextNode);
    }
    return textNodes;
  }

  if (hasChildren(node)) {
    for (const child of node.children) {
      textNodes.push(...getTextNodes(child));
    }
  }

  return textNodes;
};
