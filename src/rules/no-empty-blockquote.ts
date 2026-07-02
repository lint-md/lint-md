import type { LintMdRule, PositionedBlockquoteNode } from '../types';

const noEmptyBlockquote: LintMdRule = {
  meta: {
    name: 'no-empty-blockquote'
  },
  create: (context) => {
    return {
      blockquote: (node: PositionedBlockquoteNode) => {
        if (!node.children || node.children.length === 0) {
          context.report({
            fix(fixer) {
              return fixer.removeRange([
                node.position.start.offset,
                node.position.end.offset
              ]);
            },
            loc: node.position,
            message: '引用块内容不能为空'
          });
        }
      }
    };
  }
};

export default noEmptyBlockquote;
