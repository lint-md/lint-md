import noEmptyCode from '../../../src/rules/no-empty-code';
import { createFixer } from '../../utils/test-utils';

const fixer = createFixer([{
  rule: noEmptyCode
}]);

describe('test no-empty-code', () => {
  test('no fix applied', () => {
    const md = ' - right\n```js\n const a = 1;\n```\n你好\n';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toBe(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('fix applied', () => {
    const md = ' - right\n```js\n\n```\n你好\n';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toBe(' - right\n\n你好\n');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });

  test('fix convergence (fix 后再 lint 无报告)', () => {
    const md = '```js\n\n```\n\n```\n\n```';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.notAppliedFixes).toStrictEqual([]);
    const recheck = fixer(fixedResult?.result || '');
    expect(recheck.lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });
});
