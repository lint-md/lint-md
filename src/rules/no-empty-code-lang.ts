import { MarkdownCodeNode } from '@lint-md/parser';
import { LintMdRule } from '../types';

/**
 * 代码语言不能为空
 * no-empty-code-lang
 *
 * @date 2021-12-24 21:36:12
 */
const noEmptyCodeLang: LintMdRule = {
  create: (context) => {
    return {
      code: (node: MarkdownCodeNode) => {
        if (!node.lang) {
          context.report({
            loc: node.position,
            message: '[lint-md] 代码语言不能为空，请在代码块语法上增加语言',
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
