import type { LintMdRule, PositionedTextNode } from '../types.js';
import { isChineseCharacter, isNumberCharacter } from '../utils/char-helper.js';
import { TextScanner } from '../utils/text-scanner.js';

const spaceAroundNumber: LintMdRule = {
  meta: {
    name: 'space-around-number'
  },
  create: (context) => {
    return {
      text: (node: PositionedTextNode) => {
        const scanner = new TextScanner(node, context.sourceCode);
        const { value } = scanner;

        scanner.forEachChar((char, index) => {
          const nextCodePoint = value.codePointAt(index + char.length);
          const nextCharacter = nextCodePoint === undefined
            ? undefined
            : String.fromCodePoint(nextCodePoint);

          if (!nextCharacter) {
            return;
          }

          const isChineseNumBoundary = (isChineseCharacter(char) && isNumberCharacter(nextCharacter))
            || (isNumberCharacter(char) && isChineseCharacter(nextCharacter));

          const isPercentBoundary = char === '%'
            && index > 0
            && isChineseCharacter(nextCharacter)
            // Always safe: ASCII digits occupy a single UTF-16 code unit at index - 1
            && isNumberCharacter(value[index - 1]);

          if (isChineseNumBoundary || isPercentBoundary) {
            const reportMatch = scanner.matchAt(index, char.length + nextCharacter.length);
            context.report({
              range: reportMatch.absoluteRange,
              message: '中文与数字之间需要增加空格',
              fix: (fixer) => {
                const charMatch = scanner.matchAt(index, char.length);
                return fixer.insertTextAt(charMatch.absoluteRange[1], ' ');
              }
            });
          }
        });
      }
    };
  }
};

export default spaceAroundNumber;
