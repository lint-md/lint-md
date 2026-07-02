import type { LintMdRule, PositionedListItemNode } from '../types';

const noEmptyList: LintMdRule = {
  meta: {
    name: 'no-empty-list'
  },
  create: (context) => {
    return {
      listItem: (node: PositionedListItemNode) => {
        if (!node.children.length) {
          context.report({
            loc: node.position,
            message: '列表项不能为空，请删除空的列表项，或者填充内容',
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

export default noEmptyList;
