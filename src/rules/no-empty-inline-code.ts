import type { MarkdownCodeNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';

const noEmptyInlineCode: LintMdRule = {
  meta: {
    name: 'no-empty-inline-code'
  },
  create: (context) => {
    return {
      inlineCode: (node: MarkdownCodeNode) => {
        if (!node.value || !node.value.trim()) {
          context.report({
            loc: node.position,
            message: '行内代码块内容不能为空，请删除空的代码块，或者填充代码内容',
            fix: (fixer) => {
              return fixer.removeRange([
                node.position.start.offset,
                node.position.end.offset
              ]);
            }
          });
        }
      }
    };
  }
};

export default noEmptyInlineCode;
