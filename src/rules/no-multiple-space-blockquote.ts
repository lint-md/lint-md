import type { MarkdownCodeNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';

const noMultipleSpaceBlockquote: LintMdRule = {
  meta: {
    name: 'no-multiple-space-blockquote'
  },
  create: (context) => {
    return {
      blockquote: (node: MarkdownCodeNode) => {
        const blockQuoteColumn = node.position.start.column;
        const firstChild = node.children[0];
        if (firstChild) {
          const blockQuoteFirstChildColumn = firstChild.position.start.column;
          const deltaColumn = blockQuoteFirstChildColumn - blockQuoteColumn;
          if (deltaColumn !== 2) {
            const fixStartRange = node.position.start.offset + 1;
            const fixEndRange = deltaColumn > 0 ? node.position.start.offset + deltaColumn : fixStartRange + 1;

            context.report({
              loc: node.position,
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
