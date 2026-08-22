import { fixMarkdown, lintMarkdown } from '../../src';
import type { LintDiagnostic, LintMdRule, PositionedMarkdownNode, SourceRange } from '../../src/types';

/**
 * 按文档坐标语义（\r\n 记为一个换行、行首指向 \n 之后）独立重算位置，
 * 与 src/utils/source-code.ts 的 buildLineStarts / offsetToPosition 契约一致。
 */
function positionOf(text: string, offset: number): { line: number; column: number } {
  const lineStarts = [0];
  for (let i = 0; i < text.length;) {
    const code = text.charCodeAt(i);
    if (code === 13 && text.charCodeAt(i + 1) === 10) {
      lineStarts.push(i + 2);
      i += 2;
    }
    else if (code === 13 || code === 10) {
      lineStarts.push(i + 1);
      i += 1;
    }
    else {
      i += 1;
    }
  }

  let low = 0;
  let high = lineStarts.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (lineStarts[mid] <= offset) {
      low = mid + 1;
    }
    else {
      high = mid;
    }
  }
  return { line: low, column: offset - lineStarts[low - 1] + 1 };
}

/** 断言每条诊断的 range 完整、有序、越界安全，且 line/column 与 offset 互相一致。 */
function expectCompleteRanges(markdown: string, diagnostics: LintDiagnostic[]): void {
  expect(diagnostics.length).toBeGreaterThan(0);
  for (const diagnostic of diagnostics) {
    const { range } = diagnostic;
    expect(Number.isInteger(range.start.offset)).toBe(true);
    expect(Number.isInteger(range.end.offset)).toBe(true);
    expect(range.start.offset).toBeGreaterThanOrEqual(0);
    expect(range.start.offset).toBeLessThanOrEqual(range.end.offset);
    expect(range.end.offset).toBeLessThanOrEqual(markdown.length);

    expect(range.start.line).toBe(positionOf(markdown, range.start.offset).line);
    expect(range.start.column).toBe(positionOf(markdown, range.start.offset).column);
    expect(range.end.line).toBe(positionOf(markdown, range.end.offset).line);
    expect(range.end.column).toBe(positionOf(markdown, range.end.offset).column);

    // 兼容字段必须与 range.start 同源，不允许两套坐标并存漂移。
    expect(diagnostic.line).toBe(range.start.line);
    expect(diagnostic.column).toBe(range.start.column);
  }
}

describe('LintDiagnostic source range (#190)', () => {
  test('every diagnostic carries a complete range consistent with offsets (LF)', () => {
    const markdown = ['中文English 混排', '', '第二段有123数字和English结尾。'].join('\n');
    const result = lintMarkdown(markdown, {}, false);
    expectCompleteRanges(markdown, result.diagnostics);
  });

  test('ranges stay consistent under CRLF line endings', () => {
    const markdown = ['中文English 混排', '第二行123数字'].join('\r\n');
    const result = lintMarkdown(markdown, {}, false);
    expectCompleteRanges(markdown, result.diagnostics);
  });

  test('multiline report spans lines with matching start/end positions', () => {
    const markdown = '# 中文 title\n\n段落一 内容。\n\n段落二 tail。';
    const wholeDocumentRule: LintMdRule = {
      meta: { name: 'whole-document-range' },
      create: context => ({
        root: (node: PositionedMarkdownNode) => {
          context.report({
            range: [node.position.start.offset, node.position.end.offset],
            message: 'whole document'
          });
        }
      })
    };

    const result = lintMarkdown(markdown, { wholeDocumentRange: [wholeDocumentRule, 2, {}] }, false);
    expect(result.diagnostics).toHaveLength(1);

    const range: SourceRange = result.diagnostics[0].range;
    expect(range.start).toEqual({ line: 1, column: 1, offset: 0 });
    expect(range.end.offset).toBe(markdown.length);
    expect(range.end.line).toBeGreaterThan(range.start.line);
  });

  test('offsets follow UTF-16 indexing for astral characters', () => {
    const markdown = '🎉🎉中文abc';
    const emojiWidth = 4; // 两个代理对，各占 2 个 UTF-16 单元
    const markerRule: LintMdRule = {
      meta: { name: 'astral-marker' },
      create: context => ({
        root: () => {
          context.report({
            range: [emojiWidth, emojiWidth + 2],
            message: 'chinese span after astral characters'
          });
        }
      })
    };

    const result = lintMarkdown(
      markdown,
      { 'space-around-alphabet': 0, 'astralMarker': [markerRule, 2, {}] },
      false
    );
    expect(result.diagnostics).toHaveLength(1);

    const { range } = result.diagnostics[0];
    expect(range.start.offset).toBe(emojiWidth);
    expect(range.end.offset).toBe(emojiWidth + 2);
    expect(markdown.slice(range.start.offset, range.end.offset)).toBe('中文');
    expect(range.start.column).toBe(5); // 两个 emoji 各占 2 列后指向第 5 列
    expectCompleteRanges(markdown, result.diagnostics);
  });

  test('synthetic loc without offsets still yields a complete resolved range', () => {
    const markdown = '前置文本 **加粗 中文** 后置文本';
    const syntheticRule: LintMdRule = {
      meta: { name: 'synthetic-no-offset' },
      create: context => ({
        strong: (node) => {
          context.report({
            loc: {
              start: { line: node.position.start.line, column: node.position.start.column },
              end: { line: node.position.end.line, column: node.position.end.column }
            },
            message: 'report without offsets'
          });
        }
      })
    };

    const result = lintMarkdown(markdown, { syntheticNoOffset: [syntheticRule, 2, {}] }, false);
    expect(result.diagnostics).toHaveLength(1);

    const { range } = result.diagnostics[0];
    expect(markdown.slice(range.start.offset, range.end.offset)).toBe('**加粗 中文**');
    expectCompleteRanges(markdown, result.diagnostics);
  });

  test('fix-mode diagnostics carry ranges valid against the original input', () => {
    const markdown = '中文English 123';
    const result = fixMarkdown(markdown, { rules: {} });
    expectCompleteRanges(markdown, result.diagnostics);
  });

  test('range aligns with the content excerpt window', () => {
    const markdown = '中文English 123';
    const result = lintMarkdown(markdown, {}, false);

    for (let i = 0; i < result.diagnostics.length; i++) {
      const diagnostic = result.diagnostics[i];
      const item = result.lintResult[i];
      const expected = markdown.slice(
        Math.max(0, diagnostic.range.start.offset - 5),
        Math.min(markdown.length, diagnostic.range.end.offset + 5)
      );
      expect(item.content).toBe(expected);
    }
  });
});
