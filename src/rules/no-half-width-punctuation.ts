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
  return (prevChar !== undefined && isChineseCharacter(prevChar))
    || (nextChar !== undefined && isChineseCharacter(nextChar));
};

const getParenthesisPairs = (value: string): [number, number][] => {
  const pairs: [number, number][] = [];
  const stack: number[] = [];
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') {
      stack.push(i);
    } else if (value[i] === ')') {
      const openIndex = stack.pop();
      if (openIndex !== undefined) {
        pairs.push([openIndex, i]);
      }
    }
  }
  return pairs;
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
    return {
      text: (node) => {
        const { value } = node;
        const { offset: startOffset } = node.position.start;
        let currentLine = node.position.start.line;
        let currentColumn = node.position.start.column;

        const parenthesisPairs = getParenthesisPairs(value);
        const convertIndices = new Set<number>();

        for (const [openIdx, closeIdx] of parenthesisPairs) {
          if (hasOuterChinese(value, openIdx, closeIdx)) {
            convertIndices.add(openIdx);
            convertIndices.add(closeIdx);
          }
        }

        for (let i = 0; i < value.length; i++) {
          const char = value[i];

          if (char === '\n') {
            currentLine += 1;
            currentColumn = 1;
            continue;
          }

          const fullChar = HALF_TO_FULL[char];
          if (!fullChar) {
            currentColumn += 1;
            continue;
          }

          const isParenthesis = char === '(' || char === ')';
          const shouldConvert = isParenthesis
            ? convertIndices.has(i) || hasAdjacentChinese(value, i)
            : hasAdjacentChinese(value, i);

          if (shouldConvert) {
            context.report({
              loc: {
                start: {
                  line: currentLine,
                  column: currentColumn
                },
                end: {
                  line: currentLine,
                  column: currentColumn + 1
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

          currentColumn += 1;
        }
      }
    };
  }
};

export default noHalfWidthPunctuation;
