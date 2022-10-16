import { MarkdownNode } from '@lint-md/parser';
import { LintMdRule } from '../types';

type MarkdownTextNode = MarkdownNode & {
  value: string
}

const SPECIAL_CHARACTERS = ['\b'];

const noSpecialCharacters: LintMdRule = {
  create: (context) => {
    return {
      text: (node: MarkdownTextNode) => {
        const value = node.value;

        SPECIAL_CHARACTERS.forEach(sc => {
          const idx = value.indexOf(sc);

          if (idx) {
            context.report({
              loc: node.position,
              message: `[lint-md] 文本中不能包含特殊字符 '${sc}'，请删除或者替换`,
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
