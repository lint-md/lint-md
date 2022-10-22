import { MarkdownCodeNode } from '@lint-md/parser';
import { LintMdRule } from '../types';

const noSpaceInInlineCode: LintMdRule = {
  meta: {
    name: 'no-space-in-inline-code'
  },
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
