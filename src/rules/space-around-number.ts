import type { MarkdownTextNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
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
      text: (node: MarkdownTextNode) => {
        const scanner = new TextScanner(node);
        const { value } = scanner;

        scanner.forEachChar((char, i, pos) => {
          if (i < value.length - 1 && shouldInsertSpaceBetween(value, i)) {
            context.report({
              loc: {
                start: { line: pos.line, column: pos.column },
                end: { line: pos.line, column: pos.column + 2 }
              },
              message: '中文与数字之间需要增加空格',
              fix: fixer => fixer.insertTextAt(pos.offset + 1, ' ')
            });
          }
        });
      }
    };
  }
};

export default spaceAroundNumber;
