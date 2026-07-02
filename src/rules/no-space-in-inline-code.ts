import type { MarkdownCodeNode } from '@lint-md/parser';
import type { LintMdRule, LintMdRuleContext, MarkdownLocation } from '../types';
import { getNodePosition } from '../utils/common';

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

const runReport = (ctx: LintMdRuleContext, node: MarkdownCodeNode, value: string, fenceLength: number, loc: MarkdownLocation) => {
  ctx.report({
    loc,
    message: '行内代码内容，前后不能有空格，请删除行内代码中的前后空格',
    fix: (fixer) => {
      return fixer.replaceTextRange([
        loc.start.offset!,
        loc.end.offset!
      ], getSerializedInlineCode(value, fenceLength));
    }
  });
};

const getFenceLength = (raw: string) => {
  const match = raw.match(/^`+/);
  return match?.[0].length || 1;
};

const noSpaceInInlineCode: LintMdRule = {
  meta: {
    name: 'no-space-in-inline-code'
  },
  create: (context) => {
    return {
      inlineCode: (node: MarkdownCodeNode) => {
        const loc = getNodePosition(node);
        if (!loc)
          return;

        const raw = context.markdown.slice(loc.start.offset!, loc.end.offset!);
        const trimmedContent = node.value.trim();

        if (trimmedContent !== node.value) {
          runReport(context, node, trimmedContent, getFenceLength(raw), loc);
        }
      }
    };
  }
};

export default noSpaceInInlineCode;
