import { MarkdownNode } from '@lint-md/parser';
import { LintMdRule } from '../types';

type MarkdownBlockquoteNode = MarkdownNode & {
  children: MarkdownNode[]
}

/**
 * code 代码块内容不能为空
 * no-empty-code
 *
 * @date 2021-12-05 19:35:14
 */
const noEmptyBlockquote: LintMdRule = {
  create: (context) => {
    return {
      blockquote: (node: MarkdownBlockquoteNode) => {
        if (!node.children.length) {
          context.report({
            loc: node.position,
            message: '[lint-md] blockquote 内容不能为空，删除空的 blockquote，或者填充内容。',
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

export default noEmptyBlockquote;
