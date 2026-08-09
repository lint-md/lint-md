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
    expect(lintResult.reports.length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('（有时称为 m\\-dots 或 m 子域名）就是 - 托管在 website 子域名中的的移动特定版本，通常是 `m` 子域名。');
  });

  test.each([
    ['中文abc', 1, '中文 abc'],
    ['abc中文', 1, 'abc 中文'],
    ['𠀀English', 1, '𠀀 English'],
    ['English𠀀', 1, 'English 𠀀'],
  ])('%s → %i report, fix to "%s"', (input, expectedReports, expectedFix) => {
    const { lintResult, fixedResult } = fixer(input);
    expect(lintResult.reports.length).toStrictEqual(expectedReports);
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
    expect(lintResult.reports.length).toStrictEqual(0);
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

  test.each(['\n', '\r\n'])(
    'preserves list continuation when alphabet and number fixes share a text node',
    (lineEnding) => {
      const input = [
        '- 中文English',
        '  表示资源可以被缓存1小时。'
      ].join(lineEnding);
      const expected = [
        '- 中文 English',
        '  表示资源可以被缓存 1 小时。'
      ].join(lineEnding);
      const combinedFixer = createFixer([
        { rule: spaceAroundAlphabet },
        { rule: spaceAroundNumber }
      ]);

      const first = combinedFixer(input);
      expect(first.fixedResult?.result).toBe(expected);
      expect(first.lintResult.reports.map(report => report.name))
        .toEqual(expect.arrayContaining([
          'space-around-alphabet',
          'space-around-number'
        ]));
      expect(combinedFixer(first.fixedResult!.result).lintResult.reports)
        .toHaveLength(0);
    }
  );

  test('preserves the complete Markdown from issue 103', () => {
    const input = [
      '- Cache-Control：这是最重要的缓存头部字段，它提供了关于如何缓存响应的指令。例如，`Cache-Control: max-age=3600` ',
      '  表示资源可以被缓存1小时。'
    ].join('\r\n');
    const expected = [
      '- Cache-Control：这是最重要的缓存头部字段，它提供了关于如何缓存响应的指令。例如，`Cache-Control: max-age=3600` ',
      '  表示资源可以被缓存 1 小时。'
    ].join('\r\n');
    const combinedFixer = createFixer([
      { rule: spaceAroundAlphabet },
      { rule: spaceAroundNumber }
    ]);

    expect(combinedFixer(input).fixedResult?.result).toBe(expected);
  });
});
