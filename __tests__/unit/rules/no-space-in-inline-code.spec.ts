import { createFixer } from '../../utils/test-utils';
import noSpaceInInlineCode from '../../../src/rules/no-space-in-inline-code';

const fixer = createFixer([{
  rule: noSpaceInInlineCode
}]);

describe('test no-space-in-inline-code', () => {
  test('fix applied (by ``)', () => {
    const md = '- right `      const a = 1     ` 你好';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toBe('- right `const a = 1` 你好');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });

  test('fix applied (by ``` ```)', () => {
    const md = '```  test  ```';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toStrictEqual('```test```');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
  });
});
