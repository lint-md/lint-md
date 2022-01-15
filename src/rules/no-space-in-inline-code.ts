import { LintMdRule, MarkdownNode } from '../types';

type MarkdownCodeNode = MarkdownNode & {
  value: string
}

/**
 * inline code 前后不能有空格
 * no-space-in-inline-code
 *
 * @date 2021-12-05 19:35:14
 */
const noSpaceInInlineCode: LintMdRule = {
  create: (context) => {
    return {
      inlineCode: (node: MarkdownCodeNode) => {
        if (node.value) {
          // trim 之后如果和源字符串不相同，说明首或尾有空格
          const trimmedText = node.value.trim();
          if (trimmedText !== node.value) {
            context.report({
              loc: node.position,
              message: '[lint-md] 行内代码内容，前后不能有空格，请删除行内代码中的前后空格',
              fix: (fixer => {
                return fixer.replaceTextRange([
                  node.position.start.offset,
                  node.position.end.offset
                ], `\`${trimmedText}\``);
              })
            });
          }
        }
      }
    };
  }
};

export default noSpaceInInlineCode;
