import { createFixer } from '../../utils/test-utils';
import spaceAroundAlphabet from '../../../src/rules/space-around-alphabet';

const fixer = createFixer([{
  rule: spaceAroundAlphabet
}]);

describe('test space-around-alphabet', () => {
  test('fix applied', () => {
    const content = '（有时称为 m\\-dots 或 m子域名）就是 - 托管在 website子域名中的的移动特定版本，通常是 `m` 子域名。';
    const { fixedResult, lintResult } = fixer(content);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('（有时称为 m-dots 或 m 子域名）就是 - 托管在 website 子域名中的的移动特定版本，通常是 `m` 子域名。');
  });

  test.each([
    ['中文abc', 1, '中文 abc'],
    ['abc中文', 1, 'abc 中文'],
  ])('%s → %i report, fix to "%s"', (input, expectedReports, expectedFix) => {
    const { lintResult, fixedResult } = fixer(input);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(expectedReports);
    expect(fixedResult?.result).toStrictEqual(expectedFix);
  });

  test.each([
    ['中文 abc'],
    ['abc 中文'],
    ['中文、abc'],
    ['中文。abc'],
    ['中文😀abc'],
  ])('"%s" does not report (already spaced or punctuation in between)', (input) => {
    const { lintResult } = fixer(input);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });
});
