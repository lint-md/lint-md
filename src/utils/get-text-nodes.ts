/**
 * 给定一个 Markdown 节点，递归寻找所有文本节点
 * @author YuZhanglong <loveyzl1123@gmail.com>
 */
import type { MarkdownNode } from '@lint-md/parser';

type MarkdownTextNode = MarkdownNode & {
  value?: string
};

export const getTextNodes = (node: MarkdownTextNode) => {
  const textNodes: MarkdownTextNode[] = [];
  const textOnlyNode = ['text', 'inlineCode'];

  // 有 value 字段被认为是 textNode，结束递归
  if (textOnlyNode.includes(node.type)) {
    textNodes.push(node);
    return textNodes;
  }

  if (node.children) {
    const childNodes = node.children.reduce((prev, current) => {
      return prev.concat(getTextNodes(current as MarkdownTextNode));
    }, []);
    textNodes.push(...childNodes);
  }

  return textNodes;
};
