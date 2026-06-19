import { createFixer } from '../../utils/test-utils';
import noFullWidthNumber from '../../../src/rules/no-full-width-number';

const fixer = createFixer([{
  rule: noFullWidthNumber
}]);

describe('test no-full-width-number', () => {
  test('fix applied', () => {
    const md = '> 这件蛋糕只卖 １０００ 元。\n这个 １０ 哈哈';

    const { fixedResult, lintResult } = fixer(md);
    expect(fixedResult?.result).toStrictEqual('> 这件蛋糕只卖 1000 元。\n这个 10 哈哈');
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
  });

  test('reports correct line for match on second line', () => {
    const md = '第一行\n第二行有１００';
    const { lintResult } = fixer(md);
    const reports = lintResult.ruleManager.getReportData();
    expect(reports.length).toStrictEqual(1);
    expect(reports[0].loc.start.line).toStrictEqual(2);
    expect(reports[0].loc.start.column).toStrictEqual(5);
  });

  test('reports correct line for match on third line', () => {
    const md = '第一行\n第二行\n第三行有１００';
    const { lintResult } = fixer(md);
    const reports = lintResult.ruleManager.getReportData();
    expect(reports.length).toStrictEqual(1);
    expect(reports[0].loc.start.line).toStrictEqual(3);
  });
});
