import type { LintMdRule } from '../types';
import { createTraverser } from '../utils/traverser';

const noMultipleBlankLines: LintMdRule = {
  meta: {
    name: 'no-multiple-blank-lines'
  },
  create(context) {
    const codeRanges: Array<[number, number]> = [];

    createTraverser({
      onEnter(node) {
        if (node.type === 'code') {
          codeRanges.push([
            node.position.start.offset,
            node.position.end.offset
          ]);
        }
      }
    }).traverse(context.ast, null);

    return {
      root() {
        const source = context.sourceCode.text;
        const leadingBlankLines
          = /^(?:[ \t]*(?:\r\n|\r|\n))+/.exec(source);

        if (leadingBlankLines) {
          const end = leadingBlankLines[0].length;

          context.report({
            range: [0, end],
            message: '文档开头不能有空白行',
            fix: fixer => fixer.removeRange([0, end])
          });
        }

        const trailingBlankLines = leadingBlankLines?.[0].length === source.length
          ? null
          : /(\r\n|\r|\n)(?:[ \t]*(?:\r\n|\r|\n))*[ \t]*$/.exec(source);

        if (
          trailingBlankLines
          && trailingBlankLines[0] !== trailingBlankLines[1]
        ) {
          const start = trailingBlankLines.index;
          const end = source.length;
          const replacement = trailingBlankLines[1];

          context.report({
            range: [start, end],
            message: '文档末尾最多保留一个换行',
            fix: fixer => fixer.replaceTextRange([start, end], replacement)
          });
        }

        const pattern = /(\r\n|\r|\n)(?:[ \t]*(?:\r\n|\r|\n)){2,}/gu;
        pattern.lastIndex = leadingBlankLines?.[0].length ?? 0;
        let match = pattern.exec(source);

        while (match) {
          const start = match.index;
          const end = start + match[0].length;
          const replacement = `${match[1]}${match[1]}`;

          const isInCodeBlock = codeRanges.some(([codeStart, codeEnd]) => {
            return start < codeEnd && end > codeStart;
          });

          if (
            !isInCodeBlock
            && end <= (trailingBlankLines?.index ?? source.length)
          ) {
            context.report({
              range: [start, end],
              message: '连续空白行最多保留一行',
              fix: fixer => fixer.replaceTextRange([start, end], replacement)
            });
          }

          match = pattern.exec(source);
        }
      }
    };
  }
};

export default noMultipleBlankLines;
