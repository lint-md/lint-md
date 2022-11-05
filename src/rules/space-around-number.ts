import type { MarkdownTextNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
import { markText } from '../utils/mark-text';

const isMarkedTextBetweenChineseAndNumber = (value: string) => {
  return value === 'ZN' || value === 'NZ';
};

const spaceAroundNumber: LintMdRule = {
  meta: {
    name: 'space-around-number'
  },
  create: (context) => {
    return {
      text: (node: MarkdownTextNode) => {
        const { value } = node;
        const markedText = markText(value);

        for (let i = 0; i < markedText.length - 1; i++) {
          const checkStrFragment = markedText.slice(i, i + 2);
          if (isMarkedTextBetweenChineseAndNumber(checkStrFragment)) {
            // 最终定位
            const loc = node.position;
            // start 定位到英文字符串前中文字符的位置，end 定位到英文字符串后中文字符的位置
            context.report({
              loc: {
                start: {
                  line: loc.start.line,
                  column: loc.start.column + i
                },
                end: {
                  line: loc.start.line,
                  column: loc.start.column + i + 2
                }
              },
              message: '中文与数字之间需要增加空格',
              fix: (fixer) => {
                // 将第 loc.start.offset + i + 1 位置处的字符替换成空格
                return fixer.insertTextAt(loc.start.offset + i + 1, ' ');
              }
            });
          }
        }
      }
    };
  }
};

export default spaceAroundNumber;
