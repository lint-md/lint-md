import type { MarkdownNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
import { getNodePosition } from '../utils/common';

const noEmptyBlockquote: LintMdRule = {
  meta: {
    name: 'no-empty-blockquote'
  },
  create: (context) => {
    return {
      blockquote: (node: MarkdownNode) => {
        const blockquoteNode = node as MarkdownNode & { children?: unknown[] };
        const loc = getNodePosition(node);
        if (!loc)
          return;

        if (!blockquoteNode.children || blockquoteNode.children.length === 0) {
          context.report({
            fix(fixer) {
              return fixer.removeRange([
                loc.start.offset!,
                loc.end.offset!
              ]);
            },
            loc,
            message: '引用块内容不能为空'
          });
        }
      }
    };
  }
};

export default noEmptyBlockquote;
