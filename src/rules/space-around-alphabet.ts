import type { LintMdRule, PositionedTextNode } from '../types.js';
import { isChineseCharacter, isEnglishCharacter } from '../utils/char-helper.js';
import { TextScanner } from '../utils/text-scanner.js';

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
        const scanner = new TextScanner(node, context.sourceCode);
        const { value } = scanner;

        scanner.forEachChar((char, index, pos) => {
          const nextCodePoint = value.codePointAt(index + char.length);
          const nextCharacter = nextCodePoint === undefined
            ? undefined
            : String.fromCodePoint(nextCodePoint);
          if (nextCharacter && isChineseEnglishBoundary(char, nextCharacter)) {
            const match = scanner.matchAt(index, char.length + nextCharacter.length);
            context.report({
              range: match.absoluteRange,
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
