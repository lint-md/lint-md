import type { MarkdownCodeNode } from '@lint-md/parser';
import type { LintMdRule, LintMdRuleContext } from '../types';

const getSerializedInlineCode = (content: string, preferredFenceLength: number) => {
  const backtickRuns: string[] = content.match(/`+/g) || [];
  const maxBacktickRunLength = backtickRuns.reduce((max, item) => {
    return Math.max(max, item.length);
  }, 0);

  const fenceLength = Math.max(preferredFenceLength, maxBacktickRunLength + 1, 1);
  const fence = '`'.repeat(fenceLength);
  const requiresPadding = content.startsWith('`')
    || content.endsWith('`');

  return `${fence}${requiresPadding ? ` ${content} ` : content}${fence}`;
};

const getFenceLength = (raw: string) => {
  const match = raw.match(/^`+/);
  return match?.[0].length || 1;
};

const runReport = (ctx: LintMdRuleContext, node: MarkdownCodeNode, value: string, fenceLength: number) => {
  ctx.report({
    loc: node.position,
    message: '行内代码内容，前后不能有空格，请删除行内代码中的前后空格',
    fix: (fixer) => {
      return fixer.replaceTextRange([
        node.position.start.offset,
        node.position.end.offset
      ], getSerializedInlineCode(value, fenceLength));
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

        const raw = context.markdown.slice(position.start.offset, position.end.offset);
        const trimmedContent = node.value.trim();

        if (trimmedContent !== node.value) {
          runReport(context, node, trimmedContent, getFenceLength(raw));
        }
      }
    };
  }
};

export default noSpaceInInlineCode;
