import type { LintMdRule } from '../types';
import { getTextNodes } from '../utils/get-text-nodes';

const FORBIDDEN_PUNCTUATIONS = ['.', ',', ';', ':', '。', '，', '；', '：', '~', '*', '`'];

const correctTitleTrailingPunctuation: LintMdRule = {
  meta: {
    name: 'correct-title-trailing-punctuation',
  },
  create: (context) => {
    return {
      heading: (node) => {
        const lastTextNode = getTextNodes(node).pop();
        if (lastTextNode) {
          const val: string = lastTextNode.value.trimEnd();

          let endPos: number;

          for (endPos = val.length - 1; endPos >= 0; endPos--) {
            const currentCharacter = val[endPos];

            if (!FORBIDDEN_PUNCTUATIONS.includes(currentCharacter)) {
              // 当前字符是标点，且合法，退出循环
              break;
            }
          }

          if (endPos < val.length - 1) {
            context.report({
              loc: node.position,
              message: '标题末尾不允许出现不规范的标点符号',
              fix: (fixer) => {
                return fixer.replaceTextRange([
                  lastTextNode.position.start.offset,
                  lastTextNode.position.end.offset
                ], val.slice(0, endPos + 1));
              }
            });
          }
        }
      }
    };
  }
};

export default correctTitleTrailingPunctuation;
