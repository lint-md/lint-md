import { MarkdownCodeNode } from '@lint-md/parser';
import { LintMdRule } from '../types';


/**
 * inline code 代码块内容不能为空
 * no-empty-inline-code
 *
 * @date 2021-12-05 19:35:14
 */
const noEmptyInlineCode: LintMdRule = {
  create: (context) => {
    return {
      inlineCode: (node: MarkdownCodeNode) => {
        if (!node.value || !node.value.trim()) {
          context.report({
            loc: node.position,
            message: '[lint-md] 行内代码块内容不能为空，请删除空的代码块，或者填充代码内容',
            fix: (fixer => {
              return fixer.removeRange([
                node.position.start.offset,
                node.position.end.offset
              ]);
            })
          });
        }
      }
    };
  }
};

export default noEmptyInlineCode;
