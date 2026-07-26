import { createFixer } from '../../utils/test-utils';
import spaceAroundNumber from '../../../src/rules/space-around-number';

const fixer = createFixer([{
  rule: spaceAroundNumber
}]);

// language=markdown
const markdownToCheck = `
33你好世界520 测试测试32123123
`;

// language=markdown
const fixedMarkdownToCheck = `
33 你好世界 520 测试测试 32123123
`;

describe('test space-around-number', () => {
  test('fix applied', () => {
    const { fixedResult, lintResult } = fixer(markdownToCheck);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(3);
    expect(fixedResult?.result).toStrictEqual(fixedMarkdownToCheck);
  });

  test('fix applied for percentage between chinese text', () => {
    const md = '100%测试 测试100%';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('100% 测试 测试 100%');
  });

  test('does not treat symbols as alphabet through this rule', () => {
    const md = 'C#教程 中文#标签';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
    expect(fixedResult?.result).toStrictEqual(md);
  });

  test('insert spaces outside a numeric character entity', () => {
    const md = '中&#49;文';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('中 &#49; 文');
  });

  test.each([
    ['𠀀123', '𠀀 123'],
    ['123𠀀', '123 𠀀'],
  ])('supports supplementary Han characters: "%s" → "%s"', (input, expectedFix) => {
    const { fixedResult, lintResult } = fixer(input);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual(expectedFix);
  });

  test('fixes 100% after supplementary Han', () => {
    const { fixedResult, lintResult } = fixer('𠀀100%测试');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('𠀀 100% 测试');
  });
});
