import type { MarkdownTextNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
import { markText } from '../utils/mark-text';

const isMarkedTextBetweenChineseAndEnglish = (value: string) => {
  return value === 'ZA' || value === 'AZ';
};

const spaceAroundAlphabet: LintMdRule = {
  meta: {
    name: 'space-around-alphabet'
  },
  create: (context) => {
    return {
      text: (node: MarkdownTextNode) => {
        const { value } = node;
        const markedText = markText(value);

        const boundaries: number[] = [];

        for (let i = 0; i < markedText.length - 1; i++) {
          const checkStrFragment = markedText.slice(i, i + 2);
          if (isMarkedTextBetweenChineseAndEnglish(checkStrFragment)) {
            boundaries.push(i);
          }

          // // 最终定位
          // const loc = node.position;
          // // start 定位到英文字符串前中文字符的位置，end 定位到英文字符串后中文字符的位置
        }
        if (boundaries.length > 0) {
          let pos = 0;

          let newContent = boundaries.reduce((str, boundary) => {
            const newContent = `${str}${value.slice(pos, boundary + 1)} `;
            pos = boundary + 1;
            return newContent;
          }, '');

          newContent += value.slice(pos);

          context.report({
            loc: node.position,
            message: '中英文之间需要添加空格',
            fix: (fixer) => {
              // 将第 loc.start.offset + i + 1 位置处的字符替换成空格
              return fixer.replaceTextRange([
                node.position.start.offset,
                node.position.end.offset
              ], newContent);
            }
          });
        }
      }
    };
  }
};

export default spaceAroundAlphabet;
