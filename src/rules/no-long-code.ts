import type { LintMdRule, PositionedCodeNode } from '../types.js';

/**
 * 长度语义只有一条：code 里的一行不能超过 options.length。
 *
 * 行的切分基于 parser 已归一化的 node.value（fence、容器前缀、缩进、
 * CR/LF/CRLF 都已被 parser 剥离）。行区间到原始 Markdown 的换算走
 * parser 的 source map（sourceCode.getTextRange）。本规则不解析 Markdown。
 */
const noLongCode: LintMdRule = {
  meta: {
    name: 'no-long-code'
  },
  create: (context) => {
    return {
      code: (node: PositionedCodeNode) => {
        const { length: maxLength, exclude = [] } = context.options;
        // 选项中设置的排除语言不考虑
        if (exclude.includes(node.lang)) {
          return;
        }

        const { sourceCode } = context;
        const value = node.value;

        let lineStart = 0;
        while (lineStart <= value.length) {
          const lineBreak = value.indexOf('\n', lineStart);
          const lineEnd = lineBreak === -1 ? value.length : lineBreak;

          if (lineEnd - lineStart > maxLength) {
            const [start, end] = sourceCode.getTextRange(node, lineStart, lineEnd);
            const location = sourceCode.getLocation([start, end]);
            context.report({
              loc: {
                start: location.start,
                // location.end.column 是排他列，减 1 得到行内最后一列。
                // 保持历史上报语义，避免改动公开的 loc 输出。
                end: { ...location.end, column: location.end.column - 1 }
              },
              message: '代码块不能有过长的代码'
            });
          }

          if (lineBreak === -1) {
            break;
          }
          lineStart = lineBreak + 1;
        }
      }
    };
  }
};

export default noLongCode;
