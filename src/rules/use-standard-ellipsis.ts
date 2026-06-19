import type { MarkdownCodeNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';

/**
 * 找到所有的 …
 */
const findAllSingleEllipsis = (s: string) => {
  const r: { index: number; length: number }[] = [];
  const re = /…+/g;

  let matched = re.exec(s);
  while (matched !== null) {
    if (matched[0].length !== 2) {
      r.push({
        index: matched.index,
        length: matched[0].length
      });
    }
    matched = re.exec(s);
  }

  return r;
};

/**
 * 找到所有的 . 组成的省略号
 */
const findAllDotEllipsis = (s: string) => {
  const r: { index: number; length: number }[] = [];
  const re = /\.{4,}/g;

  let matched = re.exec(s);
  while (matched !== null) {
    r.push({
      index: matched.index,
      length: matched[0].length
    });
    matched = re.exec(s);
  }

  return r;
};

const useStandardEllipsis: LintMdRule = {
  meta: {
    name: 'use-standard-ellipsis'
  },
  create: (context) => {
    return {
      text: (node: MarkdownCodeNode) => {
        const text = node.value;

        const { line, column } = node.position.start;

        const toFixList: {
          index: number
          length: number
        }[] = findAllDotEllipsis(text).concat(findAllSingleEllipsis(text));

        toFixList.forEach((item) => {
          context.report({
            loc: {
              start: {
                line,
                column: column + item.index
              },
              end: {
                line,
                column: column + item.index + item.length
              }
            },
            message: '请使用标准规范的省略号',
            fix: (fixer) => {
              // column 不是下标，需要 -1
              const startIndex = node.position.start.offset + item.index;
              return fixer.replaceTextRange([startIndex, startIndex + item.length], '……');
            }
          });
        });
      }
    };
  }
};

export default useStandardEllipsis;
