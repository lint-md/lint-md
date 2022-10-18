import { MarkdownNode } from '@lint-md/parser';
import { LintMdRule, LintMdRuleContext } from '../types';

type MarkdownTextNode = MarkdownNode & {
  value: string
}

const checkAndReportTextNode = (ctx: LintMdRuleContext, node: MarkdownTextNode, pos: 'between' | 'start-only' | 'end-only') => {
  if (!node && node.type !== 'text') {
    return;
  }

  let finalTrimmedText = null;
  if (pos === 'between') {
    if (node.value.trim() !== node.value) {
      finalTrimmedText = node.value.trim();
    }
  } else if (pos === 'start-only') {
    if (node.value.trimStart() !== node.value) {
      finalTrimmedText = node.value.trimStart();
    }
  } else {
    if (node.value.trimEnd() !== node.value) {
      finalTrimmedText = node.value.trimEnd();
    }
  }


  if (finalTrimmedText !== null) {
    ctx.report({
      loc: node.position,
      message: '[lint-md] 链接内容前后不能有空格，请删除链接中的前后空格',
      fix: (fixer => {
        return fixer.replaceTextRange([
          node.position.start.offset,
          node.position.end.offset
        ], finalTrimmedText);
      })
    });
  }
};

const noSpaceInLink: LintMdRule = {
  create: (context) => {
    return {
      link: (node) => {
        const childList = node.children || [];
        // 两侧空格必然是 text 节点，分三种情况讨论

        // 1. 空文本，不处理
        if (childList.length === 1) {
          // 2. 内部只有纯文本，例如 [ 你好世界 ]，此时只有一个 text 孩子节点
          checkAndReportTextNode(context, <MarkdownTextNode>childList[0], 'between');
        } else if (childList.length > 1) {
          // 3. 内部有文本和其他节点，例如 [ 你好**世界** ]()，但一旦出现空格则开头和结尾必然是 text 节点，我们取出开头结尾的 text 节点，然后判断是否有空格即可
          const startItem = <MarkdownTextNode>childList[0];
          const endItem = <MarkdownTextNode>childList[childList.length - 1];
          checkAndReportTextNode(context, startItem, 'start-only');
          checkAndReportTextNode(context, endItem, 'end-only');
        }
      }
    };
  }
};

export default noSpaceInLink;
