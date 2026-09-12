import type { LintMdRule, PositionedTextNode } from '../types.js';
import { TextScanner } from '../utils/text-scanner.js';

const ELLIPSIS_PATTERN = /\.{4,}|…+/g;

const useStandardEllipsis: LintMdRule = {
  meta: {
    name: 'use-standard-ellipsis'
  },
  create: (context) => {
    return {
      text: (node: PositionedTextNode) => {
        const scanner = new TextScanner(node, context.sourceCode);
        const value = scanner.value;
        const firstCandidate = value.search(/[.…]/);
        if (firstCandidate === -1) {
          return;
        }

        ELLIPSIS_PATTERN.lastIndex = firstCandidate;
        let matched = ELLIPSIS_PATTERN.exec(value);
        while (matched !== null) {
          const matchedValue = matched[0];
          const isValidEllipsis = matchedValue[0] === '…' && matchedValue.length === 2;
          if (!isValidEllipsis) {
            const match = scanner.matchAt(matched.index, matchedValue.length);
            context.report({
              range: match.absoluteRange,
              message: '请使用标准规范的省略号',
              fix: fixer => fixer.replaceTextRange(match.absoluteRange, '……')
            });
          }

          matched = ELLIPSIS_PATTERN.exec(value);
        }
      }
    };
  }
};

export default useStandardEllipsis;
