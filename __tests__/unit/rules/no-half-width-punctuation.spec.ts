import { createFixer } from '../../utils/test-utils';
import noHalfWidthPunctuation from '../../../src/rules/no-half-width-punctuation';

const fixer = createFixer([{
  rule: noHalfWidthPunctuation
}]);

describe('test no-half-width-punctuation', () => {
  test('fix half-width comma and period in Chinese', () => {
    const md = '这是一个很好的东西,我很喜欢.';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('这是一个很好的东西，我很喜欢。');
  });

  test('no false positive in English text', () => {
    const md = 'hello world, ok.';
    const { lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('no false positive in numbers', () => {
    const md = 'version 1.0';
    const { lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('fix mixed half-width punctuation', () => {
    const md = 'price是9.99元,很不错!但还需要优化.';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(3);
    expect(fixedResult?.result).toStrictEqual('price是9.99元，很不错！但还需要优化。');
  });

  test('fix half-width parentheses in Chinese', () => {
    const md = '这是一个测试(test)例子';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('这是一个测试（test）例子');
  });

  test('fix semicolon and colon in Chinese', () => {
    const md = '需要注意以下几点:第一;第二;第三.';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(4);
    expect(fixedResult?.result).toStrictEqual('需要注意以下几点：第一；第二；第三。');
  });

  test('fix multiple occurrences', () => {
    const md = '你好,世界!这是测试.';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(3);
    expect(fixedResult?.result).toStrictEqual('你好，世界！这是测试。');
  });
});
