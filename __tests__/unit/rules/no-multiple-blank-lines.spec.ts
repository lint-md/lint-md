import { lintMarkdown } from '../../../src';
import noMultipleBlankLines from '../../../src/rules/no-multiple-blank-lines';
import {
  type LintMdRuleContext,
  RULE_SEVERITY,
  type RuleReportInput
} from '../../../src/types';
import { createFixer } from '../../utils/test-utils';

const fixer = createFixer([{
  rule: noMultipleBlankLines
}]);

const reportsForProtectedRange = (protectedRange: [number, number]) => {
  const source = '正文\n\n\n正文';
  const point = (offset: number) => ({ line: 1, column: offset + 1, offset });
  const ast = {
    type: 'root',
    children: [{
      type: 'code',
      value: '',
      position: {
        start: point(protectedRange[0]),
        end: point(protectedRange[1])
      }
    }],
    position: { start: point(0), end: point(source.length) }
  } as unknown as LintMdRuleContext['ast'];
  const reports: RuleReportInput[] = [];
  const selectors = noMultipleBlankLines.create({
    ast,
    markdown: source,
    options: {},
    report: report => reports.push(report),
    sourceCode: { text: source, ast } as LintMdRuleContext['sourceCode']
  });

  selectors.root(ast);
  return reports;
};

describe('no-multiple-blank-lines', () => {
  test('块之间只保留一个空白行', () => {
    const markdown = '第一段\n\n\n第二段';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe('第一段\n\n第二段');
    expect(lintResult.reports).toHaveLength(1);
  });

  test('处理不同类型块之间的多余空白行', () => {
    const markdown = '# 标题\n\n\n---\n\n\n- 项目\n\n\n> 引用';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result)
      .toBe('# 标题\n\n---\n\n- 项目\n\n> 引用');
    expect(lintResult.reports).toHaveLength(3);
  });

  test('空格和 Tab 组成的 CRLF 空白行也参与限制', () => {
    const markdown = '第一段\r\n \t\r\n\t\r\n第二段';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe('第一段\r\n\r\n第二段');
    expect(lintResult.reports).toHaveLength(1);
  });

  test('不修改围栏代码块内部的空白行', () => {
    const markdown = '```text\n第一行\n\n\n第二行\n```';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.reports).toHaveLength(0);
  });

  test('不修改缩进代码块内部的空白行', () => {
    const markdown = '    第一行\n\n\n    第二行';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.reports).toHaveLength(0);
  });

  test('不修改 YAML block scalar 内的空白行', () => {
    const markdown = [
      '---',
      'description: |-',
      '  第一段',
      '',
      '',
      '  第二段',
      '---'
    ].join('\n');
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.reports).toHaveLength(0);
  });

  test('删除 YAML 前导空行但保留 block scalar 空白行', () => {
    const markdown = [
      '',
      '---',
      'description: |-',
      '  第一段',
      '',
      '',
      '  第二段',
      '---'
    ].join('\n');
    const expected = [
      '---',
      'description: |-',
      '  第一段',
      '',
      '',
      '  第二段',
      '---'
    ].join('\n');

    expect(fixer(markdown).fixedResult?.result).toBe(expected);
  });

  test('不修改 pre HTML 内的空白行', () => {
    const markdown = '<pre>\n第一行\n\n\n第二行\n</pre>';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.reports).toHaveLength(0);
  });

  test('不修改数学块内的空白行', () => {
    const markdown = '$$\na\n\n\nb\n$$';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.reports).toHaveLength(0);
  });

  test('只修改多个受保护块之外的空白行', () => {
    const markdown = [
      '第一段',
      '',
      '',
      '第二段',
      '```text',
      '代码一',
      '',
      '',
      '代码二',
      '',
      '',
      '代码三',
      '```',
      '',
      '',
      '第三段',
      '<pre>',
      'HTML 一',
      '',
      '',
      'HTML 二',
      '</pre>',
      '',
      '',
      '第四段'
    ].join('\n');
    const expected = [
      '第一段',
      '',
      '第二段',
      '```text',
      '代码一',
      '',
      '',
      '代码二',
      '',
      '',
      '代码三',
      '```',
      '',
      '第三段',
      '<pre>',
      'HTML 一',
      '',
      '',
      'HTML 二',
      '</pre>',
      '',
      '第四段'
    ].join('\n');
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(expected);
    expect(lintResult.reports).toHaveLength(3);
  });

  test.each([
    ['候选区间结束于受保护区间起点', [5, 6], 1],
    ['候选区间开始于受保护区间终点', [0, 2], 1],
    ['候选区间跨入受保护区间', [4, 6], 0]
  ] as const)('%s', (_name, protectedRange, reportCount) => {
    expect(reportsForProtectedRange([...protectedRange])).toHaveLength(reportCount);
  });

  test('删除文档开头的空白行', () => {
    const markdown = '\n \t\n# 标题';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe('# 标题');
    expect(lintResult.reports).toHaveLength(1);
  });

  test('只包含空白行的文档修复为空文档', () => {
    const markdown = '\n \t\n';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe('');
    expect(lintResult.reports).toHaveLength(1);
  });

  test('无换行的纯空格文档修复为空文档', () => {
    const markdown = ' \t';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe('');
    expect(lintResult.reports).toHaveLength(1);
  });

  test('文档末尾最多保留一个换行', () => {
    const markdown = '正文\n \t\n\n';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe('正文\n');
    expect(lintResult.reports).toHaveLength(1);
  });

  test('删除末尾空白行中的空格和 Tab', () => {
    const markdown = '正文\n \t';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe('正文\n');
    expect(lintResult.reports).toHaveLength(1);
  });

  test('可以通过 Core 配置启用', () => {
    const result = lintMarkdown(
      '第一段\n\n\n第二段',
      { 'no-multiple-blank-lines': RULE_SEVERITY.ERROR },
      true
    );

    expect(result.fixedResult.result).toBe('第一段\n\n第二段');
    expect(result.fixableErrorCount).toBe(1);
  });

  test('默认关闭', () => {
    const result = lintMarkdown('第一段\n\n\n第二段', {}, false);

    expect(result.lintResult).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'no-multiple-blank-lines' })
      ])
    );
  });

  test.each([
    ['块之间只有一个空白行', '第一段\n\n第二段'],
    ['文档末尾只有一个换行', '正文\n'],
    ['文档末尾没有换行', '正文']
  ])('%s 时不修改', (_name, markdown) => {
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.reports).toHaveLength(0);
  });
});
