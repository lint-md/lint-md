import { MarkdownNode } from '@lint-md/parser';
import { LintMdRule } from '../types';

type MarkdownCodeNode = MarkdownNode & {
  value: string
}

/**
 * 找到所有的 …
 */
const findAllSingleEllipsis = (s: string) => {
  const r = [];
  const re = /…+/g; // 使用正则匹配

  while (true) {
    const matched = re.exec(s);

    // 只要不是两个，都是不规范的
    if (matched && matched[0].length !== 2) {
      r.push({
        index: matched.index,
        length: matched[0].length
      });
    } else {
      break;
    }
  }
  return r;
};

/**
 * 找到所有的 . 组成的省略号
 */
const findAllDotEllipsis = (s: string) => {
  const r = [];
  const re = /\.{4,}/g; // 使用正则匹配

  while (true) {
    const matched = re.exec(s);

    if (matched) {
      r.push({
        index: matched.index,
        length: matched[0].length
      });
    } else {
      break;
    }
  }
  return r;
};


const useStandardEllipsis: LintMdRule = {
  create: (context) => {
    return {
      text: (node: MarkdownCodeNode) => {
        const text = node.value;

        const { line, column } = node.position.start;

        const toFixList = findAllDotEllipsis(text).concat(findAllSingleEllipsis(text));

        toFixList.forEach(item => {
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
            message: '[lint-md] 请使用标准规范的省略号',
            fix: (fixer) => {
              // column 不是下标，需要 -1
              const startIndex = (column - 1) + item.index;
              return fixer.replaceTextRange([startIndex, startIndex + item.length], '……');
            }
          });
        });
      }
    };
  }
};

export default useStandardEllipsis;
