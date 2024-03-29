import { createFixer } from '../../utils/test-utils';
import noSpecialCharacters from '../../../src/rules/no-special-characters';

const fixer = createFixer([{
  rule: noSpecialCharacters
}]);

describe('test no-special-characters', () => {
  test('fix applied', () => {
    const md = 'hello wo rld, before here has a \\b.';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('hello world, before here has a \\b.');
  });
});
