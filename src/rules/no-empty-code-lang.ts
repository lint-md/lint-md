import type { LintMdRule, PositionedCodeNode } from '../types.js';

const noEmptyCodeLang: LintMdRule = {
  meta: {
    name: 'no-empty-code-lang'
  },
  create: (context) => {
    return {
      code: (node: PositionedCodeNode) => {
        if (node.lang) {
          return;
        }

        const sourceInfo = context.sourceCode.getCodeSourceInfo(node);
        if (sourceInfo.kind !== 'fenced') {
          return;
        }

        context.report({
          loc: node.position,
          message: '代码语言不能为空，请在代码块语法上增加语言',
          fix: fixer => fixer.insertTextAt(sourceInfo.infoInsertPoint.offset, 'plain')
        });
      }
    };
  }
};

export default noEmptyCodeLang;
