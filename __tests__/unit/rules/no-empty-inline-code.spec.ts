import { createFixer } from '../../utils/test-utils';
import noEmptyInlineCode from '../../../src/rules/no-empty-inline-code';

const fixer = createFixer([{
  rule: noEmptyInlineCode
}]);

describe('test no-empty-inline-code', () => {
  test('no fix applied', () => {
    const md = '`const a = 0;`';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toBe(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('fix applied', () => {
    const md = '- right ` ` 你好';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toBe('- right  你好');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });

  test('fix convergence (fix 后再 lint 无报告)', () => {
    const md = '文本 ` ` 和 `  ` 更多';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.notAppliedFixes).toStrictEqual([]);
    const recheck = fixer(fixedResult?.result || '');
    expect(recheck.lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });
});
