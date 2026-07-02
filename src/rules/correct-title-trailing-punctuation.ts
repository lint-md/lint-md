import type { LintMdRule } from '../types';
import { getTextNodes } from '../utils/get-text-nodes';
import { getNodeOffsetPosition, getNodePosition } from '../utils/common';

const FORBIDDEN_PUNCTUATIONS = ['.', ',', ';', ':', '。', '，', '；', '：', '~', '*', '`'];

const correctTitleTrailingPunctuation: LintMdRule = {
  meta: {
    name: 'correct-title-trailing-punctuation',
  },
  create: (context) => {
    return {
      heading: (node) => {
        const loc = getNodePosition(node);
        if (!loc)
          return;

        const lastTextNode = getTextNodes(node)
          .filter(item => item.type !== 'inlineCode')
          .reverse()
          .find(item => (item.value ?? '').trimEnd().length > 0);
        if (lastTextNode) {
          const val: string = (lastTextNode.value ?? '').trimEnd();
          const lastTextNodeLoc = getNodeOffsetPosition(lastTextNode);
          if (!lastTextNodeLoc)
            return;

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
              loc,
              message: '标题末尾不允许出现不规范的标点符号',
              fix: (fixer) => {
                return fixer.replaceTextRange([
                  lastTextNodeLoc.start.offset,
                  lastTextNodeLoc.end.offset
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
