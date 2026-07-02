import type { MarkdownLinkNode } from '@lint-md/parser';
import { revertMdAstNode } from '@lint-md/parser';
import type { LintMdRule, LintMdRuleContext } from '../types';
import { getNodePosition } from '../utils/common';

const handleFixLinkNode = (context: LintMdRuleContext, node: MarkdownLinkNode) => {
  const loc = getNodePosition(node);
  if (!loc)
    return;

  if (node.url.trim() === '') {
    node.url = 'https://example.com';
    const rootNode = { type: 'root' as const, children: [node] };
    let newContent = revertMdAstNode(rootNode);
    if (newContent.endsWith('\n')) {
      newContent = newContent.slice(0, -1);
    }
    context.report({
      loc,
      message: '链接和图片地址不能为空',
      fix: (fixer) => {
        return fixer.replaceTextRange([
          loc.start.offset!,
          loc.end.offset!
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
