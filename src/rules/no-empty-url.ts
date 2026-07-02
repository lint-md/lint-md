import type { MarkdownRoot, ParsedPosition } from '@lint-md/parser';
import { revertMdAstNode } from '@lint-md/parser';
import type { LintMdRule, LintMdRuleContext, PositionedImageNode, PositionedLinkNode } from '../types';

/**
 * 链接和图片节点共有的最小字段：url 可写、position 必填。
 * 用作通用参数类型，避免 Image 与 Link 类型不可互相赋值的限制。
 */
interface FixableNode {
  url: string
  position: ParsedPosition
}

const handleFixLinkNode = <T extends FixableNode>(context: LintMdRuleContext, node: T) => {
  if (node.url.trim() === '') {
    node.url = 'https://example.com';
    // revertMdAstNode 期望 Root，把单个 node 包成 Root
    const wrapped = { type: 'root', children: [node] } as unknown as MarkdownRoot;
    let newContent = revertMdAstNode(wrapped);
    if (newContent.endsWith('\n')) {
      newContent = newContent.slice(0, -1);
    }
    context.report({
      loc: node.position,
      message: '链接和图片地址不能为空',
      fix: (fixer) => {
        return fixer.replaceTextRange([
          node.position.start.offset,
          node.position.end.offset
        ], newContent);
      }
    });
  }
};

const noEmptyURL: LintMdRule = {
  meta: {
    name: 'no-empty-url'
  },
  create: (context) => {
    return {
      link: (node: PositionedLinkNode) => {
        handleFixLinkNode(context, node);
      },
      image: (node: PositionedImageNode) => {
        handleFixLinkNode(context, node);
      }
    };
  }
};

export default noEmptyURL;
