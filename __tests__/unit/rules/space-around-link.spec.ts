import { lintMarkdown } from '../../../src';
import { RULE_SEVERITY } from '../../../src/types';
import spaceAroundLink from '../../../src/rules/space-around-link';
import { createFixer } from '../../utils/test-utils';

const fixer = createFixer([{
  rule: spaceAroundLink
}]);

describe('space-around-link', () => {
  test('在链接与正文之间添加空格', () => {
    const markdown = '查看[文档](https://example.com)内容';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe('查看 [文档](https://example.com) 内容');
    expect(lintResult.ruleManager.getReportData()).toHaveLength(2);
  });

  test('全角标点与链接之间不添加空格', () => {
    const markdown = '查看：[文档](https://example.com)。';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(0);
  });

  test('ASCII 标点与链接之间不添加空格', () => {
    const markdown = '查看,[文档](https://example.com).';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(0);
  });

  test('独立图片不属于链接空格规则', () => {
    const markdown = '正文![图片](image.png)内容';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(0);
  });

  test('连续链接之间只添加一个空格', () => {
    const markdown = '[文档一](one)[文档二](two)';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe('[文档一](one) [文档二](two)');
    expect(lintResult.ruleManager.getReportData()).toHaveLength(1);
  });

  test('链接图片按外层链接处理', () => {
    const markdown = '查看[![图片](image.png)](https://example.com)内容';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result)
      .toBe('查看 [![图片](image.png)](https://example.com) 内容');
    expect(lintResult.ruleManager.getReportData()).toHaveLength(2);
  });

  test('格式包装外添加链接空格', () => {
    const markdown = '查看**[文档](https://example.com)**内容';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result)
      .toBe('查看 **[文档](https://example.com)** 内容');
    expect(lintResult.ruleManager.getReportData()).toHaveLength(2);
  });

  test('相邻格式内容视为正文', () => {
    const markdown = '**查看**[文档](https://example.com)内容';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result)
      .toBe('**查看** [文档](https://example.com) 内容');
    expect(lintResult.ruleManager.getReportData()).toHaveLength(2);
  });

  test('可以通过 Core 配置启用', () => {
    const result = lintMarkdown(
      '查看[文档](https://example.com)内容',
      { 'space-around-link': RULE_SEVERITY.ERROR },
      true
    );

    expect(result.fixedResult.result)
      .toBe('查看 [文档](https://example.com) 内容');
    expect(result.fixableErrorCount).toBe(2);
  });

  test('默认关闭', () => {
    const result = lintMarkdown(
      '查看[文档](https://example.com)内容',
      {},
      false
    );

    expect(result.lintResult).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'space-around-link' })
      ])
    );
  });

  test('已有空白时不修改', () => {
    const markdown = '查看 \t[文档](https://example.com)  内容';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(0);
  });

  test('行首、行末和块边界不添加空格', () => {
    const markdown = '[文档一](one)\n\n[文档二](two)';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(0);
  });

  test('自动链接按链接处理', () => {
    const markdown = '查看<https://example.com>内容';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe('查看 <https://example.com> 内容');
    expect(lintResult.ruleManager.getReportData()).toHaveLength(2);
  });

  test('引用链接按链接处理', () => {
    const markdown = '查看[文档][docs]内容\n\n[docs]: https://example.com';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result)
      .toBe('查看 [文档][docs] 内容\n\n[docs]: https://example.com');
    expect(lintResult.ruleManager.getReportData()).toHaveLength(2);
  });

  test('单词内的下划线不是格式包装', () => {
    const markdown = 'foo_[文档](https://example.com)_bar';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(0);
  });

  test('格式包装内的标点仍然豁免', () => {
    const markdown = '**查看：**[文档](https://example.com)**。**';
    const { fixedResult, lintResult } = fixer(markdown);

    expect(fixedResult?.result).toBe(markdown);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(0);
  });
});
