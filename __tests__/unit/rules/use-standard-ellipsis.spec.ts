import { createFixer } from '../../utils/test-utils';
import useStandardEllipsis from '../../../src/rules/use-standard-ellipsis';

const fixer = createFixer([{
  rule: useStandardEllipsis
}]);

describe('test use-standard-ellipsis', () => {
  test('fix .... case', () => {
    const md = 'hello world....';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('hello world……');
  });

  test('fix … case', () => {
    const md = 'hello world…';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('hello world……');
  });

  test('report invalid ellipsis after valid ellipsis', () => {
    const md = '前言……他说…';
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(1);
    expect(fixedResult?.result).toStrictEqual('前言……他说……');
  });

  test('fix long md', () => {
    const md = `
1. hello world....
2. hello world........
    `;
    const { fixedResult, lintResult } = fixer(md);
    expect(lintResult.ruleManager.getReportData().length).toStrictEqual(2);
    expect(fixedResult?.result).toStrictEqual(`
1. hello world……
2. hello world……
    `);
  });

  test('reports correct line for match on second line', () => {
    const md = '第一行\n第二行....';
    const { lintResult } = fixer(md);
    const reports = lintResult.ruleManager.getReportData();
    expect(reports.length).toStrictEqual(1);
    expect(reports[0].loc.start.line).toStrictEqual(2);
    expect(reports[0].loc.start.column).toStrictEqual(4);
  });

  test('reports correct line for match on third line', () => {
    const md = '第一行\n第二行\n第三行………';
    const { lintResult } = fixer(md);
    const reports = lintResult.ruleManager.getReportData();
    expect(reports.length).toStrictEqual(1);
    expect(reports[0].loc.start.line).toStrictEqual(3);
  });
});
