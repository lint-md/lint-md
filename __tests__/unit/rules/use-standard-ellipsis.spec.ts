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
});
