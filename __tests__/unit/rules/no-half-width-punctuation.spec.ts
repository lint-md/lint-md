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

  test('fix half-width parentheses at end of sentence', () => {
    const md = '这是一个测试(test)';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('这是一个测试（test）');
  });

  test('fix half-width parentheses with spaces', () => {
    const md = '这是一个测试 (test) 例子';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('这是一个测试 （test） 例子');
  });

  test('report location is correct across newline', () => {
    const md = '第一行,\n第二行.';
    const { lintResult } = fixer(md);
    const reports = lintResult.ruleManager.getReportData();
    expect(reports).toHaveLength(2);
    expect(reports[0]?.loc?.start).toEqual(expect.objectContaining({ line: 1, column: 4 }));
    expect(reports[1]?.loc?.start).toEqual(expect.objectContaining({ line: 2, column: 4 }));
  });

  test('fix unmatched opening parenthesis adjacent to Chinese', () => {
    const md = '这是测试(test';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('这是测试（test');
  });

  test('fix unmatched closing parenthesis adjacent to Chinese', () => {
    const md = 'test)例子';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('test）例子');
  });

  test('fix parenthesis with tab between Chinese and parenthesis', () => {
    const md = '这是测试\t(test)';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('这是测试\t（test）');
  });

  test('fix parenthesis with full-width space between Chinese and parenthesis', () => {
    const md = '这是测试\u3000(test)';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('这是测试\u3000（test）');
  });

  test('no false positive for parenthesis after newline', () => {
    const md = '这是测试\n(test)';
    const { lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('no false positive for English parenthesis near English', () => {
    const md = 'Use function(test) here.';
    const { lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('fix mixed full-width/half-width parentheses with escaped backslash in text (issue #155)', () => {
    const md = '在 DOM 检查器中按下 ctrl + \\\\(（(Chrome/Window）) 可以随时暂停 JS 的执行。这样您就可以检查 DOM 的快照，而不必担心 JS 会改变 DOM 或事件（如鼠标悬停）会导致 DOM 从您脚下发生变化。';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('在 DOM 检查器中按下 ctrl + \\\\(（（Chrome/Window）） 可以随时暂停 JS 的执行。这样您就可以检查 DOM 的快照，而不必担心 JS 会改变 DOM 或事件（如鼠标悬停）会导致 DOM 从您脚下发生变化。');
    const { lintResult: after } = fixer(fixedResult!.result);
    expect(after.ruleManager.getReportData().length).toStrictEqual(0);
  });

  test('fix ASCII parentheses adjacent to HTML entity in text', () => {
    const md = '价格&amp;(test)很不错';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('价格&amp;（test）很不错');
  });

  test('fix ASCII parentheses after multiple different HTML entities', () => {
    const md = '甲&amp;乙&lt;(test)中文';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('甲&amp;乙&lt;（test）中文');
  });

  test('fix ASCII parentheses after an HTML entity that decodes to two UTF-16 code units', () => {
    const md = '甲&Afr;(test)中文';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('甲&Afr;（test）中文');
  });

  test('replace the complete escaped parenthesis source', () => {
    const md = '中文\\(test\\)中文';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('中文（test）中文');
  });

  test('replace the complete parenthesis entity source', () => {
    const md = '中文&#40;test&#41;中文';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual('中文（test）中文');
  });

  test.each(['&copy', '&amp'])('keep non-terminated entity-like text aligned: %s', entity => {
    const md = `中文${entity}(test)中文`;
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual(`中文${entity}（test）中文`);
  });

  test.each([
    '<https://example.com/?a&amp;b>',
    'www.example.com/?a&amp;b'
  ])('does not reinterpret entities inside an autolink: %s', md => {
    const { executionErrors, lintResult } = fixer(md);
    expect(executionErrors).toHaveLength(0);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(0);
  });

  test.each([
    '&#00000049;',
    '&#x0000028;'
  ])('keeps overlong numeric entity-like text aligned: %s', entity => {
    const md = `中文${entity}(test)中文`;
    const { executionErrors, fixedResult, lintResult } = fixer(md);
    expect(executionErrors).toHaveLength(0);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(2);
    expect(fixedResult?.result).toStrictEqual(`中文${entity}（test）中文`);
  });

  test.each([
    '&#0;',
    '&#11;',
    '&#127;',
    '&#128;',
    '&#xFDD0;',
    '&#xFFFF;'
  ])('aligns numeric entities normalized to replacement character: %s', entity => {
    const md = `中文${entity}(test)中文`;
    const { executionErrors, fixedResult, lintResult } = fixer(md);
    expect(executionErrors).toHaveLength(0);
    expect(lintResult.ruleManager.getReportData()).toHaveLength(2);
    expect(fixedResult?.result).toStrictEqual(`中文${entity}（test）中文`);
  });
});
