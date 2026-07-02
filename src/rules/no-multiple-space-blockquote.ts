import type { MarkdownNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
import { getNodeOffsetPosition, getNodePosition } from '../utils/common';

const noMultipleSpaceBlockquote: LintMdRule = {
  meta: {
    name: 'no-multiple-space-blockquote'
  },
  create: (context) => {
    return {
      blockquote: (node: MarkdownNode) => {
        const loc = getNodeOffsetPosition(node);
        if (!loc)
          return;

        const blockquoteNode = node as MarkdownNode & { children?: Array<{ position?: { start?: { column?: number } } }> };
        const blockQuoteColumn = loc.start.column;
        const firstChild = blockquoteNode.children?.[0];
        if (firstChild) {
          const firstChildLoc = getNodePosition(firstChild as MarkdownNode);
          if (!firstChildLoc)
            return;

          const blockQuoteFirstChildColumn = firstChildLoc.start.column;
          const deltaColumn = blockQuoteFirstChildColumn - blockQuoteColumn;
          if (deltaColumn !== 2) {
            const fixStartRange = loc.start.offset + 1;
            const fixEndRange = deltaColumn > 0 ? loc.start.offset + deltaColumn : fixStartRange + 1;

            context.report({
              loc,
              message: '块引用只允许有一个空格',
              fix: (fixer) => {
                return fixer.replaceTextRange(
                  [fixStartRange, fixEndRange],
                  ' '
                );
              }
            });
          }
        }
      }
    };
  }
};

export default noMultipleSpaceBlockquote;
