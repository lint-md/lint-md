import { createFixer } from '../../utils/test-utils';
import noSpaceInInlineCode from '../../../src/rules/no-space-in-inline-code';

const fixer = createFixer([{
  rule: noSpaceInInlineCode
}]);

describe('test no-space-in-inline-code', () => {
  test('no fix applied', () => {
    const md = '`const a = 0;`';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toBe(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('fix applied', () => {
    const md = '- right `const a = 1     ` 你好';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toBe('- right `const a = 1` 你好');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });
});
