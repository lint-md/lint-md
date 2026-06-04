import type { LintMdRule } from '../types';
import { isChineseCharacter } from '../utils/char-helper';

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
  return (prevChar && isChineseCharacter(prevChar))
    || (nextChar && isChineseCharacter(nextChar));
};

const noHalfWidthPunctuation: LintMdRule = {
  meta: {
    name: 'no-half-width-punctuation'
  },
  create: (context) => {
    return {
      text: (node) => {
        const { value } = node;
        const { line, column, offset: startOffset } = node.position.start;

        for (let i = 0; i < value.length; i++) {
          const char = value[i];
          const fullChar = HALF_TO_FULL[char];
          if (fullChar && hasAdjacentChinese(value, i)) {
            context.report({
              loc: {
                start: {
                  line,
                  column: column + i
                },
                end: {
                  line,
                  column: column + i + 1
                }
              },
              message: `不应在中文中使用半角标点"${char}"，请使用全角"${fullChar}"`,
              fix: (fixer) => {
                return fixer.replaceTextRange(
                  [startOffset + i, startOffset + i + 1],
                  fullChar
                );
              }
            });
          }
        }
      }
    };
  }
};

export default noHalfWidthPunctuation;
