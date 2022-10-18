import { LintMdRule } from '../types';
import { getTextNodes } from '../utils/get-text-nodes';

const ALLOWED_PUNCTUATION = ['!', '?', '！', '？', '…'];
const COMMON_PUNCTUATION = ['.', ',', ';', ':', '。', '，', '；', '：', '…', '~', '*', '`'];

const correctTitleTrailingPunctuation: LintMdRule = {
  create: (context) => {
    return {
      heading: (node) => {
        const lastTextNode = getTextNodes(node).pop();
        if (lastTextNode) {
          const val = lastTextNode.value.trim();
          const lastChar = val[val.length - 1];
          if (COMMON_PUNCTUATION.includes(lastChar)) {
            if (!ALLOWED_PUNCTUATION.includes(lastChar)) {
              context.report({
                loc: node.position,
                message: `[lint-md] 标题末尾不允许出现不规范的标点符号 ${lastChar}`,
                fix: (fixer) => {
                  return fixer.replaceTextRange([
                    lastTextNode.position.start.offset,
                    lastTextNode.position.end.offset
                  ], val.slice(0, -1));
                }
              });
            }
          }
        }
      }
    };
  }
};

export default correctTitleTrailingPunctuation;
