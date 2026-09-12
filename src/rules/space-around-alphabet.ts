import type { LintMdRule, PositionedTextNode } from '../types.js';
import { TextScanner } from '../utils/text-scanner.js';
import { registerTextRuleScanConsumer } from '../utils/text-rule-scan.js';

const spaceAroundAlphabet: LintMdRule = {
  meta: {
    name: 'space-around-alphabet'
  },
  create: (context) => {
    const textRuleScan = registerTextRuleScanConsumer(context.sourceCode);
    return {
      text: (node: PositionedTextNode) => {
        const scanner = new TextScanner(node, context.sourceCode);
        const { alphabetBoundaries } = textRuleScan.get(node);

        for (const { start, totalLength, firstCharacterLength } of alphabetBoundaries) {
          const reportMatch = scanner.matchAt(start, totalLength);
          context.report({
            range: reportMatch.absoluteRange,
            message: '中英文之间需要添加空格',
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

export default spaceAroundAlphabet;
