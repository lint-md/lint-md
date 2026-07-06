import type { LintMdRule, PositionedTextNode } from '../types';
import { isChineseCharacter, isEnglishCharacter } from '../utils/char-helper';

const isChineseEnglishBoundary = (a: string, b: string): boolean => {
  return (isChineseCharacter(a) && isEnglishCharacter(b))
    || (isEnglishCharacter(a) && isChineseCharacter(b));
};

const spaceAroundAlphabet: LintMdRule = {
  meta: {
    name: 'space-around-alphabet'
  },
  create: (context) => {
    return {
      text: (node: PositionedTextNode) => {
        const { value } = node;

        const boundaries: number[] = [];
        for (let i = 0; i < value.length - 1; i++) {
          if (isChineseEnglishBoundary(value[i], value[i + 1])) {
            boundaries.push(i);
          }
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
