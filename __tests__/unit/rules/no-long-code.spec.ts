import { createFixer } from '../../utils/test-utils';
import noLongCode from '../../../src/rules/no-long-code';

describe('test no-long-code', () => {
  const fixer = createFixer([{
    rule: noLongCode,
    options: {
      length: 50,
      exclude: ['plain']
    }
  }]);

  test('test no fix applied', () => {
    const md = [
      '```js',
      'console.log("this is a short line");',
      'console.log("with multiple lines");',
      '```'
    ].join('\n');

    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toBe(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('test fix applied', () => {
    const longCode = 'console.log("very long long long long long long long long long long long long long long long long long sentence");';
    const md = [
      '```js',
      longCode,
      '```'
    ].join('\n');

    const { lintResult } = fixer(md);
    const options = lintResult.ruleManager.getReportData().pop();

    // 精确校验 offset 落在对应代码行，而非仅断言为 number
    expect(options?.loc.start.offset).toBe(md.indexOf(longCode));
    expect(options?.loc.end.offset).toBe(md.indexOf(longCode) + longCode.length);
    expect(options?.loc).toEqual({
      end: expect.objectContaining({ column: 114, line: 2, offset: options?.loc.end.offset }),
      start: expect.objectContaining({ column: 1, line: 2, offset: options?.loc.start.offset })
    });
    // content 只应截取该行上下文，而非整篇文档
    expect(options?.content.length).toBeLessThan(md.length);
    expect(options?.content).toContain(longCode.slice(0, 20));
  });

  test('test fix applied with CRLF', () => {
    const longCode = 'console.log("very long long long long long long long long long long long long long long long long long sentence");';
    const md = [
      '```js',
      longCode,
      '```'
    ].join('\r\n');

    const { lintResult } = fixer(md);
    const options = lintResult.ruleManager.getReportData().pop();

    // CRLF 下 offset 仍应精确落在代码行（基于原始文档坐标）
    expect(options?.loc.start.offset).toBe(md.indexOf(longCode));
    expect(options?.loc.end.offset).toBe(md.indexOf(longCode) + longCode.length);
    expect(options?.content).toContain(longCode.slice(0, 20));
  });

  test('test fix applied with CRLF and preceding lines', () => {
    const longCode = 'console.log("very long long long long long long long long long long long long long long long long long sentence");';
    const md = [
      'some text before',
      '```js',
      longCode,
      '```'
    ].join('\r\n');

    const { lintResult } = fixer(md);
    const options = lintResult.ruleManager.getReportData().pop();

    // 代码块不在文档开头时，CRLF 下偏移也不能漂移
    expect(options?.loc.start.offset).toBe(md.indexOf(longCode));
    expect(options?.loc.end.offset).toBe(md.indexOf(longCode) + longCode.length);
  });

  test('test exclude option', () => {
    const longCode = 'console.log("very long long long long long long long long long long long long long long long long long sentence");';
    const md = [
      '```plain',
      longCode,
      '```'
    ].join('\n');
    const { lintResult } = fixer(md);

    const data = lintResult.ruleManager.getReportData();
    expect(data.length).toStrictEqual(0);
  });

  test('test lint error in lines more than one', () => {
    const md = [
      '```js',
      'console.log("this is a short line");',
      'console.log("code code code code code code code code");',
      'console.log("this is a short line");',
      'console.log("code code code code code code code code");',
      '```'
    ].join('\n');

    const { fixedResult, lintResult } = fixer(md);

    expect(fixedResult?.result).toStrictEqual(md);
    const longLine = 'console.log("code code code code code code code code");';
    const [r1, r2] = lintResult.ruleManager.getReportData();
    expect(r1.loc).toEqual({
      end: expect.objectContaining({ column: 55, line: 3, offset: expect.any(Number) }),
      start: expect.objectContaining({ column: 1, line: 3, offset: expect.any(Number) })
    });
    expect(r2.loc).toEqual({
      end: expect.objectContaining({ column: 55, line: 5, offset: expect.any(Number) }),
      start: expect.objectContaining({ column: 1, line: 5, offset: expect.any(Number) })
    });
    // 精确校验 offset 落在各自代码行
    expect(r1.loc.start.offset).toBe(md.indexOf(longLine));
    expect(r1.loc.end.offset).toBe(md.indexOf(longLine) + longLine.length);
    expect(r2.loc.start.offset).toBe(md.lastIndexOf(longLine));
    expect(r2.loc.end.offset).toBe(md.lastIndexOf(longLine) + longLine.length);
    // content 只应截取对应行上下文，而非整篇文档
    expect(r1.content.length).toBeLessThan(md.length);
    expect(r2.content.length).toBeLessThan(md.length);
  });

  test('test content does not degrade to whole document for large doc', () => {
    const longLine = 'x'.repeat(120);
    const codeLines = Array.from({ length: 5 }, () => longLine);
    // 构造 ~1000 行的文档，其中只有一个超长代码块
    const padding = Array.from({ length: 1000 }, (_, i) => `这是第 ${i} 行普通文本，用于撑大文档体积。`).join('\n');
    const md = [
      padding,
      '```js',
      ...codeLines,
      '```'
    ].join('\n');

    const { lintResult } = fixer(md);
    const data = lintResult.ruleManager.getReportData();

    expect(data.length).toBeGreaterThan(0);
    for (const item of data) {
      // content 应远小于全文（全文几千字符），只保留该行上下文
      expect(item.content.length).toBeLessThan(300);
      expect(item.content.length).toBeLessThan(md.length);
    }
    // 精确校验：每条报告的 offset 落在对应超长代码行，而非全文范围
    const firstLongLine = codeLines[0];
    const firstReport = data[0];
    expect(firstReport.loc.start.offset).toBe(md.indexOf(firstLongLine));
    expect(firstReport.loc.end.offset).toBe(md.indexOf(firstLongLine) + firstLongLine.length);
  });

  test('test indented code block', () => {
    const longCode = 'x'.repeat(120);
    const md = `    ${longCode}`;

    const { lintResult } = fixer(md);
    const [report] = lintResult.ruleManager.getReportData();

    // 缩进代码块无围栏：offset 应落在实际代码内容（跳过起始缩进）
    expect(report.loc.start.offset).toBe(md.indexOf(longCode));
    expect(report.loc.end.offset).toBe(md.indexOf(longCode) + longCode.length);
  });

  test('test unclosed fenced code block', () => {
    const longCode = 'x'.repeat(120);
    const md = ['```js', longCode].join('\n');

    const { lintResult } = fixer(md);
    const [report] = lintResult.ruleManager.getReportData();

    // EOF 未闭合围栏：最后一行是真实代码内容，不应被当成结尾围栏而漏报
    expect(report.loc.start.offset).toBe(md.indexOf(longCode));
    expect(report.loc.end.offset).toBe(md.indexOf(longCode) + longCode.length);
  });

  test('test multi-line indented code block', () => {
    const longCode = 'x'.repeat(120);
    const md = [
      '    short',
      `    ${longCode}`
    ].join('\n');

    const { lintResult } = fixer(md);
    const [report] = lintResult.ruleManager.getReportData();

    // 多行缩进代码块：offset 应落在实际代码内容（跳过起始缩进），非统一缩进也需准确
    expect(report.loc.start.offset).toBe(md.indexOf(longCode));
    expect(report.loc.end.offset).toBe(md.indexOf(longCode) + longCode.length);
  });

  test('test multi-line indented code block with uneven indent', () => {
    const longCode = 'x'.repeat(120);
    // parser 会保留第二行多出的缩进，value 行实际为 '    xxxx...'
    const valueLine = `    ${longCode}`;
    const md = [
      '    short',
      `        ${longCode}`
    ].join('\n');

    const { lintResult } = fixer(md);
    const [report] = lintResult.ruleManager.getReportData();

    // 缩进不一致时，offset/length 仍应精确对应真实代码内容
    expect(report.loc.start.offset).toBe(md.indexOf(valueLine));
    expect(report.loc.end.offset).toBe(md.indexOf(valueLine) + valueLine.length);
  });
});
