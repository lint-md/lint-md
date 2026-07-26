import type { LintMdRule, PositionedTextNode } from '../types';
import { isChineseCharacter, isNumberCharacter } from '../utils/char-helper';
import { TextScanner } from '../utils/text-scanner';

const spaceAroundNumber: LintMdRule = {
  meta: {
    name: 'space-around-number'
  },
  create: (context) => {
    return {
      text: (node: PositionedTextNode) => {
        const scanner = new TextScanner(node);
        const { value } = scanner;

        scanner.forEachChar((char, index, pos) => {
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
            && isNumberCharacter(_prevCharAt(value, index));

          if (isChineseNumBoundary || isPercentBoundary) {
            const match = scanner.matchAt(index, char.length + nextCharacter.length);
            context.report({
              loc: match.loc,
              message: '中文与数字之间需要增加空格',
              fix: fixer => fixer.insertTextAt(pos.endOffset, ' ')
            });
          }
        });
      }
    };
  }
};

function _prevCharAt(value: string, index: number): string {
  const codePoint = value.codePointAt(index - 1);
  return codePoint === undefined ? '' : String.fromCodePoint(codePoint);
}

export default spaceAroundNumber;
