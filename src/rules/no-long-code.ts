import type { LintMdRule, PositionedCodeNode } from '../types.js';

interface Fence {
  marker: number
  size: number
}

const WHITESPACE_CHARACTER = /\s/u;

const findLineEnd = (
  markdown: string,
  lineStart: number,
  blockEnd: number
): number => {
  const lineBreak = markdown.indexOf('\n', lineStart);
  return lineBreak === -1 || lineBreak >= blockEnd ? blockEnd : lineBreak;
};

const getContentEnd = (
  markdown: string,
  lineStart: number,
  lineEnd: number
): number =>
  lineEnd > lineStart && markdown.charCodeAt(lineEnd - 1) === 0x0D
    ? lineEnd - 1
    : lineEnd;

const getOpeningFence = (
  markdown: string,
  lineStart: number,
  lineEnd: number
): Fence | undefined => {
  let cursor = lineStart;
  let spaces = 0;
  while (spaces < 3 && cursor < lineEnd && markdown.charCodeAt(cursor) === 0x20) {
    cursor++;
    spaces++;
  }

  const marker = markdown.charCodeAt(cursor);
  if (marker !== 0x60 && marker !== 0x7E) {
    return undefined;
  }

  const markerStart = cursor;
  while (cursor < lineEnd && markdown.charCodeAt(cursor) === marker) {
    cursor++;
  }

  const size = cursor - markerStart;
  return size >= 3 ? { marker, size } : undefined;
};

const isClosingFence = (
  markdown: string,
  lineStart: number,
  lineEnd: number,
  fence: Fence
): boolean => {
  let cursor = lineStart;
  let spaces = 0;
  while (spaces < 3 && cursor < lineEnd && markdown.charCodeAt(cursor) === 0x20) {
    cursor++;
    spaces++;
  }

  const markerStart = cursor;
  while (cursor < lineEnd && markdown.charCodeAt(cursor) === fence.marker) {
    cursor++;
  }
  if (cursor - markerStart < fence.size) {
    return false;
  }

  while (cursor < lineEnd && WHITESPACE_CHARACTER.test(markdown[cursor])) {
    cursor++;
  }
  return cursor === lineEnd;
};

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

        const md = context.markdown;
        const blockStart = node.position.start.offset;
        const blockEnd = node.position.end.offset;
        const firstLineEnd = findLineEnd(md, blockStart, blockEnd);
        const firstContentEnd = getContentEnd(md, blockStart, firstLineEnd);
        const fence = getOpeningFence(md, blockStart, firstContentEnd);

        let lineStart = blockStart;
        let scanEnd = blockEnd;
        let indentWidth = 0;
        let line = node.position.start.line;

        if (fence) {
          lineStart = firstLineEnd < blockEnd ? firstLineEnd + 1 : blockEnd;
          line++;

          const lastLineBreak = blockEnd > blockStart
            ? md.lastIndexOf('\n', blockEnd - 1)
            : -1;
          const lastLineStart = lastLineBreak < blockStart
            ? blockStart
            : lastLineBreak + 1;
          const lastContentEnd = getContentEnd(md, lastLineStart, blockEnd);

          if (isClosingFence(md, lastLineStart, lastContentEnd, fence)) {
            scanEnd = lastLineStart;
          }
        }
        else {
          while (
            blockStart + indentWidth < firstContentEnd
            && (
              md.charCodeAt(blockStart + indentWidth) === 0x20
              || md.charCodeAt(blockStart + indentWidth) === 0x09
            )
          ) {
            indentWidth++;
          }
        }

        while (lineStart < scanEnd) {
          const lineEnd = findLineEnd(md, lineStart, scanEnd);
          const contentEnd = getContentEnd(md, lineStart, lineEnd);
          const contentStart = Math.min(contentEnd, lineStart + indentWidth);
          const lineLength = contentEnd - contentStart;

          if (lineLength > maxLength) {
            context.report({
              loc: {
                start: { line, column: 1, offset: contentStart },
                end: { line, column: lineLength, offset: contentEnd }
              },
              message: '代码块不能有过长的代码'
            });
          }

          if (lineEnd >= scanEnd) {
            break;
          }
          lineStart = lineEnd + 1;
          line++;
        }
      }
    };
  }
};

export default noLongCode;
