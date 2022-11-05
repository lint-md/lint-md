import type { MarkdownCodeNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';

const noLongCode: LintMdRule = {
  meta: {
    name: 'no-long-code'
  },
  create: (context) => {
    return {
      code: (node: MarkdownCodeNode) => {
        const { length: maxLength, exclude = [] } = context.options;
        // 选项中设置的排除语言不考虑
        if (exclude.includes(node.lang)) {
          return;
        }

        const codeArray = node.value.split('\n');
        for (let i = 0; i < codeArray.length; i++) {
          // 第 i 行超出限制
          if (codeArray[i].length > maxLength) {
            const firstLineInCodeArea = node.position.start.line;
            // code 代码块包括开头的三个点，所以三点处为第 firstLineInCodeArea 行，则 lint 问题出现在第 1 + i 行
            // 列数则从第一列开始
            const start = {
              line: firstLineInCodeArea + i,
              column: 1
            };

            // 很明显，结束处在同一行，列数则是该行的长度
            const end = {
              line: firstLineInCodeArea + i,
              column: codeArray[i].length
            };

            context.report({
              loc: {
                start,
                end
              },
              message: '代码块不能有过长的代码'
            });
          }
        }
      }
    };
  }
};

export default noLongCode;
