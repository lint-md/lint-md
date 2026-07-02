import type { MarkdownNode } from '@lint-md/parser';
import type { LintMdRule, LintMdRuleContext } from '../types';
import { getTextNodes } from '../utils/get-text-nodes';
import { getNodePosition } from '../utils/common';

type TextLikeNode = MarkdownNode & { value?: string };

const checkAndReportTextNode = (ctx: LintMdRuleContext, node: TextLikeNode, pos: 'between' | 'start-only' | 'end-only') => {
  if (!node || node.type !== 'text') {
    return;
  }

  const loc = getNodePosition(node);
  if (!loc)
    return;

  const nodeValue = node.value ?? '';

  let finalTrimmedText: string | null = null;
  if (pos === 'between') {
    if (nodeValue.trim() !== nodeValue) {
      finalTrimmedText = nodeValue.trim();
    }
  }
  else if (pos === 'start-only') {
    if (nodeValue.trimStart() !== nodeValue) {
      finalTrimmedText = nodeValue.trimStart();
    }
  }
  else {
    if (nodeValue.trimEnd() !== nodeValue) {
      finalTrimmedText = nodeValue.trimEnd();
    }
  }

  if (finalTrimmedText !== null) {
    ctx.report({
      loc,
      message: '链接内容前后不能有空格，请删除链接中的前后空格',
      fix: (fixer) => {
        return fixer.replaceTextRange([
          loc.start.offset!,
          loc.end.offset!
        ], finalTrimmedText as string);
      }
    });
  }
};

const noSpaceInLink: LintMdRule = {
  meta: {
    name: 'no-space-in-link'
  },
  create: (context) => {
    return {
      link: (node) => {
        const childTextNodeList = getTextNodes(node);

        // 1. 空文本，不处理
        if (childTextNodeList.length === 1) {
          // 2. 内部只有纯文本，例如 [ 你好世界 ]，此时只有一个 text 孩子节点
          checkAndReportTextNode(context, childTextNodeList[0], 'between');
        }
        else if (childTextNodeList.length > 1) {
          // 3. 内部有文本和其他节点，例如 [ 你好**世界** ]()，但一旦出现空格则开头和结尾必然是 text 节点，我们取出开头结尾的 text 节点，然后判断是否有空格即可
          const startItem = childTextNodeList[0];
          const endItem = childTextNodeList[childTextNodeList.length - 1];
          checkAndReportTextNode(context, startItem, 'start-only');
          checkAndReportTextNode(context, endItem, 'end-only');
        }
      }
    };
  }
};

export default noSpaceInLink;
