import type { MarkdownCodeNode } from '@lint-md/parser';
import type { LintMdRule, LintMdRuleContext } from '../types';

const runReport = (ctx: LintMdRuleContext, node: MarkdownCodeNode, value: string, type: 'long' | 'short') => {
  ctx.report({
    loc: node.position,
    message: '行内代码内容，前后不能有空格，请删除行内代码中的前后空格',
    fix: (fixer) => {
      return fixer.replaceTextRange([
        node.position.start.offset,
        node.position.end.offset
      ], type === 'long' ? `\`\`\`${value}\`\`\`` : `\`${value}\``);
    }
  });
};

const noSpaceInInlineCode: LintMdRule = {
  meta: {
    name: 'no-space-in-inline-code'
  },
  create: (context) => {
    return {
      inlineCode: (node: MarkdownCodeNode) => {
        const { position } = node;

        // 由于 parser 的问题，这里需要从 md 直接获取文本
        const result = context.markdown.slice(position.start.offset, position.end.offset);
        if (result.startsWith('```')) {
          const internalContent = result.slice(3, -3);
          if (internalContent.trim() !== internalContent) {
            runReport(context, node, internalContent.trim(), 'long');
          }
        }
        else {
          const internalContent = result.slice(1, -1);
          if (internalContent.trim() !== internalContent) {
            runReport(context, node, internalContent.trim(), 'short');
          }
        }
      }
    };
  }
};

export default noSpaceInInlineCode;
