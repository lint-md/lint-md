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
});
