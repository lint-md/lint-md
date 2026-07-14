import type { LintMdRule, PositionedTextNode } from '../types';
import { isChineseCharacter, isNumberCharacter } from '../utils/char-helper';
import { TextScanner } from '../utils/text-scanner';

const isPercentSuffixOfNumber = (value: string, index: number) => {
  return value[index] === '%' && index > 0 && isNumberCharacter(value[index - 1]);
};

const shouldInsertSpaceBetween = (value: string, index: number) => {
  const currentCharacter = value[index];
  const nextCharacter = value[index + 1];

  if (!currentCharacter || !nextCharacter) {
    return false;
  }

  return (isChineseCharacter(currentCharacter) && isNumberCharacter(nextCharacter))
    || (isNumberCharacter(currentCharacter) && isChineseCharacter(nextCharacter))
    || (isPercentSuffixOfNumber(value, index) && isChineseCharacter(nextCharacter));
};

const spaceAroundNumber: LintMdRule = {
  meta: {
    name: 'space-around-number'
  },
  create: (context) => {
    return {
      text: (node: PositionedTextNode) => {
        const scanner = new TextScanner(node, context.markdown);
        const { value } = scanner;

        scanner.forEachChar((char, i, pos) => {
          if (i < value.length - 1 && shouldInsertSpaceBetween(value, i)) {
            const match = scanner.matchAt(i, 2);
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

export default spaceAroundNumber;
