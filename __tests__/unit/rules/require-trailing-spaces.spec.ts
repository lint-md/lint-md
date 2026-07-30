import { lintMarkdown } from '../../../src';
import { RULE_SEVERITY } from '../../../src/types';
import { requireTrailingSpaces } from '../../../src/rules';
import { createFixer } from '../../utils/test-utils';

const fixer = createFixer([{
  rule: requireTrailingSpaces
}]);

describe('require-trailing-spaces', () => {
  test.each([
    ['缺少空格', '第一行\n第二行', '第一行  \n第二行', 1],
    ['已有一个空格', '第一行 \n第二行', '第一行  \n第二行', 1],
    ['多个软换行', '一\n二\n三', '一  \n二  \n三', 2],
    ['CRLF 换行', '第一行\r\n第二行', '第一行  \r\n第二行', 1],
    ['引用块', '> 第一行\n> 第二行', '> 第一行  \n> 第二行', 1],
    ['连续链接', '[一](one)\n[二](two)', '[一](one)  \n[二](two)', 1]
  ])('%s', (_name, markdown, expected, reportCount) => {
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(expected);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(reportCount);
  });

  test.each([
    ['已有两个空格', '第一行  \n第二行'],
    ['使用反斜杠换行', '第一行\\\n第二行'],
    ['没有软换行', '只有一行'],
    ['代码块内换行', '```\n第一行\n第二行\n```']
  ])('%s 时不报告', (_name, markdown) => {
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(0);
  });

  test('默认关闭', () => {
    const result = lintMarkdown('第一行\n第二行', {}, false);

    expect(result.lintResult).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'require-trailing-spaces' })
      ])
    );
  });

  test('可以通过配置启用', () => {
    const result = lintMarkdown(
      '第一行\n第二行',
      { 'require-trailing-spaces': RULE_SEVERITY.ERROR },
      true
    );

    expect(result.fixedResult.result).toBe('第一行  \n第二行');
    expect(result.fixableErrorCount).toBe(1);
  });
});
