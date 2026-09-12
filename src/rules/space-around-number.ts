import type { LintMdRule, PositionedTextNode } from '../types.js';
import { TextScanner } from '../utils/text-scanner.js';
import { registerTextRuleScan } from '../utils/text-rule-scan.js';

const spaceAroundNumber: LintMdRule = {
  meta: {
    name: 'space-around-number'
  },
  create: (context) => {
    const textRuleScan = registerTextRuleScan(context.sourceCode);
    return {
      text: (node: PositionedTextNode) => {
        const scanner = new TextScanner(node, context.sourceCode);
        const { numberBoundaries } = textRuleScan.get(node);

        for (const { index, length, firstLength } of numberBoundaries) {
          const reportMatch = scanner.matchAt(index, length);
          context.report({
            range: reportMatch.absoluteRange,
            message: '中文与数字之间需要增加空格',
            fix: (fixer) => {
              const charMatch = scanner.matchAt(index, firstLength);
              return fixer.insertTextAt(charMatch.absoluteRange[1], ' ');
            }
          });
        }
      }
    };
  }
};

export default spaceAroundNumber;
