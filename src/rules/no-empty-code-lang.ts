import type { MarkdownCodeNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';

const noEmptyCodeLang: LintMdRule = {
  meta: {
    name: 'no-empty-code-lang'
  },
  create: (context) => {
    return {
      code: (node: MarkdownCodeNode) => {
        if (!node.lang) {
          context.report({
            loc: node.position,
            message: '代码语言不能为空，请在代码块语法上增加语言',
            fix: (fixer) => {
              return fixer.insertTextAfterRange([
                node.position.start.offset,
                // + 3 的原因是代码块以 ``` 开头
                node.position.start.offset + 3
              ], 'plain');
            }
          });
        }
      }
    };
  }
};

export default noEmptyCodeLang;
