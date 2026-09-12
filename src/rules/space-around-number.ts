import type { LintMdRule, PositionedTextNode } from '../types.js';
import { TextScanner } from '../utils/text-scanner.js';
import { registerTextNodeAnalysisConsumer } from '../utils/text-rule-scan.js';

const spaceAroundNumber: LintMdRule = {
  meta: {
    name: 'space-around-number'
  },
  create: (context) => {
    const textNodeAnalysis = registerTextNodeAnalysisConsumer(context.sourceCode);
    return {
      text: (node: PositionedTextNode) => {
        const scanner = new TextScanner(node, context.sourceCode);
        const { numberBoundaries } = textNodeAnalysis.get(node);

        for (const { start, totalLength, firstCharacterLength } of numberBoundaries) {
          const reportMatch = scanner.matchAt(start, totalLength);
          context.report({
            range: reportMatch.absoluteRange,
            message: '中文与数字之间需要增加空格',
            fix: (fixer) => {
              const charMatch = scanner.matchAt(start, firstCharacterLength);
              return fixer.insertTextAt(charMatch.absoluteRange[1], ' ');
            }
          });
        }
      }
    };
  }
};

export default spaceAroundNumber;
