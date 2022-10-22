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
});
