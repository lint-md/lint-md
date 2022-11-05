import type { MarkdownNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';

const FULL_WIDTH_NUMBER_REPLACEMENT_MAP = {
  '１': 1,
  '２': 2,
  '３': 3,
  '４': 4,
  '５': 5,
  '６': 6,
  '７': 7,
  '８': 8,
  '９': 9,
  '０': 0
};

/**
 * 从字符串中找出所有全角数字
 * @param s
 * @returns {Array}
 */
const findAllFullWidthNumbers = (s: string) => {
  const re = /[０-９]+/g;
  const r: { number: string; index: number }[] = [];

  // 循环找出所有的数字
  while (true) {
    const matched = re.exec(s);

    if (matched) {
      r.push({
        number: matched[0],
        index: matched.index
      });
    }
    else {
      break;
    }
  }
  return r;
};

const noFullWidthNumber: LintMdRule = {
  meta: {
    name: 'no-full-width-number'
  },
  create: (context) => {
    return {
      text: (node: MarkdownNode & {
        value: string
      }) => {
        const text = node.value;
        const fullWidthNumbers = findAllFullWidthNumbers(text);
        fullWidthNumbers.forEach((res) => {
          const { index, number } = res;
          const { line: startLine, column: startColumn, offset: startOffset } = node.position.start;

          const startPos = startColumn + index;
          const endPos = startColumn + index + number.length;

          context.report({
            loc: {
              start: {
                line: startLine,
                column: startPos
              },
              end: {
                line: startLine,
                column: endPos
              }
            },
            message: '不能用全角数字，请使用半角数字',
            fix: (fixer) => {
              // １０００ => '1000'
              const replacement = number.split('').map(c => `${FULL_WIDTH_NUMBER_REPLACEMENT_MAP[c]}`).join('');
              return fixer.replaceTextRange([startOffset + index, startOffset + index + number.length], replacement);
            }
          });
        });
      }
    };
  }
};

export default noFullWidthNumber;

