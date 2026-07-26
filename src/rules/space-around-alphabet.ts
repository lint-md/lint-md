import type { LintMdRule, PositionedTextNode } from '../types';
import { isChineseCharacter, isEnglishCharacter } from '../utils/char-helper';
import { TextScanner } from '../utils/text-scanner';

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
        const scanner = new TextScanner(node);
        const { value } = scanner;

        scanner.forEachChar((char, index, pos) => {
          const nextCharacter = value[index + char.length];
          if (nextCharacter && isChineseEnglishBoundary(char, nextCharacter)) {
            const match = scanner.matchAt(index, char.length + nextCharacter.length);
            context.report({
              loc: match.loc,
              message: '中英文之间需要添加空格',
              fix: fixer => fixer.insertTextAt(pos.endOffset, ' ')
            });
          }
        });
      }
    };
  }
};

export default spaceAroundAlphabet;
