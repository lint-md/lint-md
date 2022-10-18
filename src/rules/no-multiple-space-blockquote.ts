import { MarkdownCodeNode } from '@lint-md/parser';
import { LintMdRule } from '../types';

const noMultipleSpaceBlockquote: LintMdRule = {
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
              message: 'blockquote should not have multiple space',
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
