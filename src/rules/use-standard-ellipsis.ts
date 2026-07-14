import type { LintMdRule, PositionedTextNode } from '../types';
import { TextScanner } from '../utils/text-scanner';

const useStandardEllipsis: LintMdRule = {
  meta: {
    name: 'use-standard-ellipsis'
  },
  create: (context) => {
    return {
      text: (node: PositionedTextNode) => {
        const scanner = new TextScanner(node, context.markdown);

        // 找到所有的 . 组成的省略号
        const dotMatches = scanner.findAllMatches(/\.{4,}/g);

        // 找到所有的 …（只要不是两个，都是不规范的）
        const singleMatches = scanner.findAllMatches(/…+/g)
          .filter(m => m.length !== 2);

        const allMatches = dotMatches
          .concat(singleMatches)
          .sort((a, b) => a.index - b.index);

        allMatches.forEach((m) => {
          context.report({
            loc: m.loc,
            message: '请使用标准规范的省略号',
            fix: fixer => fixer.replaceTextRange(m.absoluteRange, '……')
          });
        });
      }
    };
  }
};

export default useStandardEllipsis;
