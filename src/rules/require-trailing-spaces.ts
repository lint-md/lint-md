import type { LintMdRule, PositionedTextNode } from '../types.js';
import { TextScanner } from '../utils/text-scanner.js';

const requireTrailingSpaces: LintMdRule = {
  meta: {
    name: 'require-trailing-spaces'
  },
  create(context) {
    return {
      text(node: PositionedTextNode) {
        const scanner = new TextScanner(node, context.sourceCode);
        const matches = scanner.findAllMatches(/\r\n|\r|\n/g);

        for (const match of matches) {
          const offset = match.absoluteRange[0];
          let trailingSpaces = 0;

          for (
            let index = offset - 1;
            index >= 0 && context.sourceCode.text[index] === ' ';
            index--
          ) {
            trailingSpaces++;
          }

          const missingSpaces = Math.max(0, 2 - trailingSpaces);

          if (missingSpaces === 0) {
            continue;
          }

          context.report({
            range: [offset, offset],
            message: '软换行前需要两个空格',
            fix: fixer => fixer.insertTextAt(offset, ' '.repeat(missingSpaces))
          });
        }
      }
    };
  }
};

export default requireTrailingSpaces;
