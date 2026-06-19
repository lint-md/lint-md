import type { MarkdownTextNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
import { isChineseCharacter } from '../utils/char-helper';
import { TextScanner } from '../utils/text-scanner';

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
    }
    else if (value[i] === ')') {
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
      text: (node: MarkdownTextNode) => {
        const scanner = new TextScanner(node);
        const { value } = scanner;

        // 预处理：找出需要转换的括号对
        const parenthesisPairs = getParenthesisPairs(value);
        const convertIndices = new Set<number>();

        for (const [openIdx, closeIdx] of parenthesisPairs) {
          if (hasOuterChinese(value, openIdx, closeIdx)) {
            convertIndices.add(openIdx);
            convertIndices.add(closeIdx);
          }
        }

        // 逐字符扫描
        scanner.forEachChar((char, i, pos) => {
          const fullChar = HALF_TO_FULL[char];
          if (!fullChar)
            return;

          const isParenthesis = char === '(' || char === ')';
          const shouldConvert = isParenthesis
            ? convertIndices.has(i) || hasAdjacentChinese(value, i)
            : hasAdjacentChinese(value, i);

          if (shouldConvert) {
            context.report({
              loc: {
                start: { line: pos.line, column: pos.column },
                end: { line: pos.line, column: pos.column + 1 }
              },
              message: `不应在中文中使用半角标点"${char}"，请使用全角"${fullChar}"`,
              fix: fixer => fixer.replaceTextRange([pos.offset, pos.offset + 1], fullChar)
            });
          }
        });
      }
    };
  }
};

export default noHalfWidthPunctuation;
