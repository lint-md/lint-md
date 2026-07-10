import { createRuleManager } from '../../../src/utils/rule-manager';

describe('test rule-manager report content fallback', () => {
  test('report with offset slices only the reported range', () => {
    const markdown = 'line1\nline2\nline3';
    const manager = createRuleManager(markdown);
    const context = manager.createRuleContext(
      { rule: { meta: { name: 'demo' }, create: () => ({}) } as any, options: {} },
      { ast: {} as any, markdown }
    );

    context.report({
      loc: {
        start: { line: 2, column: 1, offset: 6 },
        end: { line: 2, column: 5, offset: 10 }
      },
      message: 'demo'
    });

    const [report] = manager.getReportData();
    // 仅包含第 2 行（line2）的上下文，而非整篇文档
    expect(report.content).toContain('line2');
    expect(report.content.length).toBeLessThan(markdown.length);
  });

  test('report without offset falls back to line/column, not whole doc', () => {
    const markdown = 'aaaa\nbbbb\ncccc\ndddd';
    const manager = createRuleManager(markdown);
    const context = manager.createRuleContext(
      { rule: { meta: { name: 'demo' }, create: () => ({}) } as any, options: {} },
      { ast: {} as any, markdown }
    );

    context.report({
      loc: {
        start: { line: 3, column: 2 },
        end: { line: 3, column: 4 }
      },
      message: 'demo'
    });

    const [report] = manager.getReportData();
    expect(report.content).toContain('ccc');
    expect(report.content.length).toBeLessThan(markdown.length);
    // 不应包含首尾无关行
    expect(report.content).not.toContain('aaaa');
    expect(report.content).not.toContain('dddd');
  });
});
