import { createFixer } from '../../utils/test-utils';
import spaceAroundAlphabet from '../../../src/rules/space-around-alphabet';
import spaceAroundNumber from '../../../src/rules/space-around-number';

const fixer = createFixer([{
  rule: spaceAroundAlphabet
}]);

describe('test space-around-alphabet', () => {
  test('fix applied', () => {
    const content = '（有时称为 m\\-dots 或 m子域名）就是 - 托管在 website子域名中的的移动特定版本，通常是 `m` 子域名。';
    const { fixedResult, lintResult } = fixer(content);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('（有时称为 m\\-dots 或 m 子域名）就是 - 托管在 website 子域名中的的移动特定版本，通常是 `m` 子域名。');
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

  test.each([
    ['> 中文English\n> 后续内容', '> 中文 English\n> 后续内容'],
    ['- 中文English\n  后续内容', '- 中文 English\n  后续内容'],
    ['中文\\English中文', '中文\\English 中文'],
    ['中文&amp;English', '中文&amp;English'],
  ])('keeps Markdown syntax for "%s"', (input, expectedFix) => {
    const { fixedResult } = fixer(input);
    expect(fixedResult?.result).toStrictEqual(expectedFix);
  });

  test.each(['\n', '\r\n'])('fixes list continuation text with %p line endings', (lineEnding) => {
    const input = [
      '- Cache-Control：这是 English 内容',
      '  表示资源可以被缓存1小时。'
    ].join(lineEnding);
    const expectedFix = [
      '- Cache-Control：这是 English 内容',
      '  表示资源可以被缓存 1 小时。'
    ].join(lineEnding);
    const combinedFixer = createFixer([
      { rule: spaceAroundAlphabet },
      { rule: spaceAroundNumber }
    ]);

    const { fixedResult } = combinedFixer(input);
    expect(fixedResult?.result).toStrictEqual(expectedFix);
    expect(combinedFixer(fixedResult!.result).lintResult.ruleManager.getReportData()).toHaveLength(0);
  });
});
