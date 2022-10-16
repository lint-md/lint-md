import { createFixer } from '../../utils/test-utils';
import noEmptyList from '../../../src/rules/no-empty-list';

const fixer = createFixer([{
  rule: noEmptyList
}]);

describe('test no-empty-list', () => {
  test('fix applied for number list', () => {
    const md = '1. \n' +
      '2.';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult.result).toBe(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
  });

  test('fix applied for common list', () => {
    const md = '- \n' +
      '-         ';
    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult.result).toBe(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
  });
});
