import { MarkdownNode } from '@lint-md/parser';
import { LintMdRule } from '../types';

type MarkdownListItemNode = MarkdownNode & {
  children: MarkdownNode[]
}

/**
 * code 代码块内容不能为空
 * no-empty-code
 *
 * @date 2021-12-05 19:35:14
 */
const noEmptyList: LintMdRule = {
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
