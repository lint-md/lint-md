import type { LintMdRule, PositionedCodeNode } from '../types';

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

        // 计算真实偏移：直接对原始文档中代码块区间（含围栏与真实换行符）按 \n 切分，
        // 这样偏移始终落在 raw-md 坐标系（与 node.position.offset、rule-manager 切片一致），
        // 同时兼容 CRLF——rawLine 包含行尾 \r，cursor 推进时 +1 仅计入 \n，行间隔即 \r\n。
        // 注意：parser 会把 node.value 归一化为 LF，但 position.offset 仍是原始坐标，
        // 因此不能基于 node.value 推算偏移，必须以原始文档切片为准。
        const md = context.markdown;
        const blockStart = node.position.start.offset;
        const blockEnd = node.position.end.offset;
        const rawLines = md.slice(blockStart, blockEnd).split('\n');

        // 先判断首行是否真的是围栏（fenced），再据此决定跳过哪些行，
        // 避免把缩进代码块（无围栏）或 EOF 未闭合围栏的最后一行误判为围栏而漏报。
        const firstLine = rawLines[0]?.replace(/\r$/, '') ?? '';
        const fenceMatch = /^( {0,3})(`{3,}|~{3,})/.exec(firstLine);

        let startIndex = 0;
        let endIndex = rawLines.length;
        let indentWidth = 0;

        if (fenceMatch) {
          // fenced：跳过开头围栏
          startIndex = 1;
          const marker = fenceMatch[2][0];
          const size = fenceMatch[2].length;
          const closeRe = new RegExp(`^ {0,3}\\${marker}{${size},}\\s*$`);
          const lastLine = rawLines[rawLines.length - 1]?.replace(/\r$/, '') ?? '';
          if (closeRe.test(lastLine)) {
            // 仅当存在闭合围栏时才跳过结尾；EOF 未闭合则保留最后一行代码
            endIndex = rawLines.length - 1;
          }
        }
        else {
          // indented code：parser 会剥离首行缩进，需手动补偿偏移，使 offset 落在实际内容上
          indentWidth = firstLine.length - firstLine.replace(/^[ \t]+/, '').length;
        }

        let cursor = blockStart;
        for (let k = 0; k < endIndex; k++) {
          const rawLine = rawLines[k];
          // 仅扫描 [startIndex, endIndex) 之间的代码行；被跳过的围栏行也需推进 cursor
          if (k >= startIndex) {
            // 去除行尾可能的 \r，并跳过缩进代码块的起始空白
            const content = rawLine.replace(/\r$/, '').slice(indentWidth);
            const lineLength = content.length;
            if (lineLength > maxLength) {
              // 第 k 行超出限制（围栏在第 start.line 行，代码第 k 行位于 start.line + k 行）
              const line = node.position.start.line + k;

              // 列从第一列开始，结束处为同一行的末尾
              const start = {
                line,
                column: 1,
                offset: cursor + indentWidth
              };
              const end = {
                line,
                column: lineLength,
                offset: cursor + indentWidth + lineLength
              };

              context.report({
                loc: {
                  start,
                  end
                },
                message: '代码块不能有过长的代码'
              });
            }
          }

          // 移动到下一行：当前行长度（含 \r）+ 行末的换行符（\n）
          cursor += rawLine.length + 1;
        }
      }
    };
  }
};

export default noLongCode;
