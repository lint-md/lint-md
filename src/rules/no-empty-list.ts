import { MarkdownListItemNode } from '@lint-md/parser';
import { LintMdRule } from '../types';


const noEmptyList: LintMdRule = {
  meta: {
    name: 'no-empty-list'
  },
  create: (context) => {
    return {
      listItem: (node: MarkdownListItemNode) => {
        if (!node.children.length) {
          context.report({
            loc: node.position,
            message: '[lint-md] 列表项不能为空，请删除空的列表项，或者填充内容'
          });
        }
      }
    };
  }
};

export default noEmptyList;
