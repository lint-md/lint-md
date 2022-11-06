import type { MarkdownTextNode } from '@lint-md/parser';
import type { LintMdRule } from '../types';

const SPECIAL_CHARACTERS = ['', ' '];

const noSpecialCharacters: LintMdRule = {
  meta: {
    name: 'no-special-characters'
  },
  create: (context) => {
    return {
      text: (node: MarkdownTextNode) => {
        const value = node.value;

        SPECIAL_CHARACTERS.forEach((sc) => {
          const idx = value.indexOf(sc);

          if (idx !== -1) {
            context.report({
              loc: {
                start: {
                  line: node.position.start.line,
                  column: node.position.start.column + idx
                },
                end: {
                  line: node.position.start.line,
                  column: node.position.start.column + idx + 1
                }
              },
              message: '文本中不能包含特殊字符，请删除或者替换',
              fix: (fixer) => {
                return fixer.removeRange([
                  node.position.start.offset + idx,
                  node.position.start.offset + idx + 1
                ]);
              }
            });
          }
        });
      }
    };
  }
};

export default noSpecialCharacters;
