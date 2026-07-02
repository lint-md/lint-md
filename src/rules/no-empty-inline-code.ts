import type { MarkdownCodeNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
import { getNodePosition } from '../utils/common';

const noEmptyInlineCode: LintMdRule = {
  meta: {
    name: 'no-empty-inline-code'
  },
  create: (context) => {
    return {
      inlineCode: (node: MarkdownCodeNode) => {
        const loc = getNodePosition(node);
        if (!loc)
          return;

        if (!node.value || !node.value.trim()) {
          context.report({
            loc,
            message: '行内代码块内容不能为空，请删除空的代码块，或者填充代码内容',
            fix: (fixer) => {
              return fixer.removeRange([
                loc.start.offset!,
                loc.end.offset!
              ]);
            }
          });
        }
      }
    };
  }
};

export default noEmptyInlineCode;
