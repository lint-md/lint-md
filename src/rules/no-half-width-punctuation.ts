import type { LintMdRule, PositionedTextNode } from '../types.js';
import { isChineseCharacter } from '../utils/char-helper.js';
import { TextScanner } from '../utils/text-scanner.js';
import { registerTextRuleScanConsumer } from '../utils/text-rule-scan.js';

const HALF_TO_FULL: Record<string, string> = {
  ',': '，',
  '.': '。',
  ';': '；',
  ':': '：',
  '!': '！',
  '?': '？',
  '(': '（',
  ')': '）',
};

const hasAdjacentChinese = (value: string, index: number) => {
  const prevChar = value[index - 1];
  const nextChar = value[index + 1];
  return (prevChar !== undefined && isChineseCharacter(prevChar))
    || (nextChar !== undefined && isChineseCharacter(nextChar));
};

const isHorizontalWhitespace = (char: string) => char === ' ' || char === '\t' || char === '\u3000';

const hasOuterChinese = (value: string, openIdx: number, closeIdx: number): boolean => {
  let left = openIdx - 1;
  while (left >= 0 && isHorizontalWhitespace(value[left])) {
    left--;
  }
  if (left >= 0 && isChineseCharacter(value[left])) {
    return true;
  }

  let right = closeIdx + 1;
  while (right < value.length && isHorizontalWhitespace(value[right])) {
    right++;
  }
  if (right < value.length && isChineseCharacter(value[right])) {
    return true;
  }

  return false;
};

const noHalfWidthPunctuation: LintMdRule = {
  meta: {
    name: 'no-half-width-punctuation'
  },
  create: (context) => {
    const textRuleScan = registerTextRuleScanConsumer(context.sourceCode);
    return {
      text: (node: PositionedTextNode) => {
        const scanner = new TextScanner(node, context.sourceCode);
        const { value } = scanner;
        const { parenthesisPairs, punctuationCharacters } = textRuleScan.get(node);

        const convertIndices = new Set<number>();

        for (const [openIdx, closeIdx] of parenthesisPairs) {
          if (hasOuterChinese(value, openIdx, closeIdx)) {
            convertIndices.add(openIdx);
            convertIndices.add(closeIdx);
          }
        }

        const inspectPunctuation = (char: string, index: number) => {
          const fullChar = HALF_TO_FULL[char];
          if (!fullChar)
            return;

          const isParenthesis = char === '(' || char === ')';
          const shouldConvert = isParenthesis
            ? convertIndices.has(index) || hasAdjacentChinese(value, index)
            : hasAdjacentChinese(value, index);

          if (shouldConvert) {
            const match = scanner.matchAt(index, 1);
            context.report({
              range: match.absoluteRange,
              message: `不应在中文中使用半角标点"${char}"，请使用全角"${fullChar}"`,
              fix: fixer => fixer.replaceTextRange(match.absoluteRange, fullChar)
            });
          }
        };

        for (const { char, index } of punctuationCharacters) {
          inspectPunctuation(char, index);
        }
      }
    };
  }
};

export default noHalfWidthPunctuation;
