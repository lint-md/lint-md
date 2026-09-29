import type { LintMdRule, PositionedCodeNode } from '../types.js';

/**
 * 返回 opening 行的行尾偏移（不含行结束符）。没有行结束符时返回文本末尾。
 *
 * 语言要插在 opening 行行尾：fence + 已有空白 + info string 是合法写法。
 * 这样 core 不必知道围栏长度和缩进，parser 已在 node.position 里给出起点。
 */
const findOpeningLineEnd = (text: string, from: number): number => {
  let index = from;
  while (
    index < text.length
    && text.charCodeAt(index) !== 0x0D
    && text.charCodeAt(index) !== 0x0A
  ) {
    index++;
  }
  return index;
};

/**
 * mdast 用同一个 code 节点表示 fenced 和 indented。
 * fenced 的 position.start 落在围栏字符 ` 或 ~ 上。
 *
 * 这只是临时判据，等 parser 暴露该元数据后删除（lint-md/parser#141）。
 */
const isFencedCodeStart = (text: string, offset: number): boolean => {
  const character = text[offset];
  // CommonMark 只有反引号和波浪号两种围栏字符。
  return character === '`' || character === '~';
};

const noEmptyCodeLang: LintMdRule = {
  meta: {
    name: 'no-empty-code-lang'
  },
  create: (context) => {
    return {
      code: (node: PositionedCodeNode) => {
        if (node.lang) {
          return;
        }

        const { text } = context.sourceCode;
        const start = node.position.start.offset;

        if (!isFencedCodeStart(text, start)) {
          return;
        }

        const insertAt = findOpeningLineEnd(text, start);

        context.report({
          loc: node.position,
          message: '代码语言不能为空，请在代码块语法上增加语言',
          fix: fixer => fixer.insertTextAt(insertAt, 'plain')
        });
      }
    };
  }
};

export default noEmptyCodeLang;
