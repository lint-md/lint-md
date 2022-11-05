import type { MarkdownLinkNode } from '@lint-md/parser';
import { revertMdAstNode } from '@lint-md/parser';
import type { LintMdRule, LintMdRuleContext } from '../types';

const handleFixLinkNode = (context: LintMdRuleContext, node: MarkdownLinkNode) => {
  if (node.url.trim() === '') {
    node.url = 'https://example.com';
    let newContent = revertMdAstNode(node);
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
      link: (node: MarkdownLinkNode) => {
        handleFixLinkNode(context, node);
      },
      image: (node: MarkdownLinkNode) => {
        handleFixLinkNode(context, node);
      }
    };
  }
};

export default noEmptyURL;
