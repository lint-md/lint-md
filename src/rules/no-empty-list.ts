import type { MarkdownListItemNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
import { getNodeOffsetPosition } from '../utils/common';

const noEmptyList: LintMdRule = {
  meta: {
    name: 'no-empty-list'
  },
  create: (context) => {
    return {
      listItem: (node: MarkdownListItemNode) => {
        const loc = getNodeOffsetPosition(node);
        if (!loc)
          return;

        if (!node.children.length) {
          context.report({
            loc,
            message: '列表项不能为空，请删除空的列表项，或者填充内容',
            fix: (fixer) => {
              return fixer.removeRange([
                loc.start.offset,
                loc.end.offset
              ]);
            }
          });
        }
      }
    };
  }
};

export default noEmptyList;
