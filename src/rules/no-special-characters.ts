import type { MarkdownTextNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';
import { TextScanner } from '../utils/text-scanner';

// U+0008 (backspace) and U+200A (hair space)
const SPECIAL_CHARACTERS = ['\u0008', '\u200A'];

const noSpecialCharacters: LintMdRule = {
  meta: {
    name: 'no-special-characters'
  },
  create: (context) => {
    return {
      text: (node: MarkdownTextNode) => {
        const scanner = new TextScanner(node);

        SPECIAL_CHARACTERS.forEach((sc) => {
          const matches = scanner.findAllOccurrences(sc);

          matches.forEach((m) => {
            context.report({
              loc: m.loc,
              message: '文本中不能包含特殊字符，请删除或者替换',
              fix: fixer => fixer.removeRange(m.absoluteRange)
            });
          });
        });
      }
    };
  }
};

export default noSpecialCharacters;
